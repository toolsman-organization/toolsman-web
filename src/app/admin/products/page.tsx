import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Search, Edit, Trash2, Eye, Star, Flame, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAllProductsAdmin } from '@/services/products';
import { formatCurrency } from '@/lib/utils';
import ProductTableActions from './ProductTableActions';

interface AdminProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const search = params.search;

  const { data: products, total } = await getAllProductsAdmin(page, 20, search);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Inventory & Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 uppercase tracking-tight">
            Product Management ({total})
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Search Filter Box */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-center gap-3">
        <Search size={18} className="text-neutral-400" />
        <form method="GET" action="/admin/products" className="flex-1">
          <input
            type="search"
            name="search"
            defaultValue={search || ''}
            placeholder="Search by product name or SKU code..."
            className="w-full text-xs sm:text-sm focus:outline-none text-neutral-800"
          />
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Category / Brand</th>
                  <th className="py-3 px-4">Price (₹)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Badges</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-12 h-12 rounded-lg bg-neutral-50 border border-neutral-200 p-1 flex items-center justify-center">
                        {p.primary_image_url ? (
                          <Image src={p.primary_image_url} alt={p.name} fill className="object-contain p-1" />
                        ) : (
                          <span className="text-sm">🛠️</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-neutral-900 line-clamp-1">{p.name}</div>
                      <div className="font-mono text-[10px] text-neutral-400 font-bold">SKU: {p.product_code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-700">{p.category_name || '—'}</div>
                      <div className="text-[10px] font-bold text-orange-600 uppercase">{p.brand_name || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-neutral-900">{formatCurrency(p.selling_price)}</div>
                      {p.original_price > p.selling_price && (
                        <div className="text-[10px] text-neutral-400 line-through">
                          {formatCurrency(p.original_price)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.stock_quantity <= 0 ? (
                        <span className="text-red-600 font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded">
                          Out of Stock
                        </span>
                      ) : p.stock_quantity < 5 ? (
                        <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded">
                          Low: {p.stock_quantity}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px]">
                          {p.stock_quantity} in stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {p.is_featured && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Star size={9} /> Featured
                          </span>
                        )}
                        {p.is_best_seller && (
                          <span className="bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Flame size={9} /> Best
                          </span>
                        )}
                        {p.is_new && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles size={9} /> New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`status-pill ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ProductTableActions product={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-neutral-400 text-xs">
            No products found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
