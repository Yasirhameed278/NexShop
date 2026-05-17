import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateItem, removeItem, clearCart, getTotal } = useCartStore();

  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleUpdate = async (itemId, newQty) => {
    if (newQty < 1) {
      await removeItem(itemId);
      toast.success('Item removed');
    } else {
      await updateItem(itemId, newQty);
    }
  };

  if (items.length === 0) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-400 text-sm mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary px-8 py-3">Start Shopping</Link>
      </div>
    </div>
  );

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">Shopping Cart ({items.length})</h1>
          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 transition-colors">Clear all</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item._id} className="card p-5 flex items-center gap-4 group hover:shadow-card-hover transition-all">
                <Link to={`/products/${item.product?._id}`}>
                  <img src={item.product?.thumbnail || 'https://via.placeholder.com/80'}
                    alt={item.product?.name} className="w-20 h-20 object-cover rounded-xl bg-gray-50" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product?._id}`}
                    className="font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-2 text-sm">
                    {item.product?.name}
                  </Link>
                  {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                  <p className="text-brand-600 font-bold mt-1">${item.product?.price?.toFixed(2)}</p>
                </div>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => handleUpdate(item._id, item.quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-500">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-2 font-semibold text-sm border-x border-gray-200">{item.quantity}</span>
                  <button onClick={() => handleUpdate(item._id, item.quantity + 1)}
                    disabled={item.quantity >= item.product?.stock}
                    className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-500 disabled:opacity-40">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${(item.product?.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item._id).then(() => toast.success('Removed'))}
                    className="text-gray-300 hover:text-red-400 transition-colors mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              {shipping > 0 && (
                <p className="mt-3 text-xs text-brand-500 bg-brand-50 rounded-xl p-2.5 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                </p>
              )}
              <button onClick={() => navigate('/checkout')}
                className="btn-primary w-full py-3.5 mt-4 text-base rounded-2xl shadow-glow">
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>
              <Link to="/products" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-3">Continue Shopping</Link>
            </div>

            {/* Promo codes */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Promo Codes</h3>
              <p className="text-xs text-gray-400 mb-3">Enter at checkout</p>
              <div className="space-y-2">
                {[['SAVE10', '10% off'], ['SAVE20', '20% off'], ['FREESHIP', 'Free shipping']].map(([code, desc]) => (
                  <div key={code} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div>
                      <code className="text-xs font-mono font-bold text-gray-800">{code}</code>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
