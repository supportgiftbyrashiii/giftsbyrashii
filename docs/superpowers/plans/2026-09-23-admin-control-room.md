# Admin Control Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the admin control room reliable for revenue, orders, manual UPI/UTR verification, customers/addresses, and DB-backed products.

**Architecture:** Keep server components and server-only Supabase service-role reads for admin pages. Add focused admin API routes for payment decisions, use Zod validation and audit logs, and keep client components limited to filters/actions. Revenue is computed from captured payments/orders in one shared server helper so dashboard and payment queue agree.

**Tech Stack:** Next.js App Router, React/TypeScript, Supabase JS, Zod, Lucide icons, existing admin CSS.

**Spec:** `docs/superpowers/specs/2026-09-23-admin-control-room-design.md`

## Global Constraints

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Manual UPI customer submission may only move payment to `authorized`; admin routes own capture/reject.
- Every admin mutation must validate admin access and write an audit log.
- Existing order/payment enum values and DB-backed catalog remain the source of truth.
- Revenue query failures must be visible, not converted to zero.

## Review Focus

- Authorized UPI payment is visible as pending and is not counted as revenue until capture — test in Task 2.
- Repeated capture/reject requests are idempotent and never double-count revenue — test in Task 2.
- Duplicate UTRs remain rejected — test in Task 2.
- Missing customer profile/address/payment joins render safe fallbacks — test in Tasks 3 and 4.
- Mobile tables and action controls remain reachable — verify in Task 5 with build/browser smoke check.

### Task 1: Shared admin operations queries and dashboard metrics

**Files:**
- Create: `lib/admin-dashboard.ts`
- Modify: `app/admin/page.tsx`
- Test: `lib/admin-dashboard.test.ts` (if the repository test runner is available; otherwise a typed executable fixture in the same task)

**Interfaces:**
- Produces `getAdminDashboardSummary(client, now)` returning `{ revenueToday, revenueMonth, capturedOrdersToday, capturedOrdersMonth, pendingUtr, pendingOrders, customers, products, lowStock, error?: string }`.
- Revenue uses captured payments/orders and the same date boundary for both cards.

- [ ] Write a failing test/fixture for an authorized manual UPI order not contributing to revenue and a captured order contributing exactly once.
- [ ] Run the test/fixture and confirm it fails against the current inline dashboard logic.
- [ ] Implement the helper with explicit Supabase errors and UTC-safe period boundaries.
- [ ] Replace inline Promise.all logic in `app/admin/page.tsx` with the helper and add cards for captured order counts and pending UTRs.
- [ ] Run typecheck and the focused test/fixture.

### Task 2: Admin UTR verification API and payment queue

**Files:**
- Create: `app/api/admin/payments/route.ts`
- Create: `components/admin-payment-queue.tsx`
- Modify: `app/admin/[...section]/page.tsx` or create `app/admin/payments/page.tsx` for a purpose-built queue
- Modify: `lib/admin-resources.ts` to link the purpose-built payments page
- Modify: `app/admin-modern.css` and `app/admin.css`
- Test: `app/api/admin/payments/route.test.ts` or a typed request fixture

**Interfaces:**
- `POST /api/admin/payments` accepts `{ paymentId: string, action: 'capture' | 'reject', note?: string }` and returns `{ ok: true, idempotent?: true }`.
- Capture updates payment to `captured`, sets `signature_verified = true`, updates order payment status to `captured`, advances status to `paid` only when still pending/payment_pending, inserts history and audit rows.
- Reject updates payment to `failed`, keeps order `payment_pending`, stores UTR verification note/timestamp in metadata, inserts history/audit rows.

- [ ] Write failing cases for capture, reject, missing payment, wrong state, duplicate UTR, and repeated capture.
- [ ] Implement Zod validation and `requireAdmin()` protection.
- [ ] Implement a single payment/order transition path with post-write reads before returning success.
- [ ] Build the queue query for submitted UTRs, customer/order context, and status badges.
- [ ] Add confirm buttons, note input, pending/success/error notices, and refresh behavior.
- [ ] Run the API fixture and verify with a read-only Supabase query against real payment rows.

### Task 3: Order list and detail operations view

**Files:**
- Modify: `app/admin/orders/page.tsx`
- Modify: `app/admin/orders/[id]/page.tsx`
- Modify: `components/admin-order-actions.tsx`
- Modify: `app/admin-modern.css` and `app/admin.css`

**Interfaces:**
- Order list filters are URL query parameters: `q`, `status`, `payment`, `from`, `to`.
- Detail renders normalized customer, address, item, payment, UTR, and history sections.

- [ ] Add failing fixture for filter parsing and safe missing-join rendering.
- [ ] Implement server-side filters and a compact filter bar with clear/reset.
- [ ] Add customer contact, address snapshot, payment metadata, UTR status, and status history to detail.
- [ ] Keep existing fulfilment status update and show its result inline.
- [ ] Run typecheck and browser smoke check for list → detail → status update.

### Task 4: Customer/address and product operations improvements

**Files:**
- Modify: `app/admin/customers/page.tsx`
- Create: `app/admin/customers/[id]/page.tsx`
- Modify: `components/admin-products-table.tsx`
- Modify: `app/admin/products/page.tsx`
- Modify: `app/admin-modern.css` and `app/admin.css`

**Interfaces:**
- Customer detail route accepts an auth user UUID and reads profiles, addresses, and orders using the service-role client after `requireAdmin()`.
- Product rows expose category/image/status/stock while retaining existing bulk API actions.

- [ ] Add failing fixture for customer totals excluding cancelled orders and rendering saved addresses.
- [ ] Implement customer detail with order links, total spend, verified state, mobile/email, and all addresses.
- [ ] Extend product select to include categories and primary media, with safe fallbacks when media is absent.
- [ ] Add search/filter controls without changing DB-backed product source.
- [ ] Run focused checks for customer totals and product row rendering.

### Task 5: Responsive polish, verification, and regression checks

**Files:**
- Modify: `app/admin.css`
- Modify: `app/admin-modern.css`
- Modify: `app/responsive.css` only if shared breakpoints need adjustment

- [ ] Add responsive rules for metric cards, queue actions, filters, detail cards, and horizontally scrollable tables.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Open local admin dashboard, payments, orders, customer detail, products pages and verify no runtime errors.
- [ ] Run read-only Supabase verification for payment/order state consistency and dashboard counts.

