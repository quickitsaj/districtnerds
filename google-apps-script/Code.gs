/**
 * AJ's Annual Quest — RSVP receiver
 *
 * Lives inside the "AJ's Annual Quest RSVPs" Google Sheet
 * (Extensions → Apps Script). Receives a JSON POST from the website
 * and appends one row per RSVP. Deploy it once as a web app and paste
 * the web app URL into js/config.js → rsvp.endpoint.
 *
 * Deploy: Deploy → New deployment → type "Web app"
 *         Execute as: Me · Who has access: Anyone → Deploy → copy the URL.
 * Re-deploy (Manage deployments → edit → new version) after any edit here.
 */

var SHEET_NAME = "RSVPs";
var NOTIFY_EMAIL = ""; // e.g. "you@example.com" to get an email per RSVP; leave "" for none

var HEADERS = ["Submitted", "Name", "Email", "Joining", "Guests", "Events",
  "Nintendo friend code", "Discord", "Food notes", "Camera OK", "Note", "User agent"];

var JOINING = { in_person: "In person", online: "Online", watching: "Watching" };
var EVENTS = {
  casual_smash: "Casual Smash Cup", smash_championship: "Smash Championship", friendslop: "friendslop",
  jackbox: "Casual Jackbox", fortnite: "Fortnite", freeplay: "Mario Kart & tabletop", watching: "Just watching"
};

function clip(v, max) { return String(v == null ? "" : v).trim().slice(0, max); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // honeypot: bots fill the hidden field; pretend it worked and write nothing
    if (data.website) return reply({ ok: true });

    var name = clip(data.name, 120), email = clip(data.email, 200).toLowerCase();
    var joining = JOINING[clip(data.attendance, 20)] || "";
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ ok: false, error: "missing fields" });

    var events = (Array.isArray(data.events) ? data.events : []).slice(0, 10)
      .map(function (k) { return EVENTS[k] || clip(k, 40); }).join(", ");
    var guests = Math.max(0, Math.min(10, parseInt(data.guests, 10) || 0));

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);

    var row = [new Date(), name, email, joining, guests, events,
      clip(data.friend_code, 20), clip(data.discord, 60), clip(data.dietary, 200),
      data.camera_ok === "no" ? "No" : (data.camera_ok === "yes" ? "Yes" : ""),
      clip(data.note, 1000), clip(data.user_agent, 200)];
    sh.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, "New RSVP: " + name + " (" + joining + ")",
        HEADERS.map(function (h, i) { return h + ": " + row[i]; }).join("\n"));
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function doGet() {
  return reply({ ok: true, service: "AJ's Annual Quest RSVP" });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to put the header row in place and freeze it. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sh.getName() !== SHEET_NAME) sh.setName(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  sh.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm");
}
