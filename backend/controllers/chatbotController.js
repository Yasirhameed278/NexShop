const Anthropic = require('@anthropic-ai/sdk');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ShopBot, a friendly AI shopping assistant for NexShop, an online e-commerce store.

You have tools to search products, track orders, manage carts, and give recommendations. Use them whenever the user's request requires real data.

Store policies (answer directly without tools):
- Shipping: Standard 3–7 business days, Express 1–2 days. Free shipping on orders over $100.
- Returns: 30-day window. Items must be unused in original packaging. Refunds in 5–7 business days.
- Payment: Visa, Mastercard, American Express, PayPal. 256-bit SSL secured.
- Coupons: SAVE10 (10% off), SAVE20 (20% off), FREESHIP (free shipping). Apply at checkout.

Guidelines:
- Be concise, warm, and helpful — keep responses brief
- Always use real data from tools — never invent product names or prices
- If a user is not logged in, politely let them know cart/order features require sign-in
- When listing products, include name and price
- Understand natural phrasing like "most popular", "highest clicks", "cheapest", "best rated", etc.`;

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_products',
    description:
      'Search the product catalog. Use for any product discovery: keywords, filters (price, category, rating, brand), or sorting (trending/popular, most viewed, price, rating). Supports natural language like "most popular shoes" or "cheapest electronics".',
    input_schema: {
      type: 'object',
      properties: {
        keywords: { type: 'string', description: 'Search terms — product type, name, use-case, etc.' },
        category: { type: 'string', description: 'Category filter e.g. electronics, clothing, shoes, sports' },
        minPrice: { type: 'number', description: 'Minimum price in USD' },
        maxPrice: { type: 'number', description: 'Maximum price in USD' },
        minRating: { type: 'number', description: 'Minimum star rating (1–5)' },
        brand: { type: 'string', description: 'Brand name filter' },
        sort: {
          type: 'string',
          enum: ['trending', 'most_viewed', 'price_asc', 'price_desc', 'rating'],
          description: 'trending=soldCount, most_viewed=viewCount, price_asc/desc, rating=stars',
        },
      },
    },
  },
  {
    name: 'get_recommendations',
    description:
      'Get personalised product recommendations based on the user\'s purchase history, current cart, or global trending items.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_order_status',
    description: "Get status of the user's most recent order or a specific order by order number.",
    input_schema: {
      type: 'object',
      properties: {
        orderNumber: { type: 'string', description: 'Specific order number like ORD-12345 (optional)' },
      },
    },
  },
  {
    name: 'view_cart',
    description: "View the user's current shopping cart contents and total.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'add_to_cart',
    description:
      "Add a product to the user's cart. Prefer productId if it was shown in a previous search. Otherwise search by name.",
    input_schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'MongoDB product _id (use when known from prior search)' },
        productName: { type: 'string', description: 'Product name to search for when ID is not known' },
        quantity: { type: 'number', description: 'Quantity to add (default 1)' },
      },
    },
  },
  {
    name: 'remove_from_cart',
    description: "Remove a product from the user's cart by name.",
    input_schema: {
      type: 'object',
      properties: {
        productName: { type: 'string', description: 'Name (or partial name) of the product to remove' },
      },
      required: ['productName'],
    },
  },
];

// ─── Tool Implementations ─────────────────────────────────────────────────────

async function toolSearchProducts(input) {
  const { keywords, category, minPrice, maxPrice, minRating, brand, sort } = input;
  const query = { isActive: true };

  if (maxPrice !== undefined) query.price = { ...query.price, $lte: maxPrice };
  if (minPrice !== undefined) query.price = { ...query.price, $gte: minPrice };
  if (minRating !== undefined) query.rating = { $gte: minRating };
  if (category) query.category = { $regex: category, $options: 'i' };
  if (brand) query.brand = { $regex: brand, $options: 'i' };

  let sortQuery = { soldCount: -1, rating: -1 };
  if (sort === 'most_viewed') sortQuery = { viewCount: -1 };
  else if (sort === 'price_asc') sortQuery = { price: 1 };
  else if (sort === 'price_desc') sortQuery = { price: -1 };
  else if (sort === 'rating') sortQuery = { rating: -1 };

  let products = [];

  // 1. MongoDB text index search
  if (keywords) {
    try {
      products = await Product.find({ ...query, $text: { $search: keywords } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(8)
        .select('_id name price thumbnail rating category brand stock viewCount soldCount');
    } catch (_) {}
  }

  // 2. Regex fallback
  if (products.length === 0 && keywords) {
    const terms = keywords.split(/\s+/).filter(Boolean);
    const orConds = terms.flatMap((t) => [
      { name: { $regex: t, $options: 'i' } },
      { brand: { $regex: t, $options: 'i' } },
      { tags: { $regex: t, $options: 'i' } },
      { category: { $regex: t, $options: 'i' } },
    ]);
    products = await Product.find({ ...query, $or: orConds })
      .sort(sortQuery)
      .limit(8)
      .select('_id name price thumbnail rating category brand stock viewCount soldCount');
  }

  // 3. Filter-only fallback
  if (products.length === 0) {
    products = await Product.find(query)
      .sort(sortQuery)
      .limit(8)
      .select('_id name price thumbnail rating category brand stock viewCount soldCount');
  }

  return {
    count: products.length,
    products: products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      price: Number(p.price.toFixed(2)),
      rating: p.rating,
      category: p.category,
      brand: p.brand,
      thumbnail: p.thumbnail,
      inStock: p.stock > 0,
      views: p.viewCount || 0,
      sold: p.soldCount || 0,
    })),
  };
}

async function getCopurchased(productIds) {
  if (!productIds?.length) return [];
  const relatedOrders = await Order.find({ 'items.product': { $in: productIds } })
    .limit(30)
    .select('items.product');
  const counts = {};
  const exclude = new Set(productIds.map(String));
  relatedOrders.forEach((o) =>
    o.items.forEach((item) => {
      const id = item.product.toString();
      if (!exclude.has(id)) counts[id] = (counts[id] || 0) + 1;
    })
  );
  const topIds = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([id]) => id);
  if (!topIds.length) return [];
  return Product.find({ _id: { $in: topIds }, isActive: true }).select(
    '_id name price thumbnail rating category'
  );
}

async function toolGetRecommendations(userId) {
  let products = [];
  let label = 'trending products';

  if (userId) {
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
    if (orders.length > 0) {
      const purchasedIds = orders.flatMap((o) => o.items.map((i) => i.product));
      products = await getCopurchased(purchasedIds);
      if (products.length > 0) label = 'products customers like you also loved';
    }

    if (products.length === 0) {
      const user = await User.findById(userId).populate('cart.product', '_id');
      const cartIds = (user?.cart || []).map((i) => i.product?._id).filter(Boolean);
      if (cartIds.length > 0) {
        products = await getCopurchased(cartIds);
        if (products.length > 0) label = 'customers also bought';
      }
    }
  }

  if (products.length === 0) {
    products = await Product.find({ isActive: true })
      .sort({ soldCount: -1, rating: -1 })
      .limit(6)
      .select('_id name price thumbnail rating category');
    label = 'trending products';
  }

  return {
    label,
    count: products.length,
    products: products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      price: Number(p.price.toFixed(2)),
      rating: p.rating,
      category: p.category,
      thumbnail: p.thumbnail,
    })),
  };
}

async function toolGetOrderStatus(input, userId) {
  if (!userId) return { error: 'User must be logged in to track orders.' };

  let order;
  if (input.orderNumber) {
    order = await Order.findOne({
      user: userId,
      orderNumber: { $regex: input.orderNumber, $options: 'i' },
    });
  }
  if (!order) order = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
  if (!order) return { error: 'No orders found on this account.' };

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    totalPrice: Number(order.totalPrice.toFixed(2)),
    trackingNumber: order.trackingNumber || null,
    estimatedDelivery: order.estimatedDelivery
      ? new Date(order.estimatedDelivery).toLocaleDateString()
      : null,
    trackingHistory: (order.trackingHistory || []).slice(-4).map((ev) => ({
      status: ev.status,
      description: ev.description,
      date: new Date(ev.timestamp).toLocaleDateString(),
    })),
  };
}

async function toolViewCart(userId) {
  if (!userId) return { error: 'User must be logged in to view cart.' };
  const user = await User.findById(userId).populate({
    path: 'cart.product',
    select: 'name price thumbnail isActive stock',
  });
  const active = (user?.cart || []).filter((i) => i.product?.isActive);
  if (active.length === 0) return { itemCount: 0, items: [], total: 0, message: 'Cart is empty.' };

  const total = active.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  return {
    itemCount: active.length,
    items: active.map((i) => ({
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      subtotal: Number((i.product.price * i.quantity).toFixed(2)),
    })),
    total: Number(total.toFixed(2)),
    freeShippingRemaining: total >= 100 ? 0 : Number((100 - total).toFixed(2)),
  };
}

async function toolAddToCart(input, userId) {
  if (!userId) return { error: 'User must be logged in to add to cart.', requiresAuth: true };

  let product;
  if (input.productId) {
    product = await Product.findOne({ _id: input.productId, isActive: true, stock: { $gt: 0 } });
  }
  if (!product && input.productName) {
    const candidates = await Product.find({
      name: { $regex: input.productName, $options: 'i' },
      isActive: true,
      stock: { $gt: 0 },
    }).limit(1);
    product = candidates[0];
  }
  if (!product)
    return { error: `Could not find "${input.productName || input.productId}" in stock.` };

  const qty = Math.max(1, Math.floor(input.quantity || 1));
  const user = await User.findById(userId);
  const existIdx = user.cart.findIndex((i) => i.product.toString() === product._id.toString());
  if (existIdx >= 0) {
    user.cart[existIdx].quantity = Math.min(user.cart[existIdx].quantity + qty, product.stock);
  } else {
    user.cart.push({ product: product._id, quantity: qty });
  }
  await user.save();

  return { success: true, productName: product.name, price: product.price, quantityAdded: qty };
}

async function toolRemoveFromCart(input, userId) {
  if (!userId) return { error: 'User must be logged in to manage cart.', requiresAuth: true };

  const user = await User.findById(userId).populate('cart.product', 'name');
  const idx = user.cart.findIndex((i) =>
    i.product?.name?.toLowerCase().includes(input.productName.toLowerCase())
  );
  if (idx === -1) return { error: `"${input.productName}" not found in cart.` };

  const removedName = user.cart[idx].product.name;
  user.cart.splice(idx, 1);
  await user.save();
  return { success: true, removedProduct: removedName };
}

async function executeTool(name, input, userId) {
  try {
    switch (name) {
      case 'search_products':    return await toolSearchProducts(input);
      case 'get_recommendations':return await toolGetRecommendations(userId);
      case 'get_order_status':   return await toolGetOrderStatus(input, userId);
      case 'view_cart':          return await toolViewCart(userId);
      case 'add_to_cart':        return await toolAddToCart(input, userId);
      case 'remove_from_cart':   return await toolRemoveFromCart(input, userId);
      default:                   return { error: 'Unknown tool' };
    }
  } catch (err) {
    return { error: err.message };
  }
}

// ─── Main Chat Handler ─────────────────────────────────────────────────────────

exports.chat = async (req, res) => {
  const { message, history = [] } = req.body;
  const userId = req.user?._id;

  if (!message?.trim()) {
    return res.status(400).json({ reply: 'Please type a message.', suggestedProducts: [] });
  }

  // Build message array — last 8 turns for context, then the new user message
  const messages = [
    ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message.trim() },
  ];

  let suggestedProducts = [];
  let cartUpdated = false;

  try {
    // Agentic loop — Claude may call multiple tools before producing a final text response
    while (true) {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      // Collect any tool calls in this turn
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

      if (toolUseBlocks.length === 0) {
        // No tool calls — extract text and return
        const textBlock = response.content.find((b) => b.type === 'text');
        const reply = textBlock?.text?.trim() || "I'm sorry, I couldn't process that. Please try again.";
        return res.json({ reply, suggestedProducts, cartUpdated });
      }

      // Execute all tool calls in this turn
      const toolResults = [];
      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input, userId);

        // Track side effects
        if ((block.name === 'add_to_cart' || block.name === 'remove_from_cart') && result.success) {
          cartUpdated = true;
        }

        // Collect product cards for the UI
        if (
          (block.name === 'search_products' || block.name === 'get_recommendations') &&
          result.products?.length
        ) {
          suggestedProducts = result.products.slice(0, 3).map((p) => ({
            _id: p.id,
            name: p.name,
            price: p.price,
            thumbnail: p.thumbnail,
            rating: p.rating,
            category: p.category,
          }));
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      // Append assistant turn + tool results and loop
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      reply: "I'm having a little trouble right now. Please try again in a moment!",
      suggestedProducts: [],
    });
  }
};

// ─── Quick Search (Autocomplete) ──────────────────────────────────────────────

exports.quickSearch = async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) return res.json([]);

  const products = await Product.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { brand: { $regex: query, $options: 'i' } },
    ],
    isActive: true,
  })
    .select('name price thumbnail category rating')
    .limit(6);

  res.json(products);
};
