import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, Upload, X, Plus, Globe, Tag, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';

const TABS = ['Basic Info', 'Images', 'Variants & Tags', 'SEO & Meta'];

const DEFAULT = {
  name: '', description: '', shortDescription: '', price: '', comparePrice: '',
  category: '', subcategory: '', brand: '', stock: '', sku: '',
  isFeatured: false, isActive: true,
  seoTitle: '', seoDescription: '', seoKeywords: '',
  tags: '', weight: '',
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [tab, setTab] = useState('Basic Info');
  const [form, setForm] = useState(DEFAULT);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories] = useState(['Electronics', 'Clothing', 'Sports', 'Home', 'Accessories', 'Books', 'Beauty', 'Toys', 'Automotive', 'Garden']);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`).then(({ data }) => {
      setForm({
        name: data.name || '', description: data.description || '',
        shortDescription: data.shortDescription || '', price: data.price || '',
        comparePrice: data.comparePrice || '', category: data.category || '',
        subcategory: data.subcategory || '', brand: data.brand || '',
        stock: data.stock || '', sku: data.sku || '',
        isFeatured: data.isFeatured || false, isActive: data.isActive !== false,
        seoTitle: data.seoTitle || '', seoDescription: data.seoDescription || '',
        seoKeywords: (data.seoKeywords || []).join(', '),
        tags: (data.tags || []).join(', '), weight: data.weight || '',
      });
      setExistingImages(data.images || []);
      setVariants(data.variants || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files].slice(0, 5));
  };

  const removeNewImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));
  const removeExistingImage = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));

  const addVariant = () => setVariants(prev => [...prev, { label: '', options: [''] }]);
  const updateVariantLabel = (i, val) => setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, label: val } : v));
  const updateVariantOption = (vi, oi, val) => setVariants(prev => prev.map((v, idx) =>
    idx === vi ? { ...v, options: v.options.map((o, oidx) => oidx === oi ? val : o) } : v));
  const addVariantOption = (vi) => setVariants(prev => prev.map((v, idx) => idx === vi ? { ...v, options: [...v.options, ''] } : v));
  const removeVariant = (i) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return toast.error('Name, price, and category are required');
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('variants', JSON.stringify(variants));
      formData.append('existingImages', JSON.stringify(existingImages));
      images.forEach(img => formData.append('images', img));

      if (isEdit) {
        await api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created successfully!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const Input = ({ label, field, type = 'text', placeholder = '', required = false, ...props }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={form[field]} onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder} required={required} className="input" {...props} />
    </div>
  );

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <p className="text-sm text-gray-500">{isEdit ? `Editing: ${form.name}` : 'Fill in the details below'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab navigation */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'SEO & Meta' && <Globe className="w-3.5 h-3.5 inline mr-1" />}
              {t}
            </button>
          ))}
        </div>

        {/* Basic Info */}
        {tab === 'Basic Info' && (
          <div className="card p-6 space-y-5">
            <Input label="Product Name" field="name" required placeholder="e.g. Premium Wireless Headphones" />
            <div>
              <label className="label">Description<span className="text-red-400 ml-0.5">*</span></label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                rows={5} required placeholder="Detailed product description..." className="input resize-none" />
            </div>
            <div>
              <label className="label">Short Description</label>
              <textarea value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)}
                rows={2} placeholder="Brief summary shown on product cards..." className="input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price ($)" field="price" type="number" required placeholder="0.00" min="0" step="0.01" />
              <Input label="Compare Price ($)" field="comparePrice" type="number" placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category<span className="text-red-400 ml-0.5">*</span></label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} required className="input">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Subcategory" field="subcategory" placeholder="e.g. Headphones" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Brand" field="brand" placeholder="e.g. Sony" />
              <Input label="Stock" field="stock" type="number" placeholder="0" min="0" />
              <Input label="SKU" field="sku" placeholder="e.g. SKU-001" />
            </div>
            <Input label="Weight (kg)" field="weight" type="number" placeholder="0.5" min="0" step="0.01" />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm font-medium text-gray-700">Featured product</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm font-medium text-gray-700">Active (visible)</span>
              </label>
            </div>
          </div>
        )}

        {/* Images */}
        {tab === 'Images' && (
          <div className="card p-6 space-y-5">
            <div>
              <label className="label">Upload Images</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('img-upload').click()}>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB each (max 5 images)</p>
                <input id="img-upload" type="file" multiple accept="image/*" onChange={handleImageFiles} className="hidden" />
              </div>
            </div>

            {(existingImages.length > 0 || images.length > 0) && (
              <div>
                <label className="label">Product Images ({existingImages.length + images.length})</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {existingImages.map((url, i) => (
                    <div key={`existing-${i}`} className="relative group aspect-square">
                      <img src={url} className="w-full h-full object-cover rounded-xl border border-gray-200" alt="" />
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-bold">Main</span>}
                      <button type="button" onClick={() => removeExistingImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.map((file, i) => (
                    <div key={`new-${i}`} className="relative group aspect-square">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-xl border-2 border-brand-300" alt="" />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">New</span>
                      <button type="button" onClick={() => removeNewImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variants & Tags */}
        {tab === 'Variants & Tags' && (
          <div className="card p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label !mb-0">Product Variants</label>
                <button type="button" onClick={addVariant} className="btn-secondary text-xs gap-1 py-1.5 px-3">
                  <Plus className="w-3 h-3" /> Add Variant
                </button>
              </div>
              <div className="space-y-4">
                {variants.map((v, vi) => (
                  <div key={vi} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <input value={v.label} onChange={(e) => updateVariantLabel(vi, e.target.value)}
                        placeholder="Variant name (e.g. Size, Color)" className="input flex-1 text-sm" />
                      <button type="button" onClick={() => removeVariant(vi)} className="p-2 text-red-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-1">
                          <input value={opt} onChange={(e) => updateVariantOption(vi, oi, e.target.value)}
                            placeholder="Option" className="input text-sm w-24 py-1.5" />
                        </div>
                      ))}
                      <button type="button" onClick={() => addVariantOption(vi)}
                        className="px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-all">
                        + Add option
                      </button>
                    </div>
                  </div>
                ))}
                {variants.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No variants added. Click "Add Variant" to add size, color, etc.</p>
                )}
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-2"><Tag className="w-4 h-4" />Tags</label>
              <input value={form.tags} onChange={(e) => set('tags', e.target.value)}
                placeholder="wireless, headphones, audio (comma-separated)" className="input" />
              <p className="text-xs text-gray-400 mt-1">Comma-separated tags for search & filtering</p>
            </div>
          </div>
        )}

        {/* SEO & Meta */}
        {tab === 'SEO & Meta' && (
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-brand-500" />
              <h3 className="font-semibold text-gray-900">SEO & Meta Information</h3>
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-xs text-brand-700 mb-4">
              ℹ️ These fields control how your product appears in search engine results. Good SEO helps customers find your products.
            </div>

            <div>
              <label className="label">SEO Title</label>
              <input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)}
                placeholder="Product Name | Brand | Category" className="input" maxLength={70} />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Recommended: 50-70 characters</p>
                <p className={`text-xs ${form.seoTitle.length > 70 ? 'text-red-500' : 'text-gray-400'}`}>{form.seoTitle.length}/70</p>
              </div>
            </div>

            <div>
              <label className="label">Meta Description</label>
              <textarea value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)}
                rows={3} placeholder="Brief description for search results..." className="input resize-none" maxLength={160} />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Recommended: 120-160 characters</p>
                <p className={`text-xs ${form.seoDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{form.seoDescription.length}/160</p>
              </div>
            </div>

            <div>
              <label className="label">Keywords</label>
              <input value={form.seoKeywords} onChange={(e) => set('seoKeywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3" className="input" />
              <p className="text-xs text-gray-400 mt-1">Comma-separated keywords for meta tags</p>
            </div>

            {/* Preview */}
            {(form.seoTitle || form.name) && (
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Search Result Preview</p>
                <div className="font-medium text-blue-700 text-base hover:underline cursor-pointer">
                  {form.seoTitle || form.name}
                </div>
                <div className="text-green-700 text-xs mt-0.5">www.nexshop.com/products/...</div>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {form.seoDescription || form.shortDescription || form.description?.slice(0, 160)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button type="submit" disabled={saving}
            className="btn-primary gap-2 px-6 py-2.5">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/admin/products" className="btn-secondary px-6 py-2.5">Cancel</Link>
          {tab !== TABS[TABS.length - 1] && (
            <button type="button" onClick={() => setTab(TABS[TABS.indexOf(tab) + 1])}
              className="btn-ghost ml-auto text-sm text-brand-600">
              Next: {TABS[TABS.indexOf(tab) + 1]} →
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
