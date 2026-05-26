import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Pill, Heart, ClipboardList, Bell, BarChart2, Bot,
  Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, Search,
  Download, Copy, AlertTriangle, Clock, Flame, TrendingUp, Activity,
  Calendar, RefreshCw, SkipForward, Info, CheckCircle, Star,
  ArrowUp, Tag, Filter, Moon, Sun, Droplets, Zap, ThumbsUp,
  MessageSquare, Send, Loader2, Shield, Syringe, Package, Leaf,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

// ─── Google Fonts ────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString();
const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDateTime = (iso) => `${fmtDate(iso)} ${fmtTime(iso)}`;
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const addDays = (iso, n) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// ─── Constants ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "medications", label: "Medications", Icon: Pill },
  { id: "birthcontrol", label: "Birth Control", Icon: Heart },
  { id: "log", label: "Log / History", Icon: ClipboardList },
  { id: "reminders", label: "Reminders", Icon: Bell },
  { id: "analytics", label: "Analytics", Icon: BarChart2 },
  { id: "ai", label: "AI Assistant", Icon: Bot },
];

const MED_TYPES = ["oral", "injectable", "topical", "supplement", "birth control", "vitamin", "other"];
const FREQ = ["daily", "twice daily", "weekly", "bi-weekly", "monthly", "as needed", "custom"];
const DOSE_UNITS = ["mg", "ml", "IU", "mcg", "g", "tablet", "capsule", "patch", "ring", "shot", "implant", "other"];
const BC_TYPES = ["Daily Pill", "Patch", "Ring (NuvaRing)", "Shot (Depo-Provera)", "IUD", "Implant", "Emergency Contraception", "Custom/Other"];
const SYMPTOMS = ["nausea", "fatigue", "headache", "mood change", "energy boost", "bloating", "dizziness", "appetite change", "spotting", "cramping", "breast tenderness", "insomnia", "anxiety", "dry mouth"];
const BC_SYMPTOMS = ["spotting", "cramping", "breast tenderness", "bloating", "mood swings", "headache", "nausea", "libido change"];

const TYPE_COLORS = {
  oral: "#60a5fa",
  injectable: "#f87171",
  topical: "#fb923c",
  supplement: "#34d399",
  "birth control": "#f472b6",
  vitamin: "#4ade80",
  other: "#a78bfa",
};

const TYPE_LABELS = {
  oral: "Oral",
  injectable: "Injectable",
  topical: "Topical",
  supplement: "Supplement",
  "birth control": "Birth Control",
  vitamin: "Vitamin",
  other: "Other",
};

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE_MEDS = [
  {
    id: "m1",
    name: "Ozempic",
    type: "injectable",
    doseUnit: "mg",
    dosage: "0.5",
    frequency: "weekly",
    startDate: addDays(today(), -45),
    prescribedBy: "Dr. Patel",
    refillDate: addDays(today(), 5),
    notes: "Inject subcutaneously in abdomen. Rotate sites.",
    supplyCount: 4,
    supplyThreshold: 2,
    lastTaken: addDays(today(), -3),
  },
  {
    id: "m2",
    name: "Vitamin D3",
    type: "vitamin",
    doseUnit: "IU",
    dosage: "2000",
    frequency: "daily",
    startDate: addDays(today(), -90),
    prescribedBy: "",
    refillDate: addDays(today(), 20),
    notes: "Take with food for better absorption.",
    supplyCount: 60,
    supplyThreshold: 10,
    lastTaken: today(),
  },
  {
    id: "m3",
    name: "Magnesium Glycinate",
    type: "supplement",
    doseUnit: "mg",
    dosage: "400",
    frequency: "daily",
    startDate: addDays(today(), -30),
    prescribedBy: "",
    refillDate: addDays(today(), 15),
    notes: "Take before bed for sleep support.",
    supplyCount: 25,
    supplyThreshold: 7,
    lastTaken: addDays(today(), -1),
  },
];

const SAMPLE_BC = {
  id: "bc1",
  type: "Daily Pill",
  name: "Lo Loestrin Fe",
  packStartDate: addDays(today(), -10),
  currentPackDay: 11,
  activeDays: 24,
  placeboDays: 4,
  cutoffTime: "21:00",
  takenToday: false,
  partnerNote: "I take mine at 9pm daily",
  cycleLength: 28,
  lastPeriodStart: addDays(today(), -14),
  lastPeriodEnd: addDays(today(), -9),
};

const genSampleLogs = () => {
  const logs = [];
  for (let i = 6; i >= 0; i--) {
    if (i !== 2) {
      logs.push({
        id: uid(),
        medId: "m2",
        medName: "Vitamin D3",
        dose: "2000",
        doseUnit: "IU",
        date: addDays(today(), -i),
        time: "08:30",
        notes: "",
        symptoms: i === 4 ? ["fatigue"] : [],
        isBCLog: false,
        isPeriodLog: false,
      });
    }
  }
  for (let i = 30; i >= 0; i -= 7) {
    logs.push({
      id: uid(),
      medId: "m1",
      medName: "Ozempic",
      dose: i > 14 ? "0.25" : "0.5",
      doseUnit: "mg",
      date: addDays(today(), -i),
      time: "10:00",
      notes: i === 14 ? "Dose increased per Dr. Patel." : "",
      symptoms: i === 7 ? ["nausea", "fatigue"] : [],
      isBCLog: false,
      isPeriodLog: false,
    });
  }
  for (let i = 10; i >= 0; i--) {
    logs.push({
      id: uid(),
      medId: "bc1",
      medName: "Lo Loestrin Fe",
      dose: "1",
      doseUnit: "tablet",
      date: addDays(today(), -i),
      time: "21:00",
      notes: "",
      symptoms: i === 5 ? ["spotting", "mood swings"] : [],
      isBCLog: true,
      isPeriodLog: false,
    });
  }
  logs.push({
    id: uid(),
    medId: "period",
    medName: "Period",
    dose: "",
    doseUnit: "",
    date: addDays(today(), -14),
    time: "00:00",
    notes: "Period started",
    symptoms: ["cramping"],
    isBCLog: false,
    isPeriodLog: true,
  });
  return logs.sort((a, b) => new Date(b.date + "T" + b.time) - new Date(a.date + "T" + a.time));
};

const SAMPLE_REMINDERS = [
  { id: "r1", medId: "bc1", medName: "Lo Loestrin Fe", time: "21:00", frequency: "daily", note: "Take your daily pill", enabled: true, snoozeUntil: null },
  { id: "r2", medId: "m2", medName: "Vitamin D3", time: "08:00", frequency: "daily", note: "Morning vitamin", enabled: true, snoozeUntil: null },
  { id: "r3", medId: "m1", medName: "Ozempic", time: "10:00", frequency: "weekly", note: "Weekly injection", enabled: true, snoozeUntil: null },
];

