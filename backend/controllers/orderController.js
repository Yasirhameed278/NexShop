const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });

  let itemsPrice = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ message: `Product ${item.product} not found` });
    if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.thumbnail,
      price: product.price,
      quantity: item.quantity,
      variant: item.variant || '',
    });
    itemsPrice += product.price * item.quantity;

    // Reduce stock
    product.stock -= item.quantity;
    product.soldCount = (product.soldCount || 0) + item.quantity;
    await product.save();
  }

  // Calculate totals
  let discount = 0;
  if (couponCode === 'SAVE10') discount = itemsPrice * 0.1;
  if (couponCode === 'SAVE20') discount = itemsPrice * 0.2;
  if (couponCode === 'FREESHIP') discount = 0;

  const shippingPrice = itemsPrice > 100 ? 0 : 9.99;
  const taxPrice = Math.round(itemsPrice * 0.08 * 100) / 100;
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice - discount) * 100) / 100;

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'card',
    itemsPrice,
    shippingPrice,
    taxPrice,
    discount,
    couponCode: couponCode || '',
    totalPrice,
    estimatedDelivery,
    isPaid: true, // Mock payment
    paidAt: new Date(),
    status: 'confirmed',
    trackingHistory: [
      { status: 'confirmed', description: 'Order placed and payment confirmed', timestamp: new Date() },
    ],
  });

  // Clear user cart
  await User.findByIdAndUpdate(req.user._id, { cart: [] });

  const populated = await Order.findById(order._id).populate('user', 'name email');
  res.status(201).json(populated);
};

exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Not authorized' });
  res.json(order);
};

exports.cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Not authorized' });
  if (['shipped', 'delivered'].includes(order.status))
    return res.status(400).json({ message: 'Cannot cancel shipped/delivered order' });

  order.addTrackingEvent('cancelled', 'Order cancelled by customer');
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, soldCount: -item.quantity },
    });
  }
  res.json(order);
};

// Admin controllers
exports.getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const [orders, total] = await Promise.all([
    Order.find(query).populate('user', 'name email').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit)),
    Order.countDocuments(query),
  ]);
  res.json({ orders, total });
};

exports.updateOrderStatus = async (req, res) => {
  const { status, trackingNumber, description, location } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const descriptions = {
    processing: 'Order is being processed',
    shipped: 'Order has been shipped',
    delivered: 'Order delivered successfully',
    cancelled: 'Order has been cancelled',
    refunded: 'Order has been refunded',
  };

  order.addTrackingEvent(status, description || descriptions[status] || status, location || '');
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === 'delivered') { order.isDelivered = true; order.deliveredAt = new Date(); }

  await order.save();
  res.json(order);
};

exports.getOrderStats = async (req, res) => {
  const [totalOrders, totalRevenue, statusCounts, recentOrders] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name'),
  ]);

  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    statusCounts,
    recentOrders,
    monthlyRevenue,
  });
};
