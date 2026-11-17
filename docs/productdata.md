# XXL Groeimaat: productdata (stand 17 november 2026)

Dit bestand is de bron voor `src/data/products.seed.json`. Zet het in de repo als `docs/productdata.md`.

**Belangrijk:** xxlnutrition.com blokkeert automatische verzoeken (foutcode 403). De gegevens hieronder komen daarom uit:
- zoekresultaten van xxlnutrition.com-pagina's zelf
- prijstrackers die de XXL-prijs bijhouden (Sportpoeder.nl)
- verkooppartners (Decathlon, bol.com, Gezondheid aan huis, Farmaline e.a.)

Prijzen verschillen per winkel en per actie. **De XXL-prijs gaat altijd voor.**

**Betrouwbaarheid per waarde:**
- ✅ = van xxlnutrition.com zelf of een tracker die de XXL-prijs meet
- 🟡 = van een verkooppartner of uit een adviesprijs. Bruikbaar, maar controleren.
- ❌ = onbekend of tegenstrijdig. In de seed komt `needs_check: true`.
- *(berekend)* = afgeleid van portiegrootte en gewicht. Bijvoorbeeld: 1000 g ÷ 30 g = 33 porties.

---

## Overzicht

| # | Productlijn | Categorie | Formaten & prijs | Porties (portiegrootte) | Eiwit/portie | Labels |
|---|---|---|---|---|---|---|
| 1 | Whey Delicious | Whey-eiwit | 450 g €19,99 🟡 · 1000 g €39,99 ✅ · 2500 g €85,99 🟡 | 15 · 33 · 83 (30 g) *(berekend)* | ±24 g 🟡 | bestseller |
| 2 | Perfect Whey Protein | Whey-eiwit | 750 g €21,99 ✅ · 2000 g €46,99 🟡 · 4000 g ❌ | 25 · 66 · 133 (30 g) *(berekend)* | 23,6 g ✅ | – |
| 3 | Whey Isolaat | Whey-isolaat | 450 g €25,99 ✅ · 1000 g €53,99 ✅ | 15 · 33 (30 g) ✅ | ❌ (±27 g bij 90%) | laag in lactose ❌ |
| 4 | Whey Protein Zero | Whey, lactosevrij | 1000 g €42,99 ✅ | 33 (30 g) *(berekend)* | ❌ | lactosevrij |
| 5 | Clear Whey Isolate | Helder eiwit | 500 g €29,99 🟡 · 1000 g €46,99 🟡 | 20 · 40 (25 g) 🟡 | 21,1 g ✅ | – |
| 6 | Green Protein | Vegan eiwit | ❌ (XXL "vanaf €39,99" ✅ vs. brief €23,99) | ❌ | ❌ | vegan |
| 7 | Creatine Monohydraat | Creatine | 250 g €8,99 ✅ · 500 g €15,99 ✅ · 1000 g ❌ | 50 · 100 · 200 (5 g) *(berekend)* | – | vegan |
| 8 | Perfect Mass Gainer | Weight gainer | 5000 g €59,99 ✅ | ❌ | ±23 g per 100 g 🟡 | – |
| 9 | Blast! Pre Workout | Pre-workout | vanaf €27,99 ✅ (30 doseringen ✅) | 30 | – | bevat_cafeine |
| 10 | Blast! Pre Workout Caffeine Free | Pre-workout | 300 g 🟡, prijs ❌ | ❌ | – | – |
| 11 | Diet Shake | Maaltijdvervanger | 480 g €23,99 🟡 · 1200 g ❌ | 12 (40 g) *(berekend)* · 30 🟡 | ❌ | – |
| 12 | Delicious Protein Wafer | Eiwitsnack | 12 × 40 g €17,99 ✅ (adviesprijs €19,99, brief €24,99) | 12 | ❌ | – |
| 13 | Vitamine D3 3000IU | Vitamines & mineralen | 60 softgels ±€8,50–9,00 🟡 | 60 | – | – |
| 14 | Cal & Mag | Vitamines & mineralen | ❌ | ❌ | – | – |
| 15 | Omega 3 Ultra Pure | Vitamines & mineralen | 100 softgels €13,99 ✅ | 100 | – | – |

