import { HomepageSections } from '@/components/homepage-sections';
import { OfferPopup } from '@/components/offer-popup';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { getProducts } from '@/lib/catalog';
import { demoHomepageSections } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { currentTimestamp } from '@/lib/time';
import type { HomepageSection } from '@/lib/types';

const defaultSections: HomepageSection[] = [
  ...demoHomepageSections,
  { id: 'occasions', type: 'occasion_collection', title: 'Gifts for every beautiful reason', enabled: true, sortOrder: 4, config: {} },
  { id: 'prices', type: 'price_collection', title: 'Find their joy, your way', enabled: true, sortOrder: 5, config: {} },
  { id: 'hamper', type: 'custom_hamper', title: 'A hamper as unique as they are.', enabled: true, sortOrder: 6, config: {} },
  { id: 'corporate', type: 'corporate_gifting', title: 'Make work feel a little more wonderful.', enabled: true, sortOrder: 7, config: {} },
  { id: 'testimonials', type: 'testimonials', title: 'Notes that made us smile', enabled: true, sortOrder: 8, config: {} },
  { id: 'usp', type: 'usp', title: 'Why GiftsByRashii', enabled: true, sortOrder: 9, config: {} },
  { id: 'newsletter', type: 'newsletter', title: 'Be the first to know what’s worth gifting.', enabled: true, sortOrder: 10, config: {} },
];

export default async function Home() {
  const [products, supabase] = await Promise.all([getProducts(), createClient()]);
  let sections = defaultSections;
  let banners = [
    { id: 'default-1', title: 'A beautiful reason to make their day', subtitle: 'Thoughtful gifts, personalised details and an unboxing they will remember.', desktopImage: 'https://cdn.shopify.com/s/files/1/0736/0072/9280/files/The-Shine-Cheers-Set-1.webp?v=1766771998', url: '/shop' },
    { id: 'default-2', title: 'Build their dream hamper', subtitle: 'Choose the box, treats, keepsakes and your personal note.', desktopImage: 'https://cdn.shopify.com/s/files/1/0736/0072/9280/files/Five-Senses-Gift_3e424a83-3cf9-426c-8a23-a98f289505ab.webp?v=1766771999', url: '/hamper-builder' },
  ];
  let testimonials: { id: string; name: string; quote: string; rating: number }[] = [];
  let reels: { id: string; title: string; caption: string; videoUrl: string; thumbnailUrl?: string }[] = [];
  let categories: { id: string; name: string; slug: string; imageUrl?: string | null }[] = [];
  let coupons: { id: string; code: string; description: string | null; discount_type: 'percentage' | 'fixed'; value: number; minimum_amount: number }[] = [];
  if (supabase) {
    const [{ data: sectionRows }, { data: bannerRows }, { data: testimonialRows }, { data: reelRows }, { data: categoryRows }] = await Promise.all([
      supabase.from('homepage_sections').select('*').eq('is_enabled', true).order('sort_order'),
      supabase.from('banners').select('*').eq('is_enabled', true).order('sort_order'),
      supabase.from('testimonials').select('id,name,quote,rating').eq('is_enabled', true).order('sort_order').limit(8),
      supabase.from('reels').select('id,title,caption,video_url,thumbnail_url').eq('is_enabled', true).order('sort_order').limit(8),
      supabase.from('categories').select('id,name,slug,image_url').eq('is_active', true).order('sort_order').limit(12),
    ]);
    if (sectionRows?.length) {
      const managed = sectionRows.filter((row) => row.section_type !== 'rakhi_sale' && row.section_type !== 'category_circles').map((row): HomepageSection => ({ id: row.id, type: row.section_type, title: row.title ?? '', subtitle: row.subtitle ?? undefined, enabled: row.is_enabled, sortOrder: row.sort_order, config: (row.configuration ?? {}) as Record<string, unknown> }));
      const missingDefaults = defaultSections.filter((fallback) => !managed.some((section) => section.type === fallback.type));
      sections = [...managed, ...missingDefaults];
    }
    if (bannerRows?.length) banners = bannerRows.map((row) => ({ id: row.id, title: row.title ?? 'A beautiful surprise', subtitle: row.subtitle ?? undefined, desktopImage: row.desktop_image, mobileImage: row.mobile_image ?? undefined, url: row.url ?? '/shop' }));
    testimonials = (testimonialRows ?? []).map((row) => ({ id: row.id, name: row.name, quote: row.quote, rating: row.rating ?? 5 }));
    if (reelRows?.length) reels = reelRows.map((row) => ({ id: row.id, title: row.title ?? 'GiftsByRashii moment', caption: row.caption ?? '', videoUrl: row.video_url, thumbnailUrl: row.thumbnail_url ?? undefined }));
    categories = (categoryRows ?? []).map((row) => ({ id: row.id, name: row.name, slug: row.slug, imageUrl: row.image_url }));
  }
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from('coupons').select('id,code,description,discount_type,value,minimum_amount,starts_at,ends_at').eq('is_active', true).order('created_at', { ascending: false }).limit(6);
    const now = currentTimestamp();
    coupons = (data ?? []).filter((coupon) => new Date(coupon.starts_at).getTime() <= now && (!coupon.ends_at || new Date(coupon.ends_at).getTime() >= now)).map((coupon) => ({ id: coupon.id, code: coupon.code, description: coupon.description, discount_type: coupon.discount_type, value: Number(coupon.value), minimum_amount: Number(coupon.minimum_amount) }));
  }
  return <main><SiteHeader /><OfferPopup offer={coupons[0] ?? null} /><HomepageSections sections={sections} products={products} banners={banners} testimonials={testimonials} reels={reels} categories={categories} /><SiteFooter /></main>;
}
