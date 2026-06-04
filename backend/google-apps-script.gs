/**
 * Ethar Cup — anmälningar & betalningar  (Google Apps Script, bundet till ett Sheet)
 * ---------------------------------------------------------------------------------
 *  - Publika formuläret POSTar hit        -> ny rad i arket            (doPost)
 *  - Adminportalen läser listan           -> doGet?action=list         (JSONP)
 *  - Adminportalen bockar av "Betald"     -> doGet?action=setPaid      (JSONP)
 *
 *  Kolumner i arket:
 *    Tidpunkt | Lagnamn | Kontakt | E-post | Telefon | Antal | Meddelande | Typ | Betald
 *
 *  INSTÄLLNING (en gång):
 *   1. Skapa ett Google Sheet (anmälningslistan = er "excel").
 *   2. I kalkylarket: Tillägg (Extensions) -> Apps Script. Klistra in HELA koden. Spara.
 *   3. Sätt NOTIFY_EMAIL och ADMIN_TOKEN nedan.
 *        ADMIN_TOKEN MÅSTE vara samma som PAY_TOKEN överst i admin.html.
 *   4. Distribuera (Deploy) -> Ny distribution -> typ: Webbapp.
 *        - Kör som (Execute as): Jag själv (Me)
 *        - Vem har åtkomst (Who has access): Alla (Anyone)   <-- VIKTIGT
 *      Kopiera /exec-URL:en till config.json ("settings.formEndpoint").
 *   5. Ändrar ni koden senare: Distribuera -> Hantera distributioner -> redigera ->
 *      Ny version. /exec-URL:en förblir densamma.
 *
 *  Formuläret skickar: formtyp, lagnamn, kontakt, epost, telefon, antal, meddelande.
 */

var NOTIFY_EMAIL = "info@etharreliefsverige.se"; // "" = skicka inget mejl
var ADMIN_TOKEN  = "ec-2026-9f3a7c";             // = PAY_TOKEN i admin.html (byt gärna)

var HEADERS  = ["Tidpunkt", "Lagnamn", "Kontakt", "E-post", "Telefon",
                "Antal", "Meddelande", "Typ", "Betald"];
var COL_PAID = 9; // 1-baserad kolumn för "Betald"

function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }
function ensureHeader_(sh) { if (sh.getLastRow() === 0) sh.appendRow(HEADERS); }

/* ---------------- Publik anmälan (POST) ---------------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // undvik krockar vid samtidiga anmälningar
  try {
    var p = (e && e.parameter) || {};
    var sh = sheet_();
    ensureHeader_(sh);
    sh.appendRow([
      new Date(),
      p.lagnamn || "", p.kontakt || "", p.epost || "", p.telefon || "",
      p.antal || "", p.meddelande || "", p.formtyp || "lag", ""
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
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Admin: lista + markera betald (GET/JSONP) ---------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "list")    return reply_(p.callback, list_(p.token));
  if (p.action === "setPaid") return reply_(p.callback, setPaid_(p.token, p.row, p.paid));
  return ContentService.createTextOutput("Ethar Cup form endpoint är igång.");
}

function list_(token) {
  if (token !== ADMIN_TOKEN) return { ok: false, error: "auth" };
  var values = sheet_().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {       // rad 0 = rubriker
    var r = values[i];
    if (!r[1] && !r[2] && !r[3]) continue;         // hoppa tomma rader
    out.push({
      row: i + 1,                                  // 1-baserat radnummer i arket
      tid: r[0], lagnamn: r[1], kontakt: r[2], epost: r[3],
      telefon: r[4], antal: r[5], meddelande: r[6], typ: r[7],
      betald: isPaid_(r[8])
    });
  }
  return { ok: true, registrations: out };
}

function setPaid_(token, row, paid) {
  if (token !== ADMIN_TOKEN) return { ok: false, error: "auth" };
  var n = parseInt(row, 10);
  if (!n || n < 2) return { ok: false, error: "row" };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();
    ensureHeader_(sh);
    if (String(sh.getRange(1, COL_PAID).getValue()) === "") sh.getRange(1, COL_PAID).setValue("Betald");
    var on = (String(paid) === "1" || String(paid).toLowerCase() === "true");
    sh.getRange(n, COL_PAID).setValue(on ? "Ja" : "");
    return { ok: true, row: n, betald: on };
  } finally {
    lock.releaseLock();
  }
}

function isPaid_(v) {
  if (v === true) return true;
  var s = String(v).trim().toLowerCase();
  return s === "ja" || s === "yes" || s === "true" || s === "1" || s === "x";
}

/* ---------------- svar-helpers ---------------- */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function reply_(callback, obj) {
  var body = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + body + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT); // JSONP
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
