# Handoff: Racketpicker.com – website v1

## Overzicht
Racketpicker.com is een onafhankelijke prijsvergelijker voor rackets, schoenen, kleding en accessoires voor zes racketsporten: padel, tennis, badminton, squash, pickleball en tafeltennis. Bezoekers vergelijken prijzen bij 24+ winkels, bekijken de prijshistorie, gebruiken een keuzehulp en klikken door naar de winkel (affiliate).

Dit pakket bevat het volledige ontwerp van de eerste versie:
- homepagina;
- overzicht- en filterpagina's;
- productpagina's;
- keuzehulp;
- blog;
- infopagina's;
- favorieten;
- 404-pagina;
- doorstuurpagina;
- cookiebanner;
- gedeelde header en footer.

## Over de ontwerpbestanden
De bestanden in deze map zijn **ontwerpreferenties gemaakt in HTML**. Het zijn prototypes die laten zien hoe de site eruitziet en zich gedraagt. Het is **geen productiecode om te kopiëren**.

De opdracht is om deze ontwerpen opnieuw te bouwen in de bestaande stack:
- **React + Next.js (App Router)**
- **Tailwind CSS**
- **Supabase** (data, alerts, nieuwsbrief)
- **Vercel** (hosting)

Gebruik daarbij de gangbare patronen van die stack: server components, `next/image`, `next/link`, metadata API en route handlers.

Je opent een prototype door het `.dc.html`-bestand in een browser te openen; `support.js` moet in dezelfde map staan. Alle styling staat inline. Neem de waarden over in Tailwind (zie Design tokens). Alle data in de prototypes is voorbeelddata.

## Fidelity
**High-fidelity.** Kleuren, typografie, spacing, schuine vormen, animaties en interacties zijn definitief. Bouw ze pixel-precies na.

---

## Design tokens

### Kleuren
| Token | Hex | Gebruik |
|---|---|---|
| green-950 | `#033A19` | primair donkergroen, footer, knoppen, actieve staten |
| green-900 | `#04471F` | hero-gradient, hover op donker |
| green-800 | `#05561F` | accentgroen voor tekst/links/iconen, hover op knoppen |
| green-700 | `#07602A` | lichtste punt hero-gradient |
| green-1000 | `#02301A` | donkerste punt gradient merkenblok |
| lime | `#C8E63A` | merkaccent, primaire CTA, badges, onderstreping |
| lime-hover | `#D8F25A` | hover op limoen knoppen |
| lime-soft | `#D2EC4E` | hover op groot limoen CTA-vlak |
| ink | `#0B2A17` | hoofdtekst |
| ink-2 | `#23402E` | lopende tekst in artikelen |
| muted | `#3C5A47` | secundaire tekst |
| muted-2 | `#56695C` | meta/labels (min. 4.5:1 op wit) |
| border-strong | `#8FA595` | randen van invoervelden |
| border | `#DCE6D6` | kaart- en scheidingslijnen |
| line | `#E3EBDD` / `#EEF3EA` | subtiele lijnen, grafiekraster |
| surface | `#F3F7EE` | lichte vlakken, inactieve tabs |
| surface-2 | `#F4F7F0` | achtergrond productfoto |
| surface-hover | `#E6EFDA` | hover op lichte vlakken |
| on-dark | `#D3E3D7` / `#E2EDE5` / `#C3D5C8` / `#B7CBBC` | tekst op donkergroen |
| warn | `#8A4B1F` | "Niet op voorraad" / "Maat niet leverbaar" |
| trustpilot | `#00B67A` | alleen Trustpilot-sterren |
| overlay | `rgba(0,10,4,.9)` | achter het zoekscherm |

**Hero-gradient:** `radial-gradient(ellipse 70% 80% at 45% 45%, #07602A 0%, #04471F 60%, #033A19 100%)`. Subpagina's gebruiken `ellipse 70% 120% at 40% 20%`.

### Typografie
- **Font:** Outfit (Google Fonts) in de gewichten 400, 500, 600 en 700. Er is één font voor de hele site; het logo is een SVG.
- **H1:** `clamp(32px, 3.2vw, 46px)`, 600, line-height 1.05, letter-spacing −0.4px. Op de homepagina `clamp(36px, 3.6vw, 52px)`.
- **H2 sectie:** `clamp(28px, 2.6vw, 38px)`, 600, letter-spacing −0.3px. Op product- en subpagina's `clamp(26px, 2.4vw, 34px)`.
- **H3 kaart:** 17–22px, 600, line-height 1.25.
- **Body:** 15–17px, line-height 1.5–1.65. In artikelen 17px / 1.7.
- **Eyebrow:** 13px, 600, uppercase, letter-spacing 1.2–1.4px, kleur `#05561F`; op donker `#C8E63A`.
- **Minimale tekstgrootte:** 13px.
- Gebruik `text-wrap: balance` op koppen en `text-wrap: pretty` op alinea's.

