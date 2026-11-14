import { useEffect, useState } from 'react';
import { Check, Film, ImagePlus, Plus, Trash2, Upload, X } from 'lucide-react';
import {
  adminCreateCategory,
  adminCreateProduct,
  adminUpdateProduct,
  uploadMediaFile,
} from '../../lib/apiClient';
import {
  formatColorStorageValue,
  getSwatchGradient,
  isSafeHttpUrl,
  parseColorOption,
  PRESET_COLOR_SWATCHES,
  slugify,
} from '../../lib/format';
import type {
  Category,
  ColorVariant,
  Product,
  ProductFormInput,
  ProductSpecification,
} from '../../types';

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

  // Rich per-color variant builder supporting 1, 2, or 3+ colors + bound product photos
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [colorToneCount, setColorToneCount] = useState<1 | 2 | 3>(1);
  const [colorNameInput, setColorNameInput] = useState('');
  const [colorHex1, setColorHex1] = useState('#1C3265');
  const [colorHex2, setColorHex2] = useState('#DC2626');
  const [colorHex3, setColorHex3] = useState('#F8FAFC');
  const [variantUploadId, setVariantUploadId] = useState<string | null>(null);
  const [variantUrlInputs, setVariantUrlInputs] = useState<Record<string, string>>({});

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

      if (Array.isArray(editingProduct.colorVariants) && editingProduct.colorVariants.length > 0) {
        setColorVariants(editingProduct.colorVariants);
      } else if (Array.isArray(editingProduct.colors) && editingProduct.colors.length > 0) {
        const imgs = editingProduct.images || [];
        setColorVariants(
          editingProduct.colors.map((c, idx) => {
            const parsed = parseColorOption(c);
            return {
              id: `cv_${idx}_${Date.now()}`,
              name: parsed.name,
              hexes: parsed.hexes,
              images: imgs[idx] ? [imgs[idx]] : imgs[0] ? [imgs[0]] : [],
              inStock: true,
            };
          })
        );
      } else {
        setColorVariants([]);
      }

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
      setAffiliateUrl(editingProduct.affiliateUrl || '');
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
      setColorVariants([]);
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
      if (images.length >= 24) break;
      try {
        setImageUploadProgress(0);
        const url = await uploadMediaFile(token, file, 'image', (pct) => {
          setImageUploadProgress(pct);
        });
        setImages((prev) => (prev.includes(url) ? prev : [...prev, url]).slice(0, 24));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed.');
      } finally {
        setImageUploadProgress(null);
      }
    }
    e.target.value = '';
  };

  const handleVariantFileUpload = async (
    variantId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError(null);
    setVariantUploadId(variantId);

    try {
      for (const file of files) {
        const url = await uploadMediaFile(token, file, 'image', () => {});
        setColorVariants((prev) =>
          prev.map((v) =>
            v.id === variantId
              ? { ...v, images: v.images.includes(url) ? v.images : [...v.images, url] }
              : v
          )
        );
        setImages((prev) => (prev.includes(url) ? prev : [...prev, url]).slice(0, 24));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Color photo upload failed.');
    } finally {
      setVariantUploadId(null);
      e.target.value = '';
    }
  };

  const handleAddVariantImageUrl = (variantId: string) => {
    const raw = (variantUrlInputs[variantId] || '').trim();
    if (!raw) return;
    if (!isSafeHttpUrl(raw) && !raw.startsWith('/')) {
      setError('Image URL must begin with https://, http://, or /');
      return;
    }
    setError(null);
    setColorVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, images: v.images.includes(raw) ? v.images : [...v.images, raw] }
          : v
      )
    );
    setImages((prev) => (prev.includes(raw) ? prev : [...prev, raw]).slice(0, 24));
    setVariantUrlInputs((prev) => ({ ...prev, [variantId]: '' }));
  };

  const toggleExistingImageForVariant = (variantId: string, imgUrl: string) => {
    setColorVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const exists = v.images.includes(imgUrl);
        return {
          ...v,
          images: exists ? v.images.filter((u) => u !== imgUrl) : [...v.images, imgUrl],
        };
      })
    );
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
    setImages((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]).slice(0, 24));
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

  const addColorVariant = (presetName?: string, presetHexes?: string[]) => {
    const chosenHexes =
      presetHexes ||
      (colorToneCount === 1
        ? [colorHex1]
        : colorToneCount === 2
          ? [colorHex1, colorHex2]
          : [colorHex1, colorHex2, colorHex3]);

    const cleanName = (presetName !== undefined ? presetName : colorNameInput).trim();
    const label = cleanName || chosenHexes.join(' & ');

    const newVariant: ColorVariant = {
      id: `cv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: label,
      hexes: chosenHexes,
      images: [],
      inStock: true,
    };

    setColorVariants((prev) => [...prev, newVariant].slice(0, 20));
    if (presetName === undefined) setColorNameInput('');
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

    const parsedPrice = Number(price);
    if (price === '' || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid real price in ৳.');
      return;
    }
    const trimmedAffiliateUrl = affiliateUrl.trim();
    if (trimmedAffiliateUrl && !isSafeHttpUrl(trimmedAffiliateUrl)) {
      setError('If provided, Affiliate URL must begin with https:// or http://');
      return;
    }

    // Merge all general & variant-bound images cleanly without duplicates
    const mergedImages = Array.from(
      new Set([...images, ...colorVariants.flatMap((v) => v.images)])
    ).slice(0, 24);

    // Build legacy-compatible color string array ("Name|#HEX1|#HEX2")
    const synthesizedColors = colorVariants.map((v) =>
      formatColorStorageValue(v.name, v.hexes)
    );

    const cleanTitle = title.trim() || `Curated Find ৳${Math.round(parsedPrice)}`;
    const selectedCat = categories.find((c) => c.id === categoryId) || null;

    const payload: ProductFormInput = {
      title: cleanTitle,
      slug: slugify(slug || cleanTitle),
      price: parsedPrice,
      originalPrice: originalPrice !== '' ? Number(originalPrice) : null,
      discountPercent: discountPercent !== '' ? Number(discountPercent) : null,
      description: description.trim() ? description.trim() : null,
      categoryId: selectedCat ? selectedCat.id : null,
      categoryName: selectedCat ? selectedCat.name : null,
      images: mergedImages,
      video: video.trim() ? video.trim() : null,
      colors: synthesizedColors.length > 0 ? synthesizedColors : null,
      colorVariants: colorVariants.length > 0 ? colorVariants : null,
      sizes: sizes.length > 0 ? sizes : null,
      stock: stock !== '' ? Number(stock) : null,
      rating: rating !== '' ? Number(rating) : null,
      specifications: specifications.filter((s) => s.label.trim() && s.value.trim()),
      affiliateUrl: trimmedAffiliateUrl ? trimmedAffiliateUrl : null,
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
    <div className="rounded-3xl border border-[#B7C9ED]/80 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F4FC] pb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-[#101A35]">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <p className="mt-1 text-xs font-medium text-[#1C3265]">
            Only Real Price (৳) is required. Original Price, Discount %, Title, Photos, Colors & Links are all optional and can be added or updated later.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#B7C9ED] px-4 text-xs font-semibold text-[#101A35] hover:bg-[#F1F4FC]"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
              Product Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Optional — e.g., Minimalist Aluminum Desk Lamp"
              className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                URL Slug (Optional)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugEditedManually(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="auto-generated-from-title"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] bg-[#F1F4FC]/50 px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:bg-white focus:outline-none"
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
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#B7C9ED] bg-[#F1F4FC]/60 text-[#101A35] hover:border-[#3156A5]"
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
              <label className="mb-1.5 block text-xs font-bold text-[#101A35]">
                Real Price (৳) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1250"
                className="h-10 w-full rounded-xl border-2 border-[#3156A5]/60 px-3.5 text-sm font-semibold tabular-nums text-[#101A35] focus:border-[#101A35] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#1C3265]">
                Original Price (Optional)
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
              <label className="mb-1.5 block text-xs font-semibold text-[#1C3265]">
                Discount % (Optional)
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
              Affiliate Target URL (Optional)
            </label>
            <input
              type="url"
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="Optional — https://merchant.example.com/product?ref=trtfinds"
              className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — Add build materials or key notes now or later..."
              className="w-full rounded-2xl border border-[#B7C9ED] p-3.5 text-sm text-[#101A35] focus:border-[#3156A5] focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                Stock Quantity (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Optional"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm tabular-nums text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
                Rating 0–5 (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Optional (e.g., 4.8)"
                className="h-10 w-full rounded-xl border border-[#B7C9ED] px-3.5 text-sm tabular-nums text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
            </div>
          </div>

          {/* Multi-Color & Per-Color Product Photo Builder */}
          <div className="rounded-2xl border border-[#B7C9ED] bg-[#F1F4FC]/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-[#101A35]">
                  Color Options & Linked Product Photos (Optional)
                </label>
                <p className="mt-0.5 text-[11px] text-[#1C3265]">
                  Support single, 2-color, or 3-color swatches—and attach each color&rsquo;s exact product photo.
                </p>
              </div>

              <div className="inline-flex rounded-full border border-[#B7C9ED] bg-white p-0.5 text-[11px] font-semibold">
                {([1, 2, 3] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setColorToneCount(count)}
                    className={`rounded-full px-2.5 py-1 transition-colors ${
                      colorToneCount === count
                        ? 'bg-[#101A35] text-white'
                        : 'text-[#1C3265] hover:bg-[#F1F4FC]'
                    }`}
                  >
                    {count === 1 ? 'Single' : count === 2 ? '2 Colors' : '3 Colors'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={colorHex1}
                  onChange={(e) => setColorHex1(e.target.value)}
                  title="Primary color"
                  className="h-9 w-9 cursor-pointer rounded-xl border border-[#B7C9ED] bg-white p-0.5"
                />
                {colorToneCount >= 2 && (
                  <input
                    type="color"
                    value={colorHex2}
                    onChange={(e) => setColorHex2(e.target.value)}
                    title="Second color"
                    className="h-9 w-9 cursor-pointer rounded-xl border border-[#B7C9ED] bg-white p-0.5"
                  />
                )}
                {colorToneCount >= 3 && (
                  <input
                    type="color"
                    value={colorHex3}
                    onChange={(e) => setColorHex3(e.target.value)}
                    title="Third color"
                    className="h-9 w-9 cursor-pointer rounded-xl border border-[#B7C9ED] bg-white p-0.5"
                  />
                )}
              </div>

              <input
                type="text"
                value={colorNameInput}
                onChange={(e) => setColorNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addColorVariant();
                  }
                }}
                placeholder={
                  colorToneCount === 1
                    ? 'Color name (e.g., Crimson Red)'
                    : 'Multi-color label (e.g., Blue & Red)'
                }
                className="h-9 min-w-[160px] flex-1 rounded-full border border-[#B7C9ED] bg-white px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />

              <button
                type="button"
                onClick={() => addColorVariant()}
                className="h-9 shrink-0 rounded-full bg-[#1C3265] px-4 text-xs font-semibold text-white hover:bg-[#101A35]"
              >
                + Add Color
              </button>
            </div>

            {/* Single & Multi-Color Preset Chips */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {PRESET_COLOR_SWATCHES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  title={`Add ${preset.name}`}
                  onClick={() => addColorVariant(preset.name, preset.hexes)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#B7C9ED] bg-white px-2.5 py-1 text-[11px] font-medium text-[#101A35] transition-colors hover:border-[#3156A5] hover:bg-[#F1F4FC]"
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                    style={{ background: getSwatchGradient(preset.hexes) }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Added Color Variants with Bound Product Photos & Availability */}
            {colorVariants.length > 0 && (
              <div className="mt-4 space-y-3">
                {colorVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-2xl border border-[#B7C9ED] bg-white p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-6 w-6 shrink-0 rounded-lg border border-black/15"
                          style={{ background: getSwatchGradient(variant.hexes) }}
                        />
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) =>
                            setColorVariants((prev) =>
                              prev.map((v) =>
                                v.id === variant.id ? { ...v, name: e.target.value } : v
                              )
                            )
                          }
                          className="h-8 rounded-full border border-[#B7C9ED]/80 px-3 text-xs font-bold text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setColorVariants((prev) =>
                              prev.map((v) =>
                                v.id === variant.id
                                  ? { ...v, inStock: v.inStock === false }
                                  : v
                              )
                            )
                          }
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            variant.inStock !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {variant.inStock !== false ? 'Available' : 'Out of Stock'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setColorVariants((prev) => prev.filter((v) => v.id !== variant.id))
                          }
                          aria-label={`Remove ${variant.name}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:border-red-300 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Linked Photos for this Specific Color */}
                    <div className="mt-3 rounded-xl border border-[#F1F4FC] bg-[#F1F4FC]/45 p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#101A35]">
                          Photos for {variant.name} ({variant.images.length})
                        </span>
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#B7C9ED] bg-white px-3 py-1 text-[11px] font-semibold text-[#1C3265] hover:border-[#3156A5]">
                          <Upload className="h-3 w-3" />
                          <span>
                            {variantUploadId === variant.id ? 'Uploading...' : 'Upload Photo'}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                            multiple
                            onChange={(e) => void handleVariantFileUpload(variant.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="mt-2 flex gap-1.5">
                        <input
                          type="url"
                          value={variantUrlInputs[variant.id] || ''}
                          onChange={(e) =>
                            setVariantUrlInputs((prev) => ({
                              ...prev,
                              [variant.id]: e.target.value,
                            }))
                          }
                          placeholder={`Paste ${variant.name} photo URL...`}
                          className="h-8 flex-1 rounded-full border border-[#B7C9ED] bg-white px-3 text-[11px] text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddVariantImageUrl(variant.id)}
                          className="h-8 rounded-full border border-[#B7C9ED] bg-white px-3 text-[11px] font-semibold text-[#101A35] hover:border-[#3156A5]"
                        >
                          Link
                        </button>
                      </div>

                      {variant.images.length > 0 ? (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {variant.images.map((imgUrl, idx) => (
                            <div
                              key={`${variant.id}-${idx}`}
                              className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[#B7C9ED] bg-white p-0.5"
                            >
                              <img
                                src={imgUrl}
                                alt={`${variant.name} view ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="max-h-full max-w-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => toggleExistingImageForVariant(variant.id, imgUrl)}
                                aria-label="Unlink photo"
                                className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#101A35] text-white"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] font-medium text-[#3156A5]">
                          No photo linked to {variant.name} yet—upload or tap a product photo below to bind it.
                        </p>
                      )}

                      {/* Quick-bind from already uploaded product photos */}
                      {images.length > 0 && (
                        <div className="mt-2 border-t border-[#B7C9ED]/40 pt-2">
                          <span className="mb-1 block text-[10px] font-semibold text-[#1C3265]">
                            Quick-assign from uploaded product photos:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {images.map((imgUrl, i) => {
                              const linked = variant.images.includes(imgUrl);
                              return (
                                <button
                                  key={`pick-${variant.id}-${i}`}
                                  type="button"
                                  onClick={() => toggleExistingImageForVariant(variant.id, imgUrl)}
                                  className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border p-0.5 transition-all ${
                                    linked
                                      ? 'border-[#101A35] ring-2 ring-[#3156A5]/40'
                                      : 'border-[#B7C9ED] opacity-75 hover:opacity-100'
                                  }`}
                                >
                                  <img
                                    src={imgUrl}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                  {linked && (
                                    <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#101A35] text-white">
                                      <Check className="h-2.5 w-2.5" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sizes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#101A35]">
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
                className="h-9 flex-1 rounded-full border border-[#B7C9ED] px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
              <button
                type="button"
                onClick={addSizeChip}
                className="h-9 rounded-full border border-[#B7C9ED] px-3.5 text-xs font-semibold text-[#101A35] hover:bg-[#F1F4FC]"
              >
                Add
              </button>
            </div>
            {sizes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border border-[#B7C9ED] bg-[#F1F4FC] px-3 py-1 text-xs font-medium text-[#101A35]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSizes((prev) => prev.filter((x) => x !== s))}
                      aria-label={`Remove ${s}`}
                    >
                      <X className="h-3 w-3 text-[#1C3265]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Specifications */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-[#101A35]">
                Additional Specifications (Optional)
              </label>
              <button
                type="button"
                onClick={addSpecRow}
                className="inline-flex items-center gap-1 rounded-full border border-[#B7C9ED] px-3 py-1 text-xs font-semibold text-[#1C3265] hover:text-[#101A35]"
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
                      className="h-9 flex-1 rounded-xl border border-[#B7C9ED] px-3 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
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
                      className="h-9 flex-1 rounded-xl border border-[#B7C9ED] px-3 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecifications((prev) => prev.filter((_, i) => i !== idx))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#B7C9ED] text-[#1C3265] hover:text-red-600"
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
          <div className="rounded-2xl border border-[#B7C9ED]/80 bg-[#F1F4FC]/50 p-5">
            <label className="block text-xs font-bold text-[#101A35]">
              Product Photos (Optional — {images.length}/24)
            </label>
            <p className="mt-1 text-[11px] font-medium text-[#1C3265]">
              Upload any portrait/landscape size—photos stay uncropped and can be linked directly to any color on the left.
            </p>

            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#3156A5] bg-white px-4 py-6 text-center transition-colors hover:border-[#101A35] hover:bg-[#F1F4FC]/50">
              <ImagePlus className="h-6 w-6 text-[#1C3265]" />
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
                <div className="flex justify-between text-[11px] font-semibold text-[#101A35]">
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
                className="h-9 flex-1 rounded-full border border-[#B7C9ED] bg-white px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="h-9 rounded-full border border-[#B7C9ED] bg-white px-4 text-xs font-semibold text-[#101A35] hover:border-[#3156A5]"
              >
                Add
              </button>
            </div>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {images.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#B7C9ED] bg-white p-1"
                  >
                    <img
                      src={imgUrl}
                      alt={`Product preview ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImages((prev) => prev.filter((_, i) => i !== idx));
                        setColorVariants((prev) =>
                          prev.map((v) => ({
                            ...v,
                            images: v.images.filter((u) => u !== imgUrl),
                          }))
                        );
                      }}
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#101A35]/90 text-white hover:bg-[#101A35]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#101A35]/90 px-2 py-0.5 text-[9px] font-semibold text-white">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#B7C9ED]/80 bg-[#F1F4FC]/50 p-5">
            <label className="block text-xs font-bold text-[#101A35]">
              Product Video (Optional)
            </label>
            <p className="mt-1 text-[11px] font-medium text-[#1C3265]">
              Upload MP4, WebM, or MOV (max 50 MB), or paste a video URL.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#B7C9ED] bg-white px-4 text-xs font-semibold text-[#101A35] hover:border-[#3156A5]">
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
                <div className="flex justify-between text-[11px] font-semibold text-[#101A35]">
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
              className="mt-2.5 h-9 w-full rounded-full border border-[#B7C9ED] bg-white px-3.5 text-xs text-[#101A35] focus:border-[#3156A5] focus:outline-none"
            />

            {video && (
              <div className="mt-3 flex items-center gap-2 rounded-full border border-[#B7C9ED] bg-white px-3 py-2 text-xs text-[#101A35]">
                <Film className="h-4 w-4 shrink-0 text-[#1C3265]" />
                <span className="truncate">{video}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-[#B7C9ED]/80 bg-white p-5">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold text-[#101A35]">
                  Pin to Featured Section
                </span>
                <span className="block text-[11px] font-medium text-[#1C3265]">
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
                <span className="block text-xs font-bold text-[#101A35]">
                  Published on Storefront
                </span>
                <span className="block text-[11px] font-medium text-[#1C3265]">
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
              className="h-11 rounded-full border border-[#B7C9ED] bg-white px-5 text-xs font-semibold text-[#101A35] transition-colors hover:border-[#3156A5] hover:bg-[#F1F4FC] disabled:opacity-60"
            >
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
