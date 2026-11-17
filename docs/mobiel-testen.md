# XXL Groeimaat testen op je eigen telefoon

Claude heeft de app al getest in een browser die telefoons nabootst: iPhone SE, iPhone 13, Pixel 7 en iPhone 14 Pro Max. Een echte telefoon blijft daarnaast nodig, want daar merk je hoe het voelt: tikken, scrollen, het toetsenbord en de app installeren.

## Manier 1: via je eigen wifi (snel, alleen thuis)
1. Zet je computer en je telefoon op **hetzelfde wifi-netwerk**.
2. Start de app op je computer:
   ```bash
   npm run dev -- --host
   ```
3. In het venster verschijnt een regel `Network: http://192.168.x.x:5173/`. Open dat adres op je telefoon.

## Manier 2: online zetten met Vercel (aanbevolen, overal te openen)
1. Ga naar **vercel.com** en log in met je GitHub-account.
2. Klik op **Add New > Project** en kies de repository `xxl-groeimaat`.
3. Vercel herkent Vite zelf. Laat de instellingen staan.
4. Open **Environment Variables** en voeg toe:
   - `VITE_SUPABASE_URL`: dezelfde waarde als in je `.env.local`
   - `VITE_SUPABASE_ANON_KEY`: dezelfde waarde als in je `.env.local` (nooit de `service_role` key)
5. Klik op **Deploy**. Na ongeveer 1 minuut krijg je een adres zoals `xxl-groeimaat.vercel.app`.
6. Zet dat adres in Supabase: **Authentication > URL Configuration > Site URL**. Dan werken de links in bevestigingsmails ook.
7. Deel het adres alleen met mensen die meetesten. Het is een concept en geen officiële app van XXL Nutrition. De productfoto's en productteksten zijn van XXL Nutrition en mogen niet zonder hun toestemming openbaar worden.

Elke keer dat er iets nieuws in `main` op GitHub komt, zet Vercel de nieuwe versie automatisch online. (Netlify werkt ook: het bestand `public/_redirects` staat al klaar.)

## Installeren als app (PWA)
- **iPhone (Safari):** tik op Delen (vierkantje met pijl) en kies **Zet op beginscherm**.
- **Android (Chrome):** tik op ⋮ en kies **App installeren** of **Toevoegen aan startscherm**.

De app opent dan zonder adresbalk, met het XXL Groeimaat-icoon. De catalogus werkt ook zonder internet; inloggen en opslaan hebben wel internet nodig.

## Checklist (± 15 minuten)
Vink af wat werkt. Wat niet werkt: maak een screenshot en stuur die naar Claude.

**Eerste keer**
- [ ] Welkomstscherm: conceptlabel en disclaimer zijn goed leesbaar
- [ ] Account aanmaken. Het toetsenbord schuift niet over het veld waarin je typt
- [ ] De 9 profielvragen. Tikken gaat vanzelf door. Lukte alles binnen 3 minuten, samen met de smaaktest?
- [ ] Smaaktest (7 vragen) en "Jouw smaakprofiel". Klopt de typering met wat je lekker vindt?
- [ ] Home: snap je waarom de producten bij je passen?

**Rondkijken**
- [ ] Ontdek: filters openen en sluiten, zoeken, sorteren
- [ ] Productpagina: smaak en formaat kiezen. De prijs verandert mee
- [ ] Scrollen voelt soepel; niets verdwijnt achter de balk onderin

**Bestellen (demo)**
- [ ] Iets in de winkelwagen doen, het aantal aanpassen
- [ ] Afrekenen met een betaalmethode. Bij Bestellingen staat de juiste verwachte leverdatum
- [ ] Morgen nog eens kijken: is de status opgeschoven?

**Profiel**
- [ ] Je doel aanpassen. Het advies op Home verandert mee
- [ ] De smaaktest opnieuw doen
- [ ] Je naam wijzigen, uitloggen en weer inloggen
- [ ] (Met een testaccount) Account verwijderen. In Supabase is alles weg

**Algemeen**
- [ ] De app op je beginscherm zetten en openen
- [ ] Draai je telefoon even een kwartslag: niets loopt helemaal vast
- [ ] Iets wat je onduidelijk of lelijk vindt? Schrijf het op
