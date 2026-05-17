import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Filter, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { PageLoader } from '../../components/ui/Loader';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set('keyword', search);
      if (category) params.set('category', category);
      const { data } = await api.get(`/products?${params}&isActive=true`);
      setProducts(data.products);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch { toast.error('Failed to fetch products'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">{total} products total</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 min-w-[200px] gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..." className="input pl-9 text-sm" />
          </div>
          <button type="submit" className="btn-primary text-sm px-4">Search</button>
        </form>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="input text-sm w-auto">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Product table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
            <Link to="/admin/products/new" className="btn-primary mt-4 inline-flex text-sm gap-2">
              <Plus className="w-4 h-4" /> Add First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-16">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Rating</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Sold</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product, idx) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{(page - 1) * 12 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.thumbnail} alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-gray-400 truncate">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 text-gray-600">{product.category}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${product.price}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${product.stock === 0 ? 'bg-red-100 text-red-700' : product.stock <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {product.stock === 0 ? 'Out' : product.stock <= 5 ? `⚠ ${product.stock}` : product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="flex items-center gap-1">
                        ⭐ {product.rating?.toFixed(1) || '0.0'}
                        <span className="text-xs text-gray-400">({product.numReviews})</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.soldCount || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/products/${product._id}`} target="_blank"
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link to={`/admin/products/${product._id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(product._id, product.name)}
                          disabled={deleting === product._id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          {deleting === product._id
                            ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
