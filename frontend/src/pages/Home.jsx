import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RotateCcw, Star, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import api from '../api';
import ProductCard from '../components/product/ProductCard';
import { SkeletonCard } from '../components/ui/Loader';

const CATEGORIES = [
  { name: 'Electronics', emoji: '💻', color: 'from-blue-500 to-indigo-600', count: '120+ items', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&auto=format' },
  { name: 'Clothing', emoji: '👕', color: 'from-pink-500 to-rose-600', count: '340+ items', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop&auto=format' },
  { name: 'Sports', emoji: '🏋️', color: 'from-green-500 to-emerald-600', count: '85+ items', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop&auto=format' },
  { name: 'Home', emoji: '🏠', color: 'from-amber-500 to-orange-600', count: '200+ items', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&auto=format' },
  { name: 'Accessories', emoji: '👜', color: 'from-purple-500 to-violet-600', count: '95+ items', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&auto=format' },
];

const FEATURES = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $100', color: 'text-blue-500 bg-blue-50' },
  { icon: Shield, title: 'Secure Payment', desc: '100% protected', color: 'text-green-500 bg-green-50' },
  { icon: RotateCcw, title: '30-Day Returns', desc: 'Hassle-free returns', color: 'text-purple-500 bg-purple-50' },
  { icon: Zap, title: 'Fast Delivery', desc: '1-2 days express', color: 'text-amber-500 bg-amber-50' },
];

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, trendRes] = await Promise.all([
          api.get('/products?featured=true&limit=8'),
          api.get('/products?sort=popular&limit=4'),
        ]);
        setFeatured(featRes.data.products);
        setTrending(trendRes.data.products);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="pt-16">
      {/* Aurora background — fixed so blobs persist while scrolling */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="aurora-blob-1 absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-orange-400/25 blur-[120px]" />
        <div className="aurora-blob-2 absolute -bottom-48 -left-48 w-[700px] h-[700px] rounded-full bg-violet-500/20 blur-[140px]" />
        <div className="aurora-blob-3 absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-brand-500/15 blur-[100px]" />
        <div className="aurora-blob-4 absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-pink-400/15 blur-[100px]" />
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 min-h-[92vh] flex items-center">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />New arrivals every week
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Shop the<br />
              <span className="text-gradient">Future</span>
              <br />of Retail.
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
              Discover thousands of premium products with lightning-fast delivery, hassle-free returns, and AI-powered shopping assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/products" className="btn-primary px-8 py-3.5 text-base rounded-2xl shadow-glow">
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/products?featured=true" className="btn px-8 py-3.5 text-base rounded-2xl border border-white/10 text-white hover:bg-white/10">
                View Featured
              </Link>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-8">
              {[['50K+', 'Products'], ['2M+', 'Customers'], ['4.9', 'Avg. Rating']].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white">{val}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="hidden lg:block animate-float">
            <div className="relative">
              <div className="w-80 h-80 mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600" alt="Shop" className="w-full h-full object-cover" />
              </div>
              {/* Floating cards */}
              <div className="absolute -left-12 top-12 glass-dark rounded-2xl p-4 shadow-xl animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Today's Sales</p>
                    <p className="text-sm font-bold text-white">$12,480</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 bottom-16 glass-dark rounded-2xl p-3 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-2 mb-1">
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-xs text-gray-300 font-medium">Loved by 2M+ users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar floating */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-2 flex items-center gap-2">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchQuery && navigate(`/products?keyword=${searchQuery}`)}
              placeholder="Search for products..." className="flex-1 bg-transparent text-white placeholder-gray-300 text-sm px-3 outline-none" />
            <button onClick={() => searchQuery && navigate(`/products?keyword=${searchQuery}`)}
              className="btn-primary px-5 py-2 rounded-xl text-sm">Search</button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 glass-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="flex items-center gap-4 group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-brand-500 text-sm font-medium uppercase tracking-wide mb-1">Browse by</p>
            <h2 className="section-title">Shop Categories</h2>
          </div>
          <Link to="/products" className="text-sm text-gray-500 hover:text-brand-500 flex items-center gap-1 transition-colors">
            All categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link key={cat.name} to={`/products?category=${cat.name}`}
              className="group relative overflow-hidden rounded-2xl aspect-square shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-30`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-center text-white">
                <p className="font-bold text-sm">{cat.name}</p>
                <p className="text-xs opacity-75">{cat.count}</p>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 glass-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-brand-500 text-sm font-medium uppercase tracking-wide mb-1">Handpicked for you</p>
              <h2 className="section-title">Featured Products</h2>
            </div>
            <Link to="/products?featured=true" className="text-sm text-gray-500 hover:text-brand-500 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {loading ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />) : featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-brand-500 text-sm font-medium uppercase tracking-wide mb-1">This week</p>
            <h2 className="section-title">Trending Now</h2>
          </div>
          <Link to="/products?sort=popular" className="text-sm text-gray-500 hover:text-brand-500 flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {loading ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />) : trending.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-900 to-dark-700 p-10 md:p-16 text-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-3">Limited Time Offer</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Use code <span className="text-gradient">SAVE20</span> for 20% off</h2>
            <p className="text-gray-400 mb-8">Shop our entire catalog and save big on your first order</p>
            <Link to="/products" className="btn-primary px-8 py-3.5 text-base rounded-2xl shadow-glow-lg">
              Shop Now & Save <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