### Signatuur: schuine randen
Dit is het herkenbare kenmerk van het merk. Bouw het als een herbruikbare utility of component.
- **Knoppen, tabs en CTA's:** `clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)`.
- **Labels en badges:** dezelfde vorm met 5px.
- **Zoekbalk:** 14px. **Aanmeldveld footer:** 12px. **Suggestiekaart:** 10px. **Grote CTA-vlakken op de homepagina:** 32px.
- **Afronding:** alle bovenstaande vormen hebben **6px afgeronde hoeken**. In het prototype rekent `reveal.js` dit runtime om naar `clip-path: path()` met kwadratische hoeken. Bouw dit in productie als een component (bijv. `<Slant size={8}>`) dat het pad berekent met een ResizeObserver, of als SVG-mask.
- **Grote vlakken zonder afronding** (merkenblok en footer): `clip-path: polygon(0 24px, 100% 0, 100% calc(100% - 24px), 0 100%)`. De footer heeft alleen een schuine bovenkant.
- **Uitzondering:** ronde elementen (hartjes, cirkel-iconen) en productkaarten blijven recht of rond.

### Spacing
- **Pagina-gutter:** `clamp(20px, 5.5vw, 80px)`.
- **Max-breedtes:** 1440px voor de container, 760px voor leesbreedte, 960px voor artikelen.
- **Sectieruimte:** 96px standaard en 136px tussen de onderste homepagina-blokken.
- **Grid-gaps:** 12, 16, 20, 24 of 32px.

### Schaduwen
- **Kaart-hover:** `0 14px 30px rgba(4,71,31,.12)`.
- **Mega menu:** `0 30px 60px rgba(0,30,10,.28)`.
- **Sticky header:** `0 10px 30px rgba(0,20,8,.25)`.
- **Cookiebanner:** `0 24px 60px rgba(0,20,8,.35)`.

### Focus (WCAG)
`:focus-visible { outline: 3px solid #0B2A17; outline-offset: 2px; box-shadow: 0 0 0 6px #C8E63A }`. Bij focus valt de clip-path weg, zodat de focusring niet wordt afgesneden.

---

## Animatie: één rustige beweging
- **Reveal:** fade in en 18px omhoog, **800ms**, `cubic-bezier(.22,1,.36,1)`. Grids verschijnen gestaffeld met 70ms per item, maximaal 8 items.
  - In het prototype werkt dit via de attributen `data-reveal` en `data-reveal-stagger` in `reveal.js`. Bouw het in productie met IntersectionObserver of Framer Motion.
- **Pijltje doordraaien** (alle ↗-pijlen in knoppen en links, `data-arrow`): bij hover schiet het pijltje rechtsboven weg en komt het linksonder terug, in 650ms.
- **Onderstreepte links** (limoen, 2px): bij hover veegt de lijn naar rechts weg en tekent hij zich opnieuw van links, in 800ms (`@keyframes rpLine`).
- **Logo-hover:** schaal 1 → 1.1 met −2° → 0.97 → 1, in 700ms.
- **Merkenblok:**
  - Elke 2,2s wisselt een willekeurig vak naar een merk dat nog niet in beeld is: het oude merk gaat omhoog uit beeld, het nieuwe komt van onderen, in 600ms.
  - Er is een pauzeerknop. Het wisselen pauzeert bij hover of focus en als het tabblad verborgen is.
- **`prefers-reduced-motion`:** alle bovenstaande animaties staan uit.

---

## Gedeelde onderdelen

### Header (`Header.dc.html`)
- **Desktop (≥960px):** logo, dan het hoofdmenu (Rackets, Schoenen, Kleding, Accessoires, Merken), dan zoeken, favorieten en de CTA.
  - De CTA is te kiezen met de prop `cta`: "Bekijk deals" (seizoen) of "Doe de keuzehulp".
  - Het actieve menu-item heeft een onderstreping van 2px in limoen.
