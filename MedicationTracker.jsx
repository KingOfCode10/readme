import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, Pill, Heart, ClipboardList, Bell, BarChart2, Bot,
  Plus, Trash2, Edit2, Check, X, Search, Download, Copy,
  AlertTriangle, Clock, Flame, TrendingUp, Activity, RefreshCw,
  Info, CheckCircle, ArrowUp, Tag, Filter, Droplets, Zap,
  Send, Loader2, Shield, ChevronRight, Sparkles, Menu,
  Calendar, Star, Package, SkipForward,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ─── Google Fonts ─────────────────────────────────────────────────────────── */
const _link = document.createElement("link");
_link.rel = "stylesheet";
_link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap";
document.head.appendChild(_link);

/* ─── Utilities ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmtDate = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtDateShort = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
const fmtTime12 = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${ap}`; };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",     Icon: LayoutDashboard },
  { id: "medications",  label: "Medications",   Icon: Pill },
  { id: "birthcontrol", label: "Birth Control", Icon: Heart },
  { id: "log",          label: "Log / History", Icon: ClipboardList },
  { id: "reminders",    label: "Reminders",     Icon: Bell },
  { id: "analytics",    label: "Analytics",     Icon: BarChart2 },
  { id: "ai",           label: "AI Assistant",  Icon: Bot },
];

const MED_TYPES   = ["oral","injectable","topical","supplement","vitamin","birth control","other"];
const FREQUENCIES = ["daily","twice daily","weekly","bi-weekly","monthly","as needed","custom"];
const DOSE_UNITS  = ["mg","ml","IU","mcg","g","tablet","capsule","patch","ring","injection","implant","other"];
const BC_TYPES    = ["Daily Pill","Patch","Ring (NuvaRing)","Shot (Depo-Provera)","IUD","Implant","Emergency Contraception","Custom / Other"];
const ALL_SYMPTOMS = ["nausea","fatigue","headache","mood change","energy boost","bloating","dizziness","appetite change","insomnia","anxiety","dry mouth","hot flashes"];
const BC_SYMPTOMS  = ["spotting","cramping","breast tenderness","bloating","mood swings","headache","nausea","libido change","acne","weight change"];

const TYPE_META = {
  oral:            { color: "#60a5fa", label: "Oral" },
  injectable:      { color: "#f87171", label: "Injectable" },
  topical:         { color: "#fb923c", label: "Topical" },
  supplement:      { color: "#34d399", label: "Supplement" },
  vitamin:         { color: "#4ade80", label: "Vitamin" },
  "birth control": { color: "#f472b6", label: "Birth Control" },
  other:           { color: "#a78bfa", label: "Other" },
};

const CHART_COLORS = ["#2dd4bf","#60a5fa","#f472b6","#fb923c","#a78bfa","#34d399","#fbbf24","#f87171"];

/* ─── Sample Data ───────────────────────────────────────────────────────────── */
const TODAY = todayISO();

const INIT_MEDS = [
  { id:"m1", name:"Ozempic",             type:"injectable",  doseUnit:"mg",     dosage:"0.5",  frequency:"weekly",    startDate:addDays(TODAY,-56), prescribedBy:"Dr. Patel",  refillDate:addDays(TODAY,5),  notes:"Inject subcutaneously; rotate sites.", supplyCount:"4",  supplyThreshold:"2", lastTaken:addDays(TODAY,-7) },
  { id:"m2", name:"Vitamin D3",          type:"vitamin",     doseUnit:"IU",     dosage:"2000", frequency:"daily",     startDate:addDays(TODAY,-90), prescribedBy:"",           refillDate:addDays(TODAY,22), notes:"Take with food.",                      supplyCount:"60", supplyThreshold:"10", lastTaken:TODAY },
  { id:"m3", name:"Magnesium Glycinate", type:"supplement",  doseUnit:"mg",     dosage:"400",  frequency:"daily",     startDate:addDays(TODAY,-45), prescribedBy:"",           refillDate:addDays(TODAY,18), notes:"Before bed for sleep.",                supplyCount:"28", supplyThreshold:"7",  lastTaken:addDays(TODAY,-1) },
];

const INIT_BC = {
  id:"bc1", type:"Daily Pill", name:"Lo Loestrin Fe",
  packStartDate: addDays(TODAY,-12), activeDays:24, placeboDays:4,
  cutoffTime:"21:00", partnerNote:"I take mine at 9 PM daily.",
  lastPeriodStart:addDays(TODAY,-16), lastPeriodEnd:addDays(TODAY,-11), cycleLength:28,
};

function buildSampleLogs() {
  const rows = [];
  // Vitamin D3 — daily last 30d (skip 2 random days)
  const skip = new Set([5,18]);
  for (let i=29; i>=0; i--) {
    if (!skip.has(i)) rows.push({ id:uid(), medId:"m2", medName:"Vitamin D3", dose:"2000", doseUnit:"IU", date:addDays(TODAY,-i), time:"08:15", notes:"", symptoms:i===10?["fatigue"]:[], isBCLog:false, isPeriodLog:false });
  }
  // Ozempic weekly last 8 weeks
  for (let w=8; w>=0; w--) {
    rows.push({ id:uid(), medId:"m1", medName:"Ozempic", dose:w>4?"0.25":"0.5", doseUnit:"mg", date:addDays(TODAY,-w*7), time:"10:00", notes:w===4?"Dose increased per Dr. Patel.":"", symptoms:w===3?["nausea","fatigue"]:[], isBCLog:false, isPeriodLog:false });
  }
  // BC pill last 13d (skip day 8)
  for (let i=12; i>=0; i--) {
    if (i!==8) rows.push({ id:uid(), medId:"bc1", medName:"Lo Loestrin Fe", dose:"1", doseUnit:"tablet", date:addDays(TODAY,-i), time:"21:00", notes:"", symptoms:i===5?["spotting","mood swings"]:[], isBCLog:true, isPeriodLog:false });
  }
  // Period log
  rows.push({ id:uid(), medId:"period", medName:"Period", dose:"", doseUnit:"", date:addDays(TODAY,-16), time:"00:00", notes:"Period started", symptoms:["cramping"], isBCLog:false, isPeriodLog:true });
  return rows.sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
}

const INIT_LOGS = buildSampleLogs();

const INIT_REMINDERS = [
  { id:"r1", medId:"bc1", medName:"Lo Loestrin Fe", time:"21:00", frequency:"daily",  note:"Take your daily pill",  enabled:true, snoozeUntil:null },
  { id:"r2", medId:"m2",  medName:"Vitamin D3",     time:"08:00", frequency:"daily",  note:"Morning vitamin",       enabled:true, snoozeUntil:null },
  { id:"r3", medId:"m1",  medName:"Ozempic",        time:"10:00", frequency:"weekly", note:"Weekly injection",      enabled:true, snoozeUntil:null },
];

/* ─── Style Tokens ──────────────────────────────────────────────────────────── */
const S = {
  card:        "bg-slate-800 border border-slate-700/60 rounded-2xl p-5 shadow-lg",
  cardHover:   "bg-slate-800 border border-slate-700/60 rounded-2xl p-5 shadow-lg hover:border-slate-600 transition-all duration-200",
  input:       "w-full bg-slate-700/70 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors",
  btn:         "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 select-none",
  primary:     "bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-900 font-semibold shadow-sm",
  secondary:   "bg-slate-700 hover:bg-slate-600 active:bg-slate-700 text-white border border-slate-600",
  danger:      "bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30",
  badge:       "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
  label:       "block text-xs font-medium text-slate-400 mb-1",
  heading:     "text-2xl font-bold text-white mb-6",
  subheading:  "text-base font-bold text-white mb-3",
};

/* ─── Tiny Primitives ───────────────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.other;
  return (
    <span className={S.badge} style={{ background: m.color+"22", color: m.color, border:`1px solid ${m.color}44` }}>
      {m.label}
    </span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? "bg-teal-500" : "bg-slate-600"}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? "left-5" : "left-1"}`} />
    </button>
  );
}

function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[92vh] flex flex-col`} style={{ fontFamily:"'DM Sans', sans-serif" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-base font-bold text-white" style={{ fontFamily:"'Syne', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"><X size={18}/></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="mb-3"><label className={S.label}>{label}</label>{children}</div>;
}

function Sel({ value, onChange, opts }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={S.input}>
      {opts.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

function SymPicker({ selected, onChange, pool }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {pool.map((s) => {
        const on = selected.includes(s);
        return (
          <button key={s} onClick={() => onChange(on ? selected.filter(x=>x!==s) : [...selected, s])}
            className={`${S.badge} cursor-pointer py-1 px-2.5 transition-all ${on ? "bg-teal-500/25 text-teal-300 border border-teal-400/40" : "bg-slate-700 text-slate-400 border border-slate-600 hover:border-teal-500/30 hover:text-slate-300"}`}>
            {s}
          </button>
        );
      })}
    </div>
  );
}

function InfoNote({ children }) {
  return (
    <p className="text-xs text-slate-500 flex items-start gap-1.5 leading-relaxed">
      <Info size={12} className="flex-shrink-0 mt-0.5 text-slate-600"/> {children}
    </p>
  );
}

function StatCard({ label, value, sub, Icon, color = "teal" }) {
  const colors = { teal:"teal", green:"green", cyan:"cyan", pink:"pink", orange:"orange", purple:"purple" };
  const c = colors[color] || "teal";
  return (
    <div className={S.card}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg bg-${c}-500/15`}>
          <Icon size={15} className={`text-${c}-400`}/>
        </div>
        <span className="text-slate-400 text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white leading-none" style={{ fontFamily:"'Syne', sans-serif" }}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Medication Form ───────────────────────────────────────────────────────── */
