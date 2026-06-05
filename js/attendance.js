// ============================================================
//  DREAM LANDS — ATTENDANCE LOGIC v4
//  ✅ Google Sheet = PRIMARY storage (সব device এ একই data)
//  ✅ LocalStorage = BACKUP only (offline fallback)
//  ✅ Admin সরাসরি Sheet থেকে পড়বে
// ============================================================

const LS_KEY = "dl_attendance_log";

// ── Today's date key (YYYY-MM-DD) ────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Format time as "09:15 AM" ────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour:   '2-digit', minute: '2-digit',
    hour12: true, timeZone: CONFIG.workHours.timezone
  });
}

// ── Format date for display ──────────────────────────────
function formatDateBn(date) {
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ── LocalStorage helpers (backup only) ───────────────────
function lsGetAll() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
}
function lsSaveLog(empId, entry) {
  const all = lsGetAll();
  const key = todayKey();
  if (!all[key]) all[key] = {};
  if (!all[key][empId]) all[key][empId] = {};
  Object.assign(all[key][empId], entry);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}
function lsLoadToday() {
  return lsGetAll()[todayKey()] || {};
}

// ── Determine action from Sheet (PRIMARY) ─────────────────
// Google Sheet এর Daily Summary থেকে আজকের record পড়া
async function determineActionFromSheet(empId) {
  if (!CONFIG.sheetUrl || CONFIG.sheetUrl.includes('YOUR_SCRIPT_ID')) {
    // Sheet নেই → LocalStorage fallback
    return determineActionLocal(empId);
  }
  try {
    const url = `${CONFIG.sheetUrl}?action=getAttendance&date=${todayKey()}`;
    const res = await fetch(url, { method: 'GET' });
    const data = await res.json();
    if (data.success && data.rows) {
      const rec = data.rows.find(r => String(r.empId) === String(empId));
      if (!rec)              return 'checkIn';
      if (!rec.checkOut)     return 'checkOut';
      return 'done';
    }
  } catch (e) {
    console.warn('Sheet read failed, falling back to localStorage:', e);
  }
  return determineActionLocal(empId);
}

// LocalStorage থেকে action নির্ধারণ (fallback)
function determineActionLocal(empId) {
  const log = lsLoadToday();
  const rec = log[empId];
  if (!rec || !rec.checkIn)             return 'checkIn';
  if (rec.checkIn && !rec.checkOut)     return 'checkOut';
  return 'done';
}

// ── Send to Google Sheet ──────────────────────────────────
async function sendToSheet(payload) {
  if (!CONFIG.sheetUrl || CONFIG.sheetUrl.includes('YOUR_SCRIPT_ID')) return true;
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

// ── Record Attendance (MAIN FUNCTION) ─────────────────────
async function recordAttendance(empId) {
  const emp     = findEmployee(empId);
  const now     = new Date();
  const time    = formatTime(now);
  const date    = formatDateBn(now);
  const isoDate = todayKey();

  if (!emp) return { ok: false, error: 'not_found' };

  // ✅ Sheet থেকে action নির্ধারণ করো (সব device এ consistent)
  const action = await determineActionFromSheet(empId);

  if (action === 'done') return { ok: false, error: 'duplicate', emp, time, date };

  // ✅ LocalStorage এ backup রাখো
  const entry = action === 'checkIn'
    ? { checkIn: time, checkInTs: now.toISOString() }
    : { checkOut: time, checkOutTs: now.toISOString() };
  lsSaveLog(empId, entry);

  // ✅ Google Sheet এ পাঠাও
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

// ── Admin: Get today's attendance from SHEET ──────────────
async function getTodayFromSheet() {
  if (!CONFIG.sheetUrl || CONFIG.sheetUrl.includes('YOUR_SCRIPT_ID')) {
    return getTodayFromLocal();
  }
  try {
    const url = `${CONFIG.sheetUrl}?action=getAttendance&date=${todayKey()}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) return data.rows || [];
  } catch (e) {
    console.warn('Sheet fetch failed, using localStorage:', e);
  }
  return getTodayFromLocal();
}

// ── Admin: Get monthly data from SHEET ───────────────────
async function getMonthlyFromSheet(yearMonth) {
  if (!CONFIG.sheetUrl || CONFIG.sheetUrl.includes('YOUR_SCRIPT_ID')) {
    return getMonthlyFromLocal(yearMonth);
  }
  try {
    const url = `${CONFIG.sheetUrl}?action=getAttendance&month=${yearMonth}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) return data.rows || [];
  } catch (e) {
    console.warn('Sheet fetch failed, using localStorage:', e);
  }
  return getMonthlyFromLocal(yearMonth);
}

// ── LocalStorage fallback for admin ──────────────────────
function getTodayFromLocal() {
  const all = lsGetAll();
  const today = todayKey();
  const dayLog = all[today] || {};
  return Object.entries(dayLog).map(([empId, rec]) => {
    const emp = findEmployee(empId);
    return {
      date:        today,
      empId:       empId,
      name:        emp?.name        || empId,
      designation: emp?.designation || '—',
      team:        emp?.team        || '—',
      checkIn:     rec.checkIn  || '',
      checkOut:    rec.checkOut || '',
      duration:    '',
    };
  });
}

function getMonthlyFromLocal(yearMonth) {
  const all = lsGetAll();
  const result = [];
  Object.entries(all).forEach(([date, dayLog]) => {
    if (!date.startsWith(yearMonth)) return;
    Object.entries(dayLog).forEach(([empId, rec]) => {
      const emp = findEmployee(empId);
      result.push({
        date, empId,
        name:        emp?.name        || empId,
        designation: emp?.designation || '—',
        team:        emp?.team        || '—',
        checkIn:     rec.checkIn  || '',
        checkOut:    rec.checkOut || '',
        duration:    '',
      });
    });
  });
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Legacy: getAllLogs (admin.html compatibility) ─────────
function getAllLogs() {
  return lsGetAll();
}
function getMonthlySummary(year, month) {
  const ym = `${year}-${String(month).padStart(2,'0')}`;
  return getMonthlyFromLocal(ym);
}