- **Mega menu:**
  - Opent bij hover en bij klik. Het paneel is wit, met links op `#F3F7EE` de subcategorieën met een korte omschrijving en een "Twijfel je?"-keuzehulpblok. Rechts staan kolommen per merk met modellen.
  - Sluiten met Escape, door buiten het menu te klikken of door met de muis de header te verlaten.
- **Mobiel (<960px):**
  - Logo, dan zoeken, favorieten en een hamburgerknop (44px, limoen).
  - De hamburger opent een menu over het hele scherm op `#033A19`, met accordeons per categorie, taalknoppen NL/EN/ES en twee CTA's.
- **Slimme sticky header:**
  - Na 160px scrollen wordt de header `position: fixed` en compact (padding 12px), met achtergrond `#033A19` en schaduw.
  - Naar beneden scrollen verbergt hem (top −120px), een stukje omhoog scrollen toont hem weer, met een transitie van 500ms.
  - De CSS-variabele `--rp-hdr` geeft de zichtbare hoogte door aan sticky elementen: de tabbladen op de productpagina en de filterkolommen.
- **Zoekscherm:**
  - Overlay `rgba(0,10,4,.9)`, gecentreerd op 16vh vanaf de bovenkant, max-breedte 760px.
  - Bovenaan het label "Zoeken" en een sluitknop. Daaronder een schuine witte balk (14px) met vergrootglas, invoerveld van 18–24px en een limoen knop "Zoeken".
  - Suggesties verschijnen pas als je typt, maximaal 6, in een schuine kaart. Elke regel heeft een typelabel (Racket op donker, Merk op limoen, Sport op licht) en het gevonden deel vetgedrukt in groen. Onderaan staat "Alle resultaten voor …".
  - Toetsenbord: ↑ ↓ kiest, Enter opent, Esc sluit. Het veld volgt het combobox/listbox-patroon (ARIA).
- **Taal:** standaard NL. EN is een vertaling, ES staat op "Binnenkort". De keuze wordt bewaard in `localStorage` (`rp-lang`). In productie: aparte routes `/en/` en `/es/` met hreflang.

### Footer (`Footer.dc.html`)
- **Bovenkant:** 24px schuin.
- **Nieuwsbrief:**
  - Titel "Prijsdaling? Jij hoort het eerst."
  - Een schuine witte invoerbalk (12px) met envelop-icoon en een limoen knop "Aanmelden".
  - Drie voordelen met vinkje: Elke vrijdag, Alleen echte prijsdalingen, Altijd opzegbaar.
  - Een regel over de bevestigingsmail (double opt-in) met link naar de privacyverklaring.
- **Kolommen:** Vergelijken, Hulp en Racketpicker. Onder Racketpicker staat ook "Cookie-instellingen".
- **Onderbalk:** ©, taalknoppen en de affiliate-zin: "Koop je via ons, dan krijgen wij een vergoeding van de winkel. Dat kost jou niets extra."
- **Cookiebanner:**
  - Een kaart linksonder, maximaal 560px breed.
  - "Alles accepteren" en "Alleen noodzakelijk" zijn even groot. Via "Zelf kiezen" verschijnen schakelaars: Noodzakelijk (vast aan), Analytisch, Affiliate en marketing.
  - De keuze wordt bewaard in `localStorage` (`rp-cookies`). In productie: Consent Mode v2 en scripts pas laden na toestemming.

### Productkaart (overzichten)
- Wit, rand `#DCE6D6`, schaduw bij hover.
- **Foto:** vierkant, achtergrond `#F4F7F0`, afbeelding op 84% met `mix-blend-mode: multiply`.
- **Badges:** "-X%" (achtergrond `#033A19`, tekst limoen) of "Uitverkocht" (wit).
- **Hartje:** rond, 44px, rechtsboven in de foto.
- **Tekst:** merk · sport (13px uppercase), naam (h3, 17px), labels (niveau, stijl, gewicht), prijs (22px/700) met doorgestreepte oude prijs en "Bij X winkels vergeleken".
- **Knop:** "Bekijk beste prijs" (donker, schuin, limoen pijltje). Is het product uitverkocht, dan "Zet een voorraadalert" (licht).

---

## Pagina's

### 1. Homepagina (`Homepagina.dc.html`)
De volgorde van de blokken is te kiezen met de prop `volgorde`:
- **"Black Friday":** deals, dan de CTA-vlakken, dan het shopblok.
- **"Regulier":** eerst het shopblok.

