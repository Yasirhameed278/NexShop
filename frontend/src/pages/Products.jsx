import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid3X3, List, X, ChevronDown } from 'lucide-react';
import api from '../api';
import ProductCard from '../components/product/ProductCard';
import { SkeletonCard } from '../components/ui/Loader';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState('grid');

  const filters = {
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'newest',
    featured: searchParams.get('featured') || '',
  };

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => { setSearchParams({}); setPage(1); };

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => {
      setCategories(data.categories);
      setBrands(data.brands);
    });
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ ...filters, page, limit: 12 });
        const { data } = await api.get(`/products?${params}`);
        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
      } catch {}
      setLoading(false);
    };
    fetchProducts();
  }, [searchParams, page]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== 'sort').length;

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
          Category
          {filters.category && <button onClick={() => setFilter('category', '')} className="text-xs text-brand-500">Clear</button>}
        </h3>
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilter('category', filters.category === cat ? '' : cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                filters.category === cat ? 'bg-brand-50 text-brand-700 font-medium border border-brand-200' : 'text-gray-600 hover:bg-gray-50'
              }`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice}
            onChange={(e) => setFilter('minPrice', e.target.value)}
            className="input text-sm py-2" />
          <input type="number" placeholder="Max" value={filters.maxPrice}
            onChange={(e) => setFilter('maxPrice', e.target.value)}
            className="input text-sm py-2" />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Min Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button key={r} onClick={() => setFilter('rating', filters.rating === String(r) ? '' : String(r))}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                filters.rating === String(r) ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {'★'.repeat(r)}{'☆'.repeat(5 - r)} <span className="text-xs">& up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {brands.filter(Boolean).map((brand) => (
              <button key={brand} onClick={() => setFilter('brand', filters.brand === brand ? '' : brand)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  filters.brand === brand ? 'bg-brand-50 text-brand-700 font-medium border border-brand-200' : 'text-gray-600 hover:bg-gray-50'
                }`}>{brand}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              {filters.keyword ? `Results for "${filters.keyword}"` :
               filters.category ? filters.category :
               filters.featured ? 'Featured Products' : 'All Products'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{total} products found</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative hidden sm:block">
              <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}
                className="input text-sm py-2 pr-8 appearance-none cursor-pointer">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {/* View toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1">
              <button onClick={() => setView('grid')} className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            {/* Filter toggle mobile */}
            <button onClick={() => setFilterOpen(!filterOpen)}
              className={`btn-secondary text-sm lg:hidden ${activeFilterCount > 0 ? 'border-brand-400 text-brand-600' : ''}`}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters {activeFilterCount > 0 && <span className="bg-brand-500 text-white text-xs px-1.5 rounded-full">{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        {/* Active filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-500">Active filters:</span>
            {filters.category && <span className="badge bg-brand-100 text-brand-700">{filters.category} <button onClick={() => setFilter('category', '')} className="ml-1">×</button></span>}
            {filters.brand && <span className="badge bg-brand-100 text-brand-700">{filters.brand} <button onClick={() => setFilter('brand', '')} className="ml-1">×</button></span>}
            {filters.minPrice && <span className="badge bg-brand-100 text-brand-700">Min: ${filters.minPrice} <button onClick={() => setFilter('minPrice', '')} className="ml-1">×</button></span>}
            {filters.maxPrice && <span className="badge bg-brand-100 text-brand-700">Max: ${filters.maxPrice} <button onClick={() => setFilter('maxPrice', '')} className="ml-1">×</button></span>}
            {filters.rating && <span className="badge bg-amber-100 text-amber-700">{filters.rating}★+ <button onClick={() => setFilter('rating', '')} className="ml-1">×</button></span>}
            <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1"><X className="w-3 h-3" />Clear all</button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="card p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Clear all</button>}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {filterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Filters</h2>
                  <button onClick={() => setFilterOpen(false)}><X className="w-5 h-5" /></button>
                </div>
                <FilterSidebar />
                <button onClick={() => setFilterOpen(false)} className="btn-primary w-full mt-6">Apply Filters</button>
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                {Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or search term</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="btn-secondary disabled:opacity-40">Prev</button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          page === p ? 'bg-brand-500 text-white' : 'hover:bg-gray-100 text-gray-600'
                        }`}>{p}</button>
                    );
                  })}
                </div>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="btn-secondary disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