// ─── Style helpers ────────────────────────────────────────────────────────────
const S = {
  card: "bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg",
  input: "w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400 transition-colors",
  btn: "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all",
  btnPrimary: "bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold",
  btnSecondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
  btnDanger: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30",
  badge: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
  label: "block text-xs text-slate-400 mb-1 font-medium",
  sectionTitle: "text-xl font-bold text-white mb-4",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || "#a78bfa";
  return (
    <span className={S.badge} style={{ background: color + "22", color, border: `1px solid ${color}44` }}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="mb-3">
      <label className={S.label}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={S.input}>
      {options.map((o) => (
        <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Medication Form ──────────────────────────────────────────────────────────
function MedForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || {
      name: "", type: "oral", doseUnit: "mg", dosage: "", frequency: "daily",
      startDate: today(), prescribedBy: "", refillDate: "", notes: "",
      supplyCount: "", supplyThreshold: "",
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div>
      <FormField label="Medication Name *">
        <input className={S.input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ozempic" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type">
          <Select value={form.type} onChange={(v) => set("type", v)} options={MED_TYPES} />
        </FormField>
        <FormField label="Frequency">
          <Select value={form.frequency} onChange={(v) => set("frequency", v)} options={FREQ} />
        </FormField>
        <FormField label="Dosage">
          <input className={S.input} value={form.dosage} onChange={(e) => set("dosage", e.target.value)} placeholder="e.g. 0.5" />
        </FormField>
        <FormField label="Unit">
          <Select value={form.doseUnit} onChange={(v) => set("doseUnit", v)} options={DOSE_UNITS} />
        </FormField>
        <FormField label="Start Date">
          <input type="date" className={S.input} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </FormField>
        <FormField label="Refill Date">
          <input type="date" className={S.input} value={form.refillDate} onChange={(e) => set("refillDate", e.target.value)} />
        </FormField>
        <FormField label="Current Supply (# doses)">
          <input className={S.input} type="number" value={form.supplyCount} onChange={(e) => set("supplyCount", e.target.value)} placeholder="e.g. 30" />
        </FormField>
        <FormField label="Low Supply Alert (≤)">
          <input className={S.input} type="number" value={form.supplyThreshold} onChange={(e) => set("supplyThreshold", e.target.value)} placeholder="e.g. 7" />
        </FormField>
      </div>
      <FormField label="Prescribed By">
        <input className={S.input} value={form.prescribedBy} onChange={(e) => set("prescribedBy", e.target.value)} placeholder="Doctor's name (optional)" />
      </FormField>
      <FormField label="Notes">
        <textarea className={S.input} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional notes..." />
      </FormField>
      <div className="flex gap-3 mt-4">
        <button className={`${S.btn} ${S.btnPrimary} flex-1`} onClick={() => { if (!form.name.trim()) return; onSave({ ...form, id: form.id || uid() }); }}>
          <Check size={16} /> Save Medication
        </button>
        <button className={`${S.btn} ${S.btnSecondary}`} onClick={onClose}><X size={16} /> Cancel</button>
      </div>
    </div>
  );
}

// ─── Log Dose Form ────────────────────────────────────────────────────────────
function LogDoseForm({ med, lastDose, onSave, onClose }) {
  const [dose, setDose] = useState(med?.dosage || "");
  const [doseUnit, setDoseUnit] = useState(med?.doseUnit || "mg");
  const [logDate, setLogDate] = useState(today());
  const [logTime, setLogTime] = useState(new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState("");
  const [selSymptoms, setSelSymptoms] = useState([]);
  const [customSym, setCustomSym] = useState("");
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");

  const isEscalation = lastDose && parseFloat(dose) > parseFloat(lastDose);

  const handleSave = () => {
    if (isEscalation && !showEscalation) { setShowEscalation(true); return; }
    const allSymptoms = [...selSymptoms, ...(customSym ? customSym.split(",").map((s) => s.trim()) : [])];
    onSave({
      id: uid(),
      medId: med.id,
      medName: med.name,
      dose,
      doseUnit,
      date: logDate,
      time: logTime,
      notes: escalationReason ? `${notes} [Dose increase reason: ${escalationReason}]`.trim() : notes,
      symptoms: allSymptoms,
      isBCLog: med.type === "birth control",
      isPeriodLog: false,
    });
  };

  const toggleSym = (s) => setSelSymptoms((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  return (
    <div>
      {showEscalation && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-amber-400 text-sm font-medium mb-2 flex items-center gap-2">
            <ArrowUp size={14} /> Dosage Increase Detected ({lastDose} → {dose} {doseUnit})
          </p>
          <FormField label="Reason for Dose Increase">
            <input className={S.input} value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)} placeholder="e.g. Doctor increased dose at last visit" />
          </FormField>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Dose">
          <input className={S.input} value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Amount" />
        </FormField>
        <FormField label="Unit">
          <Select value={doseUnit} onChange={setDoseUnit} options={DOSE_UNITS} />
        </FormField>
        <FormField label="Date">
          <input type="date" className={S.input} value={logDate} onChange={(e) => setLogDate(e.target.value)} />
        </FormField>
        <FormField label="Time">
          <input type="time" className={S.input} value={logTime} onChange={(e) => setLogTime(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Notes">
        <textarea className={S.input} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
      </FormField>
      <FormField label="Symptoms (select all that apply)">
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => (
            <button key={s} onClick={() => toggleSym(s)}
              className={`${S.badge} cursor-pointer transition-all ${selSymptoms.includes(s) ? "bg-teal-500/30 text-teal-300 border border-teal-500/50" : "bg-slate-700 text-slate-400 border border-slate-600 hover:border-teal-500/30"}`}>
              {s}
            </button>
          ))}
        </div>
        <input className={`${S.input} mt-2`} value={customSym} onChange={(e) => setCustomSym(e.target.value)} placeholder="Custom symptoms (comma-separated)" />
      </FormField>
      <div className="flex gap-3 mt-4">
        <button className={`${S.btn} ${S.btnPrimary} flex-1`} onClick={handleSave}>
          <Check size={16} /> Log Dose
        </button>
        <button className={`${S.btn} ${S.btnSecondary}`} onClick={onClose}><X size={16} /> Cancel</button>
      </div>
    </div>
  );
}

// ─── Medication Card ──────────────────────────────────────────────────────────
function MedCard({ med, logs, onEdit, onDelete, onLog }) {
  const lastLog = logs.find((l) => l.medId === med.id);
  const refillDays = med.refillDate ? daysBetween(today(), med.refillDate) : null;
  const isLowSupply = med.supplyCount && med.supplyThreshold && parseInt(med.supplyCount) <= parseInt(med.supplyThreshold);
  const takenToday = logs.some((l) => l.medId === med.id && l.date === today());

  return (
    <div className={`${S.card} hover:border-slate-600 transition-all relative overflow-hidden`}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: TYPE_COLORS[med.type] || "#a78bfa" }} />
      <div className="pl-2">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>{med.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge type={med.type} />
              {takenToday && <span className={`${S.badge} bg-teal-500/20 text-teal-400 border border-teal-500/30`}><Check size={10} /> Taken Today</span>}
              {isLowSupply && <span className={`${S.badge} bg-red-500/20 text-red-400 border border-red-500/30`}><AlertTriangle size={10} /> Low Supply</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="text-slate-400 hover:text-teal-400 transition-colors"><Edit2 size={15} /></button>
            <button onClick={onDelete} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-slate-400 text-xs">Dose</span>
            <p className="text-white font-medium">{med.dosage} {med.doseUnit}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Frequency</span>
            <p className="text-white font-medium capitalize">{med.frequency}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Last Taken</span>
            <p className="text-white font-medium">{lastLog ? fmtDate(lastLog.date) : (med.lastTaken ? fmtDate(med.lastTaken) : "Never")}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Supply</span>
            <p className={`font-medium ${isLowSupply ? "text-red-400" : "text-white"}`}>
              {med.supplyCount ? `${med.supplyCount} doses` : "—"}
            </p>
          </div>
        </div>
        {refillDays !== null && (
          <div className={`flex items-center gap-2 text-xs mb-3 px-2 py-1.5 rounded-lg ${refillDays <= 7 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-700 text-slate-400"}`}>
            <RefreshCw size={12} />
            Refill {refillDays >= 0 ? `in ${refillDays} day${refillDays !== 1 ? "s" : ""}` : `${Math.abs(refillDays)} days overdue`}
          </div>
        )}
        <button onClick={onLog} className={`${S.btn} ${S.btnPrimary} w-full justify-center`}>
          <Plus size={14} /> Log a Dose
        </button>
      </div>
    </div>
  );
}

// ─── BC Pack Grid ─────────────────────────────────────────────────────────────
function PackGrid({ bc, logs }) {
  const totalDays = (bc.activeDays || 24) + (bc.placeboDays || 4);
  const packStartDate = bc.packStartDate;
  const bcLogs = logs.filter((l) => l.medId === bc.id && l.isBCLog);
  const takenDays = new Set(bcLogs.map((l) => l.date));

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
      {Array.from({ length: totalDays }, (_, i) => {
        const dayNum = i + 1;
        const dateForDay = addDays(packStartDate, i);
        const isActive = dayNum <= (bc.activeDays || 24);
        const isTaken = takenDays.has(dateForDay);
        const isPast = dateForDay < today();
        const isToday = dateForDay === today();
        const isMissed = isPast && isActive && !isTaken && !isToday;

        let bg = "bg-slate-700 border-slate-600";
        let text = "text-slate-400";
        if (!isActive) { bg = "bg-slate-700/50 border-slate-700"; text = "text-slate-600"; }
        if (isTaken) { bg = "bg-teal-500/30 border-teal-500/50"; text = "text-teal-300"; }
        if (isMissed) { bg = "bg-red-500/20 border-red-500/30"; text = "text-red-400"; }
        if (isToday) { bg = "bg-teal-400/20 border-teal-400 ring-1 ring-teal-400/50"; text = "text-teal-300"; }

        return (
          <div key={i} title={`Day ${dayNum} — ${dateForDay}`}
            className={`aspect-square flex items-center justify-center rounded-lg border text-xs font-medium transition-all ${bg} ${text}`}>
            {isTaken ? <Check size={10} /> : <span>{dayNum}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ meds, bc, logs, reminders, onNav }) {
  const todayStr = today();
  const todayLogs = logs.filter((l) => l.date === todayStr && !l.isPeriodLog);
  const bcTakenToday = logs.some((l) => l.medId === bc?.id && l.date === todayStr && l.isBCLog);

  const last30 = Array.from({ length: 30 }, (_, i) => addDays(todayStr, -29 + i));
  const scheduledDailyMeds = meds.filter((m) => m.frequency === "daily" || m.frequency === "twice daily");
  const totalScheduled = last30.length * scheduledDailyMeds.length;
  const totalTaken = last30.reduce((acc, d) => acc + scheduledDailyMeds.filter((m) => logs.some((l) => l.medId === m.id && l.date === d)).length, 0);
  const adherence = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

  const streak = (() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = addDays(todayStr, -i);
      const allDailyLogged = scheduledDailyMeds.every((m) => logs.some((l) => l.medId === m.id && l.date === d));
      if (allDailyLogged) count++;
      else if (i > 0) break;
    }
    return count;
  })();

  const missedToday = scheduledDailyMeds.filter((m) => !logs.some((l) => l.medId === m.id && l.date === todayStr));
  const recentActivity = logs.filter((l) => !l.isPeriodLog).slice(0, 5);

  const nextReminder = reminders
    .filter((r) => r.enabled)
    .map((r) => ({ ...r, minutesUntil: (() => {
      const [h, m] = r.time.split(":").map(Number);
      const now2 = new Date();
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target < now2) target.setDate(target.getDate() + 1);
      return Math.round((target - now2) / 60000);
    })() }))
    .sort((a, b) => a.minutesUntil - b.minutesUntil)[0];

  const bcDaysIntoPack = bc ? daysBetween(bc.packStartDate, todayStr) + 1 : null;

  const periodLogs = logs.filter((l) => l.isPeriodLog).sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastPeriod = periodLogs[0];
  const cycleDayNum = lastPeriod ? daysBetween(lastPeriod.date, todayStr) + 1 : null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>Dashboard</h2>

      {streak >= 7 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-teal-500/30 rounded-2xl flex items-center gap-3">
          <Flame size={24} className="text-teal-400" />
          <div>
            <p className="text-teal-300 font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
              {streak}-day streak — you're consistent!
            </p>
            <p className="text-slate-400 text-sm">
              {streak >= 90 ? "90-day milestone! Outstanding! 🏆" : streak >= 30 ? "30-day milestone! Amazing! ⭐" : "Keep it going!"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Medications Tracked", value: meds.length, Icon: Pill, color: "teal" },
          { label: "Doses Logged Today", value: todayLogs.length, Icon: Check, color: "green" },
          { label: "Adherence (30d)", value: `${adherence}%`, Icon: TrendingUp, color: "cyan" },
          { label: "Current Streak", value: `${streak} days`, Icon: Flame, color: "orange" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className={S.card}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg bg-${color === "teal" ? "teal" : color === "green" ? "green" : color === "cyan" ? "cyan" : "orange"}-500/20`}>
                <Icon size={16} className={`text-${color === "teal" ? "teal" : color === "green" ? "green" : color === "cyan" ? "cyan" : "orange"}-400`} />
              </div>
              <span className="text-slate-400 text-xs">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {bc && (
          <div className={S.card}>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={18} className="text-pink-400" />
              <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Birth Control Status</h3>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-slate-400 text-xs">Method</p>
                <p className="text-white font-medium">{bc.name} ({bc.type})</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Pack Day</p>
                <p className="text-white font-bold text-lg">{bcDaysIntoPack}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${bcTakenToday ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {bcTakenToday ? <><CheckCircle size={14} /> Today's pill taken</> : <><AlertTriangle size={14} /> Today's pill not yet logged</>}
            </div>
            {cycleDayNum && <p className="text-slate-400 text-xs mt-2">Cycle day ~{cycleDayNum} (estimate only)</p>}
          </div>
        )}

        {nextReminder && (
          <div className={S.card}>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={18} className="text-teal-400" />
              <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Next Reminder</h3>
            </div>
            <p className="text-white font-medium">{nextReminder.medName}</p>
            <p className="text-slate-400 text-sm">{nextReminder.time} — {nextReminder.note}</p>
            <p className="text-teal-400 text-sm mt-1">
              <Clock size={12} className="inline mr-1" />
              {nextReminder.minutesUntil < 60
                ? `${nextReminder.minutesUntil} minutes away`
                : `${Math.round(nextReminder.minutesUntil / 60)} hours away`}
            </p>
          </div>
        )}
      </div>

      {missedToday.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="font-bold text-red-400" style={{ fontFamily: "'Syne', sans-serif" }}>Not yet logged today</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {missedToday.map((m) => (
              <span key={m.id} className={`${S.badge} bg-red-500/20 text-red-300 border border-red-500/30`}>
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={S.card}>
        <h3 className="font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm">No logs yet. Start logging your medications!</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <div>
                    <p className="text-white text-sm font-medium">{l.medName}</p>
                    <p className="text-slate-400 text-xs">{l.dose} {l.doseUnit}</p>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">{fmtDate(l.date)} {l.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MEDICATIONS TAB ──────────────────────────────────────────────────────────
function Medications({ meds, setMeds, logs, setLogs }) {
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [logMed, setLogMed] = useState(null);

  const handleSave = (med) => {
    setMeds((prev) => {
      const idx = prev.findIndex((m) => m.id === med.id);
      return idx >= 0 ? prev.map((m) => (m.id === med.id ? med : m)) : [...prev, med];
    });
    setShowForm(false);
    setEditMed(null);
  };

  const lastDoseFor = (medId) => {
    const l = logs.filter((x) => x.medId === medId).sort((a, b) => new Date(b.date + "T" + b.time) - new Date(a.date + "T" + a.time))[0];
    return l?.dose;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Medications</h2>
        <button className={`${S.btn} ${S.btnPrimary}`} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Medication
        </button>
      </div>

      {meds.length === 0 ? (
        <div className={`${S.card} text-center py-12`}>
          <Pill size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No medications added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {meds.map((med) => (
            <MedCard
              key={med.id}
              med={med}
              logs={logs}
              onEdit={() => { setEditMed(med); setShowForm(true); }}
              onDelete={() => setMeds((p) => p.filter((m) => m.id !== med.id))}
              onLog={() => setLogMed(med)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editMed ? "Edit Medication" : "Add Medication"} onClose={() => { setShowForm(false); setEditMed(null); }} wide>
          <MedForm initial={editMed} onSave={handleSave} onClose={() => { setShowForm(false); setEditMed(null); }} />
        </Modal>
      )}

      {logMed && (
        <Modal title={`Log Dose — ${logMed.name}`} onClose={() => setLogMed(null)}>
          <LogDoseForm
            med={logMed}
            lastDose={lastDoseFor(logMed.id)}
            onSave={(entry) => { setLogs((p) => [entry, ...p]); setLogMed(null); }}
            onClose={() => setLogMed(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── BIRTH CONTROL TAB ────────────────────────────────────────────────────────
function BirthControl({ bc, setBc, logs, setLogs }) {
  const [showForm, setShowForm] = useState(!bc);
  const [showSymptomLog, setShowSymptomLog] = useState(false);
  const [showPeriodLog, setShowPeriodLog] = useState(false);
  const [selSymptoms, setSelSymptoms] = useState([]);
  const [periodStart, setPeriodStart] = useState(today());
  const [periodEnd, setPeriodEnd] = useState(today());
  const [showCelebration, setShowCelebration] = useState(false);
  const [form, setForm] = useState(bc || {
    id: uid(), type: "Daily Pill", name: "", packStartDate: today(), currentPackDay: 1,
    activeDays: 24, placeboDays: 4, cutoffTime: "21:00", takenToday: false, partnerNote: "",
    cycleLength: 28, lastPeriodStart: "", lastPeriodEnd: "",
  });

  const todayStr = today();
  const bcTakenToday = bc && logs.some((l) => l.medId === bc.id && l.date === todayStr && l.isBCLog);
  const bcLogs = bc ? logs.filter((l) => l.medId === bc.id && l.isBCLog) : [];
  const totalDays = bc ? (bc.activeDays || 24) + (bc.placeboDays || 4) : 28;
  const packDay = bc ? (daysBetween(bc.packStartDate, todayStr) + 1) : null;
  const daysLeftInPack = bc ? totalDays - (packDay || 0) : null;
  const missedCount = (() => {
    if (!bc) return 0;
    let c = 0;
    for (let i = 1; i <= Math.min(packDay || 0, bc.activeDays || 24); i++) {
      const d = addDays(bc.packStartDate, i - 1);
      if (d <= todayStr && !bcLogs.some((l) => l.date === d)) c++;
    }
    return c;
  })();

  const handleTakeToday = () => {
    const entry = {
      id: uid(), medId: bc.id, medName: bc.name, dose: "1", doseUnit: "tablet",
      date: todayStr, time: new Date().toTimeString().slice(0, 5),
      notes: "", symptoms: [], isBCLog: true, isPeriodLog: false,
    };
    setLogs((p) => [entry, ...p]);
    if (packDay >= totalDays) setShowCelebration(true);
  };

  const handleSaveBC = () => {
    setBc({ ...form, id: form.id || uid() });
    setShowForm(false);
  };

  const logSymptoms = () => {
    if (selSymptoms.length === 0) return;
    const entry = {
      id: uid(), medId: bc?.id || "bc", medName: bc?.name || "Birth Control",
      dose: "", doseUnit: "", date: todayStr, time: new Date().toTimeString().slice(0, 5),
      notes: "BC symptoms logged", symptoms: selSymptoms, isBCLog: true, isPeriodLog: false,
    };
    setLogs((p) => [entry, ...p]);
    setSelSymptoms([]);
    setShowSymptomLog(false);
  };

  const logPeriod = () => {
    const entry = {
      id: uid(), medId: "period", medName: "Period",
      dose: "", doseUnit: "", date: periodStart, time: "00:00",
      notes: `Period: ${periodStart} – ${periodEnd}`,
      symptoms: ["cramping"], isBCLog: false, isPeriodLog: true,
    };
    setLogs((p) => [entry, ...p]);
    setBc((prev) => prev ? { ...prev, lastPeriodStart: periodStart, lastPeriodEnd: periodEnd } : prev);
    setShowPeriodLog(false);
  };

  const copyPartnerNote = () => {
    const text = `I take ${bc?.name} (${bc?.type}) at ${bc?.cutoffTime} daily. ${bc?.partnerNote || ""}`.trim();
    navigator.clipboard?.writeText(text);
  };

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (showForm) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>Birth Control Setup</h2>
        <div className={S.card}>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="BC Type">
              <Select value={form.type} onChange={(v) => setF("type", v)} options={BC_TYPES} />
            </FormField>
            <FormField label="Brand / Name">
              <input className={S.input} value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Lo Loestrin Fe" />
            </FormField>
          </div>
          {form.type === "Daily Pill" && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Pack Start Date">
                <input type="date" className={S.input} value={form.packStartDate} onChange={(e) => setF("packStartDate", e.target.value)} />
              </FormField>
              <FormField label="Daily Cutoff Time">
                <input type="time" className={S.input} value={form.cutoffTime} onChange={(e) => setF("cutoffTime", e.target.value)} />
              </FormField>
              <FormField label="Active Pills">
                <input type="number" className={S.input} value={form.activeDays} onChange={(e) => setF("activeDays", parseInt(e.target.value))} />
              </FormField>
              <FormField label="Placebo Pills">
                <input type="number" className={S.input} value={form.placeboDays} onChange={(e) => setF("placeboDays", parseInt(e.target.value))} />
              </FormField>
            </div>
          )}
          {form.type === "Shot (Depo-Provera)" && (
            <FormField label="Last Injection Date">
              <input type="date" className={S.input} value={form.packStartDate} onChange={(e) => setF("packStartDate", e.target.value)} />
            </FormField>
          )}
          {(form.type === "IUD" || form.type === "Implant") && (
            <FormField label="Insertion Date">
              <input type="date" className={S.input} value={form.packStartDate} onChange={(e) => setF("packStartDate", e.target.value)} />
            </FormField>
          )}
          {form.type === "Patch" && (
            <FormField label="First Patch Applied">
              <input type="date" className={S.input} value={form.packStartDate} onChange={(e) => setF("packStartDate", e.target.value)} />
            </FormField>
          )}
          {form.type === "Ring (NuvaRing)" && (
            <FormField label="Insertion Date">
              <input type="date" className={S.input} value={form.packStartDate} onChange={(e) => setF("packStartDate", e.target.value)} />
            </FormField>
          )}
          <FormField label="Partner Share Note (optional)">
            <input className={S.input} value={form.partnerNote} onChange={(e) => setF("partnerNote", e.target.value)} placeholder="e.g. I take mine at 9pm daily" />
          </FormField>
          <div className="flex gap-3 mt-4">
            <button className={`${S.btn} ${S.btnPrimary} flex-1`} onClick={handleSaveBC}><Check size={16} /> Save</button>
            {bc && <button className={`${S.btn} ${S.btnSecondary}`} onClick={() => setShowForm(false)}><X size={16} /> Cancel</button>}
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-3 flex items-center gap-1">
          <Info size={12} /> Birth control information is for tracking purposes only. Always consult your healthcare provider for medical decisions.
        </p>
      </div>
    );
  }

  if (!bc) return (
    <div className={`${S.card} text-center py-12`}>
      <Heart size={40} className="text-slate-600 mx-auto mb-3" />
      <p className="text-slate-500 mb-4">No birth control set up yet.</p>
      <button className={`${S.btn} ${S.btnPrimary}`} onClick={() => setShowForm(true)}><Plus size={16} /> Set Up Birth Control</button>
    </div>
  );

  const depoNextDue = bc.type === "Shot (Depo-Provera)" ? addDays(bc.packStartDate, 91) : null;
  const iudExpiry = bc.type === "IUD" ? addDays(bc.packStartDate, 365 * 5) : null;
  const implantExpiry = bc.type === "Implant" ? addDays(bc.packStartDate, 365 * 3) : null;
  const patchChangeDate = bc.type === "Patch" ? addDays(bc.packStartDate, 7) : null;
  const ringRemovalDate = bc.type === "Ring (NuvaRing)" ? addDays(bc.packStartDate, 21) : null;

  return (
    <div>
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${S.card} text-center max-w-sm w-full mx-4`}>
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Pack Complete!</h3>
            <p className="text-slate-400 mb-4">Congratulations on completing your full pack! Remember to start your next pack as directed by your healthcare provider.</p>
            <button className={`${S.btn} ${S.btnPrimary} w-full justify-center`} onClick={() => setShowCelebration(false)}><Check size={16} /> Start New Pack</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Birth Control</h2>
        <button className={`${S.btn} ${S.btnSecondary}`} onClick={() => setShowForm(true)}><Edit2 size={14} /> Edit</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className={`${S.card} col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{bc.name}</h3>
              <span className={`${S.badge} bg-pink-500/20 text-pink-400 border border-pink-500/30`}>{bc.type}</span>
            </div>
            {bc.type === "Daily Pill" && (
              <div className="text-right">
                <p className="text-slate-400 text-xs">Pack Day</p>
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{Math.min(packDay, totalDays)}</p>
                <p className="text-slate-400 text-xs">of {totalDays}</p>
              </div>
            )}
          </div>

          {bc.type === "Daily Pill" && (
            <>
              <PackGrid bc={bc} logs={logs} />
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500/30 inline-block border border-teal-500/50" /> Taken</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20 inline-block border border-red-500/30" /> Missed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-700 inline-block border border-slate-600" /> Placebo</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-700 inline-block border border-teal-400 ring-1 ring-teal-400/50" /> Today</span>
              </div>
            </>
          )}

          {bc.type === "Shot (Depo-Provera)" && depoNextDue && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">Last injection: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400 text-sm">Next shot due: <span className={`font-bold ${daysBetween(todayStr, depoNextDue) <= 7 ? "text-red-400" : "text-teal-400"}`}>{fmtDate(depoNextDue)}</span></p>
              <div className={`px-3 py-2 rounded-xl text-sm ${daysBetween(todayStr, depoNextDue) <= 14 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"}`}>
                {daysBetween(todayStr, depoNextDue)} days until next injection
              </div>
            </div>
          )}

          {bc.type === "IUD" && iudExpiry && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">Inserted: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400 text-sm">Expires: <span className="text-white">{fmtDate(iudExpiry)}</span></p>
              <p className="text-teal-400 text-sm">{daysBetween(todayStr, iudExpiry)} days until replacement</p>
            </div>
          )}

          {bc.type === "Implant" && implantExpiry && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">Inserted: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400 text-sm">Expires: <span className="text-white">{fmtDate(implantExpiry)}</span></p>
              <p className="text-teal-400 text-sm">{daysBetween(todayStr, implantExpiry)} days until replacement</p>
            </div>
          )}

          {bc.type === "Patch" && patchChangeDate && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">Patch applied: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400 text-sm">Change on: <span className={`font-bold ${daysBetween(todayStr, patchChangeDate) <= 1 ? "text-red-400" : "text-teal-400"}`}>{fmtDate(patchChangeDate)}</span></p>
              <p className="text-teal-400 text-sm">{Math.max(0, daysBetween(todayStr, patchChangeDate))} days until patch change</p>
            </div>
          )}

          {bc.type === "Ring (NuvaRing)" && ringRemovalDate && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">Inserted: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400 text-sm">Remove on: <span className={`font-bold ${daysBetween(todayStr, ringRemovalDate) <= 2 ? "text-red-400" : "text-teal-400"}`}>{fmtDate(ringRemovalDate)}</span></p>
              <p className="text-teal-400 text-sm">{Math.max(0, daysBetween(todayStr, ringRemovalDate))} days until removal</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {bc.type === "Daily Pill" && (
            <div className={S.card}>
              <button
                onClick={handleTakeToday}
                disabled={bcTakenToday}
                className={`${S.btn} w-full justify-center text-base py-3 ${bcTakenToday ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 cursor-default" : S.btnPrimary}`}
              >
                {bcTakenToday ? <><CheckCircle size={18} /> Taken Today</> : <><Heart size={18} /> Take Today's Pill</>}
              </button>
              {!bcTakenToday && (
                <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> Cutoff: {bc.cutoffTime}
                </p>
              )}
            </div>
          )}

          {missedCount > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 font-medium text-sm flex items-center gap-1 mb-1">
                <AlertTriangle size={14} /> {missedCount} Missed Pill{missedCount > 1 ? "s" : ""}
              </p>
              <p className="text-slate-400 text-xs">
                {missedCount === 1
                  ? "Take your pill as soon as possible and take the next pill at the usual time."
                  : "You've missed 2+ pills. Use backup contraception and consult your healthcare provider."}
              </p>
              <p className="text-slate-500 text-xs mt-2 italic">This is not medical advice — consult your healthcare provider.</p>
            </div>
          )}

          {daysLeftInPack !== null && daysLeftInPack <= 7 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 text-sm font-medium flex items-center gap-1">
                <RefreshCw size={12} /> {daysLeftInPack} days left in pack
              </p>
              <p className="text-slate-400 text-xs mt-1">Time to refill your prescription!</p>
            </div>
          )}

          <div className={S.card}>
            <h4 className="text-white font-medium mb-2 text-sm">Cycle Awareness</h4>
            <p className="text-slate-500 text-xs italic mb-2">Estimate only — not a fertility tool</p>
            {bc.lastPeriodStart ? (
              <div className="text-sm space-y-1">
                <p className="text-slate-400">Last period: <span className="text-white">{fmtDate(bc.lastPeriodStart)}</span></p>
                <p className="text-slate-400">Cycle day: <span className="text-teal-400 font-bold">~{daysBetween(bc.lastPeriodStart, todayStr) + 1}</span></p>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">Log your period to track cycle days.</p>
            )}
            <button className={`${S.btn} ${S.btnSecondary} w-full justify-center mt-3 text-xs`} onClick={() => setShowPeriodLog(true)}>
              <Droplets size={12} /> Log Period
            </button>
          </div>

          <button className={`${S.btn} ${S.btnSecondary} w-full justify-center`} onClick={() => setShowSymptomLog(true)}>
            <Tag size={14} /> Log BC Symptoms
          </button>

          {bc.partnerNote && (
            <div className={S.card}>
              <p className="text-slate-400 text-xs mb-2">Partner Share Note</p>
              <p className="text-white text-sm">{bc.partnerNote}</p>
              <button className={`${S.btn} ${S.btnSecondary} mt-2 text-xs`} onClick={copyPartnerNote}>
                <Copy size={12} /> Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-slate-500 text-xs flex items-center gap-1">
        <Shield size={12} /> All birth control information is for personal tracking only and does not constitute medical advice. Always consult your healthcare provider.
      </p>

      {showSymptomLog && (
        <Modal title="Log BC Symptoms" onClose={() => setShowSymptomLog(false)}>
          <div className="flex flex-wrap gap-2 mb-4">
            {BC_SYMPTOMS.map((s) => (
              <button key={s} onClick={() => setSelSymptoms((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}
                className={`${S.badge} cursor-pointer text-sm py-1.5 px-3 ${selSymptoms.includes(s) ? "bg-pink-500/30 text-pink-300 border border-pink-500/50" : "bg-slate-700 text-slate-400 border border-slate-600 hover:border-pink-500/30"}`}>
                {s}
              </button>
            ))}
          </div>
          <button className={`${S.btn} ${S.btnPrimary} w-full justify-center`} onClick={logSymptoms}>
            <Check size={16} /> Save Symptoms
          </button>
        </Modal>
      )}

      {showPeriodLog && (
        <Modal title="Log Period" onClose={() => setShowPeriodLog(false)}>
          <FormField label="Period Start Date">
            <input type="date" className={S.input} value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </FormField>
          <FormField label="Period End Date">
            <input type="date" className={S.input} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </FormField>
          <button className={`${S.btn} ${S.btnPrimary} w-full justify-center mt-3`} onClick={logPeriod}>
            <Check size={16} /> Save Period Log
          </button>
        </Modal>
      )}
    </div>
  );
}

// ─── LOG / HISTORY TAB ────────────────────────────────────────────────────────
function LogHistory({ logs, setLogs, meds }) {
  const [filterMed, setFilterMed] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSym, setFilterSym] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editLog, setEditLog] = useState(null);

  const filtered = logs.filter((l) => {
    if (filterMed && !l.medName.toLowerCase().includes(filterMed.toLowerCase())) return false;
    if (filterType === "bc" && !l.isBCLog) return false;
    if (filterType === "general" && l.isBCLog) return false;
    if (filterType === "period" && !l.isPeriodLog) return false;
    if (filterSym && !l.symptoms.some((s) => s.toLowerCase().includes(filterSym.toLowerCase()))) return false;
    if (startDate && l.date < startDate) return false;
    if (endDate && l.date > endDate) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ["Date", "Time", "Medication", "Dose", "Unit", "Symptoms", "Notes", "Type"];
    const rows = filtered.map((l) => [l.date, l.time, l.medName, l.dose, l.doseUnit, l.symptoms.join(";"), l.notes, l.isBCLog ? "Birth Control" : l.isPeriodLog ? "Period" : "General"]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "medication_log.csv";
    a.click();
  };

  const symCounts = {};
  logs.forEach((l) => l.symptoms.forEach((s) => { symCounts[s] = (symCounts[s] || 0) + 1; }));
  const topSyms = Object.entries(symCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Log / History</h2>
        <button className={`${S.btn} ${S.btnSecondary}`} onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>

      {topSyms.length > 0 && (
        <div className={`${S.card} mb-4`}>
          <h3 className="text-white font-medium mb-2 text-sm flex items-center gap-2"><Tag size={14} className="text-teal-400" /> Symptom Tag Cloud</h3>
          <div className="flex flex-wrap gap-2">
            {topSyms.map(([sym, count]) => (
              <span key={sym} onClick={() => setFilterSym(sym === filterSym ? "" : sym)}
                className={`${S.badge} cursor-pointer text-sm py-1 px-3 ${filterSym === sym ? "bg-teal-500/30 text-teal-300 border border-teal-500/50" : "bg-slate-700 text-slate-400 border border-slate-600 hover:border-teal-500/30"}`}
                style={{ fontSize: `${Math.min(1, 0.7 + count * 0.1)}rem` }}>
                {sym} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={`${S.card} mb-4`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={S.label}>Search Medication</label>
            <input className={S.input} value={filterMed} onChange={(e) => setFilterMed(e.target.value)} placeholder="Name..." />
          </div>
          <div>
            <label className={S.label}>Type</label>
            <Select value={filterType} onChange={setFilterType} options={[{ value: "all", label: "All" }, { value: "general", label: "General" }, { value: "bc", label: "Birth Control" }, { value: "period", label: "Period" }]} />
          </div>
          <div>
            <label className={S.label}>Start Date</label>
            <input type="date" className={S.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={S.label}>End Date</label>
            <input type="date" className={S.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className={`${S.card} text-center py-8`}>
            <p className="text-slate-500">No log entries match your filters.</p>
          </div>
        ) : (
          filtered.map((l) => (
            <div key={l.id} className={`${S.card} ${l.isPeriodLog ? "border-pink-500/30 bg-pink-500/5" : ""} transition-all hover:border-slate-600`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-sm ${l.isPeriodLog ? "text-pink-400" : l.isBCLog ? "text-pink-300" : "text-white"}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                      {l.isPeriodLog ? "🩸 " : ""}{l.medName}
                    </span>
                    {l.isBCLog && !l.isPeriodLog && <span className={`${S.badge} bg-pink-500/20 text-pink-400 border border-pink-500/30`}>BC</span>}
                    {l.dose && <span className="text-slate-300 text-sm">{l.dose} {l.doseUnit}</span>}
                  </div>
                  <p className="text-slate-400 text-xs mb-1">{fmtDate(l.date)} at {l.time}</p>
                  {l.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {l.symptoms.map((s) => (
                        <span key={s} className={`${S.badge} bg-slate-700 text-slate-300 border border-slate-600`}>{s}</span>
                      ))}
                    </div>
                  )}
                  {l.notes && <p className="text-slate-400 text-xs">{l.notes}</p>}
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => setEditLog(l)} className="text-slate-400 hover:text-teal-400 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => setLogs((p) => p.filter((x) => x.id !== l.id))} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editLog && (
        <Modal title="Edit Log Entry" onClose={() => setEditLog(null)}>
          <FormField label="Date">
            <input type="date" className={S.input} value={editLog.date} onChange={(e) => setEditLog({ ...editLog, date: e.target.value })} />
          </FormField>
          <FormField label="Time">
            <input type="time" className={S.input} value={editLog.time} onChange={(e) => setEditLog({ ...editLog, time: e.target.value })} />
          </FormField>
          <FormField label="Dose">
            <input className={S.input} value={editLog.dose} onChange={(e) => setEditLog({ ...editLog, dose: e.target.value })} />
          </FormField>
          <FormField label="Notes">
            <textarea className={S.input} rows={2} value={editLog.notes} onChange={(e) => setEditLog({ ...editLog, notes: e.target.value })} />
          </FormField>
          <div className="flex gap-3 mt-4">
            <button className={`${S.btn} ${S.btnPrimary} flex-1`} onClick={() => { setLogs((p) => p.map((l) => l.id === editLog.id ? editLog : l)); setEditLog(null); }}>
              <Check size={16} /> Save Changes
            </button>
            <button className={`${S.btn} ${S.btnSecondary}`} onClick={() => setEditLog(null)}><X size={16} /> Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── REMINDERS TAB ────────────────────────────────────────────────────────────
function Reminders({ reminders, setReminders, meds, bc, logs, setLogs, dueReminders }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medId: "", medName: "", time: "08:00", frequency: "daily", note: "" });

  const allMeds = [...meds, ...(bc ? [{ id: bc.id, name: bc.name }] : [])];
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.medName.trim()) return;
    setReminders((p) => [...p, { ...form, id: uid(), enabled: true, snoozeUntil: null }]);
    setShowForm(false);
    setForm({ medId: "", medName: "", time: "08:00", frequency: "daily", note: "" });
  };

  const snooze = (id, mins) => {
    const until = new Date(Date.now() + mins * 60000).toISOString();
    setReminders((p) => p.map((r) => r.id === id ? { ...r, snoozeUntil: until } : r));
  };

  const quickLog = (r) => {
    const med = meds.find((m) => m.id === r.medId) || (bc?.id === r.medId ? bc : null);
    const entry = {
      id: uid(), medId: r.medId, medName: r.medName,
      dose: med?.dosage || "1", doseUnit: med?.doseUnit || "dose",
      date: today(), time: new Date().toTimeString().slice(0, 5),
      notes: "Logged from reminder", symptoms: [],
      isBCLog: bc?.id === r.medId, isPeriodLog: false,
    };
    setLogs((p) => [entry, ...p]);
  };

  const now2 = new Date();
  const getCountdown = (r) => {
    const [h, m] = r.time.split(":").map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target < now2) target.setDate(target.getDate() + 1);
    const mins = Math.round((target - now2) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Reminders</h2>
        <button className={`${S.btn} ${S.btnPrimary}`} onClick={() => setShowForm(true)}><Plus size={16} /> Add Reminder</button>
      </div>

      {dueReminders.length > 0 && dueReminders.map((r) => (
        <div key={r.id} className="mb-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-teal-400 animate-pulse" />
            <div>
              <p className="text-teal-300 font-bold">{r.medName} — {r.note}</p>
              <p className="text-slate-400 text-xs">Reminder due now!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className={`${S.btn} ${S.btnPrimary} text-xs py-1.5`} onClick={() => quickLog(r)}><Zap size={12} /> Log Now</button>
            <button className={`${S.btn} ${S.btnSecondary} text-xs py-1.5`} onClick={() => snooze(r.id, 15)}>15m</button>
            <button className={`${S.btn} ${S.btnSecondary} text-xs py-1.5`} onClick={() => snooze(r.id, 30)}>30m</button>
            <button className={`${S.btn} ${S.btnSecondary} text-xs py-1.5`} onClick={() => snooze(r.id, 60)}>1h</button>
          </div>
        </div>
      ))}

      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className={`${S.card} text-center py-8`}>
            <Bell size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No reminders set up yet.</p>
          </div>
        ) : (
          reminders.map((r) => (
            <div key={r.id} className={`${S.card} ${!r.enabled ? "opacity-50" : ""} transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setReminders((p) => p.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}
                    className={`w-10 h-6 rounded-full transition-all relative ${r.enabled ? "bg-teal-500" : "bg-slate-600"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${r.enabled ? "left-5" : "left-1"}`} />
                  </button>
                  <div>
                    <p className="text-white font-medium">{r.medName}</p>
                    <p className="text-slate-400 text-xs">{r.time} · {r.frequency} · {r.note}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.enabled && (
                    <span className="text-teal-400 text-xs flex items-center gap-1">
                      <Clock size={12} /> {getCountdown(r)}
                    </span>
                  )}
                  <button onClick={() => setReminders((p) => p.filter((x) => x.id !== r.id))} className="text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <Modal title="Add Reminder" onClose={() => setShowForm(false)}>
          <FormField label="Medication">
            <Select
              value={form.medId}
              onChange={(v) => {
                const m = allMeds.find((x) => x.id === v);
                setF("medId", v);
                setF("medName", m?.name || "");
              }}
              options={[{ value: "", label: "Select medication..." }, ...allMeds.map((m) => ({ value: m.id, label: m.name }))]}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Time">
              <input type="time" className={S.input} value={form.time} onChange={(e) => setF("time", e.target.value)} />
            </FormField>
            <FormField label="Frequency">
              <Select value={form.frequency} onChange={(v) => setF("frequency", v)} options={["daily", "weekly", "once"]} />
            </FormField>
          </div>
          <FormField label="Note">
            <input className={S.input} value={form.note} onChange={(e) => setF("note", e.target.value)} placeholder="Reminder note..." />
          </FormField>
          <div className="flex gap-3 mt-4">
            <button className={`${S.btn} ${S.btnPrimary} flex-1`} onClick={handleSave}><Check size={16} /> Add Reminder</button>
            <button className={`${S.btn} ${S.btnSecondary}`} onClick={() => setShowForm(false)}><X size={16} /> Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ANALYTICS TAB ───────────────────────────────────────────────────────────
function Analytics({ meds, logs, bc }) {
  const [range, setRange] = useState(7);
  const [selMed, setSelMed] = useState("all");

  const todayStr = today();
  const days = Array.from({ length: range }, (_, i) => addDays(todayStr, -(range - 1) + i));

  const doseData = days.map((d) => {
    const obj = { date: d.slice(5) };
    meds.forEach((m) => {
      obj[m.name] = logs.filter((l) => l.medId === m.id && l.date === d).length;
    });
    return obj;
  });

  const symCounts = {};
  const bcSymCounts = {};
  logs.forEach((l) => {
    l.symptoms.forEach((s) => {
      if (l.isBCLog) bcSymCounts[s] = (bcSymCounts[s] || 0) + 1;
      else symCounts[s] = (symCounts[s] || 0) + 1;
    });
  });
  const symData = Object.entries(symCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count, type: "general" }));
  const bcSymData = Object.entries(bcSymCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count, type: "BC" }));

  const dosageProgressData = (() => {
    const med = selMed === "all" ? meds[0] : meds.find((m) => m.id === selMed);
    if (!med) return [];
    return logs
      .filter((l) => l.medId === med.id && l.dose)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((l) => ({ date: l.date.slice(5), dose: parseFloat(l.dose) || 0 }));
  })();

  const heatmapData = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(todayStr, -29 + i);
    const count = logs.filter((l) => l.date === d && !l.isPeriodLog).length;
    return { date: d, count };
  });

  const allMeds = [...meds, ...(bc ? [{ id: bc.id, name: bc.name }] : [])];
  const medColors = ["#2dd4bf", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#34d399"];

  const bcLogs30 = bc ? logs.filter((l) => l.medId === bc.id && l.isBCLog && l.date >= addDays(todayStr, -30)) : [];
  const bcAdherence = bc ? Math.round((bcLogs30.length / 30) * 100) : 0;

  let bcStreak = 0;
  if (bc) {
    for (let i = 0; i < 60; i++) {
      const d = addDays(todayStr, -i);
      if (logs.some((l) => l.medId === bc.id && l.isBCLog && l.date === d)) bcStreak++;
      else if (i > 0) break;
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>Analytics</h2>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-slate-400 text-sm">Range:</span>
        {[7, 30].map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`${S.btn} ${range === r ? S.btnPrimary : S.btnSecondary} py-1.5 text-sm`}>
            {r} days
          </button>
        ))}
      </div>

      <div className={`${S.card} mb-6`}>
        <h3 className="font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Dose Frequency (last {range} days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={doseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
            <Legend />
            {meds.map((m, i) => (
              <Bar key={m.id} dataKey={m.name} fill={medColors[i % medColors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={S.card}>
          <h3 className="font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>General Symptoms</h3>
          {symData.length === 0 ? <p className="text-slate-500 text-sm">No symptoms logged yet.</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={symData} layout="vertical">
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={S.card}>
          <h3 className="font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>BC Symptoms</h3>
          {bcSymData.length === 0 ? <p className="text-slate-500 text-sm">No BC symptoms logged yet.</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bcSymData} layout="vertical">
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#f472b6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={`${S.card} mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Dosage Progression</h3>
          <Select
            value={selMed}
            onChange={setSelMed}
            options={[{ value: "all", label: allMeds[0]?.name || "All" }, ...meds.map((m) => ({ value: m.id, label: m.name }))]}
          />
        </div>
        {dosageProgressData.length < 2 ? <p className="text-slate-500 text-sm">Not enough data to show dosage progression.</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dosageProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
              <Line type="monotone" dataKey="dose" stroke="#2dd4bf" strokeWidth={2} dot={{ fill: "#2dd4bf", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={`${S.card} mb-6`}>
        <h3 className="font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Adherence Heatmap (last 30 days)</h3>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
          {heatmapData.map(({ date, count }) => (
            <div key={date} title={`${fmtDate(date)}: ${count} doses`}
              className="aspect-square rounded-md transition-all"
              style={{ background: count === 0 ? "#1e293b" : count === 1 ? "#0d9488" : count >= 2 ? "#2dd4bf" : "#0d9488", border: "1px solid #334155" }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#1e293b", border: "1px solid #334155" }} /> None</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#0d9488" }} /> 1 dose</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: "#2dd4bf" }} /> 2+ doses</span>
        </div>
      </div>

      {bc && (
        <div className={`${S.card} mb-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} className="text-pink-400" />
            <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Birth Control Adherence</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-400" style={{ fontFamily: "'Syne', sans-serif" }}>{bcAdherence}%</p>
              <p className="text-slate-400 text-xs">30-day consistency</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-400" style={{ fontFamily: "'Syne', sans-serif" }}>{bcStreak}</p>
              <p className="text-slate-400 text-xs">Current streak (days)</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {meds.map((m, i) => {
          const mLogs = logs.filter((l) => l.medId === m.id && l.dose);
          const doses = mLogs.map((l) => parseFloat(l.dose)).filter(Boolean);
          const avgDose = doses.length > 0 ? (doses.reduce((a, b) => a + b, 0) / doses.length).toFixed(1) : "—";
          const allSyms = {};
          mLogs.forEach((l) => l.symptoms.forEach((s) => { allSyms[s] = (allSyms[s] || 0) + 1; }));
          const topSym = Object.entries(allSyms).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
          const daysSince = daysBetween(m.startDate, todayStr);

          return (
            <div key={m.id} className={S.card}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: medColors[i % medColors.length] }} />
                <h4 className="font-bold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{m.name}</h4>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-slate-400">Avg dose: <span className="text-white">{avgDose} {m.doseUnit}</span></p>
                <p className="text-slate-400">Total logged: <span className="text-white">{mLogs.length}</span></p>
                <p className="text-slate-400">Top symptom: <span className="text-white">{topSym}</span></p>
                <p className="text-slate-400">Days tracked: <span className="text-white">{daysSince}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI ASSISTANT TAB ─────────────────────────────────────────────────────────
const STARTERS = [
  "Did I take my pill today?",
  "What happens if I miss a pill?",
  "When is my next shot due?",
  "What symptoms have I logged most?",
  "Am I on track this week?",
  "When does my patch need to change?",
];

function AIAssistant({ meds, bc, logs, reminders, apiKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildSystemPrompt = () => {
    const data = {
      medications: meds.map((m) => ({
        name: m.name, type: m.type, dosage: `${m.dosage} ${m.doseUnit}`,
        frequency: m.frequency, startDate: m.startDate, refillDate: m.refillDate,
      })),
      birthControl: bc ? {
        name: bc.name, type: bc.type, packStartDate: bc.packStartDate,
        currentPackDay: daysBetween(bc.packStartDate, today()) + 1,
        takenToday: logs.some((l) => l.medId === bc.id && l.date === today() && l.isBCLog),
      } : null,
      recentLogs: logs.slice(0, 20).map((l) => ({
        medication: l.medName, dose: `${l.dose} ${l.doseUnit}`, date: l.date,
        time: l.time, symptoms: l.symptoms, notes: l.notes,
      })),
      reminders: reminders.filter((r) => r.enabled).map((r) => ({ medication: r.medName, time: r.time, frequency: r.frequency })),
      todayDate: today(),
    };
    return `You are a knowledgeable, non-judgmental medication and health assistant. The user tracks medications, supplements, and birth control using this app. Answer questions about dosing schedules, missed doses, symptoms, BC methods, adherence patterns, and general health questions related to their tracked data. For birth control questions, provide helpful general information but always recommend consulting a healthcare provider for medical decisions. Never provide emergency medical advice — direct to a doctor or 911 for urgent issues. User's current data: ${JSON.stringify(data, null, 2)}`;
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput("");
    setError("");
    setMessages((p) => [...p, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey || "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-calls": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "No response received.";
      setMessages((p) => [...p, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message || "Failed to connect to AI. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyMsg = (text) => navigator.clipboard?.writeText(text);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>AI Assistant</h2>
      <p className="text-slate-400 text-xs mb-4 flex items-center gap-1">
        <Shield size={12} /> AI responses are informational only and not medical advice. Always consult a healthcare provider for medical decisions.
      </p>

      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-slate-400 text-sm mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className={`${S.btn} ${S.btnSecondary} text-xs py-1.5`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0 max-h-96">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 relative group ${m.role === "user" ? "bg-teal-500/20 text-teal-100 border border-teal-500/30" : "bg-slate-700 text-slate-100 border border-slate-600"}`}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && (
                <button onClick={() => copyMsg(m.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white">
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3">
              <Loader2 size={16} className="text-teal-400 animate-spin" />
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-auto">
        <input
          className={`${S.input} flex-1`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about your medications, symptoms, or schedule..."
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className={`${S.btn} ${S.btnPrimary} px-4 ${(loading || !input.trim()) ? "opacity-50 cursor-not-allowed" : ""}`}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── QUICK LOG MODAL ──────────────────────────────────────────────────────────
function QuickLog({ meds, bc, setLogs, onClose }) {
  const [selMedId, setSelMedId] = useState(meds[0]?.id || "");
  const allMeds = [...meds, ...(bc ? [{ ...bc, doseUnit: "tablet", dosage: "1" }] : [])];
  const selMed = allMeds.find((m) => m.id === selMedId);

  const handleLog = () => {
    if (!selMed) return;
    const entry = {
      id: uid(), medId: selMed.id, medName: selMed.name,
      dose: selMed.dosage || "1", doseUnit: selMed.doseUnit || "dose",
      date: today(), time: new Date().toTimeString().slice(0, 5),
      notes: "Quick log", symptoms: [],
      isBCLog: bc?.id === selMed.id, isPeriodLog: false,
    };
    setLogs((p) => [entry, ...p]);
    onClose();
  };

  return (
    <Modal title="Quick Log Dose" onClose={onClose}>
      <FormField label="Medication">
        <Select value={selMedId} onChange={setSelMedId} options={allMeds.map((m) => ({ value: m.id, label: m.name }))} />
      </FormField>
      {selMed && (
        <p className="text-slate-400 text-sm mb-4">Will log: <span className="text-white">{selMed.dosage} {selMed.doseUnit}</span> at current time</p>
      )}
      <div className="flex gap-3">
        <button className={`${S.btn} ${S.btnPrimary} flex-1`} onClick={handleLog}><Zap size={16} /> Quick Log</button>
        <button className={`${S.btn} ${S.btnSecondary}`} onClick={onClose}><X size={16} /> Cancel</button>
      </div>
    </Modal>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [meds, setMeds] = useState(SAMPLE_MEDS);
  const [bc, setBc] = useState(SAMPLE_BC);
  const [logs, setLogs] = useState(genSampleLogs);
  const [reminders, setReminders] = useState(SAMPLE_REMINDERS);
  const [search, setSearch] = useState("");
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [dueReminders, setDueReminders] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Reminder polling
  useEffect(() => {
    const check = () => {
      const n = new Date();
      const nowMins = n.getHours() * 60 + n.getMinutes();
      const due = reminders.filter((r) => {
        if (!r.enabled) return false;
        if (r.snoozeUntil && new Date(r.snoozeUntil) > n) return false;
        const [h, m] = r.time.split(":").map(Number);
        const remMins = h * 60 + m;
        return Math.abs(nowMins - remMins) <= 1;
      });
      setDueReminders(due);
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  // Global search filter
  const searchResults = search
    ? [
        ...meds.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
        ...logs.filter((l) => l.medName.toLowerCase().includes(search.toLowerCase())).slice(0, 5),
      ]
    : [];

  const tabProps = {
    meds, setMeds, bc, setBc: (v) => setBc(typeof v === "function" ? v(bc) : v),
    logs, setLogs, reminders, setReminders, dueReminders, onNav: setActiveTab,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center">
              <Pill size={16} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>MedTrack</h1>
              <p className="text-slate-400 text-xs">Medication Tracker</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === id ? "bg-teal-500/20 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
            >
              <Icon size={18} />
              {label}
              {id === "reminders" && dueReminders.length > 0 && (
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button
            className={`${S.btn} ${S.btnSecondary} w-full justify-center text-xs`}
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            <Bot size={12} /> {apiKey ? "API Key Set ✓" : "Set API Key"}
          </button>
          {showApiKeyInput && (
            <div className="mt-2">
              <input
                type="password"
                className={`${S.input} text-xs`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
              />
              <p className="text-slate-500 text-xs mt-1">Required for AI Assistant tab.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-md border-b border-slate-700 px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <LayoutDashboard size={20} />
          </button>
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-teal-400 max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medications, logs..."
            />
            {search && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {searchResults.map((item, i) => (
                  <button key={i} className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                    onClick={() => { setSearch(""); setActiveTab("medications"); }}>
                    <p className="text-white text-sm">{item.name || item.medName}</p>
                    <p className="text-slate-400 text-xs">{item.type || item.date}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {dueReminders.length > 0 && (
            <button onClick={() => setActiveTab("reminders")} className="relative text-slate-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">{dueReminders.length}</span>
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {activeTab === "dashboard" && <Dashboard {...tabProps} />}
          {activeTab === "medications" && <Medications {...tabProps} />}
          {activeTab === "birthcontrol" && <BirthControl {...tabProps} />}
          {activeTab === "log" && <LogHistory {...tabProps} />}
          {activeTab === "reminders" && <Reminders {...tabProps} />}
          {activeTab === "analytics" && <Analytics meds={meds} logs={logs} bc={bc} />}
          {activeTab === "ai" && <AIAssistant meds={meds} bc={bc} logs={logs} reminders={reminders} apiKey={apiKey} />}
        </main>
      </div>

      {/* Floating quick log button */}
      <button
        onClick={() => setShowQuickLog(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        title="Quick log a dose"
      >
        <Plus size={24} />
      </button>

      {showQuickLog && (
        <QuickLog meds={meds} bc={bc} setLogs={setLogs} onClose={() => setShowQuickLog(false)} />
      )}

      {/* Reminder banner at top */}
      {dueReminders.length > 0 && activeTab !== "reminders" && (
        <div className="fixed top-16 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
          <div className="bg-teal-500/95 text-slate-900 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto max-w-md">
            <Bell size={16} className="animate-bounce" />
            <span className="text-sm font-semibold">{dueReminders[0].medName} reminder due now!</span>
            <button onClick={() => setActiveTab("reminders")} className="text-xs underline font-bold">View</button>
          </div>
        </div>
      )}
    </div>
  );
}
