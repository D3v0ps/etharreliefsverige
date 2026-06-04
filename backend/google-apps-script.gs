/**
 * Ethar Cup — laganmälningar -> Google Sheet (+ valfri mejlnotis)
 * ----------------------------------------------------------------
 * Tar emot POST från anmälningsformuläret på sajten och lägger varje
 * anmälan som en ny rad i kalkylarket ("excel"-listan).
 *
 * INSTÄLLNING (en gång):
 *  1. Skapa ett Google Sheet — det blir er lista med anmälningar.
 *  2. I kalkylarket: Tillägg (Extensions) -> Apps Script.
 *  3. Klistra in HELA den här koden. Spara.
 *  4. Sätt NOTIFY_EMAIL nedan (mejl vid ny anmälan) eller lämna "" för inget mejl.
 *  5. Distribuera (Deploy) -> Ny distribution -> typ: Webbapp.
 *       - Kör som (Execute as): Jag själv (Me)
 *       - Vem har åtkomst (Who has access): Alla (Anyone)   <-- VIKTIGT
 *     Kopiera webbapp-URL:en som slutar på /exec.
 *  6. Klistra in URL:en i adminportalen: Inställningar -> Formulär-endpoint,
 *     och Publicera (eller sätt "settings.formEndpoint" i config.json).
 *
 * OBS: Ändrar ni koden senare måste ni distribuera en NY version
 *      (Deploy -> Manage deployments -> redigera -> New version) för att
 *      ändringen ska slå igenom. /exec-URL:en är densamma.
 *
 * Formuläret skickar fälten:
 *   formtyp, lagnamn, kontakt, epost, telefon, antal, meddelande
 */

var NOTIFY_EMAIL = "info@etharreliefsverige.se"; // "" = skicka inget mejl

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // undvik krockar vid samtidiga anmälningar
  try {
    var p = (e && e.parameter) || {};
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Lägg rubrikrad första gången.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tidpunkt", "Lagnamn", "Kontakt", "E-post",
                       "Telefon", "Antal", "Meddelande", "Typ"]);
    }

    sheet.appendRow([
      new Date(),
      p.lagnamn || "",
      p.kontakt || "",
      p.epost || "",
      p.telefon || "",
      p.antal || "",
      p.meddelande || "",
      p.formtyp || "lag"
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        "Ny laganmälan: " + (p.lagnamn || "okänt lag"),
        "Lagnamn: " + (p.lagnamn || "") + "\n" +
        "Kontaktperson: " + (p.kontakt || "") + "\n" +
        "E-post: " + (p.epost || "") + "\n" +
        "Telefon: " + (p.telefon || "") + "\n" +
        "Antal spelare: " + (p.antal || "") + "\n" +
        "Meddelande: " + (p.meddelande || "") + "\n"
      );
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Valfri GET så man kan öppna /exec i webbläsaren och se att appen lever.
function doGet() {
  return ContentService.createTextOutput("Ethar Cup form endpoint är igång.");
}
