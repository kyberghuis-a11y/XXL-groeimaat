# XXL Groeimaat: werkafspraken voor Claude

## Bron van waarheid
- `docs/projectbrief.pdf` is de bron van waarheid. Bij twijfel volgt de code de brief. Wijzigingen eerst in de brief vastleggen.
- `docs/productdata.md` bevat de productgegevens (onderzocht op 17-11-2026). Op prijzen, formaten en smaken gaat het datablad voor de brief, omdat het nieuwer is.

## Werkafspraken (uit de brief)
1. We bouwen in de volgorde van de "Bouwvolgorde": één stap per sessie, en elke stap wordt getest voordat we verdergaan.
2. Teksten in de app in het Nederlands, in de jij-vorm. Code, variabelen, bestanden en tabellen in het Engels.
3. Geen extra functies buiten de MVP zonder overleg.
4. Start elke sessie met: lees de projectbrief en check het XXL-assortiment op wijzigingen.
   - xxlnutrition.com geeft een 403 bij automatische verzoeken. Probeer het één keer; lukt het niet, gebruik dan `docs/productdata.md` en vraag de gebruiker om de gegevens te controleren. Zoek geen omwegen om de blokkade heen.
5. Verzin nooit productgegevens. Onzekere waarden krijgen `needs_check: true` en een `check_notes`-uitleg.

