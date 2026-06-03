// ============================================================
//  DREAM LANDS — ATTENDANCE LOGIC
// ============================================================

// LocalStorage key
const LS_KEY = "dl_attendance_log";

// ── Get today's key ──────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Format time as "09:15 AM" ────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone: CONFIG.workHours.timezone });
}

// ── Format date for display ──────────────────────────────
function formatDateBn(date) {
  const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months= ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ── Load today's log ─────────────────────────────────────
function loadTodayLog() {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  return all[todayKey()] || {};
}

// ── Save to localStorage ─────────────────────────────────
function saveLog(empId, entry) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  const key = todayKey();
  if (!all[key]) all[key] = {};
  if (!all[key][empId]) all[key][empId] = {};
  Object.assign(all[key][empId], entry);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

// ── Get all logs (for admin) ─────────────────────────────
function getAllLogs() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
}

// ── Determine check-in or check-out ──────────────────────
function determineAction(empId) {
  const log = loadTodayLog();
  const rec = log[empId];
  if (!rec || !rec.checkIn)  return 'checkIn';
  if (rec.checkIn && !rec.checkOut) return 'checkOut';
  return 'done'; // already both done today
}

// ── Send to Google Sheet ─────────────────────────────────
async function sendToSheet(payload) {
  if (!CONFIG.sheetUrl || CONFIG.sheetUrl.includes('YOUR_SCRIPT_ID')) return true; // skip if not configured
  try {
    await fetch(CONFIG.sheetUrl, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    return true;
  } catch (e) {
    console.error('Sheet sync failed:', e);
    return false;
  }
}

// ── Record Attendance ─────────────────────────────────────
async function recordAttendance(empId) {
  const emp    = findEmployee(empId);
  const now    = new Date();
  const time   = formatTime(now);
  const date   = formatDateBn(now);
  const isoDate= todayKey();
  const action = determineAction(empId);

  if (!emp) return { ok: false, error: 'not_found' };
  if (action === 'done') return { ok: false, error: 'duplicate', emp, time, date };

  // save locally
  const entry = action === 'checkIn'
    ? { checkIn: time, checkInTs: now.toISOString() }
    : { checkOut: time, checkOutTs: now.toISOString() };
  saveLog(empId, entry);

  // send to Google Sheet
  await sendToSheet({
    type:        'attendance',
    date:        isoDate,
    empId:       emp.id,
    name:        emp.name,
    designation: emp.designation,
    team:        emp.team,
    fullCode:    emp.fullCode,
    action:      action === 'checkIn' ? 'Check-In' : 'Check-Out',
    time:        time,
    timestamp:   now.toISOString(),
  });

  return { ok: true, action, emp, time, date };
}

// ── Get monthly summary for admin ────────────────────────
function getMonthlySummary(year, month) {
  const all = getAllLogs();
  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  const result = [];

  Object.entries(all).forEach(([date, dayLog]) => {
    if (!date.startsWith(prefix)) return;
    Object.entries(dayLog).forEach(([empId, rec]) => {
      const emp = findEmployee(empId);
      result.push({
        date, empId,
        name:        emp?.name        || empId,
        designation: emp?.designation || '—',
        team:        emp?.team        || '—',
        checkIn:     rec.checkIn  || '—',
        checkOut:    rec.checkOut || '—',
      });
    });
  });

  return result.sort((a,b) => a.date.localeCompare(b.date));
}
