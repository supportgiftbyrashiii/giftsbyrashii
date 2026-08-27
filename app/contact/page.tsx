import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { EnquiryForm } from '@/components/enquiry-form';
import { StorefrontFrame } from '@/components/site-shell';
import { getPublishedPage } from '@/lib/cms-pages';
import { OFFICIAL_STORE_DETAILS } from '@/lib/store-details';

export const metadata = { title: 'Contact us' };

export default async function Page() {
  const managed = await getPublishedPage('contact-us');
  const title = managed?.title ?? 'Let’s make gifting feel easy.';
  const intro = managed?.body[0] ?? 'Need help choosing, personalising or tracking a gift? Our care team would love to hear from you.';
  return <StorefrontFrame><main className="contact shell"><section><span className="eyebrow">WE’RE HERE TO HELP</span><h1>{title}</h1><p>{intro}</p><div className="contact-cards"><article><Mail /><b>Email</b><a href={`mailto:${OFFICIAL_STORE_DETAILS.supportEmail}`}>{OFFICIAL_STORE_DETAILS.supportEmail}</a></article><article><Phone /><b>Call</b><a href={`tel:${OFFICIAL_STORE_DETAILS.supportPhoneHref}`}>{OFFICIAL_STORE_DETAILS.supportPhone}</a></article><article><MessageCircle /><b>Company</b><span>{OFFICIAL_STORE_DETAILS.legalName}</span></article><article><MapPin /><b>Office</b><span>{OFFICIAL_STORE_DETAILS.address}</span></article></div></section><EnquiryForm type="contact" /></main></StorefrontFrame>;
}