De blokken:
1. **Hero:** h1, intro met "24+" in limoen, een schuine zoekbalk met suggesties, de link "Twijfel je? Doe de gratis keuzehulp" en de Black Friday-afbeelding rechts. De hero-afbeelding wisselt per seizoen.
2. **Uitgelichte deals:** filtertabs (Alles/Padel/Tennis/Badminton) en een grid van productkaarten.
3. **Twee CTA-vlakken** met 32px schuine kant: keuzehulp (limoen) en alle deals (donker).
4. **"Waar wil je beginnen?":** tabbladen Per sport (6 kaarten, 4:5) en Per categorie (4 kaarten).
5. **Zo werkt Racketpicker:** drie stappen met limoen nummerbadges 01, 02 en 03, en een link "Hoe we verdienen".
6. **Merkenblok:** 4×3 grid op donkergroen met 24px schuine boven- en onderkant. Uit 26 merken zijn er steeds 12 zichtbaar die wisselen, plus een pauzeerknop. De merklogo's komen nog, als grijze SVG's die bij hover wit worden.
7. **Prijsalert-promo:** uitleg en CTA, met een voorbeeldkaart (huidige prijs naast doelprijs).
8. **Reviews:** een Trustpilot-badge en drie reviewkaarten. **Alleen echte reviews tonen, via de Trustpilot TrustBox-widget.**
9. **Blogs & tips:** drie artikelkaarten.

### 2. Rackets-overzicht (`Rackets.dc.html`)
- **Hero:** kruimelpad, h1 en sporttabs met aantallen.
- **Layout:** een filterkolom van 260px (sticky onder `--rp-hdr`) naast het resultaat. Onder 900px zitten de filters achter een knop "Filters (n)".
- **Filters:**
  - Alleen deals, Verberg uitverkocht.
  - Merk, Prijs, Niveau, Speelstijl, Gewicht. Elke optie toont het aantal resultaten; opties met 0 zijn uitgeschakeld.
- **Boven de producten:** actieve filters als schuine labels (met ×) en sortering (populariteit, prijs ↑↓, grootste korting).
- **Weergave:** 2, 3 of 4 producten per rij, standaard 3. Er laden steeds 3 rijen tegelijk via "Meer laden", plus paginanummers.
- **Uitverkocht:** altijd onderaan de lijst, nooit tussen beschikbare producten. Met de schakelaar kun je ze verbergen.
- **Vergelijken:**
  - Kies maximaal 4 rackets; ze verschijnen in een balk onderin het scherm.
  - "Vergelijk nu" (vanaf 2 rackets) opent een vergelijkscherm over de hele pagina, met "Alleen verschillen" en een label "Beste" per rij. Sluit met Escape.
- **URL-staat** (in het prototype in de hash, in productie in het pad en de query):
  - Voorbeeld: `/rackets/padel?merk=bullpadel&niveau=gevorderd`.
  - Overige parameters: zoekterm `zoek-…`, `pagina-n` en `vergelijk-…`.
  - **Alleen belangrijke combinaties indexeerbaar** (sport, sport+merk), de rest noindex en canonical naar de basis.

### 3. Categoriepagina (`Categorie.dc.html`)
Voor Schoenen, Kleding en Accessoires, via `#schoenen/padelschoenen`.
- Typetabs en filters op Merk en (bij schoenen) "Voor" (heren/dames).
- **Schoenen:**
  - Een maatfilter als grid van 38 tot 47.
  - Met een gekozen maat toont de kaart "Jouw maat 42, 43 leverbaar", anders "Maten 40–46 · Heren".
- **Mobiel (<860px):** de filters zitten achter een knop.

### 4. Productpagina, racket (`Product.dc.html`)
Bekijk de situaties via de prop `staat`: Normaal, Uitverkocht, Eén winkel, Geen prijshistorie.
- **Bovenaan:**
  - Galerij: 4 thumbnails en een grote foto.
  - Rechts: merk · sport, h1 (met de merknaam, verborgen voor zicht maar leesbaar voor zoekmachines), labels.
  - **Prijsblok:** laagste prijs bij [winkel] (40px/700) met doorgestreepte adviesprijs en het label "Laagste prijs in 90 dagen".
  - **Besparing:** "Je bespaart €X op de adviesprijs" en "tot €Y t.o.v. de duurste winkel".
  - Levertijd en verzending, de limoen CTA "Bekijk bij [winkel]", het hartje en "Bekijk alle X winkels".
  - **Prijsalert:** doelprijs en e-mailadres, met toestemmingstekst. Is het product uitverkocht, dan wordt het een voorraadalert.
