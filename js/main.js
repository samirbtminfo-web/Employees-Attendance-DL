// ============================================================
//  DREAM LANDS — MAIN UI LOGIC
// ============================================================

// ── Live Clock ───────────────────────────────────────────
function updateClock() {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true, timeZone: CONFIG.workHours.timezone });
  const date = formatDateBn(now);
  const el = document.getElementById('liveClock');
  const de = document.getElementById('liveDate');
  if (el) el.textContent = time;
  if (de) de.textContent = date;
}
setInterval(updateClock, 1000);
updateClock();

// ── IP Check ─────────────────────────────────────────────
async function checkIP() {
  if (!CONFIG.ipRestriction.enabled || !CONFIG.ipRestriction.allowedIPs.length) return true;
  try {
    const res  = await fetch(CONFIG.ipRestriction.ipApiUrl);
    const data = await res.json();
    const ip   = data.ip;
    return CONFIG.ipRestriction.allowedIPs.some(allowed => ip.startsWith(allowed.replace('*','')));
  } catch {
    return true; // if check fails, allow (fail-open)
  }
}

// ── Submit Attendance ─────────────────────────────────────
async function submitAttendance() {
  const input = document.getElementById('empId');
  const id    = input.value.trim();
  const btn   = document.getElementById('submitBtn');
  const spin  = document.getElementById('spinner');
  const btnTxt= document.getElementById('btnText');

  if (!id) { shakeInput(); return; }

  // IP check
  const ipOk = await checkIP();
  if (!ipOk) {
    document.getElementById('ipWarn').style.display = 'block';
    document.getElementById('mainCard').style.display = 'none';
    return;
  }

  // Loading state
  btn.disabled = true;
  spin.style.display = 'inline-block';
  btnTxt.textContent = 'Processing...';
  hideResult();

  // Small UX delay
  await new Promise(r => setTimeout(r, 600));

  const result = await recordAttendance(id);

  // Reset button
  btn.disabled = false;
  spin.style.display = 'none';
  btnTxt.textContent = '✅ Submit Attendance';

  showResult(result);
  if (result.ok) {
    input.value = '';
    input.focus();
  }
}

// ── Show Result ───────────────────────────────────────────
function showResult(r) {
  const box   = document.getElementById('resultBox');
  const icon  = document.getElementById('resIcon');
  const welcome = document.getElementById('resWelcome');
  const name  = document.getElementById('resName');
  const desig = document.getElementById('resDesig');
  const badge = document.getElementById('resBadge');
  const time  = document.getElementById('resTime');
  const date  = document.getElementById('resDate');
  const msg   = document.getElementById('resMsg');

  box.className = 'result-box';
  box.style.display = 'block';

  if (!r.ok && r.error === 'not_found') {
    box.classList.add('error');
    icon.textContent = '❌';
    welcome.textContent = 'ID পাওয়া যায়নি';
    name.textContent = `"${document.getElementById('empId').value.trim()}"`;
    name.style.color = 'var(--danger)';
    desig.textContent = '';
    badge.innerHTML = '';
    time.textContent = '';
    date.textContent = '';
    msg.textContent = 'অনুগ্রহ করে সঠিক Employee ID দিন।';
    return;
  }

  if (!r.ok && r.error === 'duplicate') {
    box.classList.add('error');
    icon.textContent = '⚠️';
    welcome.textContent = `Welcome, ${r.emp.designation}`;
    name.textContent = r.emp.name;
    name.style.color = 'var(--warning)';
    desig.textContent = r.emp.team + ' · ' + r.emp.fullCode;
    badge.innerHTML = '';
    time.textContent = r.time;
    date.textContent = r.date;
    msg.textContent = 'আজকের Check-In ও Check-Out উভয়ই সম্পন্ন হয়েছে।';
    return;
  }

  // SUCCESS
  box.classList.add('success');
  const isIn = r.action === 'checkIn';
  icon.textContent = isIn ? '✅' : '👋';
  welcome.textContent = `Welcome,`;
  name.textContent = r.emp.name;
  name.style.color = 'var(--gold)';
  desig.textContent = r.emp.designation + ' · ' + r.emp.team;

  badge.innerHTML = isIn
    ? `<span class="result-status-badge checkin-badge">🟢 Check-In Recorded</span>`
    : `<span class="result-status-badge checkout-badge">🌙 Check-Out Recorded</span>`;

  time.textContent = r.time;
  date.textContent = r.date;
  msg.textContent = 'Attendance Recorded Successfully ✓';

  // Auto-hide after 8 seconds
  setTimeout(hideResult, 8000);
}

function hideResult() {
  const box = document.getElementById('resultBox');
  if (box) { box.style.display = 'none'; box.className = 'result-box'; }
}

// ── Shake animation for empty input ──────────────────────
function shakeInput() {
  const el = document.getElementById('empId');
  el.style.borderColor = 'var(--danger)';
  el.style.animation = 'none';
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

// ── Enter key support ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('empId');
  if (el) el.focus();
});
