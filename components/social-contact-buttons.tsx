'use client';

import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import { toSafeExternalUrl, toWhatsAppUrl } from '@/lib/social-links';

type SocialContactButtonsProps = {
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  floating?: boolean;
};

export function SocialLinks({ instagram, facebook }: Pick<SocialContactButtonsProps, 'instagram' | 'facebook'>) {
  const links = [
    { label: 'Instagram', value: instagram, Icon: Instagram },
    { label: 'Facebook', value: facebook, Icon: Facebook },
  ].flatMap(({ label, value, Icon }) => {
    const href = toSafeExternalUrl(value);
    return href ? [{ label, href, Icon }] : [];
  });

  if (!links.length) return null;
  return (
    <div className="social-icon-links" aria-label="GiftsByRashii social links">
      {links.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Follow GiftsByRashii on ${label}`} title={label}>
          <Icon size={17} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export function WhatsAppButton({ whatsapp, floating = false }: Pick<SocialContactButtonsProps, 'whatsapp'> & { floating?: boolean }) {
  const href = toWhatsAppUrl(whatsapp);
  if (!href) return null;
  return (
    <a className={floating ? 'whatsapp-float' : 'whatsapp-link'} href={href} target="_blank" rel="noreferrer" aria-label="Chat with GiftsByRashii on WhatsApp" title="Chat on WhatsApp">
      <MessageCircle size={floating ? 24 : 17} aria-hidden="true" />
      {!floating && <span>WhatsApp</span>}
      {floating && <span>Chat with us</span>}
    </a>
  );
}

export function SocialRail({ whatsapp, instagram, facebook }: Pick<SocialContactButtonsProps, 'whatsapp' | 'instagram' | 'facebook'>) {
  const items = [
    { label: 'WhatsApp', href: toWhatsAppUrl(whatsapp), Icon: MessageCircle },
    { label: 'Instagram', href: toSafeExternalUrl(instagram), Icon: Instagram },
    { label: 'Facebook', href: toSafeExternalUrl(facebook), Icon: Facebook },
  ].filter((item): item is { label: string; href: string; Icon: typeof MessageCircle } => Boolean(item.href));
  if (!items.length) return null;
  return (
    <nav className="social-rail" aria-label="GiftsByRashii social contact links">
      <span className="social-rail-label">LET&apos;S CONNECT</span>
      {items.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`${label} GiftsByRashii`} title={label} className={`social-rail-link social-rail-${label.toLowerCase()}`}>
          <Icon size={19} aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}

export function SocialContactButtons({ whatsapp, instagram, facebook, floating = true }: SocialContactButtonsProps) {
  return <>{floating && <SocialRail whatsapp={whatsapp} instagram={instagram} facebook={facebook} />}<SocialLinks instagram={instagram} facebook={facebook} /></>;
}
