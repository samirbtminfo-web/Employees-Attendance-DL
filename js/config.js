// ============================================================
//  DREAM LANDS — ATTENDANCE SYSTEM CONFIGURATION
//  এই ফাইলে আপনার সব সেটিংস পরিবর্তন করুন
// ============================================================

const CONFIG = {

  // ── 1. COMPANY ──────────────────────────────────────────
  company: {
    name:    "Dream Lands",
    tagline: "Real Estate Limited",
    logo:    "🏢",          // ইমোজি বা img src দিতে পারেন
  },

  // ── 2. GOOGLE SHEET (Apps Script Web App URL) ────────────
  //  Setup গাইড: README.md দেখুন
  sheetUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec",
  //  ↑ এই URL আপনার নিজের Apps Script Deploy URL দিয়ে বদলান

  // ── 3. OFFICE IP RESTRICTION ─────────────────────────────
  ipRestriction: {
    enabled: false,          // true করলে শুধু allowedIPs থেকে access হবে
    allowedIPs: [
      // "103.x.x.x",        // আপনার অফিসের public IP
      // "192.168.x.x",      // local network
    ],
    // IP check করার জন্য free API (rate limited)
    ipApiUrl: "https://api.ipify.org?format=json",
  },

  // ── 4. WORK HOURS ─────────────────────────────────────────
  workHours: {
    checkInStart:  "07:00",   // check-in শুরুর সময়
    checkInEnd:    "12:00",   // check-in শেষের সময়
    checkOutStart: "14:00",   // check-out শুরুর সময়
    checkOutEnd:   "22:00",   // check-out শেষের সময়
    timezone:      "Asia/Dhaka",
  },

  // ── 5. DUPLICATE PREVENTION ───────────────────────────────
  //  একই দিনে check-in + check-out দুটো করার পর আর submit হবে না
  duplicatePrevention: true,

  // ── 6. ADMIN ──────────────────────────────────────────────
  admin: {
    // Admin dashboard এ ঢোকার পাসওয়ার্ড
    password: "DreamLands@2025",
  },
};
