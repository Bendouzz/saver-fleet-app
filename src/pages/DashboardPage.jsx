import { useState } from "react";
import { fmt, fmtK } from "../utils/formatters.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export const DashboardPage = ({vehicles, drivers, shifts, reversements, user}) => {
  const role = user?.role || "ops";
  const [periode, setPeriode] = useState("tout");

  // Selectors pour chaque mode
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [weekOffset, setWeekOffset] = useState(0);   // 0 = semaine actuelle, -1 = semaine precedente...
  const [monthOffset, setMonthOffset] = useState(0); // 0 = mois actuel

  // Calcul bornes semaine selectionnee
  const getWeekBounds = (offset) => {
    const now = new Date();
    const day = now.getDay(); // 0=dim,1=lun...
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day===0?6:day-1) + offset*7);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate()+6);
    sunday.setHours(23,59,59,999);
    return { start: monday, end: sunday };
  };

  // Calcul bornes mois selectionne
  const getMonthBounds = (offset) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth()+offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth()+offset+1, 0, 23, 59, 59, 999);
    return { start, end };
  };

  // Labels lisibles
  const weekBounds = getWeekBounds(weekOffset);
  const monthBounds = getMonthBounds(monthOffset);
  const weekLabel = weekBounds.start.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})+" – "+weekBounds.end.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
  const monthLabel = monthBounds.start.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});

  // Recharts est importe en haut du fichier

  // Filtre generique
  const applyFilter = (dateObj) => {
    if(!dateObj || isNaN(dateObj)) return periode==="tout";
    if(periode==="jour") return dateObj.toDateString()===new Date(selectedDay).toDateString();
    if(periode==="semaine") return dateObj>=weekBounds.start && dateObj<=weekBounds.end;
    if(periode==="mois") return dateObj>=monthBounds.start && dateObj<=monthBounds.end;
    return true;
  };
  const filteredShifts = shifts.filter(s => applyFilter(new Date(s.date||s.planned_start_date||"")));
  const filteredReversements = reversements.filter(r => applyFilter(new Date(r.date||"")));

  // Stats
  const activeVh = vehicles.filter(v=>v.status==="En exploitation").length;
  const enRechargeVh = vehicles.filter(v=>v.status==="En recharge").length;
  const immobiliseVh = vehicles.filter(v=>v.status==="Immobilise"||v.status==="Immobilisé"||v.status==="Maintenance").length;
  const avgSoc = vehicles.length > 0 ? Math.round(vehicles.reduce((a,v)=>a+(v.soc||0),0)/vehicles.length) : 0;
  const shiftEnCours = filteredShifts.filter(s=>s.status==="En cours").length;
  const shiftPlanifie = filteredShifts.filter(s=>s.status==="Planifie"||s.status==="Planifié").length;
  const shiftTermine = filteredShifts.filter(s=>s.status==="Terminé"||s.status==="Termine").length;
  const totalDrivers = drivers.filter(d=>d.status==="Actif").length;
  const totalReverse = filteredReversements.filter(r=>r.status==="Validé"||r.status==="Valide").reduce((a,r)=>a+(r.montant||0),0);
  const reversementsEnAttente = filteredReversements.filter(r=>r.status==="En attente").length;
  const totalRecette = filteredReversements.reduce((a,r)=>a+(r.montant||0),0);
  const ecarts = filteredReversements.filter(r=>(r.ecart||0)>0).length;
  // Top chauffeurs - CA depuis reversements (données réelles) ou shifts en fallback
  const driverRevenues = drivers.map(d => {
    const dId = String(d.id||"").trim();
    const dCode = String(d.matricule||d.driver_code||"").trim();
    // 1. Reversements = source la plus fiable (montants réellement collectés)
    const driverRevs = reversements.filter(r => {
      const rCh = String(r.ch||r.driver_id||"").trim();
      return rCh && dId && (rCh === dId || (dCode && rCh === dCode));
    });
    const caFromRevs = driverRevs.reduce((a,r) => a + (parseFloat(r.montant)||0), 0);
    // 2. Fallback: shifts avec recette saisie
    const driverShifts = shifts.filter(s => {
      const sCh = String(s.ch||s.driver_id||"").trim();
      return sCh && dId && (sCh === dId || (dCode && sCh === dCode));
    });
    const caFromShifts = driverShifts.reduce((a,s) => a + (parseFloat(s.revenue_cash)||parseFloat(s.revenusGeneres)||parseFloat(s.recette)||0), 0);
    // 3. Fallback final: colonne ca statique du driver
    const realCA = caFromRevs > 0 ? caFromRevs : (caFromShifts > 0 ? caFromShifts : (parseFloat(d.ca)||0));
    return { ...d, realCA };
  });
  const topDrivers = driverRevenues.sort((a,b) => b.realCA - a.realCA).slice(0,5);
  const ddManquants = filteredShifts.filter(s=>(s.status==="Terminé"||s.status==="Termine")&&!(s.courses_count>0||s.nbCourses>0)).length;

  // Alertes
  const alertesVh = vehicles.filter(v=>{
    const now = new Date();
    const assOk = v.assuranceFin&&Math.floor((new Date(v.assuranceFin)-now)/86400000)<=7;
    const vtOk = v.visiteDate&&Math.floor((new Date(v.visiteDate)-now)/86400000)<=15;
    return assOk||vtOk;
  });
  const alertesCh = drivers.filter(d=>{
    const now = new Date();
    const permis = d.permisExpiration&&Math.floor((new Date(d.permisExpiration)-now)/86400000)<=30;
    const piece = d.pieceExpiration&&Math.floor((new Date(d.pieceExpiration)-now)/86400000)<=30;
    return permis||piece;
  });
  const today = new Date().toISOString().split("T")[0];
  const shiftsAujourdhui = filteredShifts.filter(s=>(s.date||s.planned_start_date||"").startsWith(today));

  // Données graphiques - activité 7 derniers jours
  // Recettes = reversements de la journée (données réelles) ou recettes shifts en fallback
  const last7Days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const dayShifts = shifts.filter(s=>{
      const shiftDate = new Date(s.date||s.planned_start_date||"");
      return shiftDate.toDateString() === d.toDateString();
    });
    const dayRevs = reversements.filter(r=>{
      const rd = new Date(r.date||"");
      return rd.toDateString() === d.toDateString();
    });
    const recettesRevs = dayRevs.reduce((a,r)=>a+(parseFloat(r.montant)||0),0);
    const recettesShifts = dayShifts.reduce((a,s)=>a+(parseFloat(s.revenue_cash)||parseFloat(s.recette)||0),0);
    const recettes = recettesRevs > 0 ? recettesRevs : recettesShifts;
    return { jour: d.toLocaleDateString("fr-FR",{weekday:"short", day:"numeric"}), recettes, shifts: dayShifts.length };
  });

  // Données graphiques - reversements 7 derniers jours
  const last7DaysRev = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const dayRevs = reversements.filter(r=>{
      const rd = new Date(r.date||"");
      return rd.toDateString() === d.toDateString();
    });
    const montantTotal = dayRevs.reduce((a,r)=>a+(parseFloat(r.montant)||0),0);
    const valides = dayRevs.filter(r=>r.status==="Validé"||r.status==="Valide").length;
    return { jour: d.toLocaleDateString("fr-FR",{weekday:"short", day:"numeric"}), montant: montantTotal, total: dayRevs.length, valides };
  });

  // Répartition shifts A/B/C
  const shiftRepartition = ["A","B","C"].map(t => ({
    name: "Shift "+t,
    value: shifts.filter(s=>s.type===t).length,
    color: t==="A"?"#3B82F6":t==="B"?"#7C3AED":"#64748B"
  })).filter(s=>s.value>0);

  // Flotte status
  const flotteData = [
    {name:"En exploitation", value:activeVh, color:"#10B981"},
    {name:"En recharge", value:enRechargeVh, color:"#F59E0B"},
    {name:"Immobilises", value:immobiliseVh, color:"#EF4444"},
  ].filter(f=>f.value>0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"/>
              Live
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Boutons periode */}
          {["tout","jour","semaine","mois"].map(p=>(
            <button key={p} onClick={()=>setPeriode(p)} className={"px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all "+(periode===p?"bg-blue-600 text-white":"bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50")}>{p==="tout"?"Tout":p==="jour"?"Jour":p==="semaine"?"Semaine":"Mois"}</button>
          ))}
          {/* Selecteur Jour */}
          {periode==="jour"&&(
            <input type="date" value={selectedDay} onChange={e=>setSelectedDay(e.target.value)}
              className="text-sm border border-blue-300 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          )}
          {/* Selecteur Semaine */}
          {periode==="semaine"&&(
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-blue-300 rounded-lg px-2 py-1">
              <button onClick={()=>setWeekOffset(w=>w-1)} className="text-slate-500 hover:text-blue-600 px-1 text-lg font-bold">‹</button>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 min-w-[150px] text-center">{weekLabel}</span>
              <button onClick={()=>setWeekOffset(w=>w+1)} disabled={weekOffset>=0} className="text-slate-500 hover:text-blue-600 px-1 text-lg font-bold disabled:opacity-30">›</button>
            </div>
          )}
          {/* Selecteur Mois */}
          {periode==="mois"&&(
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-blue-300 rounded-lg px-2 py-1">
              <button onClick={()=>setMonthOffset(m=>m-1)} className="text-slate-500 hover:text-blue-600 px-1 text-lg font-bold">‹</button>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 min-w-[110px] text-center capitalize">{monthLabel}</span>
              <button onClick={()=>setMonthOffset(m=>m+1)} disabled={monthOffset>=0} className="text-slate-500 hover:text-blue-600 px-1 text-lg font-bold disabled:opacity-30">›</button>
            </div>
          )}
        </div>
      </div>

      {/* Alertes */}
      {(alertesVh.length>0||alertesCh.length>0||ddManquants>0||ecarts>0)&&(
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="font-semibold text-red-800 dark:text-red-400 text-sm mb-2">⚠ Alertes actives</div>
          <div className="space-y-1">
            {alertesVh.length>0&&<div className="text-xs text-red-700 dark:text-red-400">• {alertesVh.length} vehicule(s) avec documents expirant bientot</div>}
            {alertesCh.length>0&&<div className="text-xs text-red-700 dark:text-red-400">• {alertesCh.length} chauffeur(s) avec documents expirant bientot</div>}
            {ddManquants>0&&<div className="text-xs text-amber-700 dark:text-amber-400">• {ddManquants} shift(s) sans DD Driving Datas</div>}
            {ecarts>0&&<div className="text-xs text-red-700 dark:text-red-400">• {ecarts} ecart(s) detecte(s) dans les reversements</div>}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-600 rounded-xl p-5 text-white">
          <div className="text-xs font-medium opacity-80 uppercase tracking-wide mb-2">Recettes reversées</div>
          <div className="text-2xl font-bold">{fmt(totalRecette)}</div>
          <div className="text-xs opacity-70 mt-1">{reversementsEnAttente} en attente · {ecarts} ecart(s)</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-5 text-white">
          <div className="text-xs font-medium opacity-80 uppercase tracking-wide mb-2">Reversements valides</div>
          <div className="text-2xl font-bold">{fmt(totalReverse)}</div>
          <div className="text-xs opacity-70 mt-1">{reversementsEnAttente} en attente · {ecarts} ecart(s)</div>
        </div>
        <div className="bg-slate-600 rounded-xl p-5 text-white">
          <div className="text-xs font-medium opacity-80 uppercase tracking-wide mb-2">Chauffeurs actifs</div>
          <div className="text-2xl font-bold">{totalDrivers}</div>
          <div className="text-xs opacity-70 mt-1">{shiftPlanifie} shifts planifies</div>
        </div>
        <div className="bg-amber-500 rounded-xl p-5 text-white">
          <div className="text-xs font-medium opacity-80 uppercase tracking-wide mb-2">Flotte active</div>
          <div className="text-2xl font-bold">{activeVh}/{vehicles.length}</div>
          <div className="text-xs opacity-70 mt-1">SOC moy: {avgSoc}%</div>
        </div>
      </div>

      {/* Graphiques row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recettes 7 jours */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Activité — 7 derniers jours</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{top:5,right:5,bottom:5,left:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="jour" tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="left" tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>fmtK(v)}/>
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:11, fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={(v,name)=>name==="recettes"?[new Intl.NumberFormat("fr-FR").format(v)+" F","Recettes"]:[v+" shift(s)","Shifts"]} contentStyle={{borderRadius:"8px",border:"1px solid #e2e8f0",fontSize:"12px"}}/>
                <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:"11px",color:"#64748b"}}>{v==="recettes"?"Recettes (F)":"Shifts"}</span>}/>
                <Bar yAxisId="left" dataKey="recettes" fill="#10B981" radius={[4,4,0,0]}/>
                <Bar yAxisId="right" dataKey="shifts" fill="#3B82F6" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flotte status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Etat de la flotte</h2>
          {flotteData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={flotteData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {flotteData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v,n)=>[v+" vehicule(s)",n]} contentStyle={{borderRadius:"8px",fontSize:"12px"}}/>
                  <Legend iconType="circle" iconSize={8} formatter={(v)=><span style={{fontSize:"11px",color:"#64748b"}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Aucun vehicule</div>
          )}
        </div>
      </div>

      {/* Graphiques row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top chauffeurs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Top chauffeurs par CA</h2>
          {topDrivers.length===0 ? <p className="text-slate-400 text-sm">Aucun chauffeur</p> : (
            <div className="space-y-3">
              {topDrivers.map((d,i)=>(
                <div key={d.id} className="flex items-center gap-3">
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 "+(i===0?"bg-yellow-500":i===1?"bg-slate-400":i===2?"bg-amber-600":"bg-slate-300")}>{i+1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{d.prenom} {d.nom}</span>
                      <span className="text-sm font-semibold text-emerald-600">{fmt(d.realCA||0)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{width:topDrivers[0]?.realCA>0?((d.realCA||0)/(topDrivers[0].realCA||1))*100+"%":"0%"}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shifts repartition + SOC */}
        <div className="space-y-4">
          {/* Repartition shifts */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Shifts — {shiftTermine} termines / {shiftEnCours} en cours</h2>
            <div className="grid grid-cols-3 gap-3">
              {["A","B","C"].map(t=>{
                const count = shifts.filter(s=>s.type===t).length;
                const color = t==="A"?"bg-blue-500":t==="B"?"bg-violet-500":"bg-slate-500";
                const textColor = t==="A"?"text-blue-600":t==="B"?"text-violet-600":"text-slate-600";
                return (
                  <div key={t} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className={"text-2xl font-bold "+textColor}>{count}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Shift {t}</div>
                    <div className={"w-full h-1 rounded-full mt-2 "+color} style={{opacity:0.6}}/>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SOC flotte */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">SOC Flotte</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" 
                    stroke={avgSoc>70?"#10B981":avgSoc>40?"#F59E0B":"#EF4444"} 
                    strokeWidth="3" strokeDasharray={`${avgSoc} 100`} strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={"text-lg font-bold "+(avgSoc>70?"text-emerald-600":avgSoc>40?"text-amber-600":"text-red-600")}>{avgSoc}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {vehicles.slice(0,4).map(v=>(
                  <div key={v.id} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">{v.immat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <div className={"h-full rounded-full "+(v.soc>70?"bg-emerald-500":v.soc>40?"bg-amber-500":"bg-red-500")} style={{width:(v.soc||0)+"%"}}/>
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{v.soc||0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats reversements 7 jours */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Reversements — 7 derniers jours</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div className="text-2xl font-bold text-slate-700 dark:text-white">{last7DaysRev.reduce((a,d)=>a+d.total,0)}</div>
            <div className="text-xs text-slate-400 mt-1">Total reversements</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">{last7DaysRev.reduce((a,d)=>a+d.valides,0)}</div>
            <div className="text-xs text-slate-400 mt-1">Validés</div>
          </div>
          <div className="text-center p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
            <div className="text-2xl font-bold text-violet-600">{new Intl.NumberFormat("fr-FR").format(last7DaysRev.reduce((a,d)=>a+d.montant,0))} F</div>
            <div className="text-xs text-slate-400 mt-1">Montant total</div>
          </div>
        </div>
      </div>

    </div>
  );
};
