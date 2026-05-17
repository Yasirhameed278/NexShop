import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Search, Package, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import api from '../../api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isLoggedIn } = useAuthStore();
  const { getCount } = useCartStore();
  const { items: wishlist } = useWishlistStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) return setSearchResults([]);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/chatbot/search?query=${q}`);
        setSearchResults(data);
      } catch {}
    }, 300);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartCount = getCount();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-orange-400 rounded-lg flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900">
              Nex<span className="text-brand-500">Shop</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[['/', 'Home'], ['/products', 'Products'], ['/products?category=Electronics', 'Electronics'], ['/products?category=Clothing', 'Fashion']].map(([path, label]) => (
              <Link key={path} to={path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === path ? 'text-brand-600 bg-brand-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}>{label}</Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <button onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <Search className="w-5 h-5" />
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 animate-slide-down overflow-hidden">
                  <div className="p-3">
                    <input autoFocus value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery) { navigate(`/products?keyword=${searchQuery}`); setSearchOpen(false); setSearchQuery(''); } }}
                      placeholder="Search products..." className="input text-sm" />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="border-t border-gray-50 max-h-72 overflow-y-auto">
                      {searchResults.map((p) => (
                        <Link key={p._id} to={`/products/${p._id}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                          <img src={p.thumbnail || 'https://via.placeholder.com/40'} alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-brand-600 font-semibold">${p.price}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isLoggedIn() && (
              <>
                <Link to="/wishlist" className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{wishlist.length}</span>
                  )}
                </Link>
                <Link to="/cart" className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">{cartCount}</span>
                  )}
                </Link>
              </>
            )}

            {isLoggedIn() ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-orange-400 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-slide-down z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    {[
                      ['/profile', <User className="w-4 h-4" />, 'Profile'],
                      ['/orders', <Package className="w-4 h-4" />, 'My Orders'],
                      ['/wishlist', <Heart className="w-4 h-4" />, 'Wishlist'],
                      ...(isAdmin() ? [['/admin', <LayoutDashboard className="w-4 h-4" />, 'Admin Dashboard']] : []),
                    ].map(([path, icon, label]) => (
                      <Link key={path} to={path} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                        {icon}{label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-50 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" />Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm px-3 py-2">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Sign up</Link>
              </div>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            {[['/', 'Home'], ['/products', 'Products'], ['/products?category=Electronics', 'Electronics'], ['/products?category=Clothing', 'Fashion']].map(([path, label]) => (
              <Link key={path} to={path} className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">{label}</Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
