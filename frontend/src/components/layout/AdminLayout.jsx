import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Menu, X,
  LogOut, ChevronRight, Bell, TrendingUp, CheckCheck, Brain,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api';

const navItems = [
  { path: '/admin',           icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/products',  icon: Package,         label: 'Products'  },
  { path: '/admin/orders',    icon: ShoppingBag,     label: 'Orders'    },
  { path: '/admin/users',     icon: Users,           label: 'Users'     },
  { path: '/admin/inventory', icon: Brain,           label: 'Inventory AI' },
];

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(true);
  const [nLoading, setNLoading] = useState(false);
  const bellRef = useRef(null);

  // Fetch recent orders as notifications when dropdown opens
  useEffect(() => {
    if (!showNotifications || notifications.length) return;
    setNLoading(true);
    api.get('/orders/admin/all?limit=6')
      .then(({ data }) => setNotifications(data.orders || []))
      .catch(() => {})
      .finally(() => setNLoading(false));
  }, [showNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path, end) => end ? location.pathname === path : location.pathname.startsWith(path);

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-dark-900 ${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-700">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-orange-400 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && <span className="font-display font-bold text-white text-lg">Admin</span>}
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-gray-400 hover:text-white transition-colors">
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ path, icon: Icon, label, end }) => (
          <Link key={path} to={path} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
              isActive(path, end) ? 'bg-brand-500 text-white shadow-glow' : 'text-gray-400 hover:text-white hover:bg-dark-700'
            }`}>
            <Icon className="w-5 h-5 shrink-0" />
            {(!collapsed || mobile) && <span className="text-sm font-medium">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-dark-700">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${collapsed && !mobile ? '' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-orange-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0)}
          </div>
          {(!collapsed || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          )}
          {(!collapsed || mobile) && (
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">
                {navItems.find(n => isActive(n.path, n.end))?.label || 'Admin Panel'}
              </h1>

              <p className="text-xs text-gray-400">NexShop Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" target="_blank" className="text-xs text-brand-500 hover:underline">View Store →</Link>
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => { setShowNotifications(v => !v); setUnread(false); }}
                className="p-2 rounded-lg hover:bg-gray-100 relative"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                {unread && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-800 text-sm">Recent Orders</span>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {nLoading ? (
                      <div className="flex items-center justify-center py-8 text-sm text-gray-400">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-sm text-gray-400">No recent orders</div>
                    ) : notifications.map(order => (
                      <Link
                        key={order._id}
                        to={`/admin/orders`}
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <ShoppingBag className="w-4 h-4 text-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            Order #{order._id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{order.user?.name || 'Guest'} · ${order.totalPrice?.toFixed(2)}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100">
                    <Link to="/admin/orders" onClick={() => setShowNotifications(false)}
                      className="flex items-center justify-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-medium">
                      <CheckCheck className="w-3.5 h-3.5" /> View all orders
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