## Smaken per productlijn

Smaakfamilie tussen haakjes. Voor deze toewijzing is de tabel "Smaakfamilies" in de brief leidend.

1. **Whey Delicious** (XXL: ±20 smaken; hiervan bekend):
   - chocolade (chocolade)
   - sweet vanille (vanille)
   - vanille caramel (vanille)
   - vanille kaneel (vanille)
   - speculaas (koek)
   - salted caramel (koek)
   - banaan (fruitig_zoet)
   - aardbei (fruitig_zoet)
   - bosvruchten (fruitig_zoet)
   - De rest ❌
2. **Perfect Whey Protein** (13):
   - chocolade, hazelnoot, cappuccino (chocolade)
   - vanille, naturel (vanille)
   - cookies & cream, salted caramel (koek)
   - aardbei, banaan, aardbei-banaan, kokos, pistache (fruitig_zoet)
   - yoghurt-framboos (fruitig_fris)
   - 🟡 Bronnen noemen 12 tot 13 smaken.
3. **Whey Isolaat**:
   - vanille (vanille)
   - naturel (neutraal)
   - banaan, aardbei, framboos (fruitig_zoet)
   - 🟡 Bron: Decathlon
4. **Whey Protein Zero** (4): vanille (vanille). De rest ❌.
5. **Clear Whey Isolate**: allemaal fruitig_fris.
   - aardbei-kers, sinaasappel, appel, ice tea peach, ice tea mango, pornstar martini
   - 🟡 Brief noemt "zure kersen". Controleren of dat aardbei-kers is.
6. **Green Protein** (4): banaan (fruitig_zoet). De rest ❌.
7. **Creatine Monohydraat**:
   - naturel (neutraal)
   - citroen, sinaasappel (fruitig_fris)
8. **Perfect Mass Gainer** (6): chocolade-hazelnoot (chocolade). De rest ❌.
9. **Blast! Pre Workout**: allemaal fruitig_fris.
   - orange, cherry, fruit punch, green apple, melon
   - 🟡 XXL noemt nu "8 smaken, waarvan 2 cafeïnevrij"; de brief zegt 7.
10. **Blast! Caffeine Free**: orange (fruitig_fris). De tweede smaak ❌.
11. **Diet Shake**:
    - chocolade, chocolade-hazelnoot (chocolade)
    - cookies & cream (koek)
    - ❌ Brief zegt 7 smaken, een XXL-listing zegt 21.
12. **Delicious Protein Wafer**:
    - chocolade (chocolade)
    - cookies & cream (koek)
13. **Vitamines (13–15)**: geen smaak. In de seed krijgen ze één variant met `flavor: null` en `flavor_family: "neutraal"`.

## Allergenen

- **Bevatten melk:** alle whey-producten, Clear Whey, Mass Gainer, Diet Shake en Protein Wafer.
- **Wafer:** bevat waarschijnlijk ook gluten en soja ❌.
- **Green Protein:** soja ❌.
- **Omega 3:** vis.
- Allergenen staan nergens volledig in de bronnen. Zet elk allergenenveld op `needs_check: true`, behalve "melk" bij de whey-producten.

## Nog te controleren door Kjeld (in de browser op xxlnutrition.com)