## Besluiten
| Onderwerp | Besluit |
|---|---|
| Framework | React + Vite + TypeScript (strict), React Router, Tailwind CSS v4 |
| Productdata fase 1 | Lokaal JSON-seedbestand (`src/data/products.seed.json`), gelezen via `src/data/catalog.ts`. Blijft lokaal tot Supabase gekoppeld is; daarna kan Supabase de inhoud van `catalog.ts` vervangen (functienamen blijven gelijk). *Afwijking van de brief, omdat er nog geen Supabase-account is.* |
| Productlijnen | 15 in plaats van 12: vitamines (D3, Cal & Mag, Omega 3) en Blast! Caffeine Free staan apart |
| Datamodel | Extra velden t.o.v. de brief: `allergens[]` en `allergens_complete` (juridische eis), `tagline`, `description`, `flavor_count_total`, `needs_check`, `check_notes` |
| Productfoto's | Foto's van XXL in `public/images/products/<id>.webp`, door de gebruiker zelf opgeslagen. Fallback-placeholder in `ProductImage` |
| Logo | Geen XXL-logo. Tekstlogo "XXL GROEIMAAT" |
| Populariteit | Sorteren op `review_count`. Zolang die `null` is: eerst bestsellers, daarna de seedvolgorde |
| Lettertype | Tijdelijk Montserrat. Eén plek: `--font-brand` in `src/index.css` |
| Inloggen (stap 3) | Contract `AuthService` in `src/auth/types.ts`, gebruikt via `useAuth()`. Supabase-modus als `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` in `.env.local` staan, anders demo-modus (alleen naam en e-mail in localStorage, wachtwoord nooit opgeslagen). Setup: `docs/supabase-setup.md` |
| Database | SQL in `supabase/migrations/` (handmatig draaien in de SQL Editor). RLS aan op elke tabel. Nieuwe tabellen krijgen `user_id ... references auth.users on delete cascade`, zodat "account verwijderen" alles wist |
| Toegang | Ontdek en productdetail zonder account. Home, Bestellingen, Profiel en onboarding stap 2–4 alleen met account (`RequireAuth`) |
| Leeftijd | Vraag 1 van onboarding stap 2 ("Ben je 18 jaar of ouder?"), opgeslagen in `users.is_adult` |
| Profielvragen (stap 4) | Config in `src/profile/questions.ts` (codes Engels, labels NL). Opslag via `ProfileService` (`src/profile/profileService.ts`; Supabase: `profiles` + `users.is_adult`, demo: localStorage) en `useProfile()`. Route `/onboarding/2/:q`, één vraag per scherm; één antwoord = opslaan + automatisch door; voeding is meerkeuze met "Geen" (= `diet: []`). Niet verder springen dan de eerste onbeantwoorde vraag. Smaaktest pas als het profiel compleet is |
| Smaaktest (stap 5) | Vragen in `src/taste/questions.ts`, berekening in `src/taste/tasteProfile.ts` volgens de tabel "Effect op profiel" uit de brief; score per familie = min(10, punten), uitgesloten families = 0. Top 3 = alleen families met punten; bij gelijke score eerst chocolade, vanille, koek (veiligste startkeuze). Opslag in `taste_profiles` (antwoorden + berekend profiel). Gedeeld vraagscherm: `src/components/QuestionFlow.tsx` + pure logica in `src/lib/questionFlow.ts` |
| Interpretaties smaaktest | *Niet letterlijk in de brief, ter controle:* "Speculaas of karamel" = twee opties (beide koek); fruit-snack +2 op fruitig zoet én fris; water +2 fruitig fris; kwark/havermout +2 vanille en koek; melk en plantaardige melk geven geen bonus; "kunstmatig zoet" sluit smaken met zoetheid 3 uit; "banaan" sluit alle smaken met banaan in de naam uit; neutraal krijgt nergens punten |
| Harde regels | `src/recommend/rules.ts` (vegan, lactosevrij, cafeïne alleen 18+). Gebruikt door de smaaksuggesties en straks door de aanbevelingen (stap 6) |
| Aanbevelingen (stap 6) | `src/recommend/engine.ts`, pure functies; niet opgeslagen, bij elke wijziging opnieuw berekend (`useAdvice()`). Stap A = `GOAL_PLANS` (tabel uit de brief) + harde regels; vervangers bij vegan (Green Protein) en lactosevrij (Zero, Isolaat). Stap B = score 0–100 per product × smaak × formaat met de gewichten uit de brief. Per categorie (Eiwitshake, Creatine, Extra) de top 3 productlijnen, elk met de beste smaak en het beste formaat. Labels: "Beste match voor jou" (nr. 1), "Voordeligst per portie" (laagste prijs per portie van de getoonde, als er minstens 2 zijn), "Bestseller" (badge). Match-% ook in Ontdek en op de productpagina (`matchForLine`) |
| Interpretaties advies | *Niet letterlijk in de brief, ter controle:* doel-score basis = 100, aanvullend = 60, buiten het plan = 0; sport telt (nog) niet mee, want de tabel heeft alleen doelen; gebruik per maand: shakes 6/15/24× (per training) of 30× (bij ontbijt/snack), creatine/vitamines/maaltijdvervanger 30×; onbekende prijs per portie = budgetscore 50; voeding: geen vegan/lactosevrij-wens = 100, wel en passend label = 100, anders 50; leefstijl: basis 70, Protein Wafer bij "veel onderweg" 100; producten zonder smaak (vitamines) smaakscore 50; kleinste formaat bij geen ervaring, budget tot €20 of algemeen fit, anders bij gelijke score de laagste prijs per portie; Mass Gainer alleen als je niet zittend werkt (we vragen niet naar "moeite met aankomen"); elektrolyten staan niet in de catalogus |
| Bestellingen (stap 7) | Winkelwagen alleen in de browser (`src/cart/`, localStorage `groeimaat.cart`, ook zonder account); afrekenen vraagt inloggen. Gesimuleerde checkout: betaalmethode kiezen, niets betaald of verzonden. Bestelling via `OrderService` (Supabase: `orders` + `order_items` via RPC `create_order`, alles of niets; demo: localStorage). Leverdatum in `src/orders/delivery.ts` (NL-tijd): vóór 22:00 op ma–vr = zelfde dag verzonden, bezorgd op de eerstvolgende dag ma–za. Status wordt nagebootst uit de tijd (`simulatedStatus`); opgeslagen status is 'besteld' |
| Interpretaties bestellingen | *Niet letterlijk in de brief, ter controle:* verzendkosten onder €100 zijn onbekend en tellen niet mee ("nog te controleren"); geen feestdagen in de leverdatum; statustijden: in behandeling na 15 min, verzonden 20:00 op de verzenddag (of 1 uur na bestellen), onderweg 08:00 en bezorgd 14:00 op de bezorgdag; geen track & trace (geen echte vervoerder); bestelnummer "GM-JJMMDD-1234" (geen echt XXL-nummer); order_items slaan productnaam, smaak en formaat mee op (geen tabel product_variants in Supabase); onder 18 kan een product met cafeïne niet in de winkelwagen of door de checkout; "Opnieuw bestellen" en "Beoordeel deze smaak" zijn "later" in de brief en niet gebouwd |
| Supabase-migraties | Na elke nieuwe migratie moet de gebruiker die handmatig draaien in de SQL Editor (zie `docs/supabase-setup.md`) |
| Wachtwoord vergeten | Niet gebouwd (niet in de brief). Eerst met de gebruiker overleggen |
| Profiel aanpassen (stap 8) | Profiel > Mijn voorkeuren: elke vraag apart aanpassen via `/profiel/aanpassen/:key` (`EditQuestion` in `QuestionFlow.tsx`, zonder voortgangsbalk; na opslaan terug met bevestiging). Smaaktest: één antwoord aanpassen of de hele test opnieuw (`/onboarding/3/1`, vorige antwoorden staan klaar, er wordt niets gewist). Naam wijzigen via `AuthService.updateName`. Het advies wordt nergens opgeslagen, dus is na elke wijziging direct opnieuw berekend |
| Toegankelijkheid | Gecontroleerd met axe-core (WCAG 2.1 AA) op 15 schermen: 0 problemen. Regels: kleine rode tekst alleen op wit (contrast 4,8); op grijs (4,4) of zwart (3,6) gebruik je zwart of wit en rood als accent (streep, icoon, knop). Grijze tekst minstens `text-xxl-black/70`. Elke losse pagina heeft een `<main>`. Tikdoelen zijn minstens 44 px |
| Online zetten | `vercel.json` en `public/_redirects` (Netlify) sturen elke route door naar `index.html`. Stappen in `docs/mobiel-testen.md` |

