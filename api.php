<?php
// ============================================================
// KONFIGURATION – ändra dessa tre värden för din installation
// ============================================================

// URL till ditt Google Apps Script-webbapp (Deploy → Manage deployments)
$APPS_SCRIPT_URL   = 'https://script.google.com/macros/s/AKfycbzprkGZ_uRAc0TmPJM3eqVEnxWFxdODTxq4THVAedBVUGfHgoWc7vSwYI3PD2gh7xpCNw/exec';

// Hemlig token – måste vara SAMMA som ADMIN_TOKEN i backend/google-apps-script.gs
$APPS_SCRIPT_TOKEN = 'ec-2026-9f3a7c';

// Adminlösenord – ligger bara på servern; admin skriver detta i betalningsvyn
$ADMIN_PASSWORD    = 'ÄNDRA-MIG-hemligt-2026';

// ============================================================
// SVARSHUVUDEN
// ============================================================
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

// ============================================================
// HJÄLPFUNKTION – skickar JSON-svar och avslutar skriptet
// ============================================================
function out($code, $obj) {
    http_response_code($code);
    echo json_encode($obj);
    exit;
}

// ============================================================
// KRÄVER POST
// ============================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(405, ['ok' => false, 'error' => 'method']);
}

// ============================================================
// LÄS IN POST-PARAMETRAR
// ============================================================
$action = $_POST['action'] ?? '';
$pass   = $_POST['pass']   ?? '';
$row    = $_POST['row']    ?? '';
$paid   = $_POST['paid']   ?? '';

// ============================================================
// AUTENTISERING – tidssäker jämförelse för att motverka timing-attacker
// ============================================================
if (!hash_equals($ADMIN_PASSWORD, (string)$pass)) {
    usleep(300000); // 0,3 s fördröjning vid fel lösenord
    out(401, ['ok' => false, 'error' => 'auth']);
}

// ============================================================
// BYGG URL TILL APPS SCRIPT BEROENDE PÅ ÅTGÄRD
// ============================================================
if ($action === 'list') {
    $url = $APPS_SCRIPT_URL . '?action=list&token=' . rawurlencode($APPS_SCRIPT_TOKEN);
} elseif ($action === 'setPaid') {
    $row  = (int)$row;
    $paid = ($paid === '1' || $paid === 1 || $paid === true) ? '1' : '0';
    $url  = $APPS_SCRIPT_URL
          . '?action=setPaid&token=' . rawurlencode($APPS_SCRIPT_TOKEN)
          . '&row=' . $row
          . '&paid=' . $paid;
} else {
    out(400, ['ok' => false, 'error' => 'action']);
}

// ============================================================
// HÄMTA SVAR FRÅN APPS SCRIPT SERVERSIDIGT (följer 302-omdirigering)
// ============================================================
if (function_exists('curl_init')) {
    // Föredragen metod: cURL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $body = curl_exec($ch);
    curl_close($ch);
} else {
    // Reservmetod: file_get_contents med strömkontext
    $ctx  = stream_context_create(['http' => ['timeout' => 20], 'https' => ['timeout' => 20]]);
    $body = @file_get_contents($url, false, $ctx);
}

// Kontrollera att vi fick ett svar
if ($body === false || $body === '') {
    out(502, ['ok' => false, 'error' => 'upstream']);
}

// ============================================================
// VIDAREBEFORDRA SVARET ORÖRERAT TILL WEBBLÄSAREN
// ============================================================
http_response_code(200);
echo $body;
exit;