function MedForm({ initial, onSave, onClose }) {
  const blank = { name:"", type:"oral", doseUnit:"mg", dosage:"", frequency:"daily", startDate:TODAY, prescribedBy:"", refillDate:"", notes:"", supplyCount:"", supplyThreshold:"" };
  const [f, setF] = useState(initial ? { ...blank, ...initial } : blank);
  const set = (k) => (v) => setF(p => ({ ...p, [k]: v }));
  const setE = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <div>
      <Field label="Medication Name *">
        <input className={S.input} value={f.name} onChange={setE("name")} placeholder="e.g. Ozempic, Vitamin D3…"/>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type"><Sel value={f.type} onChange={set("type")} opts={MED_TYPES}/></Field>
        <Field label="Frequency"><Sel value={f.frequency} onChange={set("frequency")} opts={FREQUENCIES}/></Field>
        <Field label="Dosage"><input className={S.input} value={f.dosage} onChange={setE("dosage")} placeholder="0.5"/></Field>
        <Field label="Unit"><Sel value={f.doseUnit} onChange={set("doseUnit")} opts={DOSE_UNITS}/></Field>
        <Field label="Start Date"><input type="date" className={S.input} value={f.startDate} onChange={setE("startDate")}/></Field>
        <Field label="Refill Date"><input type="date" className={S.input} value={f.refillDate} onChange={setE("refillDate")}/></Field>
        <Field label="Supply Count"><input type="number" className={S.input} value={f.supplyCount} onChange={setE("supplyCount")} placeholder="30"/></Field>
        <Field label="Low Supply Alert (≤)"><input type="number" className={S.input} value={f.supplyThreshold} onChange={setE("supplyThreshold")} placeholder="7"/></Field>
      </div>
      <Field label="Prescribed By">
        <input className={S.input} value={f.prescribedBy} onChange={setE("prescribedBy")} placeholder="Doctor / provider (optional)"/>
      </Field>
      <Field label="Notes">
        <textarea className={S.input} rows={2} value={f.notes} onChange={setE("notes")} placeholder="Instructions, reminders…"/>
      </Field>
      <div className="flex gap-2 mt-4">
        <button className={`${S.btn} ${S.primary} flex-1 justify-center`} onClick={() => { if (!f.name.trim()) return; onSave({ ...f, id: f.id || uid() }); }}>
          <Check size={15}/> Save
        </button>
        <button className={`${S.btn} ${S.secondary}`} onClick={onClose}><X size={15}/> Cancel</button>
      </div>
    </div>
  );
}

