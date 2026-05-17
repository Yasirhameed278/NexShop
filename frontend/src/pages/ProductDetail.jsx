import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, ChevronRight, Minus, Plus, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { PageLoader } from '../components/ui/Loader';
import StarRating from '../components/StarRating';
import ProductCard from '../components/product/ProductCard';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [adding, setAdding] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [tab, setTab] = useState('description');

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/related`),
    ]).then(([{ data: p }, { data: r }]) => {
      setProduct(p);
      setRelated(r.slice(0, 4));
    }).catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async (buyNow = false) => {
    if (!isLoggedIn()) return toast.error('Please sign in to continue');
    if (product.stock === 0) return toast.error('Out of stock');
    setAdding(true);
    try {
      await addItem(product._id, qty, Object.values(selectedVariants).join(', '));
      toast.success('Added to cart!', { icon: '🛒' });
      if (buyNow) navigate('/cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setAdding(false); }
  };

  const handleWishlist = async () => {
    if (!isLoggedIn()) return toast.error('Please sign in');
    const added = await toggle(product._id);
    toast.success(added ? 'Added to wishlist!' : 'Removed from wishlist');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return toast.error('Sign in to review');
    try {
      await api.post(`/products/${id}/reviews`, { rating: reviewRating, comment: reviewText });
      toast.success('Review submitted!');
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      setReviewText('');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <PageLoader />;
  if (!product) return null;

  const images = product.images?.length ? product.images : [product.thumbnail || 'https://via.placeholder.com/500'];
  const discount = product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const wishlisted = isWishlisted(product._id);

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-brand-500">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-brand-500">Products</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?category=${product.category}`} className="hover:text-brand-500">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square mb-3">
              <img src={images[activeImage]} alt={product.name}
                className="w-full h-full object-cover transition-all duration-300" />
              {discount > 0 && <span className="absolute top-4 left-4 badge bg-red-500 text-white font-bold">-{discount}%</span>}
              <button onClick={handleWishlist}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:text-red-500'}`}>
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white' : ''}`} />
              </button>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${activeImage === i ? 'border-brand-500' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm text-brand-500 font-medium uppercase tracking-wide">{product.category} {product.brand && `· ${product.brand}`}</p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mt-1 leading-tight">{product.name}</h1>
              </div>
              <button onClick={() => { navigator.share?.({ title: product.name, url: window.location.href }); }}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all shrink-0">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating} size="md" />
              <span className="text-sm text-gray-500">{product.rating?.toFixed(1)} ({product.numReviews} reviews)</span>
              <span className="text-xs text-gray-400">{product.soldCount} sold</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-gray-900">${product.price?.toFixed(2)}</span>
              {discount > 0 && <>
                <span className="text-xl text-gray-400 line-through">${product.comparePrice?.toFixed(2)}</span>
                <span className="badge bg-red-100 text-red-600 font-bold">Save {discount}%</span>
              </>}
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.shortDescription || product.description?.substring(0, 200)}</p>

            {/* Variants */}
            {product.variants?.map((variant) => (
              <div key={variant.label} className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{variant.label}:
                  {selectedVariants[variant.label] && <span className="text-brand-600 ml-1">{selectedVariants[variant.label]}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((opt) => (
                    <button key={opt} onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.label]: opt }))}
                      className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                        selectedVariants[variant.label] === opt ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {product.stock > 5 ? `In Stock (${product.stock} available)` : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity + Actions */}
            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 py-3 font-semibold text-gray-900 border-x border-gray-200 min-w-[3rem] text-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => handleAddToCart(false)} disabled={adding}
                  className="btn-secondary flex-1 py-3 text-sm font-semibold">
                  <ShoppingCart className="w-4 h-4" />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button onClick={() => handleAddToCart(true)} disabled={adding}
                  className="btn-primary flex-1 py-3 text-sm font-semibold">
                  Buy Now
                </button>
              </div>
            )}

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3">
              {[
                [Truck, 'Free shipping over $100'],
                [Shield, 'Secure checkout'],
                [RotateCcw, '30-day returns'],
              ].map(([Icon, text]) => (
                <div key={text} className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 gap-1">
                  <Icon className="w-4 h-4 text-brand-500" />
                  <span className="text-xs text-gray-500">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card p-0 overflow-hidden mb-16">
          <div className="flex border-b border-gray-100">
            {['description', 'reviews', 'seo'].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-4 text-sm font-medium capitalize transition-all border-b-2 ${
                  tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t === 'seo' ? 'Product Details' : t} {t === 'reviews' && `(${product.numReviews})`}
              </button>
            ))}
          </div>
          <div className="p-6">
            {tab === 'description' && (
              <div className="prose max-w-none text-gray-600 text-sm leading-relaxed">
                <p className="whitespace-pre-wrap">{product.description}</p>
                {product.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {product.tags.map(tag => <span key={tag} className="badge bg-gray-100 text-gray-600">#{tag}</span>)}
                  </div>
                )}
              </div>
            )}
            {tab === 'reviews' && (
              <div className="space-y-6">
                {isLoggedIn() && (
                  <form onSubmit={handleReview} className="p-4 bg-gray-50 rounded-2xl">
                    <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
                    <StarRating rating={reviewRating} size="lg" interactive onChange={setReviewRating} />
                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience..." rows={3}
                      className="input mt-3 resize-none" required />
                    <button type="submit" className="btn-primary mt-3 text-sm">Submit Review</button>
                  </form>
                )}
                {product.reviews?.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="space-y-4">
                    {product.reviews?.map((review) => (
                      <div key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                            {review.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{review.name}</p>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} size="sm" />
                              <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 pl-11">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tab === 'seo' && (
              <div className="space-y-4">
                {[
                  ['SKU', product.sku || 'N/A'],
                  ['Brand', product.brand || 'N/A'],
                  ['Category', product.category],
                  ['Stock', `${product.stock} units`],
                  ['SEO Title', product.seoTitle || product.name],
                  ['SEO Description', product.seoDescription || product.description?.substring(0, 160)],
                  ['Keywords', product.seoKeywords?.join(', ') || 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-4">
                    <span className="text-sm font-medium text-gray-500 w-36 shrink-0">{label}</span>
                    <span className="text-sm text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="section-title mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
