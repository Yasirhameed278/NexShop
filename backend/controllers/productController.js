const Product = require('../models/Product');
const { uploadToCloudinary } = require('../middleware/upload');

exports.getProducts = async (req, res) => {
  const {
    keyword, category, brand, minPrice, maxPrice,
    rating, sort, page = 1, limit = 12, featured,
  } = req.query;

  const query = { isActive: true };

  if (keyword) query.$text = { $search: keyword };
  if (category) query.category = { $regex: category, $options: 'i' };
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (rating) query.rating = { $gte: Number(rating) };
  if (featured === 'true') query.isFeatured = true;

  const sortOptions = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
    popular: { soldCount: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).sort(sortBy).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('reviews.user', 'name avatar');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.viewCount += 1;
  await product.save();
  res.json(product);
};

exports.getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('reviews.user', 'name avatar');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.viewCount += 1;
  await product.save();
  res.json(product);
};

exports.createProduct = async (req, res) => {
  const data = req.body;
  // Handle image uploads
  if (req.files && req.files.length > 0) {
    const urls = await Promise.all(req.files.map((f) => uploadToCloudinary(f.path, 'products')));
    data.images = urls;
    data.thumbnail = urls[0];
  }
  if (typeof data.tags === 'string') data.tags = data.tags.split(',').map((t) => t.trim());
  if (typeof data.seoKeywords === 'string') data.seoKeywords = data.seoKeywords.split(',').map((t) => t.trim());
  const product = await Product.create(data);
  res.status(201).json(product);
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const data = req.body;
  if (req.files && req.files.length > 0) {
    const urls = await Promise.all(req.files.map((f) => uploadToCloudinary(f.path, 'products')));
    data.images = [...(product.images || []), ...urls];
    data.thumbnail = data.images[0];
  }
  if (typeof data.tags === 'string') data.tags = data.tags.split(',').map((t) => t.trim());
  if (typeof data.seoKeywords === 'string') data.seoKeywords = data.seoKeywords.split(',').map((t) => t.trim());

  Object.assign(product, data);
  await product.save();
  res.json(product);
};

exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.isActive = false; // Soft delete
  await product.save();
  res.json({ message: 'Product removed' });
};

exports.createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const alreadyReviewed = product.reviews.find((r) => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) return res.status(400).json({ message: 'Already reviewed' });

  product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  product.updateRating();
  await product.save();
  res.status(201).json({ message: 'Review added' });
};

exports.getCategories = async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  const brands = await Product.distinct('brand', { isActive: true });
  res.json({ categories, brands });
};

exports.getRelatedProducts = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(8);
  res.json(related);
};
