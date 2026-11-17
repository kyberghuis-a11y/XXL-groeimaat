# Supabase koppelen (± 10 minuten)

Zolang dit niet is gedaan, draait de app in **demo-modus**: accounts staan dan alleen in je eigen browser. Na deze stappen werken echte accounts.

## 1. Account en project
1. Ga naar **supabase.com** en klik op **Start your project**. Log in met je GitHub-account.
2. Klik op **New project**.
   - **Name:** `xxl-groeimaat`
   - **Database password:** laat Supabase er een maken en bewaar hem in je wachtwoordmanager. De app heeft dit wachtwoord niet nodig.
   - **Region:** **Central EU (Frankfurt)**. Dan blijven de gegevens in de EU, wat goed is voor de AVG.
   - **Plan:** Free
3. Wacht tot het project klaar is. Dat duurt ongeveer 2 minuten.

## 2. Database klaarzetten
1. Klik links op **SQL Editor** en daarna op **New query**.
2. Open in de repo het bestand `supabase/migrations/0001_users.sql`, kopieer de hele inhoud en plak die in de editor.
3. Klik op **Run**. Onderin hoort te staan: *Success. No rows returned*.

Dit maakt de tabel `users` aan, met de beveiliging "iedereen ziet alleen zichzelf", en de functie om een account te verwijderen.

## 3. E-mailbevestiging (keuze)
Supabase stuurt standaard een bevestigingsmail bij registratie. De app kan met allebei de opties omgaan:
- **Voor de demo (aanbevolen):** ga naar **Authentication > Sign In / Providers > Email** en zet **Confirm email** uit. Je gaat dan na het registreren direct door naar de vragen.
- **Bevestiging aan laten:** de app toont dan "Check je mail". Zet in dat geval bij **Authentication > URL Configuration** de **Site URL** op het adres van de app, bijvoorbeeld `http://localhost:5173`, en later ook je Vercel-adres.

## 4. Sleutels in de app zetten
1. Ga naar **Project Settings > API** (of **Data API**).
2. Kopieer de **Project URL** en de **anon public** key.
   - ⚠️ Gebruik **nooit** de `service_role` key. Die geeft volledige toegang tot de database.
3. Maak in de map van de app het bestand `.env.local` aan (kopie van `.env.example`):
   ```
   VITE_SUPABASE_URL=https://jouwproject.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   Dit bestand gaat niet mee naar GitHub; het staat in `.gitignore`.
4. Stop de app en start hem opnieuw met `npm run dev`. De melding "Demo-modus" is nu verdwenen.

## 5. Controleren
1. Maak een account aan in de app.
2. Kijk in Supabase bij **Table Editor > users**. Daar staat nu een rij met je naam en e-mail.
3. Verwijder het account in de app via Profiel > Account verwijderen. De rij is daarna weg, ook bij **Authentication > Users**.

Lukt een stap niet? Stuur Claude een screenshot van de foutmelding. **Plak nooit je sleutels in de chat.**
