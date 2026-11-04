
import { useState } from "react";
import { fmt, fmtK } from "../utils/formatters.js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

const today = () => new Date().toISOString().slice(0, 10);

export const DashboardPage = ({ vehicles = [], drivers = [], shifts = [], reversements = [], user }) => {
  const [periode, setPeriode]       = useState("jour");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(today());

  // ─── BORNES PÉRIODE ─────────────────────────────────────────────────────────
  const getWeekBounds = (offset) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };
  const getMonthBounds = (offset) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
    return { start, end };
  };

  const weekBounds  = getWeekBounds(weekOffset);
  const monthBounds = getMonthBounds(monthOffset);
  const weekLabel   = weekBounds.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " – " + weekBounds.end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const monthLabel  = monthBounds.start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const applyFilter = (dateObj) => {
    if (!dateObj || isNaN(dateObj)) return periode === "tout";
    if (periode === "jour")    return dateObj.toDateString() === new Date(selectedDay).toDateString();
    if (periode === "semaine") return dateObj >= weekBounds.start && dateObj <= weekBounds.end;
    if (periode === "mois")    return dateObj >= monthBounds.start && dateObj <= monthBounds.end;
    return true;
  };

  const filteredShifts       = shifts.filter(s => applyFilter(new Date(s.planned_start_date || s.date || "")));
  const filteredReversements = reversements.filter(r => applyFilter(new Date(r.date || "")));

  // ─── KPIs ────────────────────────────────────────────────────────────────────
  const driversActifs  = drivers.filter(d => d.status === "Actif").length;
  const vehiclesExpl   = vehicles.filter(v => v.status === "En exploitation").length;
  const shiftsEnCours  = filteredShifts.filter(s => s.status === "En cours").length;
  const shiftsPlanifie = filteredShifts.filter(s => s.status === "Planifié" || s.status === "Planifie").length;
  const shiftsTermine  = filteredShifts.filter(s => s.status === "Terminé"  || s.status === "Termine").length;
  const caJour         = filteredReversements.reduce((a, r) => a + (r.montant || 0), 0);
  const revValides     = filteredReversements.filter(r => r.status === "Validé" || r.status === "Valide").reduce((a, r) => a + (r.montant || 0), 0);
  const revEnAttente   = filteredReversements.filter(r => r.status === "En attente").length;
  const avgSoc         = vehicles.length ? Math.round(vehicles.reduce((a, v) => a + (v.soc || 0), 0) / vehicles.length) : 0;

  // ─── STATUT FLOTTE ───────────────────────────────────────────────────────────
  const flotte = [
    { label: "En exploitation", count: vehicles.filter(v => v.status === "En exploitation").length, color: "#4ade80", bg: "bg-green-900/40", text: "text-green-400", border: "border-green-800" },
    { label: "En maintenance",  count: vehicles.filter(v => v.status === "En maintenance").length,  color: "#fbbf24", bg: "bg-amber-900/40", text: "text-amber-400",  border: "border-amber-800" },
    { label: "Hors service",    count: vehicles.filter(v => v.status === "Hors service").length,    color: "#f87171", bg: "bg-red-900/40",   text: "text-red-400",   border: "border-red-800" },
  ];

  // ─── ALERTES ────────────────────────────────────────────────────────────────
  const alertes = [];
  vehicles.forEach(v => {
    const dIns  = daysUntil(v.insurance_expiry  || v.assurancefin);
    const dTech = daysUntil(v.technical_visit_expiry || v.visiteDate);
    if (dIns  !== null && dIns  <= 30) alertes.push({ level: dIns  <= 7 ? "red" : "amber", msg: `Assurance ${v.immat} — expire dans ${dIns} j` });
    if (dTech !== null && dTech <= 30) alertes.push({ level: dTech <= 7 ? "red" : "amber", msg: `Visite technique ${v.immat} — expire dans ${dTech} j` });
  });
  drivers.forEach(d => {
    const dPermis = daysUntil(d.license_expiry_date || d.permisdelivrance);
    const dPiece  = daysUntil(d.id_card_expiry_date || d.piecedelivrance);
    if (dPermis !== null && dPermis <= 30) alertes.push({ level: "amber", msg: `Permis ${d.prenom} ${d.nom} — expire dans ${dPermis} j` });
    if (dPiece  !== null && dPiece  <= 30) alertes.push({ level: "amber", msg: `CNI ${d.prenom} ${d.nom} — expire dans ${dPiece} j` });
    if ((d.dettes || 0) > 0) alertes.push({ level: "amber", msg: `${d.prenom} ${d.nom} — dette ${fmt(d.dettes)} FCFA` });
  });

  // ─── GRAPHIQUE 7 JOURS ───────────────────────────────────────────────────────
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const dayRevs = reversements.filter(r => new Date(r.date || "").toDateString() === d.toDateString());
    return {
      jour: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      montant: dayRevs.reduce((a, r) => a + (r.montant || 0), 0),
      shifts: shifts.filter(s => new Date(s.planned_start_date || "").toDateString() === d.toDateString()).length,
    };
  });

  // ─── SHIFTS D'AUJOURD'HUI ────────────────────────────────────────────────────
  const shiftsAujourdhui = shifts.filter(s => (s.planned_start_date || "").startsWith(today()));

  return (
    <div className="space-y-5 p-6 min-h-screen bg-slate-900 text-slate-100">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {/* Filtre période */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5 gap-0.5">
            {[["tout","Tout"],["jour","Jour"],["semaine","Semaine"],["mois","Mois"]].map(([v, l]) => (
              <button key={v} onClick={() => setPeriode(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${periode === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>
                {l}
              </button>
            ))}
          </div>
          {periode === "jour" && (
            <input type="date" value={selectedDay} onChange={e => setSelectedDay(e.target.value)}
              className="text-xs border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-200 focus:outline-none focus:border-blue-500" />
          )}
          {periode === "semaine" && (
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
              <button onClick={() => setWeekOffset(w => w - 1)} className="text-slate-400 hover:text-white px-1 text-base font-bold">‹</button>
              <span className="text-xs text-slate-300 min-w-[150px] text-center">{weekLabel}</span>
              <button onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0} className="text-slate-400 hover:text-white px-1 text-base font-bold disabled:opacity-30">›</button>
            </div>
          )}
          {periode === "mois" && (
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
              <button onClick={() => setMonthOffset(m => m - 1)} className="text-slate-400 hover:text-white px-1 text-base font-bold">‹</button>
              <span className="text-xs text-slate-300 min-w-[110px] text-center capitalize">{monthLabel}</span>
              <button onClick={() => setMonthOffset(m => m + 1)} disabled={monthOffset >= 0} className="text-slate-400 hover:text-white px-1 text-base font-bold disabled:opacity-30">›</button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Chauffeurs actifs</div>
          <div className="text-3xl font-extrabold text-blue-400">{driversActifs}</div>
          <div className="text-xs text-slate-500 mt-1.5">sur {drivers.length} enregistrés</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Véhicules en service</div>
          <div className="text-3xl font-extrabold text-green-400">{vehiclesExpl}</div>
          <div className="text-xs text-slate-500 mt-1.5">SOC moy. {avgSoc}%</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Shifts en cours</div>
          <div className="text-3xl font-extrabold text-amber-400">{shiftsEnCours}</div>
          <div className="text-xs text-slate-500 mt-1.5">{shiftsPlanifie} planifiés · {shiftsTermine} terminés</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Reversements</div>
          <div className="text-3xl font-extrabold text-violet-400">{fmt(caJour)}</div>
          <div className="text-xs text-slate-500 mt-1.5">{revEnAttente} en attente · {fmt(revValides)} validés</div>
        </div>
      </div>

      {/* ── FLOTTE + ALERTES ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* STATUT FLOTTE */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Statut flotte</div>
          {/* Blocs couleur */}
          <div className="flex gap-3 mb-4">
            {flotte.map(f => (
              <div key={f.label} className={`flex-1 ${f.bg} border ${f.border} rounded-lg p-3`}>
                <div className={`text-2xl font-extrabold ${f.text}`}>{f.count}</div>
                <div className={`text-[10px] font-semibold ${f.text} mt-1`}>{f.label}</div>
              </div>
            ))}
          </div>
          {/* Barre de progression */}
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
            {flotte.map(f => f.count > 0 && (
              <div key={f.label} style={{ flex: f.count, background: f.color, borderRadius: 4 }} />
            ))}
            {vehicles.length === 0 && <div className="flex-1 bg-slate-700 rounded-full" />}
          </div>
          {/* SOC par véhicule */}
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Batteries (SOC)</div>
          <div className="space-y-2">
            {vehicles.slice(0, 6).map(v => (
              <div key={v.id} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-24 shrink-0">{v.immat}</span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${(v.soc || 0) > 50 ? "bg-green-400" : (v.soc || 0) > 20 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${v.soc || 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{v.soc ?? "—"}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTES */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-4">
            Alertes {alertes.length > 0 && <span className="ml-1 bg-red-900/60 text-red-400 px-1.5 py-0.5 rounded-full">{alertes.length}</span>}
          </div>
          {alertes.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-8">Aucune alerte active</div>
          ) : (
            <div className="space-y-2">
              {alertes.slice(0, 7).map((a, i) => (
                <div key={i} className={`rounded-lg px-3 py-2 text-xs font-medium ${a.level === "red" ? "bg-red-900/40 border border-red-800 text-red-300" : "bg-amber-900/40 border border-amber-800 text-amber-300"}`}>
                  {a.msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SHIFTS + REVERSEMENTS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* SHIFTS DU JOUR */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Shifts aujourd'hui</div>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-semibold">{shiftsAujourdhui.length}</span>
          </div>
          {shiftsAujourdhui.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-6">Aucun shift aujourd'hui</div>
          ) : (
            <div className="space-y-0">
              {shiftsAujourdhui.slice(0, 7).map(sh => {
                const driver = drivers.find(d => d.id === sh.ch);
                const isEnCours = sh.status === "En cours";
                return (
                  <div key={sh.id} className="flex items-center gap-3 py-2.5 border-b border-slate-700/50 last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isEnCours ? "bg-green-400" : sh.status === "Planifié" || sh.status === "Planifie" ? "bg-blue-400" : "bg-slate-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {driver ? `${driver.prenom} ${driver.nom}` : sh.ch}
                      </div>
                      <div className="text-[11px] text-slate-500">{sh.vh} · {sh.shift_type || "Shift A"} · {sh.courses_count || 0} courses</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isEnCours ? "bg-green-900/50 text-green-400" : sh.status === "Planifié" || sh.status === "Planifie" ? "bg-blue-900/50 text-blue-400" : "bg-slate-700 text-slate-400"}`}>
                      {sh.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DERNIERS REVERSEMENTS */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Derniers reversements</div>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-semibold">{revEnAttente} en attente</span>
          </div>
          {reversements.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-6">Aucun reversement</div>
          ) : (
            <div className="space-y-0">
              {reversements.slice(0, 7).map(r => {
                const driver = drivers.find(d => d.id === (r.driver_id || r.ch));
                const isValide = r.status === "Validé" || r.status === "Valide";
                return (
                  <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-slate-700/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {driver ? `${driver.prenom} ${driver.nom}` : (r.driver_id || r.ch)}
                      </div>
                      <div className="text-[11px] text-slate-500">{r.canal} · {r.date}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-green-400">{fmt(r.montant)} F</div>
                      <span className={`text-[10px] font-bold ${isValide ? "text-green-400" : "text-amber-400"}`}>{r.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── GRAPHIQUE 7 JOURS ──────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">Performance — 7 derniers jours</div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="jour" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => fmtK(v)} width={40} />
              <Tooltip
                formatter={(v, name) => name === "montant" ? [fmt(v) + " F", "Reversements"] : [v + " shift(s)", "Shifts"]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, color: "#f1f5f9" }}
                cursor={{ fill: "#334155" }}
              />
              <Bar dataKey="montant" fill="#4ade80" radius={[4, 4, 0, 0]} name="montant" />
              <Bar dataKey="shifts"  fill="#60a5fa" radius={[4, 4, 0, 0]} name="shifts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};