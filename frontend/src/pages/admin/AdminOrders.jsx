import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Truck, Clock, CheckCircle, XCircle, RefreshCcw, Eye, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';

const STATUS_CONFIG = {
  pending:    { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Pending' },
  confirmed:  { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, label: 'Confirmed' },
  processing: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: RefreshCcw, label: 'Processing' },
  shipped:    { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Truck, label: 'Shipped' },
  delivered:  { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'Delivered' },
  cancelled:  { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' },
  refunded:   { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: RefreshCcw, label: 'Refunded' },
};

const STATUS_FLOW = ['confirmed', 'processing', 'shipped', 'delivered'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/orders/admin/all?${params}`);
      let filtered = data.orders;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(o =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.user?.name?.toLowerCase().includes(q) ||
          o.user?.email?.toLowerCase().includes(q)
        );
      }
      setOrders(filtered);
      setTotal(data.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleStatusUpdate = async (orderId, status, trackingNumber) => {
    setUpdatingOrder(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status, trackingNumber: trackingNumber || undefined });
      toast.success(`Order status updated to "${status}"`);
      fetchOrders();
      setExpandedOrder(null);
    } catch { toast.error('Failed to update status'); }
    finally { setUpdatingOrder(null); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">{total} orders total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            placeholder="Search by order #, customer name..." className="input pl-9 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', ...Object.keys(STATUS_CONFIG)].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === s ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {s ? STATUS_CONFIG[s].label : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  const isExpanded = expandedOrder === order._id;

                  return (
                    <React.Fragment key={order._id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-semibold text-gray-900">{order.orderNumber}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{order.user?.name}</p>
                          <p className="text-xs text-gray-400">{order.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">${order.totalPrice?.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`badge border ${cfg.color} gap-1.5`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                              className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded details */}
                      {isExpanded && (
                        <tr className="bg-brand-50/30">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Order items */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Order Items</p>
                                <div className="space-y-2">
                                  {order.items?.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-400">x{item.quantity} · ${item.price}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 text-xs space-y-1 text-gray-600">
                                  <p><span className="font-medium">Shipping to:</span> {order.shippingAddress?.name}, {order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
                                  {order.trackingNumber && <p><span className="font-medium">Tracking #:</span> <span className="font-mono">{order.trackingNumber}</span></p>}
                                </div>
                              </div>

                              {/* Status update */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Update Status</p>
                                <div className="space-y-2">
                                  {['processing', 'shipped', 'delivered', 'cancelled'].map((s) => {
                                    const sCfg = STATUS_CONFIG[s];
                                    const SIcon = sCfg.icon;
                                    const isCurrent = order.status === s;
                                    return (
                                      <div key={s} className="flex items-center gap-2">
                                        <button
                                          disabled={isCurrent || updatingOrder === order._id}
                                          onClick={() => handleStatusUpdate(order._id, s, trackingInput[order._id])}
                                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium flex-1 border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isCurrent ? sCfg.color + ' border' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600'
                                          }`}>
                                          <SIcon className="w-3.5 h-3.5" />
                                          {isCurrent ? `Current: ${sCfg.label}` : `Mark as ${sCfg.label}`}
                                        </button>
                                      </div>
                                    );
                                  })}
                                  <div className="mt-2">
                                    <input value={trackingInput[order._id] || ''} onChange={(e) => setTrackingInput(prev => ({ ...prev, [order._id]: e.target.value }))}
                                      placeholder="Tracking number (optional)" className="input text-xs py-2" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tracking history */}
                            {order.trackingHistory?.length > 0 && (
                              <div className="mt-4 border-t border-gray-200 pt-4">
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Tracking History</p>
                                <div className="flex gap-4 overflow-x-auto">
                                  {order.trackingHistory.map((event, i) => (
                                    <div key={i} className="flex-shrink-0 text-xs">
                                      <p className="font-semibold text-gray-800 capitalize">{event.status}</p>
                                      <p className="text-gray-500">{event.description}</p>
                                      <p className="text-gray-400">{new Date(event.timestamp).toLocaleDateString()}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