1. Prijzen van Whey Delicious 450 g en 2500 g
2. Prijs van Perfect Whey 4000 g
3. Prijs van Creatine 1000 g
4. Green Protein: prijs, formaat en smaken. Er is ook een "Green Protein NZVT"-variant.
5. Blast! Caffeine Free: prijs en tweede smaak. Zijn het 7 of 8 smaken in totaal?
6. Diet Shake: aantal smaken en prijs
7. Cal & Mag: alles
8. Vitamine D3: de XXL-prijs
9. Volledige smakenlijst van Whey Delicious (±20)
10. Is Whey Isolaat echt "lactosevrij", of alleen "laag in lactose"? Dit bepaalt of de harde regel uit de brief klopt.
11. Sterren en aantal reviews per product. Die heb ik niet kunnen vinden. Zet ze tot die tijd op `null`; dan toont de app "Nog geen beoordeling".

## Bronnen

- XXL Nutrition: [Whey Protein Zero](https://xxlnutrition.com/nl/whey-protein-zero), [Blast! Pre-Workout](https://xxlnutrition.com/nl/blast-pre-workout), [Creatine Monohydraat](https://xxlnutrition.com/nl/xxl-creatine-monohydraat), [Perfect Mass Gainer](https://xxlnutrition.com/nl/perfect-mass-gainer), [Perfect Whey Protein](https://xxlnutrition.com/en/perfect-whey-protein?sku=16383), [Clear Whey Isolate](https://xxlnutrition.com/en/clear-whey-isolate), [Delicious Protein Wafer](https://xxlnutrition.com/en/delicious-protein-wafer), [Green Protein NZVT](https://xxlnutrition.com/nl/green-protein-nzvt), [Eiwitten & proteïne](https://xxlnutrition.com/nl-be/eiwitten-proteine)
- Sportpoeder: [Whey Isolaat](https://sportpoeder.nl/p/xxl-nutrition-whey-isolaat), [Delicious Protein Wafer](https://sportpoeder.nl/p/xxl-nutrition-delicious-protein-wafer), [XXL Nutrition merkpagina](https://sportpoeder.nl/merken/xxl-nutrition/)
- Verkooppartners:
  - Gezondheid aan huis: [Whey Delicious Sweet Vanille](https://www.gezondheidaanhuis.nl/nl/product/73257/Whey-Delicious-Sweet-Vanille-XXL-Nutrition-450-gram), [Clear Whey Appel](https://www.gezondheidaanhuis.nl/en/product/73302/Clear-Whey-Isolate-Appel-XXL-Nutrition-1000-gram)
  - Farmaline: [Clear Whey Aardbei](https://www.farmaline.be/nl/Supplementen/BE09802876/xxl-nutrition-clear-whey-isolate-aardbei.htm), [Diet Shake](https://www.farmaline.be/nl/Supplementen/BE09802866/xxl-nutrition-diet-shake-cookies-cream.htm)
  - Decathlon: [Whey Isolaat](https://www.decathlon.be/nl/p/mp/whey-isolaat-90percent-eiwit-proteine-poeder-banaan-gram-shakes/1d3c62bf-0d9e-42f0-b913-3d6ff6a614fd/g125)
  - Overige: [Kaufland Whey Protein Zero](https://www.kaufland.nl/product/537059290/), [Koopjesdrogisterij Vitamine D3](https://www.koopjesdrogisterij.nl/3x-xxl-nutrition-vitamine-d3-3000iu-60-softgels.html), [Medigros Diet Shake](https://www.medigros.nl/eiwitten-en-proteine-/10004-xxl-nutrition-diet-shake-480g.html), [Streetgains Blast! Caffeine Free](https://streetgains.nl/en/products/whey-delicious-1000gr-xxl-nutrition%C2%AE)
- Reviews: [Grouwfit Perfect Whey](https://grouwfit.nl/perfect-whey-protein-review-xxl-nutrition/), [Eiwitshakestore Clear Whey](https://eiwitshakestore.nl/producten/clear-whey-isolaat/), [Whey-Wijzer Clear Whey](https://whey-wijzer.fit/en-us/product/xxl-clear-whey-isolate), [Infofitness Green Protein](https://www.infofitness.nl/product/green-protein/)
