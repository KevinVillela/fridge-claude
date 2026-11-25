/**
 * Kitchen Stock: Google Sheet sync.
 *
 * Setup (once):
 *   1. In the "Kitchen Stock" sheet, open Extensions > Apps Script.
 *   2. Replace everything in Code.gs with this file and save.
 *   3. Deploy > New deployment > type "Web app".
 *      Execute as: Me. Who has access: Anyone. Deploy, approve access.
 *   4. Copy the Web app URL (ends in /exec) into Kitchen Stock > Settings.
 *
 * Tabs: "Inventory" (Item | State | Category | Perishable | Since | Updated)
 *       "Notes"     (A1 is a heading; one household note per row from A2)
 * Edits made directly in the sheet show up in the app within 30 seconds.
 */

const INV = "Inventory";
const NOTES = "Notes";
const HEAD = ["Item", "State", "Category", "Perishable", "Since", "Updated"];

// Same rule the app uses to give each item a stable key.
function slug_(name) {
  let s = String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  if (s) return s;
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return "item-" + h.toString(36);
}

function sheet_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (head) { sh.appendRow(head); sh.setFrozenRows(1); }
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ms_(v) {
  if (v instanceof Date) return v.getTime();
  const n = Number(v);
  return isFinite(n) && n > 0 ? n : 0;
}

function readInventory_() {
  const sh = sheet_(INV, HEAD);
  const values = sh.getDataRange().getValues();
  const items = {}, rows = {};
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const name = String(row[0] || "").trim();
    const state = String(row[1] || "").trim().toLowerCase();
    if (!name || ["have", "low", "out"].indexOf(state) < 0) continue;
    const key = slug_(name);
    const since = ms_(row[4]) || Date.now();
    items[key] = {
      name: name,
      state: state,
      cat: String(row[2] || "Other"),
      per: /^(yes|true|y|1)$/i.test(String(row[3]).trim()),
      since: since,
      upd: ms_(row[5]) || since
    };
    rows[key] = r + 1; // 1-based sheet row
  }
  return {sh: sh, items: items, rows: rows};
}

function readNotes_() {
  const sh = sheet_(NOTES, ["Household notes (Claude reads these before every reply; one per line)"]);
  const last = sh.getLastRow();
  if (last < 2) return "";
  return sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0] || "").trim(); })
    .filter(function (t) { return t; }).join("\n");
}

function doGet() {
  return json_({items: readInventory_().items, notes: readNotes_()});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.op === "patch") return json_(patch_(body.items || {}));
    if (body.op === "notes") return json_(notes_(String(body.text || "")));
    return json_({ok: false, error: "unknown op"});
  } catch (err) {
    return json_({ok: false, error: String(err)});
  } finally {
    lock.releaseLock();
  }
}

function patch_(incoming) {
  const inv = readInventory_();
  const sh = inv.sh;
  const toDelete = [];
  let changed = 0;
  Object.keys(incoming).forEach(function (key) {
    const v = incoming[key] || {};
    const cur = inv.items[key];
    const upd = Number(v.upd) || Date.now();
    if (cur && cur.upd > upd) return; // the sheet has a newer edit
    if (v.state === "removed") {
      if (inv.rows[key]) toDelete.push(inv.rows[key]);
      changed++;
      return;
    }
    if (["have", "low", "out"].indexOf(v.state) < 0 || !v.name) return;
    const row = [v.name, v.state, v.cat || "Other", v.per ? "yes" : "no", new Date(Number(v.since) || upd), new Date(upd)];
    if (inv.rows[key]) sh.getRange(inv.rows[key], 1, 1, 6).setValues([row]);
    else sh.appendRow(row);
    changed++;
  });
  toDelete.sort(function (a, b) { return b - a; }).forEach(function (r) { sh.deleteRow(r); });
  return {ok: true, changed: changed};
}

function notes_(text) {
  const sh = sheet_(NOTES, ["Household notes (Claude reads these before every reply; one per line)"]);
  const last = sh.getLastRow();
  if (last >= 2) sh.getRange(2, 1, last - 1, 1).clearContent();
  const lines = text.split(/\n/).map(function (t) { return t.trim(); }).filter(function (t) { return t; });
  if (lines.length) sh.getRange(2, 1, lines.length, 1).setValues(lines.map(function (t) { return [t]; }));
  return {ok: true, lines: lines.length};
}
