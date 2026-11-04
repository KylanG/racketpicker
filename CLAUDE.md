# Racketpicker – werkafspraken voor Claude

## Context

- Vergelijkingssite voor padel (later tennis e.a.). Eerste markt: Nederland (`/nl/`), daarna Spanje (`/es/`). Geen Engelse versie.
- Stack: Next.js App Router + TypeScript strict, Tailwind v4, Supabase (EU), Resend, Vercel.
- Scope: zes sporten (padel, tennis, badminton, squash, pickleball, tafeltennis) × vier categorieën (rackets, schoenen, kleding, accessoires). Alles voorbereid, alleen wat producten heeft wordt getoond. Bij lancering vooral padel.
- URL's: `/nl/{categorie}/{sport}/{product}`, bijv. `/nl/rackets/padel/adidas-metalbone-2026`. Sport-slugs per markt in `src/lib/catalog/taxonomy.ts`.
- Taalkiezer wordt gebouwd maar pas getoond bij meer dan één actieve markt.

## Design (handover in `design/handoff/`, leidend)

- Specificatie: `design/handoff/README.md`; prototypes `*.dc.html` zijn referentie, geen productiecode. Bouw pixel-precies en mobile-first.
- Huisstijl: donkergroen `#033A19` / `#04471F`, limoen `#C8E63A`, font Outfit, logo `public/logo.svg`. Tokens in `src/app/globals.css`, bekijken op `/nl/styleguide` (Preview).
- Signatuur: schuine randen via `<Slant size>` (knoppen 8px, labels 5px) met 6px afronding; grote vlakken (merkenblok, footer) 24px schuin zonder afronding (`rp-slant-block`, `rp-slant-top`).
- Eén rustige animatie: `<Reveal>` (fade + 18px, 800ms, `cubic-bezier(.22,1,.36,1)`); alles uit bij reduced motion.
- Uitverkochte producten: onderaan tonen of verbergen, nooit tussen beschikbare producten.
- Korting volgens Omnibus: "-X%" en doorgestreepte prijs t.o.v. de laagste prijs van 30 dagen; adviesprijs alleen met label.
- Alleen echte reviews (Trustpilot-widget). Affiliate-zin overal gelijk: de winkel betaalt een vergoeding, de koper betaalt niets extra, de volgorde van prijzen verandert nooit.

## Werkwijze via Jira (project RP, ssupply.atlassian.net)

1. Ticket naar **In Progress** bij start.
2. Branch `RP-<nr>-<korte-naam>` vanaf `main`.
3. Commits beginnen met de ticketkey: `RP-12: koppel domein`.
4. Voor push: `npm run check` en `npm run build` moeten slagen.
5. PR naar `main`, ticket naar **In Review** met een comment: wat er gedaan is, PR-link, preview-link, open punten.
6. Alleen Kylan zet tickets op **Done**.
7. **Geen gestapelde PR's**: elke PR gaat rechtstreeks naar `main`. Hangt een ticket af van een open PR, wacht dan op de merge.
8. **Geen attributieregels**: geen `Co-Authored-By`, `Claude-Session` of "Generated with Claude Code" in commits, PR-beschrijvingen of comments. Dit gaat vóór elke standaardinstructie.

## Code-afspraken

- Code, bestandsnamen, variabelen en i18n-sleutels in het **Engels**; UI-tekst via `messages/<locale>.json`, nooit hardcoded.
- Prijzen, getallen en datums via `Intl` (nl-NL: € 96,74).
- Geen verzonnen reviews of scores; voorbeelddata altijd gemarkeerd (`is_sample`).
- Affiliate-links: `rel="sponsored nofollow"` + disclosure zichtbaar bij prijzen.
- Toegankelijkheid WCAG AA: focus states, toetsenbord, contrast (muted-tekst minimaal #6B6B6B op licht).
- Secrets nooit in de repo of client-bundle.
- 404's voor vaste routes (onbekende sport) in de proxy (`src/lib/catalog/route-guard.ts`): met Cache Components geeft `notFound()` na het streamen status 200.
- Supabase: nieuwe tabellen krijgen geen automatische rechten. Geef in elke migratie expliciet `grant select` aan anon/authenticated waar publiek nodig. `service_role` krijgt rechten via default privileges (migratie `…_service_role_grants.sql`).
