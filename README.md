<div align="center">
  <br />
  <img src="public/og/hero.png" alt="PeerHelp" width="100%" style="border-radius:12px" />
  <br /><br />

  <h1>
    <code>Peer</code>&thinsp;<code>Help</code>&thinsp;<code>///</code>
  </h1>

  <p><strong>Buy from seniors.&ensp;Sell to juniors.</strong></p>

  <p>
    A verified-student-only campus marketplace for textbooks, notes,<br />
    lab gear, and exam essentials — exchanged on campus, with people you can actually find.
  </p>

  <br />

  [**Features**](#-feature-tour) · [**Stack**](#-tech-stack) · [**Architecture**](#-architecture-notes) · [**Running locally**](#-running-locally) · [**Roadmap**](#-roadmap)

  <br />
</div>

---

## The problem

> College textbooks aren't a software-licensing problem — they're a **logistics** problem.

The book you need is sitting on a shelf in the hostel two blocks over, owned by someone who would gladly sell it for a third of the campus-store price. You just don't know who, and they don't know you exist.

Existing solutions leak value at every step: WhatsApp groups disappear, random noticeboards go stale, seniors graduate without ever connecting to the juniors who need their stuff.

**PeerHelp is the directory + reputation layer that makes the handoff obvious.**

| What we do | What we don't do |
|---|---|
| Connect students who want to trade | Hold your money |
| Verify college identity via OTP | Act as a payment processor |
| Record reputation after trades | Allow anonymous listings |
| Surface hostel / dept metadata for quick meetups | Let outsiders browse or bid |

---

## ✦ Feature tour

<details open>
<summary><strong>Marketplace</strong></summary>

<br />

- **Books** with ISBN barcode scanner (webcam, via `@zxing/browser`) and Open Library auto-fill for cover art + title — listing a textbook takes 20 seconds.
- **Study materials** as a first-class type: `notes`, `handouts`, `past-year-questions`, `other` — with subject tagging and material-type filters.
- **Smart filters** that match how students shop: department, hostel, year of study, condition, price range, listing type, material type.
- **Image hosting** scoped per-user inside a Supabase Storage bucket. Server-side URL validation on every write — the client never gets to inject arbitrary image URLs. An `openlibrary.org` safelist covers ISBN-derived covers.

</details>

<details>
<summary><strong>Deals & listing lifecycle</strong></summary>

<br />

```
ACTIVE ──▶ RESERVED ──▶ COMPLETED
   │            │
   └────────────┴──▶ CANCELLED
```

- **Deal flow:** buyer requests → seller accepts (listing becomes `reserved`) → meet on campus → mark complete → ratings unlock.
- **Rentals** with per-day or flat pricing, security deposit, proposed start date, and duration. Start and end dates are recorded on both sides of the deal.
- **Partial lock** — once a deal is `accepted` or `completed`, the PATCH route enforces a field-level freeze:

  | Field | Locked? | Reason |
  |---|:---:|---|
  | `title`, `condition`, `price` | 🔒 | Buyer agreed to these |
  | `image_url`, `material_type`, `subject` | 🔒 | Identity fields |
  | `description`, `hostel`, `department`, `year` | ✏️ | Pickup info — seller can still coordinate |

  Violating the lock returns `HTTP 423` with a `lockedFields` payload. The UI disables locked inputs and shows an amber banner.

- **Bilateral ratings** after deal completion, surfaced on each seller's public profile card.

</details>

<details>
<summary><strong>Identity & trust</strong></summary>

<br />

- **College-email OTP verification** via Resend. Every account must prove a valid institutional address before listing or transacting. Stored in `college_verifications` with created/verified timestamps.
- **Re-verification** flow for stale records, with a `ReverifyButton` component in profile settings.
- **Durable rate limiting** — throttle state lives in the `rate_limit_attempts` Postgres table, not in memory. A serverless cold start cannot reset your counter.
- **Row-Level Security everywhere** — direct database access respects auth.uid()-scoped policies. Storage bucket policies enforce `{auth.uid()}/*` paths.

</details>

<details>
<summary><strong>Notifications</strong></summary>

<br />

- Real-time in-app notifications via a `notifications` Postgres table + Server-Sent Events stream at `/api/notifications/stream`.
- The nav bell updates live without client-side polling. Notifications are marked read on open.

</details>

---

## ⚡ Tech stack

| Layer | Choice | Notes |
|---|---|---|
| **Framework** | Next.js 16 — App Router + Turbopack | `cacheComponents: true`; partial prerendering on all dashboard routes |
| **Runtime** | React 19 | Server Components by default; `"use client"` only on forms & interactive widgets |
| **Language** | TypeScript 5 strict | DB types generated via `supabase gen types` and committed |
| **Database** | Supabase (Postgres + RLS) | 18 migrations; also handles auth, realtime, and storage |
| **Auth** | Supabase Auth + custom OTP | Standard email/password gated behind college-email OTP |
| **UI system** | shadcn/ui + Radix + Tailwind 3.4 | Design tokens, no Tailwind v4 syntax |
| **Animation** | motion (Framer Motion v12) | Hero entrance animations, no CLS |
| **Email** | Resend | OTP delivery + future transactional |
| **Barcode** | @zxing/browser | In-browser webcam ISBN scanning |

Single Vercel deploy + single Supabase project. No Redis, no queue, no background workers.

---

## 🗂 Repository layout

```
peerhelp/
│
├── app/
│   ├── (protected)/              ← Authenticated shell
│   │   ├── (dashboard)/          ← Listings, deals, profile, notifications
│   │   └── (verification)/       ← College-email OTP gate
│   ├── api/                      ← Route handlers
│   │   ├── listings/             ← create · [id] PATCH (partial lock)
│   │   ├── deals/                ← request · accept · complete · cancel
│   │   ├── ratings/              ← post-deal bilateral ratings
│   │   ├── notifications/        ← list + SSE stream
│   │   └── …
│   ├── auth/                     ← Supabase Auth pages
│   └── marketplace/              ← Public unauthenticated browse
│
├── components/
│   ├── auth/                     ← Login, sign-up, forgot-password forms
│   ├── deals/                    ← DealCard, DealActions, RatingForm
│   ├── landing/                  ← Hero, HowItWorks, MarketplacePreview, CTA
│   ├── listing/                  ← Create + Edit forms, filters, image panel,
│   │                                ISBN scanner, status actions, deal CTAs
│   ├── nav/                      ← PublicNav + AppNav
│   ├── profile/                  ← ProfileForm, ReverifyButton
│   └── ui/                       ← shadcn primitives
│
├── lib/
│   ├── listing-image.ts          ← Server-side image URL validator
│   ├── college-directory.ts      ← Static college-name lookups
│   ├── email/send-otp.ts         ← Resend integration
│   ├── rate-limit/otp.ts         ← Durable OTP throttle
│   └── supabase/                 ← client · server · proxy helpers
│
├── supabase/migrations/          ← Schema source of truth (001 → 018)
├── utils/query/                  ← Typed query helpers by domain
└── data/database.csv             ← College directory seed data
```

---

## 🏗 Architecture notes

**Server Components by default.** Data fetching happens in the Server Component that renders it. Only forms and widgets that need `onClick`/`useState` are `"use client"`. This keeps the JS bundle small and avoids waterfall fetches.

**Query helpers, not an ORM.** `utils/query/*.ts` wrap typed Supabase calls. Easy to read, RLS-friendly, zero abstraction tax. Each helper returns `{ data, error }` so call sites stay explicit.

**One source of truth for image URLs.** `lib/listing-image.ts` validates every image URL on write — rejects non-HTTPS, non-Supabase hosts (except the openlibrary.org safelist), and paths that don't start with `/storage/v1/object/public/images/{userId}/`. The client *never* writes an arbitrary URL into the database.

**Partial lock contract.** `hasBlockingDeal()` runs a COUNT query on deals with status `accepted` or `completed`. When true (or listing status is `sold`/`reserved`), the PATCH route rejects any locked-field change with `HTTP 423 Locked` + `{ code: "listing_locked", lockedFields: [...] }`. The form strips those fields client-side and disables their inputs.

**Durable rate limiting.** The `rate_limit_attempts` Postgres table stores throttle events. Serverless cold starts can't bypass limits because state is never in-process memory.

**No payments — by design.** Money flows between two students in person (cash or UPI). PeerHelp is purely a discovery and reputation layer, not a fintech product. This keeps the legal surface area near zero.

---

## 🚀 Running locally

> **Prerequisites:** Node 20+, a Supabase project, a Resend API key.

```bash
# 1. Clone and install
git clone <repo>
npm install            # pnpm / bun also work

# 2. Environment
cp .env.example .env.local
```

```ini
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

```bash
# 3. Push schema to your Supabase project
supabase link --project-ref <ref>
supabase db push

# 4. (Optional) seed the college directory
npm run import:colleges

# 5. Pull DB types into the repo
npm run types:gen

# 6. Start dev server
npm run dev
```

> ⚠️ Do **not** add `export const dynamic` or `export const runtime` to any API route. The project uses `cacheComponents: true` in `next.config.ts` — caching policy is set at the page level by Next.js.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Turbopack dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run types:gen` | Regenerate `lib/supabase/database.types.ts` from your linked project |
| `npm run import:colleges` | Seed `colleges` table from `data/database.csv` |

---

## 🗺 Roadmap

- [ ] In-app messaging between buyer and seller
- [ ] Saved searches + email digest for new matches
- [ ] Multi-campus / multi-institution support
- [ ] Mobile PWA — install prompt, offline marketplace cache
- [ ] Reputation decay so dormant profiles ease back to neutral

---

<div align="center">

**Private project.**&ensp;Source shared for portfolio review only.
Not open source — not licensed for redistribution or reuse.
Want to discuss the architecture?&ensp;Reach out directly.

</div>
