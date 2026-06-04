# Ethar Cup — webbsida & adminportal

## Filer
- **index.html** — den publika sidan (det besökarna ser).
- **admin.html** — adminportalen där ni redigerar allt innehåll.
- **config.json** — allt innehåll (texter, färger, datum, formulär-endpoint).
- **styles.css**, **app.js** — design och funktionalitet för den publika sidan.

Ladda upp **alla** filer till samma mapp på webbhotellet (t.ex. One.com).

## Lägga upp på one.com bredvid WordPress (undermapp)
Sidan är helt statisk och alla länkar är relativa, så den kan ligga i valfri
undermapp utan ändringar — t.ex. `etharreliefsverige.se/cup/`.

**Påverkar det WordPress?** Nej. WordPress `.htaccess` i rotmappen skriver bara om
adresser som *inte* matchar en riktig fil eller mapp (`!-f` / `!-d`). En riktig
undermapp med statiska filer serveras därför direkt, förbi WordPress —
`wp-content`, `wp-config.php` och databasen rörs inte.

1. Anslut via one.coms filhanterare eller SFTP.
2. Gå till samma mapp där WordPress-filerna ligger (`index.php`, `wp-admin`, `wp-content` …).
3. Skapa en mapp, t.ex. `cup`.
4. Ladda upp `index.html`, `styles.css`, `app.js`, `admin.html`, `config.json` och `.htaccess` dit.
5. Öppna `https://etharreliefsverige.se/cup/` (admin: `…/cup/admin.html`).

Den medföljande `.htaccess` sätter `index.html` som startsida och stänger av
URL-omskrivning lokalt i mappen. Välj ett mappnamn som inte krockar med en
befintlig WordPress-sida med samma slug (en riktig mapp tar över den adressen).
För ännu tightare isolering går det att skapa en subdomän
(`cup.etharreliefsverige.se`) som pekar på mappen.

## Så redigerar ni innehållet
1. Gå till `eradoman.se/admin.html`.
2. Logga in (standardlösenord: **ethar2026** — byt det under fliken *Inställningar*).
3. Ändra texter, färger, datum, fakta, formulärfält m.m. Allt syns direkt i den inbyggda förhandsgranskningen.
4. Klicka **Publicera (ladda ner)** — då hämtas en ny `config.json`.
5. Ladda upp den nya `config.json` till webbhotellet (skriv över den gamla).
6. Klart — den publika sidan visar nu det nya innehållet för alla.

> Ändringar sparas automatiskt som ett lokalt utkast i webbläsaren tills ni publicerar. Knappen **Återställ** kastar utkastet och går tillbaka till senast publicerade version.

## Formulär (laganmälan)
Sätt en endpoint under *Inställningar → Formulär-endpoint*:
- **Google Apps Script** (Web App) eller **Formspree** rekommenderas.
- Formuläret skickar fältet `formtyp = "lag"` så att anmälningar går att sortera.
- Är endpoint tomt körs ett **testläge** som visar bekräftelse utan att skicka något.
- Fungerar inte JavaScript får besökaren en länk att mejla anmälan istället.

## Att fylla i (riktiga uppgifter)
Allt nedan ändras i adminportalen:
- Datum, tid, plats/adress, kollektivtrafik
- Format, ålder, lagstorlek, matchtid, avgift, pris, platser, sista anmälningsdag
- Kontakt-e-post och telefon
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