## Huisstijl
- Kleuren zijn alleen Tailwind-tokens, gedefinieerd in `@theme` in `src/index.css`: `xxl-red`, `xxl-black`, `xxl-grey`, `xxl-white`. Gebruik nergens anders losse hexcodes.
  - Uitzonderingen, omdat die bestanden geen CSS kunnen lezen: `vite.config.ts` (PWA-manifest) en `public/icon.svg`.
- Rood alleen voor actie en nadruk. Knoppen en labels in HOOFDLETTERS. Tikdoelen zijn minstens 44 px.
- Mobile-first: 375–430 px, en op desktop een kolom van max. 480 px.
- Geen gezondheidsclaims (EU), een disclaimer bij advies en een conceptlabel op het welkomstscherm.

## Commando's
```bash
npm install        # eenmalig
npm run dev        # app starten op http://localhost:5173
npm test           # Vitest-tests (logica + validatie van het seedbestand)
npm run build      # typecheck + productiebuild (incl. PWA)
cp .env.example .env.local   # daarna Supabase-sleutels invullen (zie docs/supabase-setup.md)
```
Controle op hexcodes:
```bash
grep -rnE "#[0-9a-fA-F]{6}\b" src --include=*.tsx --include=*.ts
```
Dit hoort niets op te leveren.

## Status
- [x] Bouwstap 1: projectopzet, navigatie en lege schermen
- [x] Bouwstap 2: huisstijl-tokens, catalogus met seeddata, filters, zoeken, sorteren en productdetail
- [x] Bouwstap 3: account aanmaken, inloggen, uitloggen, account verwijderen, privacyverklaring. *Supabase-modus alleen getest met een nagebootste client; nog testen met een echt project.*
- [x] Bouwstap 4: leeftijdsvraag + 8 profielvragen, opslaan, verder waar je gebleven was, overzicht in Profiel. *Supabase-opslag getest met een nagebootste client.*
- [x] Bouwstap 5: 7 smaakvragen, berekening smaakprofiel, scherm "Jouw smaakprofiel" met concrete XXL-smaken en beginnerstips. *Supabase-opslag getest met een nagebootste client.*
- [x] Bouwstap 6: aanbevelingsalgoritme (stap A + B), advies op Home per categorie met labels, uitleg en match-%, match-% in Ontdek en op de productpagina, "Past niet bij jou" met reden. Geen nieuwe Supabase-tabel nodig
- [x] Bouwstap 7: winkelwagen, gesimuleerde checkout, bestellingen (lopend met statusbalk en verwachte levering, eerder besteld, uitgegeven deze maand t.o.v. budget). *Supabase-opslag getest met een nagebootste client.*
- [x] Bouwstap 8: antwoorden en smaaktest aanpassen (advies direct herberekend), naam wijzigen, vangnet tegen een wit scherm, toegankelijkheid (0 axe-problemen), opschonen (0 lint-waarschuwingen), klaar voor Vercel/Netlify, getest op 4 nagebootste telefoons (320–430 px). Testen op een echte telefoon: `docs/mobiel-testen.md`

## Open punten (voor de gebruiker)
- Productdata controleren op xxlnutrition.com: zie `docs/productdata.md` (onder andere Green Protein, Cal & Mag en de volledige smakenlijsten)
- Productfoto's opslaan: `public/images/products/README.md`
- Verzendkosten onder €100 opzoeken (nu "nog te controleren")
- Het echte XXL-lettertype opzoeken (nu tijdelijk Montserrat)
- Interpretaties bij smaaktest, advies en bestellingen bevestigen (zie Besluiten)
- Supabase-modus testen met het echte project; migraties 0001–0004 draaien
- Testen op een echte telefoon (`docs/mobiel-testen.md`)
