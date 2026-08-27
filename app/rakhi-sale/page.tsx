import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgePercent, Gift, PackageCheck, Sparkles, Truck } from 'lucide-react';
import { CatalogBrowser } from '@/components/catalog-browser';
import { StorefrontFrame } from '@/components/site-shell';
import { getProducts } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Rakhi Sale & Festive Offers',
  description: 'Shop thoughtful Rakhi gifts, personalised hampers and festive offers from GiftsByRashii.',
};

export default async function RakhiSalePage() {
  const products = await getProducts();
  const rakhiMatches = products.filter((product) =>
    [product.category, ...product.occasions, ...product.badges]
      .some((value) => value.toLowerCase().includes('rakhi')),
  );
  const saleProducts = products
    .filter((product) => product.mrp > product.price)
    .sort((a, b) => (1 - b.price / b.mrp) - (1 - a.price / a.mrp));
  const featuredProducts = rakhiMatches.length ? rakhiMatches : (saleProducts.length ? saleProducts : products);

  return (
    <StorefrontFrame>
      <main className="rakhi-sale-page">
        <section className="rakhi-sale-hero">
          <div className="shell">
            <div className="rakhi-sale-copy">
              <nav className="breadcrumbs"><Link href="/">Home</Link> / Rakhi Sale</nav>
              <span className="eyebrow"><Sparkles />THE FESTIVE EDIT</span>
              <h1>Tie the bond.<br /><em>Send the joy.</em></h1>
              <p>Thoughtful Rakhi gifts, personalised keepsakes and celebration-ready hampers—with festive savings on selected picks.</p>
              <a href="#rakhi-offers" className="button button-primary">Explore the offers <ArrowRight /></a>
            </div>
            <div className="rakhi-hero-art" aria-hidden="true">
              <i className="rakhi-thread left" />
              <span className="rakhi-medallion"><Sparkles /><b>RAKHI</b><small>SALE</small></span>
              <i className="rakhi-thread right" />
              <span className="rakhi-gift-card"><Gift /><b>Made for your favourite person</b><small>Personal notes · Joyful packing</small></span>
              <span className="rakhi-offer-bubble"><BadgePercent /><b>Festive offers</b><small>on selected gifts</small></span>
            </div>
          </div>
        </section>

        <section className="rakhi-benefits">
          <div className="shell">
            <span><BadgePercent /><b>Festive savings</b><small>Best offers shown upfront</small></span>
            <span><Gift /><b>Gift-ready packing</b><small>Made for a lovely unboxing</small></span>
            <span><PackageCheck /><b>Carefully packed</b><small>Checked before dispatch</small></span>
            <span><Truck /><b>Pan-India delivery</b><small>Send love across the country</small></span>
          </div>
        </section>

        <section className="catalog shell rakhi-catalog" id="rakhi-offers">
          <div className="catalog-heading">
            <div><span className="eyebrow">CELEBRATION PICKS</span><h2>Rakhi offers worth unwrapping</h2><p>Choose a meaningful surprise and sort by the biggest saving.</p></div>
            <span>{featuredProducts.length} gifts</span>
          </div>
          <CatalogBrowser products={featuredProducts} initialSort="sale" />
        </section>
      </main>
    </StorefrontFrame>
  );
}
