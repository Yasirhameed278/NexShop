import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, MapPin, ChevronLeft } from 'lucide-react';
import api from '../api';
import { PageLoader } from '../components/ui/Loader';

const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_CONFIG = {
  pending:    { color: 'text-yellow-600 bg-yellow-100', label: 'Pending' },
  confirmed:  { color: 'text-blue-600 bg-blue-100', label: 'Confirmed' },
  processing: { color: 'text-purple-600 bg-purple-100', label: 'Processing' },
  shipped:    { color: 'text-indigo-600 bg-indigo-100', label: 'Shipped' },
  delivered:  { color: 'text-green-600 bg-green-100', label: 'Delivered' },
  cancelled:  { color: 'text-red-600 bg-red-100', label: 'Cancelled' },
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data);
    } catch (err) { alert(err.response?.data?.message || 'Cannot cancel'); }
    setCancelling(false);
  };

  if (loading) return <PageLoader />;
  if (!order) return <div className="pt-20 text-center py-20 text-gray-400">Order not found</div>;

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/orders" className="btn-ghost p-2 rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl font-bold text-gray-900">Order {order.orderNumber}</h1>
              <span className={`badge ${cfg.color} text-xs font-semibold`}>{cfg.label}</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
          </div>
          {['pending', 'confirmed', 'processing'].includes(order.status) && (
            <button onClick={handleCancel} disabled={cancelling}
              className="btn-danger text-sm py-2 px-4">
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>

        {/* Tracking timeline */}
        {!['cancelled', 'refunded'].includes(order.status) && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-5">Order Tracking</h2>
            {order.trackingNumber && (
              <p className="text-xs text-gray-400 mb-4">Tracking #: <span className="font-mono font-bold text-gray-700">{order.trackingNumber}</span></p>
            )}
            {/* Progress bar */}
            <div className="flex items-center mb-6">
              {STATUS_STEPS.map((step, i) => {
                const done = currentStep >= i;
                const active = currentStep === i;
                const icons = [CheckCircle, Package, Truck, CheckCircle];
                const Icon = icons[i];
                return (
                  <React.Fragment key={step}>
                    <div className={`flex flex-col items-center gap-1.5 ${i === 0 ? '' : 'flex-1'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        done ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-200 text-gray-300'
                      } ${active ? 'ring-4 ring-brand-100' : ''}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-medium capitalize ${done ? 'text-brand-600' : 'text-gray-400'}`}>{step}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 ${currentStep > i ? 'bg-brand-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Tracking history */}
            {order.trackingHistory?.length > 0 && (
              <div className="space-y-3">
                {[...order.trackingHistory].reverse().map((event, i) => (
                  <div key={i} className={`flex gap-3 p-3 rounded-xl ${i === 0 ? 'bg-brand-50' : 'bg-gray-50'}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-brand-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className={`text-sm font-medium ${i === 0 ? 'text-brand-700' : 'text-gray-700'}`}>{event.description}</p>
                      {event.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{event.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {order.estimatedDelivery && order.status !== 'delivered' && (
              <p className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { dateStyle: 'full' })}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Items */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Items ({order.items.length})</h2>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-gray-50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                    {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Shipping address */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Shipping Address</h2>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-900">{order.shippingAddress?.name}</p>
                <p>{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                <p>{order.shippingAddress?.country}</p>
                {order.shippingAddress?.phone && <p className="text-gray-400">{order.shippingAddress.phone}</p>}
              </div>
            </div>

            {/* Price summary */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                {[
                  ['Subtotal', `$${order.itemsPrice?.toFixed(2)}`],
                  ['Shipping', order.shippingPrice === 0 ? 'Free' : `$${order.shippingPrice?.toFixed(2)}`],
                  ['Tax', `$${order.taxPrice?.toFixed(2)}`],
                  ...(order.discount > 0 ? [['Discount', `-$${order.discount?.toFixed(2)}`]] : []),
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-gray-600">
                    <span>{l}</span><span className={l === 'Discount' ? 'text-green-600' : ''}>{v}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span><span>${order.totalPrice?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
