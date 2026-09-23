# Admin Control Room Reliability & Verification Design

## Goal

Make the admin panel a reliable operations workspace for revenue, orders, products, customers, delivery addresses, and manual UPI/UTR verification, with responsive UI and auditable state changes.

## Context and root cause

The dashboard currently calculates revenue only from orders whose `payment_status` is `captured`. Manual UPI checkout submits a UTR and moves the payment/order to `authorized` / `payment_pending`, but the admin panel has no verify/capture action. As a result, revenue cards do not include submitted UPI payments and pending work is not visible as a first-class queue. Several admin resource screens are generic read-only lists and do not give operators enough customer, address, payment, or order context.

## Scope

### Dashboard

- Query operational summaries from the existing `orders`, `payments`, `products`, and `profiles` tables.
- Show today and current-month captured revenue, order counts, pending UTR count, low-stock count, and customer count.
- Show query failures as an admin notice instead of silently displaying zero.
- Keep summaries server-side and force dynamic rendering so values are fresh after verification.

### Orders and order detail

- Add search/filter controls for order number, status, payment status, and date range.
- Keep existing order status updates, but show payment state and UTR verification state separately.
- Order detail must show customer identity, mobile/email, complete address snapshot, items, personalisation, totals, payment records, verification notes, and status history.
- Preserve the existing order state enum and record every admin payment/status change in `audit_logs` and `order_status_history`.

### Manual UPI verification

- Add an admin payments queue for manual UPI payments with a submitted UTR.
- Add authenticated admin API actions: verify/capture and reject, each validating the payment/order relationship and writing an audit log.
- Verify/capture sets payment `status = captured`, `signature_verified = true` for the manual verification decision, order `payment_status = captured`, and order status to `paid` unless fulfilment has already advanced.
- Reject sets payment `status = failed`, keeps the order in `payment_pending`, and stores a verification note/rejected timestamp in `gateway_metadata`.
- Prevent duplicate UTRs and make repeated verify/reject requests idempotent.

### Customers, addresses, and products

- Customer view shows verified state, email/mobile, saved addresses, order count, spend, and a link to each order.
- Product view keeps DB-backed products as the only source, adding searchable category/status/stock context, image preview, and quick links to edit/media.
- Existing generic resource management remains available for categories, coupons, reviews, CMS, and settings.

## Data flow and security

1. Admin pages call `requireAdmin()` before reading data.
2. Server components use `createAdminClient()` only on the server; service-role credentials never reach client components.
3. Mutations use `/api/admin/*` routes, validate with Zod, and write audit records with the authenticated `admin_users.id`.
4. Customer-facing UTR submission remains ownership-scoped to the signed-in user and only changes a payment to `authorized`.
5. Only an authenticated admin can transition an authorized manual UPI payment to captured or failed.

## Error handling

- Surface Supabase query/mutation errors in the admin UI with an actionable message.
- Never treat a failed revenue query as a legitimate zero.
- Return 400 for invalid input, 401/403 for missing admin access, 404 for missing order/payment, 409 for already-used UTR or incompatible state, and 503 when Supabase is unavailable.
- Audit failures must not silently hide a successful payment transition; the API should return an error if the state change or audit insert cannot be confirmed.

## UX requirements

- Use the existing GiftsByRashii berry/cream visual system, with clear captured/authorized/failed badges.
- Make tables horizontally scrollable on narrow screens and keep action buttons reachable on mobile.
- Use explicit labels: “UTR submitted”, “Verify & capture”, “Reject payment”, “Revenue from captured payments”.
- Keep destructive/revenue-changing actions behind an explicit confirmation and show an inline success/error notice.

## Verification criteria

- Dashboard shows non-zero revenue for a captured test order and separately shows an authorized UTR in the pending queue.
- Verifying a pending UTR changes payment/order state and increases the correct revenue period exactly once.
- Rejecting a UTR does not increase revenue and records a reason.
- Duplicate UTR submission is rejected; repeated verify is idempotent.
- Order detail shows address, customer, items, payment metadata, and history.
- Customer page exposes saved addresses and order links without leaking service credentials.
- Product page still reads active products from Supabase and supports existing bulk actions.
- `npm run typecheck`, `npm run lint`, `npm run build`, and a read-only Supabase verification query pass.

## Out of scope

- Replacing the payment gateway or adding automatic bank/UPI webhooks.
- Modifying public storefront checkout beyond the existing UTR handoff.
- Copying competitor content or images.
