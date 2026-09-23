import type { Metadata } from 'next';
import './globals.css';
import './extended.css';
import './admin.css';
import './admin-modern.css';
import './storefront-modern.css';
import './config-studio.css';
import './json-free-ui.css';
import './responsive.css';
import './occasion-slider.css';
import { CartProvider } from '@/components/cart-provider';
import { GlobalSocialRail } from '@/components/site-shell';
import { ThemeStyle } from '@/components/theme-style';
import { getSiteUrl, getSiteUrlObject } from '@/lib/site-url';
import { OFFICIAL_STORE_DETAILS } from '@/lib/store-details';

const siteUrlObject = getSiteUrlObject();
const siteUrlString = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrlObject,
  title: { default: 'GiftsByRashii — Gifts that feel made for them', template: '%s | GiftsByRashii' },
  description: 'Thoughtful gifts, personalised hampers and joyful surprises for every person and occasion.',
  openGraph: { title: 'GiftsByRashii — Gifts that feel made for them', description: 'Thoughtful gifts, personalised hampers and joyful surprises for every person and occasion.', images: ['/og.png'], type: 'website' },
  twitter: { card: 'summary_large_image', title: 'GiftsByRashii', description: 'Thoughtful gifts for every person and occasion.', images: ['/og.png'] },
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: '/' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeStyle />
        <CartProvider>{children}</CartProvider>
        <GlobalSocialRail />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:OFFICIAL_STORE_DETAILS.legalName,alternateName:OFFICIAL_STORE_DETAILS.brandName,url:siteUrlString,logo:`${siteUrlString}/favicon.svg`,email:OFFICIAL_STORE_DETAILS.supportEmail,telephone:OFFICIAL_STORE_DETAILS.supportPhoneHref,address:{'@type':'PostalAddress',streetAddress:'4/1/24, K Sewani House, Lane Next To Mercedes Showroom, Nipania',addressLocality:'Indore',postalCode:'452010',addressRegion:'Madhya Pradesh',addressCountry:'IN'}}).replace(/</g,'\\u003c')}} />
      </body>
    </html>
  );
}
