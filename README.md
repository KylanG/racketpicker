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

## Omgevingsvariabelen

Zie `.env.example`. Secrets staan nooit in de repo; in Vercel per omgeving (Production / Preview / Development). `SUPABASE_SERVICE_ROLE_KEY` alleen server-side.

## Werkwijze

Werk gaat via Jira-project **RP** (ssupply.atlassian.net). Eén branch per ticket (`RP-12-korte-naam`), PR naar `main`, ticket naar _In Review_ met PR- en preview-link.
