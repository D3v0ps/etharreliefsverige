# Ethar Cup — webbsida & adminportal

## Filer
- **index.html** — den publika sidan (det besökarna ser).
- **admin.html** — adminportalen där ni redigerar allt innehåll.
- **config.json** — allt innehåll (texter, färger, datum, formulär-endpoint).
- **styles.css**, **app.js** — design och funktionalitet för den publika sidan.
- **.htaccess** — sätter startsida + snygg admin-adress i mappen.
- **backend/google-apps-script.gs** — kod för anmälnings-backend (klistras in i Google Apps Script; laddas *inte* upp till webbhotellet).

Ladda upp den publika sidans filer till samma mapp på webbhotellet (t.ex. One.com):
`index.html`, `styles.css`, `app.js`, `admin.html`, `config.json`, `.htaccess`.

## Lägga upp på one.com bredvid WordPress (undermapp)
Sidan är helt statisk och alla länkar är relativa, så den kan ligga i en
undermapp utan ändringar. I det här projektet används mappen **`turnering`**:
- Publik sida: `https://www.etharreliefsverige.se/turnering/`
- Adminportal: `https://www.etharreliefsverige.se/turnering/admin`

**Påverkar det WordPress?** Nej. WordPress `.htaccess` i rotmappen skriver bara om
adresser som *inte* matchar en riktig fil eller mapp (`!-f` / `!-d`). En riktig
undermapp serveras därför direkt, förbi WordPress — `wp-content`, `wp-config.php`
och databasen rörs inte. Mappens egen `.htaccess` gäller bara den mappen.

1. Anslut via one.coms filhanterare eller SFTP.
2. Gå till samma mapp där WordPress-filerna ligger (`index.php`, `wp-admin`, `wp-content` …).
3. Skapa mappen `turnering`.
4. Ladda upp `index.html`, `styles.css`, `app.js`, `admin.html`, `config.json` och `.htaccess` dit.
5. Öppna `https://www.etharreliefsverige.se/turnering/` (admin: `…/turnering/admin`).

`.htaccess` sätter `index.html` som startsida och ger admin den snygga adressen
`/turnering/admin` (utan `.html`). Heter mappen något annat än `turnering` behöver
raden `RewriteRule ^admin/$ /turnering/admin` i `.htaccess` uppdateras. För ännu
tightare isolering går det att lägga sidan på en subdomän
(`turnering.etharreliefsverige.se`) som pekar på mappen.

## Så redigerar ni innehållet
1. Gå till `https://www.etharreliefsverige.se/turnering/admin`.
2. Logga in (standardlösenord: **ethar2026** — byt det under fliken *Inställningar*).
3. Ändra texter, färger, datum, fakta, formulärfält m.m. Allt syns direkt i den inbyggda förhandsgranskningen.
4. Klicka **Publicera (ladda ner)** — då hämtas en ny `config.json`.
5. Ladda upp den nya `config.json` till mappen `turnering` (skriv över den gamla).
6. Klart — den publika sidan visar nu det nya innehållet för alla.

> Ändringar sparas automatiskt som ett lokalt utkast i webbläsaren tills ni publicerar. Knappen **Återställ** kastar utkastet och går tillbaka till senast publicerade version.

## Formulär (laganmälan) — Google Apps Script
Anmälningarna går till ett Google Sheet via Google Apps Script. Endpointen är redan
inkopplad i `config.json` (`settings.formEndpoint`).

**Apps Script-koden:** [`backend/google-apps-script.gs`](backend/google-apps-script.gs)
1. Skapa ett Google Sheet (er lista med anmälningar).
2. I kalkylarket: **Tillägg → Apps Script**. Klistra in koden från filen. Spara.
3. Sätt ev. `NOTIFY_EMAIL` (mejlnotis vid ny anmälan) eller lämna tomt.
4. **Distribuera → Ny distribution → Webbapp.** Kör som: *Jag själv*. Vem har åtkomst: **Alla**. Kopiera `/exec`-URL:en.
5. URL:en sätts som `settings.formEndpoint` i `config.json` (eller via *Inställningar* i admin → Publicera).

Detaljer:
- Formuläret skickar `formtyp=lag` samt `lagnamn, kontakt, epost, telefon, antal, meddelande`.
- Apps Script svarar utan CORS-headers, så `app.js` skickar anmälningar till `script.google.com` "fire-and-forget" och visar bekräftelse direkt. Raden hamnar ändå i kalkylarket.
- Är `formEndpoint` tomt körs ett **testläge** (visar bekräftelse utan att skicka).
- Fungerar inte JavaScript får besökaren en länk att mejla anmälan istället.
- Ändrar ni `.gs`-koden: distribuera en **ny version** (URL:en förblir densamma).

## Betalningar (markera betalda i admin)
Adminportalen har fliken **Betalningar** som listar alla anmälda lag (från Google
Sheet) och låter er bocka av **Betald** per lag — det sparas direkt i arket.

För att det ska fungera:
1. Använd den uppdaterade koden i `backend/google-apps-script.gs` (den har `list` + `setPaid`) och **distribuera en ny version** av webbappen.
2. Tokenen måste matcha: `ADMIN_TOKEN` i `google-apps-script.gs` = `PAY_TOKEN` överst i `admin.html`. Byt gärna båda till ett eget hemligt värde.
3. Öppna admin → **Betalningar** → bocka av betalda lag. En liten summering visar *anmälda / betalda / kvar*.

> **Skyddsnivå (vald):** tokenen ligger i `admin.html`, så den som kan öppna admin-sidans källkod kan i teorin läsa anmälningslistan — samma "obscurity"-nivå som admin-lösenordet. Vill ni skydda personuppgifterna hårdare kan listan flyttas bakom en liten `api.php` på servern (token + lösenord server-side); säg till så fixar vi det.

## Att fylla i (riktiga uppgifter)
Allt nedan ändras i adminportalen:
- Datum, tid, plats/adress, kollektivtrafik
- Format, ålder, lagstorlek, matchtid, avgift, pris, platser, sista anmälningsdag
- Kontakt-e-post och telefon (just nu platshållare `08-000 00 00`)
- Logotyp (URL till vit logga) och eventuella foton från 2024
- Formulär-endpoint

## Säkerhet
Lösenordet är ett enkelt klient-skydd — det avskräcker men är inte banknivå. Dela inte admin-länken offentligt.

## Köra lokalt (utveckling)
Sidan är statisk och har inget byggsteg. Eftersom `config.json` hämtas med `fetch()`
måste filerna serveras över HTTP (öppna alltså **inte** `index.html` som `file://`).
Starta en enkel lokal server i projektmappen:

```bash
python3 -m http.server 8000
```

Öppna sedan:
- Publik sida: <http://localhost:8000/>
- Adminportal: <http://localhost:8000/admin.html> (standardlösenord: `ethar2026`)
