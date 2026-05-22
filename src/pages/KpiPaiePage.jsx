// KpiPaiePage.jsx — Easy by Saver
// Copier dans : src/pages/KpiPaiePage.jsx
// Dark theme · Tailwind CSS · Props : {drivers, shifts, reversements}

import { useState } from "react";
import * as XLSX from "xlsx";
import { fmt } from "../utils/formatters.js";

const fmtK = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? Math.round(n / 1_000) + "k" : (n || 0).toString();

// ─── CONSTANTES MÉTIER ────────────────────────────────────────────────────────
const FIXE_JOURNALIER  = 5_357;
const KPI_RECETTES     = 25_000;
const KPI_COURSES      = 12;
const BONUS_MAX        = 25_000;
const COMMISSION_YANGO = 0.1836;

const PALIERS = [
  { min: 36, taux: 0.75 },
  { min: 26, taux: 0.50 },
  { min: 20, taux: 0.35 },
  { min: 11, taux: 0.25 },
  { min: 1,  taux: 0.10 },
];

function getPalier(coursesSupp) {
  for (const p of PALIERS) { if (coursesSupp >= p.min) return p.taux; }
  return 0;
}

// ─── CALCUL PAIE D'UN CHAUFFEUR ──────────────────────────────────────────────
function calcPaie(d, shiftsPool, reversementsPool, periodeDebut, periodeFin) {
  const dId   = String(d.id || "").trim();
  const dCode = String(d.driver_code || d.matricule || "").trim();

  const matchCh = (sCh) => sCh && dId && (sCh === dId || (dCode && sCh === dCode));

  const shiftsDriver = shiftsPool.filter(s => {
    const sCh = String(s.ch || s.driver_id || "").trim();
    return (s.status === "Terminé" || s.status === "Termine") && matchCh(sCh);
  });

  const joursTravailes = shiftsDriver.length;
  const salaireBase    = joursTravailes * FIXE_JOURNALIER;

  const revsFiltres = reversementsPool.filter(r => {
    const rCh   = String(r.ch || r.driver_id || "").trim();
    const rDate = r.date || "";
    const inPeriod = !periodeDebut || (rDate >= periodeDebut && rDate <= periodeFin);
    return inPeriod && matchCh(rCh);
  });

  const revFromRevs   = revsFiltres.reduce((a, r) => a + (parseFloat(r.montant) || 0), 0);
  const revFromShifts = shiftsDriver.reduce((a, s) => a + (parseFloat(s.revenue_cash) || parseFloat(s.recette) || 0), 0);
  const totalRevBrut  = revFromRevs > 0 ? revFromRevs : revFromShifts;
  const totalCommission     = Math.round(totalRevBrut * COMMISSION_YANGO);
  const totalRecettesNettes = Math.max(0, totalRevBrut - totalCommission);

  const objectifRecettes = joursTravailes * KPI_RECETTES;
  const surplus          = Math.max(0, totalRecettesNettes - objectifRecettes);

  const totalCourses   = shiftsDriver.reduce((a, s) => a + (s.courses_count || 0), 0);
  const objectifCourses = joursTravailes * KPI_COURSES;
  const coursesSupp    = Math.max(0, totalCourses - objectifCourses);

  const palierPct = getPalier(coursesSupp);
  const bonus     = Math.min(surplus * palierPct, BONUS_MAX * joursTravailes);

  const avances   = revsFiltres.reduce((a, r) => a + (r.authorized_expenses || 0), 0) + (d.avance || 0);
  const manquants = d.dettes || 0;
  const net       = salaireBase + bonus - avances - manquants;

  return { d, joursTravailes, salaireBase, totalRevBrut, totalCommission, totalRecettesNettes, objectifRecettes, surplus, totalCourses, objectifCourses, coursesSupp, palierPct, bonus, avances, manquants, net };
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export const KpiPaiePage = ({ drivers = [], shifts = [], reversements = [] }) => {
  const [periodeDebut, setPeriodeDebut] = useState("");
  const [periodeFin,   setPeriodeFin]   = useState("");
  const [selectedId,   setSelectedId]   = useState(null);

  // Filtrer les pools par période
  const shiftsPool = (periodeDebut && periodeFin)
    ? shifts.filter(s => {
        const d = s.planned_start_date || s.date || "";
        return d >= periodeDebut && d <= periodeFin;
      })
    : shifts;

  const reversementsPool = reversements;  // filtré dans calcPaie

  const paies = drivers
    .filter(d => d.status === "Actif")
    .map(d => calcPaie(d, shiftsPool, reversementsPool, periodeDebut, periodeFin));

  const totaux = paies.reduce((a, p) => ({
    jours:    a.jours    + p.joursTravailes,
    base:     a.base     + p.salaireBase,
    bonus:    a.bonus    + p.bonus,
    ded:      a.ded      + p.avances + p.manquants,
    net:      a.net      + p.net,
    courses:  a.courses  + p.totalCourses,
    recettes: a.recettes + p.totalRecettesNettes,
  }), { jours: 0, base: 0, bonus: 0, ded: 0, net: 0, courses: 0, recettes: 0 });

  const selectedPaie = selectedId ? paies.find(p => p.d.id === selectedId) : null;

  const shiftsTermines = shiftsPool.filter(s => s.status === "Terminé" || s.status === "Termine");

  // ─── EXPORT EXCEL ───────────────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Setup
    const wsSetup = XLSX.utils.aoa_to_sheet([
      ["PARAMETRES SAVER"],
      ["Période", periodeDebut || "—", "→", periodeFin || "—"],
      ["Fixe journalier", FIXE_JOURNALIER, "FCFA/jour"],
      ["KPI recettes/shift", KPI_RECETTES, "FCFA"],
      ["KPI courses/shift", KPI_COURSES],
      ["Bonus max/jour", BONUS_MAX],
      ["Commission Yango", COMMISSION_YANGO * 100 + "%"],
    ]);
    XLSX.utils.book_append_sheet(wb, wsSetup, "Setup");

    // Payroll
    const header = ["Matricule", "Nom", "Jours", "Recettes nettes", "Obj. recettes", "Surplus", "Courses", "Obj. courses", "Courses+", "Palier", "Base", "Bonus", "Avances", "Manquants", "NET"];
    const rows = paies.map(p => [
      p.d.driver_code || p.d.matricule || p.d.id,
      `${p.d.prenom} ${p.d.nom}`,
      p.joursTravailes,
      Math.round(p.totalRecettesNettes),
      p.objectifRecettes,
      Math.round(p.surplus),
      p.totalCourses,
      p.objectifCourses,
      p.coursesSupp,
      `${Math.round(p.palierPct * 100)}%`,
      p.salaireBase,
      Math.round(p.bonus),
      Math.round(p.avances),
      Math.round(p.manquants),
      Math.round(p.net),
    ]);
    const wsPayroll = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, wsPayroll, "Payroll");

    // Daily data
    const dailyHeader = ["Date", "Driver ID", "Shifts", "Recettes versées", "Courses", "Avances"];
    const dailyRows = shiftsTermines.map(s => [
      s.planned_start_date || s.date || "",
      s.ch || s.driver_id || "",
      1,
      parseFloat(s.revenue_cash) || parseFloat(s.recette) || 0,
      s.courses_count || 0,
      s.authorized_expenses || 0,
    ]);
    const wsDaily = XLSX.utils.aoa_to_sheet([dailyHeader, ...dailyRows]);
    XLSX.utils.book_append_sheet(wb, wsDaily, "Daily_Data");

    const periode = periodeDebut && periodeFin ? `_${periodeDebut}_au_${periodeFin}` : "";
    XLSX.writeFile(wb, `Paie_EasyBySaver${periode}.xlsx`);
  };

  return (
    <div className="flex h-full bg-slate-900 text-slate-100 gap-0" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── PANNEAU GAUCHE : LISTE ───────────────────────────────────────── */}
      <div className="w-88 shrink-0 border-r border-slate-700 flex flex-col bg-slate-900" style={{ width: "22rem" }}>

        {/* Header */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-white text-base">KPI & Paie</div>
              <div className="text-xs text-slate-500 mt-1">{paies.length} chauffeurs · {shiftsTermines.length} shifts</div>
            </div>
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Excel
            </button>
          </div>

          {/* Période */}
          <div className="space-y-2.5">
            <div className="flex gap-2 items-center">
              <label className="text-xs text-slate-500 w-6">Du</label>
              <input type="date" value={periodeDebut} onChange={e => setPeriodeDebut(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-xs text-slate-500 w-6">Au</label>
              <input type="date" value={periodeFin} onChange={e => setPeriodeFin(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
            </div>
            {(periodeDebut || periodeFin) && (
              <button onClick={() => { setPeriodeDebut(""); setPeriodeFin(""); }}
                className="text-xs text-red-400 hover:text-red-300">
                Effacer la periode
              </button>
            )}
          </div>
        </div>

        {/* Totaux */}
        <div className="p-5 border-b border-slate-700 grid grid-cols-2 gap-3">
          {[
            ["Total base",   fmt(totaux.base),    "text-white"],
            ["Total bonus",  fmt(totaux.bonus),   "text-green-400"],
            ["Deductions",   fmt(totaux.ded),     "text-red-400"],
            ["Total net",    fmt(totaux.net),      "text-blue-400"],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-slate-800 rounded-xl p-3.5 text-center">
              <div className={`text-base font-bold ${c}`}>{v}</div>
              <div className="text-[10px] text-slate-500 mt-1">{l}</div>
            </div>
          ))}
        </div>

        {/* Liste chauffeurs */}
        <div className="flex-1 overflow-y-auto">
          {paies.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">Aucun chauffeur actif</div>
          )}
          {paies.map(p => {
            const isSelected = selectedId === p.d.id;
            const kpiOk = p.totalRecettesNettes >= p.objectifRecettes;
            return (
              <div key={p.d.id} onClick={() => setSelectedId(isSelected ? null : p.d.id)}
                className={`flex items-center gap-3.5 px-5 py-4 cursor-pointer border-b border-slate-800 transition-all ${isSelected ? "bg-blue-900/30 border-l-2 border-l-blue-500 pl-[18px]" : "hover:bg-slate-800/50"}`}>
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                  {(p.d.prenom || "?")[0]}{(p.d.nom || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{p.d.prenom} {p.d.nom}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.joursTravailes}j · {p.totalCourses} courses</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-white">{fmtK(p.net)}</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${kpiOk ? "text-green-400" : "text-amber-400"}`}>
                    {kpiOk ? "KPI OK" : "Sous KPI"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PANNEAU DROIT ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-900 p-8 space-y-6">

        {/* Règles de rémunération */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Regles de remuneration SAVER</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              ["Fixe journalier",  fmt(FIXE_JOURNALIER) + " FCFA", "text-white",       "bg-slate-700"],
              ["KPI Recettes",     fmt(KPI_RECETTES) + " / shift",  "text-blue-400",    "bg-blue-900/40"],
              ["KPI Courses",      KPI_COURSES + " courses/shift",  "text-violet-400",  "bg-violet-900/40"],
              ["Bonus max/jour",   fmt(BONUS_MAX) + " FCFA",        "text-amber-400",   "bg-amber-900/40"],
            ].map(([l, v, col, bg]) => (
              <div key={l} className={`${bg} rounded-xl p-4 text-center`}>
                <div className={`text-base font-bold ${col}`}>{v}</div>
                <div className="text-xs text-slate-500 mt-1.5">{l}</div>
              </div>
            ))}
          </div>
          {/* Paliers */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Paliers de bonus (courses supplementaires)</div>
          <div className="flex flex-wrap gap-2.5">
            {[[1, 10, "10%"], [11, 19, "25%"], [20, 25, "35%"], [26, 35, "50%"], [36, "+", "75%"]].map(([min, max, pct]) => (
              <div key={min} className="bg-slate-900/60 border border-slate-700 px-3.5 py-2 rounded-xl text-xs">
                <span className="text-slate-400">{min}–{max} courses +</span>
                <span className="font-bold text-green-400 ml-1.5">{pct} du surplus</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fiche détail chauffeur sélectionné */}
        {selectedPaie ? (
          <DetailPaie p={selectedPaie} />
        ) : (
          /* Table récapitulatif tous chauffeurs */
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
              <div className="font-semibold text-white text-sm">Tableau de paie</div>
              <span className="text-[10px] text-slate-500">{paies.length} chauffeurs · Clique sur un nom pour le détail</span>
            </div>
            {paies.length === 0 ? (
              <div className="text-center text-slate-500 py-10 text-sm">Aucune donnée pour cette période</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/40">
                      {["Chauffeur", "Jours", "Courses", "Recettes", "Obj.", "Surplus", "Palier", "Base", "Bonus", "Ded.", "NET"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paies.map(p => (
                      <tr key={p.d.id} onClick={() => setSelectedId(p.d.id)}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors">
                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{p.d.prenom} {p.d.nom}</td>
                        <td className="px-4 py-3 text-slate-400 text-center">{p.joursTravailes}</td>
                        <td className="px-4 py-3 text-slate-400 text-center">{p.totalCourses}</td>
                        <td className="px-4 py-3 text-slate-300">{fmtK(p.totalRecettesNettes)}</td>
                        <td className="px-4 py-3 text-slate-500">{fmtK(p.objectifRecettes)}</td>
                        <td className={`px-4 py-3 font-medium ${p.surplus > 0 ? "text-green-400" : "text-slate-500"}`}>{p.surplus > 0 ? "+" + fmtK(p.surplus) : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.palierPct >= 0.5 ? "bg-green-900/60 text-green-400 border border-green-800" : p.palierPct > 0 ? "bg-blue-900/60 text-blue-400 border border-blue-800" : "bg-slate-700 text-slate-500"}`}>
                            {Math.round(p.palierPct * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{fmtK(p.salaireBase)}</td>
                        <td className={`px-4 py-3 font-medium ${p.bonus > 0 ? "text-green-400" : "text-slate-500"}`}>{p.bonus > 0 ? "+" + fmtK(p.bonus) : "—"}</td>
                        <td className={`px-4 py-3 ${(p.avances + p.manquants) > 0 ? "text-red-400" : "text-slate-500"}`}>
                          {(p.avances + p.manquants) > 0 ? "-" + fmtK(p.avances + p.manquants) : "—"}
                        </td>
                        <td className={`px-4 py-3 font-bold ${p.net >= 0 ? "text-white" : "text-red-400"}`}>{fmt(p.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-600 bg-slate-900/50">
                      <td className="px-4 py-3 font-bold text-slate-300 text-[11px] uppercase">TOTAL</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-300">{totaux.jours}</td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-300">{totaux.courses}</td>
                      <td className="px-4 py-3 font-semibold text-slate-300">{fmtK(totaux.recettes)}</td>
                      <td colSpan={3} />
                      <td className="px-4 py-3 font-semibold text-slate-300">{fmtK(totaux.base)}</td>
                      <td className="px-4 py-3 font-semibold text-green-400">+{fmtK(totaux.bonus)}</td>
                      <td className="px-4 py-3 font-semibold text-red-400">-{fmtK(totaux.ded)}</td>
                      <td className="px-4 py-3 font-bold text-blue-400">{fmt(totaux.net)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── FICHE DÉTAIL CHAUFFEUR ───────────────────────────────────────────────────
const DetailPaie = ({ p }) => {
  const kpiOk     = p.totalRecettesNettes >= p.objectifRecettes;
  const kpiPct    = p.objectifRecettes > 0 ? Math.min(100, Math.round(p.totalRecettesNettes / p.objectifRecettes * 100)) : 0;
  const coursesPct = p.objectifCourses > 0 ? Math.min(100, Math.round(p.totalCourses / p.objectifCourses * 100)) : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
          {(p.d.prenom || "?")[0]}{(p.d.nom || "?")[0]}
        </div>
        <div>
          <div className="font-bold text-white text-base">{p.d.prenom} {p.d.nom}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{p.d.driver_code || p.d.matricule || "—"} · Shift {p.d.shift}</div>
        </div>
        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${kpiOk ? "bg-green-900/60 text-green-400 border border-green-800" : "bg-amber-900/60 text-amber-400 border border-amber-800"}`}>
          {kpiOk ? "KPI atteint" : "Sous objectif"}
        </span>
      </div>

      {/* Barres de progression */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Recettes nettes</span>
            <span className="text-slate-300 font-semibold">{fmt(Math.round(p.totalRecettesNettes))} / {fmt(p.objectifRecettes)} FCFA</span>
          </div>
          <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${kpiOk ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${kpiPct}%` }} />
          </div>
          <div className="text-xs text-slate-500 mt-1.5">{kpiPct}% de l'objectif</div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Courses</span>
            <span className="text-slate-300 font-semibold">{p.totalCourses} / {p.objectifCourses} courses</span>
          </div>
          <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${coursesPct >= 100 ? "bg-blue-500" : "bg-slate-500"}`} style={{ width: `${coursesPct}%` }} />
          </div>
          <div className="text-xs text-slate-500 mt-1.5">{p.coursesSupp > 0 ? `+${p.coursesSupp} courses supplementaires → palier ${Math.round(p.palierPct * 100)}%` : "Objectif non atteint"}</div>
        </div>
      </div>

      {/* Calcul détaillé */}
      <div className="bg-slate-900/60 rounded-xl p-5 space-y-2.5 text-sm">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Decomposition salaire</div>
        {[
          ["Jours travailles",          `${p.joursTravailes} jours`,              "text-slate-300"],
          ["Salaire de base",           `${fmt(p.salaireBase)} FCFA`,             "text-white"],
          ["Recettes brutes",           `${fmt(Math.round(p.totalRevBrut))} FCFA`, "text-slate-400"],
          ["Commission Yango",          `-${fmt(p.totalCommission)} FCFA`,         "text-red-400"],
          ["Recettes nettes",           `${fmt(Math.round(p.totalRecettesNettes))} FCFA`, "text-slate-300"],
          ["Surplus recettes",          p.surplus > 0 ? `+${fmt(Math.round(p.surplus))} FCFA` : "—", p.surplus > 0 ? "text-green-400" : "text-slate-500"],
          [`Bonus (palier ${Math.round(p.palierPct * 100)}%)`, p.bonus > 0 ? `+${fmt(Math.round(p.bonus))} FCFA` : "—", "text-green-400"],
          ["Avances",                   p.avances > 0 ? `-${fmt(Math.round(p.avances))} FCFA` : "—",   "text-red-400"],
          ["Dettes / manquants",        p.manquants > 0 ? `-${fmt(p.manquants)} FCFA` : "—",            "text-red-400"],
        ].map(([l, v, c]) => (
          <div key={l} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
            <span className="text-slate-500 text-sm">{l}</span>
            <span className={`font-semibold text-sm ${c}`}>{v}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3">
          <span className="text-slate-300 font-bold text-base">NET A PAYER</span>
          <span className={`text-2xl font-bold ${p.net >= 0 ? "text-white" : "text-red-400"}`}>{fmt(Math.round(p.net))} FCFA</span>
        </div>
      </div>
    </div>
  );
};
