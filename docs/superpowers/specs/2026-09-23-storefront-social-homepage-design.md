# Storefront Social Controls and Homepage Design

## Goal

Give GiftsByRashii a more complete, premium, mobile-first storefront while keeping the WhatsApp number and Instagram/Facebook destinations editable by an administrator without a deployment.

## Current Context

- The site is a Next.js App Router storefront with Supabase-backed CMS data.
- `site_settings.store.whatsapp` already stores a WhatsApp contact value.
- `site_settings.social` already stores Instagram and Facebook URL values, and the existing Store settings screen writes those values.
- The homepage already reads products, categories, testimonials, and reels from the CMS. It needs a more deliberate visual hierarchy and useful fallbacks when individual datasets are empty.

## Design

### Social and contact controls

Use the existing configuration records rather than add a second settings table or duplicate fields. The admin settings UI will make WhatsApp guidance explicit (India mobile number or full international number) and retain fields for Instagram and Facebook URLs. The storefront-config endpoint will continue exposing only the public settings needed by the storefront.

A client-side `SocialContactButtons` component will normalize a WhatsApp input by stripping non-digits and turning a ten-digit Indian number into an `https://wa.me/91...` link. It will render a fixed WhatsApp action only when a usable number exists, and Instagram/Facebook only when each configured URL is valid HTTP(S). The footer will use the same icon treatment instead of text-only links.

### Homepage composition

Keep the CMS section order and enable/disable controls as the source of truth. Improve existing section variants rather than forcing the admin to recreate content. The page will form this journey:

1. Hero slider and a compact assurance strip.
2. Visual recipient/category entry points.
3. New arrivals and bestsellers populated from active products, with graceful fallbacks.
4. Occasion and price discovery blocks.
5. A handcrafted-process editorial strip that gives richer visual rhythm without needing a new database table.
6. Existing hamper and corporate calls to action.
7. Customer notes, reels, trust promises, and newsletter.

The homepage will use small reusable section primitives, CSS grids, and horizontal overflow only where it improves small-screen browsing. CSS will respect reduced-motion preferences, preserve existing theme variables, and avoid new runtime dependencies or remote image downloads.

### Failure behavior

- Empty social fields produce no misleading link or icon.
- A malformed social URL is ignored rather than rendered as a destination.
- No WhatsApp number means no floating button.
- Empty testimonials/reels stay hidden.
- Empty categories and products retain meaningful fallback content and avoid blank storefront areas.
- CMS configuration fetch failures do not remove footer content or crash the page.

## File Boundaries

- `lib/social-links.ts`: public contact URL normalization and safe external URL filtering.
- `components/social-contact-buttons.tsx`: interactive icon presentation.
- `components/site-shell.tsx`: configuration wiring and footer/floating placement.
- `components/homepage-sections.tsx`: richer CMS section rendering.
- `app/page.tsx`: default managed sections and product subsets.
- `components/admin-config-studio.tsx`: clearer social/contact field guidance.
- `app/storefront-modern.css` and `app/responsive.css`: visual system and responsive behavior.
- Unit tests cover normalization and safe filtering without needing a browser.

## Constraints

- Next.js 16.3.2 App Router; preserve server/client component boundaries.
- No new production dependency.
- Reuse `site_settings.store` and `site_settings.social`.
- All customer-facing interactive controls need accessible names and visible focus states.
- Storefront must remain usable from 320px-wide mobile screens through desktop.
