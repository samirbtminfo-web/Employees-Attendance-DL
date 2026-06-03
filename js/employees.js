// ============================================================
//  DREAM LANDS — EMPLOYEE MASTER DATABASE
//  নতুন কর্মী যোগ করতে নিচের ফরম্যাট অনুসরণ করুন
// ============================================================

const EMPLOYEES = {

  // ════════════════════════════════════════
  //  TOP MANAGEMENT (CH / MD / GM / AGM)
  // ════════════════════════════════════════

  "3161": {
    id:          "3161",
    name:        "Ali Ahammed",          // ← আসল নাম দিন
    designation: "Chairman",
    team:        "Top Management",
    fullCode:    "CH-3161",
  },

  "75540": {
    id:          "75540",
    name:        "Samir Hossen", // ← আসল নাম দিন
    designation: "Managing Director",
    team:        "Top Management",
    fullCode:    "MD-75540",
  },

  "85541": {
    id:          "85541",
    name:        "Raihan Helaly",   // ← আসল নাম দিন
    designation: "General Manager",
    team:        "Top Management",
    fullCode:    "GM-85541",
  },

  "95542": {
    id:          "95542",
    name:        "Addl. Gen. Manager",// ← আসল নাম দিন
    designation: "Additional General Manager",
    team:        "Top Management",
    fullCode:    "AGM-95542",
  },

  // ════════════════════════════════════════
  //  MARKETING TEAM
  //  নতুন Marketing Executive যোগ করতে:
  //  "65541": { id:"65541", name:"...", designation:"Marketing Executive", team:"Marketing", fullCode:"ME-65541" },
  // ════════════════════════════════════════

  "65540": {
    id:          "65540",
    name:        "MD Nayeemuzzaman Nahid", // ← আসল নাম দিন
    designation: "Marketing Executive",
    team:        "Marketing",
    fullCode:    "ME-65540",
  },

  "65541": {
    id:          "65541",
    name:        "Farjana Lucky", // ← আসল নাম দিন
    designation: "Marketing Executive",
    team:        "Marketing",
    fullCode:    "ME-65541",
  },

  "65542": {
    id:          "65542",
    name:        "Kaniz Fatema Joya", // ← আসল নাম দিন
    designation: "Marketing Executive",
    team:        "Marketing",
    fullCode:    "ME-65542",
  },
  // ── নিচে নতুন ME যোগ করুন ──────────────
  // "65541": { id:"65541", name:"...", designation:"Marketing Executive", team:"Marketing", fullCode:"ME-65541" },
  // "65542": { id:"65542", name:"...", designation:"Marketing Executive", team:"Marketing", fullCode:"ME-65542" },

};

// ── ID দিয়ে employee খোঁজা ──────────────
function findEmployee(inputId) {
  const id = String(inputId).trim();
  return EMPLOYEES[id] || null;
}
