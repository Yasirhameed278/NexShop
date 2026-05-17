import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-orange-400 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">Nex<span className="text-brand-500">Shop</span></span>
        </Link>
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-8">
          <h2 className="font-display text-2xl font-bold text-white mb-1">{title}</h2>
          <p className="text-gray-400 text-sm mb-7">{subtitle}</p>
          {children}
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mt-4 justify-center">
          <ArrowLeft className="w-4 h-4" />Back to store
        </Link>
      </div>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const [form, setForm] = useState({ email: 'john@example.com', password: 'password123' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      await Promise.all([fetchCart(), fetchWishlist()]);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back!" subtitle="Sign in to your NexShop account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:border-brand-400 transition-all text-sm"
            placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:border-brand-400 transition-all text-sm"
              placeholder="Password" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-4">
        No account? <Link to="/register" className="text-brand-400 font-medium">Sign up</Link>
      </p>
    </AuthLayout>
  );
}

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password);
      await Promise.all([fetchCart(), fetchWishlist()]);
      toast.success(`Welcome, ${data.user.name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join NexShop today">
      <form onSubmit={handleSubmit} className="space-y-4">
        {[['name','Full Name','text','Your Name'],['email','Email','email','you@example.com']].map(([f,l,t,p]) => (
          <div key={f}>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">{l}</label>
            <input type={t} value={form[f]} onChange={(e) => setForm(prev => ({ ...prev, [f]: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:border-brand-400 transition-all text-sm"
              placeholder={p} required />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:border-brand-400 transition-all text-sm"
              placeholder="Min. 6 characters" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
          <input type="password" value={form.confirm} onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))}
            className="w-full px-4 py-3 bg-white/10 border border-white/10 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:border-brand-400 transition-all text-sm"
            placeholder="Repeat password" required />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-4">
        Have an account? <Link to="/login" className="text-brand-400 font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
