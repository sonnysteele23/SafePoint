import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle, MessageSquare, Send, Building2, User, Users,
  MapPin, Clock, AlertCircle, ShieldAlert, TrendingUp, TrendingDown, ChevronRight,
  Plus, Check, X, Download, ChevronLeft, Hammer, Phone, Zap,
  Megaphone, ArrowRight, LogOut, ChevronDown, Bell, Tag,
  Mail, Lock, Sparkles, ShieldCheck, Siren,
  FileWarning, Calendar, Briefcase, Gavel, UserCheck, Activity,
  Sun, Moon
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

// ============================================================
// DESIGN TOKENS — light and dark theme variants
// ============================================================
const C_LIGHT = {
  bg: "#FAFAF9",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F5F4",
  surfaceHover: "#FAFAF9",
  border: "#E7E5E4",
  borderStrong: "#D6D3D1",
  text: "#1C1917",
  textSecondary: "#57534E",
  textMuted: "#A8A29E",
  textFaint: "#D6D3D1",
  accent: "#B53C2A",
  accentHover: "#9A3322",
  accentSoft: "#FDF4F1",
  accentBorder: "#F5D5CD",
  critical: "#DC2626",
  criticalBg: "#FEF2F2",
  high: "#EA580C",
  highBg: "#FFF7ED",
  medium: "#D97706",
  mediumBg: "#FFFBEB",
  low: "#059669",
  lowBg: "#ECFDF5",
  info: "#1D4ED8",
  infoBg: "#EFF6FF",
  // toast stays dark in both modes for visual punch
  toastBg: "#1C1917",
  toastFg: "#FFFFFF",
};

const C_DARK = {
  bg: "#061826",           // deep dark teal-navy from screenshot
  surface: "#0C2538",      // card surface
  surfaceAlt: "#163149",   // alt for raised elements
  surfaceHover: "#1A395A", // hover state
  border: "#1F3A53",       // subtle border
  borderStrong: "#2F4D6A",
  text: "#F5F5F4",         // near-white
  textSecondary: "#C7D4DC",
  textMuted: "#7C8E9D",    // cool blue-gray
  textFaint: "#3D5063",
  accent: "#E5563F",       // brightened rust for dark contrast
  accentHover: "#FF6850",
  accentSoft: "#2B1814",   // dark rust-tinted surface
  accentBorder: "#5C2B23",
  critical: "#F87171",     // brighter red for dark BG
  criticalBg: "#3B1818",
  high: "#FB923C",
  highBg: "#3D2818",
  medium: "#FBBF24",
  mediumBg: "#3D3018",
  low: "#34D399",
  lowBg: "#0F2B22",
  info: "#60A5FA",
  infoBg: "#0F2238",
  // toast: light in dark mode for inversion punch
  toastBg: "#F5F5F4",
  toastFg: "#0C2538",
};

// Mutable shared color object. Components read from this and inline styles
// re-evaluate each render. applyTheme() swaps values synchronously before
// the next render so children see the new colors.
const C = { ...C_LIGHT };

function applyTheme(mode) {
  const src = mode === "dark" ? C_DARK : C_LIGHT;
  for (const k of Object.keys(C)) delete C[k];
  Object.assign(C, src);
}

const FONTS = {
  display: "'Inter Tight', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};
const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700&display=swap";

const R = { sm: 6, md: 8, lg: 10, xl: 12, full: 999 };

const SHADOW = {
  card: "0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
  raised: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
  modal: "0 24px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  menu: "0 10px 30px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
};

// SEVERITY uses property getters so SEVERITY.low.color reads current C values
// rather than the snapshot at module init.
const SEVERITY = {
  low:      { get color() { return C.low; },      get bg() { return C.lowBg; },      label: "Low" },
  medium:   { get color() { return C.medium; },   get bg() { return C.mediumBg; },   label: "Medium" },
  high:     { get color() { return C.high; },     get bg() { return C.highBg; },     label: "High" },
  critical: { get color() { return C.critical; }, get bg() { return C.criticalBg; }, label: "Critical" },
};

const TYPE_META = {
  physical: { label: "Physical assault or injury", icon: ShieldAlert },
  verbal: { label: "Verbal threat or harassment", icon: MessageSquare },
  weapon: { label: "Weapon present", icon: AlertCircle },
  facilities: { label: "Facilities hazard", icon: Hammer },
  other: { label: "Other safety concern", icon: AlertTriangle },
};

const BUILDINGS = [
  "Lincoln Elementary", "Roosevelt Middle", "Westfield High",
  "Parker Elementary", "Central Middle", "Jefferson Elementary",
];

// MA geography — real city coordinates (lon/lat), projected onto the MA outline in GeoHeatMap
const BUILDING_GEO = {
  "Westfield High":       { city: "Westfield",   lon: -72.749, lat: 42.125 },
  "Lincoln Elementary":   { city: "Springfield", lon: -72.589, lat: 42.101 },
  "Roosevelt Middle":     { city: "Worcester",   lon: -71.802, lat: 42.263 },
  "Central Middle":       { city: "Lowell",      lon: -71.315, lat: 42.633 },
  "Parker Elementary":    { city: "Cambridge",   lon: -71.106, lat: 42.375 },
  "Jefferson Elementary": { city: "Boston",      lon: -71.058, lat: 42.360 },
};

// ============================================================
// TERMS — acronym glossary, used by <Term> tooltip component
// ============================================================
const TERMS = {
  BIP:    { full: "Behavior Intervention Plan", desc: "A written plan for a student with significant behavioral challenges, required under IDEA when behavior interferes with learning. Specifies positive supports, de-escalation steps, and crisis procedures." },
  FBA:    { full: "Functional Behavior Assessment", desc: "A structured evaluation by a qualified specialist that identifies the function — the 'why' — of a student's challenging behavior. Used to design or revise a BIP." },
  IEP:    { full: "Individualized Education Program", desc: "Federally-required legal document under IDEA detailing specialized instruction, related services, and accommodations for a student with a disability. Updated annually by the IEP team." },
  IDEA:   { full: "Individuals with Disabilities Education Act", desc: "Federal law guaranteeing free appropriate public education and special education services to students with disabilities ages 3–21." },
  "504":  { full: "Section 504 Plan", desc: "Plan under Section 504 of the Rehabilitation Act providing accommodations for students with disabilities who don't qualify for an IEP." },
  IA:     { full: "Instructional Assistant", desc: "Paraprofessional who supports students under a teacher's direction. Often provides 1:1 or small-group help in special education classrooms. Among the lowest-paid and most-exposed staff in K–12." },
  OSHA:   { full: "Occupational Safety and Health Administration", desc: "Federal workplace safety agency. In 26 states plus 2 territories, OSHA covers public school employees. The General Duty Clause requires employers to provide a workplace free of recognized hazards likely to cause death or serious harm." },
  FERPA:  { full: "Family Educational Rights and Privacy Act", desc: "Federal law protecting the privacy of student education records. Limits who can access student-identifying information and requires consent for most disclosures." },
  HIPAA:  { full: "Health Insurance Portability and Accountability Act", desc: "Federal law protecting individually identifiable health information. In a workplace context, governs how employers handle health-related staff data." },
  EAP:    { full: "Employee Assistance Program", desc: "Employer-provided confidential counseling and mental-health support services. Commonly used by staff after traumatic incidents." },
  PHI:    { full: "Protected Health Information", desc: "Individually identifiable health data, protected under HIPAA. Includes diagnoses, treatment records, and biometric data." },
  PSAP:   { full: "Public Safety Answering Point", desc: "The 911 call center that receives emergency calls and dispatches police, fire, or medical services." },
  CPI:    { full: "Crisis Prevention Institute training", desc: "Industry-standard de-escalation and safe physical intervention training widely used in K–12 special education settings." },
  MANDT:  { full: "Mandt System training", desc: "Alternative de-escalation training program emphasizing relationship-based intervention; used in some districts in place of or alongside CPI." },
  SIS:    { full: "Student Information System", desc: "District software system of record for student demographics, enrollment, attendance, and grades. Examples: Aspen, PowerSchool, Skyward, Infinite Campus." },
};


const TAG_SUGGESTIONS = [
  "bite", "hit", "kick", "scratch", "slap", "thrown object",
  "verbal threat", "harassment", "weapon",
  "skin broken", "no injury", "bruise", "worker's comp",
  "student", "parent", "stranger",
  "special ed", "BIP", "restraint", "elopement", "transition",
  "mold", "asbestos", "facilities", "heat", "cold",
  "racial", "homophobic", "transphobic", "sexual",
  "repeat incident", "same student", "after hours",
];

// ============================================================
// STUDENTS — anonymized by code. FERPA-protected. Union-side use only.
// Tracking patterns for staff safety planning, NOT punishment.
// ============================================================
const STUDENTS = {
  "S-LINC-A": {
    code: "Student A", building: "Lincoln Elementary",
    setting: "Room 12, B Wing", grade: "2nd", supports: "IEP · BIP",
    lastBIP: "6 months ago",
  },
  "S-LINC-B": {
    code: "Student B", building: "Lincoln Elementary",
    setting: "Room 14, B Wing", grade: "3rd", supports: "IEP · BIP",
    lastBIP: "11 months ago",
  },
  "S-LINC-C": {
    code: "Student C", building: "Lincoln Elementary",
    setting: "Multiple, B Wing", grade: "4th", supports: "IEP",
    lastBIP: "no BIP on file",
  },
  "S-LINC-D": {
    code: "Student D", building: "Lincoln Elementary",
    setting: "6th grade hallway", grade: "6th", supports: "Code of Conduct",
    lastBIP: "n/a",
  },
  "S-WHS-A": {
    code: "Student A", building: "Westfield High",
    setting: "Various", grade: "11th", supports: "Threat assessment in progress",
    lastBIP: "n/a",
  },
  "S-ROOS-A": {
    code: "Student A", building: "Roosevelt Middle",
    setting: "Classroom 203", grade: "7th", supports: "None on file",
    lastBIP: "n/a",
  },
};

// ============================================================
// POLICIES — assignable to incidents by building reps and presidents.
// Drives follow-through and audit trail.
// ============================================================
const POLICIES = {
  "workers-comp":   { name: "Workers' Comp Filing",      category: "Injury / claims",     desc: "File state Workers' Compensation paperwork" },
  "osha-300":       { name: "OSHA 300 Log Entry",        category: "Compliance",          desc: "Record in OSHA 300 injury & illness log" },
  "bip-review":     { name: "BIP Review",                category: "Student support",     desc: "Behavior Intervention Plan review meeting" },
  "iep-review":     { name: "IEP Review",                category: "Student support",     desc: "Convene IEP team for plan update" },
  "fba":            { name: "FBA Request",               category: "Student support",     desc: "Functional Behavior Assessment by qualified evaluator" },
  "staffing":       { name: "Additional Staffing",       category: "Staffing",            desc: "Formal request for 1:1 IA or paraprofessional support" },
  "restraint-doc":  { name: "Restraint Documentation",   category: "Compliance",          desc: "Complete state-mandated restraint report" },
  "trespass":       { name: "Trespass Notice",           category: "Building security",   desc: "Issue formal trespass order to non-employee" },
  "parent-conf":    { name: "Parent Conference",         category: "Communication",       desc: "Schedule formal parent / guardian conference" },
  "code-conduct":   { name: "Code of Conduct Review",    category: "Discipline",          desc: "Refer to student code of conduct review board" },
  "threat-assess":  { name: "Threat Assessment",         category: "Safety",              desc: "Convene threat assessment team per district protocol" },
  "facilities-osha":{ name: "OSHA Facility Complaint",   category: "Facilities",          desc: "File formal OSHA complaint for facility hazard" },
  "manifest-det":   { name: "Manifestation Determination",category: "Student support",    desc: "IDEA manifestation determination meeting" },
};

// Suggest applicable policies given an incident
function suggestPolicies(inc) {
  const tags = inc.tags || [];
  const out = new Set();
  if (tags.includes("skin broken") || tags.includes("worker's comp")) out.add("workers-comp");
  if (inc.severity === "high" || inc.severity === "critical") out.add("osha-300");
  if (tags.includes("special ed") && inc.type === "physical") { out.add("bip-review"); out.add("staffing"); }
  if (tags.includes("restraint") || tags.includes("BIP")) out.add("restraint-doc");
  if (tags.includes("parent") && inc.type === "verbal") { out.add("trespass"); out.add("parent-conf"); }
  if (tags.includes("verbal threat") && tags.includes("student")) out.add("threat-assess");
  if (inc.type === "facilities") out.add("facilities-osha");
  if (tags.includes("repeat incident") && tags.includes("same student")) { out.add("fba"); out.add("iep-review"); }
  if (inc.is911) out.add("threat-assess");
  return [...out];
}

// ============================================================
// DEMO ACCOUNTS
// ============================================================
const ACCOUNTS = {
  sarah: {
    id: "sarah", name: "Sarah Chen", email: "schen@westfield.edu",
    role: "member", title: "Instructional Assistant, Special Ed",
    building: "Lincoln Elementary", initials: "SC",
  },
  marcus: {
    id: "marcus", name: "Marcus Johnson", email: "mjohnson@westfield.edu",
    role: "rep", title: "6th grade teacher · Building rep",
    building: "Lincoln Elementary", initials: "MJ",
  },
  patel: {
    id: "patel", name: "Dr. Aisha Patel", email: "apatel@westfieldeducation.org",
    role: "president", title: "Local president",
    district: "Westfield Education Association", initials: "AP",
  },
};

// ============================================================
// SEED DATA
// ============================================================
function seedIncidents() {
  const now = Date.now();
  const day = 86400_000;
  const hr = 3600_000;
  return [
    {
      id: "INC-0042", t: now - 2 * hr,
      reporter: "Sarah Chen", role: "IA, Special Ed",
      building: "Lincoln Elementary", type: "physical", severity: "high",
      location: "Room 12, B Wing", needsImmediate: false, is911: false,
      tags: ["bite", "special ed", "skin broken", "repeat incident", "same student", "worker's comp"], studentRef: "S-LINC-A", policies: ["workers-comp", "osha-300", "bip-review", "staffing"], sickDaysFollowing: 3,
      description: "Student bit me on left forearm during transition between activities. Broke skin, need to see school nurse. This is the third bite this month from the same student. We need another adult in the room, the staffing ratio is not working.",
      status: "acknowledged",
      thread: [
        { from: "Marcus Johnson", role: "Building rep", t: now - 1.5 * hr, text: "Sarah — got it. Going to talk to Principal Reyes right now. Are you OK? Did you get to the nurse?" },
        { from: "Sarah Chen", role: "Member", t: now - 1.2 * hr, text: "Yes, nurse cleaned it. I'll need to fill out the worker's comp form too." },
        { from: "Dr. Aisha Patel", role: "Local president", t: now - 0.5 * hr, text: "Sarah, this is the 4th IA bite at Lincoln in 30 days. I'm bringing it up with Superintendent Olsen this week. Document everything." },
      ],
    },
    { id: "INC-0041", t: now - 1 * day, reporter: "Diane Park", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "medium", location: "Hallway, B Wing", needsImmediate: false, is911: false, tags: ["punch", "elopement", "special ed", "no injury"], studentRef: "S-LINC-C", policies: ["bip-review", "staffing"], sickDaysFollowing: 1, description: "Got punched in the shoulder while redirecting a student who was eloping. No injury but it's exhausting being hit weekly.", status: "in_progress", thread: [{ from: "Marcus Johnson", role: "Building rep", t: now - 0.9 * day, text: "Diane, logged. Are forearm guards arriving? Let me check with the union." }] },
    { id: "INC-0040", t: now - 2 * day, reporter: "Tom Reilly", role: "5th grade teacher", building: "Lincoln Elementary", type: "verbal", severity: "medium", location: "Parent pickup area", needsImmediate: false, is911: false, tags: ["verbal threat", "parent", "harassment"], policies: ["trespass", "parent-conf"], sickDaysFollowing: 1, description: "Parent screamed at me in front of students about a grade, made implied threats. Witnessed by aide and two other parents.", status: "resolved", thread: [{ from: "Marcus Johnson", role: "Building rep", t: now - 1.8 * day, text: "Filed with district. Principal contacted the parent. Documented." }] },
    { id: "INC-0039", t: now - 3 * day, reporter: "Janet Wu", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "high", location: "Room 14, B Wing", needsImmediate: false, is911: false, tags: ["bite", "special ed", "skin broken"], studentRef: "S-LINC-B", policies: ["workers-comp", "osha-300", "bip-review"], sickDaysFollowing: 2, description: "Bitten on hand. Same room, different student than Sarah's incident. Skin broken, needed bandage.", status: "resolved", thread: [] },
    { id: "INC-0038", t: now - 5 * day, reporter: "Kevin Bautista", role: "Custodian", building: "Parker Elementary", type: "facilities", severity: "medium", location: "Basement, near boiler room", needsImmediate: false, is911: false, tags: ["mold", "facilities", "respiratory"], policies: ["facilities-osha"], sickDaysFollowing: 0, description: "Black mold patch along the wall, about 4 feet wide. Has been growing for weeks. Two teachers reported headaches.", status: "in_progress", thread: [{ from: "Dr. Aisha Patel", role: "Local president", t: now - 4 * day, text: "Filing OSHA complaint Monday if district doesn't respond by Friday." }] },
    { id: "INC-0037", t: now - 5 * day, reporter: "Sarah Chen", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "medium", location: "Room 12, B Wing", needsImmediate: false, is911: false, tags: ["slap", "special ed", "transition", "repeat incident"], studentRef: "S-LINC-A", policies: ["bip-review"], sickDaysFollowing: 1, description: "Got slapped while trying to help student transition. The student was overwhelmed. I'm reporting because this happens almost every week and I want it documented.", status: "resolved", thread: [] },
    { id: "INC-0036", t: now - 6 * day, reporter: "Linda Park", role: "School psychologist", building: "Westfield High", type: "verbal", severity: "high", location: "Counselor office", needsImmediate: false, is911: false, tags: ["verbal threat", "student", "named target"], studentRef: "S-WHS-A", policies: ["threat-assess", "code-conduct"], sickDaysFollowing: 2, description: "Student made specific threat against a teacher by name. Have documented and informed admin. Following safety plan protocol.", status: "in_progress", thread: [{ from: "James O'Hara", role: "Building rep", t: now - 5.5 * day, text: "Linda — coordinating with admin. Teacher informed and being supported." }] },
    { id: "INC-0035", t: now - 8 * day, reporter: "Janet Wu", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "high", location: "Room 14, B Wing", needsImmediate: false, is911: false, tags: ["thrown object", "special ed", "bruise"], studentRef: "S-LINC-B", policies: ["osha-300", "workers-comp"], sickDaysFollowing: 1, description: "Hit in the face by a thrown object. Bruised, not broken.", status: "resolved", thread: [] },
    { id: "INC-0034", t: now - 10 * day, reporter: "Marcus Johnson", role: "6th grade teacher", building: "Lincoln Elementary", type: "physical", severity: "medium", location: "Hallway", needsImmediate: false, is911: false, tags: ["fight", "bruise"], studentRef: "S-LINC-D", policies: ["code-conduct"], sickDaysFollowing: 0, description: "Broke up a fight between two 6th graders, got elbowed in the ribs. Bruised but OK.", status: "resolved", thread: [] },
    { id: "INC-0033", t: now - 12 * day, reporter: "Diane Park", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "medium", location: "Room 12, B Wing", needsImmediate: false, is911: false, tags: ["scratch", "special ed", "restraint", "BIP"], studentRef: "S-LINC-C", policies: ["restraint-doc", "bip-review"], sickDaysFollowing: 1, description: "Scratched on the face while restraining a student per BIP protocol.", status: "resolved", thread: [] },
    { id: "INC-0032", t: now - 14 * day, reporter: "Carl Stevens", role: "Math teacher", building: "Roosevelt Middle", type: "verbal", severity: "low", location: "Classroom 203", needsImmediate: false, is911: false, tags: ["verbal threat", "student"], studentRef: "S-ROOS-A", policies: ["threat-assess"], sickDaysFollowing: 0, description: "Student told me they 'know where I live.' I don't think it's a real threat but documenting.", status: "resolved", thread: [] },
    { id: "INC-0031", t: now - 16 * day, reporter: "Sarah Chen", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "medium", location: "Room 12, B Wing", needsImmediate: false, is911: false, tags: ["bite", "special ed", "no injury", "same student"], studentRef: "S-LINC-A", policies: ["bip-review"], sickDaysFollowing: 0, description: "Got bitten. Did not break skin this time. Same student.", status: "resolved", thread: [] },
    { id: "INC-0030", t: now - 18 * day, reporter: "Sandra Kim", role: "Kindergarten teacher", building: "Jefferson Elementary", type: "facilities", severity: "low", location: "Classroom K2", needsImmediate: false, is911: false, tags: ["facilities", "heat", "cold"], policies: [], sickDaysFollowing: 0, description: "Heater not working, room is 58 degrees. Kids in coats.", status: "resolved", thread: [] },
    { id: "INC-0029", t: now - 20 * day, reporter: "Janet Wu", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "medium", location: "Room 14, B Wing", needsImmediate: false, is911: false, tags: ["thrown object", "special ed", "no injury"], studentRef: "S-LINC-B", policies: ["bip-review"], sickDaysFollowing: 0, description: "Hit in the head with a book. No injury.", status: "resolved", thread: [] },
    { id: "INC-0028", t: now - 22 * day, reporter: "Mark Davis", role: "P.E. teacher", building: "Westfield High", type: "verbal", severity: "medium", location: "Gymnasium", needsImmediate: false, is911: false, tags: ["verbal threat", "parent", "harassment"], policies: ["parent-conf"], sickDaysFollowing: 1, description: "Parent confronted me about playing time. Got in my face. Other coaches witnessed.", status: "resolved", thread: [] },
    { id: "INC-0027", t: now - 25 * day, reporter: "Diane Park", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "high", location: "Hallway", needsImmediate: false, is911: false, tags: ["bite", "special ed", "skin broken", "worker's comp"], studentRef: "S-LINC-C", policies: ["workers-comp", "osha-300", "bip-review"], sickDaysFollowing: 3, description: "Bitten on the arm. Skin broken. Need to update tetanus.", status: "resolved", thread: [] },
    { id: "INC-0026", t: now - 28 * day, reporter: "Tom Reilly", role: "5th grade teacher", building: "Lincoln Elementary", type: "other", severity: "low", location: "Outside cafeteria", needsImmediate: false, is911: false, tags: ["security", "unauthorized visitor"], policies: [], sickDaysFollowing: 0, description: "Unknown adult on campus during lunch, no visitor badge. Security walked them off.", status: "resolved", thread: [] },
    { id: "INC-0025", t: now - 31 * day, reporter: "Sarah Chen", role: "IA, Special Ed", building: "Lincoln Elementary", type: "physical", severity: "medium", location: "Room 12, B Wing", needsImmediate: false, is911: false, tags: ["hit", "special ed", "bruise", "same student"], studentRef: "S-LINC-A", policies: ["bip-review"], sickDaysFollowing: 0, description: "Pinched and slapped. Bruise on arm.", status: "resolved", thread: [] },
  ];
}

// ============================================================
// HELPERS
// ============================================================
function timeAgo(t) {
  const ms = Date.now() - t;
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatTime(t) {
  return new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

async function storageGet(key) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key);
      return r ? r.value : null;
    }
    return localStorage.getItem(key);
  } catch { return null; }
}
async function storageSet(key, value) {
  try {
    if (typeof window !== "undefined" && window.storage) await window.storage.set(key, value);
    else localStorage.setItem(key, value);
  } catch {}
}

