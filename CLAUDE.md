# Racketpicker – werkafspraken voor Claude

## Context

- Vergelijkingssite voor padel (later tennis e.a.). Eerste markt: Nederland (`/nl/`), daarna Spanje (`/es/`). Geen Engelse versie.
- Stack: Next.js App Router + TypeScript strict, Tailwind v4, Supabase (EU), Resend, Vercel.
- Design: Claude Design-handover (tokens, componenten, pagina's). Bouw mobile-first.

## Werkwijze via Jira (project RP, ssupply.atlassian.net)

1. Ticket naar **In Progress** bij start.
2. Branch `RP-<nr>-<korte-naam>` vanaf `main`.
3. Commits beginnen met de ticketkey: `RP-12: koppel domein`.
4. Voor push: `npm run check` en `npm run build` moeten slagen.
5. PR naar `main`, ticket naar **In Review** met een comment: wat er gedaan is, PR-link, preview-link, open punten.
6. Alleen Kylan zet tickets op **Done**.

## Code-afspraken

- Code, bestandsnamen, variabelen en i18n-sleutels in het **Engels**; UI-tekst via `messages/<locale>.json`, nooit hardcoded.
- Prijzen, getallen en datums via `Intl` (nl-NL: € 96,74).
- Geen verzonnen reviews of scores; voorbeelddata altijd gemarkeerd (`is_sample`).
- Affiliate-links: `rel="sponsored nofollow"` + disclosure zichtbaar bij prijzen.
- Toegankelijkheid WCAG AA: focus states, toetsenbord, contrast (muted-tekst minimaal #6B6B6B op licht).
- Secrets nooit in de repo of client-bundle.
