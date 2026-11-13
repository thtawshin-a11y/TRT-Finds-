import { useEffect, useState } from 'react';
import { Film, ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import {
  adminCreateCategory,
  adminCreateProduct,
  adminUpdateProduct,
  uploadMediaFile,
} from '../../lib/apiClient';
import { isSafeHttpUrl, slugify } from '../../lib/format';
import type { Category, Product, ProductFormInput, ProductSpecification } from '../../types';

interface AdminProductFormProps {
  token: string;
  categories: Category[];
  editingProduct: Product | null;
  onCategoryCreated: (cat: Category) => void;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

export function AdminProductForm({
  token,
  categories,
  editingProduct,
  onCategoryCreated,
  onSuccess,
  onCancel,
}: AdminProductFormProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);

  const [video, setVideo] = useState('');
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);

  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState('');

  const [stock, setStock] = useState('');
  const [rating, setRating] = useState('');
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);

  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title);
      setSlug(editingProduct.slug);
      setSlugEditedManually(true);
      setPrice(String(editingProduct.price));
      setOriginalPrice(
        editingProduct.originalPrice !== null && editingProduct.originalPrice !== undefined
          ? String(editingProduct.originalPrice)
          : ''
      );
      setDiscountPercent(
        editingProduct.discountPercent !== null && editingProduct.discountPercent !== undefined
          ? String(editingProduct.discountPercent)
          : ''
      );
      setDescription(editingProduct.description || '');
      setCategoryId(editingProduct.categoryId || '');
      setImages(editingProduct.images || []);
      setVideo(editingProduct.video || '');
      setColors(editingProduct.colors || []);
      setSizes(editingProduct.sizes || []);
      setStock(
        editingProduct.stock !== null && editingProduct.stock !== undefined
          ? String(editingProduct.stock)
          : ''
      );
      setRating(
        editingProduct.rating !== null && editingProduct.rating !== undefined
          ? String(editingProduct.rating)
          : ''
      );
      setSpecifications(editingProduct.specifications || []);
      setAffiliateUrl(editingProduct.affiliateUrl);
      setIsPinned(editingProduct.isPinned);
      setIsPublished(editingProduct.isPublished);
    } else {
      setTitle('');
      setSlug('');
      setSlugEditedManually(false);
      setPrice('');
      setOriginalPrice('');
      setDiscountPercent('');
      setDescription('');
      setCategoryId('');
      setImages([]);
      setVideo('');
      setColors([]);
      setSizes([]);
      setStock('');
      setRating('');
      setSpecifications([]);
      setAffiliateUrl('');
      setIsPinned(false);
      setIsPublished(true);
    }
    setError(null);
  }, [editingProduct]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugEditedManually) {
      setSlug(slugify(val));
    }
  };

  const handleImageFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);

    for (const file of files) {
      if (images.length >= 12) break;
      try {
        setImageUploadProgress(0);
        const url = await uploadMediaFile(token, file, 'image', (pct) => {
          setImageUploadProgress(pct);
        });
        setImages((prev) => [...prev, url].slice(0, 12));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed.');
      } finally {
        setImageUploadProgress(null);
      }
    }
    e.target.value = '';
  };

  const handleVideoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setVideoUploadProgress(0);
      const url = await uploadMediaFile(token, file, 'video', (pct) => {
        setVideoUploadProgress(pct);
      });
      setVideo(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video upload failed.');
    } finally {
      setVideoUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!isSafeHttpUrl(trimmed) && !trimmed.startsWith('/')) {
      setError('Image URL must begin with https://, http://, or /');
      return;
    }
    setError(null);
    setImages((prev) => [...prev, trimmed].slice(0, 12));
    setImageUrlInput('');
  };

  const handleQuickCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setError(null);
    try {
      const created = await adminCreateCategory(token, {
        name,
        sortOrder: categories.length + 1,
      });
      onCategoryCreated(created);
      setCategoryId(created.id);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    }
  };

  const addColorChip = () => {
    const val = colorInput.trim();
    if (!val) return;
    if (!colors.includes(val)) setColors((prev) => [...prev, val].slice(0, 20));
    setColorInput('');
  };

  const addSizeChip = () => {
    const val = sizeInput.trim();
    if (!val) return;
    if (!sizes.includes(val)) setSizes((prev) => [...prev, val].slice(0, 20));
    setSizeInput('');
  };

  const addSpecRow = () => {
    setSpecifications((prev) => [...prev, { label: '', value: '' }].slice(0, 30));
  };

  const submitForm = async (publishOverride?: boolean) => {
    setError(null);

    if (!title.trim()) {
      setError('Product title is required.');
      return;
    }
    const parsedPrice = Number(price);
    if (price === '' || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid price in ৳.');
      return;
    }
    if (images.length === 0) {
      setError('Please upload or add at least one product image.');
      return;
    }
    if (!isSafeHttpUrl(affiliateUrl)) {
      setError('A valid affiliate target URL (https:// or http://) is required.');
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId) || null;

    const payload: ProductFormInput = {
      title: title.trim(),
      slug: slugify(slug || title),
      price: parsedPrice,
      originalPrice: originalPrice !== '' ? Number(originalPrice) : null,
      discountPercent: discountPercent !== '' ? Number(discountPercent) : null,
      description: description.trim() ? description.trim() : null,
      categoryId: selectedCat ? selectedCat.id : null,
      categoryName: selectedCat ? selectedCat.name : null,
      images,
      video: video.trim() ? video.trim() : null,
      colors: colors.length > 0 ? colors : null,
      sizes: sizes.length > 0 ? sizes : null,
      stock: stock !== '' ? Number(stock) : null,
      rating: rating !== '' ? Number(rating) : null,
      specifications: specifications.filter((s) => s.label.trim() && s.value.trim()),
      affiliateUrl: affiliateUrl.trim(),
      isPinned,
      isPublished: publishOverride !== undefined ? publishOverride : isPublished,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await adminUpdateProduct(token, editingProduct.id, payload);
        onSuccess('Product updated successfully.');
      } else {
        await adminCreateProduct(token, payload);
        onSuccess(
          payload.isPublished ? 'Product published to storefront.' : 'Product saved as draft.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#B7C9ED]/70 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F4FC] pb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-[#101A35]">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="mt-1 text-xs text-[#1C3265]/70">
            Required: Title, Price (৳), Image, Affiliate URL. Color, size, stock, discount & category are optional.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#B7C9ED] px-4 text-xs font-medium text-[#1C3265] hover:bg-[#F1F4FC]"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
              Product Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Minimalist Aluminum Desk Lamp"
              className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                URL Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugEditedManually(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="minimalist-desk-lamp"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] bg-[#F1F4FC]/40 px-3.5 text-xs text-[#1C3265] focus:border-[#3156A5] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                Category (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-10 flex-1 rounded-xl border border-[#B7C9ED] bg-white px-3 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                >
                  <option value="">None (Uncategorized)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput((v) => !v)}
                  title="Add new category"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#B7C9ED] bg-[#F1F4FC]/60 text-[#1C3265] hover:border-[#3156A5]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {showNewCategoryInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="h-9 flex-1 rounded-full border border-[#B7C9ED] px-3.5 text-xs focus:border-[#3156A5] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleQuickCreateCategory()}
                    className="h-9 rounded-full bg-[#1C3265] px-4 text-xs font-semibold text-white hover:bg-[#101A35]"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                Price (৳) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1250"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm tabular-nums text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1C3265]">
                Original Price (৳)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="Optional"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm tabular-nums text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1C3265]">
                Discount %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="Optional"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm tabular-nums text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
              Affiliate Target URL *
            </label>
            <input
              type="url"
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="https://merchant.example.com/product?ref=trtfinds"
              className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#1C3265]">
              Description (Optional)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key highlights, build materials, and why it is a smart find..."
              className="w-full rounded-2xl border border-[#B7C9ED] p-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1C3265]">
                Stock Quantity (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Leave blank to hide"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm tabular-nums text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1C3265]">
                Rating 0–5 (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="e.g., 4.8"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm tabular-nums text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>
          </div>

          {/* Colors & Sizes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1C3265]">
                Colors (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addColorChip();
                    }
                  }}
                  placeholder="e.g., Midnight Navy"
                  className="h-9 flex-1 rounded-full border border-[#B7C9ED] px-3.5 text-xs focus:border-[#3156A5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addColorChip}
                  className="h-9 rounded-full border border-[#B7C9ED] px-3.5 text-xs font-medium text-[#1C3265] hover:bg-[#F1F4FC]"
                >
                  Add
                </button>
              </div>
              {colors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {colors.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-3 py-1 text-xs text-[#101A35]"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => setColors((prev) => prev.filter((x) => x !== c))}
                        aria-label={`Remove ${c}`}
                      >
                        <X className="h-3 w-3 text-[#6385CB] hover:text-[#101A35]" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1C3265]">
                Sizes (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSizeChip();
                    }
                  }}
                  placeholder="e.g., M, L, 42"
                  className="h-9 flex-1 rounded-full border border-[#B7C9ED] px-3.5 text-xs focus:border-[#3156A5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addSizeChip}
                  className="h-9 rounded-full border border-[#B7C9ED] px-3.5 text-xs font-medium text-[#1C3265] hover:bg-[#F1F4FC]"
                >
                  Add
                </button>
              </div>
              {sizes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sizes.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-3 py-1 text-xs text-[#101A35]"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSizes((prev) => prev.filter((x) => x !== s))}
                        aria-label={`Remove ${s}`}
                      >
                        <X className="h-3 w-3 text-[#6385CB] hover:text-[#101A35]" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-[#1C3265]">
                Additional Specifications (Optional)
              </label>
              <button
                type="button"
                onClick={addSpecRow}
                className="inline-flex items-center gap-1 rounded-full border border-[#B7C9ED] px-3 py-1 text-xs font-medium text-[#3156A5] hover:text-[#101A35]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Row</span>
              </button>
            </div>
            {specifications.length > 0 && (
              <div className="space-y-2">
                {specifications.map((spec, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) =>
                        setSpecifications((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item))
                        )
                      }
                      placeholder="Label (e.g., Material)"
                      className="h-9 flex-1 rounded-xl border border-[#B7C9ED] px-3 text-xs focus:border-[#3156A5] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) =>
                        setSpecifications((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item))
                        )
                      }
                      placeholder="Value"
                      className="h-9 flex-1 rounded-xl border border-[#B7C9ED] px-3 text-xs focus:border-[#3156A5] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecifications((prev) => prev.filter((_, i) => i !== idx))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#B7C9ED] text-[#6385CB] hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Media & Publishing Column */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/45 p-5">
            <label className="block text-xs font-semibold text-[#101A35]">
              Product Photos * ({images.length}/12)
            </label>
            <p className="mt-1 text-[11px] text-[#1C3265]/70">
              Upload multiple images from desktop or mobile gallery (JPG, PNG, WebP), or paste an image URL.
            </p>

            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#6385CB] bg-white px-4 py-6 text-center transition-colors hover:border-[#1C3265] hover:bg-[#F1F4FC]/50">
              <ImagePlus className="h-6 w-6 text-[#3156A5]" />
              <span className="text-xs font-semibold text-[#101A35]">
                Choose Photos to Upload
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                multiple
                onChange={(e) => void handleImageFilesSelected(e)}
                className="hidden"
              />
            </label>

            {imageUploadProgress !== null && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-medium text-[#1C3265]">
                  <span>Uploading photo...</span>
                  <span className="tabular-nums">{imageUploadProgress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#B7C9ED]/50">
                  <div
                    className="h-full bg-[#1C3265] transition-all"
                    style={{ width: `${imageUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="h-9 flex-1 rounded-full border border-[#B7C9ED] bg-white px-3.5 text-xs focus:border-[#3156A5] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="h-9 rounded-full border border-[#B7C9ED] bg-white px-4 text-xs font-semibold text-[#1C3265] hover:border-[#3156A5]"
              >
                Add
              </button>
            </div>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {images.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-[#B7C9ED] bg-white"
                  >
                    <img
                      src={imgUrl}
                      alt={`Product preview ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#101A35]/85 text-white opacity-90 hover:bg-[#101A35]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#101A35]/85 px-2 py-0.5 text-[9px] font-medium text-white">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#B7C9ED]/70 bg-[#F1F4FC]/45 p-5">
            <label className="block text-xs font-semibold text-[#101A35]">
              Product Video (Optional)
            </label>
            <p className="mt-1 text-[11px] text-[#1C3265]/70">
              Upload MP4, WebM, or MOV (max 50 MB), or paste a video URL.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#B7C9ED] bg-white px-4 text-xs font-semibold text-[#1C3265] hover:border-[#3156A5]">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Video</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => void handleVideoFileSelected(e)}
                  className="hidden"
                />
              </label>
              {video && (
                <button
                  type="button"
                  onClick={() => setVideo('')}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-red-200 bg-white px-3.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {videoUploadProgress !== null && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] font-medium text-[#1C3265]">
                  <span>Uploading video...</span>
                  <span className="tabular-nums">{videoUploadProgress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#B7C9ED]/50">
                  <div
                    className="h-full bg-[#1C3265] transition-all"
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <input
              type="url"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="Or paste video URL (https://...)"
              className="mt-2.5 h-9 w-full rounded-full border border-[#B7C9ED] bg-white px-3.5 text-xs focus:border-[#3156A5] focus:outline-none"
            />

            {video && (
              <div className="mt-3 flex items-center gap-2 rounded-full border border-[#B7C9ED] bg-white px-3 py-2 text-xs text-[#1C3265]">
                <Film className="h-4 w-4 shrink-0 text-[#3156A5]" />
                <span className="truncate">{video}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-[#B7C9ED]/70 bg-white p-5">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-semibold text-[#101A35]">
                  Pin to Featured Section
                </span>
                <span className="block text-[11px] text-[#1C3265]/70">
                  Highlights this product on the homepage.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 accent-[#1C3265]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-[#F1F4FC] pt-3">
              <div>
                <span className="block text-xs font-semibold text-[#101A35]">
                  Published on Storefront
                </span>
                <span className="block text-[11px] text-[#1C3265]/70">
                  Uncheck to keep as a private draft.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 accent-[#1C3265]"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={() => void submitForm(true)}
              className="h-11 flex-1 rounded-full bg-[#1C3265] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#101A35] disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : editingProduct
                  ? isPublished
                    ? 'Update & Publish'
                    : 'Publish Now'
                  : 'Publish Product'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void submitForm(false)}
              className="h-11 rounded-full border border-[#B7C9ED] bg-white px-5 text-xs font-semibold text-[#1C3265] transition-colors hover:border-[#3156A5] hover:bg-[#F1F4FC] disabled:opacity-60"
            >
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
