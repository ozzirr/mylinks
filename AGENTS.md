# AGENTS.md

## Commands
```bash
npm run dev    # Start dev server at localhost:3000
npm run build  # Production build
npm run lint   # ESLint only (no built-in typecheck)
```

## Tech Stack
- Next.js 16 (App Router) with next-intl 4 for i18n
- Tailwind CSS 4, Supabase (auth/lead storage), Zod, QRCode

## Structure
- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utilities and database client
- `src/i18n/` - i18n routing and request config
- `messages/*.json` - Translation files (en, it)
- `legacy/` - Archived/deprecated code
- `supabase/` - Database schema and migrations

## i18n
- Uses next-intl middleware. Locale routing in `src/i18n/routing.ts`
- Default locale: `'it'` (not 'en'). Prefix always included (`/it`, `/en`)
- **CRITICAL**: Use `Link` from `@/i18n/navigation`, NOT from `next/navigation`
- Messages load from `messages/{locale}.json`

## Key Patterns

### Auth Modal
Driven entirely by URL query params, NOT React state:
- `?auth=login` opens login modal
- `?auth=signup` opens signup modal
- Use `AuthTrigger` component to set the param and navigate

### Supabase
- Client returns `null` gracefully if env vars missing (app works without DB)
- `src/lib/supabase.ts` exports `getBrowserClient()` and `getServerClient()`
- Schema: `newsletter_subscribers`, `leads` tables (RLS enabled, anon insert allowed)

### Tools (QR, Paycheck, Quote)
- First use free, subsequent uses require auth (stored in localStorage)
- Lock state: `used && !authedEmail`

### Server/Client Split
- Pages like `/dashboard` use server component + `*Client.tsx` client component
- Server component calls `setRequestLocale`, client handles auth/interaction

### Static Content
- Blog: typed objects in `src/lib/blog.ts` (no CMS)
- Legal: static bilingual content in `src/lib/legal.ts`
- Both rendered by dedicated components

## Environment
Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (optional - email graceful-stubs if missing)

No test framework configured.