function roleLabel(role) {
  return role === "member" ? "Union member" : role === "rep" ? "Building rep" : "Local president";
}

// ============================================================
// VIEWPORT — responsive helper
// ============================================================
function useViewport() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return {
    width: w,
    isMobile: w < 720,
    isTablet: w >= 720 && w < 1024,
    isDesktop: w >= 1024,
  };
}

// ============================================================
// NOTIFICATIONS — role and importance gated
// ============================================================
function notifImportance(level) {
  // Reads from current C so dark/light themes pick up correct colors
  const map = {
    critical: { fg: C.critical, bg: C.criticalBg, border: C.critical, label: "Critical" },
    high:     { fg: C.accent,   bg: C.accentSoft, border: C.accentBorder, label: "High" },
    info:     { fg: C.info,     bg: C.infoBg,     border: C.info,    label: "Info" },
  };
  return map[level] || map.info;
}

const NOTIF_TYPE_ICON = {
  new_report:    AlertCircle,
  emergency:     Siren,
  acknowledged:  Check,
  in_progress:   Clock,
  resolved:      ShieldCheck,
  reply:         MessageSquare,
  pattern:       AlertTriangle,
  threshold:     Gavel,
  status:        Activity,
};

function seedNotifications() {
  const now = Date.now();
  const hr = 3600_000, day = 86400_000;
  return [
    // SARAH (member) — updates on her own reports
    { id: "N-001", t: now - 0.5 * hr, forUserId: "sarah", importance: "high",   type: "acknowledged",
      title: "Marcus Johnson acknowledged your report",
      body: "INC-0042 · Building rep responded. Going to talk to Principal Reyes.",
      relatedId: "INC-0042", read: false },
    { id: "N-002", t: now - 1.2 * hr, forUserId: "sarah", importance: "info",   type: "reply",
      title: "Dr. Aisha Patel replied",
      body: "INC-0042 · Local president · This is the 4th IA bite at Lincoln in 30 days.",
      relatedId: "INC-0042", read: false },
    { id: "N-003", t: now - 5 * day,  forUserId: "sarah", importance: "info",   type: "status",
      title: "Your report was resolved",
      body: "INC-0037 · Marked resolved by Marcus Johnson.",
      relatedId: "INC-0037", read: true },

    // MARCUS (building rep) — building-level alerts
    { id: "N-010", t: now - 2 * hr,  forUserId: "marcus", importance: "critical", type: "new_report",
      title: "New high-severity report at Lincoln Elementary",
      body: "Sarah Chen · Physical assault · Skin broken · Room 12, B Wing",
      relatedId: "INC-0042", read: false },
    { id: "N-011", t: now - 8 * hr,  forUserId: "marcus", importance: "high", type: "pattern",
      title: "Recurring pattern — Room 12, B Wing",
      body: "3 bites in 30 days, same student. Safety plan review recommended.",
      relatedId: null, read: false },
    { id: "N-012", t: now - 1 * day, forUserId: "marcus", importance: "high", type: "new_report",
      title: "New report at Lincoln Elementary",
      body: "Diane Park · Physical assault · Medium · Hallway, B Wing",
      relatedId: "INC-0041", read: false },
    { id: "N-013", t: now - 3 * day, forUserId: "marcus", importance: "info", type: "reply",
      title: "Sarah Chen replied to your acknowledgment",
      body: "INC-0042 · Nurse cleaned it. Filing worker's comp form.",
      relatedId: "INC-0042", read: true },

    // PATEL (local president) — district-wide
    { id: "N-020", t: now - 2 * hr,  forUserId: "patel", importance: "critical", type: "emergency",
      title: "Critical · Lincoln Elementary",
      body: "Sarah Chen · 4th IA bite at Lincoln in 30 days · skin broken · worker's comp triggered",
      relatedId: "INC-0042", read: false },
    { id: "N-021", t: now - 5 * hr,  forUserId: "patel", importance: "critical", type: "threshold",
      title: "Lincoln Elementary approaching OSHA threshold",
      body: "8 incidents in 30 days. General Duty Clause complaint path opening.",
      relatedId: null, read: false },
    { id: "N-022", t: now - 6 * hr,  forUserId: "patel", importance: "high", type: "pattern",
      title: "Special Ed IA incidents at 56% of total",
      body: "11 of 18 incidents this month. Bargaining priority #1.",
      relatedId: null, read: false },
    { id: "N-023", t: now - 12 * hr, forUserId: "patel", importance: "info", type: "reply",
      title: "James O'Hara replied at Westfield High",
      body: "INC-0036 · Threat assessment in progress.",
      relatedId: "INC-0036", read: true },
    { id: "N-024", t: now - 5 * day, forUserId: "patel", importance: "high", type: "new_report",
      title: "Facility hazard at Parker Elementary",
      body: "Kevin Bautista · Mold · OSHA-track if not remediated by Friday.",
      relatedId: "INC-0038", read: true },
  ];
}

function notifsForUser(notifs, user) {
  if (!notifs || !user) return [];
  return notifs.filter(n => n.forUserId === user.id).sort((a, b) => b.t - a.t);
}

// ============================================================
// ANALYTICS
// ============================================================
function topTags(incidents, n = 8) {
  const counts = {};
  incidents.forEach(i => (i.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  return Object.entries(counts).map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count).slice(0, n);
}

function typeBreakdown(incidents) {
  const counts = {};
  incidents.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
  return Object.entries(counts).map(([type, count]) => ({
    type, count, label: TYPE_META[type]?.label || type,
  })).sort((a, b) => b.count - a.count);
}

function topReporters(incidents, n = 5) {
  const counts = {};
  incidents.forEach(i => { counts[i.reporter] = counts[i.reporter] || { count: 0, role: i.role, building: i.building }; counts[i.reporter].count++; });
  return Object.entries(counts).map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.count - a.count).slice(0, n);
}

function affectedRoles(incidents, n = 6) {
  const counts = {};
  incidents.forEach(i => {
    const r = (i.role || "Unknown").replace(/^\d+(st|nd|rd|th)\s+grade\s+teacher$/i, "Teacher");
    counts[r] = (counts[r] || 0) + 1;
  });
  return Object.entries(counts).map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count).slice(0, n);
}

function severityBreakdown(incidents) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  incidents.forEach(i => { counts[i.severity] = (counts[i.severity] || 0) + 1; });
  return ["critical", "high", "medium", "low"].map(s => ({
    severity: s, count: counts[s], color: SEVERITY[s].color, label: SEVERITY[s].label,
  }));
}

