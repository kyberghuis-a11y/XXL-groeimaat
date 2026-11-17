# XXL Groeimaat

Mobiele webapp (PWA) voor beginnende sporters: weet binnen 3 minuten welk XXL Nutrition-product, welk formaat en welke smaak bij je past.

**Concept, geen officiële app van XXL Nutrition.**

## Starten
```bash
npm install
npm run dev
```
Open daarna http://localhost:5173. Kies in Chrome DevTools een telefoonformaat (375–430 px).

## Testen
```bash
npm test        # logica + validatie van de productdata
npm run build   # typecheck + productiebuild
```

## Belangrijke bestanden
- `docs/projectbrief.pdf`: de bron van waarheid
- `docs/productdata.md`: onderzochte productgegevens (17-11-2026)
- `src/data/products.seed.json`: productdata van de app
- `src/index.css`: huisstijl-tokens (kleuren + font)
- `public/images/products/README.md`: welke productfoto's je nog moet opslaan
- `CLAUDE.md`: werkafspraken en besluiten voor het bouwen met Claude
