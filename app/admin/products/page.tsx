import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminProductsTable, type AdminProductRow } from '@/components/admin-products-table';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireAdmin();
  const client = createAdminClient();
  if (!client) return <div className="admin-page"><p className="form-notice">Supabase service role is not configured.</p></div>;
  const { data, error } = await client.from('products').select('id,name,sku,price,stock,is_active,publication_status,updated_at,main_image_url,categories(name,slug),product_media(url,sort_order)').order('updated_at', { ascending: false });
  const products: AdminProductRow[] = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((product) => {
    const category = (product.categories ?? {}) as Record<string, unknown>;
    const media = ((product.product_media ?? []) as Array<Record<string, unknown>>).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
    return { id: String(product.id), name: String(product.name), sku: String(product.sku ?? '—'), price: Number(product.price), stock: Number(product.stock ?? 0), is_active: Boolean(product.is_active), publication_status: product.publication_status ? String(product.publication_status) : null, updated_at: String(product.updated_at), imageUrl: String(media[0]?.url ?? product.main_image_url ?? ''), category: String(category.name ?? 'Uncategorised') };
  });
  return <div className="admin-page"><div className="admin-title"><div><span>CATALOG</span><h1>Products</h1><p>DB-backed products, images, stock and publication state.</p></div><div className="admin-title-actions"><span className="admin-list-count">{products.length} products</span><Link href="/admin/products/new" className="button button-primary">+ Add product</Link></div></div>{error && <p className="form-notice">Products could not load: {error.message}</p>}<AdminProductsTable products={products} /></div>;
}
