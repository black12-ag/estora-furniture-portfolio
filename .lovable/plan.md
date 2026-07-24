## 1. New route: `/sitemap` (human-readable site map)

Create `src/routes/sitemap.tsx` — separate from the SEO `sitemap.xml`.

- Groups every public route into sections: **Shop**, **Content**, **Account**, **Support & Legal**, **Auth**.
- Each row shows: page title, path, one-line description, and chips for the major CTAs on that page (e.g. Home → "Shop now", "Explore collections"; Product → "Add to cart", "Add to wishlist"; Checkout → "Continue to review", "Place order").
- Header stat strip: total pages, total CTAs, last updated (static app date).
- Admin/internal `_authenticated/admin.*` routes and dev-only routes (`admin-claim`, `coming-soon`) are excluded from the public list; a collapsible "Admin area" section lists them by name only (no link) for reference.
- `head()`: title, description, canonical `/sitemap`, `robots: noindex` optional? Keep indexable so users can find it.

## 2. New route: `/terms` (Terms of Service)

`src/routes/terms.tsx` — app-owned editable content page.

Sections: Introduction, Eligibility, Accounts, Orders & Pricing, Payments (mock/pay-later disclosure), Shipping (link to `/shipping`), Returns (link to `/returns`), Intellectual Property, Acceptable Use, Disclaimers, Limitation of Liability, Governing Law, Contact. Includes an "editable content" qualifier and an "app owner should replace with reviewed legal copy" note at the top. Matches existing `/privacy` styling.

## 3. New route: `/returns` (Returns & Refunds)

`src/routes/returns.tsx` — mirrors `/shipping` visual style.

Sections: 30-day return window, Condition requirements, How to start a return (step cards linking to `/account/orders` and `/contact`), Refund timing & method (aligned with mock/pay-later flow), Exchanges, Damaged/defective items, Non-returnable items, Contact CTA. Card-based layout with icons.

## 4. Help page FAQ section

Edit `src/routes/help.tsx`:

- Add an inline FAQ accordion (using existing `@/components/ui/accordion`) with ~8 common Q&As: order status, delivery time, returns window, mock payment explanation, cancel/edit order, account/password, promo codes, contact hours.
- Placed between the topic grid and the closing CTA.
- Anchor id `#faq` so `/help#faq` scrolls to it. Existing `/faqs` route stays; help hosts a short quick-answer set with a "See all FAQs" link.

## 5. Footer wiring

Edit `src/components/Footer.tsx`:

- Add links: **Terms** → `/terms`, **Returns** → `/returns`, **Help & FAQ** → `/help#faq`, **Site map** → `/sitemap`.
- Slot Terms + Returns into the existing legal/utility row alongside Privacy; add Site map to the same row. Help & FAQ replaces or joins the existing FAQs link in the Support column.
- Keep existing links intact.

## 6. Mobile responsiveness pass

Targeted, presentation-only fixes — no logic changes.

**Footer (`src/components/Footer.tsx`)**
- Trust strip: switch from `flex flex-wrap` to `grid grid-cols-2 sm:grid-cols-4` so 4 cards don't collapse into uneven rows on phones.
- Newsletter row: stack input + button vertically under `sm`, then row from `sm:` up; ensure input is full-width and button `w-full sm:w-auto`.
- Bottom bar (copyright + legal links): `grid grid-cols-1 gap-3 sm:flex sm:justify-between`; legal links wrap with `flex flex-wrap gap-x-4 gap-y-2`.
- Add `min-w-0` to text-bearing flex children; ensure no horizontal overflow.
- Replace any `hover:scale-*` on the "Back to top" button with `transition-colors` only so it doesn't clip inside rounded parents on mobile.

**Checkout (`src/routes/checkout.tsx`)**
- Main grid: currently `lg:grid-cols-[1fr_400px]` — keep, but ensure summary aside comes **after** the form on mobile and stacks full-width (already true; verify `order-*` not needed).
- Step header row: apply the `responsive-layout-patterns` fix — `grid grid-cols-[minmax(0,1fr)_auto]` with `min-w-0` on title block and `truncate` on the h1.
- Payment method grid: keep `sm:grid-cols-2`; on mobile stack to single column (already default).
- Review step "Final total" bar: `flex-wrap` + `gap-3` so total and "Secure checkout" don't clip on small phones.
- Sticky "Place order" button on mobile: wrap the bottom action row in a `sm:static fixed inset-x-0 bottom-0 z-30 border-t bg-background p-3 sm:p-0 sm:border-0` container with `pb-[env(safe-area-inset-bottom)]`; add `pb-24 sm:pb-0` to page wrapper to avoid overlap.
- Replace `animate-fade-in` on step panels with a transform-free fade (opacity only via a lightweight utility) so it doesn't cause a horizontal scrollbar during transition. If simpler, keep the class but wrap the panel in `overflow-hidden`.

**Account pages (`_authenticated/account.orders.tsx`, `account.orders.$id.tsx`, `account.notifications.tsx`, `account.activity.tsx`, `account.mfa-setup.tsx`)**
- Page header rows: convert `flex flex-wrap` header patterns to the grid pattern from `responsive-layout-patterns` so titles + action buttons don't clip.
- Orders list: on mobile, render as stacked cards instead of a wide table; keep table from `md:` up. If already cards, ensure `min-w-0` + `truncate` on order numbers and emails.
- Order detail: timeline + summary stack vertically on mobile; ensure gallery/summary uses `grid-cols-1 lg:grid-cols-[1fr_360px]` with correct gap.
- Filter chip rows: `flex flex-wrap gap-2` with `overflow-x-auto` fallback on very narrow screens.
- Any `hover:scale-105` on cards inside horizontally-constrained containers → replace with `hover:shadow-lg` / color transition to prevent overflow clipping.

## 7. SEO sitemap (`src/routes/sitemap[.]xml.ts`)

Add `/sitemap`, `/terms`, `/returns` entries. Leave BASE_URL placeholder as-is.

---

### Technical notes

- No new dependencies; use existing `@/components/ui/accordion` for the FAQ.
- All new pages follow existing head-meta pattern (title, description, og:title/description, canonical).
- Sitemap page's CTA counts are hard-coded from a manifest object in the same file — no runtime route-tree introspection.
- Trust-page guidance applies to Terms/Returns: app-owned qualifier at top, no certification/compliance claims.
- No changes to data, auth, or server functions.

### Files

**Create**
- `src/routes/sitemap.tsx`
- `src/routes/terms.tsx`
- `src/routes/returns.tsx`

**Edit**
- `src/routes/help.tsx` (add FAQ section + `#faq` anchor)
- `src/components/Footer.tsx` (new links + mobile grid/stack fixes)
- `src/routes/checkout.tsx` (mobile header grid, wrap total bar, sticky mobile CTA, safe fade)
- `src/routes/_authenticated/account.orders.tsx`
- `src/routes/_authenticated/account.orders.$id.tsx`
- `src/routes/_authenticated/account.notifications.tsx`
- `src/routes/_authenticated/account.activity.tsx`
- `src/routes/_authenticated/account.mfa-setup.tsx`
- `src/routes/sitemap[.]xml.ts` (add 3 new URL entries)
