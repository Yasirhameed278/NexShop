import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, Package, Brain, RefreshCw, CheckCircle,
  Clock, ShoppingCart, AlertCircle, ChevronUp, ChevronDown,
  Minus, TrendingUp, TrendingDown, Layers,
} from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const RISK_CONFIG = {
  critical: { color: '#ef4444', bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    label: 'Critical', Icon: AlertTriangle },
  high:     { color: '#f97316', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', label: 'High',     Icon: AlertCircle  },
  medium:   { color: '#eab308', bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', label: 'Medium',   Icon: Clock        },
  low:      { color: '#22c55e', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200',  label: 'Low',      Icon: CheckCircle  },
};

const VELOCITY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function HealthGauge({ score }) {
  const clamp = Math.max(0, Math.min(100, score ?? 0));
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - clamp / 100);
  const color = clamp >= 80 ? '#22c55e' : clamp >= 60 ? '#eab308' : clamp >= 40 ? '#f97316' : '#ef4444';
  const label = clamp >= 80 ? 'Healthy' : clamp >= 60 ? 'Fair' : clamp >= 40 ? 'At Risk' : 'Critical';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{clamp}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <Minus className="w-3 h-3 text-gray-300" />;
  return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold ml-1">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AdminInventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('riskLevel');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const RISK_SORT = { critical: 0, high: 1, medium: 2, low: 3 };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/inventory/predictions');
      setData(res.data.data);
      if (silent) toast.success('Inventory analysis refreshed');
    } catch {
      toast.error('Failed to load inventory predictions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-gray-700 font-medium">Running AI Inventory Analysis</p>
          <p className="text-gray-400 text-sm mt-1">Analyzing sales velocity, seasonal patterns &amp; stockout risks…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { predictions, velocityData, velocityKeys, monthlyTrends, aiInsights, summary, lastUpdated } = data;

  // Filter
  const filtered = predictions.filter(p => filter === 'all' || p.riskLevel === filter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let av = sortBy === 'riskLevel' ? RISK_SORT[a.riskLevel] : a[sortBy];
    let bv = sortBy === 'riskLevel' ? RISK_SORT[b.riskLevel] : b[sortBy];
    if (av == null) av = -1;
    if (bv == null) bv = -1;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = col => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setPage(1);
  };

  const setFilterReset = f => { setFilter(f); setPage(1); };

  const pieData = [
    { name: 'Critical', value: summary.critical, color: '#ef4444' },
    { name: 'High',     value: summary.high,     color: '#f97316' },
    { name: 'Medium',   value: summary.medium,   color: '#eab308' },
    { name: 'Low',      value: summary.low,      color: '#22c55e' },
  ].filter(d => d.value > 0);

  const COLS = [
    { key: 'riskLevel',       label: 'Risk' },
    { key: 'stock',           label: 'Stock' },
    { key: 'dailyVelocity30', label: '30d Velocity' },
    { key: 'daysUntilStockout', label: 'Days Left' },
    { key: 'seasonalIndex',   label: 'Seasonal' },
    { key: 'reorderQty',      label: 'Reorder Qty' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-7 h-7 text-brand-500" />
            AI Inventory Predictions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sales velocity · Seasonal analysis · Stockout forecasting
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:block">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Analyzing…' : 'Reanalyze'}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products',  value: summary.total,                   Icon: Package,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Critical Risk',   value: summary.critical,                Icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50'    },
          { label: 'High Risk',       value: summary.high,                    Icon: AlertCircle,   color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Need Reorder',    value: summary.critical + summary.high, Icon: ShoppingCart,  color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── AI Insights Panel ── */}
      {aiInsights && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-800">AI Analysis &amp; Forecast</h3>
            <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">Claude AI</span>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Health gauge */}
            <div className="flex flex-col items-center text-center gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Inventory Health</span>
              <HealthGauge score={aiInsights.overallHealthScore} />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{aiInsights.forecastInsight}</p>
            </div>

            {/* Summary + Actions */}
            <div className="md:col-span-3 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.summary}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {aiInsights.urgentActions?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Urgent Actions
                    </p>
                    <ul className="space-y-1.5">
                      {aiInsights.urgentActions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiInsights.seasonalAlerts?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Seasonal Alerts
                    </p>
                    <ul className="space-y-1.5">
                      {aiInsights.seasonalAlerts.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Risk Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">{summary.total} total products</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Seasonal Trends Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Seasonal Sales Trends</h3>
          <p className="text-xs text-gray-400 mb-4">Monthly units sold &amp; orders — last 12 months</p>
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={monthlyTrends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={v => v.split(' ')[0]} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="totalUnits" name="Units Sold" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="orderCount"  name="Orders"     fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No monthly data yet</div>
          )}
        </div>
      </div>

      {/* ── Sales Velocity Line Chart ── */}
      {velocityData?.length > 0 && velocityKeys?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-semibold text-gray-800">Sales Velocity — Top At-Risk Products</h3>
              <p className="text-xs text-gray-400 mt-0.5">Units sold per day · last 30 days</p>
            </div>
            <Layers className="w-5 h-5 text-gray-300 shrink-0" />
          </div>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={velocityData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                {velocityKeys.map((key, i) => (
                  <Line
                    key={key} type="monotone" dataKey={key}
                    stroke={VELOCITY_COLORS[i % VELOCITY_COLORS.length]}
                    strokeWidth={2} dot={false} activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Reorder Recommendations ── */}
      {aiInsights?.recommendations?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-500" />
            AI Reorder Recommendations
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiInsights.recommendations.map((rec, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm text-gray-800 leading-snug pr-2 truncate">{rec.product}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    rec.action === 'reorder'   ? 'bg-blue-100 text-blue-700'   :
                    rec.action === 'promote'   ? 'bg-green-100 text-green-700' :
                    rec.action === 'discount'  ? 'bg-orange-100 text-orange-700' :
                                                 'bg-gray-100 text-gray-600'
                  }`}>
                    {rec.action}
                  </span>
                </div>
                {rec.quantity > 0 && (
                  <p className="text-xl font-bold text-brand-500">{rec.quantity} <span className="text-sm font-normal text-gray-400">units</span></p>
                )}
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stockout Risk Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800">Stockout Risk Analysis</h3>
            <p className="text-xs text-gray-400 mt-0.5">All products sorted by predicted risk</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              ['all',      'All',      null],
              ['critical', `Critical (${summary.critical})`, '#ef4444'],
              ['high',     `High (${summary.high})`,         '#f97316'],
              ['medium',   `Medium (${summary.medium})`,     '#eab308'],
              ['low',      `Low (${summary.low})`,           '#22c55e'],
            ].map(([f, label, color]) => (
              <button
                key={f}
                onClick={() => setFilterReset(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filter === f ? { backgroundColor: color || '#1f2937' } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Product</th>
                {COLS.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="px-3 py-3 font-medium text-center cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      {label}
                      <SortIcon col={key} sortBy={sortBy} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    No products match this filter
                  </td>
                </tr>
              ) : (
                paginated.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Product */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-800 truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* Risk */}
                    <td className="px-3 py-3 text-center">
                      <RiskBadge level={product.riskLevel} />
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold text-sm ${
                        product.stock === 0    ? 'text-red-600'    :
                        product.stock <= 5     ? 'text-orange-600' :
                        product.stock <= 20    ? 'text-yellow-600' : 'text-gray-700'
                      }`}>
                        {product.stock}
                      </span>
                    </td>

                    {/* 30-day velocity */}
                    <td className="px-3 py-3 text-center text-sm text-gray-600">
                      {product.dailyVelocity30 > 0 ? (
                        <span className="flex items-center justify-center gap-0.5">
                          {product.dailyVelocity30}/d
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Days until stockout */}
                    <td className="px-3 py-3 text-center">
                      {product.daysUntilStockout >= 999 ? (
                        <span className="text-sm text-green-500 font-medium">Stable</span>
                      ) : product.stock === 0 ? (
                        <span className="text-sm text-red-600 font-bold">Out of stock</span>
                      ) : (
                        <span className={`font-bold text-sm ${
                          product.daysUntilStockout <= 7  ? 'text-red-600'    :
                          product.daysUntilStockout <= 14 ? 'text-orange-600' :
                          product.daysUntilStockout <= 30 ? 'text-yellow-600' : 'text-gray-700'
                        }`}>
                          {product.daysUntilStockout}d
                        </span>
                      )}
                    </td>

                    {/* Seasonal index */}
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-semibold flex items-center justify-center gap-0.5 ${
                        product.seasonalIndex > 1.15 ? 'text-green-600' :
                        product.seasonalIndex < 0.85 ? 'text-red-500'   : 'text-gray-400'
                      }`}>
                        {product.seasonalIndex > 1.05
                          ? <TrendingUp  className="w-3 h-3" />
                          : product.seasonalIndex < 0.95
                          ? <TrendingDown className="w-3 h-3" />
                          : <Minus className="w-3 h-3" />}
                        {product.seasonalIndex}x
                      </span>
                    </td>

                    {/* Reorder qty */}
                    <td className="px-3 py-3 text-center">
                      {product.reorderQty > 0 ? (
                        <span className="text-sm font-bold text-brand-600">{product.reorderQty}</span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600 font-medium min-w-[60px] text-center">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
