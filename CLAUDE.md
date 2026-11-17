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
| Productdata fase 1 | Lokaal JSON-seedbestand (`src/data/products.seed.json`), gelezen via `src/data/catalog.ts`. In bouwstap 3 vervangt Supabase de inhoud van `catalog.ts`; de functienamen blijven gelijk. *Afwijking van de brief, omdat er nog geen Supabase-account is.* |
| Productlijnen | 15 in plaats van 12: vitamines (D3, Cal & Mag, Omega 3) en Blast! Caffeine Free staan apart |
| Datamodel | Extra velden t.o.v. de brief: `allergens[]` en `allergens_complete` (juridische eis), `tagline`, `description`, `flavor_count_total`, `needs_check`, `check_notes` |
| Productfoto's | Foto's van XXL in `public/images/products/<id>.webp`, door de gebruiker zelf opgeslagen. Fallback-placeholder in `ProductImage` |
| Logo | Geen XXL-logo. Tekstlogo "XXL GROEIMAAT" |
| Populariteit | Sorteren op `review_count`. Zolang die `null` is: eerst bestsellers, daarna de seedvolgorde |
| Lettertype | Tijdelijk Montserrat. Eén plek: `--font-brand` in `src/index.css` |

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
```
Controle op hexcodes:
```bash
grep -rnE "#[0-9a-fA-F]{6}\b" src --include=*.tsx --include=*.ts
```
Dit hoort niets op te leveren.

## Status
- [x] Bouwstap 1: projectopzet, navigatie en lege schermen
- [x] Bouwstap 2: huisstijl-tokens, catalogus met seeddata, filters, zoeken, sorteren en productdetail
- [ ] Bouwstap 3: account aanmaken en inloggen (Supabase)
- [ ] Bouwstap 4: onboarding, profielvragen opslaan
- [ ] Bouwstap 5: smaakvragenlijst + smaakprofiel
- [ ] Bouwstap 6: aanbevelingsalgoritme + aanbevelingsscherm
- [ ] Bouwstap 7: gesimuleerde checkout + bestellingen
- [ ] Bouwstap 8: profiel bewerken, herberekenen, afwerking, testen op mobiel
