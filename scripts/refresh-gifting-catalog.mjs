import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const file = fs.readFileSync('.env.local', 'utf8');
  return Object.fromEntries(file.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Supabase URL/service role key is missing from .env.local');

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=86`;
const imageSets = {
  'birthday-gifts': [image('photo-1513151233558-d860c5398176'), image('photo-1513201099705-a9746e1e201f'), image('photo-1530103862676-de8c9debad1d'), image('photo-1607082350899-7e105aa886ae')],
  'anniversary-gifts': [image('photo-1518895949257-7621c3c786d7'), image('photo-1519225421980-715cb0215aed'), image('photo-1518709268805-4e9042af9f23'), image('photo-1547887538-e3a2f32cb1cc')],
  'wedding-gifts': [image('photo-1511285560929-80b456fea0bc'), image('photo-1523438885200-e635ba2c371e'), image('photo-1520857014576-2c4f4a6e1a4f'), image('photo-1608755728617-aefab37d2edd')],
  'personalised-gifts': [image('photo-1513519245088-0e12902e5a38'), image('photo-1586023492125-27b2c045efd7'), image('photo-1549465220-1a8b9238cd48'), image('photo-1607344645866-009c320b63e0')],
  'gifts-for-her': [image('photo-1490481651871-ab68de25d43d'), image('photo-1487412720507-e7ab37603c6f'), image('photo-1511988617509-a57c8a288659'), image('photo-1525507119028-ed4c629a60a3')],
  'gifts-for-him': [image('photo-1523275335684-37898b6baf30'), image('photo-1542291026-7eec264c27ff'), image('photo-1516321318423-f06f85e504b3'), image('photo-1517248135467-4c7edcad34c4')],
  'corporate-gifts': [image('photo-1495474472287-4d71bcdd2085'), image('photo-1516321165247-4aa89a48be28'), image('photo-1516627145497-ae6968895b74'), image('photo-1541643600914-78b084683601')],
  'hampers': [image('photo-1608755728617-aefab37d2edd'), image('photo-1607082350899-7e105aa886ae'), image('photo-1513201099705-a9746e1e201f'), image('photo-1549465220-1a8b9238cd48')],
  'make-your-own-hamper': [image('photo-1607344645866-009c320b63e0'), image('photo-1608755728617-aefab37d2edd'), image('photo-1513201099705-a9746e1e201f'), image('photo-1549465220-1a8b9238cd48')],
};

const additions = [
  ['birthday-gifts', 'birthday-balloon-bloom-box', 'Birthday Balloon & Bloom Box', 1199, 1699, ['birthday', 'balloons', 'bestseller'], ['Mini balloon bouquet', 'Chocolate treats', 'Message card']],
  ['birthday-gifts', 'birthday-party-chocolate-crate', 'Birthday Party Chocolate Crate', 899, 1299, ['birthday', 'chocolates', 'new'], ['Assorted chocolates', 'Celebration card', 'Gift-ready packaging']],
  ['anniversary-gifts', 'rose-candle-anniversary-edit', 'Rose & Candle Anniversary Edit', 1399, 1999, ['anniversary', 'romantic', 'bestseller'], ['Scented candle', 'Dried rose accents', 'Love note card']],
  ['anniversary-gifts', 'love-letter-memory-hamper', 'Love Letter Memory Hamper', 1699, 2299, ['anniversary', 'personalised', 'new'], ['Memory keepsake', 'Gourmet treats', 'Personalised note']],
  ['wedding-gifts', 'wedding-wishes-floral-box', 'Wedding Wishes Floral Gift Box', 1499, 2099, ['wedding', 'flowers', 'new'], ['Floral keepsake', 'Premium chocolates', 'Congratulations card']],
  ['wedding-gifts', 'newlywed-celebration-hamper', 'Newlywed Celebration Hamper', 2299, 2999, ['wedding', 'couples', 'premium'], ['Couple keepsakes', 'Celebration treats', 'Gift wrapping']],
  ['personalised-gifts', 'name-date-wooden-frame', 'Name & Date Wooden Memory Frame', 999, 1499, ['personalised', 'photo', 'bestseller'], ['Custom names', 'Special date', 'Premium wooden frame']],
  ['personalised-gifts', 'photo-story-memory-plaque', 'Photo Story Memory Plaque', 1299, 1899, ['personalised', 'photo', 'new'], ['Photo print', 'Story message', 'Display stand']],
  ['gifts-for-her', 'self-care-petal-ritual', 'Self-Care Petal Ritual', 1299, 1799, ['for her', 'self-care', 'bestseller'], ['Bath & body treats', 'Scented candle', 'Floral packaging']],
  ['gifts-for-her', 'blush-beauty-gift-box', 'Blush Beauty Gift Box', 1599, 2199, ['for her', 'beauty', 'new'], ['Beauty essentials', 'Sweet treats', 'Gift-ready box']],
  ['gifts-for-him', 'desk-grooming-gift-kit', 'Desk & Grooming Gift Kit', 1199, 1699, ['for him', 'grooming', 'new'], ['Desk accessory', 'Grooming essentials', 'Message card']],
  ['gifts-for-him', 'classic-wallet-watch-edit', 'Classic Wallet & Watch Edit', 1899, 2599, ['for him', 'premium', 'bestseller'], ['Classic wallet', 'Statement watch', 'Premium box']],
  ['corporate-gifts', 'executive-desk-welcome-box', 'Executive Desk Welcome Box', 1499, 2099, ['corporate', 'employee gifting', 'new'], ['Desk essential', 'Coffee blend', 'Branded note card']],
  ['corporate-gifts', 'coffee-break-corporate-hamper', 'Coffee Break Corporate Hamper', 1099, 1599, ['corporate', 'hamper', 'bestseller'], ['Specialty coffee', 'Gourmet snacks', 'Thank-you card']],
  ['hampers', 'build-your-celebration-box', 'Build Your Celebration Box', 999, 1499, ['hamper', 'customisable', 'new'], ['Choose-your-own treats', 'Keepsake box', 'Personalised note']],
  ['hampers', 'pick-pack-gourmet-hamper', 'Pick & Pack Gourmet Hamper', 1799, 2499, ['hamper', 'gourmet', 'bestseller'], ['Gourmet snacks', 'Tea & coffee', 'Signature packaging']],
];

function categorySlug(row) {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  return String(category?.slug ?? '').toLowerCase();
}

function inferCategory(row) {
  const direct = categorySlug(row);
  const fromSlug = Object.keys(imageSets).find((slug) => row.slug === slug || row.slug.startsWith(`${slug}-`));
  return fromSlug || direct;
}

function imageTriplet(slug, category) {
  const set = imageSets[category] ?? imageSets.hampers;
  const offset = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % set.length;
  return [0, 1, 2].map((index) => set[(offset + index) % set.length]);
}

async function replaceMedia(productId, name, urls) {
  const removed = await supabase.from('product_media').delete().eq('product_id', productId);
  if (removed.error) throw removed.error;
  const inserted = await supabase.from('product_media').insert(urls.map((url, sort_order) => ({ product_id: productId, url, media_type: 'image', alt_text: `${name} gift image`, sort_order })));
  if (inserted.error) throw inserted.error;
}

const categorySeeds = [
  { slug: 'gifts-for-her', name: 'Gifts For Her', description: 'Thoughtful gifts, self-care edits and keepsakes for her.', image_url: image('photo-1490481651871-ab68de25d43d'), is_active: true, sort_order: 5 },
  { slug: 'gifts-for-him', name: 'Gifts For Him', description: 'Useful, stylish and personal gifts for him.', image_url: image('photo-1523275335684-37898b6baf30'), is_active: true, sort_order: 6 },
  { slug: 'corporate-gifts', name: 'Corporate Gifting', description: 'Polished gift boxes for teams, clients and milestones.', image_url: image('photo-1495474472287-4d71bcdd2085'), is_active: true, sort_order: 7 },
];
const ensuredCategories = await supabase.from('categories').upsert(categorySeeds, { onConflict: 'slug' }).select('id,slug,name');
if (ensuredCategories.error) throw ensuredCategories.error;

const { data: categories, error: categoryError } = await supabase.from('categories').select('id,slug,name').eq('is_active', true);
if (categoryError) throw categoryError;
const categoryMap = new Map((categories ?? []).map((row) => [String(row.slug).toLowerCase(), row]));
const fallbackHamper = categoryMap.get('hampers') ?? categoryMap.get('make-your-own-hamper');
if (fallbackHamper) {
  if (!categoryMap.has('hampers')) categoryMap.set('hampers', fallbackHamper);
  if (!categoryMap.has('make-your-own-hamper')) categoryMap.set('make-your-own-hamper', fallbackHamper);
}

const { data: existing, error: existingError } = await supabase.from('products').select('id,slug,name,category_id,category:categories(slug,name)').eq('is_active', true);
if (existingError) throw existingError;
let updated = 0;
for (const product of existing ?? []) {
  const category = inferCategory(product) || [...categoryMap.entries()].find(([, value]) => value.id === product.category_id)?.[0];
  if (!category || !imageSets[category]) continue;
  const categoryRow = categoryMap.get(category);
  const urls = imageTriplet(product.slug, category);
  const result = await supabase.from('products').update({ main_image_url: urls[0], ...(categoryRow ? { category_id: categoryRow.id } : {}) }).eq('id', product.id);
  if (result.error) throw result.error;
  await replaceMedia(product.id, product.name, urls);
  updated += 1;
}

let added = 0;
for (const [requestedCategory, slug, name, price, mrp, tags, whatsInside] of additions) {
  const category = categoryMap.get(requestedCategory);
  if (!category) {
    console.warn(`Skipped ${slug}: category ${requestedCategory} not found`);
    continue;
  }
  const urls = imageTriplet(slug, requestedCategory);
  const payload = {
    category_id: category.id,
    name,
    slug,
    short_description: `A thoughtful ${name.toLowerCase()} made for joyful gifting.`,
    description: `Beautifully packed by GiftsByRashii with carefully chosen details, a message card and secure pan-India delivery.`,
    sku: `GBR-${slug.toUpperCase().replaceAll('-', '').slice(0, 14)}`,
    price,
    mrp,
    cost_price: Math.round(price * 0.55),
    tax_rate: 0,
    stock: 24,
    low_stock_threshold: 5,
    is_active: true,
    is_featured: tags.includes('bestseller'),
    is_personalized: requestedCategory === 'personalised-gifts' || tags.includes('personalised'),
    is_cod_enabled: true,
    rating_average: 4.6,
    rating_count: 18,
    main_image_url: urls[0],
    tags,
    whats_inside: whatsInside,
    specifications: { care: 'Keep in a cool, dry place', dispatch: '1–2 working days', country: 'India', material: 'Gift-ready curated assortment' },
    personalization_config: requestedCategory === 'personalised-gifts' ? { enabled: true, fields: ['name', 'message', 'photo'], instructions: 'Upload a clear photo and check spellings before placing the order.', maxMessageLength: 250 } : {},
    publication_status: 'published',
    seo_title: `${name} | GiftsByRashii`,
    seo_description: `Shop ${name} with thoughtful packaging and pan-India delivery from GiftsByRashii.`,
  };
  const saved = await supabase.from('products').upsert(payload, { onConflict: 'slug' }).select('id,name').single();
  if (saved.error) throw saved.error;
  await replaceMedia(saved.data.id, saved.data.name, urls);
  added += 1;
}

const { count: activeCount, error: countError } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true);
if (countError) throw countError;
console.log(JSON.stringify({ updatedExistingImages: updated, upsertedCuratedProducts: added, activeCatalogProducts: activeCount }, null, 2));
