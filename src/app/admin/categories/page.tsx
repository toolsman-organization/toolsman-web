'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  FolderTree,
  Folder,
  Layers,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Check,
  CornerDownRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/admin/ImageUploader';
import { slugify } from '@/lib/utils';
import type { Category } from '@/types/database';

export default function AdminCategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [collapsedMains, setCollapsedMains] = useState<Record<string, boolean>>({});

  // Form State
  const [categoryType, setCategoryType] = useState<'main' | 'sub'>('main');
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    cloudinaryPublicId: '',
    parentId: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setCategories(data as Category[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter only top-level Main Categories (parent_id is null or empty)
  const mainCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

  // Group subcategories by parent_id
  const subcategoriesByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};
    for (const cat of categories) {
      if (cat.parent_id) {
        if (!map[cat.parent_id]) map[cat.parent_id] = [];
        map[cat.parent_id].push(cat);
      }
    }
    return map;
  }, [categories]);

  const openAddModal = (type: 'main' | 'sub' = 'main', defaultParentId = '') => {
    setEditingCategory(null);
    setCategoryType(type);
    setForm({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      cloudinaryPublicId: '',
      parentId: defaultParentId || (type === 'sub' && mainCategories.length > 0 ? mainCategories[0].id : ''),
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryType(cat.parent_id ? 'sub' : 'main');
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.image_url || '',
      cloudinaryPublicId: cat.cloudinary_public_id || '',
      parentId: cat.parent_id || (mainCategories.length > 0 ? mainCategories[0].id : ''),
      sortOrder: cat.sort_order,
      isActive: cat.is_active,
    });
    setModalOpen(true);
  };

  const toggleCollapse = (mainId: string) => {
    setCollapsedMains((prev) => ({
      ...prev,
      [mainId]: !prev[mainId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;

    if (categoryType === 'sub' && !form.parentId) {
      alert('Please select a Parent Main Category for this subcategory.');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      description: form.description?.trim() || null,
      image_url: categoryType === 'main' ? (form.imageUrl || null) : null,
      cloudinary_public_id: categoryType === 'main' ? (form.cloudinaryPublicId || null) : null,
      parent_id: categoryType === 'sub' ? form.parentId : null,
      sort_order: Number(form.sortOrder) || 0,
      is_active: form.isActive,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }

      setModalOpen(false);
      await loadCategories();
    } catch (err: unknown) {
      alert('Failed to save category: ' + ((err as Error).message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const isMain = !cat.parent_id;

    // 1. If Main Category: check for child subcategories
    if (isMain) {
      const childSubs = subcategoriesByParent[cat.id] || [];
      if (childSubs.length > 0) {
        alert(
          `Cannot delete "${cat.name}": It contains ${childSubs.length} subcategory(ies).\n\nPlease delete or move its subcategories before deleting this main category.`
        );
        return;
      }
    }

    // 2. Check if products are assigned to this category
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id);

    if (!error && count && count > 0) {
      alert(
        `Cannot delete "${cat.name}": There are ${count} product(s) assigned to this category.\n\nPlease reassign these products to another subcategory before deleting.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete ${isMain ? 'Main Category' : 'Subcategory'} "${cat.name}"?`)) {
      return;
    }

    const { error: delError } = await supabase.from('categories').delete().eq('id', cat.id);
    if (delError) {
      alert('Delete failed: ' + delError.message);
      return;
    }

    await loadCategories();
  };

  const handleToggle = async (cat: Category) => {
    await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    await loadCategories();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            2-Level Hierarchy & Organization
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Category Management ({mainCategories.length} Main · {categories.length - mainCategories.length} Sub)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Main Categories act as groupings. Products are assigned strictly to Subcategories.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openAddModal('sub')}
            disabled={mainCategories.length === 0}
            className="btn-secondary py-2.5 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title={mainCategories.length === 0 ? 'Create a Main Category first' : 'Create a new Subcategory'}
          >
            <Plus size={15} />
            <span>+ Create Subcategory</span>
          </button>

          <button
            onClick={() => openAddModal('main')}
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <FolderTree size={16} />
            <span>+ Create Main Category</span>
          </button>
        </div>
      </div>

      {/* Main Hierarchical Categories Container */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-neutral-500 mt-2 font-semibold">Loading hierarchical categories...</p>
          </div>
        ) : mainCategories.length > 0 ? (
          mainCategories.map((mainCat) => {
            const subs = subcategoriesByParent[mainCat.id] || [];
            const isCollapsed = collapsedMains[mainCat.id] || false;

            return (
              <div
                key={mainCat.id}
                className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Main Category Header Row */}
                <div className="p-4 sm:p-5 bg-neutral-50/80 border-b border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleCollapse(mainCat.id)}
                      className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors"
                      title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
                    >
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {/* Image / Icon */}
                    <div className="relative w-12 h-12 rounded-xl bg-white border border-neutral-200 p-1 shrink-0 flex items-center justify-center shadow-2xs">
                      {mainCat.image_url ? (
                        <Image src={mainCat.image_url} alt={mainCat.name} fill className="object-contain p-1" />
                      ) : (
                        <Folder className="w-6 h-6 text-orange-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-orange-600 uppercase tracking-wider bg-orange-100/70 px-2 py-0.5 rounded">
                          Main Category
                        </span>
                        <span className="text-[11px] font-bold text-neutral-500">
                          ({subs.length} {subs.length === 1 ? 'Subcategory' : 'Subcategories'})
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-neutral-950 uppercase tracking-tight truncate mt-0.5">
                        {mainCat.name}
                      </h2>
                      <span className="text-xs font-mono text-neutral-400">/{mainCat.slug}</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleToggle(mainCat)}
                      className={`status-pill text-[11px] ${
                        mainCat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {mainCat.is_active ? 'Active' : 'Hidden'}
                    </button>

                    <button
                      onClick={() => openAddModal('sub', mainCat.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Add a Subcategory to this Main Category"
                    >
                      <Plus size={14} />
                      <span className="hidden xs:inline">Add Subcategory</span>
                    </button>

                    <button
                      onClick={() => openEditModal(mainCat)}
                      className="p-2 text-neutral-600 hover:text-orange-600 rounded-lg hover:bg-neutral-100 transition-colors"
                      title="Edit Main Category"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(mainCat)}
                      className="p-2 text-neutral-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Main Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Section */}
                {!isCollapsed && (
                  <div className="p-3 sm:p-5 bg-white">
                    {subs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subs.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200 hover:border-orange-300 bg-neutral-50/50 hover:bg-orange-50/20 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 ml-1" />

                              <div className="min-w-0">
                                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                                  {sub.name}
                                </h3>
                                <p className="text-[11px] font-mono text-neutral-400 truncate">
                                  /{sub.slug}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleToggle(sub)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  sub.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {sub.is_active ? 'Active' : 'Off'}
                              </button>

                              <button
                                onClick={() => openEditModal(sub)}
                                className="p-1.5 text-neutral-500 hover:text-orange-600 rounded hover:bg-white"
                                title="Edit Subcategory"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                onClick={() => handleDelete(sub)}
                                className="p-1.5 text-neutral-500 hover:text-red-600 rounded hover:bg-white"
                                title="Delete Subcategory"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 px-4 text-center rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-xs">
                        No subcategories inside <span className="font-bold text-neutral-700">{mainCat.name}</span> yet.{' '}
                        <button
                          onClick={() => openAddModal('sub', mainCat.id)}
                          className="font-bold text-orange-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                        >
                          + Create first subcategory
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-xs">
            <FolderTree className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="font-black text-base text-neutral-800 uppercase tracking-tight">No Categories Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              Get started by creating your first Main Category (e.g. Power Tools, Hand Tools, Accessories).
            </p>
            <button onClick={() => openAddModal('main')} className="btn-primary text-xs py-2 px-4 font-bold">
              + Add First Main Category
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-4 pb-2 border-b border-neutral-200">
              {editingCategory
                ? `Edit ${categoryType === 'main' ? 'Main Category' : 'Subcategory'}`
                : `Add New ${categoryType === 'main' ? 'Main Category' : 'Subcategory'}`}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Category Type Selector (Only selectable when adding new or if switching is safe) */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Category Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType('main');
                      setForm((prev) => ({ ...prev, parentId: '' }));
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      categoryType === 'main'
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                        : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Folder size={14} />
                    <span>Main Category</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (mainCategories.length === 0) {
                        alert('You must have at least one Main Category before creating a Subcategory.');
                        return;
                      }
                      setCategoryType('sub');
                      setForm((prev) => ({
                        ...prev,
                        parentId: prev.parentId || mainCategories[0]?.id || '',
                      }));
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      categoryType === 'sub'
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                        : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Layers size={14} />
                    <span>Subcategory</span>
                  </button>
                </div>
              </div>

              {/* If Subcategory: Parent Main Category Selector */}
              {categoryType === 'sub' && (
                <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200">
                  <label className="block font-bold text-orange-950 uppercase tracking-wider mb-1">
                    Parent Main Category *
                  </label>
                  <select
                    required
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-orange-300 bg-white text-sm font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select Parent Main Category</option>
                    {mainCategories.map((main) => (
                      <option key={main.id} value={main.id}>
                        {main.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-orange-700 mt-1">
                    This subcategory will appear grouped under this Main Category.
                  </p>
                </div>
              )}

              {/* Category Name */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  {categoryType === 'main' ? 'Main Category Name *' : 'Subcategory Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-orange-500 font-semibold"
                  placeholder={categoryType === 'main' ? 'e.g. Power Tools' : 'e.g. Drills & Drivers'}
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono focus:outline-none focus:border-orange-500"
                  placeholder={categoryType === 'main' ? 'e.g. power-tools' : 'e.g. drills-drivers'}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  placeholder="Short description of this category"
                />
              </div>

              {/* Category Image — ONLY FOR MAIN CATEGORY */}
              {categoryType === 'main' && (
                <div>
                  <ImageUploader
                    label="Main Category Image / Banner"
                    value={form.imageUrl}
                    folder="toolsman/categories"
                    onChange={(url, publicId) =>
                      setForm({ ...form, imageUrl: url, cloudinaryPublicId: publicId || '' })
                    }
                  />
                </div>
              )}

              {/* Sort Order & Status */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span>Active on Store</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-2.5 font-bold shadow-md"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
