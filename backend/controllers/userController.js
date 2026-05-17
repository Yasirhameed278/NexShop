const User = require('../models/User');
const Order = require('../models/Order');

exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = search ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] } : {};
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  res.json({ users, total });
};

exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(10);
  res.json({ user, orders });
};

exports.updateUser = async (req, res) => {
  const { name, email, role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();
  res.json(user);
};

exports.deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = false;
  await user.save();
  res.json({ message: 'User deactivated' });
};

exports.getUserStats = async (req, res) => {
  const [totalUsers, activeUsers, newThisMonth, adminCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } }),
    User.countDocuments({ role: 'admin' }),
  ]);
  res.json({ totalUsers, activeUsers, newThisMonth, adminCount });
};
