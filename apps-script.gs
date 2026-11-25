/**
 * Fridge Claude — Google Sheet sync.
 * Paste into Extensions > Apps Script of a new Google Sheet, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Put the /exec URL into the tablet's Settings.
 *
 * Sheet layout (tab "Inventory"): Item | Status | Updated
 * You (or Claude in chat) can edit statuses directly in the sheet;
 * the tablet picks them up within 5 minutes or when it wakes.
 */
const TAB = "Inventory";

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB);
  if (!sh) {
    sh = ss.insertSheet(TAB);
    sh.appendRow(["Item", "Status", "Updated"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const items = {};
  rows.forEach(function (r) {
    const name = String(r[0] || "").trim().toLowerCase();
    const status = String(r[1] || "").trim().toLowerCase();
    if (!name || ["have", "low", "out"].indexOf(status) < 0) return;
    const updated = r[2] instanceof Date ? r[2].getTime() : Date.now();
    items[name] = { status: status, updated: updated };
  });
  return json_({ items: items });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const items = body.items || {};
    const names = Object.keys(items).sort();
    const rows = names.map(function (n) {
      return [n, items[n].status, new Date(Number(items[n].updated) || Date.now())];
    });
    const sh = sheet_();
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
    if (rows.length) sh.getRange(2, 1, rows.length, 3).setValues(rows);
    return json_({ ok: true, count: rows.length });
  } finally {
    lock.releaseLock();
  }
}
