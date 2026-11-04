# Racketpicker

Vergelijkingssite voor padelrackets en -gear (later tennis en andere racketsporten). Start met de Nederlandse markt op `racketpicker.com/nl/`, Spanje (`/es/`) volgt.

## Stack

- **Next.js** (App Router, TypeScript strict) + **React**
- **Tailwind CSS** v4
- **Supabase** (database, EU-regio)
- **Resend** (prijsalarm, nieuwsbrief)
- **Vercel** (hosting, previews per branch)

## Lokaal starten

Vereist Node 22 (`nvm use`).

```bash
npm install
cp .env.example .env.local   # vul de waarden in
npm run dev                  # http://localhost:3000
```

## Scripts

| Script              | Wat het doet                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Ontwikkelserver                            |
| `npm run build`     | Productiebuild                             |
| `npm run lint`      | ESLint                                     |
| `npm run typecheck` | TypeScript-controle                        |
| `npm run format`    | Prettier (incl. Tailwind-klassensortering) |
| `npm run check`     | Lint + typecheck + formatcontrole          |

## Mappenstructuur

```
src/
  app/          Routes (App Router)
  components/   React-componenten (design system)
  lib/          Helpers, Supabase-clients, data-access
  i18n/         next-intl configuratie
messages/       Vertalingen per taal (nl.json, es.json)
supabase/       Migraties en seeds (vanaf RP-13)
```

## Talen en routes

- next-intl, configuratie in `src/i18n/`. Routes leven onder `src/app/[locale]/`.
- Actieve markten via `NEXT_PUBLIC_ACTIVE_LOCALES` (standaard `nl`). `/es/` geeft 404 tot `nl,es`.
- `/` stuurt door op browsertaal naar een actieve markt (anders `/nl/`).
- Interne routenamen zijn Engels, publieke slugs per taal in `routing.ts` (`/padel-rackets` → `/nl/padelrackets`, `/es/palas-de-padel`).
- Canonical + hreflang per pagina via `getAlternates()`; `x-default` wijst naar `/nl/`.
- Prijzen/datums via `useFormatter()`: `format.number(96.74, "price")` → € 96,74.

## Database (Supabase)

- Project `racketpicker` in organisatie makeupmath, regio Frankfurt (eu-central-1).
- Migraties staan in `supabase/migrations/` (SQL, op volgorde van tijdstempel).
- Tabellen worden **niet** automatisch via de API gepubliceerd: geef per tabel expliciet `grant select` + een RLS-policy.
- Types bijwerken na een migratie: `npm run db:types` (vereist `SUPABASE_ACCESS_TOKEN`).
- Clients in `src/lib/supabase/`:
  - `public.ts`: catalogusdata in Server Components, zonder cookies, cachebaar
  - `server.ts`: met cookies, voor Server Actions en Route Handlers
  - `browser.ts`: Client Components
  - `admin.ts`: secret key, omzeilt RLS, alleen voor imports en cron (`server-only`)
- Health check: `GET /api/health`.

## Omgevingsvariabelen

Zie `.env.example`. Secrets staan nooit in de repo; in Vercel per omgeving (Production / Preview / Development). `SUPABASE_SERVICE_ROLE_KEY` alleen server-side.

## Werkwijze

Werk gaat via Jira-project **RP** (ssupply.atlassian.net). Eén branch per ticket (`RP-12-korte-naam`), PR naar `main`, ticket naar _In Review_ met PR- en preview-link.
