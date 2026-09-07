import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const source = 'https://giftsbyrashi.com';

function loadEnv(path) {
  const values = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    values[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function text(html = '') {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(value) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gifts';
}

function chunks(items, size = 50) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

function tagsFor(product) {
  return [...new Set([...(product.tags ?? []), 'giftsbyrashi-source'])];
}

function matchingSlugs(product, candidates) {
  const haystack = `${product.title} ${(product.tags ?? []).join(' ')} ${text(product.body_html)}`.toLowerCase();
  return candidates.filter(({ needles }) => needles.some((needle) => haystack.includes(needle))).map(({ slug: value }) => value);
}

async function fetchCatalog() {
  const products = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(`${source}/collections/all/products.json?limit=250&page=${page}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Source catalog page ${page} returned ${response.status}.`);
    const payload = await response.json();
    const items = payload.products ?? [];
    products.push(...items);
    process.stdout.write(`Fetched page ${page}: ${items.length} products\n`);
    if (items.length < 250) break;
  }
  return products;
}

const env = loadEnv('.env.local');
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase service credentials are missing in .env.local.');
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const products = await fetchCatalog();
if (products.length < 600) throw new Error(`Only ${products.length} source products were returned; import stopped to avoid a partial catalog.`);

const rakhiSectionCleanup = await db.from('homepage_sections').delete().eq('section_type', 'rakhi_sale');
if (rakhiSectionCleanup.error) throw rakhiSectionCleanup.error;
const rakhiNavCleanup = await db.from('navigation_items').delete().ilike('url', '/rakhi-sale');
if (rakhiNavCleanup.error) throw rakhiNavCleanup.error;

const bannerCandidates = [
  { query: /birthday/i, title: 'Big wishes, beautifully wrapped', subtitle: 'Birthday gifts made personal, joyful and ready to delight.', url: '/occasion/birthday' },
  { query: /anniversary|love story/i, title: 'For every chapter of your story', subtitle: 'Romantic keepsakes and hampers for the moments that matter.', url: '/occasion/anniversary' },
  { query: /wedding|bride|newly wed/i, title: 'A little magic for their forever', subtitle: 'Wedding gifts curated with warmth, elegance and care.', url: '/occasion/wedding' },
];
const sourceBanners = bannerCandidates.map((banner, index) => {
  const match = products.find((product) => banner.query.test(`${product.title} ${(product.tags ?? []).join(' ')}`) && product.images?.[0]?.src) ?? products.find((product) => product.images?.[0]?.src);
  return { ...banner, query: undefined, desktop_image: match.images[0].src, mobile_image: match.images[0].src, is_enabled: true, sort_order: index + 1 };
});
const disableBanners = await db.from('banners').update({ is_enabled: false }).eq('is_enabled', true);
if (disableBanners.error) throw disableBanners.error;
const bannerInsert = await db.from('banners').insert(sourceBanners.map((banner) => ({ title: banner.title, subtitle: banner.subtitle, url: banner.url, desktop_image: banner.desktop_image, mobile_image: banner.mobile_image, is_enabled: banner.is_enabled, sort_order: banner.sort_order })));
if (bannerInsert.error) throw bannerInsert.error;

const occasionSeeds = [
  ['Birthday', 'birthday'], ['Anniversary', 'anniversary'], ['Wedding', 'wedding'], ['Thank you', 'thank-you'], ['Congratulations', 'congratulations'], ['Just because', 'just-because'], ['New beginnings', 'new-beginnings'],
];
const recipientSeeds = [['For Her', 'for-her'], ['For Him', 'for-him'], ['For Couples', 'for-couples'], ['For Parents', 'for-parents'], ['For Bestie', 'for-bestie'], ['For Kids', 'for-kids']];

const { error: occasionSeedError } = await db.from('occasions').upsert(occasionSeeds.map(([name, value], index) => ({ name, slug: value, sort_order: index + 1, is_active: true })), { onConflict: 'slug' });
if (occasionSeedError) throw occasionSeedError;
const { error: recipientSeedError } = await db.from('recipients').upsert(recipientSeeds.map(([name, value], index) => ({ name, slug: value, sort_order: index + 1, is_active: true })), { onConflict: 'slug' });
if (recipientSeedError) throw recipientSeedError;
const { data: occasionSection } = await db.from('homepage_sections').select('id').eq('section_type', 'occasion_collection').limit(1).maybeSingle();
if (!occasionSection) {
  const { error } = await db.from('homepage_sections').insert({ section_type: 'occasion_collection', title: 'Gifts for every beautiful reason', subtitle: 'Find the feeling first. The perfect gift follows.', is_enabled: true, sort_order: 3 });
  if (error) throw error;
}

const categoryNames = [...new Set(products.map((product) => product.product_type || 'Gifts'))];
const { data: categoryRows, error: categoryError } = await db.from('categories').upsert(categoryNames.map((name, index) => ({ name, slug: `source-${slug(name)}`, description: `Products imported from Gifts By Rashi: ${name}`, is_active: true, sort_order: 50 + index })), { onConflict: 'slug' }).select('id,name');
if (categoryError) throw categoryError;
const categoryIds = new Map(categoryRows.map((row) => [row.name, row.id]));

const prepared = products.map((product) => {
  const firstVariant = product.variants?.[0] ?? {};
  const prices = (product.variants ?? []).map((variant) => Number(variant.price ?? 0)).filter(Number.isFinite);
  const comparisons = (product.variants ?? []).map((variant) => Number(variant.compare_at_price ?? 0)).filter(Number.isFinite);
  const price = Math.max(0, Math.min(...(prices.length ? prices : [0])));
  const mrp = Math.max(price, ...(comparisons.length ? comparisons : [price]));
  const description = text(product.body_html);
  return {
    sourceProduct: product,
    row: {
      category_id: categoryIds.get(product.product_type || 'Gifts') ?? null,
      name: product.title,
      slug: product.handle,
      short_description: description.slice(0, 180),
      description,
      rich_content: { sourceUrl: `${source}/products/${product.handle}`, shopifyProductId: product.id },
      sku: `GBR-SRC-${product.id}`,
      barcode: firstVariant.barcode || null,
      price,
      mrp,
      tax_rate: 18,
      stock: (product.variants ?? []).some((variant) => variant.available) ? 25 : 0,
      low_stock_threshold: 5,
      is_active: true,
      is_featured: tagsFor(product).some((tag) => /best.?seller|featured/i.test(tag)),
      is_personalized: /personali[sz]|custom|make your own/i.test(`${product.title} ${tagsFor(product).join(' ')}`),
      is_cod_enabled: true,
      main_image_url: product.images?.[0]?.src ?? '',
      tags: tagsFor(product),
      whats_inside: [],
      specifications: { vendor: product.vendor, sourceProductType: product.product_type, sourceUpdatedAt: product.updated_at },
      personalization_config: /personali[sz]|custom|make your own/i.test(product.title) ? { enabled: true, fields: ['name', 'message', 'photo'] } : {},
      publication_status: 'published',
      seo_title: `${product.title} | GiftsByRashii`,
      seo_description: description.slice(0, 155),
      created_at: product.created_at,
    },
  };
});

const imported = [];
for (const batch of chunks(prepared)) {
  const { data, error } = await db.from('products').upsert(batch.map((item) => item.row), { onConflict: 'slug' }).select('id,slug');
  if (error) throw error;
  imported.push(...data);
  process.stdout.write(`Upserted ${imported.length}/${prepared.length} products\n`);
}

const idsBySlug = new Map(imported.map((row) => [row.slug, row.id]));
const productIds = imported.map((row) => row.id);
for (const idBatch of chunks(productIds, 100)) {
  const { error } = await db.from('product_media').delete().in('product_id', idBatch);
  if (error) throw error;
}
const media = prepared.flatMap(({ sourceProduct }) => (sourceProduct.images ?? []).map((image, index) => ({ product_id: idsBySlug.get(sourceProduct.handle), url: image.src, media_type: 'image', alt_text: `${sourceProduct.title}${index ? ` gallery ${index + 1}` : ''}`, sort_order: index })).filter((item) => item.product_id));
for (const mediaBatch of chunks(media, 300)) {
  const { error } = await db.from('product_media').insert(mediaBatch);
  if (error) throw error;
}

const { data: occasionRows } = await db.from('occasions').select('id,slug');
const { data: recipientRows } = await db.from('recipients').select('id,slug');
const occasionIds = new Map((occasionRows ?? []).map((row) => [row.slug, row.id]));
const recipientIds = new Map((recipientRows ?? []).map((row) => [row.slug, row.id]));
const occasionMap = [
  { slug: 'birthday', needles: ['birthday', 'bday'] }, { slug: 'anniversary', needles: ['anniversary'] }, { slug: 'wedding', needles: ['wedding', 'bride', 'groom', 'newly wed'] }, { slug: 'thank-you', needles: ['thank you', 'gratitude'] }, { slug: 'congratulations', needles: ['congrat', 'achievement', 'graduation'] }, { slug: 'just-because', needles: ['just because', 'thinking of you'] }, { slug: 'new-beginnings', needles: ['new beginning', 'housewarming', 'new job', 'baby'] },
];
const recipientMap = [
  { slug: 'for-her', needles: ['for her', 'girlfriend', 'wife', 'sister', 'mother', 'mom', 'bride'] }, { slug: 'for-him', needles: ['for him', 'boyfriend', 'husband', 'brother', 'father', 'dad', 'groom'] }, { slug: 'for-couples', needles: ['couple', 'anniversary', 'wedding'] }, { slug: 'for-parents', needles: ['parent', 'mother', 'father', 'mom', 'dad'] }, { slug: 'for-bestie', needles: ['friend', 'bestie'] }, { slug: 'for-kids', needles: ['kid', 'child', 'boy', 'girl'] },
];
const occasionLinks = prepared.flatMap(({ sourceProduct }) => matchingSlugs(sourceProduct, occasionMap).map((value) => ({ product_id: idsBySlug.get(sourceProduct.handle), occasion_id: occasionIds.get(value) })).filter((item) => item.product_id && item.occasion_id));
const recipientLinks = prepared.flatMap(({ sourceProduct }) => matchingSlugs(sourceProduct, recipientMap).map((value) => ({ product_id: idsBySlug.get(sourceProduct.handle), recipient_id: recipientIds.get(value) })).filter((item) => item.product_id && item.recipient_id));
for (const idBatch of chunks(productIds, 100)) {
  const first = await db.from('product_occasions').delete().in('product_id', idBatch); if (first.error) throw first.error;
  const second = await db.from('product_recipients').delete().in('product_id', idBatch); if (second.error) throw second.error;
}
for (const linkBatch of chunks(occasionLinks, 500)) { const { error } = await db.from('product_occasions').upsert(linkBatch, { onConflict: 'product_id,occasion_id' }); if (error) throw error; }
for (const linkBatch of chunks(recipientLinks, 500)) { const { error } = await db.from('product_recipients').upsert(linkBatch, { onConflict: 'product_id,recipient_id' }); if (error) throw error; }

process.stdout.write(`Import complete: ${prepared.length} products, ${media.length} images, ${occasionLinks.length} occasion links, ${recipientLinks.length} recipient links.\n`);
