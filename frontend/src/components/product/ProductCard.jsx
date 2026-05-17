import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';

export default function ProductCard({ product }) {
  const { isLoggedIn } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const [adding, setAdding] = useState(false);

  const wishlisted = isWishlisted(product._id);
  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return toast.error('Please sign in to add to cart');
    if (product.stock === 0) return toast.error('Out of stock');
    setAdding(true);
    try {
      await addItem(product._id, 1);
      toast.success('Added to cart!', { icon: '🛒' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return toast.error('Please sign in');
    try {
      const added = await toggle(product._id);
      toast.success(added ? 'Added to wishlist!' : 'Removed from wishlist', { icon: added ? '❤️' : '💔' });
    } catch {}
  };

  return (
    <Link to={`/products/${product._id}`} className="group card overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 block">
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <img
          src={product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'; }}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && <span className="badge bg-red-500 text-white text-[10px] font-bold">-{discount}%</span>}
          {product.isFeatured && <span className="badge bg-brand-500 text-white text-[10px]">Featured</span>}
          {product.stock === 0 && <span className="badge bg-gray-800 text-white text-[10px]">Sold Out</span>}
          {product.stock > 0 && product.stock <= 5 && <span className="badge bg-amber-500 text-white text-[10px]">Low Stock</span>}
        </div>
        {/* Actions overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
          <button onClick={handleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:text-red-500'}`}>
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white' : ''}`} />
          </button>
        </div>
        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button onClick={handleAddToCart} disabled={adding || product.stock === 0}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              product.stock === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-dark-900 text-white hover:bg-dark-700 shadow-lg'
            }`}>
            <ShoppingCart className="w-4 h-4" />
            {adding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-brand-500 font-medium uppercase tracking-wide mb-1">{product.category}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400">({product.numReviews || 0})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">${product.price?.toFixed(2)}</span>
            {discount > 0 && <span className="text-sm text-gray-400 line-through">${product.comparePrice?.toFixed(2)}</span>}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye className="w-3 h-3" />
            <span>{product.viewCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