function topStudents(incidents, n = 6) {
  const map = {};
  incidents.filter(i => i.studentRef).forEach(i => {
    const k = i.studentRef;
    if (!map[k]) map[k] = {
      ref: k, ...STUDENTS[k],
      count: 0, severities: { critical: 0, high: 0, medium: 0, low: 0 },
      types: {}, reporters: new Set(), latestT: 0,
    };
    map[k].count++;
    map[k].severities[i.severity]++;
    map[k].types[i.type] = (map[k].types[i.type] || 0) + 1;
    if (i.reporter) map[k].reporters.add(i.reporter);
    if (i.t > map[k].latestT) map[k].latestT = i.t;
  });
  return Object.values(map)
    .map(s => ({ ...s, reporters: [...s.reporters] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function recommendedStudentActions(student) {
  const actions = [];
  if (student.count >= 3 && student.lastBIP && student.lastBIP.includes("month")) {
    actions.push(<><Term code="BIP" /> review meeting — current plan is stale</>);
  } else if (student.lastBIP === "no BIP on file") {
    actions.push(<><Term code="FBA" /> + initial <Term code="BIP" /> development</>);
  }
  if (student.count >= 4) actions.push(<>Formal request for 1:1 <Term code="IA" /> / paraprofessional support</>);
  if (student.count >= 5) actions.push(<>Consider <Term code="FBA">Functional Behavior Assessment</Term> by outside evaluator</>);
  if (student.severities.high + student.severities.critical >= 2) {
    actions.push(<>Manifestation determination under <Term code="IDEA" /> if disciplinary action considered</>);
  }
  if (student.reporters.length >= 2) actions.push("Coordinate safety plan across affected staff");
  return actions.length ? actions : ["Continue current supports; monitor"];
}

// ============================================================
// SICK TIME — aggregate only, HIPAA-safe.
// Tracks days of sick leave taken by reporter in 14 days post-incident.
// Never displayed at individual level in dashboards.
// ============================================================
function sickTimeStats(incidents) {
  const total = incidents.reduce((s, i) => s + (i.sickDaysFollowing || 0), 0);
  const withSick = incidents.filter(i => (i.sickDaysFollowing || 0) > 0).length;
  const pct = incidents.length === 0 ? 0 : Math.round((withSick / incidents.length) * 100);
  const avgPerIncident = incidents.length === 0 ? 0 : (total / incidents.length).toFixed(1);
  return { total, withSick, pct, avgPerIncident };
}

function sickTimeByBuilding(incidents) {
  const map = {};
  BUILDINGS.forEach(b => { map[b] = { incidents: 0, sickDays: 0 }; });
  incidents.forEach(i => {
    if (map[i.building]) {
      map[i.building].incidents++;
      map[i.building].sickDays += i.sickDaysFollowing || 0;
    }
  });
  return Object.entries(map).map(([b, d]) => ({ building: b, ...d }))
    .filter(d => d.incidents > 0)
    .sort((a, b) => b.sickDays - a.sickDays);
}

// ============================================================
// LOCATION × SEVERITY — heatmap matrix
// ============================================================
function buildingSeverityMatrix(incidents) {
  const matrix = {};
  BUILDINGS.forEach(b => { matrix[b] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 }; });
  incidents.forEach(i => {
    if (matrix[i.building]) {
      matrix[i.building][i.severity]++;
      matrix[i.building].total++;
    }
  });
  return BUILDINGS.map(b => ({ building: b, ...matrix[b] }))
    .filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total);
}

function locationDetailMatrix(incidents, n = 10) {
  const matrix = {};
  incidents.forEach(i => {
    const loc = i.location || "Unspecified location";
    if (!matrix[loc]) matrix[loc] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    matrix[loc][i.severity]++;
    matrix[loc].total++;
  });
  return Object.entries(matrix).map(([location, d]) => ({ location, ...d }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}

const TYPE_COLORS = {
  physical: "#B53C2A",
  verbal: "#D97706",
  weapon: "#DC2626",
  facilities: "#1D4ED8",
  other: "#78716C",
};

// ============================================================
// ACTION ITEMS — computed from real data
// ============================================================
function computeRepActions(incidents) {
  const day = 86400_000;
  const now = Date.now();
  const monthIncidents = incidents.filter(i => i.t > now - 30 * day);
  const actions = [];

  // Open incidents waiting for acknowledgment
  const unacknowledged = incidents.filter(i => i.status === "new");
  if (unacknowledged.length > 0) {
    actions.push({
      kind: "respond",
      title: `${unacknowledged.length} report${unacknowledged.length === 1 ? "" : "s"} waiting for your response`,
      body: "Members can see when you've acknowledged — even a one-line reply tells them you're on it.",
      cta: "Review open",
    });
  }

  // 911 incidents
  const emergencies = incidents.filter(i => i.is911 && i.status !== "resolved");
  if (emergencies.length > 0) {
    actions.push({
      kind: "critical",
      title: `${emergencies.length} 911 emergency report${emergencies.length === 1 ? "" : "s"} open`,
      body: "Call the reporter directly. Make sure they got medical care and follow-up is in motion.",
      cta: "Open emergency log",
    });
  }

  // Repeat reporters — staff filing 3+ in a month
  const reporterCounts = {};
  monthIncidents.forEach(i => { reporterCounts[i.reporter] = (reporterCounts[i.reporter] || 0) + 1; });
  const heavyReporters = Object.entries(reporterCounts).filter(([_, c]) => c >= 3);
  if (heavyReporters.length > 0) {
    const names = heavyReporters.map(([n]) => n.split(" ")[0]).join(", ");
    actions.push({
      kind: "check_in",
      title: `Check in with ${names}`,
      body: `Filed ${heavyReporters[0][1]}+ reports in 30 days. They need to know the union sees them.`,
      cta: "Schedule check-in",
    });
  }

  // Recurring location
  const locCounts = {};
  monthIncidents.forEach(i => { if (i.location) locCounts[i.location] = (locCounts[i.location] || 0) + 1; });
  const hotLoc = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0];
  if (hotLoc && hotLoc[1] >= 3) {
    actions.push({
      kind: "pattern",
      title: `${hotLoc[0]} — ${hotLoc[1]} incidents in 30 days`,
      body: "Same location keeps coming up. Walk through with admin and document staffing, sightlines, exits.",
      cta: "Open location report",
    });
  }

  // Workers' comp tagged but no thread response
  const compNeeded = monthIncidents.filter(i => (i.tags || []).includes("worker's comp") && i.thread.length === 0);
  if (compNeeded.length > 0) {
    actions.push({
      kind: "paperwork",
      title: `${compNeeded.length} report${compNeeded.length === 1 ? "" : "s"} flagged worker's comp`,
      body: "Confirm the member has filed the district form. Many never do because no one tells them to.",
      cta: "Send checklist",
    });
  }

  return actions;
}

function computePresidentActions(incidents) {
  const day = 86400_000;
  const now = Date.now();
  const monthIncidents = incidents.filter(i => i.t > now - 30 * day);
  const actions = [];

  // OSHA threshold — hot building
  const buildingCounts = {};
  monthIncidents.forEach(i => { buildingCounts[i.building] = (buildingCounts[i.building] || 0) + 1; });
  const hot = Object.entries(buildingCounts).sort((a, b) => b[1] - a[1])[0];
  if (hot && hot[1] >= 7) {
    actions.push({
      kind: "osha",
      title: `${hot[0]} approaching OSHA-reportable threshold`,
      body: `${hot[1]} incidents in 30 days. Document the pattern, file Form 300 entries, prepare General Duty Clause complaint if district doesn't act.`,
      cta: "Start OSHA packet",
    });
  }

  // Special Ed IA pattern
  const iaIncidents = monthIncidents.filter(i => i.role && i.role.toLowerCase().includes("special ed"));
  if (iaIncidents.length >= 5) {
    const pct = Math.round((iaIncidents.length / monthIncidents.length) * 100);
    actions.push({
      kind: "bargaining",
      title: `${pct}% of incidents involve Special Ed IAs`,
      body: `${iaIncidents.length} reports from your lowest-paid, most-exposed members. This is bargaining priority #1 — staffing ratios, PPE, hazard pay.`,
      cta: "Build bargaining brief",
    });
  }

  // Mold / facilities escalation
  const mold = monthIncidents.filter(i => (i.tags || []).includes("mold"));
  if (mold.length > 0) {
    actions.push({
      kind: "facilities",
      title: `Mold reported at ${mold[0].building}`,
      body: "Facilities hazards have a clean OSHA path even in non-state-plan states. File complaint if district hasn't remediated within 30 days.",
      cta: "File OSHA complaint",
    });
  }

  // 911 emergencies
  const emergencies = monthIncidents.filter(i => i.is911);
  if (emergencies.length > 0) {
    actions.push({
      kind: "critical",
      title: `${emergencies.length} 911 emergency report${emergencies.length === 1 ? "" : "s"} this month`,
      body: "Personally call each affected member. They need to hear from the local president, not just their building rep.",
      cta: "Review emergency log",
    });
  }

  // Restraint/BIP incidents — training adequacy
  const restraint = monthIncidents.filter(i => (i.tags || []).includes("restraint") || (i.tags || []).includes("BIP"));
  if (restraint.length >= 2) {
    actions.push({
      kind: "training",
      title: `${restraint.length} incidents involve restraint or BIP protocol`,
      body: "Review CPI/MANDT training currency for affected staff. Inadequate training is a grievance and a liability.",
      cta: "Audit training",
    });
  }

  // Verbal threats from parents
  const parentThreats = monthIncidents.filter(i => i.type === "verbal" && (i.tags || []).includes("parent"));
  if (parentThreats.length >= 2) {
    actions.push({
      kind: "policy",
      title: `${parentThreats.length} verbal threats from parents`,
      body: "Push admin to enforce trespass and verbal-abuse policies. Members shouldn't absorb this as 'part of the job.'",
      cta: "Draft policy memo",
    });
  }

  return actions;
}

const ACTION_ICONS = {
  respond: MessageSquare,
  critical: Siren,
  check_in: UserCheck,
  pattern: Activity,
  paperwork: FileWarning,
  osha: Gavel,
  bargaining: Briefcase,
  facilities: Hammer,
  training: Users,
  policy: Megaphone,
};

function actionTone(kind) {
  const map = {
    respond:    { fg: C.medium,        bg: C.mediumBg,   border: C.medium },
    critical:   { fg: C.critical,      bg: C.criticalBg, border: C.critical },
    check_in:   { fg: C.info,          bg: C.infoBg,     border: C.info },
    pattern:    { fg: C.accent,        bg: C.accentSoft, border: C.accentBorder },
    paperwork:  { fg: C.textSecondary, bg: C.surfaceAlt, border: C.border },
    osha:       { fg: C.critical,      bg: C.criticalBg, border: C.critical },
    bargaining: { fg: C.accent,        bg: C.accentSoft, border: C.accentBorder },
    facilities: { fg: C.info,          bg: C.infoBg,     border: C.info },
    training:   { fg: C.medium,        bg: C.mediumBg,   border: C.medium },
    policy:     { fg: C.accent,        bg: C.accentSoft, border: C.accentBorder },
  };
  return map[kind] || map.respond;
}

// ============================================================
// APP ROOT
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [incidents, setIncidents] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [view, setView] = useState("home");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [themeMode, setThemeMode] = useState("light");
  const vp = useViewport();

  // Apply theme synchronously before any children render this pass
  applyTheme(themeMode);

  // Keep document body background in sync with theme so page edges match
  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.transition = "background-color 0.2s ease";
  }, [themeMode]);

  function toggleTheme() {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    storageSet("safepoint:theme", next);
  }

  useEffect(() => {
    if (document.getElementById("safepoint-fonts")) return;
    const link = document.createElement("link");
    link.id = "safepoint-fonts";
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedTheme = await storageGet("safepoint:theme");
      if (!cancelled && (savedTheme === "dark" || savedTheme === "light")) setThemeMode(savedTheme);
      const savedUserId = await storageGet("safepoint:user");
      if (!cancelled && savedUserId && ACCOUNTS[savedUserId]) setUser(ACCOUNTS[savedUserId]);
      if (!cancelled) setAuthLoaded(true);
      const stored = await storageGet("safepoint:incidents:v4");
      if (stored) {
        try { if (!cancelled) setIncidents(JSON.parse(stored)); }
        catch { if (!cancelled) { const s = seedIncidents(); await storageSet("safepoint:incidents:v4", JSON.stringify(s)); setIncidents(s); } }
      } else {
        const seeded = seedIncidents();
        await storageSet("safepoint:incidents:v4", JSON.stringify(seeded));
        if (!cancelled) setIncidents(seeded);
      }
      const storedN = await storageGet("safepoint:notifs:v1");
      if (storedN) {
        try { if (!cancelled) setNotifs(JSON.parse(storedN)); }
        catch { if (!cancelled) { const n = seedNotifications(); await storageSet("safepoint:notifs:v1", JSON.stringify(n)); setNotifs(n); } }
      } else {
        const seededN = seedNotifications();
        await storageSet("safepoint:notifs:v1", JSON.stringify(seededN));
        if (!cancelled) setNotifs(seededN);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (incidents) storageSet("safepoint:incidents:v4", JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    if (notifs && notifs.length) storageSet("safepoint:notifs:v1", JSON.stringify(notifs));
  }, [notifs]);

  function pushNotif(n) {
    setNotifs(prev => [{ id: `N-${Math.random().toString(36).slice(2, 8)}`, t: Date.now(), read: false, ...n }, ...prev]);
  }
  function markNotifsRead(ids) {
    setNotifs(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
  }
  function markAllNotifsRead(forUserId) {
    setNotifs(prev => prev.map(n => n.forUserId === forUserId ? { ...n, read: true } : n));
  }

  function signIn(accountId) {
    setUser(ACCOUNTS[accountId]);
    storageSet("safepoint:user", accountId);
    setView("home");
    setSelectedId(null);
  }

  function signOut() {
    setUser(null);
    storageSet("safepoint:user", "");
    setView("home");
    setSelectedId(null);
  }

  function addIncident(payload) {
    const newInc = {
      id: `INC-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      t: Date.now(),
      reporter: user.name,
      role: user.title,
      building: user.building,
      status: payload.is911 ? "escalated" : "new",
      thread: [],
      tags: [],
      ...payload,
    };
    setIncidents(prev => [newInc, ...prev]);

    // Alert building rep AND local president
    const importance = payload.is911 ? "critical" : (payload.severity === "high" || payload.severity === "critical") ? "high" : "info";
    const repAccount = Object.values(ACCOUNTS).find(a => a.role === "rep" && a.building === user.building);
    const presAccount = Object.values(ACCOUNTS).find(a => a.role === "president");
    const summary = `${user.name} · ${payload.type} · ${payload.severity} · ${payload.location || "—"}`;
    const notifTitle = payload.is911 ? `911 EMERGENCY · ${user.building}` : `New report at ${user.building}`;
    if (repAccount) {
      pushNotif({
        forUserId: repAccount.id, importance,
        type: payload.is911 ? "emergency" : "new_report",
        title: notifTitle, body: summary, relatedId: newInc.id,
      });
    }
    if (presAccount && presAccount.id !== (repAccount && repAccount.id)) {
      pushNotif({
        forUserId: presAccount.id, importance,
        type: payload.is911 ? "emergency" : "new_report",
        title: notifTitle, body: summary, relatedId: newInc.id,
      });
    }

    setToast(payload.is911
      ? { title: `911 incident logged · ${newInc.id}`, body: "Emergency flagged. Your building rep, local president, and district safety officer are alerted." }
      : { title: `Report ${newInc.id} sent`, body: "Routed to your building rep and local president." }
    );
    setTimeout(() => setToast(null), 6000);
    setView("home");
  }

  function postReply(incidentId, text) {
    const roleName = user.role === "rep" ? "Building rep" : user.role === "president" ? "Local president" : "Member";
    let target = null;
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id !== incidentId) return inc;
        target = inc;
        return {
          ...inc,
          status: inc.status === "new" ? "acknowledged" : inc.status,
          thread: [...inc.thread, { from: user.name, role: roleName, t: Date.now(), text }],
        };
      })
    );
    // Notify the reporter (member) when leadership replies
    if (target && target.reporter !== user.name) {
      const reporterAccount = Object.values(ACCOUNTS).find(a => a.name === target.reporter);
      if (reporterAccount) {
        pushNotif({
          forUserId: reporterAccount.id, importance: "info", type: "reply",
          title: `${user.name} replied`,
          body: `${incidentId} · ${roleName} · ${text.slice(0, 80)}${text.length > 80 ? "…" : ""}`,
          relatedId: incidentId,
        });
      }
    }
  }

  function setStatus(incidentId, status) {
    let target = null;
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      target = inc;
      return { ...inc, status };
    }));
    if (target && target.reporter !== user.name) {
      const reporterAccount = Object.values(ACCOUNTS).find(a => a.name === target.reporter);
      if (reporterAccount) {
        const statusLabels = { acknowledged: "acknowledged", in_progress: "moved to in progress", resolved: "marked resolved" };
        pushNotif({
          forUserId: reporterAccount.id, importance: "info",
          type: status === "resolved" ? "resolved" : "status",
          title: `Your report was ${statusLabels[status] || status}`,
          body: `${incidentId} · ${user.name} (${roleLabel(user.role)})`,
          relatedId: incidentId,
        });
      }
    }
  }

  function assignPolicy(incidentId, policyId) {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      const cur = inc.policies || [];
      if (cur.includes(policyId)) return inc;
      return { ...inc, policies: [...cur, policyId] };
    }));
  }

  function unassignPolicy(incidentId, policyId) {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== incidentId) return inc;
      return { ...inc, policies: (inc.policies || []).filter(p => p !== policyId) };
    }));
  }

  if (!authLoaded || !incidents) {
    return (
      <div style={{ background: C.bg, minHeight: 600, display: "grid", placeItems: "center", color: C.textMuted, fontFamily: FONTS.body, fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!user) return <LoginScreen onSignIn={signIn} />;

  const selected = incidents.find(i => i.id === selectedId);

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: FONTS.body, fontSize: 14, lineHeight: 1.5,
      transition: "background-color 0.2s ease, color 0.2s ease",
    }}>
      <NavBar user={user}
        onSignOut={signOut}
        onSwitchAccount={signIn}
        notifs={notifsForUser(notifs, user)}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onOpenNotif={(n) => {
          markNotifsRead([n.id]);
          if (n.relatedId) { setSelectedId(n.relatedId); setView("detail"); }
        }}
        onMarkAllRead={() => markAllNotifsRead(user.id)}
      />
      <main style={{ maxWidth: 1140, margin: "0 auto", padding: vp.isMobile ? "20px 16px 60px" : "32px 24px 80px" }}>
        {user.role === "member" && view === "home" && (
          <MemberHome user={user}
            incidents={incidents.filter(i => i.reporter === user.name)}
            onReport={() => setView("report")}
            onOpen={(id) => { setSelectedId(id); setView("detail"); }} />
        )}
        {user.role === "member" && view === "report" && (
          <ReportForm user={user} onCancel={() => setView("home")} onSubmit={addIncident} />
        )}
        {user.role === "rep" && view === "home" && (
          <RepDashboard user={user}
            incidents={incidents.filter(i => i.building === user.building)}
            onOpen={(id) => { setSelectedId(id); setView("detail"); }} />
        )}
        {user.role === "president" && view === "home" && (
          <PresidentDashboard user={user} incidents={incidents}
            onOpen={(id) => { setSelectedId(id); setView("detail"); }} />
        )}
        {view === "detail" && selected && (
          <IncidentDetail user={user} incident={selected}
            onBack={() => { setView("home"); setSelectedId(null); }}
            onReply={(text) => postReply(selected.id, text)}
            onStatus={(s) => setStatus(selected.id, s)}
            onAssignPolicy={(p) => assignPolicy(selected.id, p)}
            onUnassignPolicy={(p) => unassignPolicy(selected.id, p)} />
        )}
      </main>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onSignIn("sarah"); }, 600);
  }

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", fontFamily: FONTS.body, color: C.text,
      display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
        <Logo size={28} />
        <span style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 22, letterSpacing: "-0.025em" }}>SafePoint</span>
      </div>

      <div style={{
        width: "100%", maxWidth: 420, background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: R.xl, padding: 32, boxShadow: SHADOW.card,
      }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 4px" }}>
          Sign in
        </h1>
        <p style={{ color: C.textSecondary, fontSize: 14, margin: "0 0 28px" }}>
          Welcome back. Sign in with your union credentials.
        </p>

        <form onSubmit={handleSubmit}>
          <Field label="Email" icon={<Mail size={15} color={C.textMuted} />}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@union.org" autoComplete="email" style={inputStyle} />
          </Field>
          <Field label="Password" icon={<Lock size={15} color={C.textMuted} />}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" style={inputStyle} />
          </Field>
          <button type="submit" disabled={loading} style={{
            ...primaryButton, width: "100%", justifyContent: "center", marginTop: 8,
            opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer", padding: "11px 16px",
          }}>
            {loading ? "Signing in…" : <>Sign in <ArrowRight size={15} /></>}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: C.textMuted, fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span>or continue with</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <SSOButton label="NEA Single Sign-On" onClick={() => onSignIn("sarah")} accent />
          <SSOButton label="Google for Education" onClick={() => onSignIn("sarah")} />
          <SSOButton label="Microsoft Entra ID" onClick={() => onSignIn("sarah")} />
        </div>

        <div style={{ marginTop: 24, fontSize: 13, color: C.textSecondary, textAlign: "center" }}>
          New to SafePoint? <a href="#" style={{ color: C.accent, textDecoration: "none", fontWeight: 500 }}>Contact your local</a>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 420, marginTop: 20 }}>
        <button onClick={() => setShowDemo(s => !s)} style={{
          background: "transparent", border: "none", color: C.textSecondary, fontSize: 11,
          padding: "8px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          fontFamily: FONTS.body, width: "100%", justifyContent: "center", fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <Sparkles size={11} /> Demo accounts {showDemo ? "(hide)" : "(show)"}
        </button>
        {showDemo && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: R.xl, padding: 6, marginTop: 6, boxShadow: SHADOW.card,
          }}>
            <div style={{ padding: "8px 12px 4px", fontSize: 11, color: C.textMuted, letterSpacing: "0.06em", fontWeight: 500 }}>
              Skip the form — try a role
            </div>
            {Object.values(ACCOUNTS).map(acc => (
              <button key={acc.id} onClick={() => onSignIn(acc.id)} style={hoverableRow}
                onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar initials={acc.initials} role={acc.role} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{acc.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {acc.title}{acc.building ? ` · ${acc.building}` : ""}
                  </div>
                </div>
                <RolePill role={acc.role} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 36, fontSize: 12, color: C.textMuted, textAlign: "center", maxWidth: 380 }}>
        v0 prototype · authentication is mocked — any credentials work, or pick a demo account above.
      </div>
    </div>
  );
}

const hoverableRow = {
  width: "100%", background: "transparent", border: "none",
  padding: "10px 12px", borderRadius: R.md, cursor: "pointer",
  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
  fontFamily: FONTS.body, transition: "background 0.12s",
};

function SSOButton({ label, onClick, accent }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", background: hover ? C.surfaceAlt : C.surface, color: C.text,
        border: `1px solid ${accent ? C.accentBorder : C.border}`,
        borderRadius: R.md, padding: "11px 16px",
        fontSize: 13, fontWeight: 500, fontFamily: FONTS.body, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        transition: "background 0.12s",
      }}>
      <ShieldCheck size={15} color={accent ? C.accent : C.textSecondary} />
      Continue with {label}
    </button>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}>{icon}</div>}
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px 10px 38px",
  get border() { return `1px solid ${C.border}`; },
  borderRadius: R.md,
  fontSize: 14, fontFamily: FONTS.body,
  get color() { return C.text; },
  get background() { return C.surface; },
  outline: "none", boxSizing: "border-box",
};

// ============================================================
// NAV BAR
// ============================================================
function NavBar({ user, onSignOut, onSwitchAccount, notifs, onOpenNotif, onMarkAllRead, themeMode, onToggleTheme }) {
  const vp = useViewport();
  return (
    <header style={{
      background: C.surface, borderBottom: `1px solid ${C.border}`,
      position: "sticky", top: 0, zIndex: 20,
    }}>
      <div style={{
        maxWidth: 1140, margin: "0 auto", padding: vp.isMobile ? "12px 16px" : "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: vp.isMobile ? 8 : 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={22} />
          <span style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 17, letterSpacing: "-0.025em", color: C.text }}>
            SafePoint
          </span>
          {!vp.isMobile && (
            <span style={{ fontSize: 10, color: C.textMuted, padding: "2px 7px", border: `1px solid ${C.border}`, borderRadius: R.full, marginLeft: 4, fontWeight: 500, letterSpacing: "0.05em" }}>
              v0
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ThemeToggle mode={themeMode} onToggle={onToggleTheme} />
          <NotificationCenter notifs={notifs} onOpen={onOpenNotif} onMarkAllRead={onMarkAllRead} />
          <UserMenu user={user} onSignOut={onSignOut} onSwitchAccount={onSwitchAccount} compact={vp.isMobile} />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle({ mode, onToggle }) {
  const [hover, setHover] = useState(false);
  const isDark = mode === "dark";
  return (
    <button onClick={onToggle}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 34, height: 34, border: "none",
        background: hover ? C.surfaceAlt : "transparent",
        borderRadius: R.md, cursor: "pointer", display: "grid", placeItems: "center",
        transition: "background 0.12s",
      }}>
      {isDark
        ? <Sun size={16} color={C.textSecondary} />
        : <Moon size={16} color={C.textSecondary} />}
    </button>
  );
}

function Logo({ size = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: R.sm,
      background: C.accent, display: "grid", placeItems: "center",
      boxShadow: "0 1px 2px rgba(181,60,42,0.2)",
    }}>
      <div style={{
        width: size * 0.42, height: size * 0.42, borderRadius: 2,
        background: "rgba(255,255,255,0.95)",
      }} />
    </div>
  );
}

function IconButton({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 34, height: 34, border: "none", background: hover ? C.surfaceAlt : "transparent",
        borderRadius: R.md, cursor: "pointer", display: "grid", placeItems: "center",
        transition: "background 0.12s",
      }}>
      {children}
    </button>
  );
}

// ============================================================
// NOTIFICATION CENTER — bell dropdown, role-filtered, importance-grouped
// ============================================================
function NotificationCenter({ notifs, onOpen, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === "all" ? notifs : notifs.filter(n => n.importance === filter);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: 34, height: 34, border: "none", background: open ? C.surfaceAlt : "transparent",
        borderRadius: R.md, cursor: "pointer", display: "grid", placeItems: "center",
        position: "relative", transition: "background 0.12s",
      }}>
        <Bell size={16} color={C.textSecondary} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 16, height: 16, padding: "0 4px",
            background: C.accent, color: "white",
            fontSize: 9, fontWeight: 700,
            borderRadius: R.full,
            display: "grid", placeItems: "center",
            fontFamily: FONTS.body, fontVariantNumeric: "tabular-nums",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 380, maxWidth: "calc(100vw - 32px)",
          maxHeight: 560, overflow: "hidden",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: R.lg, boxShadow: SHADOW.menu, zIndex: 40,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Notifications</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </div>
            </div>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} style={{
                background: "transparent", border: "none", color: C.accent,
                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONTS.body, padding: 0,
              }}>
                Mark all read
              </button>
            )}
          </div>
          {/* Filter pills */}
          <div style={{ padding: "10px 16px", display: "flex", gap: 6, borderBottom: `1px solid ${C.border}` }}>
            {[
              { id: "all",      label: "All" },
              { id: "critical", label: "Critical" },
              { id: "high",     label: "High" },
              { id: "info",     label: "Info" },
            ].map(f => {
              const isActive = filter === f.id;
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  background: isActive ? C.text : "transparent",
                  color: isActive ? C.surface : C.textSecondary,
                  border: `1px solid ${isActive ? C.text : C.border}`,
                  padding: "4px 11px", borderRadius: R.full,
                  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body,
                  letterSpacing: "0.03em",
                }}>{f.label}</button>
              );
            })}
          </div>
          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 28, fontSize: 13, color: C.textMuted, textAlign: "center" }}>
                Nothing here.
              </div>
            ) : filtered.map(n => {
              const tone = notifImportance(n.importance);
              const NIcon = NOTIF_TYPE_ICON[n.type] || AlertCircle;
              return (
                <button key={n.id} onClick={() => { setOpen(false); onOpen(n); }} style={{
                  width: "100%", background: n.read ? C.surface : C.surfaceAlt,
                  border: "none", borderBottom: `1px solid ${C.border}`,
                  padding: "12px 16px", cursor: "pointer", textAlign: "left",
                  display: "flex", gap: 12, alignItems: "flex-start", fontFamily: FONTS.body,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? C.surface : C.surfaceAlt}
                >
                  <div style={{
                    width: 32, height: 32, background: tone.bg, color: tone.fg,
                    borderRadius: R.md, display: "grid", placeItems: "center", flexShrink: 0,
                  }}>
                    <NIcon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                        color: tone.fg, background: tone.bg, padding: "2px 6px", borderRadius: R.sm,
                      }}>{tone.label.toUpperCase()}</span>
                      <span style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>{timeAgo(n.t)}</span>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: R.full, background: C.accent }} />}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3, lineHeight: 1.35 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.45 }}>{n.body}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onSignOut, onSwitchAccount, compact }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8,
        background: open ? C.surfaceAlt : "transparent", border: "none",
        padding: compact ? 4 : "4px 10px 4px 4px", borderRadius: R.full, cursor: "pointer",
        fontFamily: FONTS.body, transition: "background 0.12s",
      }}>
        <Avatar initials={user.initials} role={user.role} size={28} />
        {!compact && <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{user.name}</span>}
        {!compact && <ChevronDown size={14} color={C.textMuted} />}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, width: 300,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: R.lg, padding: 6, boxShadow: SHADOW.menu, zIndex: 30,
        }}>
          <div style={{ padding: "10px 12px 12px", borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{user.email}</div>
            <div style={{ marginTop: 8 }}><RolePill role={user.role} /></div>
          </div>
          <div style={{ padding: "4px 12px 6px", fontSize: 11, color: C.textMuted, letterSpacing: "0.06em", fontWeight: 500 }}>
            Switch demo account
          </div>
          {Object.values(ACCOUNTS).filter(a => a.id !== user.id).map(acc => (
            <button key={acc.id} onClick={() => { onSwitchAccount(acc.id); setOpen(false); }}
              style={{ ...hoverableRow, padding: "8px 12px" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Avatar initials={acc.initials} role={acc.role} size={26} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{acc.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {roleLabel(acc.role)}
                </div>
              </div>
            </button>
          ))}
          <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
          <button onClick={onSignOut} style={{
            width: "100%", background: "transparent", border: "none",
            padding: "10px 12px", borderRadius: R.md, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, color: C.textSecondary,
            fontSize: 13, fontFamily: FONTS.body, fontWeight: 500,
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ initials, role, size = 32 }) {
  const colorByRole = {
    member: { bg: "#E0E7FF", fg: "#3730A3" },
    rep: { bg: "#FEF3C7", fg: "#92400E" },
    president: { bg: C.accentSoft, fg: C.accent },
  };
  const c = colorByRole[role] || colorByRole.member;
  return (
    <div style={{
      width: size, height: size, borderRadius: R.full,
      background: c.bg, color: c.fg,
      display: "grid", placeItems: "center",
      fontSize: Math.round(size * 0.38), fontWeight: 600, fontFamily: FONTS.body,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function RolePill({ role }) {
  const c = role === "president"
    ? { bg: C.accentSoft, fg: C.accent }
    : role === "rep"
    ? { bg: "#FEF3C7", fg: "#92400E" }
    : { bg: "#E0E7FF", fg: "#3730A3" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: c.bg, color: c.fg, fontSize: 10, fontWeight: 600,
      padding: "3px 8px", borderRadius: R.full, letterSpacing: "0.02em",
    }}>
      {roleLabel(role)}
    </span>
  );
}

// ============================================================
// MEMBER HOME
// ============================================================
function MemberHome({ user, incidents, onReport, onOpen }) {
  const vp = useViewport();
  return (
    <div>
      <PageHeader eyebrow="Member" title={`Hi, ${user.name.split(" ")[0]}.`} subtitle={`${user.title} · ${user.building}`} />

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: vp.isMobile ? 22 : 28, marginBottom: 36, boxShadow: SHADOW.card,
        display: "grid", gridTemplateColumns: vp.isMobile ? "1fr" : "1fr auto",
        gap: vp.isMobile ? 16 : 24, alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 6 }}>
            Something happen?
          </div>
          <div style={{ color: C.textSecondary, fontSize: 14, maxWidth: 480 }}>
            File it. Your building rep and local president see the report instantly — same speed as the walkie-talkie, with a permanent record.
          </div>
        </div>
        <button onClick={onReport} style={{
          ...primaryButton, padding: "12px 20px", fontSize: 14,
          width: vp.isMobile ? "100%" : "auto", justifyContent: "center",
        }}>
          <Plus size={16} /> Report an incident
        </button>
      </div>

      <SectionLabel>Your recent reports</SectionLabel>
      {incidents.length === 0 ? (
        <EmptyState text="No reports yet. When you file one, it appears here with status updates from your building rep and local president." />
      ) : (
        <Card>
          {incidents.map((inc, i) => (
            <IncidentRow key={inc.id} inc={inc} onClick={() => onOpen(inc.id)} showBuilding={false} divider={i > 0} />
          ))}
        </Card>
      )}
    </div>
  );
}

// ============================================================
// REPORT FORM
// ============================================================
function ReportForm({ user, onCancel, onSubmit }) {
  const [type, setType] = useState("");
  const [injuryType, setInjuryType] = useState(""); // physical | mental | both | none
  const [severity, setSeverity] = useState("medium");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [studentRef, setStudentRef] = useState("");
  const [photoNames, setPhotoNames] = useState([]);
  const [needsImmediate, setNeedsImmediate] = useState(false);
  const [is911, setIs911] = useState(false);
  const vp = useViewport();
  const canSubmit = type && description.trim().length > 5;

  // Suggest students based on user's building
  const buildingStudents = Object.entries(STUDENTS).filter(([_, s]) => s.building === user.building);

  function addTag(t) {
    const v = t.trim().toLowerCase();
    if (!v) return;
    if (tags.includes(v)) return;
    setTags([...tags, v]);
    setTagInput("");
  }
  function removeTag(t) {
    setTags(tags.filter(x => x !== t));
  }
  function handlePhoto(e) {
    const files = Array.from(e.target.files || []);
    setPhotoNames(prev => [...prev, ...files.map(f => f.name)].slice(0, 4));
  }

  return (
    <div>
      <BackButton onClick={onCancel} />
      <PageHeader title="File an incident report" subtitle={`Going to ${user.building}'s building rep and your local president.`} />

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: vp.isMobile ? 18 : 28, boxShadow: SHADOW.card,
      }}>
        {/* STEP 1 — Identification (auto-prefilled from auth) */}
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: R.md,
          padding: 14, marginBottom: 22, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.05em", padding: "3px 8px", background: C.surface, borderRadius: R.sm, border: `1px solid ${C.border}` }}>
            STEP 1 · IDENTIFICATION
          </div>
          <div style={{ fontSize: 13, color: C.text, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Meta icon={<User size={12} />}>{user.name}</Meta>
            <Meta icon={<Building2 size={12} />}>{user.building}</Meta>
            <Meta icon={<Clock size={12} />}>{new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</Meta>
          </div>
        </div>

        <FieldLabel>Type of incident</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 28 }}>
          {Object.entries(TYPE_META).map(([id, meta]) => {
            const Icon = meta.icon;
            const active = type === id;
            return (
              <button key={id} onClick={() => setType(id)} style={{
                background: active ? C.text : C.surface,
                color: active ? C.surface : C.text,
                border: `1px solid ${active ? C.text : C.border}`,
                borderRadius: R.md, padding: "14px",
                textAlign: "left", cursor: "pointer", fontFamily: FONTS.body,
                fontSize: 13, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 10,
                transition: "all 0.12s",
              }}>
                <Icon size={16} />
                {meta.label}
              </button>
            );
          })}
        </div>

        <FieldLabel>How severe?</FieldLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {["low", "medium", "high", "critical"].map(s => {
            const sc = SEVERITY[s];
            const active = severity === s;
            return (
              <button key={s} onClick={() => setSeverity(s)} style={{
                background: active ? sc.bg : C.surface,
                border: `1px solid ${active ? sc.color : C.border}`,
                borderRadius: R.md, padding: "9px 16px",
                cursor: "pointer", fontFamily: FONTS.body,
                fontSize: 13, fontWeight: 500, color: active ? sc.color : C.textSecondary,
                display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.12s",
              }}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: R.full, background: sc.color }} />
                {sc.label}
              </button>
            );
          })}
        </div>

        <FieldLabel>
          Injury qualifier
          <span style={{ fontWeight: 400, color: C.textMuted }}> · routes to the correct response pathway</span>
        </FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 28 }}>
          {[
            { id: "physical", label: "Physical injury", desc: "Visible or felt harm" },
            { id: "mental",   label: "Mental injury",   desc: "Emotional or psychological" },
            { id: "both",     label: "Both",            desc: "Physical and mental" },
            { id: "none",     label: "No injury",       desc: "Documenting only" },
          ].map(opt => {
            const active = injuryType === opt.id;
            return (
              <button key={opt.id} onClick={() => setInjuryType(opt.id)} style={{
                background: active ? C.text : C.surface,
                color: active ? C.surface : C.text,
                border: `1px solid ${active ? C.text : C.border}`,
                borderRadius: R.md, padding: "12px 14px",
                textAlign: "left", cursor: "pointer", fontFamily: FONTS.body,
                transition: "all 0.12s",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{opt.label}</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>

        {buildingStudents.length > 0 && (
          <>
            <FieldLabel>
              Student involved
              <span style={{ fontWeight: 400, color: C.textMuted }}> · anonymized code, optional, links to safety plan</span>
            </FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
              <button onClick={() => setStudentRef("")} style={{
                background: studentRef === "" ? C.text : C.surface,
                color: studentRef === "" ? C.surface : C.textSecondary,
                border: `1px solid ${studentRef === "" ? C.text : C.border}`,
                borderRadius: R.md, padding: "8px 14px",
                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONTS.body,
              }}>
                None / not applicable
              </button>
              {buildingStudents.map(([id, s]) => (
                <button key={id} onClick={() => setStudentRef(id)} style={{
                  background: studentRef === id ? C.text : C.surface,
                  color: studentRef === id ? C.surface : C.text,
                  border: `1px solid ${studentRef === id ? C.text : C.border}`,
                  borderRadius: R.md, padding: "8px 14px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body,
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}>
                  {s.code}
                  <span style={{ fontWeight: 400, opacity: 0.7 }}>{s.setting}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <FieldLabel>Where?</FieldLabel>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Room 12, B Wing"
          style={{ ...inputStyle, padding: "10px 14px", marginBottom: 28 }} />

        <FieldLabel>What happened? (be specific — this becomes the record)</FieldLabel>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Describe the incident, who was involved, what injury or threat occurred…"
          rows={5}
          style={{ ...inputStyle, padding: "12px 14px", marginBottom: 28, resize: "vertical", lineHeight: 1.5 }} />

        <FieldLabel>
          Photo evidence
          <span style={{ fontWeight: 400, color: C.textMuted }}> · optional, for visible injuries or environmental hazards</span>
        </FieldLabel>
        <label htmlFor="photo-upload" style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "20px",
          background: C.bg, border: `1px dashed ${C.borderStrong}`,
          borderRadius: R.md, marginBottom: photoNames.length ? 10 : 28,
          cursor: "pointer", transition: "all 0.12s",
        }}>
          <FileWarning size={20} color={C.textMuted} />
          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
            {photoNames.length > 0 ? "Add more photos" : "Tap to attach photos"}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            Photos are stored encrypted · only your union leadership can view
          </div>
          <input id="photo-upload" type="file" accept="image/*" multiple
            onChange={handlePhoto} style={{ display: "none" }} />
        </label>
        {photoNames.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
            {photoNames.map((n, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.surfaceAlt, border: `1px solid ${C.border}`,
                fontSize: 12, color: C.text, padding: "5px 6px 5px 10px", borderRadius: R.md,
              }}>
                <FileWarning size={11} color={C.textMuted} /> {n}
                <button onClick={() => setPhotoNames(photoNames.filter((_, j) => j !== i))} style={{
                  background: "transparent", border: "none", cursor: "pointer", padding: 0,
                  width: 16, height: 16, borderRadius: R.full, display: "grid", placeItems: "center",
                }}>
                  <X size={10} color={C.textMuted} />
                </button>
              </span>
            ))}
          </div>
        )}

        <FieldLabel>Tags <span style={{ fontWeight: 400, color: C.textMuted }}>· catalog this incident so patterns surface later</span></FieldLabel>
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {tags.map(t => (
              <span key={t} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.text, color: C.surface,
                fontSize: 12, fontWeight: 500, padding: "5px 6px 5px 11px",
                borderRadius: R.full,
              }}>
                {t}
                <button onClick={() => removeTag(t)} style={{
                  background: "rgba(255,255,255,0.15)", border: "none",
                  color: C.surface, cursor: "pointer", padding: 0,
                  width: 16, height: 16, borderRadius: R.full,
                  display: "grid", placeItems: "center",
                }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
            <Tag size={15} color={C.textMuted} />
          </div>
          <input
            type="text" value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
            placeholder="Type a tag and press Enter (e.g. bite, parent, special ed)"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>SUGGESTED</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TAG_SUGGESTIONS.filter(t => !tags.includes(t)).slice(0, 14).map(t => (
              <button key={t} onClick={() => addTag(t)} style={{
                background: C.surface, color: C.textSecondary,
                border: `1px solid ${C.border}`, borderRadius: R.full,
                fontSize: 12, fontWeight: 500, padding: "5px 11px",
                cursor: "pointer", fontFamily: FONTS.body,
                display: "inline-flex", alignItems: "center", gap: 4,
                transition: "all 0.12s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.textSecondary; }}>
                <Plus size={11} /> {t}
              </button>
            ))}
          </div>
        </div>

        <FieldLabel>Urgency</FieldLabel>
        <div style={{ display: "grid", gap: 10, marginBottom: 28 }}>
          {/* Immediate assistance from union */}
          <label style={{
            display: "flex", alignItems: "flex-start", gap: 12, padding: 14,
            background: needsImmediate ? C.accentSoft : C.bg,
            border: `1px solid ${needsImmediate ? C.accentBorder : C.border}`,
            borderRadius: R.md, cursor: "pointer", transition: "all 0.12s",
          }}>
            <input type="checkbox" checked={needsImmediate} onChange={e => setNeedsImmediate(e.target.checked)} style={{ marginTop: 3 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={14} color={C.accent} /> I need immediate assistance from my union
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 3, lineHeight: 1.5 }}>
                Priority alert to your building rep and local president right now. Use for active situations that need union backup but aren't life-threatening.
              </div>
            </div>
          </label>

          {/* 911 Emergency */}
          <label style={{
            display: "flex", alignItems: "flex-start", gap: 12, padding: 14,
            background: is911 ? C.criticalBg : C.bg,
            border: `1px solid ${is911 ? C.critical : C.border}`,
            borderRadius: R.md, cursor: "pointer", transition: "all 0.12s",
          }}>
            <input type="checkbox" checked={is911} onChange={e => setIs911(e.target.checked)} style={{ marginTop: 3 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.critical, display: "flex", alignItems: "center", gap: 6 }}>
                <Siren size={15} color={C.critical} /> This is a 911 emergency
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 3, lineHeight: 1.5 }}>
                Active violence, weapon present, medical emergency, or anyone in immediate danger.
              </div>
              {is911 && (
                <div style={{
                  marginTop: 12, padding: 14, background: C.surface,
                  border: `1px solid #FCA5A5`, borderRadius: R.md,
                }}>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginBottom: 12 }}>
                    <strong style={{ color: C.critical }}>Call 911 first.</strong> If anyone is in immediate danger — bleeding, weapon, active violence, medical crisis — do not stop to file a report. Call now, get safe, then submit this. Your union leadership is alerted automatically the moment you tap submit.
                  </div>
                  <a href="tel:911" style={{
                    background: C.critical, color: "white", border: "none",
                    padding: "10px 18px", borderRadius: R.md,
                    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    textDecoration: "none",
                  }}>
                    <Phone size={15} /> Call 911 now
                  </a>
                </div>
              )}
            </div>
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={secondaryButton}>Cancel</button>
          <button onClick={() => canSubmit && onSubmit({
              type, severity, location, description, tags,
              needsImmediate, is911, injuryType,
              studentRef: studentRef || undefined,
              photoCount: photoNames.length,
            })}
            disabled={!canSubmit}
            style={{ ...primaryButton, opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? "pointer" : "not-allowed" }}>
            <Send size={14} /> Submit report
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REP DASHBOARD
// ============================================================
function RepDashboard({ user, incidents, onOpen }) {
  const day = 86400_000;
  const now = Date.now();
  const open = incidents.filter(i => i.status !== "resolved");
  const thisWeek = incidents.filter(i => i.t > now - 7 * day);
  const monthIncidents = incidents.filter(i => i.t > now - 30 * day);
  const severe = incidents.filter(i => i.severity === "critical" || i.severity === "high");

  const actions = computeRepActions(incidents);
  const tags = topTags(monthIncidents, 8);
  const types = typeBreakdown(monthIncidents);
  const reporters = topReporters(monthIncidents, 5);
  const severities = severityBreakdown(monthIncidents);
  const sick = sickTimeStats(monthIncidents);
  const locSev = locationDetailMatrix(monthIncidents, 10);
  const vp = useViewport();

  return (
    <div>
      <PageHeader eyebrow="Building rep" title={user.building} subtitle={`You're ${user.name} · ${user.title}`} />

      <div style={{ display: "grid", gridTemplateColumns: vp.isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 12, marginBottom: 36 }}>
        <Stat label="Open" value={open.length} accent />
        <Stat label="This week" value={thisWeek.length} />
        <Stat label="This month" value={monthIncidents.length} />
        <Stat label="High / critical" value={severe.length} />
        <Stat label="Sick days · 30d" value={sick.total} />
      </div>

      <SickLeaveCallout stats={sick} />

      {actions.length > 0 && (
        <>
          <SectionLabel>Action items for you</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14, marginBottom: 36 }}>
            {actions.map((a, i) => <ActionItemCard key={i} action={a} />)}
          </div>
        </>
      )}

      <SectionLabel>Severity, last 30 days</SectionLabel>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <SeverityBar data={severities} total={monthIncidents.length} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <SectionLabel>Locations in your building by severity</SectionLabel>
        <HipaaNotice text="Aggregate · no individual identifiers" />
      </div>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <LocationSeverityHeatmap data={locSev} locationKey="location" label="Location" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, marginBottom: 36 }}>
        <Panel label="Top issues" title="Most-tagged this month">
          <TopTagsList data={tags} total={monthIncidents.length} />
        </Panel>
        <Panel label="By type" title="Incident categories">
          <TypeDonut data={types} />
        </Panel>
      </div>

      <SectionLabel>Student safety planning · who needs corrective action</SectionLabel>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <StudentPatterns students={topStudents(monthIncidents, 5)} />
      </div>

      {reporters.length > 0 && (
        <>
          <SectionLabel>Most-affected staff in your building, 30 days</SectionLabel>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
            padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {reporters.map(r => {
                const max = reporters[0].count;
                const pct = (r.count / max) * 100;
                const isVulnerable = r.role && r.role.toLowerCase().includes("special ed");
                return (
                  <div key={r.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: C.text, fontWeight: 500 }}>
                        {r.name} <span style={{ color: C.textMuted, fontWeight: 400 }}>· {r.role}</span>
                      </span>
                      <span style={{ color: C.textMuted, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                        {r.count} report{r.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div style={{ height: 4, background: C.surfaceAlt, borderRadius: R.full, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: isVulnerable ? C.accent : C.textSecondary, borderRadius: R.full }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <SectionLabel>Incidents in your building</SectionLabel>
      <Card>
        {incidents.map((inc, i) => (
          <IncidentRow key={inc.id} inc={inc} onClick={() => onOpen(inc.id)} showBuilding={false} divider={i > 0} />
        ))}
      </Card>
    </div>
  );
}

// ============================================================
// PRESIDENT DASHBOARD
// ============================================================
function PresidentDashboard({ user, incidents, onOpen }) {
  const day = 86400_000;
  const now = Date.now();
  const thisWeek = incidents.filter(i => i.t > now - 7 * day);
  const lastWeek = incidents.filter(i => i.t > now - 14 * day && i.t <= now - 7 * day);
  const deltaPct = lastWeek.length === 0 ? 0 : Math.round((thisWeek.length - lastWeek.length) / lastWeek.length * 100);
  const buildingsAffected = new Set(thisWeek.map(i => i.building)).size;
  const open = incidents.filter(i => i.status !== "resolved").length;
  const monthCutoff = now - 30 * day;
  const monthIncidents = incidents.filter(i => i.t > monthCutoff);

  const byBuilding = BUILDINGS.map(b => ({
    building: b,
    count: incidents.filter(i => i.building === b && i.t > monthCutoff).length,
  })).sort((a, b) => b.count - a.count);

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now - i * 7 * day;
    const start = end - 7 * day;
    return { week: `W-${7 - i}`, count: incidents.filter(inc => inc.t > start && inc.t <= end).length };
  }).reverse();

  const actions = computePresidentActions(incidents);
  const tags = topTags(monthIncidents, 10);
  const types = typeBreakdown(monthIncidents);
  const roles = affectedRoles(monthIncidents, 6);
  const severities = severityBreakdown(monthIncidents);
  const sick = sickTimeStats(monthIncidents);
  const sickByBuilding = sickTimeByBuilding(monthIncidents);
  const locSev = buildingSeverityMatrix(monthIncidents);
  const vp = useViewport();

  return (
    <div>
      <PageHeader eyebrow="Local president" title={user.district} subtitle={`You're ${user.name} · ${user.title}`} />

      <div style={{ display: "grid", gridTemplateColumns: vp.isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 12, marginBottom: 36 }}>
        <Stat label="This week" value={thisWeek.length} change={deltaPct} />
        <Stat label="Buildings affected" value={`${buildingsAffected}/${BUILDINGS.length}`} />
        <Stat label="Open" value={open} accent />
        <Stat label="Last 30 days" value={monthIncidents.length} />
        <Stat label="Sick days · 30d" value={sick.total} />
      </div>

      <SickLeaveCallout stats={sick} />

      {actions.length > 0 && (
        <>
          <SectionLabel>Action items — what needs you this week</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 14, marginBottom: 36 }}>
            {actions.map((a, i) => <ActionItemCard key={i} action={a} />)}
          </div>
        </>
      )}

      <SectionLabel>Severity, last 30 days</SectionLabel>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <SeverityBar data={severities} total={monthIncidents.length} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: vp.isMobile ? "1fr" : "1.1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Panel label="Weekly trend" title="Reports filed, last 8 weeks">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeks} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, fontSize: 13, boxShadow: SHADOW.menu }}
                labelStyle={{ color: C.textMuted, fontSize: 11 }} />
              <Line type="monotone" dataKey="count" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel label="By building" title="Last 30 days">
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {byBuilding.map(b => {
              const max = byBuilding[0].count || 1;
              const pct = (b.count / max) * 100;
              const color = b.count >= 7 ? C.accent : b.count >= 3 ? C.medium : C.low;
              return (
                <div key={b.building}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: C.text, fontWeight: 500 }}>{b.building}</span>
                    <span style={{ color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>{b.count}</span>
                  </div>
                  <div style={{ height: 4, background: C.surfaceAlt, borderRadius: R.full, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: R.full }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <TrendCausationPanel weeks={weeks} monthIncidents={monthIncidents} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, marginBottom: 36 }}>
        <Panel label="Top issues" title="Most-tagged this month">
          <TopTagsList data={tags.slice(0, 10)} total={monthIncidents.length} />
        </Panel>
        <Panel label="By type" title="Incident categories">
          <TypeDonut data={types} />
        </Panel>
        <Panel label="Most affected" title="Job roles, last 30 days">
          <AffectedRoles data={roles} total={monthIncidents.length} />
        </Panel>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <SectionLabel>Geographic incident map · Massachusetts</SectionLabel>
        <HipaaNotice text="Aggregate · district-level positioning" />
      </div>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <GeoHeatMap incidents={monthIncidents} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <SectionLabel>Incidents by location and severity</SectionLabel>
        <HipaaNotice text="Aggregate · no individual identifiers" />
      </div>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <LocationSeverityHeatmap data={locSev} locationKey="building" label="Building" />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <SectionLabel>Sick leave correlated with incidents · 30 days</SectionLabel>
        <HipaaNotice text="HIPAA · aggregate building-level only" />
      </div>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <SickTimeByBuildingList data={sickByBuilding} />
      </div>

      <SectionLabel>Student safety planning · who needs corrective action</SectionLabel>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, boxShadow: SHADOW.card, marginBottom: 36,
      }}>
        <StudentPatterns students={topStudents(monthIncidents, 6)} />
      </div>

      <SectionLabel>Recent incidents, district-wide</SectionLabel>
      <Card>
        {incidents.slice(0, 12).map((inc, i) => (
          <IncidentRow key={inc.id} inc={inc} onClick={() => onOpen(inc.id)} showBuilding divider={i > 0} />
        ))}
      </Card>
    </div>
  );
}

// ============================================================
// INCIDENT DETAIL
// ============================================================
function IncidentDetail({ user, incident, onBack, onReply, onStatus, onAssignPolicy, onUnassignPolicy }) {
  const [reply, setReply] = useState("");
  const meta = TYPE_META[incident.type];
  const Icon = meta.icon;
  const student = incident.studentRef ? STUDENTS[incident.studentRef] : null;
  const assignedPolicies = incident.policies || [];
  const suggested = suggestPolicies(incident);
  const canManagePolicies = user.role === "rep" || user.role === "president";

  function send() {
    if (!reply.trim()) return;
    onReply(reply.trim());
    setReply("");
  }

  return (
    <div>
      <BackButton onClick={onBack} />

      <div style={{ marginTop: 8, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONTS.body, fontSize: 12, color: C.textMuted, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{incident.id}</span>
            <StatusPill status={incident.status} />
            <SeverityBadge severity={incident.severity} />
          </div>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon size={22} color={C.textSecondary} /> {meta.label}
          </h2>
          <div style={{ fontSize: 13, color: C.textSecondary, display: "flex", gap: 18, flexWrap: "wrap" }}>
            <Meta icon={<Building2 size={13} />}>{incident.building}</Meta>
            <Meta icon={<MapPin size={13} />}>{incident.location || "—"}</Meta>
            <Meta icon={<Clock size={13} />}>{formatTime(incident.t)}</Meta>
            <Meta icon={<User size={13} />}>{incident.reporter} ({incident.role})</Meta>
          </div>
        </div>
        {user.role !== "member" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["acknowledged", "in_progress", "resolved"].map(s => (
              <button key={s} onClick={() => onStatus(s)} style={{
                ...secondaryButton,
                background: incident.status === s ? C.text : C.surface,
                color: incident.status === s ? C.surface : C.text,
                borderColor: incident.status === s ? C.text : C.border,
                fontSize: 12, padding: "7px 12px",
              }}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
        padding: 22, marginBottom: 28, boxShadow: SHADOW.card,
      }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>WHAT HAPPENED</div>
        <p style={{ fontSize: 15, color: C.text, margin: 0, lineHeight: 1.6 }}>{incident.description}</p>
        {incident.tags && incident.tags.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>TAGS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {incident.tags.map(t => (
                <span key={t} style={{
                  background: C.surfaceAlt, color: C.text,
                  fontSize: 12, fontWeight: 500, padding: "4px 10px",
                  borderRadius: R.full, display: "inline-flex", alignItems: "center", gap: 4,
                }}>
                  <Tag size={10} color={C.textMuted} /> {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {incident.is911 && (
          <div style={{
            marginTop: 16, padding: "12px 14px", background: C.criticalBg, border: `1px solid ${C.critical}`,
            borderRadius: R.md, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.critical, fontWeight: 600,
          }}>
            <Siren size={16} /> 911 was called. Emergency response was requested at the scene.
          </div>
        )}
        {incident.needsImmediate && !incident.is911 && (
          <div style={{
            marginTop: 16, padding: "10px 14px", background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
            borderRadius: R.md, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.accent, fontWeight: 500,
          }}>
            <Zap size={15} /> Reporter requested immediate assistance.
          </div>
        )}
      </div>

      {/* Student panel — visible to rep/president only */}
      {student && user.role !== "member" && (
        <>
          <SectionLabel>Student involved</SectionLabel>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
            padding: 20, marginBottom: 28, boxShadow: SHADOW.card,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{
                background: C.text, color: C.surface,
                fontSize: 13, fontWeight: 600, padding: "5px 12px",
                borderRadius: R.sm, letterSpacing: "0.04em",
              }}>{student.code}</span>
              <span style={{ fontSize: 12, color: C.textMuted, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={11} /> Anonymized · FERPA-protected
              </span>
            </div>
            <div style={{ fontSize: 13, color: C.textSecondary, display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 12 }}>
              <Meta icon={<Building2 size={13} />}>{student.building}</Meta>
              <Meta icon={<MapPin size={13} />}>{student.setting}</Meta>
              <Meta icon={<User size={13} />}>{student.grade}</Meta>
            </div>
            <div style={{ fontSize: 13, color: C.text }}>
              <span style={{ color: C.textMuted }}>Existing supports:</span> <TermText text={student.supports} />
              {student.lastBIP && <> · <span style={{ color: C.textMuted }}>Last <Term code="BIP" />:</span> {student.lastBIP}</>}
            </div>
          </div>
        </>
      )}

      {/* Policies section */}
      {(canManagePolicies || assignedPolicies.length > 0) && (
        <>
          <SectionLabel>Assigned policies</SectionLabel>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
            padding: 20, marginBottom: 28, boxShadow: SHADOW.card,
          }}>
            <div style={{ marginBottom: canManagePolicies ? 14 : 0 }}>
              <PolicyChips ids={assignedPolicies}
                removable={canManagePolicies}
                onRemove={onUnassignPolicy} />
            </div>
            {canManagePolicies && (
              <PolicyAssign assigned={assignedPolicies} suggested={suggested} onAssign={onAssignPolicy} />
            )}
          </div>
        </>
      )}

      <SectionLabel>Conversation</SectionLabel>
      <div style={{ marginBottom: 20 }}>
        {incident.thread.length === 0 ? (
          <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: R.lg, padding: 20, fontSize: 13, color: C.textMuted, textAlign: "center" }}>
            No replies yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {incident.thread.map((msg, i) => {
              const isMine = msg.from === user.name;
              return (
                <div key={i} style={{
                  background: C.surface,
                  border: `1px solid ${isMine ? C.accentBorder : C.border}`,
                  borderRadius: R.lg, padding: 16, boxShadow: SHADOW.card,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar initials={msg.from.split(" ").map(s => s[0]).join("").slice(0, 2)} role={
                        msg.role === "Local president" ? "president" : msg.role === "Building rep" ? "rep" : "member"
                      } size={24} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{msg.from}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{msg.role}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>{timeAgo(msg.t)}</div>
                  </div>
                  <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>{msg.text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, padding: 14, boxShadow: SHADOW.card }}>
        <textarea value={reply} onChange={e => setReply(e.target.value)}
          placeholder={`Reply as ${roleLabel(user.role).toLowerCase()}…`}
          rows={3}
          style={{
            width: "100%", border: "none", outline: "none", resize: "vertical",
            fontFamily: FONTS.body, fontSize: 14, color: C.text, background: "transparent",
            lineHeight: 1.55, padding: 4,
          }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={send} disabled={!reply.trim()} style={{ ...primaryButton, opacity: reply.trim() ? 1 : 0.4, cursor: reply.trim() ? "pointer" : "not-allowed" }}>
            <Send size={14} /> Send reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {eyebrow && (
        <div style={{ fontSize: 11, letterSpacing: "0.1em", color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>
          {eyebrow.toUpperCase()}
        </div>
      )}
      <h1 style={{
        fontFamily: FONTS.display, fontSize: 32, fontWeight: 600,
        letterSpacing: "-0.03em", margin: 0, lineHeight: 1.15, color: C.text,
      }}>
        {title}
      </h1>
      {subtitle && (
        <div style={{ fontSize: 14, color: C.textSecondary, marginTop: 8 }}>{subtitle}</div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, letterSpacing: "0.1em", color: C.textMuted, fontWeight: 600,
      margin: "0 0 14px",
    }}>
      {children.toUpperCase()}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 10 }}>{children}</div>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
      overflow: "hidden", boxShadow: SHADOW.card,
    }}>
      {children}
    </div>
  );
}

function Panel({ label, title, children }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
      padding: 20, boxShadow: SHADOW.card,
    }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: C.textMuted, marginBottom: 4, fontWeight: 600 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 16 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, accent, change }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg,
      padding: 18, boxShadow: SHADOW.card,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        fontSize: 11, letterSpacing: "0.08em", color: C.textMuted,
        marginBottom: 10, fontWeight: 600,
        // Fixed height keeps the number row at the same Y across cards
        // even when a label wraps to two lines ("BUILDINGS AFFECTED").
        minHeight: 30, lineHeight: 1.35,
      }}>
        {label.toUpperCase()}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: "auto" }}>
        <div style={{
          fontFamily: FONTS.display, fontSize: 30, fontWeight: 600,
          letterSpacing: "-0.025em",
          color: accent ? C.accent : C.text,
          lineHeight: 1, fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </div>
        {change != null && change !== 0 && (
          <div style={{ fontSize: 12, color: change > 0 ? C.accent : C.low, display: "flex", alignItems: "center", gap: 2, fontWeight: 500 }}>
            {change > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change > 0 ? "+" : ""}{change}%
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD ANALYTICS COMPONENTS
// ============================================================
function ActionItemCard({ action }) {
  const Icon = ACTION_ICONS[action.kind] || AlertCircle;
  const tone = actionTone(action.kind);
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg,
      padding: 18, boxShadow: SHADOW.card,
      display: "flex", gap: 14, alignItems: "stretch",
      // Cards in the same grid row already match heights via grid stretch.
      // Make this card flex-fill its row height so CTA can pin to bottom.
      height: "100%",
    }}>
      <div style={{
        background: tone.bg, color: tone.fg,
        width: 36, height: 36, borderRadius: R.md,
        display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        <Icon size={17} />
      </div>
      {/* Flex column inside the card so we can push CTA to the bottom */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.35 }}>
          {action.title}
        </div>
        <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>
          {action.body}
        </div>
        {action.cta && (
          <button style={{
            background: "transparent", color: tone.fg,
            border: "none", padding: 0,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body,
            display: "inline-flex", alignItems: "center", gap: 4,
            marginTop: "auto", // pin to bottom so links across cards align horizontally
            alignSelf: "flex-start",
          }}>
            {action.cta} <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function TopTagsList({ data, total }) {
  if (data.length === 0) return <EmptyMini text="No tags yet." />;
  const max = data[0].count;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(({ tag, count }) => {
        const pct = (count / max) * 100;
        const sharePct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={tag}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: C.text, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Tag size={11} color={C.textMuted} /> {tag}
              </span>
              <span style={{ color: C.textMuted, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                {count} <span style={{ color: C.textMuted, opacity: 0.6 }}>· {sharePct}%</span>
              </span>
            </div>
            <div style={{ height: 4, background: C.surfaceAlt, borderRadius: R.full, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: C.text, borderRadius: R.full }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AffectedRoles({ data, total }) {
  if (data.length === 0) return <EmptyMini text="No data yet." />;
  const max = data[0].count;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(({ role, count }) => {
        const pct = (count / max) * 100;
        const sharePct = total ? Math.round((count / total) * 100) : 0;
        const isVulnerable = role.toLowerCase().includes("special ed") || role.toLowerCase().includes("ia");
        return (
          <div key={role}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: C.text, fontWeight: 500 }}>{role}</span>
              <span style={{ color: C.textMuted, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                {count} <span style={{ color: C.textMuted, opacity: 0.6 }}>· {sharePct}%</span>
              </span>
            </div>
            <div style={{ height: 4, background: C.surfaceAlt, borderRadius: R.full, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: isVulnerable ? C.accent : C.textSecondary, borderRadius: R.full }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TypeDonut({ data }) {
  if (data.length === 0) return <EmptyMini text="No data." />;
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 140, height: 140, position: "relative", flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="type"
              cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2}
              strokeWidth={0}>
              {data.map(d => <Cell key={d.type} fill={TYPE_COLORS[d.type] || C.textSecondary} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, fontSize: 12, boxShadow: SHADOW.menu, padding: "6px 10px" }}
              labelStyle={{ display: "none" }}
              formatter={(value, _name, props) => [`${value} reports`, props.payload.label]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: C.text, lineHeight: 1 }}>
              {total}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3, letterSpacing: "0.06em", fontWeight: 600 }}>
              REPORTS
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map(d => {
          const pct = total ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: R.full, background: TYPE_COLORS[d.type] || C.textSecondary, flexShrink: 0 }} />
              <span style={{ flex: 1, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
              <span style={{ color: C.textMuted, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                {d.count} <span style={{ opacity: 0.6 }}>· {pct}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeverityBar({ data, total }) {
  if (total === 0) return <EmptyMini text="No data." />;
  return (
    <div>
      <div style={{ display: "flex", height: 10, borderRadius: R.full, overflow: "hidden", marginBottom: 14, background: C.surfaceAlt }}>
        {data.map(d => {
          const pct = (d.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div key={d.severity} title={`${d.label}: ${d.count}`}
              style={{ width: `${pct}%`, background: d.color }} />
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {data.map(d => {
          const pct = total ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.severity}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: R.full, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.04em" }}>{d.label.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: C.text, fontVariantNumeric: "tabular-nums" }}>{d.count}</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyMini({ text }) {
  return (
    <div style={{ fontSize: 12, color: C.textMuted, textAlign: "center", padding: 20, fontStyle: "italic" }}>
      {text}
    </div>
  );
}

// ============================================================
// SICK LEAVE — the only hard signal
// ============================================================
function SickLeaveCallout({ stats }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1F1310 0%, #2B1814 100%)",
      border: `1px solid #3F1F18`,
      borderRadius: R.xl, padding: 24, marginBottom: 36,
      position: "relative", overflow: "hidden",
    }}>
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: C.rust || C.accent,
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{
          width: 36, height: 36, background: "rgba(181,60,42,0.18)",
          color: "#F5A89A", borderRadius: R.md,
          display: "grid", placeItems: "center", flexShrink: 0,
        }}>
          <AlertCircle size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#F5A89A", fontWeight: 600, marginBottom: 6 }}>
            KEY INSIGHT · WHY WE NEED THIS DATA
          </div>
          <p style={{ fontSize: 15, color: "#F5F5F4", margin: "0 0 16px", lineHeight: 1.55 }}>
            Sick leave data is the <strong style={{ color: "#FFB4A4" }}>only hard source</strong> of incident information — yet it captures only the most severe cases. The actual rate of violence is <strong style={{ color: "#FFB4A4" }}>substantially higher</strong> and entirely unmeasured without a dedicated reporting infrastructure.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, paddingTop: 14, borderTop: "1px solid #3F1F18" }}>
            <div>
              <div style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {stats.total}
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 5, fontWeight: 500 }}>
                Sick days correlated with incidents, 30d
              </div>
            </div>
            <div>
              <div style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {stats.pct}%
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 5, fontWeight: 500 }}>
                Of incidents triggered sick leave
              </div>
            </div>
            <div>
              <div style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {stats.avgPerIncident}
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 5, fontWeight: 500 }}>
                Avg sick days per incident
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SickTimeByBuildingList({ data }) {
  if (data.length === 0) return <EmptyMini text="No sick-leave correlated incidents this period." />;
  const max = Math.max(...data.map(d => d.sickDays), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {data.map(b => {
        const pct = (b.sickDays / max) * 100;
        const ratio = b.incidents === 0 ? 0 : (b.sickDays / b.incidents).toFixed(1);
        const color = b.sickDays >= 10 ? C.accent : b.sickDays >= 4 ? C.medium : C.low;
        return (
          <div key={b.building}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: C.text, fontWeight: 500 }}>{b.building}</span>
              <span style={{ color: C.textMuted, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                <span style={{ color: C.text, fontWeight: 600 }}>{b.sickDays}</span> days · {ratio} per incident
              </span>
            </div>
            <div style={{ height: 6, background: C.surfaceAlt, borderRadius: R.full, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: R.full }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// LOCATION × SEVERITY HEATMAP
// ============================================================
function LocationSeverityHeatmap({ data, locationKey, label }) {
  if (data.length === 0) return <EmptyMini text="No data for this view." />;
  const severities = ["critical", "high", "medium", "low"];
  const maxCount = Math.max(...data.flatMap(r => severities.map(s => r[s])), 1);

  // Color intensity by count relative to max
  function cellStyle(count, severity) {
    if (count === 0) return { background: C.surfaceAlt, color: C.textFaint };
    const intensity = Math.min(count / maxCount, 1);
    const sc = SEVERITY[severity];
    // Mix the severity bg with the severity color based on intensity
    const opacity = 0.15 + intensity * 0.55;
    return {
      background: hexWithOpacity(sc.color, opacity),
      color: intensity > 0.5 ? "#FFFFFF" : sc.color,
      fontWeight: 600,
    };
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 1fr) 1fr", gap: 8, alignItems: "center", marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.06em" }}>{label.toUpperCase()}</div>
        {severities.map(s => (
          <div key={s} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: SEVERITY[s].color, letterSpacing: "0.04em" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: R.full, background: SEVERITY[s].color, marginRight: 5, verticalAlign: "middle" }} />
            {SEVERITY[s].label.toUpperCase()}
          </div>
        ))}
        <div style={{ textAlign: "right", fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.06em" }}>TOTAL</div>
      </div>
      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map(r => (
          <div key={r[locationKey]} style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 1fr) 1fr", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text, paddingLeft: 4 }}>{r[locationKey]}</div>
            {severities.map(s => (
              <div key={s} style={{
                textAlign: "center", borderRadius: R.md, padding: "10px 6px",
                fontSize: 13, fontVariantNumeric: "tabular-nums",
                ...cellStyle(r[s], s),
              }}>
                {r[s] || ""}
              </div>
            ))}
            <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600, color: C.text, fontVariantNumeric: "tabular-nums", paddingRight: 4 }}>{r.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper: convert hex + opacity to rgba()
function hexWithOpacity(hex, opacity) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ============================================================
// HIPAA NOTICE — inline compliance reassurance
// ============================================================
// ============================================================
// GEOGRAPHIC HEAT MAP — stylized Massachusetts outline with incident markers
// ============================================================
function GeoHeatMap({ incidents }) {
  const [hovered, setHovered] = useState(null);

  // Aggregate per building
  const byBuilding = BUILDINGS.map(b => {
    const inc = incidents.filter(i => i.building === b);
    if (inc.length === 0) return null;
    const sevWeight = inc.reduce((s, i) => s + ({ critical: 4, high: 3, medium: 2, low: 1 }[i.severity] || 1), 0);
    const maxSev = inc.some(i => i.severity === "critical") ? "critical"
                 : inc.some(i => i.severity === "high") ? "high"
                 : inc.some(i => i.severity === "medium") ? "medium" : "low";
    return {
      building: b,
      count: inc.length,
      sevWeight,
      maxSev,
      ...BUILDING_GEO[b],
    };
  }).filter(Boolean);

  const maxCount = Math.max(...byBuilding.map(b => b.count), 1);

  // Massachusetts outline — projected from real geographic coordinates.
  // Equirectangular projection (longitude scaled by cos(lat) so the shape
  // keeps its true proportions). viewBox is 1000 × 630.
  const VBW = 1000, VBH = 630;
  const COS_LAT = 0.7431;   // cos(42°)
  const LON_W = -73.6;      // left edge (deg lon, with padding)
  const LAT_N = 42.95;      // top edge (deg lat, with padding)
  const SCALE = 358.9;      // px per distance-unit → fits MA width into VBW
  const project = (lon, lat) => [
    +((lon - LON_W) * COS_LAT * SCALE).toFixed(1),
    +((LAT_N - lat) * SCALE).toFixed(1),
  ];

  // Mainland + Cape Cod, traced clockwise from the NW corner.
  // [lon, lat] pairs hitting MA's defining features:
  // NW corner → north (VT/NH) border → Salisbury → Cape Ann → Boston Harbor →
  // South Shore → Cape Cod Bay → Provincetown hook → outer Cape/Monomoy →
  // Buzzards Bay → Fall River → RI/CT south border → SW corner.
  const mainland = [
    [-73.49, 42.74], [-72.81, 42.74], [-72.46, 42.73], [-71.93, 42.71],
    [-71.50, 42.72], [-71.25, 42.74], [-71.05, 42.87], [-70.95, 42.81],
    [-70.81, 42.66], [-70.62, 42.66], [-70.66, 42.58], [-70.90, 42.49],
    [-70.92, 42.42], [-70.95, 42.34], [-70.72, 42.04], [-70.66, 41.96],
    [-70.54, 41.78], [-70.50, 41.73], [-70.30, 41.77], [-70.07, 41.80],
    [-70.04, 41.96], [-70.01, 42.05], [-70.18, 42.08], [-70.24, 42.02],
    [-70.07, 41.95], [-69.96, 41.68], [-70.00, 41.55], [-70.30, 41.62],
    [-70.50, 41.55], [-70.65, 41.60], [-70.62, 41.74], [-70.75, 41.70],
    [-70.92, 41.63], [-71.05, 41.68], [-71.20, 41.75], [-71.38, 41.78],
    [-71.38, 42.01], [-71.80, 42.02], [-72.50, 42.03], [-73.05, 42.05],
    [-73.49, 42.05],
  ];
  const marthasVineyard = [
    [-70.76, 41.41], [-70.50, 41.44], [-70.46, 41.35], [-70.62, 41.33], [-70.76, 41.36],
  ];
  const nantucket = [
    [-70.20, 41.30], [-70.00, 41.31], [-69.96, 41.25], [-70.15, 41.25],
  ];
  const toPath = (pts) =>
    pts.map((p, i) => {
      const [x, y] = project(p[0], p[1]);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ") + " Z";

  const maPath = toPath(mainland);
  const islandsPath = `${toPath(marthasVineyard)} ${toPath(nantucket)}`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", maxHeight: 520, display: "block" }}>
        {/* MA mainland + Cape Cod outline */}
        <path d={maPath}
          fill={C.surfaceAlt}
          stroke={C.borderStrong}
          strokeWidth={1.5}
          strokeLinejoin="round" />
        {/* Martha's Vineyard + Nantucket */}
        <path d={islandsPath}
          fill={C.surfaceAlt}
          stroke={C.borderStrong}
          strokeWidth={1.5}
          strokeLinejoin="round" />
        {/* Subtle compass / scale indicator */}
        <text x={20} y={VBH - 14} fontSize="11" fill={C.textMuted}
          fontFamily={FONTS.body} letterSpacing="0.1em">
          MASSACHUSETTS · {byBuilding.reduce((s, b) => s + b.count, 0)} INCIDENTS · 30 DAYS
        </text>
        {/* Heat halos (under markers) */}
        {byBuilding.map(b => {
          const [cx, cy] = project(b.lon, b.lat);
          const intensity = b.count / maxCount;
          const radius = 30 + intensity * 50;
          const color = SEVERITY[b.maxSev].color;
          return (
            <g key={b.building + "-halo"}>
              <circle cx={cx} cy={cy} r={radius * 1.4}
                fill={color} opacity={0.08} />
              <circle cx={cx} cy={cy} r={radius}
                fill={color} opacity={0.15} />
              <circle cx={cx} cy={cy} r={radius * 0.6}
                fill={color} opacity={0.25} />
            </g>
          );
        })}

        {/* Markers */}
        {byBuilding.map(b => {
          const [cx, cy] = project(b.lon, b.lat);
          const isHover = hovered && hovered.building === b.building;
          const color = SEVERITY[b.maxSev].color;
          const markerSize = 7 + (b.count / maxCount) * 8;
          return (
            <g key={b.building}
              onMouseEnter={() => setHovered(b)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={markerSize + 3}
                fill="#FFFFFF" stroke={color} strokeWidth={1.5} />
              <circle cx={cx} cy={cy} r={markerSize}
                fill={color} />
              <text x={cx} y={cy + markerSize + 16}
                fontSize="11" fill={C.text} fontWeight="600"
                textAnchor="middle" fontFamily={FONTS.body}>
                {b.city}
              </text>
              <text x={cx} y={cy + markerSize + 30}
                fontSize="10" fill={C.textMuted}
                textAnchor="middle" fontFamily={FONTS.body}
                style={{ fontVariantNumeric: "tabular-nums" }}>
                {b.count} {b.count === 1 ? "incident" : "incidents"}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: R.lg, padding: 14, boxShadow: SHADOW.menu,
          minWidth: 200, pointerEvents: "none",
        }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
            {hovered.city.toUpperCase()}
          </div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 6 }}>
            {hovered.building}
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: R.full, background: SEVERITY[hovered.maxSev].color }} />
            {hovered.count} {hovered.count === 1 ? "incident" : "incidents"} · max {SEVERITY[hovered.maxSev].label}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 6, flexWrap: "wrap" }}>
        {["critical", "high", "medium", "low"].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textSecondary }}>
            <span style={{ width: 8, height: 8, borderRadius: R.full, background: SEVERITY[s].color }} />
            {SEVERITY[s].label}
          </div>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// TERM — acronym with hover tooltip
// ============================================================
function Term({ code, children }) {
  const [open, setOpen] = useState(false);
  const t = TERMS[code];
  if (!t) return <>{children || code}</>;
  return (
    <span
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}
      style={{
        position: "relative",
        display: "inline-flex", alignItems: "center", gap: 3,
        cursor: "help",
        borderBottom: `1px dotted ${C.textMuted}`,
        whiteSpace: "nowrap",
      }}>
      {children || code}
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 13, height: 13, borderRadius: R.full,
        background: C.surfaceAlt, color: C.textMuted,
        fontSize: 9, fontWeight: 700, fontFamily: FONTS.body,
        border: `1px solid ${C.border}`,
      }}>?</span>
      {open && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          width: 280, padding: "12px 14px",
          background: "#1C1917", color: "#F5F5F4",
          borderRadius: R.md, boxShadow: SHADOW.menu,
          fontSize: 12, lineHeight: 1.5, fontWeight: 400,
          letterSpacing: 0, textAlign: "left",
          whiteSpace: "normal", zIndex: 100,
          fontFamily: FONTS.body,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: "0.04em", color: "#FCA5A5" }}>
            {code} · {t.full.toUpperCase()}
          </div>
          <div style={{ color: "#E7E5E4" }}>{t.desc}</div>
          {/* Arrow */}
          <span style={{
            position: "absolute", top: "100%", left: 16,
            width: 0, height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid #1C1917",
          }} />
        </span>
      )}
    </span>
  );
}

// ============================================================
// TREND CAUSATION — research-grounded analysis of why incidents are rising
// ============================================================
function TrendCausationPanel({ weeks, monthIncidents }) {
  const [open, setOpen] = useState(false);

  // Compute key signals from the actual data
  const recent4 = weeks.slice(-4).reduce((s, w) => s + w.count, 0);
  const prior4  = weeks.slice(0, 4).reduce((s, w) => s + w.count, 0);
  const acceleration = prior4 === 0
    ? (recent4 > 0 ? "100%+" : "0%")
    : `${Math.round(((recent4 - prior4) / Math.max(prior4, 1)) * 100)}%`;
  const specEdShare = monthIncidents.length === 0 ? 0
    : Math.round((monthIncidents.filter(i => i.role && i.role.toLowerCase().includes("special ed")).length / monthIncidents.length) * 100);
  const sameStudent = monthIncidents.filter(i => (i.tags || []).includes("same student")).length;
  const repeatLocation = (() => {
    const c = {};
    monthIncidents.forEach(i => { if (i.location) c[i.location] = (c[i.location] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return top ? { loc: top[0], n: top[1] } : null;
  })();

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
      boxShadow: SHADOW.card, marginBottom: 36, overflow: "hidden",
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", background: open ? C.surfaceAlt : C.surface, border: "none",
        padding: "18px 22px", cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
        fontFamily: FONTS.body, transition: "background 0.12s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
          <div style={{
            width: 36, height: 36, background: C.accentSoft, color: C.accent,
            borderRadius: R.md, display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <Activity size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", color: C.textMuted, fontWeight: 600, marginBottom: 3 }}>
              WHY THE TREND?
            </div>
            <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, letterSpacing: "-0.015em", color: C.text }}>
              Reports up {acceleration} in the last 4 weeks · what the research says is driving it
            </div>
          </div>
        </div>
        <ChevronDown size={18} color={C.textMuted}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: "0 22px 22px", borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, margin: "18px 0 22px" }}>
            The curve isn't random and it isn't local to your district. Five forces — well-documented in 2024–2026 research — combine to push educator-violence reports upward in late spring at locals like yours. Your own data reflects each of them.
          </p>

          {/* Factor 1 — Mental health crisis */}
          <CausationCard
            num="1"
            title="Persistent post-pandemic dysregulation"
            citation="APA Task Force on Violence Against Educators, 2024; CDC Youth Risk Behavior Survey, 2023"
            body={<>The APA's national survey found <strong style={{ color: C.text }}>80% of teachers experienced verbal or threatening aggression and 56% experienced physical violence</strong> in 2021–22, and follow-ups through 2024 show numbers have not normalized. CDC data shows 40% of high-school students still report persistent sadness or hopelessness in 2023, down only 2 points from the pandemic peak. The youth mental-health crisis didn't end in 2022; it became the new baseline.</>}
            yourData={`In your district, ${specEdShare}% of incidents this month involve Special Ed IAs — the staff working closest to the most-impacted students.`}
          />

          {/* Factor 2 — Staffing shortage */}
          <CausationCard
            num="2"
            title="Special education staffing shortage"
            citation="UFT 2024 vacancy report; NCES 2023–24; EdResearch for Action, 2024"
            body={<>21% of US public schools were not fully staffed in special education at the start of 2023–24, the worst of any specialty. NYC alone reported <strong style={{ color: C.text }}>1,558 paraprofessional vacancies</strong> in District 75 schools. Washington state lost 40% of paraprofessionals in a single year. When <Term code="IEP" />-mandated 1:1 support isn't actually staffed, students with the highest behavioral needs are managed with fewer adults — and incidents follow.</>}
            yourData={sameStudent > 0 ? `${sameStudent} incidents this month are tagged "same student" — a classic signal that staffing or BIP support isn't matching documented need.` : null}
          />

          {/* Factor 3 — Spring spiral */}
          <CausationCard
            num="3"
            title="The spring spiral"
            citation="Resilient Futures, 2026; School Principals 411, 2026; IES School Transition research"
            body={<>Educators have a name for this: the last 6–8 weeks of school produce predictable behavioral escalation. Routines disrupted by testing, longer gaps between breaks, transition anxiety, and trauma-anniversary effects all stack up. Trauma-informed research shows children with disrupted nervous-system regulation — disproportionately students in special ed — go into "survival brain" first, turning small frustrations into outbursts.</>}
            yourData="This pattern is visible across all 6 buildings in your district, but concentrates where staffing ratios are tightest."
          />

          {/* Factor 4 — Reporting infrastructure */}
          <CausationCard
            num="4"
            title="Reporting infrastructure effect — the rise may be visibility, not violence"
            citation="NCES School Survey on Crime and Safety; APA 2024 brief"
            body={<>NCES data shows verbal and threatening behavior toward teachers <strong style={{ color: C.text }}>nearly doubled from 4.8% (2009–10) to 9.8% (2019–20)</strong> — but researchers note that growth partly reflects better reporting, not just more incidents. Historically, paraprofessional injuries were the most underreported category in K–12. Sick-leave data is the only hard signal; everything else depends on infrastructure that didn't exist. <strong style={{ color: C.text }}>You're seeing it now because you built somewhere to put it.</strong></>}
            yourData="The sick-leave correlation panel on this dashboard shows the floor of what was always there. The trend line shows what visibility looks like."
          />

          {/* Factor 5 — Repeat patterns */}
          <CausationCard
            num="5"
            title="Repeat-student compounding"
            citation="Reddy et al., Behavioral Sciences 2024 — Student Violence Against Paraprofessionals"
            body={<>A 2024 study of 1,993 paraprofessionals found that 49.5% had experienced physical violence and that <strong style={{ color: C.text }}>elementary settings produced the highest rates</strong>, driven by close-proximity behavioral support work. When a <Term code="BIP" /> is stale or a <Term code="FBA" /> hasn't been redone, the same student generates repeat incidents across multiple staff over weeks. Without a tracking system, each report looks isolated to administration.</>}
            yourData={repeatLocation && repeatLocation.n >= 3 ? `${repeatLocation.loc} has produced ${repeatLocation.n} incidents this month — the kind of pattern that's invisible without a tool like this one.` : null}
          />

          {/* Bargaining frame at bottom */}
          <div style={{
            marginTop: 8, padding: "14px 16px",
            background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
            borderRadius: R.md,
          }}>
            <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
              BARGAINING IMPLICATION
            </div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>
              The trend line above is not your members getting worse at the job. It's a national crisis hitting locals where staffing ratios are thinnest and reporting infrastructure is newest. Use it that way: at the table, at the school committee, in <Term code="OSHA" /> filings. Every uptick on this chart is a documented case the district has to answer for.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CausationCard({ num, title, citation, body, yourData }) {
  return (
    <div style={{
      borderLeft: `3px solid ${C.accent}`, paddingLeft: 16, marginBottom: 22,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontFamily: FONTS.display, fontSize: 13, fontWeight: 600, color: C.accent, letterSpacing: "0.04em" }}>
          {num.padStart(2, "0")}
        </span>
        <span style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.015em" }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, fontStyle: "italic" }}>
        {citation}
      </div>
      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, margin: 0 }}>
        {body}
      </p>
      {yourData && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          background: C.surfaceAlt, borderRadius: R.sm,
          fontSize: 12, color: C.textSecondary, display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <Activity size={12} color={C.accent} style={{ marginTop: 3, flexShrink: 0 }} />
          <span><strong style={{ color: C.text }}>In your data:</strong> {yourData}</span>
        </div>
      )}
    </div>
  );
}

// Render a string, auto-wrapping known acronyms with <Term> tooltips.
// Splits on word boundaries and matches against TERMS keys.
function TermText({ text }) {
  if (!text) return null;
  // Build a regex from TERMS keys (longest first so multi-char codes match before substrings)
  const keys = Object.keys(TERMS).sort((a, b) => b.length - a.length);
  const re = new RegExp(`\\b(${keys.join("|")})\\b`, "g");
  const parts = [];
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<Term key={`t-${i++}`} code={m[1]} />);
    last = m.index + m[1].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function HipaaNotice({ text }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: C.surfaceAlt, border: `1px solid ${C.border}`,
      padding: "5px 10px", borderRadius: R.full,
      fontSize: 11, color: C.textSecondary, fontWeight: 500,
    }}>
      <ShieldCheck size={11} color={C.low} />
      <span><TermText text={text || "HIPAA + FERPA · role-based access · aggregate only"} /></span>
    </div>
  );
}

// ============================================================
// STUDENT PATTERNS — privacy-protected, union-side only
// ============================================================
function StudentPatterns({ students }) {
  if (!students || students.length === 0) {
    return <EmptyMini text="No student-involved incidents flagged this month." />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        fontSize: 11, color: C.textMuted, padding: "8px 12px",
        background: C.surfaceAlt, borderRadius: R.md,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <ShieldCheck size={13} color={C.textSecondary} />
        <span>Anonymized codes · FERPA-protected · for staff safety planning, not discipline</span>
      </div>
      {students.map(st => {
        const actions = recommendedStudentActions(st);
        const maxSev = st.severities.critical > 0 ? "critical"
                     : st.severities.high > 0 ? "high"
                     : st.severities.medium > 0 ? "medium" : "low";
        const sev = SEVERITY[maxSev];
        return (
          <div key={st.ref} style={{
            border: `1px solid ${C.border}`, borderRadius: R.lg, padding: 16,
            background: C.surface,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{
                    background: C.text, color: C.surface,
                    fontSize: 12, fontWeight: 600, padding: "4px 10px",
                    borderRadius: R.sm, letterSpacing: "0.04em",
                  }}>{st.code}</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{st.building}</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>· {st.setting}</span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>· {st.grade}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary }}>
                  Supports: <span style={{ color: C.text, fontWeight: 500 }}><TermText text={st.supports} /></span>
                  {st.lastBIP && <span> · Last <Term code="BIP" />: <span style={{ color: C.text, fontWeight: 500 }}>{st.lastBIP}</span></span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: sev.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {st.count}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3, letterSpacing: "0.05em", fontWeight: 600 }}>INCIDENTS · 30D</div>
              </div>
            </div>

            {/* Severity mini-bar */}
            <div style={{ display: "flex", gap: 4, marginTop: 12, marginBottom: 12 }}>
              {["critical", "high", "medium", "low"].map(sv => {
                const c = st.severities[sv];
                if (c === 0) return null;
                const pct = (c / st.count) * 100;
                return (
                  <div key={sv} title={`${SEVERITY[sv].label}: ${c}`}
                    style={{ flex: pct, background: SEVERITY[sv].color, height: 6, borderRadius: 2 }} />
                );
              })}
            </div>

            {/* Affected staff */}
            <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
              Affected staff: <span style={{ color: C.text, fontWeight: 500 }}>{st.reporters.join(", ")}</span>
            </div>

            {/* Recommended actions */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>RECOMMENDED CORRECTIVE ACTIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {actions.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.text }}>
                    <ArrowRight size={13} color={C.accent} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// POLICY UI — chips for assigned policies + assign-new dropdown
// ============================================================
function PolicyChips({ ids, onRemove, removable }) {
  if (!ids || ids.length === 0) {
    return (
      <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", padding: "4px 0" }}>
        No policies assigned yet.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {ids.map(id => {
        const p = POLICIES[id];
        if (!p) return null;
        return (
          <span key={id} title={p.desc} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: C.surfaceAlt, color: C.text,
            border: `1px solid ${C.border}`,
            fontSize: 12, fontWeight: 500, padding: "5px 10px 5px 12px",
            borderRadius: R.md,
          }}>
            <Gavel size={11} color={C.accent} /> {p.name}
            {removable && onRemove && (
              <button onClick={() => onRemove(id)} style={{
                background: "transparent", border: "none", color: C.textMuted,
                cursor: "pointer", padding: 0,
                width: 16, height: 16, borderRadius: R.full,
                display: "grid", placeItems: "center",
              }}>
                <X size={10} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

function PolicyAssign({ assigned, suggested, onAssign }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const available = Object.entries(POLICIES).filter(([id]) => !assigned.includes(id));
  const grouped = {};
  available.forEach(([id, p]) => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push([id, p]);
  });

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: C.surface, color: C.text, border: `1px dashed ${C.borderStrong}`,
        padding: "6px 12px", borderRadius: R.md,
        fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONTS.body,
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>
        <Plus size={12} /> Assign policy
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          width: 320, maxHeight: 400, overflowY: "auto",
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: R.lg, padding: 8, boxShadow: SHADOW.menu, zIndex: 30,
        }}>
          {suggested.filter(id => !assigned.includes(id)).length > 0 && (
            <>
              <div style={{ padding: "6px 10px 4px", fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: "0.06em" }}>
                SUGGESTED FOR THIS INCIDENT
              </div>
              {suggested.filter(id => !assigned.includes(id)).map(id => {
                const p = POLICIES[id];
                return (
                  <button key={id} onClick={() => { onAssign(id); setOpen(false); }} style={{
                    width: "100%", background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
                    padding: "8px 10px", borderRadius: R.md, cursor: "pointer",
                    display: "block", textAlign: "left", fontFamily: FONTS.body,
                    marginBottom: 4,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary }}>{p.desc}</div>
                  </button>
                );
              })}
              <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
            </>
          )}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div style={{ padding: "8px 10px 4px", fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: "0.06em" }}>
                {cat.toUpperCase()}
              </div>
              {items.map(([id, p]) => (
                <button key={id} onClick={() => { onAssign(id); setOpen(false); }} style={{
                  width: "100%", background: "transparent", border: "none",
                  padding: "6px 10px", borderRadius: R.md, cursor: "pointer",
                  display: "block", textAlign: "left", fontFamily: FONTS.body,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontSize: 13, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          ))}
          {available.length === 0 && (
            <div style={{ padding: 12, fontSize: 12, color: C.textMuted, fontStyle: "italic", textAlign: "center" }}>
              All policies already assigned.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IncidentRow({ inc, onClick, showBuilding, divider }) {
  const [hover, setHover] = useState(false);
  const meta = TYPE_META[inc.type];
  const Icon = meta.icon;
  const sc = SEVERITY[inc.severity];
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? C.surfaceHover : C.surface, border: "none",
        borderTop: divider ? `1px solid ${C.border}` : "none",
        padding: "14px 18px",
        display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
        textAlign: "left", cursor: "pointer", fontFamily: FONTS.body, width: "100%",
        transition: "background 0.1s",
      }}>
      <div style={{
        width: 36, height: 36, background: sc.bg, color: sc.color,
        borderRadius: R.md, display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        <Icon size={15} />
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: C.textMuted, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{inc.id}</span>
          <SeverityBadge severity={inc.severity} small />
          <StatusPill status={inc.status} small />
          {inc.is911 && (
            <span style={{
              background: C.critical, color: "white", fontSize: 9, padding: "2px 6px",
              letterSpacing: "0.05em", fontWeight: 700, borderRadius: R.sm,
              display: "inline-flex", alignItems: "center", gap: 3,
            }}>
              <Siren size={9} /> 911
            </span>
          )}
          {inc.needsImmediate && !inc.is911 && (
            <span style={{
              background: C.accent, color: "white", fontSize: 9, padding: "2px 6px",
              letterSpacing: "0.05em", fontWeight: 700, borderRadius: R.sm,
            }}>
              IMMEDIATE
            </span>
          )}
        </div>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {inc.description}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{inc.reporter} · {inc.role}</span>
          {showBuilding && <span>· {inc.building}</span>}
          <span>· {timeAgo(inc.t)}</span>
        </div>
      </div>
      <ChevronRight size={16} color={C.textMuted} />
    </button>
  );
}

function StatusPill({ status, small }) {
  const map = {
    new: { label: "New", bg: C.accentSoft, fg: C.accent },
    acknowledged: { label: "Acknowledged", bg: C.mediumBg, fg: C.medium },
    in_progress: { label: "In progress", bg: C.infoBg, fg: C.info },
    resolved: { label: "Resolved", bg: C.lowBg, fg: C.low },
    escalated: { label: "Escalated", bg: C.criticalBg, fg: C.critical },
  };
  const m = map[status] || map.new;
  return (
    <span style={{
      background: m.bg, color: m.fg,
      fontSize: small ? 10 : 11, padding: small ? "2px 7px" : "3px 9px",
      borderRadius: R.full, fontWeight: 600, letterSpacing: "0.01em",
    }}>
      {m.label}
    </span>
  );
}

function SeverityBadge({ severity, small }) {
  const sc = SEVERITY[severity];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: small ? 10 : 11, color: C.textSecondary, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: R.full, background: sc.color, display: "inline-block" }} />
      {sc.label}
    </span>
  );
}

function Meta({ icon, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      {icon} {children}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      background: C.surface, border: `1px dashed ${C.border}`, borderRadius: R.xl,
      padding: 36, textAlign: "center", color: C.textMuted, fontSize: 14,
      maxWidth: 520, margin: "0 auto",
    }}>
      {text}
    </div>
  );
}

function BackButton({ onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "transparent", border: "none",
        color: hover ? C.text : C.textSecondary, padding: "4px 0",
        fontSize: 13, cursor: "pointer", fontFamily: FONTS.body,
        display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16,
        fontWeight: 500, transition: "color 0.1s",
      }}>
      <ChevronLeft size={14} /> Back
    </button>
  );
}

function Toast({ title, body, onClose }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, maxWidth: 380,
      background: C.text, color: C.surface, padding: 16, zIndex: 50,
      borderRadius: R.lg, boxShadow: SHADOW.modal,
      animation: "safepointSlideUp 0.25s ease-out",
    }}>
      <style>{`@keyframes safepointSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={14} color="#34D399" /> {title}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>{body}</div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.surface, opacity: 0.5, cursor: "pointer", padding: 0 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// BUTTON STYLES
// ============================================================
// Button styles use getters so spreading (`...primaryButton`) reads the
// current theme C values rather than the light-mode snapshot at module init.
const primaryButton = {
  get background() { return C.accent; },
  color: "white", border: "none",
  padding: "9px 14px", borderRadius: R.md,
  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: FONTS.body,
  display: "inline-flex", alignItems: "center", gap: 7,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "background 0.12s",
};
const secondaryButton = {
  get background() { return C.surface; },
  get color() { return C.text; },
  get border() { return `1px solid ${C.border}`; },
  padding: "9px 14px", borderRadius: R.md,
  fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: FONTS.body,
  display: "inline-flex", alignItems: "center", gap: 7,
  transition: "background 0.12s",
};