- **Sticky tabbalk:** Prijzen, Prijshistorie, Over dit racket, Specificaties, Vragen, Vergelijkbaar.
- **Prijzen per winkel:**
  - Een schakelaar "Inclusief verzendkosten" sorteert de lijst opnieuw.
  - Per rij: naam, "Beste deal" of "€X duurder", prijs, verzending, levertijd en "Bekijk bij winkel".
  - Uitverkochte winkels staan onderaan op 50% met "Uitverkocht".
- **Prijshistorie:**
  - Periode van 90 dagen, 6 maanden of 1 jaar.
  - Vier statistieken (nu, laagste, gemiddeld, hoogste) en een SVG-lijngrafiek met vlakvulling.
  - De y-as heeft ronde bedragen in stappen van €20 of €40. Een tooltip toont prijs en datum.
  - In productie de grafiek ook laten werken met aanraken en slepen.
- **Over dit racket:**
  - Een blok "In het kort" van twee zinnen (voor AI-zoekmachines), drie alinea's eigen redactietekst (tegen dunne content), en de lijsten "Geschikt voor" en "Minder geschikt voor".
  - Auteur en datum ("Redactie Racketpicker · bijgewerkt …").
- **Verder:** Specificaties (twee kolommen), Veelgestelde vragen (accordeon) en Vergelijkbare rackets (onderaan).
- **Gestructureerde data voor Google:** Product + AggregateOffer, BreadcrumbList en FAQPage.

### 5. Productpagina, schoen (`Schoen.dc.html`)
- **Maatkeuze:** een grid van knoppen van 52px (radiogroep). Per maat staat het aantal winkels dat hem heeft, of "laatste".
- **Prijsblok per maat:**
  - Zonder maat: "vanaf €X" en "Kies je maat".
  - Met maat: de laagste prijs in die maat en "op voorraad bij X van Y winkels".
  - Nergens op voorraad: "In deze maat uitverkocht" met een voorraadalert.
- **Winkellijst:** winkels zonder de gekozen maat staan onderaan met "Niet in maat 42".
- **Maatadvies:** een blok onderaan de pagina.

### 6. Keuzehulp (`Keuzehulp.dc.html`)
- **Vijf stappen, één vraag per scherm:** sport (6), niveau (3), speelstijl (3), frequentie (4) en budget (4). Bovenaan een voortgangsbalk van vijf segmenten en een knop "Vorige".
- **Resultaat:**
  - Je antwoorden als labels die je kunt aanklikken om ze te wijzigen.
  - Een deelbare link `/keuzehulp/{sport}/{niveau}-{stijl}`. Maak elke uitkomst een echte, indexeerbare pagina.
  - Een lijst met rang, foto, naam, reden, match-% met balk, prijs en aantal winkels.
- **Scoring (prototype):**
  - Niveau: 30 punten bij exact, 14 bij één niveau verschil.
  - Stijl: 25 bij exact, 8 bij allround.
  - Budget: 25 binnen budget, 12 eronder, 8 tot 1,25× erboven.
  - Frequentie: +8.
  - Het percentage is `raw/118 × 98`. Bij gelijke score komt de goedkoopste eerst.
- **Optioneel:** "Mail mij dit resultaat".
- **SEO-inhoud:** een vergelijkingstabel van controle, allround en power, veelgestelde vragen en links naar categorieën.

### 7. Blog (`Blog.dc.html`) en artikel (`Artikel.dc.html`)
- **Blog:** filtertabs per sport, één uitgelicht artikel (foto en tekst naast elkaar) en een grid van overige artikelen. Data staat in `blog-data.js`.
- **Artikel:**
  - Een groene hero met label, h1 en meta (auteur, datum, leestijd). De foto (16:9) overlapt de hero.
  - Inleiding van 19–22px/500, secties met h2, een limoen keuzehulp-CTA en "Lees ook" (zelfde sport eerst).
  - Article-gegevens voor Google en een eigen metabeschrijving per artikel.

### 8. Overige pagina's
- **Info (`Info.dc.html#…`):**
  - Over ons, Hoe we verdienen, Contact, Privacyverklaring, Prijshistorie en Veelgestelde vragen. Bij meer dan 2 secties staat links een "Op deze pagina"-inhoudsopgave.
  - **Contact:** het formulier links (naam, e-mail, onderwerp, bericht) en rechts het blok "Mail ons direct" met hello@racketpicker.com.
