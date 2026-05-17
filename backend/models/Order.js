const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String, default: '' },
});

const trackingEventSchema = new mongoose.Schema({
  status: String,
  description: String,
  location: String,
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, unique: true },
    items: [orderItemSchema],
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'US' },
      phone: String,
    },
    paymentMethod: { type: String, default: 'card' },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      email: String,
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    couponCode: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    trackingNumber: { type: String, default: '' },
    trackingHistory: [trackingEventSchema],
    notes: { type: String, default: '' },
    estimatedDelivery: Date,
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

// Add tracking event on status change
orderSchema.methods.addTrackingEvent = function (status, description, location = '') {
  this.trackingHistory.push({ status, description, location });
  this.status = status;
};

module.exports = mongoose.model('Order', orderSchema);