/* ─── Log Dose Form ─────────────────────────────────────────────────────────── */
function LogDoseForm({ med, lastDose, onSave, onClose }) {
  const [dose, setDose]     = useState(med?.dosage || "");
  const [unit, setUnit]     = useState(med?.doseUnit || "mg");
  const [date, setDate]     = useState(TODAY);
  const [time, setTime]     = useState(nowTime());
  const [notes, setNotes]   = useState("");
  const [syms, setSyms]     = useState([]);
  const [custom, setCustom] = useState("");
  const [step, setStep]     = useState("form"); // "form" | "escalation"
  const [reason, setReason] = useState("");

  const isEscalation = lastDose && parseFloat(dose) > parseFloat(lastDose);

  const commit = () => {
    const allSyms = [...syms, ...custom.split(",").map(s=>s.trim()).filter(Boolean)];
    onSave({
      id:uid(), medId:med.id, medName:med.name, dose, doseUnit:unit, date, time,
      notes: reason ? `${notes} [Escalation reason: ${reason}]`.trim() : notes,
      symptoms:allSyms, isBCLog:med.type==="birth control", isPeriodLog:false,
    });
  };

  const handleNext = () => {
    if (isEscalation && step === "form") { setStep("escalation"); return; }
    commit();
  };

  return (
    <div>
      {step === "escalation" && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <p className="text-amber-400 text-sm font-semibold flex items-center gap-2 mb-2">
            <ArrowUp size={14}/> Dosage increase detected — {lastDose} → {dose} {unit}
          </p>
          <Field label="Reason for increase">
            <input className={S.input} value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Doctor increased dose at last visit"/>
          </Field>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dose"><input className={S.input} value={dose} onChange={e=>setDose(e.target.value)}/></Field>
        <Field label="Unit"><Sel value={unit} onChange={setUnit} opts={DOSE_UNITS}/></Field>
        <Field label="Date"><input type="date" className={S.input} value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label="Time"><input type="time" className={S.input} value={time} onChange={e=>setTime(e.target.value)}/></Field>
      </div>
      <Field label="Notes">
        <textarea className={S.input} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional notes…"/>
      </Field>
      <Field label="Symptoms">
        <SymPicker selected={syms} onChange={setSyms} pool={ALL_SYMPTOMS}/>
        <input className={`${S.input} mt-2`} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Custom (comma-separated)"/>
      </Field>
      <div className="flex gap-2 mt-4">
        <button className={`${S.btn} ${S.primary} flex-1 justify-center`} onClick={handleNext}>
          {isEscalation && step==="form" ? <><ArrowUp size={14}/> Next</> : <><Check size={14}/> Log Dose</>}
        </button>
        <button className={`${S.btn} ${S.secondary}`} onClick={onClose}><X size={14}/></button>
      </div>
    </div>
  );
}

/* ─── Med Card ──────────────────────────────────────────────────────────────── */
function MedCard({ med, logs, onEdit, onDelete, onLog }) {
  const lastLog  = logs.find(l => l.medId === med.id);
  const refillIn = med.refillDate ? daysBetween(TODAY, med.refillDate) : null;
  const lowStock = med.supplyCount && med.supplyThreshold && +med.supplyCount <= +med.supplyThreshold;
  const takenToday = logs.some(l => l.medId === med.id && l.date === TODAY);
  const typeColor = (TYPE_META[med.type] || TYPE_META.other).color;

  return (
    <div className={`${S.cardHover} relative overflow-hidden`}>
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" style={{ background: typeColor }}/>
      <div className="pl-3">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-sm leading-tight truncate" style={{ fontFamily:"'Syne', sans-serif" }}>{med.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <TypeBadge type={med.type}/>
              {takenToday && <span className={`${S.badge} bg-teal-500/20 text-teal-400 border border-teal-500/30`}><Check size={9}/> Today</span>}
              {lowStock    && <span className={`${S.badge} bg-red-500/20  text-red-400  border border-red-500/30`} ><AlertTriangle size={9}/> Low</span>}
            </div>
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <button onClick={onEdit}   className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-slate-700 transition-colors"><Edit2 size={14}/></button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400  hover:bg-slate-700 transition-colors"><Trash2 size={14}/></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
          <div><span className="text-slate-500">Dose </span><span className="text-white font-medium">{med.dosage} {med.doseUnit}</span></div>
          <div><span className="text-slate-500">Freq </span><span className="text-white font-medium capitalize">{med.frequency}</span></div>
          <div><span className="text-slate-500">Last </span><span className="text-white font-medium">{lastLog ? fmtDateShort(lastLog.date) : (med.lastTaken ? fmtDateShort(med.lastTaken) : "Never")}</span></div>
          <div><span className="text-slate-500">Stock </span><span className={`font-medium ${lowStock ? "text-red-400" : "text-white"}`}>{med.supplyCount ? `${med.supplyCount} doses` : "—"}</span></div>
        </div>

        {refillIn !== null && (
          <div className={`flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded-lg mb-3 ${refillIn <= 7 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-700/50 text-slate-400"}`}>
            <RefreshCw size={11}/>
            {refillIn >= 0 ? `Refill in ${refillIn}d` : `Refill overdue by ${Math.abs(refillIn)}d`}
          </div>
        )}

        {med.prescribedBy && <p className="text-slate-500 text-xs mb-3">Rx: {med.prescribedBy}</p>}

        <button className={`${S.btn} ${S.primary} w-full justify-center py-1.5`} onClick={onLog}>
          <Plus size={14}/> Log a Dose
        </button>
      </div>
    </div>
  );
}

/* ─── Pack Grid ─────────────────────────────────────────────────────────────── */
function PackGrid({ bc, logs }) {
  const total = (bc.activeDays||24) + (bc.placeboDays||4);
  const taken = new Set(logs.filter(l=>l.medId===bc.id&&l.isBCLog).map(l=>l.date));
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns:"repeat(7, 1fr)" }}>
      {Array.from({ length:total }, (_,i) => {
        const day   = i+1;
        const date  = addDays(bc.packStartDate, i);
        const active= day <= (bc.activeDays||24);
        const isTkn = taken.has(date);
        const isPast= date < TODAY;
        const isNow = date === TODAY;
        const missed= isPast && active && !isTkn && !isNow;

        let cls = "bg-slate-700/60 border-slate-600/60 text-slate-500";
        if (!active) cls = "bg-slate-800/80 border-slate-700/40 text-slate-700";
        if (isTkn)   cls = "bg-teal-500/30  border-teal-400/50   text-teal-300";
        if (missed)  cls = "bg-red-500/20   border-red-400/40    text-red-400";
        if (isNow)   cls = "bg-teal-400/20  border-teal-400      text-teal-200 ring-1 ring-teal-400/60";

        return (
          <div key={i} title={`Day ${day} – ${fmtDateShort(date)}`}
            className={`aspect-square flex items-center justify-center rounded-lg border text-xs font-semibold transition-all ${cls}`}>
            {isTkn ? <Check size={10}/> : <span>{day}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ─── DASHBOARD ─────────────────────────────────────────────────────────────── */
function Dashboard({ meds, bc, logs, reminders }) {
  const t = TODAY;
  const todayLogs = logs.filter(l=>l.date===t && !l.isPeriodLog);
  const bcTakenToday = bc && logs.some(l=>l.medId===bc.id&&l.date===t&&l.isBCLog);

  // 30-day adherence
  const dailyMeds = meds.filter(m=>m.frequency==="daily"||m.frequency==="twice daily");
  const days30 = Array.from({length:30},(_,i)=>addDays(t,-29+i));
  const scheduled = days30.length * dailyMeds.length;
  const taken30   = days30.reduce((a,d)=>a+dailyMeds.filter(m=>logs.some(l=>l.medId===m.id&&l.date===d)).length, 0);
  const adherence = scheduled > 0 ? Math.round(taken30/scheduled*100) : 0;

  // Streak
  const streak = useMemo(()=>{
    let n=0;
    for(let i=0;i<365;i++){
      const d=addDays(t,-i);
      const ok=dailyMeds.every(m=>logs.some(l=>l.medId===m.id&&l.date===d));
      if(ok) n++; else if(i>0) break;
    }
    return n;
  },[logs, dailyMeds, t]);

  const missed = dailyMeds.filter(m=>!logs.some(l=>l.medId===m.id&&l.date===t));
  const recent = logs.filter(l=>!l.isPeriodLog).slice(0,6);

  const nextReminder = useMemo(()=>{
    const now = new Date();
    return reminders.filter(r=>r.enabled).map(r=>{
      const [h,m]=r.time.split(":").map(Number);
      const tgt=new Date(); tgt.setHours(h,m,0,0);
      if(tgt<now) tgt.setDate(tgt.getDate()+1);
      return { ...r, mins:Math.round((tgt-now)/60000) };
    }).sort((a,b)=>a.mins-b.mins)[0];
  },[reminders]);

  const periodLog = logs.filter(l=>l.isPeriodLog).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const cycleDay  = periodLog ? daysBetween(periodLog.date, t)+1 : null;
  const packDay   = bc ? clamp(daysBetween(bc.packStartDate, t)+1, 1, (bc.activeDays||24)+(bc.placeboDays||4)) : null;

  return (
    <div>
      <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif" }}>Dashboard</h2>

      {streak>=7 && (
        <div className="mb-6 p-4 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 flex items-center gap-3">
          <Flame size={22} className="text-teal-400 flex-shrink-0"/>
          <div>
            <p className="text-teal-300 font-bold" style={{ fontFamily:"'Syne', sans-serif" }}>
              {streak}-day streak{streak>=90?" 🏆":streak>=30?" ⭐":""} — you're consistent!
            </p>
            <p className="text-slate-400 text-xs">
              {streak>=90?"90-day milestone! Outstanding dedication.":streak>=30?"30-day milestone! Keep it up!":"Keep going — you're building a great habit!"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tracked"      value={meds.length}   sub="medications"                Icon={Pill}       color="teal"/>
        <StatCard label="Logged Today" value={todayLogs.length} sub="doses"                  Icon={Check}      color="green"/>
        <StatCard label="Adherence"    value={`${adherence}%`} sub="last 30 days"             Icon={TrendingUp} color="cyan"/>
        <StatCard label="Streak"       value={`${streak}d`}  sub={streak>=30?"milestone! 🎯":"keep going"}     Icon={Flame}      color="orange"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {bc && (
          <div className={S.card}>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-pink-400"/> <h3 className="font-bold text-white text-sm" style={{ fontFamily:"'Syne', sans-serif" }}>Birth Control</h3>
            </div>
            <div className="flex justify-between mb-3">
              <div><p className="text-slate-400 text-xs">Method</p><p className="text-white font-medium text-sm">{bc.name}</p><p className="text-slate-500 text-xs">{bc.type}</p></div>
              {packDay && <div className="text-right"><p className="text-slate-400 text-xs">Pack Day</p><p className="text-3xl font-bold text-white leading-none" style={{ fontFamily:"'Syne', sans-serif" }}>{packDay}</p></div>}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${bcTakenToday ? "bg-teal-500/15 text-teal-400 border border-teal-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
              {bcTakenToday ? <><CheckCircle size={13}/> Today's pill logged</> : <><AlertTriangle size={13}/> Today's pill not yet logged</>}
            </div>
            {cycleDay && <p className="text-slate-500 text-xs mt-2 italic">Cycle day ~{cycleDay} (estimate only — not a fertility tool)</p>}
          </div>
        )}

        {nextReminder && (
          <div className={S.card}>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-teal-400"/> <h3 className="font-bold text-white text-sm" style={{ fontFamily:"'Syne', sans-serif" }}>Next Reminder</h3>
            </div>
            <p className="text-white font-medium">{nextReminder.medName}</p>
            <p className="text-slate-400 text-sm">{fmtTime12(nextReminder.time)} · {nextReminder.note}</p>
            <p className="text-teal-400 text-xs mt-2 flex items-center gap-1">
              <Clock size={11}/>
              {nextReminder.mins < 60 ? `${nextReminder.mins} min away` : `${Math.floor(nextReminder.mins/60)}h ${nextReminder.mins%60}m away`}
            </p>
          </div>
        )}
      </div>

      {missed.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={15} className="text-red-400"/><p className="text-red-400 font-semibold text-sm">Not yet logged today</p></div>
          <div className="flex flex-wrap gap-2">{missed.map(m=><span key={m.id} className={`${S.badge} bg-red-500/20 text-red-300 border border-red-500/30`}>{m.name}</span>)}</div>
        </div>
      )}

      <div className={S.card}>
        <h3 className={S.subheading} style={{ fontFamily:"'Syne', sans-serif" }}>Recent Activity</h3>
        {recent.length === 0
          ? <p className="text-slate-500 text-sm">No logs yet. Start by logging a dose!</p>
          : <div className="divide-y divide-slate-700/50">
              {recent.map(l=>(
                <div key={l.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0"/>
                    <div><p className="text-white text-sm font-medium">{l.medName}</p><p className="text-slate-500 text-xs">{l.dose} {l.doseUnit}</p></div>
                  </div>
                  <span className="text-slate-500 text-xs">{fmtDateShort(l.date)} · {l.time}</span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

/* ─── MEDICATIONS ───────────────────────────────────────────────────────────── */
function Medications({ meds, setMeds, logs, setLogs }) {
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [logging,  setLogging]  = useState(null);

  const save = (med) => {
    setMeds(p => p.some(m=>m.id===med.id) ? p.map(m=>m.id===med.id?med:m) : [...p,med]);
    setShowForm(false); setEditing(null);
  };
  const lastDoseOf = (id) => logs.filter(l=>l.medId===id).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0]?.dose;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif", marginBottom:0 }}>Medications</h2>
        <button className={`${S.btn} ${S.primary}`} onClick={()=>setShowForm(true)}><Plus size={15}/> Add</button>
      </div>

      {meds.length === 0
        ? <div className={`${S.card} text-center py-14`}><Pill size={36} className="text-slate-600 mx-auto mb-3"/><p className="text-slate-500">No medications added yet.</p></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {meds.map(med=>(
              <MedCard key={med.id} med={med} logs={logs}
                onEdit={()=>{ setEditing(med); setShowForm(true); }}
                onDelete={()=>setMeds(p=>p.filter(m=>m.id!==med.id))}
                onLog={()=>setLogging(med)}
              />
            ))}
          </div>
      }

      {showForm && (
        <Modal title={editing?"Edit Medication":"Add Medication"} onClose={()=>{ setShowForm(false); setEditing(null); }} wide>
          <MedForm initial={editing} onSave={save} onClose={()=>{ setShowForm(false); setEditing(null); }}/>
        </Modal>
      )}
      {logging && (
        <Modal title={`Log Dose — ${logging.name}`} onClose={()=>setLogging(null)}>
          <LogDoseForm med={logging} lastDose={lastDoseOf(logging.id)}
            onSave={e=>{ setLogs(p=>[e,...p]); setLogging(null); }} onClose={()=>setLogging(null)}/>
        </Modal>
      )}
    </div>
  );
}

/* ─── BIRTH CONTROL ─────────────────────────────────────────────────────────── */
function BirthControl({ bc, setBc, logs, setLogs }) {
  const [view,  setView]  = useState(bc ? "main" : "setup");
  const [syms,  setSyms]  = useState([]);
  const [showSym,  setShowSym]  = useState(false);
  const [showPrd,  setShowPrd]  = useState(false);
  const [showCeleb,setShowCeleb]= useState(false);
  const [pStart,setPStart]= useState(TODAY);
  const [pEnd,  setPEnd]  = useState(TODAY);

  const blank = { id:uid(), type:"Daily Pill", name:"", packStartDate:TODAY, activeDays:24, placeboDays:4, cutoffTime:"21:00", partnerNote:"", lastPeriodStart:"", lastPeriodEnd:"", cycleLength:28 };
  const [form, setForm]   = useState(bc || blank);
  const sf = (k) => (v) => setForm(p=>({...p,[k]:v}));
  const sfe= (k) => (e) => setForm(p=>({...p,[k]:e.target.value}));

  const bcLogs  = bc ? logs.filter(l=>l.medId===bc.id&&l.isBCLog) : [];
  const takenToday = bc && logs.some(l=>l.medId===bc.id&&l.date===TODAY&&l.isBCLog);
  const total   = bc ? (bc.activeDays||24)+(bc.placeboDays||4) : 28;
  const packDay = bc ? clamp(daysBetween(bc.packStartDate,TODAY)+1,1,total) : null;
  const daysLeft= bc ? total - (packDay||0) : null;

  const missedCount = useMemo(()=>{
    if(!bc) return 0;
    let c=0;
    for(let i=1;i<=Math.min(packDay||0, bc.activeDays||24);i++){
      const d=addDays(bc.packStartDate,i-1);
      if(d<=TODAY&&!bcLogs.some(l=>l.date===d)) c++;
    }
    return c;
  },[bc, bcLogs, packDay]);

  const takeToday = () => {
    if(takenToday) return;
    setLogs(p=>[{ id:uid(),medId:bc.id,medName:bc.name,dose:"1",doseUnit:"tablet",date:TODAY,time:nowTime(),notes:"",symptoms:[],isBCLog:true,isPeriodLog:false },...p]);
    if(packDay>=total) setShowCeleb(true);
  };

  const saveBC = () => { setBc({ ...form, id:form.id||uid() }); setView("main"); };

  const logSyms = () => {
    setLogs(p=>[{ id:uid(),medId:bc?.id||"bc",medName:bc?.name||"Birth Control",dose:"",doseUnit:"",date:TODAY,time:nowTime(),notes:"BC symptoms",symptoms:syms,isBCLog:true,isPeriodLog:false },...p]);
    setSyms([]); setShowSym(false);
  };

  const logPeriod = () => {
    setLogs(p=>[{ id:uid(),medId:"period",medName:"Period",dose:"",doseUnit:"",date:pStart,time:"00:00",notes:`Period: ${pStart}–${pEnd}`,symptoms:["cramping"],isBCLog:false,isPeriodLog:true },...p]);
    setBc(prev=>prev?{ ...prev, lastPeriodStart:pStart, lastPeriodEnd:pEnd }:prev);
    setShowPrd(false);
  };

  // Computed countdowns per BC type
  const depoNext    = bc?.type==="Shot (Depo-Provera)"   ? addDays(bc.packStartDate,91)    : null;
  const iudExpiry   = bc?.type==="IUD"                   ? addDays(bc.packStartDate,365*5) : null;
  const implantExp  = bc?.type==="Implant"               ? addDays(bc.packStartDate,365*3) : null;
  const patchChange = bc?.type==="Patch"                 ? addDays(bc.packStartDate,7)     : null;
  const ringRemoval = bc?.type==="Ring (NuvaRing)"       ? addDays(bc.packStartDate,21)    : null;

  const cycleDay = bc?.lastPeriodStart ? daysBetween(bc.lastPeriodStart,TODAY)+1 : null;
  const nextPeriodEst = bc?.lastPeriodStart ? addDays(bc.lastPeriodStart, bc.cycleLength||28) : null;

  if (view === "setup") return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif", marginBottom:0 }}>Birth Control Setup</h2>
        {bc && <button className={`${S.btn} ${S.secondary}`} onClick={()=>setView("main")}><X size={14}/> Cancel</button>}
      </div>
      <div className={S.card}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="BC Type"><Sel value={form.type} onChange={sf("type")} opts={BC_TYPES}/></Field>
          <Field label="Brand / Name"><input className={S.input} value={form.name} onChange={sfe("name")} placeholder="e.g. Lo Loestrin Fe"/></Field>
        </div>

        {form.type==="Daily Pill" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pack Start Date"><input type="date" className={S.input} value={form.packStartDate} onChange={sfe("packStartDate")}/></Field>
            <Field label="Daily Cutoff Time"><input type="time" className={S.input} value={form.cutoffTime} onChange={sfe("cutoffTime")}/></Field>
            <Field label="Active Pills"><input type="number" className={S.input} value={form.activeDays} onChange={e=>setForm(p=>({...p,activeDays:+e.target.value}))}/></Field>
            <Field label="Placebo Pills"><input type="number" className={S.input} value={form.placeboDays} onChange={e=>setForm(p=>({...p,placeboDays:+e.target.value}))}/></Field>
          </div>
        )}
        {["Shot (Depo-Provera)","IUD","Implant","Patch","Ring (NuvaRing)"].includes(form.type) && (
          <Field label={form.type==="Shot (Depo-Provera)"?"Last Injection Date":"Insertion / Start Date"}>
            <input type="date" className={S.input} value={form.packStartDate} onChange={sfe("packStartDate")}/>
          </Field>
        )}
        {form.type==="Emergency Contraception" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date Taken"><input type="date" className={S.input} value={form.packStartDate} onChange={sfe("packStartDate")}/></Field>
            <Field label="Type (Plan B, Ella, etc.)"><input className={S.input} value={form.name} onChange={sfe("name")} placeholder="Plan B"/></Field>
          </div>
        )}
        {form.type==="Custom / Other" && (
          <Field label="Details"><textarea className={S.input} rows={3} value={form.name} onChange={sfe("name")} placeholder="Describe your birth control method…"/></Field>
        )}

        <div className="grid grid-cols-2 gap-3 mt-1">
          <Field label="Avg Cycle Length (days)"><input type="number" className={S.input} value={form.cycleLength} onChange={e=>setForm(p=>({...p,cycleLength:+e.target.value}))}/></Field>
          <Field label="Partner Share Note"><input className={S.input} value={form.partnerNote} onChange={sfe("partnerNote")} placeholder="Optional note to share"/></Field>
        </div>

        <div className="flex gap-2 mt-4">
          <button className={`${S.btn} ${S.primary} flex-1 justify-center`} onClick={saveBC}><Check size={14}/> Save</button>
        </div>
      </div>
      <InfoNote className="mt-3">Birth control information is for personal tracking purposes only and does not constitute medical advice. Always consult your healthcare provider.</InfoNote>
    </div>
  );

  if (!bc) return (
    <div className={`${S.card} text-center py-14`}>
      <Heart size={36} className="text-slate-600 mx-auto mb-3"/>
      <p className="text-slate-500 mb-4">No birth control set up yet.</p>
      <button className={`${S.btn} ${S.primary}`} onClick={()=>setView("setup")}><Plus size={14}/> Set Up</button>
    </div>
  );

  return (
    <div>
      {showCeleb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className={`${S.card} text-center max-w-xs w-full mx-4 border-teal-500/40`}>
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily:"'Syne', sans-serif" }}>Pack Complete!</h3>
            <p className="text-slate-400 text-sm mb-4">Great job finishing your pack! Start your next pack as directed by your healthcare provider.</p>
            <button className={`${S.btn} ${S.primary} w-full justify-center`} onClick={()=>setShowCeleb(false)}><Check size={14}/> Got it</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif", marginBottom:0 }}>Birth Control</h2>
        <button className={`${S.btn} ${S.secondary}`} onClick={()=>setView("setup")}><Edit2 size={14}/> Edit</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Main info card */}
        <div className={`${S.card} lg:col-span-2`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily:"'Syne', sans-serif" }}>{bc.name || bc.type}</h3>
              <span className={`${S.badge} bg-pink-500/20 text-pink-400 border border-pink-500/30 mt-1`}>{bc.type}</span>
            </div>
            {packDay && <div className="text-right"><p className="text-slate-400 text-xs">Pack Day</p><p className="text-4xl font-black text-white leading-none" style={{ fontFamily:"'Syne', sans-serif" }}>{packDay}</p><p className="text-slate-500 text-xs">of {total}</p></div>}
          </div>

          {bc.type==="Daily Pill" && <><PackGrid bc={bc} logs={logs}/><div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-500/30 border border-teal-400/50 inline-block"/> Taken</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20  border border-red-400/40  inline-block"/> Missed</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-800/80 border border-slate-700/40 inline-block"/> Placebo</span>
          </div></>}

          {bc.type==="Shot (Depo-Provera)" && depoNext && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">Last injection: <span className="text-white font-medium">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400">Next due: <span className={`font-bold ${daysBetween(TODAY,depoNext)<=14?"text-red-400":"text-teal-400"}`}>{fmtDate(depoNext)}</span></p>
              <div className={`px-3 py-2 rounded-xl text-sm ${daysBetween(TODAY,depoNext)<=14?"bg-amber-500/10 border border-amber-500/20 text-amber-400":"bg-teal-500/10 border border-teal-500/20 text-teal-400"}`}>
                {Math.max(0,daysBetween(TODAY,depoNext))} days until next injection
              </div>
            </div>
          )}
          {bc.type==="IUD" && iudExpiry && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">Inserted: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400">Expires: <span className="text-white">{fmtDate(iudExpiry)}</span></p>
              <p className="text-teal-400 font-medium">{Math.max(0,daysBetween(TODAY,iudExpiry))} days until replacement</p>
            </div>
          )}
          {bc.type==="Implant" && implantExp && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">Inserted: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400">Expires: <span className="text-white">{fmtDate(implantExp)}</span></p>
              <p className="text-teal-400 font-medium">{Math.max(0,daysBetween(TODAY,implantExp))} days until replacement</p>
            </div>
          )}
          {bc.type==="Patch" && patchChange && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">Applied: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400">Change on: <span className={`font-bold ${daysBetween(TODAY,patchChange)<=1?"text-red-400":"text-teal-400"}`}>{fmtDate(patchChange)}</span></p>
              <p className="text-teal-400 font-medium">{Math.max(0,daysBetween(TODAY,patchChange))} days until patch change</p>
            </div>
          )}
          {bc.type==="Ring (NuvaRing)" && ringRemoval && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">Inserted: <span className="text-white">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400">Remove on: <span className={`font-bold ${daysBetween(TODAY,ringRemoval)<=2?"text-red-400":"text-teal-400"}`}>{fmtDate(ringRemoval)}</span></p>
              <p className="text-teal-400 font-medium">{Math.max(0,daysBetween(TODAY,ringRemoval))} days until removal</p>
            </div>
          )}
          {bc.type==="Emergency Contraception" && (
            <div className="text-sm space-y-1">
              <p className="text-slate-400">Taken: <span className="text-white font-medium">{fmtDate(bc.packStartDate)}</span></p>
              <p className="text-slate-400">Type: <span className="text-white">{bc.name}</span></p>
              <div className="p-3 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">Emergency contraception logged. Consult your healthcare provider if needed.</div>
            </div>
          )}
        </div>

        {/* Action column */}
        <div className="space-y-3">
          {bc.type==="Daily Pill" && (
            <div className={S.card}>
              <button onClick={takeToday} disabled={takenToday}
                className={`${S.btn} w-full justify-center py-3 text-base font-bold ${takenToday?"bg-teal-500/20 text-teal-400 border border-teal-500/30 cursor-default":S.primary}`}>
                {takenToday ? <><CheckCircle size={18}/> Taken Today</> : <><Heart size={18}/> Take Today's Pill</>}
              </button>
              {!takenToday && <p className="text-xs text-amber-400 mt-2 flex items-center gap-1"><Clock size={10}/> Cutoff: {fmtTime12(bc.cutoffTime)}</p>}
            </div>
          )}

          {missedCount > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 font-semibold text-sm flex items-center gap-1 mb-1"><AlertTriangle size={13}/> {missedCount} Missed Pill{missedCount>1?"s":""}</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                {missedCount===1?"Take your pill as soon as possible. Take the next pill at the usual time.":"You've missed 2+ pills. Use backup contraception and contact your healthcare provider."}
              </p>
              <p className="text-slate-500 text-xs mt-2 italic">This is not medical advice — consult your healthcare provider.</p>
            </div>
          )}

          {daysLeft !== null && daysLeft <= 7 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 text-sm font-semibold flex items-center gap-1"><RefreshCw size={12}/> {daysLeft} days left in pack</p>
              <p className="text-slate-400 text-xs mt-1">Time to refill your prescription!</p>
            </div>
          )}

          <div className={S.card}>
            <h4 className="text-white font-semibold text-sm mb-1">Cycle Awareness</h4>
            <p className="text-slate-500 text-xs italic mb-2">Estimate only — not a fertility tool</p>
            {cycleDay
              ? <><p className="text-sm text-slate-400">Current day: <span className="text-teal-400 font-bold text-lg">{cycleDay}</span></p>
                  {nextPeriodEst && <p className="text-slate-400 text-xs mt-1">Est. next period: {fmtDateShort(nextPeriodEst)}</p>}</>
              : <p className="text-slate-500 text-xs">Log a period to track cycle days.</p>}
            <button className={`${S.btn} ${S.secondary} w-full justify-center mt-3 text-xs py-1.5`} onClick={()=>setShowPrd(true)}>
              <Droplets size={12}/> Log Period
            </button>
          </div>

          <button className={`${S.btn} ${S.secondary} w-full justify-center`} onClick={()=>setShowSym(true)}>
            <Tag size={14}/> Log BC Symptoms
          </button>

          {bc.partnerNote && (
            <div className={S.card}>
              <p className="text-slate-400 text-xs mb-1 font-medium">Partner Note</p>
              <p className="text-white text-sm">{bc.partnerNote}</p>
              <button className={`${S.btn} ${S.secondary} mt-2 text-xs py-1.5`} onClick={()=>navigator.clipboard?.writeText(`I take ${bc.name} (${bc.type}) at ${fmtTime12(bc.cutoffTime)}. ${bc.partnerNote}`)}>
                <Copy size={11}/> Copy
              </button>
            </div>
          )}
        </div>
      </div>

      <InfoNote>All birth control information is for personal tracking only. It does not constitute medical advice or guarantee contraceptive effectiveness. Always consult your healthcare provider.</InfoNote>

      {showSym && (
        <Modal title="Log BC Symptoms Today" onClose={()=>setShowSym(false)}>
          <SymPicker selected={syms} onChange={setSyms} pool={BC_SYMPTOMS}/>
          <button className={`${S.btn} ${S.primary} w-full justify-center mt-4`} onClick={logSyms}><Check size={14}/> Save</button>
        </Modal>
      )}
      {showPrd && (
        <Modal title="Log Period" onClose={()=>setShowPrd(false)}>
          <Field label="Start Date"><input type="date" className={S.input} value={pStart} onChange={e=>setPStart(e.target.value)}/></Field>
          <Field label="End Date"><input type="date" className={S.input} value={pEnd} onChange={e=>setPEnd(e.target.value)}/></Field>
          <button className={`${S.btn} ${S.primary} w-full justify-center mt-4`} onClick={logPeriod}><Check size={14}/> Save</button>
        </Modal>
      )}
    </div>
  );
}

/* ─── LOG / HISTORY ─────────────────────────────────────────────────────────── */
function LogHistory({ logs, setLogs, meds }) {
  const [search,  setSearch]  = useState("");
  const [type,    setType]    = useState("all");
  const [sym,     setSym]     = useState("");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(()=> logs.filter(l=>{
    if(search && !l.medName.toLowerCase().includes(search.toLowerCase())) return false;
    if(type==="bc"     && !l.isBCLog)    return false;
    if(type==="general"&&  l.isBCLog)    return false;
    if(type==="period" && !l.isPeriodLog) return false;
    if(sym    && !l.symptoms.some(s=>s.toLowerCase().includes(sym.toLowerCase()))) return false;
    if(from   && l.date < from) return false;
    if(to     && l.date > to)   return false;
    return true;
  }),[logs,search,type,sym,from,to]);

  const symCloud = useMemo(()=>{
    const m={};
    logs.forEach(l=>l.symptoms.forEach(s=>{ m[s]=(m[s]||0)+1; }));
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10);
  },[logs]);

  const exportCSV = () => {
    const hdr = ["Date","Time","Medication","Dose","Unit","Symptoms","Notes","Type"];
    const rows = filtered.map(l=>[l.date,l.time,l.medName,l.dose,l.doseUnit,l.symptoms.join(";"),l.notes,l.isBCLog?"BC":l.isPeriodLog?"Period":"General"]);
    const csv  = [hdr,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download="medication_log.csv"; a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif", marginBottom:0 }}>Log / History</h2>
        <button className={`${S.btn} ${S.secondary}`} onClick={exportCSV}><Download size={14}/> Export CSV</button>
      </div>

      {symCloud.length > 0 && (
        <div className={`${S.card} mb-4`}>
          <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1"><Tag size={12} className="text-teal-400"/> Symptom Tag Cloud — click to filter</p>
          <div className="flex flex-wrap gap-1.5">
            {symCloud.map(([s,n])=>(
              <button key={s} onClick={()=>setSym(sym===s?"":s)}
                style={{ fontSize:`${Math.min(1,0.72+n*0.05)}rem` }}
                className={`${S.badge} cursor-pointer py-1 px-2.5 transition-all ${sym===s?"bg-teal-500/25 text-teal-300 border border-teal-400/40":"bg-slate-700 text-slate-400 border border-slate-600 hover:border-teal-400/30"}`}>
                {s} ({n})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${S.card} mb-4`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={S.label}>Search</label><input className={S.input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Medication name…"/></div>
          <div><label className={S.label}>Type</label><Sel value={type} onChange={setType} opts={[{value:"all",label:"All Types"},{value:"general",label:"General"},{value:"bc",label:"Birth Control"},{value:"period",label:"Period"}]}/></div>
          <div><label className={S.label}>From</label><input type="date" className={S.input} value={from} onChange={e=>setFrom(e.target.value)}/></div>
          <div><label className={S.label}>To</label><input type="date" className={S.input} value={to} onChange={e=>setTo(e.target.value)}/></div>
        </div>
        {sym && <div className="mt-2 flex items-center gap-2"><span className="text-xs text-slate-400">Filtering by symptom:</span><span className={`${S.badge} bg-teal-500/25 text-teal-300 border border-teal-400/40`}>{sym}<button onClick={()=>setSym("")} className="ml-1"><X size={10}/></button></span></div>}
      </div>

      <div className="space-y-2">
        {filtered.length===0
          ? <div className={`${S.card} text-center py-8`}><p className="text-slate-500">No entries match your filters.</p></div>
          : filtered.map(l=>(
            <div key={l.id} className={`${S.cardHover} ${l.isPeriodLog?"border-pink-500/30 bg-pink-500/5":""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-bold text-sm ${l.isPeriodLog?"text-pink-400":l.isBCLog?"text-pink-300":"text-white"}`} style={{ fontFamily:"'Syne', sans-serif" }}>
                      {l.isPeriodLog?"🩸 ":""}{l.medName}
                    </span>
                    {l.isBCLog&&!l.isPeriodLog&&<span className={`${S.badge} bg-pink-500/20 text-pink-400 border border-pink-500/30`}>BC</span>}
                    {l.dose&&<span className="text-slate-300 text-xs">{l.dose} {l.doseUnit}</span>}
                  </div>
                  <p className="text-slate-500 text-xs mb-1">{fmtDate(l.date)} · {l.time}</p>
                  {l.symptoms.length>0&&<div className="flex flex-wrap gap-1 mb-1">{l.symptoms.map(s=><span key={s} className={`${S.badge} bg-slate-700/80 text-slate-400 border border-slate-600/60 text-xs`}>{s}</span>)}</div>}
                  {l.notes&&<p className="text-slate-400 text-xs leading-relaxed">{l.notes}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={()=>setEditing({...l})} className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-slate-700 transition-colors"><Edit2 size={13}/></button>
                  <button onClick={()=>setLogs(p=>p.filter(x=>x.id!==l.id))} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {editing && (
        <Modal title="Edit Log Entry" onClose={()=>setEditing(null)}>
          <Field label="Date"><input type="date" className={S.input} value={editing.date} onChange={e=>setEditing(p=>({...p,date:e.target.value}))}/></Field>
          <Field label="Time"><input type="time" className={S.input} value={editing.time} onChange={e=>setEditing(p=>({...p,time:e.target.value}))}/></Field>
          <Field label="Dose"><input className={S.input} value={editing.dose} onChange={e=>setEditing(p=>({...p,dose:e.target.value}))}/></Field>
          <Field label="Notes"><textarea className={S.input} rows={2} value={editing.notes} onChange={e=>setEditing(p=>({...p,notes:e.target.value}))}/></Field>
          <Field label="Symptoms"><SymPicker selected={editing.symptoms} onChange={v=>setEditing(p=>({...p,symptoms:v}))} pool={[...ALL_SYMPTOMS,...BC_SYMPTOMS]}/></Field>
          <div className="flex gap-2 mt-4">
            <button className={`${S.btn} ${S.primary} flex-1 justify-center`} onClick={()=>{ setLogs(p=>p.map(l=>l.id===editing.id?editing:l)); setEditing(null); }}><Check size={14}/> Save</button>
            <button className={`${S.btn} ${S.secondary}`} onClick={()=>setEditing(null)}><X size={14}/> Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── REMINDERS ─────────────────────────────────────────────────────────────── */
function Reminders({ reminders, setReminders, meds, bc, logs, setLogs, dueReminders }) {
  const [showForm, setShowForm] = useState(false);
  const blank = { medId:"", medName:"", time:"08:00", frequency:"daily", note:"" };
  const [form, setForm] = useState(blank);
  const sf = (k) => (v) => setForm(p=>({...p,[k]:v}));
  const sfe= (k) => (e) => setForm(p=>({...p,[k]:e.target.value}));

  const allMeds = useMemo(()=>[...meds, ...(bc?[{id:bc.id,name:bc.name,dosage:"1",doseUnit:"tablet"}]:[])],[meds,bc]);

  const save = () => {
    if(!form.medName.trim()) return;
    setReminders(p=>[...p,{...form,id:uid(),enabled:true,snoozeUntil:null}]);
    setShowForm(false); setForm(blank);
  };

  const snooze = (id,mins) => {
    const until = new Date(Date.now()+mins*60000).toISOString();
    setReminders(p=>p.map(r=>r.id===id?{...r,snoozeUntil:until}:r));
  };

  const quickLog = (r) => {
    const med = allMeds.find(m=>m.id===r.medId);
    setLogs(p=>[{ id:uid(),medId:r.medId,medName:r.medName,dose:med?.dosage||"1",doseUnit:med?.doseUnit||"dose",date:TODAY,time:nowTime(),notes:"Logged from reminder",symptoms:[],isBCLog:bc?.id===r.medId,isPeriodLog:false },...p]);
  };

  const countdown = (t) => {
    const [h,m]=t.split(":").map(Number);
    const now=new Date(); const tgt=new Date(); tgt.setHours(h,m,0,0);
    if(tgt<now) tgt.setDate(tgt.getDate()+1);
    const mins=Math.round((tgt-now)/60000);
    return mins<60?`${mins}m`:`${Math.floor(mins/60)}h ${mins%60}m`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif", marginBottom:0 }}>Reminders</h2>
        <button className={`${S.btn} ${S.primary}`} onClick={()=>setShowForm(true)}><Plus size={15}/> Add</button>
      </div>

      {dueReminders.map(r=>(
        <div key={r.id} className="mb-4 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-teal-400 animate-pulse flex-shrink-0"/>
            <div><p className="text-teal-300 font-bold text-sm">{r.medName} — {r.note}</p><p className="text-slate-400 text-xs">Due now</p></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className={`${S.btn} ${S.primary} text-xs py-1.5`} onClick={()=>quickLog(r)}><Zap size={11}/> Log Now</button>
            {[15,30,60].map(n=><button key={n} className={`${S.btn} ${S.secondary} text-xs py-1.5`} onClick={()=>snooze(r.id,n)}>{n}m</button>)}
          </div>
        </div>
      ))}

      <div className="space-y-2">
        {reminders.length===0
          ? <div className={`${S.card} text-center py-12`}><Bell size={36} className="text-slate-600 mx-auto mb-3"/><p className="text-slate-500">No reminders yet.</p></div>
          : reminders.map(r=>(
            <div key={r.id} className={`${S.card} flex items-center gap-3 ${!r.enabled?"opacity-50":""}`}>
              <Toggle checked={r.enabled} onChange={v=>setReminders(p=>p.map(x=>x.id===r.id?{...x,enabled:v}:x))}/>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{r.medName}</p>
                <p className="text-slate-500 text-xs">{fmtTime12(r.time)} · {r.frequency} · {r.note}</p>
              </div>
              {r.enabled && <span className="text-teal-400 text-xs flex-shrink-0 flex items-center gap-1"><Clock size={11}/>{countdown(r.time)}</span>}
              <button onClick={()=>setReminders(p=>p.filter(x=>x.id!==r.id))} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"><Trash2 size={14}/></button>
            </div>
          ))
        }
      </div>

      {showForm && (
        <Modal title="Add Reminder" onClose={()=>setShowForm(false)}>
          <Field label="Medication">
            <Sel value={form.medId} onChange={v=>{ const m=allMeds.find(x=>x.id===v); setForm(p=>({...p,medId:v,medName:m?.name||""})); }}
              opts={[{value:"",label:"Select…"},...allMeds.map(m=>({value:m.id,label:m.name}))]}/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time"><input type="time" className={S.input} value={form.time} onChange={sfe("time")}/></Field>
            <Field label="Frequency"><Sel value={form.frequency} onChange={sf("frequency")} opts={["daily","weekly","once"]}/></Field>
          </div>
          <Field label="Note"><input className={S.input} value={form.note} onChange={sfe("note")} placeholder="Reminder note…"/></Field>
          <div className="flex gap-2 mt-4">
            <button className={`${S.btn} ${S.primary} flex-1 justify-center`} onClick={save}><Check size={14}/> Add</button>
            <button className={`${S.btn} ${S.secondary}`} onClick={()=>setShowForm(false)}><X size={14}/> Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── ANALYTICS ─────────────────────────────────────────────────────────────── */
function Analytics({ meds, logs, bc }) {
  const [range, setRange] = useState(7);
  const [selMedId, setSelMedId] = useState(meds[0]?.id || "");

  const days = useMemo(()=>Array.from({length:range},(_,i)=>addDays(TODAY,-(range-1)+i)),[range]);

  const doseChart = useMemo(()=> days.map(d=>{
    const obj={date:d.slice(5)};
    meds.forEach(m=>{ obj[m.name]=logs.filter(l=>l.medId===m.id&&l.date===d).length; });
    return obj;
  }),[days,meds,logs]);

  const symGeneral = useMemo(()=>{
    const m={};
    logs.filter(l=>!l.isBCLog).forEach(l=>l.symptoms.forEach(s=>{ m[s]=(m[s]||0)+1; }));
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name,count}));
  },[logs]);

  const symBC = useMemo(()=>{
    const m={};
    logs.filter(l=>l.isBCLog).forEach(l=>l.symptoms.forEach(s=>{ m[s]=(m[s]||0)+1; }));
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name,count}));
  },[logs]);

  const progressData = useMemo(()=>{
    const med = meds.find(m=>m.id===selMedId)||meds[0];
    if(!med) return [];
    return logs.filter(l=>l.medId===med.id&&l.dose).sort((a,b)=>a.date.localeCompare(b.date)).map(l=>({date:l.date.slice(5),dose:parseFloat(l.dose)||0}));
  },[logs,selMedId,meds]);

  const heatmap = useMemo(()=> Array.from({length:35},(_,i)=>{
    const d=addDays(TODAY,-34+i);
    const n=logs.filter(l=>l.date===d&&!l.isPeriodLog).length;
    return {d,n};
  }),[logs]);

  // BC stats
  const bcLogs30 = bc ? logs.filter(l=>l.medId===bc.id&&l.isBCLog&&l.date>=addDays(TODAY,-30)) : [];
  const bcAdh    = bc ? Math.round(bcLogs30.length/30*100) : 0;
  let bcStreak   = 0;
  if(bc){ for(let i=0;i<90;i++){ const d=addDays(TODAY,-i); if(logs.some(l=>l.medId===bc.id&&l.isBCLog&&l.date===d)) bcStreak++; else if(i>0) break; } }

  const ttp = { contentStyle:{background:"#1e293b",border:"1px solid #334155",borderRadius:8,fontSize:12}, labelStyle:{color:"#94a3b8"} };

  return (
    <div>
      <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif" }}>Analytics</h2>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-slate-400 text-sm">Range:</span>
        {[7,30].map(r=><button key={r} onClick={()=>setRange(r)} className={`${S.btn} ${range===r?S.primary:S.secondary} py-1.5`}>{r}d</button>)}
      </div>

      <div className={`${S.card} mb-5`}>
        <h3 className={S.subheading} style={{ fontFamily:"'Syne', sans-serif" }}>Dose Frequency — last {range} days</h3>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={doseChart} barSize={range<=7?20:10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
            <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:11}}/>
            <YAxis tick={{fill:"#64748b",fontSize:11}} allowDecimals={false}/>
            <Tooltip {...ttp}/>
            <Legend wrapperStyle={{fontSize:12}}/>
            {meds.map((m,i)=><Bar key={m.id} dataKey={m.name} fill={CHART_COLORS[i%CHART_COLORS.length]} radius={[3,3,0,0]}/>)}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className={S.card}>
          <h3 className={S.subheading} style={{ fontFamily:"'Syne', sans-serif" }}>General Symptoms</h3>
          {symGeneral.length===0 ? <p className="text-slate-500 text-sm">No symptoms logged.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={symGeneral} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{fill:"#64748b",fontSize:11}}/>
                <YAxis type="category" dataKey="name" tick={{fill:"#94a3b8",fontSize:11}} width={110}/>
                <Tooltip {...ttp}/>
                <Bar dataKey="count" fill="#2dd4bf" radius={[0,3,3,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={S.card}>
          <h3 className={S.subheading} style={{ fontFamily:"'Syne', sans-serif" }}>BC Symptoms</h3>
          {symBC.length===0 ? <p className="text-slate-500 text-sm">No BC symptoms logged.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={symBC} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{fill:"#64748b",fontSize:11}}/>
                <YAxis type="category" dataKey="name" tick={{fill:"#94a3b8",fontSize:11}} width={110}/>
                <Tooltip {...ttp}/>
                <Bar dataKey="count" fill="#f472b6" radius={[0,3,3,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={`${S.card} mb-5`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={S.subheading} style={{ fontFamily:"'Syne', sans-serif", marginBottom:0 }}>Dosage Progression</h3>
          <Sel value={selMedId} onChange={setSelMedId} opts={meds.map(m=>({value:m.id,label:m.name}))}/>
        </div>
        {progressData.length<2 ? <p className="text-slate-500 text-sm">Need at least 2 log entries to show progression.</p> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:11}}/>
              <YAxis tick={{fill:"#64748b",fontSize:11}}/>
              <Tooltip {...ttp}/>
              <Line type="monotone" dataKey="dose" stroke="#2dd4bf" strokeWidth={2.5} dot={{fill:"#2dd4bf",r:4,strokeWidth:0}}/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={`${S.card} mb-5`}>
        <h3 className={S.subheading} style={{ fontFamily:"'Syne', sans-serif" }}>Adherence Heatmap — last 35 days</h3>
        <div className="grid gap-1" style={{ gridTemplateColumns:"repeat(7, 1fr)" }}>
          {heatmap.map(({d,n})=>(
            <div key={d} title={`${fmtDateShort(d)}: ${n} dose${n!==1?"s":""}`}
              className="aspect-square rounded-md border border-slate-700/50 transition-colors"
              style={{ background: n===0?"#0f172a": n===1?"#0d9488": "#2dd4bf" }}/>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{background:"#0f172a",border:"1px solid #334155"}}/> None</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-700"/> 1</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-400"/> 2+</span>
        </div>
      </div>

      {bc && (
        <div className={`${S.card} mb-5`}>
          <div className="flex items-center gap-2 mb-4"><Heart size={16} className="text-pink-400"/><h3 className={S.subheading} style={{ fontFamily:"'Syne', sans-serif", marginBottom:0 }}>BC Adherence</h3></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center"><p className="text-4xl font-black text-teal-400 leading-none" style={{ fontFamily:"'Syne', sans-serif" }}>{bcAdh}%</p><p className="text-slate-500 text-xs mt-1">30-day consistency</p></div>
            <div className="text-center"><p className="text-4xl font-black text-teal-400 leading-none" style={{ fontFamily:"'Syne', sans-serif" }}>{bcStreak}</p><p className="text-slate-500 text-xs mt-1">Current streak (days)</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {meds.map((m,i)=>{
          const ml=logs.filter(l=>l.medId===m.id&&l.dose);
          const doses=ml.map(l=>parseFloat(l.dose)).filter(Boolean);
          const avg=doses.length>0?(doses.reduce((a,b)=>a+b,0)/doses.length).toFixed(1):"—";
          const sm={};
          ml.forEach(l=>l.symptoms.forEach(s=>{ sm[s]=(sm[s]||0)+1; }));
          const topSym=Object.entries(sm).sort((a,b)=>b[1]-a[1])[0]?.[0]||"none";
          return (
            <div key={m.id} className={S.card}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:CHART_COLORS[i%CHART_COLORS.length]}}/>
                <h4 className="font-bold text-white text-sm" style={{ fontFamily:"'Syne', sans-serif" }}>{m.name}</h4>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-slate-400">Avg dose: <span className="text-white font-medium">{avg} {m.doseUnit}</span></p>
                <p className="text-slate-400">Total logged: <span className="text-white font-medium">{ml.length}</span></p>
                <p className="text-slate-400">Top symptom: <span className="text-white font-medium">{topSym}</span></p>
                <p className="text-slate-400">Days tracked: <span className="text-white font-medium">{daysBetween(m.startDate,TODAY)}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── AI ASSISTANT ──────────────────────────────────────────────────────────── */
const STARTERS = [
  "Did I take my pill today?",
  "What happens if I miss a pill?",
  "When is my next shot due?",
  "What symptoms have I logged most?",
  "Am I on track this week?",
  "When does my patch need to change?",
];

function AIAssistant({ meds, bc, logs, reminders, apiKey }) {
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  const sysPrompt = () => {
    const data = {
      todayDate: TODAY,
      medications: meds.map(m=>({ name:m.name, type:m.type, dose:`${m.dosage} ${m.doseUnit}`, frequency:m.frequency, startDate:m.startDate, refillDate:m.refillDate||null, prescribedBy:m.prescribedBy||null })),
      birthControl: bc ? { name:bc.name, type:bc.type, packStartDate:bc.packStartDate, currentPackDay:clamp(daysBetween(bc.packStartDate,TODAY)+1,1,(bc.activeDays||24)+(bc.placeboDays||4)), takenToday:logs.some(l=>l.medId===bc.id&&l.date===TODAY&&l.isBCLog) } : null,
      recentLogs: logs.slice(0,25).map(l=>({ med:l.medName, dose:`${l.dose} ${l.doseUnit}`, date:l.date, time:l.time, symptoms:l.symptoms, notes:l.notes||null })),
      activeReminders: reminders.filter(r=>r.enabled).map(r=>({ med:r.medName, time:r.time, frequency:r.frequency })),
    };
    return `You are a knowledgeable, non-judgmental medication and health assistant. The user tracks medications, supplements, and birth control using this app. Answer questions about dosing schedules, missed doses, symptoms, BC methods, adherence patterns, and general health questions related to their tracked data. For birth control questions, provide helpful general information but always recommend consulting a healthcare provider for medical decisions. Never provide emergency medical advice — direct to a doctor or 911 for urgent issues. User's current data: ${JSON.stringify(data,null,2)}`;
  };

  const send = async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput(""); setError("");
    const newMsgs = [...msgs, { role:"user", content:q }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": apiKey||"",
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-calls":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:sysPrompt(),
          messages:newMsgs.map(m=>({role:m.role,content:m.content})),
        }),
      });
      if(!res.ok){ const e=await res.json().catch(()=>{}); throw new Error(e?.error?.message||`HTTP ${res.status}`); }
      const data = await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:data.content?.[0]?.text||"No response."}]);
    } catch(e) {
      setError(e.message||"Failed to connect. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight:"calc(100vh - 160px)" }}>
      <h2 className={S.heading} style={{ fontFamily:"'Syne', sans-serif" }}>AI Assistant</h2>
      <InfoNote>AI responses are informational only. Always consult a healthcare provider for medical decisions. Never share identifying personal data.</InfoNote>

      {msgs.length===0 && (
        <div className="mt-4 mb-2">
          <p className="text-slate-400 text-sm mb-3">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map(s=><button key={s} onClick={()=>send(s)} className={`${S.btn} ${S.secondary} text-xs py-1.5 font-normal`}>{s}</button>)}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 my-4 pr-1">
        {msgs.map((m,i)=>(
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            <div className={`relative group max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role==="user"?"bg-teal-500/20 text-teal-50 border border-teal-500/30 rounded-br-sm":"bg-slate-700 text-slate-100 border border-slate-600 rounded-bl-sm"}`}>
              {m.content}
              {m.role==="assistant" && (
                <button onClick={()=>navigator.clipboard?.writeText(m.content)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-600">
                  <Copy size={12}/>
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 border border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 size={15} className="text-teal-400 animate-spin"/>
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5"/> {error}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-700/50">
        <input
          className={`${S.input} flex-1`}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask about your medications, symptoms, or schedule…"
        />
        <button onClick={()=>send()} disabled={loading||!input.trim()}
          className={`${S.btn} ${S.primary} px-3 ${loading||!input.trim()?"opacity-40 cursor-not-allowed":""}`}>
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
}

/* ─── QUICK LOG ─────────────────────────────────────────────────────────────── */
function QuickLog({ meds, bc, setLogs, onClose }) {
  const all = useMemo(()=>[...meds,...(bc?[{...bc,dosage:"1",doseUnit:"tablet"}]:[])],[meds,bc]);
  const [id, setId] = useState(all[0]?.id||"");
  const med = all.find(m=>m.id===id);
  const log = () => {
    if(!med) return;
    setLogs(p=>[{id:uid(),medId:med.id,medName:med.name,dose:med.dosage||"1",doseUnit:med.doseUnit||"dose",date:TODAY,time:nowTime(),notes:"Quick log",symptoms:[],isBCLog:bc?.id===med.id,isPeriodLog:false},...p]);
    onClose();
  };
  return (
    <Modal title="Quick Log Dose" onClose={onClose}>
      <Field label="Medication"><Sel value={id} onChange={setId} opts={all.map(m=>({value:m.id,label:m.name}))}/></Field>
      {med && <p className="text-slate-400 text-sm mb-4">Will log <span className="text-white font-medium">{med.dosage} {med.doseUnit}</span> at current time.</p>}
      <div className="flex gap-2">
        <button className={`${S.btn} ${S.primary} flex-1 justify-center`} onClick={log}><Zap size={14}/> Log Now</button>
        <button className={`${S.btn} ${S.secondary}`} onClick={onClose}><X size={14}/></button>
      </div>
    </Modal>
  );
}

/* ─── APP ROOT ──────────────────────────────────────────────────────────────── */
export default function App() {
  const [tab,        setTab]        = useState("dashboard");
  const [meds,       setMeds]       = useState(INIT_MEDS);
  const [bc,         setBc]         = useState(INIT_BC);
  const [logs,       setLogs]       = useState(INIT_LOGS);
  const [reminders,  setReminders]  = useState(INIT_REMINDERS);
  const [search,     setSearch]     = useState("");
  const [quickLog,   setQuickLog]   = useState(false);
  const [due,        setDue]        = useState([]);
  const [sidebar,    setSidebar]    = useState(false);
  const [apiKey,     setApiKey]     = useState("");
  const [showKey,    setShowKey]    = useState(false);

  // Reminder polling
  useEffect(()=>{
    const check = ()=>{
      const now = new Date();
      const h=now.getHours(), m=now.getMinutes();
      const nowMins=h*60+m;
      setDue(reminders.filter(r=>{
        if(!r.enabled) return false;
        if(r.snoozeUntil&&new Date(r.snoozeUntil)>now) return false;
        const [rh,rm]=r.time.split(":").map(Number);
        return Math.abs(nowMins-(rh*60+rm))<=1;
      }));
    };
    check();
    const iv=setInterval(check,60000);
    return ()=>clearInterval(iv);
  },[reminders]);

  // Global search
  const searchRes = useMemo(()=>{
    if(!search.trim()) return [];
    const q=search.toLowerCase();
    return [
      ...meds.filter(m=>m.name.toLowerCase().includes(q)).map(m=>({type:"med",label:m.name,sub:m.type,tab:"medications"})),
      ...logs.filter(l=>l.medName.toLowerCase().includes(q)).slice(0,4).map(l=>({type:"log",label:l.medName,sub:fmtDateShort(l.date),tab:"log"})),
    ].slice(0,6);
  },[search,meds,logs]);

  const tp = { meds,setMeds,bc,setBc,logs,setLogs,reminders,setReminders,dueReminders:due };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex overflow-hidden" style={{ fontFamily:"'DM Sans', sans-serif" }}>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-slate-800/95 border-r border-slate-700/60 flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 ${sidebar?"translate-x-0":"-translate-x-full"}`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-700/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow">
              <Pill size={15} className="text-slate-900"/>
            </div>
            <div><p className="text-white font-bold text-sm leading-tight" style={{ fontFamily:"'Syne', sans-serif" }}>MedTrack</p><p className="text-slate-500 text-xs">Health Tracker</p></div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>{ setTab(id); setSidebar(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${tab===id?"bg-teal-500/20 text-teal-400 border border-teal-500/20":"text-slate-400 hover:text-white hover:bg-slate-700/60"}`}>
              <Icon size={17}/>
              {label}
              {id==="reminders"&&due.length>0&&<span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"/>}
            </button>
          ))}
        </nav>

        {/* API key */}
        <div className="p-3 border-t border-slate-700/60 flex-shrink-0">
          <button onClick={()=>setShowKey(!showKey)} className={`${S.btn} ${S.secondary} w-full justify-center text-xs py-2`}>
            <Bot size={12}/> {apiKey?"API Key ✓":"Set API Key"}
          </button>
          {showKey && <div className="mt-2 space-y-1">
            <input type="password" className={`${S.input} text-xs`} value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-…"/>
            <p className="text-slate-600 text-xs">Used only for AI Assistant tab.</p>
          </div>}
        </div>
      </aside>

      {/* Sidebar overlay */}
      {sidebar && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={()=>setSidebar(false)}/>}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-slate-800/90 backdrop-blur-md border-b border-slate-700/60 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" onClick={()=>setSidebar(!sidebar)}>
            <Menu size={19}/>
          </button>
          <div className="flex-1 relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
            <input className="w-full bg-slate-700/60 border border-slate-600/60 rounded-xl pl-9 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
              value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search medications, logs…"/>
            {search && searchRes.length>0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {searchRes.map((r,i)=>(
                  <button key={i} onClick={()=>{ setTab(r.tab); setSearch(""); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors">
                    <p className="text-white text-sm font-medium">{r.label}</p>
                    <p className="text-slate-500 text-xs capitalize">{r.sub}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {due.length>0 && (
            <button onClick={()=>setTab("reminders")} className="relative p-1.5 text-slate-400 hover:text-white transition-colors">
              <Bell size={19}/>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">{due.length}</span>
            </button>
          )}
        </header>

        {/* Reminder top banner */}
        {due.length>0 && tab!=="reminders" && (
          <div className="flex justify-center px-4 pt-3 flex-shrink-0">
            <div className="flex items-center gap-3 bg-teal-500 text-slate-900 px-4 py-2 rounded-xl shadow-lg text-sm font-semibold max-w-sm w-full">
              <Bell size={15} className="animate-bounce flex-shrink-0"/>
              <span className="truncate">{due[0].medName} reminder!</span>
              <button onClick={()=>setTab("reminders")} className="ml-auto underline text-xs whitespace-nowrap">View</button>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {tab==="dashboard"    && <Dashboard   {...tp}/>}
          {tab==="medications"  && <Medications {...tp}/>}
          {tab==="birthcontrol" && <BirthControl {...tp}/>}
          {tab==="log"          && <LogHistory  {...tp}/>}
          {tab==="reminders"    && <Reminders   {...tp}/>}
          {tab==="analytics"    && <Analytics   meds={meds} logs={logs} bc={bc}/>}
          {tab==="ai"           && <AIAssistant meds={meds} bc={bc} logs={logs} reminders={reminders} apiKey={apiKey}/>}
        </main>
      </div>

      {/* FAB */}
      <button onClick={()=>setQuickLog(true)} title="Quick log a dose"
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-900 rounded-full shadow-2xl flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95">
        <Plus size={24}/>
      </button>

      {quickLog && <QuickLog meds={meds} bc={bc} setLogs={setLogs} onClose={()=>setQuickLog(false)}/>}
    </div>
  );
}
