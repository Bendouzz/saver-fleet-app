import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Badge } from "../components/ui/Badge.jsx";
import { fmt } from "../utils/formatters.js";
// fmtK is defined inline below
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"M" : n >= 1000 ? Math.round(n/1000)+"k" : (n||0).toString();

export const KpiPaiePage = ({drivers, shifts, reversements}) => {
  const FIXE_JOURNALIER = 5357; // F CFA par jour (modifiable)
  const KPI_RECETTES = 25000; // par shift de 8h
  const KPI_COURSES = 12; // par shift
  const BONUS_MAX = 25000;

  const [periodeDebut, setPeriodeDebut] = useState("");
  const [periodeFin, setPeriodeFin] = useState("");

  const calcPaie = (d) => {
    const dId = String(d.id||"").trim();
    const dCode = String(d.matricule||d.driver_code||"").trim();
    const shiftsDriver = shifts.filter(s=>{
      const sCh = String(s.ch||s.driver_id||"").trim();
      return (s.status==="Terminé"||s.status==="Termine") && sCh && dId && (sCh===dId||(dCode&&sCh===dCode));
    });
    const joursTravailes = shiftsDriver.length;
    const salaireBase = joursTravailes * FIXE_JOURNALIER;
    // Recettes depuis reversements (source fiable) ou shifts en fallback
    const revFromRevs = (reversements||[]).filter(r=>{
      const rCh = String(r.ch||r.driver_id||"").trim();
      return rCh && dId && (rCh===dId||(dCode&&rCh===dCode));
    }).reduce((a,r)=>a+(parseFloat(r.montant)||0),0);
    const revFromShifts = shiftsDriver.reduce((a,s)=>a+(parseFloat(s.revenue_cash)||parseFloat(s.revenusGeneres)||parseFloat(s.recette)||0),0);
    const totalRevBrut = revFromRevs > 0 ? revFromRevs : revFromShifts;
    const totalCommission = shiftsDriver.reduce((a,s)=>a+(s.yango_commission||s.commissionYango||0),0);
    const totalRecettesNettes = Math.max(0, totalRevBrut - totalCommission);

    const objectifRecettes = joursTravailes * KPI_RECETTES;
    const surplus = Math.max(0, totalRecettesNettes - objectifRecettes);

    const totalCourses = shiftsDriver.reduce((a,s)=>a+(s.courses_count||s.nbCourses||0),0);
    const objectifCourses = joursTravailes * KPI_COURSES;
    const coursesSup = Math.max(0, totalCourses - objectifCourses);

    // Paliers bonus
    let palierPct = 0;
    if(coursesSup>=36) palierPct=0.75;
    else if(coursesSup>=26) palierPct=0.50;
    else if(coursesSup>=20) palierPct=0.35;
    else if(coursesSup>=11) palierPct=0.25;
    else if(coursesSup>=1) palierPct=0.10;

    const bonusBrut = surplus * palierPct;
    const bonus = Math.min(bonusBrut, BONUS_MAX);

    const avances = d.avance||0;
    const manquants = d.dettes||0;

    const net = salaireBase + bonus - avances - manquants;

    return { d, joursTravailes, salaireBase, totalRecettesNettes, objectifRecettes, surplus, totalCourses, objectifCourses, coursesSup, palierPct, bonus, avances, manquants, net };
  };

  // Filtrer les shifts par periode
  const shiftsFiltres = (periodeDebut && periodeFin)
    ? shifts.filter(s => {
        const d = s.planned_start_date||s.date||"";
        return d >= periodeDebut && d <= periodeFin;
      })
    : shifts;

  const calcPaieFiltre = (d) => {
    const dId = String(d.id||"").trim();
    const dCode = String(d.matricule||d.driver_code||"").trim();
    const shiftsDriver = shiftsFiltres.filter(s=>{
      const sCh = String(s.ch||s.driver_id||"").trim();
      return (s.status==="Terminé"||s.status==="Termine") && sCh && dId && (sCh===dId||(dCode&&sCh===dCode));
    });
    const joursTravailes = shiftsDriver.length;
    const salaireBase = joursTravailes * FIXE_JOURNALIER;
    // Filtrer reversements sur la même période
    const revsFiltres = (reversements||[]).filter(r=>{
      const rCh = String(r.ch||r.driver_id||"").trim();
      const rDate = r.date||"";
      const inPeriod = (!periodeDebut && !periodeFin) || (rDate >= periodeDebut && rDate <= periodeFin);
      return inPeriod && rCh && dId && (rCh===dId||(dCode&&rCh===dCode));
    });
    const revFromRevs = revsFiltres.reduce((a,r)=>a+(parseFloat(r.montant)||0),0);
    const revFromShifts = shiftsDriver.reduce((a,s)=>a+(parseFloat(s.revenue_cash)||parseFloat(s.revenusGeneres)||parseFloat(s.recette)||0),0);
    const totalRevBrut = revFromRevs > 0 ? revFromRevs : revFromShifts;
    const totalCommission = shiftsDriver.reduce((a,s)=>a+(s.yango_commission||s.commissionYango||0),0);
    const totalRecettesNettes = Math.max(0, totalRevBrut - totalCommission);
    const objectifRecettes = joursTravailes * KPI_RECETTES;
    const surplus = Math.max(0, totalRecettesNettes - objectifRecettes);
    const totalCourses = shiftsDriver.reduce((a,s)=>a+(s.courses_count||s.nbCourses||0),0);
    const objectifCourses = joursTravailes * KPI_COURSES;
    const coursesSup = Math.max(0, totalCourses - objectifCourses);
    let palierPct = 0;
    if(coursesSup>=36) palierPct=0.75;
    else if(coursesSup>=26) palierPct=0.50;
    else if(coursesSup>=20) palierPct=0.35;
    else if(coursesSup>=11) palierPct=0.25;
    else if(coursesSup>=1) palierPct=0.10;
    const bonusBrut = surplus * palierPct;
    const bonus = Math.min(bonusBrut, BONUS_MAX);
    const avances = shiftsDriver.reduce((a,s)=>a+(s.authorized_expenses||0),0);
    const manquants = d.dettes||0;
    const net = salaireBase + bonus - avances - manquants;
    return { d, joursTravailes, salaireBase, totalRecettesNettes, objectifRecettes, surplus, totalCourses, objectifCourses, coursesSup, palierPct, bonus, avances, manquants, net };
  };

  const paies = drivers.filter(d=>d.status==="Actif").map(calcPaieFiltre);

  const exportExcelTD01 = () => {
    const wb = XLSX.utils.book_new();

    // ---- Feuille 1 : Setup ----
    const setupData = [
      ["PARAMETRES (modifiable en bleu)", "", "", ""],
      ["Periode de paie", "", "", ""],
      ["Date debut", periodeDebut||"", "Date fin", periodeFin||""],
      ["Nb semaines KPI dans la periode", 2, "", ""],
      ["Parametre", "Valeur", "Unite / note", ""],
      ["Commission Yango+partenaires", 0.1836, "% du brut encaisse", ""],
      ["KPI recette par shift", KPI_RECETTES, "FCFA / shift (8h)", ""],
      ["KPI commandes par shift", KPI_COURSES, "commandes / shift", ""],
      ["Shifts KPI par semaine", 7, "ex: 7 shifts = 161k/semaine", ""],
      ["Heures par shift", 8, "heures", ""],
      ["Tarif journalier par defaut", FIXE_JOURNALIER, "FCFA / jour", ""],
    ];
    const wsSetup = XLSX.utils.aoa_to_sheet(setupData);
    XLSX.utils.book_append_sheet(wb, wsSetup, "Setup");

    // ---- Feuille 2 : Drivers ----
    const driversData = [
      ["LISTE CHAUFFEURS", "", "", "", "", ""],
      ["Driver_ID", "Nom", "Tarif journalier (FCFA)", "Notes", "Actif (Oui/Non)", "Matricule"],
      ...paies.map(({d}) => [
        d.id, d.prenom+" "+d.nom, FIXE_JOURNALIER,
        "", d.status==="Actif"?"Oui":"Non", d.matricule||d.driver_code||""
      ])
    ];
    const wsDrivers = XLSX.utils.aoa_to_sheet(driversData);
    XLSX.utils.book_append_sheet(wb, wsDrivers, "Drivers");

    // ---- Feuille 3 : Daily_Data ----
    const dailyHeader = ["Date", "Driver_ID", "Shifts", "Heures", "Recettes especes versees (FCFA)", "Commandes", "Avance versee (FCFA)", "Manquant constate (FCFA)", "Commentaire"];
    const dailyRows = shiftsFiltres
      .filter(s => s.status==="Terminé"||s.status==="Termine")
      .map(s => {
        // Chercher le reversement correspondant à ce shift (même chauffeur, même date)
        const shiftDate = s.planned_start_date||s.date||"";
        const rev = (reversements||[]).find(r => {
          const rCh = String(r.ch||r.driver_id||"").trim();
          const sCh = String(s.ch||"").trim();
          return rCh === sCh && r.date === shiftDate;
        });
        const recette = rev ? (parseFloat(rev.montant)||0) : (parseFloat(s.revenue_cash)||parseFloat(s.recette)||0);
        return [shiftDate, s.ch||"", 1, 8, recette, s.courses_count||s.nbCourses||0, s.authorized_expenses||0, 0, ""];
      });
    const wsDailyData = XLSX.utils.aoa_to_sheet([dailyHeader, ...dailyRows]);
    XLSX.utils.book_append_sheet(wb, wsDailyData, "Daily_Data");

    // ---- Feuille 4 : Payroll ----
    const payrollHeader = [
      "Driver_ID", "Nom", "Tarif/jour", "Jours (comptes)", "Salaire base",
      "Shifts total", "Recettes especes versees", "Net apres commission",
      "KPI recettes (periode)", "Surplus", "Commandes", "KPI commandes (periode)",
      "Cmd +", "% bonus chauffeur", "Bonus chauffeur",
      "Avances periode", "Manquant total", "NET A PAYER"
    ];
    const payrollRows = paies.map(({d, joursTravailes, salaireBase, totalRecettesNettes, objectifRecettes, surplus, totalCourses, objectifCourses, coursesSup, palierPct, bonus, avances, manquants, net}) => [
      d.id,
      d.prenom+" "+d.nom,
      FIXE_JOURNALIER,
      joursTravailes,
      salaireBase,
      joursTravailes,
      Math.round(totalRecettesNettes),
      Math.round(totalRecettesNettes),
      objectifRecettes,
      Math.round(surplus),
      totalCourses,
      objectifCourses,
      coursesSup,
      Math.round(palierPct*100)+"%",
      Math.round(bonus),
      Math.round(avances),
      Math.round(manquants),
      Math.round(net),
    ]);
    const wsPayroll = XLSX.utils.aoa_to_sheet([payrollHeader, ...payrollRows]);
    XLSX.utils.book_append_sheet(wb, wsPayroll, "Payroll");

    // Export
    const periode = periodeDebut&&periodeFin ? `_${periodeDebut}_au_${periodeFin}` : "";
    XLSX.writeFile(wb, `Paie_EasyBySaver${periode}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">KPI, Paie et Incentives</h1>
        <button onClick={exportExcelTD01} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 shadow-md">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Exporter Excel (TD01)
        </button>
      </div>

      {/* Filtre periode */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-4 flex flex-wrap items-center gap-4">
        <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Periode de calcul :</div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Du</label>
          <input type="date" value={periodeDebut} onChange={e=>setPeriodeDebut(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Au</label>
          <input type="date" value={periodeFin} onChange={e=>setPeriodeFin(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
        </div>
        {(periodeDebut||periodeFin)&&<button onClick={()=>{setPeriodeDebut("");setPeriodeFin("");}} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">Effacer</button>}
        <div className="ml-auto text-xs text-slate-400">{paies.length} chauffeur(s) actifs · {shiftsFiltres.filter(s=>s.status==="Terminé"||s.status==="Termine").length} shifts termines</div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Regles de remuneration SAVER</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-emerald-50 rounded-xl"><div className="font-semibold text-emerald-800">Fixe journalier</div><div className="text-emerald-700">{fmt(FIXE_JOURNALIER)} / jour</div></div>
          <div className="p-4 bg-blue-50 rounded-xl"><div className="font-semibold text-blue-800">KPI Recettes</div><div className="text-blue-700">{fmt(KPI_RECETTES)} / shift</div></div>
          <div className="p-4 bg-violet-50 rounded-xl"><div className="font-semibold text-violet-800">KPI Courses</div><div className="text-violet-700">{KPI_COURSES} courses / shift</div></div>
          <div className="p-4 bg-amber-50 rounded-xl"><div className="font-semibold text-amber-800">Bonus max</div><div className="text-amber-700">{fmt(BONUS_MAX)}</div></div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2">Paliers de bonus (courses supplementaires)</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[[1,10,"10%"],[11,19,"25%"],[20,25,"35%"],[26,35,"50%"],[36,"...","75%"]].map(([min,max,pct])=>(
              <div key={min} className="bg-white border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg"><span className="text-slate-600 dark:text-slate-400">{min}-{max} courses</span> → <span className="font-semibold text-blue-600">{pct} du surplus</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">Fiche de paie (calcul automatique)</h2>
          <span className="text-xs text-slate-400">{paies.length} chauffeur(s)</span>
        </div>
        {paies.length===0?<div className="text-center text-slate-400 py-8">Ajoutez des chauffeurs et des shifts pour voir la paie</div>:(
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Chauffeur</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Jours</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Courses sup.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Surplus</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Palier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Base</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Bonus</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Deductions</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">NET</th>
              </tr></thead>
              <tbody>
                {paies.map(({d,joursTravailes,salaireBase,surplus,coursesSup,palierPct,bonus,avances,manquants,net})=>(
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">{d.prenom} {d.nom}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">{joursTravailes}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">{coursesSup}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">{fmtK(surplus)} F</td>
                    <td className="px-4 py-3 text-sm text-right"><span className={"px-2 py-0.5 rounded-full text-xs font-semibold "+(palierPct>=0.5?"bg-emerald-100 text-emerald-700":palierPct>0?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500 dark:text-slate-400")}>{Math.round(palierPct*100)}%</span></td>
                    <td className="px-4 py-3 text-sm text-right">{fmt(salaireBase)}</td>
                    <td className="px-4 py-3 text-sm text-right text-emerald-600">{bonus>0?fmt(bonus):"—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{(avances+manquants)>0?"-"+fmt(avances+manquants):"—"}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold">{net>=0?<span className="text-emerald-700">{fmt(net)}</span>:<span className="text-red-700">{fmt(net)}</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-slate-50 font-semibold">
                <td className="px-4 py-3 text-sm">TOTAL</td>
                <td className="px-4 py-3 text-sm text-right">{paies.reduce((a,p)=>a+p.joursTravailes,0)}</td>
                <td colSpan={3}></td>
                <td className="px-4 py-3 text-sm text-right">{fmt(paies.reduce((a,p)=>a+p.salaireBase,0))}</td>
                <td className="px-4 py-3 text-sm text-right text-emerald-600">{fmt(paies.reduce((a,p)=>a+p.bonus,0))}</td>
                <td className="px-4 py-3 text-sm text-right text-red-600">-{fmt(paies.reduce((a,p)=>a+p.avances+p.manquants,0))}</td>
                <td className="px-4 py-3 text-sm text-right font-bold text-blue-700">{fmt(paies.reduce((a,p)=>a+p.net,0))}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

