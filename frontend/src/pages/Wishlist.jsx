import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useWishlistStore from '../store/wishlistStore';
import ProductCard from '../components/product/ProductCard';

export default function Wishlist() {
  const { items, fetchWishlist } = useWishlistStore();
  useEffect(() => { fetchWishlist(); }, []);
  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Heart className="w-6 h-6 text-red-400 fill-red-400" />Wishlist ({items.length})
        </h1>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-9 h-9 text-red-300" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-400 text-sm mb-6">Save items you love for later.</p>
            <Link to="/products" className="btn-primary px-8 py-3">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {items.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
