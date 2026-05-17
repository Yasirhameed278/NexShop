const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0 },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    brand: { type: String, default: '' },
    images: [{ type: String }],
    thumbnail: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    variants: [{ label: String, options: [String] }],
    tags: [{ type: String }],
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // SEO fields
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: [{ type: String }],
    metaImage: { type: String, default: '' },
    // Analytics
    viewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    dimensions: { length: Number, width: Number, height: Number },
  },
  { timestamps: true }
);

// Auto-generate slug
productSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  if (!this.thumbnail && this.images.length > 0) {
    this.thumbnail = this.images[0];
  }
  next();
});

// Update rating on review save
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.rating = this.reviews.reduce((a, r) => a + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
};

// Text index for search
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Product', productSchema);
