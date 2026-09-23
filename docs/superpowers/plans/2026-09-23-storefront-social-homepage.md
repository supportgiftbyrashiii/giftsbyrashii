# Storefront Social Controls and Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-managed WhatsApp, Instagram, and Facebook storefront actions and make the homepage feel like a fuller premium gift store on every screen size.

**Architecture:** Keep the existing `site_settings.store` and `site_settings.social` records as the single source of truth. A focused client component will normalize public contact configuration and render safe icon controls, while the server homepage continues to supply CMS data into richer reusable visual sections.

**Tech Stack:** Next.js 16.3.2 App Router, React 19, TypeScript, Supabase, lucide-react, CSS.

**Spec:** `docs/superpowers/specs/2026-09-23-storefront-social-homepage-design.md`

## Global Constraints

- Next.js 16.3.2 App Router; preserve server/client component boundaries.
- No new production dependency.
- Reuse `site_settings.store` and `site_settings.social`.
- All customer-facing interactive controls need accessible names and visible focus states.
- Storefront must remain usable from 320px-wide mobile screens through desktop.

## Review Focus

- Ten-digit Indian WhatsApp numbers create `wa.me/91...`; unusable numbers create no control.
- `javascript:` and malformed social settings never become clickable links.
- Empty product/category data does not leave a blank homepage section.
- Fixed mobile contact controls do not obscure primary content or the viewport bottom edge.

---

### Task 1: Safe public contact utilities and controls

**Files:**
- Create: `lib/social-links.ts`
- Create: `components/social-contact-buttons.tsx`
- Create: `lib/social-links.test.ts`

**Interfaces:**
- Produces `toWhatsAppUrl(value?: string): string | null` and `toSafeExternalUrl(value?: string): string | null`.
- Produces `SocialLinks` and `WhatsAppButton` receiving public config strings.

- [ ] **Step 1: Write the failing test**

```ts
expect(toWhatsAppUrl('63751 43789')).toBe('https://wa.me/916375143789');
expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
```

- [ ] **Step 2: Run it to verify red**

Run: `npx vitest run lib/social-links.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement minimal utilities and lucide icon controls**

```ts
const digits = value?.replace(/\D/g, '') ?? '';
const normalized = digits.length === 10 ? `91${digits}` : digits;
return normalized.length >= 10 && normalized.length <= 15 ? `https://wa.me/${normalized}` : null;
```

- [ ] **Step 4: Verify green**

Run: `npx vitest run lib/social-links.test.ts && npm run typecheck`

Expected: both commands exit 0.

### Task 2: Connect live admin configuration

**Files:**
- Modify: `components/site-shell.tsx`
- Modify: `components/admin-config-studio.tsx`
- Modify: `app/storefront-modern.css`
- Modify: `app/responsive.css`

**Interfaces:**
- Consumes `SocialLinks`, `WhatsAppButton`, and existing public `StoreConfig` values.
- Produces database-backed footer social icons and a global floating WhatsApp action.

- [ ] **Step 1: Write a failing configured-contact contract test**

```ts
expect(toWhatsAppUrl({ whatsapp: '63751 43789' }.whatsapp)).toBe('https://wa.me/916375143789');
```

- [ ] **Step 2: Verify red, then wire the components**

Render `WhatsAppButton` from `config.settings?.store?.whatsapp`; replace footer social text with `SocialLinks`; make the admin labels request full profile URLs and explain WhatsApp input formats.

- [ ] **Step 3: Add responsive CSS and verify quality**

Run: `npm run lint && npm run typecheck`

Expected: both commands exit 0.

### Task 3: Enrich homepage gift discovery

**Files:**
- Create: `lib/homepage-content.ts`
- Create: `lib/homepage-content.test.ts`
- Modify: `app/page.tsx`
- Modify: `components/homepage-sections.tsx`
- Modify: `app/storefront-modern.css`
- Modify: `app/responsive.css`

**Interfaces:**
- Produces pure `selectNewArrivals(products)` and `selectBestsellers(products)` helpers.
- Consumes active products, categories, testimonials, reels, banners, and CMS sections.

- [ ] **Step 1: Write the failing selection test**

```ts
expect(selectNewArrivals([{ id: 'a' }, { id: 'b' }])).toEqual([{ id: 'a' }, { id: 'b' }]);
```

- [ ] **Step 2: Verify red, then implement the selectors and sections**

Add new-arrivals, bestsellers, and handcrafted-moments content to the current CMS section flow. Return `null` for a product section without products and keep the existing recipient fallback.

- [ ] **Step 3: Add 320px/768px/desktop CSS and verify green**

Run: `npx vitest run lib/homepage-content.test.ts && npm run lint && npm run typecheck && npm run build`

Expected: all commands exit 0.

### Task 4: Final verification

**Files:**
- Verify: `components/site-shell.tsx`
- Verify: `components/homepage-sections.tsx`
- Verify: `app/storefront-modern.css`
- Verify: `app/responsive.css`

- [ ] **Step 1: Inspect 320px, 768px, and 1440px storefront rendering**

Confirm contact buttons are reachable, icons have labels, cards do not overflow, and horizontal areas are scrollable where intended.

- [ ] **Step 2: Run the complete quality suite**

Run: `npm run lint && npm run typecheck && npm run build && git diff --check`

Expected: all commands exit 0.