- **Favorieten (`Favorieten.dc.html`):** bewaard in `localStorage` (`rp-favs`, zie `favs.js`). In productie optioneel koppelen aan een Supabase-account.
- **Doorsturen (`Doorsturen.dc.html`):** een tussenscherm "Je gaat naar [winkel]" met een voortgangsbalk. Dit is de plek om affiliate-klikken te meten (route handler `/go/[shop]/[product]`, server-side redirect, noindex).
- **404 (`404.dc.html`):** "Deze bal is buiten het veld", in Next.js als `not-found.tsx`.

---

## State en data (Supabase-voorstel)
- **Tabellen:**
  - `products`: sport, categorie, merk, specificaties, slug en redactietekst.
  - `offers`: winkel, prijs, verzending, levertijd, voorraad en maten, dagelijks bijgewerkt.
  - `price_history`: product, datum, laagste prijs.
  - `alerts`: e-mail, product, doelprijs, type prijs of voorraad, bevestigd ja/nee.
  - `newsletter`: abonnees.
  - `articles`: blogartikelen.
- **Uitverkocht** = geen enkele offer op voorraad. Sorteer altijd eerst op beschikbaarheid, dan op de gekozen sortering.
- **Korting volgens de Omnibus-richtlijn:** het "-X%"-percentage en de doorgestreepte prijs komen uit de **laagste prijs van de afgelopen 30 dagen**, niet uit de adviesprijs. Toon de adviesprijs alleen met het label "adviesprijs".
- **Labels als "Laagste prijs in 90 dagen"** moeten uit de echte data komen.

## SEO, WCAG en GEO-checklist voor de build
- **SEO en GEO:**
  - Metadata per route via de `generateMetadata`-functie van Next.js.
  - Gestructureerde data voor Google aan de serverkant renderen.
  - Canonical- en noindex-regels voor filters, een sitemap en hreflang NL/EN.
  - `llms.txt` in de root (zie de bijlage). Auteurspagina's en een redactiebeleid.
- **Kopstructuur:**
  - Eén h1 per pagina. Sectietitels zijn h2, kaarttitels h3.
  - De productnaam in de h1 bevat altijd het merk.
- **Toegankelijkheid:**
  - Een link "Naar de inhoud" en `lang="nl"`.
  - Tikvlakken van minstens 44px en contrast van minstens 4.5:1.
  - De juiste ARIA-attributen op schakelaars en knoppen: `aria-pressed`, `aria-checked`, `aria-expanded`, `role="switch"` en `role="combobox"`.
  - De focus blijft binnen modale vensters en gaat bij sluiten terug naar de opener.
  - Bewegende inhoud kun je pauzeren.
- **Affiliate-tekst** (overal hetzelfde): de winkel betaalt een vergoeding, de koper betaalt niets extra en de volgorde van de prijzen verandert nooit.

## Assets
- `assets/logo.svg`: het definitieve logo (geleverd door de klant).
- `assets/racket.png`: voorbeeld-productfoto (Oxdog).
- `assets/black-friday.png`: seizoensbeeld voor de hero (2,5 MB, omzetten naar WebP/AVIF).
- `assets/blog-*.png`: blogfoto's. **Twee hebben een iStock-watermerk**; vervang ze door gelicentieerde versies.
- **Iconen:** inline SVG's (stroke 1.6–1.8). Vervang ze door één iconenset, bijvoorbeeld lucide-react, in dezelfde stijl.
- **Nog aan te leveren:** merklogo's (SVG), foto's voor sport, categorie en galerij, en echte reviews.

## Bestanden
- **Pagina's:** `Homepagina`, `Rackets`, `Categorie`, `Product`, `Schoen`, `Keuzehulp`, `Blog`, `Artikel`, `Info`, `Favorieten`, `Doorsturen` en `404`, elk als `.dc.html`.
- **Gedeelde onderdelen:** `Header.dc.html`, `Footer.dc.html`.
- **Gedrag:**
  - `reveal.js`: animaties, schuine afronding, logo-hover, pijlanimatie, focus-trap.
  - `favs.js`: favorieten.
  - `blog-data.js`: artikeldata.
- **Runtime voor de prototypes:** `support.js`.
- **Overig:** `llms.txt`, `PROJECTREGELS.md` (projectregels; kopieer naar `CLAUDE.md` in de repo).
