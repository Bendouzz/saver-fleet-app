import { useState } from "react";
import * as XLSX from "xlsx";
import { fmt } from "../utils/formatters.js";
import { StatCard } from "../components/ui/StatCard.jsx";
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"M" : n >= 1000 ? Math.round(n/1000)+"k" : (n||0).toString();

export const ReportingPage = ({vehicles, drivers, recharges, maintenances, shifts, reversements}) => {
  const totalCA = drivers.reduce((a,d)=>a+(d.ca||0),0);
  const totalCourses = drivers.reduce((a,d)=>a+(d.courses||0),0);
  const totalRecharge = recharges.reduce((a,r)=>a+(r.cout||0),0);
  const totalMaint = maintenances.reduce((a,m)=>a+(m.cout||0),0);

  const exportCSV = (data, filename) => {
    if(!data.length) return alert("Aucune donnee a exporter");
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r=>Object.values(r).map(v=>String(v).includes(",")?'"'+v+'"':v).join(",")).join("\\n");
    const blob = new Blob([headers+"\\n"+rows],{type:"text/csv;charset=utf-8"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  };

  const exportPDF = (title, rows, headers) => {
    const w = window.open("","_blank");
    const tableRows = rows.map(r=>`<tr>${r.map(c=>`<td style="padding:8px;border:1px solid #e2e8f0;font-size:12px">${c}</td>`).join("")}</tr>`).join("");
    w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1e40af;color:white;padding:8px;font-size:12px}h1{color:#1e293b}</style></head><body><h1>${title}</h1><p style="color:#64748b;font-size:12px">Easy by Saver · ${new Date().toLocaleDateString("fr-FR")}</p><table><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>${tableRows}</table></body></html>`);
    w.document.close(); w.print();
  };

  const rapports = [
    {label:"Recettes par chauffeur",desc:"CA, courses, KPI",onCSV:()=>exportCSV(drivers.map(d=>({Nom:d.nom,Prenom:d.prenom,CA:d.ca||0,Courses:d.courses||0,KPI:d.kpi||0,Statut:d.status})),"recettes.csv"),onPDF:()=>exportPDF("Recettes par chauffeur",drivers.map(d=>[d.prenom+" "+d.nom,(d.ca||0)+" F",d.courses||0,d.kpi+"%",d.status]),["Chauffeur","CA","Courses","KPI","Statut"])},
    {label:"Reversements",desc:"Historique des versements",onCSV:()=>exportCSV(reversements.map(r=>({Chauffeur:r.ch,Montant:r.montant||0,Canal:r.canal,Date:r.date,Statut:r.status,Ecart:r.ecart||0})),"reversements.csv"),onPDF:()=>exportPDF("Reversements",reversements.map(r=>[r.ch,(r.montant||0)+" F",r.canal,r.date,r.status,(r.ecart||0)+" F"]),["Chauffeur","Montant","Canal","Date","Statut","Ecart"])},
    {label:"Recharges EV",desc:"kWh et couts",onCSV:()=>exportCSV(recharges.map(r=>({VH:r.vh,kWh:r.kWh||0,Cout:r.cout||0,Lieu:r.partenaire||r.lieu,Date:r.date})),"recharges.csv"),onPDF:()=>exportPDF("Recharges EV",recharges.map(r=>[r.vh,(r.kWh||0)+" kWh",(r.cout||0)+" F",r.partenaire||r.lieu||"",r.date]),["Vehicule","kWh","Cout","Lieu","Date"])},
    {label:"Maintenances",desc:"Interventions et couts",onCSV:()=>exportCSV(maintenances.map(m=>({VH:m.vh,Type:m.type,Description:m.desc||m.description,Cout:m.cout||0,Statut:m.status,Date:m.date})),"maintenances.csv"),onPDF:()=>exportPDF("Maintenances",maintenances.map(m=>[m.vh,m.type,m.desc||m.description||"",(m.cout||0)+" F",m.status,m.date||""]),["VH","Type","Description","Cout","Statut","Date"])},
    {label:"Flotte vehicules",desc:"Etat et documents",onCSV:()=>exportCSV(vehicles.map(v=>({Immat:v.immat,Modele:v.modele,SOC:v.soc||0,Km:v.km||0,Statut:v.status})),"flotte.csv"),onPDF:()=>exportPDF("Flotte vehicules",vehicles.map(v=>[v.immat,v.modele,(v.soc||0)+"%",(v.km||0)+" km",v.status]),["Immat","Modele","SOC","Km","Statut"])},
    {label:"Planning shifts",desc:"Historique des shifts",onCSV:()=>exportCSV(shifts.map(s=>({VH:s.vh,Chauffeur:s.ch,Type:s.type,Date:s.date,Recette:s.recette||0,Statut:s.status})),"shifts.csv"),onPDF:()=>exportPDF("Planning shifts",shifts.map(s=>[s.vh,s.ch,"Shift "+s.type,s.date||"",(s.recette||0)+" F",s.status]),["VH","Chauffeur","Type","Date","Recette","Statut"])},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reporting et Exports</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="CA cumule" value={fmtK(totalCA)+" F"} color="text-emerald-600"/>
        <StatCard label="Courses totales" value={totalCourses.toLocaleString()} color="text-blue-600"/>
        <StatCard label="Cout recharge" value={fmtK(totalRecharge)+" F"} color="text-amber-600"/>
        <StatCard label="Cout maintenance" value={fmtK(totalMaint)+" F"} color="text-red-600"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">P&L par vehicule</h2>
          {vehicles.length===0?<p className="text-slate-400 text-sm">Aucun vehicule</p>:vehicles.map(v=>{
            const vCA=drivers.filter(d=>d.vehicule===v.id).reduce((a,d)=>a+(d.ca||0),0);
            const vRecharge=recharges.filter(r=>r.vh===v.id).reduce((a,r)=>a+(r.cout||0),0);
            const vMaint=maintenances.filter(m=>m.vh===v.id).reduce((a,m)=>a+(m.cout||0),0);
            return (
              <div key={v.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <div><div className="font-medium text-sm">{v.immat}</div><div className="text-xs text-slate-400">{v.modele}</div></div>
                <div className="text-right text-xs"><div className="text-emerald-600 font-medium">CA: {fmtK(vCA)} F</div><div className="text-slate-500 dark:text-slate-400">Couts: {fmtK(vRecharge+vMaint)} F</div><div className="font-bold text-blue-700">Marge: {fmtK(vCA-vRecharge-vMaint)} F</div></div>
              </div>
            );
          })}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Rapports disponibles</h2>
          <div className="space-y-3">
            {rapports.map(r=>(
              <div key={r.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div><div className="font-medium text-sm text-slate-700 dark:text-slate-300">{r.label}</div><div className="text-xs text-slate-400">{r.desc}</div></div>
                <div className="flex gap-2">
                  <button onClick={r.onCSV} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700">CSV</button>
                  <button onClick={r.onPDF} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

