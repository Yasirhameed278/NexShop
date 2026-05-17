const User = require('../models/User');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'cart.product',
    select: 'name price comparePrice thumbnail stock isActive',
  });
  // Filter out inactive products
  const cart = user.cart.filter((item) => item.product && item.product.isActive);
  res.json(cart);
};

exports.addToCart = async (req, res) => {
  const { productId, quantity = 1, variant = '' } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

  const user = await User.findById(req.user._id);
  const existingIndex = user.cart.findIndex(
    (item) => item.product.toString() === productId && item.variant === variant
  );

  if (existingIndex >= 0) {
    user.cart[existingIndex].quantity = Math.min(user.cart[existingIndex].quantity + quantity, product.stock);
  } else {
    user.cart.push({ product: productId, quantity, variant });
  }
  await user.save();

  const populated = await User.findById(req.user._id).populate({
    path: 'cart.product',
    select: 'name price comparePrice thumbnail stock',
  });
  res.json(populated.cart);
};

exports.updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const user = await User.findById(req.user._id);
  const item = user.cart.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Cart item not found' });

  if (quantity <= 0) {
    user.cart = user.cart.filter((i) => i._id.toString() !== req.params.itemId);
  } else {
    item.quantity = quantity;
  }
  await user.save();

  const populated = await User.findById(req.user._id).populate({
    path: 'cart.product',
    select: 'name price comparePrice thumbnail stock',
  });
  res.json(populated.cart);
};

exports.removeFromCart = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter((item) => item._id.toString() !== req.params.itemId);
  await user.save();
  res.json(user.cart);
};

exports.clearCart = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { cart: [] });
  res.json([]);
};

// Wishlist
exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name price thumbnail rating category');
  res.json(user.wishlist);
};

exports.toggleWishlist = async (req, res) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);
  const index = user.wishlist.indexOf(productId);
  if (index >= 0) {
    user.wishlist.splice(index, 1);
  } else {
    user.wishlist.push(productId);
  }
  await user.save();
  res.json({ wishlist: user.wishlist, added: index < 0 });
};
