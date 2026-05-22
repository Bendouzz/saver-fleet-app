// ReportingPage.jsx — Easy by Saver · Dark theme Tailwind
import { useState } from "react";
import * as XLSX from "xlsx";
import { fmt } from "../utils/formatters.js";

const fmtK = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? Math.round(n / 1_000) + "k" : (n || 0).toString();

export const ReportingPage = ({ vehicles = [], drivers = [], recharges = [], maintenances = [], shifts = [], reversements = [] }) => {
  const [activeSection, setActiveSection] = useState("synthese");

  const totalCA       = drivers.reduce((a, d) => a + (d.ca || 0), 0);
  const totalCourses  = drivers.reduce((a, d) => a + (d.courses || 0), 0);
  const totalRecharge = recharges.reduce((a, r) => a + (r.cout || 0), 0);
  const totalMaint    = maintenances.reduce((a, m) => a + (m.cout || 0), 0);
  const totalRev      = reversements.reduce((a, r) => a + (r.montant || 0), 0);
  const marge         = totalCA - totalRecharge - totalMaint;

  // ─── EXPORT CSV ─────────────────────────────────────────────────────────────
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows    = data.map(r => Object.values(r).map(v => String(v).includes(",") ? `"${v}"` : v).join(",")).join("\n");
    const blob    = new Blob([headers + "\n" + rows], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  // ─── EXPORT PDF ─────────────────────────────────────────────────────────────
  const exportPDF = (title, rows, headers) => {
    const w = window.open("", "_blank");
    const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="padding:8px;border:1px solid #e2e8f0;font-size:12px">${c}</td>`).join("")}</tr>`).join("");
    w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:white;padding:8px;font-size:12px}h1{color:#1e293b}</style></head><body><h1>${title}</h1><p style="color:#64748b;font-size:12px">Easy by Saver · ${new Date().toLocaleDateString("fr-FR")}</p><table><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>${tableRows}</table></body></html>`);
    w.document.close(); w.print();
  };

  // ─── RAPPORTS ────────────────────────────────────────────────────────────────
  const rapports = [
    {
      label: "Recettes par chauffeur", desc: "CA, courses, KPI",
      icon: "text-green-400",
      onCSV: () => exportCSV(drivers.map(d => ({ Nom: d.nom, Prenom: d.prenom, CA: d.ca || 0, Courses: d.courses || 0, KPI: d.kpi || 0, Statut: d.status })), "recettes.csv"),
      onPDF: () => exportPDF("Recettes par chauffeur", drivers.map(d => [d.prenom + " " + d.nom, (d.ca || 0) + " F", d.courses || 0, (d.kpi || 0) + "%", d.status]), ["Chauffeur", "CA", "Courses", "KPI", "Statut"]),
    },
    {
      label: "Reversements", desc: "Historique des versements",
      icon: "text-blue-400",
      onCSV: () => exportCSV(reversements.map(r => ({ Chauffeur: r.ch, Montant: r.montant || 0, Canal: r.canal, Date: r.date, Statut: r.status, Ecart: r.ecart || 0 })), "reversements.csv"),
      onPDF: () => exportPDF("Reversements", reversements.map(r => [r.ch, (r.montant || 0) + " F", r.canal, r.date, r.status, (r.ecart || 0) + " F"]), ["Chauffeur", "Montant", "Canal", "Date", "Statut", "Ecart"]),
    },
    {
      label: "Recharges EV", desc: "kWh et coûts",
      icon: "text-emerald-400",
      onCSV: () => exportCSV(recharges.map(r => ({ VH: r.vh, kWh: r.kWh || r.kwh || 0, Cout: r.cout || 0, Lieu: r.partenaire || r.lieu, Date: r.date })), "recharges.csv"),
      onPDF: () => exportPDF("Recharges EV", recharges.map(r => [r.vh, (r.kWh || r.kwh || 0) + " kWh", (r.cout || 0) + " F", r.partenaire || r.lieu || "", r.date]), ["Vehicule", "kWh", "Cout", "Lieu", "Date"]),
    },
    {
      label: "Maintenances", desc: "Interventions et coûts",
      icon: "text-amber-400",
      onCSV: () => exportCSV(maintenances.map(m => ({ VH: m.vh, Type: m.type, Description: m.desc || m.description, Cout: m.cout || 0, Statut: m.status, Date: m.date })), "maintenances.csv"),
      onPDF: () => exportPDF("Maintenances", maintenances.map(m => [m.vh, m.type, m.desc || m.description || "", (m.cout || 0) + " F", m.status, m.date || ""]), ["VH", "Type", "Description", "Cout", "Statut", "Date"]),
    },
    {
      label: "Flotte véhicules", desc: "État et documents",
      icon: "text-violet-400",
      onCSV: () => exportCSV(vehicles.map(v => ({ Immat: v.immat, Modele: v.modele, SOC: v.soc || 0, Km: v.km || 0, Statut: v.status })), "flotte.csv"),
      onPDF: () => exportPDF("Flotte vehicules", vehicles.map(v => [v.immat, v.modele, (v.soc || 0) + "%", (v.km || 0) + " km", v.status]), ["Immat", "Modele", "SOC", "Km", "Statut"]),
    },
    {
      label: "Planning shifts", desc: "Historique complet",
      icon: "text-slate-400",
      onCSV: () => exportCSV(shifts.map(s => ({ VH: s.vh, Chauffeur: s.ch, Type: s.type, Date: s.planned_start_date || s.date, Recette: s.revenue_cash || s.recette || 0, Statut: s.status })), "shifts.csv"),
      onPDF: () => exportPDF("Planning shifts", shifts.map(s => [s.vh, s.ch, "Shift " + s.type, s.planned_start_date || s.date || "", (s.revenue_cash || s.recette || 0) + " F", s.status]), ["VH", "Chauffeur", "Type", "Date", "Recette", "Statut"]),
    },
  ];

  const SECTIONS = [
    { id: "synthese",  label: "Synthèse" },
    { id: "pl",        label: "P&L Véhicules" },
    { id: "exports",   label: "Exports" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Reporting & Exports</h1>
        <div className="flex gap-1 mt-3">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeSection === s.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── SYNTHÈSE ────────────────────────────────────────────────────── */}
        {activeSection === "synthese" && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ["CA total",         fmtK(totalCA) + " FCFA",    "text-green-400",  "bg-green-900/40"],
                ["Courses totales",  totalCourses.toLocaleString(),"text-blue-400",  "bg-blue-900/40"],
                ["Reversements",     fmtK(totalRev) + " FCFA",   "text-violet-400", "bg-violet-900/40"],
                ["Coût recharges",   fmtK(totalRecharge) + " F", "text-amber-400",  "bg-amber-900/40"],
                ["Coût maintenance", fmtK(totalMaint) + " F",    "text-red-400",    "bg-red-900/40"],
                ["Marge brute",      fmtK(marge) + " FCFA",      marge >= 0 ? "text-green-400" : "text-red-400", "bg-slate-700/60"],
              ].map(([l, v, col, bg]) => (
                <div key={l} className={`${bg} rounded-xl p-4 border border-slate-700`}>
                  <div className={`text-xl font-bold ${col}`}>{v}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{l}</div>
                </div>
              ))}
            </div>

            {/* Top chauffeurs */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700">
                <div className="font-semibold text-white text-sm">Top chauffeurs par CA</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/30">
                      {["#", "Chauffeur", "CA (FCFA)", "Courses", "KPI", "Statut"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...drivers].sort((a, b) => (b.ca || 0) - (a.ca || 0)).slice(0, 10).map((d, i) => (
                      <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="px-4 py-3 text-sm text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">{d.prenom} {d.nom}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-400">{fmt(d.ca || 0)}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{(d.courses || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-blue-400">{d.kpi || 0}%</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === "Actif" ? "bg-green-900/60 text-green-400 border border-green-800" : "bg-slate-700 text-slate-400"}`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                    {drivers.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-sm">Aucun chauffeur</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── P&L ─────────────────────────────────────────────────────────── */}
        {activeSection === "pl" && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <div className="font-semibold text-white text-sm">P&L par véhicule</div>
              <div className="text-[11px] text-slate-500 mt-0.5">CA − (recharges + maintenance)</div>
            </div>
            {vehicles.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">Aucun véhicule</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/30">
                      {["Véhicule", "CA", "Recharges", "Maintenance", "Coûts tot.", "Marge"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => {
                      const vCA      = drivers.filter(d => d.vehicule === v.id).reduce((a, d) => a + (d.ca || 0), 0);
                      const vRech    = recharges.filter(r => r.vh === v.id).reduce((a, r) => a + (r.cout || 0), 0);
                      const vMaint   = maintenances.filter(m => m.vh === v.id).reduce((a, m) => a + (m.cout || 0), 0);
                      const vCouts   = vRech + vMaint;
                      const vMarge   = vCA - vCouts;
                      return (
                        <tr key={v.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white text-sm">{v.immat}</div>
                            <div className="text-[11px] text-slate-500">{v.modele}</div>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-400">{fmtK(vCA)} F</td>
                          <td className="px-4 py-3 text-sm text-amber-400">{fmtK(vRech)} F</td>
                          <td className="px-4 py-3 text-sm text-red-400">{fmtK(vMaint)} F</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{fmtK(vCouts)} F</td>
                          <td className="px-4 py-3 text-sm font-bold">
                            <span className={vMarge >= 0 ? "text-green-400" : "text-red-400"}>{fmtK(vMarge)} F</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-600 bg-slate-900/50">
                      <td className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">TOTAL</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-400">{fmtK(totalCA)} F</td>
                      <td className="px-4 py-3 text-sm font-bold text-amber-400">{fmtK(totalRecharge)} F</td>
                      <td className="px-4 py-3 text-sm font-bold text-red-400">{fmtK(totalMaint)} F</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-400">{fmtK(totalRecharge + totalMaint)} F</td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={marge >= 0 ? "text-green-400" : "text-red-400"}>{fmtK(marge)} F</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── EXPORTS ─────────────────────────────────────────────────────── */}
        {activeSection === "exports" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rapports.map(r => (
              <div key={r.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className={`font-semibold text-sm text-white`}>{r.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{r.desc}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={r.onCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    CSV
                  </button>
                  <button onClick={r.onPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs rounded-lg font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
