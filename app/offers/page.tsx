import type { Metadata } from 'next';
import { CatalogPage } from '@/components/catalog-page';

export const metadata: Metadata = {
  title: 'Offers on thoughtful gifts',
  description: 'Discover the best current savings on personalised gifts, hampers and celebration-ready surprises.',
};

export default function OffersPage() {
  return <CatalogPage title="Offers worth unwrapping" description="Evergreen savings on thoughtful gifts—sorted by the biggest value first." initialSort="sale" />;
}
