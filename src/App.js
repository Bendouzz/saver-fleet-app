import { useState, createContext, useContext, useEffect, useCallback, useMemo } from "react";

// ============================================================
// MOCK DATA
// ============================================================
const SITES = [
  { id: 1, name: "Abidjan", ville: "Abidjan", zone: "Cocody", waveAccount: "WB-ABJ-001" },
  { id: 2, name: "Yamoussoukro", ville: "Yamoussoukro", zone: "Centre", waveAccount: "WB-YAM-001" }
];

const VEHICLES = [
  { id: "VH-001", immat: "AB-1234-CI", modele: "BYD e6", site: 1, autonomie: 400, km: 12450, soc: 85, status: "En exploitation", binome: ["CH-001","CH-002"] },
  { id: "VH-002", immat: "AB-5678-CI", modele: "BYD e6", site: 1, autonomie: 400, km: 8920, soc: 72, status: "En exploitation", binome: ["CH-003","CH-004"] },
  { id: "VH-003", immat: "AB-9012-CI", modele: "MG ZS EV", site: 1, autonomie: 320, km: 15200, soc: 45, status: "En recharge", binome: ["CH-005","CH-006"] },
  { id: "VH-004", immat: "YA-3456-CI", modele: "BYD e6", site: 2, autonomie: 400, km: 5600, soc: 92, status: "En exploitation", binome: ["CH-007","CH-008"] },
  { id: "VH-005", immat: "YA-7890-CI", modele: "MG ZS EV", site: 2, autonomie: 320, km: 3200, soc: 15, status: "Immobilisé", binome: ["CH-009","CH-010"] },
  { id: "VH-006", immat: "AB-2468-CI", modele: "Nissan Leaf", site: 1, autonomie: 270, km: 22100, soc: 68, status: "En exploitation", binome: ["CH-011","CH-012"] },
];

const DRIVERS = [
  { id: "CH-001", nom: "Koné", prenom: "Moussa", site: 1, vehicule: "VH-001", shift: "A", status: "Actif", kpi: 87, courses: 1840, ca: 5520000, pen: 0, avance: 0 },
  { id: "CH-002", nom: "Traoré", prenom: "Ibrahim", site: 1, vehicule: "VH-001", shift: "B", status: "Actif", kpi: 92, courses: 2100, ca: 6300000, pen: 2000, avance: 0 },
  { id: "CH-003", nom: "Coulibaly", prenom: "Drissa", site: 1, vehicule: "VH-002", shift: "A", status: "Actif", kpi: 78, courses: 1560, ca: 4680000, pen: 5000, avance: 25000 },
  { id: "CH-004", nom: "Diallo", prenom: "Amadou", site: 1, vehicule: "VH-002", shift: "B", status: "Actif", kpi: 95, courses: 2250, ca: 6750000, pen: 0, avance: 0 },
  { id: "CH-005", nom: "Ouattara", prenom: "Seydou", site: 1, vehicule: "VH-003", shift: "A", status: "Actif", kpi: 65, courses: 980, ca: 2940000, pen: 15000, avance: 50000 },
  { id: "CH-006", nom: "Bamba", prenom: "Youssouf", site: 1, vehicule: "VH-003", shift: "B", status: "Suspendu", kpi: 45, courses: 620, ca: 1860000, pen: 25000, avance: 0 },
  { id: "CH-007", nom: "Touré", prenom: "Bakary", site: 2, vehicule: "VH-004", shift: "A", status: "Actif", kpi: 88, courses: 1200, ca: 3600000, pen: 0, avance: 0 },
  { id: "CH-008", nom: "Konaté", prenom: "Mamadou", site: 2, vehicule: "VH-004", shift: "B", status: "Actif", kpi: 82, courses: 1100, ca: 3300000, pen: 4000, avance: 0 },
  { id: "CH-009", nom: "Sanogo", prenom: "Lassina", site: 2, vehicule: "VH-005", shift: "A", status: "Inactif", kpi: 55, courses: 450, ca: 1350000, pen: 20000, avance: 30000 },
  { id: "CH-010", nom: "Cissé", prenom: "Oumar", site: 2, vehicule: "VH-005", shift: "B", status: "Actif", kpi: 73, courses: 780, ca: 2340000, pen: 8000, avance: 0 },
  { id: "CH-011", nom: "Diabaté", prenom: "Issiaka", site: 1, vehicule: "VH-006", shift: "A", status: "Actif", kpi: 90, courses: 1950, ca: 5850000, pen: 0, avance: 0 },
  { id: "CH-012", nom: "Fofana", prenom: "Abdoulaye", site: 1, vehicule: "VH-006", shift: "B", status: "Actif", kpi: 84, courses: 1680, ca: 5040000, pen: 2000, avance: 15000 },
];

const SHIFTS = [
  { id: "SH-001", vh: "VH-001", ch: "CH-001", type: "A", debut: "06:00", fin: "14:00", status: "En cours", checkIn: true, checkOut: false, recette: 72000, reverse: 0 },
  { id: "SH-002", vh: "VH-001", ch: "CH-002", type: "B", debut: "15:00", fin: "23:00", status: "Planifié", checkIn: false, checkOut: false, recette: 0, reverse: 0 },
  { id: "SH-003", vh: "VH-002", ch: "CH-003", type: "A", debut: "06:00", fin: "14:00", status: "En cours", checkIn: true, checkOut: false, recette: 58000, reverse: 0 },
  { id: "SH-004", vh: "VH-002", ch: "CH-004", type: "B", debut: "15:00", fin: "23:00", status: "Planifié", checkIn: false, checkOut: false, recette: 0, reverse: 0 },
  { id: "SH-005", vh: "VH-003", ch: "CH-005", type: "A", debut: "06:00", fin: "14:00", status: "Suspendu", checkIn: false, checkOut: false, recette: 0, reverse: 0 },
  { id: "SH-006", vh: "VH-004", ch: "CH-007", type: "A", debut: "06:00", fin: "14:00", status: "Terminé", checkIn: true, checkOut: true, recette: 81000, reverse: 81000 },
  { id: "SH-007", vh: "VH-004", ch: "CH-008", type: "B", debut: "15:00", fin: "23:00", status: "En cours", checkIn: true, checkOut: false, recette: 45000, reverse: 0 },
  { id: "SH-008", vh: "VH-006", ch: "CH-011", type: "A", debut: "06:00", fin: "14:00", status: "En cours", checkIn: true, checkOut: false, recette: 67000, reverse: 0 },
];

const REVERSEMENTS = [
  { id: "RV-001", ch: "CH-001", montant: 68000, canal: "Wave", date: "2026-02-08", status: "Validé", ecart: 0 },
  { id: "RV-002", ch: "CH-002", montant: 75000, canal: "Wave", date: "2026-02-08", status: "Validé", ecart: 0 },
  { id: "RV-003", ch: "CH-003", montant: 52000, canal: "Orange Money", date: "2026-02-08", status: "Écart détecté", ecart: 6000 },
  { id: "RV-004", ch: "CH-007", montant: 81000, canal: "Wave", date: "2026-02-09", status: "Validé", ecart: 0 },
  { id: "RV-005", ch: "CH-004", montant: 70000, canal: "Wave", date: "2026-02-08", status: "Validé", ecart: 0 },
  { id: "RV-006", ch: "CH-011", montant: 0, canal: "-", date: "2026-02-09", status: "En attente", ecart: 0 },
];

const RECHARGES = [
  { id: "RC-001", vh: "VH-001", ch: "CH-001", partenaire: "Arnio", kWh: 45, cout: 8500, lieu: "Cocody", duree: 55, socAv: 25, socAp: 85, date: "2026-02-09" },
  { id: "RC-002", vh: "VH-002", ch: "CH-003", partenaire: "Neo", kWh: 38, cout: 7200, lieu: "Plateau", duree: 48, socAv: 30, socAp: 78, date: "2026-02-09" },
  { id: "RC-003", vh: "VH-003", ch: "CH-005", partenaire: "Illigo", kWh: 52, cout: 9800, lieu: "Riviera", duree: 65, socAv: 15, socAp: 82, date: "2026-02-08" },
  { id: "RC-004", vh: "VH-004", ch: "CH-007", partenaire: "Arnio", kWh: 30, cout: 5700, lieu: "Yamoussoukro", duree: 38, socAv: 42, socAp: 80, date: "2026-02-09" },
  { id: "RC-005", vh: "VH-006", ch: "CH-011", partenaire: "Neo", kWh: 35, cout: 6650, lieu: "Marcory", duree: 42, socAv: 20, socAp: 68, date: "2026-02-09" },
];

const MAINTENANCES = [
  { id: "MT-001", vh: "VH-003", type: "Préventive", desc: "Révision 15 000 km", status: "Planifiée", date: "2026-02-15", cout: 0, garage: "Auto Service Pro" },
  { id: "MT-002", vh: "VH-005", type: "Corrective", desc: "Panne batterie", status: "En cours", date: "2026-02-10", cout: 150000, garage: "EV Repair CI" },
  { id: "MT-003", vh: "VH-006", type: "Préventive", desc: "Freins + pneus", status: "Terminée", date: "2026-01-28", cout: 85000, garage: "Auto Service Pro" },
  { id: "MT-004", vh: "VH-001", type: "Préventive", desc: "Suspension + direction", status: "Planifiée", date: "2026-02-20", cout: 0, garage: "Garage Express" },
];

const ALERTS = [
  { id: 1, type: "SOC Critique", msg: "VH-005 : SOC à 15% - Immobilisé", sev: "critical", date: "09/02 08:30", read: false },
  { id: 2, type: "Écart", msg: "CH-003 : Écart 6 000 FCFA", sev: "warning", date: "09/02 09:15", read: false },
  { id: 3, type: "Maintenance", msg: "VH-003 : Maintenance dans 6 jours", sev: "info", date: "09/02 07:00", read: true },
  { id: 4, type: "Géofencing", msg: "VH-002 : Hors zone 12 min", sev: "warning", date: "09/02 10:22", read: false },
  { id: 5, type: "Check-in", msg: "CH-005 : Check-in manqué", sev: "critical", date: "09/02 06:35", read: false },
  { id: 6, type: "Vitesse", msg: "VH-004 : 125 km/h détecté", sev: "warning", date: "09/02 11:45", read: false },
];

const SINISTRES = [
  { id: "SN-001", vh: "VH-005", ch: "CH-009", date: "2026-02-05", type: "Collision", status: "En instruction", assurance: "NSIA", montant: 450000, garage: "EV Repair CI" },
  { id: "SN-002", vh: "VH-003", ch: "CH-006", date: "2026-01-20", type: "Accrochage", status: "Réparé", assurance: "NSIA", montant: 120000, garage: "Auto Service Pro" },
];

const PAIE_HISTORY = [
  { id: "PA-001", ch: "CH-001", periode: "27/01 - 09/02", fixe: 75000, bonus: 15000, penalites: 0, avanceRetenue: 0, net: 90000 },
  { id: "PA-002", ch: "CH-002", periode: "27/01 - 09/02", fixe: 75000, bonus: 22000, penalites: 2000, avanceRetenue: 0, net: 95000 },
  { id: "PA-003", ch: "CH-003", periode: "27/01 - 09/02", fixe: 75000, bonus: 8000, penalites: 5000, avanceRetenue: 12500, net: 65500 },
  { id: "PA-004", ch: "CH-004", periode: "27/01 - 09/02", fixe: 75000, bonus: 25000, penalites: 0, avanceRetenue: 0, net: 100000 },
  { id: "PA-005", ch: "CH-005", periode: "27/01 - 09/02", fixe: 0, bonus: 0, penalites: 15000, avanceRetenue: 25000, net: -40000 },
  { id: "PA-006", ch: "CH-007", periode: "27/01 - 09/02", fixe: 75000, bonus: 12000, penalites: 0, avanceRetenue: 0, net: 87000 },
];

// ============================================================
// HELPERS
// ============================================================
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " F";
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1) + "M" : n >= 1000 ? Math.round(n/1000) + "k" : n.toString();
const siteName = (id) => SITES.find(s=>s.id===id)?.name||"";
const driverName = (id) => {const d=DRIVERS.find(x=>x.id===id);return d?d.prenom+" "+d.nom:"—";};
const vhLabel = (id) => {const v=VEHICLES.find(x=>x.id===id);return v?v.immat:"—";};
const sc = (s) => ({"Actif":"bg-emerald-100 text-emerald-700","En cours":"bg-blue-100 text-blue-700","Planifié":"bg-slate-100 text-slate-600","Terminé":"bg-emerald-100 text-emerald-700","Suspendu":"bg-red-100 text-red-700","Inactif":"bg-slate-200 text-slate-500","En exploitation":"bg-emerald-100 text-emerald-700","En recharge":"bg-amber-100 text-amber-700","Immobilisé":"bg-red-100 text-red-700","Validé":"bg-emerald-100 text-emerald-700","En attente":"bg-amber-100 text-amber-700","Écart détecté":"bg-red-100 text-red-700","Planifiée":"bg-blue-100 text-blue-700","Terminée":"bg-emerald-100 text-emerald-700","En instruction":"bg-amber-100 text-amber-700","Réparé":"bg-emerald-100 text-emerald-700"}[s]||"bg-slate-100 text-slate-600");

// ============================================================
// BADGE & CARD COMPONENTS
// ============================================================
const Badge = ({children, color}) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color||"bg-slate-100 text-slate-700"}`}>{children}</span>;

const StatCard = ({label, value, sub, color="text-slate-900", icon}) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      {icon && <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${icon.bg}`}>{icon.el}</span>}
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
  </div>
);

const SocBar = ({soc}) => {
  const col = soc > 70 ? "bg-emerald-500" : soc > 40 ? "bg-amber-500" : "bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full ${col} rounded-full`} style={{width:`${soc}%`}}/></div><span className="text-xs font-medium text-slate-600">{soc}%</span></div>;
};

const KpiBar = ({value, max=100}) => {
  const pct = Math.min((value/max)*100, 100);
  const col = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full ${col} rounded-full`} style={{width:`${pct}%`}}/></div><span className="text-xs font-semibold">{value}</span></div>;
};

// ============================================================
// PAGE: LOGIN
// ============================================================
const LoginPage = ({onLogin}) => {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white">SAVER Fleet Ops</h1>
          <p className="text-blue-300 mt-2">Gestion de flotte VTC électrique</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Profil</label>
              <select value={user} onChange={e=>setUser(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="admin" className="text-slate-900">Admin / Direction</option>
                <option value="ops" className="text-slate-900">Ops Manager</option>
                <option value="finance" className="text-slate-900">Finance</option>
                <option value="supervisor" className="text-slate-900">Superviseur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Mot de passe</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Démo : tout mot de passe" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>
            <button onClick={()=>onLogin(user)} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all shadow-lg shadow-emerald-500/25">
              Se connecter
            </button>
          </div>
          <div className="mt-4 text-center text-blue-300/60 text-xs">Pilote : 6 véhicules · 12 chauffeurs · Abidjan & Yamoussoukro</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGE: DASHBOARD
// ============================================================
const DashboardPage = () => {
  const activeVh = VEHICLES.filter(v=>v.status==="En exploitation").length;
  const totalRecette = SHIFTS.reduce((a,s)=>a+s.recette,0);
  const totalReverse = REVERSEMENTS.filter(r=>r.status==="Validé").reduce((a,r)=>a+r.montant,0);
  const alertCount = ALERTS.filter(a=>!a.read).length;
  const avgSoc = Math.round(VEHICLES.reduce((a,v)=>a+v.soc,0)/VEHICLES.length);
  const shiftEnCours = SHIFTS.filter(s=>s.status==="En cours").length;
  const totalDrivers = DRIVERS.filter(d=>d.status==="Actif").length;
  const totalCout = RECHARGES.reduce((a,r)=>a+r.cout,0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1><p className="text-slate-500 text-sm">Lundi 9 février 2026 · Vue temps réel</p></div>
        <div className="flex gap-2">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option>Tous les sites</option><option>Abidjan</option><option>Yamoussoukro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recettes du jour" value={fmt(totalRecette)} sub={`${shiftEnCours} shifts en cours`} color="text-emerald-600" icon={{bg:"bg-emerald-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}} />
        <StatCard label="Véhicules actifs" value={`${activeVh} / ${VEHICLES.length}`} sub={`SOC moyen : ${avgSoc}%`} color="text-blue-600" icon={{bg:"bg-blue-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}} />
        <StatCard label="Chauffeurs actifs" value={totalDrivers.toString()} sub="10 actifs · 1 suspendu · 1 inactif" color="text-violet-600" icon={{bg:"bg-violet-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>}} />
        <StatCard label="Alertes actives" value={alertCount.toString()} sub="2 critiques · 3 warnings" color="text-red-600" icon={{bg:"bg-red-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Cashflow du jour</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-emerald-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Recettes</div><div className="text-lg font-bold text-emerald-600">{fmt(totalRecette)}</div></div>
            <div className="text-center p-4 bg-blue-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Reversés</div><div className="text-lg font-bold text-blue-600">{fmt(totalReverse)}</div></div>
            <div className="text-center p-4 bg-amber-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">En attente</div><div className="text-lg font-bold text-amber-600">{fmt(totalRecette-totalReverse)}</div></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-500">Derniers reversements</h3>
            {REVERSEMENTS.slice(0,4).map(r=>(
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{driverName(r.ch).charAt(0)}</div><div><div className="text-sm font-medium text-slate-700">{driverName(r.ch)}</div><div className="text-xs text-slate-400">{r.canal} · {r.date}</div></div></div>
                <div className="text-right"><div className="text-sm font-semibold">{fmt(r.montant)}</div><Badge color={sc(r.status)}>{r.status}</Badge></div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Alertes récentes</h2>
          <div className="space-y-3">
            {ALERTS.map(a=>(
              <div key={a.id} className={`flex gap-3 p-3 rounded-lg ${a.read?"bg-slate-50":"bg-slate-50 border-l-4"} ${a.sev==="critical"?"border-red-500":a.sev==="warning"?"border-amber-500":"border-blue-500"}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.sev==="critical"?"bg-red-500":a.sev==="warning"?"bg-amber-500":"bg-blue-500"}`}/>
                <div><div className="text-sm font-medium text-slate-700">{a.msg}</div><div className="text-xs text-slate-400 mt-0.5">{a.type} · {a.date}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet SOC */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">État de charge de la flotte</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VEHICLES.map(v=>(
            <div key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <div className="font-medium text-sm text-slate-800">{v.immat}</div>
                <div className="text-xs text-slate-400">{v.modele} · {siteName(v.site)}</div>
                <Badge color={sc(v.status)}>{v.status}</Badge>
              </div>
              <div className="text-right">
                <SocBar soc={v.soc}/>
                <div className="text-xs text-slate-400 mt-1">{v.km.toLocaleString()} km</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGE: VEHICULES
// ============================================================
const VehiculesPage = () => {
  const [filter, setFilter] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const emptyForm = {
    immat:"", marque:"", modele:"", couleur:"", annee:new Date().getFullYear(), site:1,
    autonomie:400, km:0, soc:100, status:"En exploitation",
    typeContrat:"Interne SAVER", typeService:"VTC", classesService:[],
    vin:"", numeroChassis:"", capaciteBatterie:0,
    carteGriseNum:"", carteGriseDate:"", carteGriseProprietaire:"",
    visiteDate:"", assuranceNum:"", assuranceDebut:"", assuranceFin:"",
    binome:[]
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = VEHICLES
    .filter(v => filter==="all" || v.site===parseInt(filter))
    .filter(v => filterType==="all" || v.typeService===filterType);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); };
  const openEdit = (v) => { setForm({...emptyForm,...v}); setEditItem(v); setShowModal(true); };

  const getAlerts = (v) => {
    const alerts = [];
    const today = new Date();
    if (v.assuranceFin) {
      const fin = new Date(v.assuranceFin);
      const diff = Math.floor((fin - today) / (1000*60*60*24));
      if (diff <= 7) alerts.push({type:"assurance", label:"Assurance expire dans "+diff+" j", color:"text-red-600 bg-red-50"});
    }
    if (v.visiteDate) {
      const visite = new Date(v.visiteDate);
      const diff = Math.floor((visite - today) / (1000*60*60*24));
      if (diff <= 15) alerts.push({type:"visite", label:"Visite technique dans "+diff+" j", color:"text-amber-600 bg-amber-50"});
    }
    return alerts;
  };

  const totalAlerts = VEHICLES.reduce((a,v) => a + getAlerts(v).length, 0);

  if (detail) {
    const v = VEHICLES.find(x=>x.id===detail);
    if (!v) { setDetail(null); return null; }
    const alerts = getAlerts(v);
    return (
      <div className="space-y-6">
        <button onClick={()=>setDetail(null)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a,i) => (
              <div key={i} className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium "+a.color}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                {a.label}
              </div>
            ))}
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">{(v.immat||"").substring(0,2)}</div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{v.immat}</h2>
                <p className="text-slate-500 text-sm">{v.marque} {v.modele} {v.annee ? "· "+v.annee : ""} {v.couleur ? "· "+v.couleur : ""}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge color={sc(v.status)}>{v.status}</Badge>
                  <Badge color="bg-blue-100 text-blue-700">{v.typeContrat||"Interne SAVER"}</Badge>
                  <Badge color="bg-violet-100 text-violet-700">{v.typeService||"VTC"}</Badge>
                </div>
              </div>
            </div>
            <button onClick={()=>{openEdit(v);setDetail(null);}} className="text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">Modifier</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Infos techniques</h3>
              {[["VIN",v.vin],["N Chassis",v.numeroChassis],["Autonomie",v.autonomie?v.autonomie+"km":""],["Batterie",v.capaciteBatterie?v.capaciteBatterie+"kWh":""],["Km",v.km?v.km.toLocaleString()+"km":""],["Classes",((v.classesService||[]).join(", "))||""]].map(([l,val])=>(
                <div key={l} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500">{l}</span>
                  <span className="text-xs font-medium text-slate-700">{val||"—"}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Documents</h3>
              {[["CG N",v.carteGriseNum],["CG Date",v.carteGriseDate],["Proprietaire",v.carteGriseProprietaire],["Visite tech.",v.visiteDate],["Assurance N",v.assuranceNum],["Assur. debut",v.assuranceDebut],["Assur. fin",v.assuranceFin]].map(([l,val])=>(
                <div key={l} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500">{l}</span>
                  <span className={"text-xs font-medium "+(l==="Assur. fin"&&val&&new Date(val)<new Date(Date.now()+7*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Etat</h3>
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 mb-2">SOC</div><SocBar soc={v.soc}/></div>
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Site</div><div className="font-semibold text-sm">{siteName(v.site)}</div></div>
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Binome</div>{(v.binome||[]).map(b=><div key={b} className="text-sm font-medium">{driverName(b)}</div>)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicules</h1>
          {totalAlerts > 0 && <p className="text-xs text-red-500 mt-0.5">{totalAlerts} alerte(s) documentaire(s)</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous les sites</option><option value="1">Abidjan</option><option value="2">Yamoussoukro</option>
          </select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous types</option><option value="VTC">VTC</option><option value="Location B2B">Location B2B</option><option value="Location B2C">Location B2C</option>
          </select>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Ajouter
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Site</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SOC</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Km</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Alertes</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(v=>{
              const alerts = getAlerts(v);
              return (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 cursor-pointer" onClick={()=>setDetail(v.id)}>
                    <div className="font-medium text-sm text-slate-800">{v.immat}</div>
                    <div className="text-xs text-slate-400">{v.marque||""} {v.modele} {v.annee?"· "+v.annee:""}</div>
                    {v.couleur&&<div className="text-xs text-slate-400">{v.couleur}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color="bg-violet-100 text-violet-700">{v.typeService||"VTC"}</Badge>
                    <div className="text-xs text-slate-400 mt-0.5">{v.typeContrat||"Interne"}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{siteName(v.site)}</td>
                  <td className="px-4 py-3"><SocBar soc={v.soc}/></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{v.km?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {alerts.length>0 ? (
                      <div className="space-y-1">{alerts.map((a,i)=><div key={i} className={"text-xs px-2 py-0.5 rounded-full font-medium "+a.color}>{a.label}</div>)}</div>
                    ) : <span className="text-xs text-emerald-500">OK</span>}
                  </td>
                  <td className="px-4 py-3"><Badge color={sc(v.status)}>{v.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(v)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                      <button onClick={()=>setConfirmDelete(v)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Suppr.</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto my-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">{editItem?"Modifier le vehicule":"Ajouter un vehicule"}</h2>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">X</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-1 border-b">Identite du vehicule</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Immatriculation *</label><input value={form.immat} onChange={e=>setForm({...form,immat:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: AB-1234-CI"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Marque</label><input value={form.marque} onChange={e=>setForm({...form,marque:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: BYD"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Modele</label><input value={form.modele} onChange={e=>setForm({...form,modele:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: e6"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label><input value={form.couleur} onChange={e=>setForm({...form,couleur:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Annee</label><input type="number" value={form.annee} onChange={e=>setForm({...form,annee:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Numero VIN</label><input value={form.vin} onChange={e=>setForm({...form,vin:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="17 caracteres"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">N Chassis</label><input value={form.numeroChassis} onChange={e=>setForm({...form,numeroChassis:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-1 border-b">Donnees techniques</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Capacite batterie (kWh)</label><input type="number" value={form.capaciteBatterie} onChange={e=>setForm({...form,capaciteBatterie:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Autonomie (km)</label><input type="number" value={form.autonomie} onChange={e=>setForm({...form,autonomie:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Kilometrage</label><input type="number" value={form.km} onChange={e=>setForm({...form,km:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">SOC (%)</label><input type="number" min="0" max="100" value={form.soc} onChange={e=>setForm({...form,soc:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-1 border-b">Contrat et Service</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                    <select value={form.site} onChange={e=>setForm({...form,site:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value={1}>Abidjan</option><option value={2}>Yamoussoukro</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                    <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>En exploitation</option><option>En recharge</option><option>Maintenance</option><option>Immobilise</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Type de contrat flotte</label>
                    <select value={form.typeContrat} onChange={e=>setForm({...form,typeContrat:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Interne SAVER</option><option>Externe client gestion</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Type de service</label>
                    <select value={form.typeService} onChange={e=>setForm({...form,typeService:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>VTC</option><option>Location B2B</option><option>Location B2C</option>
                    </select>
                  </div>
                  {form.typeService==="VTC" && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Classes de service VTC</label>
                      <div className="flex flex-wrap gap-2">
                        {["Eco","Confort","Confort+","Business","Premium","VIP","Standard","Coursier","Livraison","Interurbain"].map(c=>(
                          <label key={c} className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={(form.classesService||[]).includes(c)} onChange={e=>{
                              const arr = form.classesService||[];
                              setForm({...form, classesService: e.target.checked ? [...arr,c] : arr.filter(x=>x!==c)});
                            }} className="rounded"/>
                            <span className="text-xs text-slate-700">{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-1 border-b">Carte grise</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Numero carte grise</label><input value={form.carteGriseNum} onChange={e=>setForm({...form,carteGriseNum:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Date immatriculation</label><input type="date" value={form.carteGriseDate} onChange={e=>setForm({...form,carteGriseDate:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Proprietaire</label><input value={form.carteGriseProprietaire} onChange={e=>setForm({...form,carteGriseProprietaire:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-1 border-b">Visite technique et Assurance</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Expiration visite technique <span className="text-amber-600 text-xs">(alerte 15j avant)</span></label><input type="date" value={form.visiteDate} onChange={e=>setForm({...form,visiteDate:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">N Contrat assurance</label><input value={form.assuranceNum} onChange={e=>setForm({...form,assuranceNum:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Debut assurance</label><input type="date" value={form.assuranceDebut} onChange={e=>setForm({...form,assuranceDebut:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Fin assurance <span className="text-red-600 text-xs">(alerte 7j avant)</span></label><input type="date" value={form.assuranceFin} onChange={e=>setForm({...form,assuranceFin:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
              <button onClick={()=>setShowModal(false)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-2">Supprimer ce vehicule ?</h3>
            <p className="text-sm text-slate-500 mb-4">{confirmDelete.immat}</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 border border-slate-200 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ============================================================
// PAGE: CHAUFFEURS
// ============================================================
const ChauffeursPage = () => {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("profil");

  const filtered = DRIVERS.filter(d => !search || `${d.prenom} ${d.nom}`.toLowerCase().includes(search.toLowerCase()));

  // Genere les initiales auto : Yao Koffi -> YK-01
  const genInitiales = (prenom, nom, existingDrivers) => {
    const base = (prenom[0]||"X").toUpperCase() + (nom[0]||"X").toUpperCase();
    const count = (existingDrivers||[]).filter(d => (d.matricule||"").startsWith(base)).length + 1;
    return base + "-" + String(count).padStart(2,"0");
  };

  const emptyForm = {
    nom:"", prenom:"", site:1, vehicule:"", shift:"A", status:"Actif",
    kpi:80, courses:0, ca:0, pen:0, avance:0,
    // KYC
    typeContrat:"Salarie", telephone:"", telephonePerso:"", adresse:"",
    contactUrgence:"", contactUrgenceTel:"",
    // Permis
    permisNum:"", permisDelivrance:"", permisExpiration:"", permisType:"",
    // Piece identite
    pieceType:"CNI", pieceNum:"", pieceDelivrance:"", pieceExpiration:"",
    // Notes
    noteYango:5.0, noteInterne:80, commentaires:"",
    // Dettes
    dettes:0, detteCommentaire:"",
    matricule:""
  };
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    const mat = genInitiales("X","X",DRIVERS);
    setForm({...emptyForm});
    setEditItem(null);
    setShowModal(true);
    setActiveTab("profil");
  };
  const openEdit = (d) => {
    setForm({...emptyForm,...d});
    setEditItem(d);
    setShowModal(true);
    setActiveTab("profil");
  };

  // Alerte permis / piece
  const getDriverAlerts = (d) => {
    const alerts = [];
    if (d.permisExpiration) {
      const diff = Math.floor((new Date(d.permisExpiration) - new Date()) / (1000*60*60*24));
      if (diff <= 30) alerts.push("Permis expire dans "+diff+"j");
    }
    if (d.pieceExpiration) {
      const diff = Math.floor((new Date(d.pieceExpiration) - new Date()) / (1000*60*60*24));
      if (diff <= 30) alerts.push("Piece ID expire dans "+diff+"j");
    }
    return alerts;
  };

  if (detail) {
    const d = DRIVERS.find(x=>x.id===detail);
    if (!d) { setDetail(null); return null; }
    const paie = typeof PAIE_HISTORY !== 'undefined' ? PAIE_HISTORY.find(p=>p.ch===detail) : null;
    const alerts = getDriverAlerts(d);
    const tabs = [
      {id:"profil", label:"Profil"},
      {id:"kyc", label:"KYC"},
      {id:"performance", label:"Performance"},
      {id:"incidents", label:"Incidents & Dettes"},
    ];
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>Retour
        </button>
        {alerts.length > 0 && (
          <div className="space-y-1">{alerts.map((a,i)=>(
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-600 bg-amber-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>{a}
            </div>
          ))}</div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">{d.prenom[0]}{d.nom[0]}</div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{d.prenom} {d.nom}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{d.matricule||d.id}</span>
                  <Badge color="bg-blue-100 text-blue-700">Shift {d.shift}</Badge>
                  <Badge color={sc(d.status)}>{d.status}</Badge>
                  <Badge color="bg-violet-100 text-violet-700">{d.typeContrat||"Salarie"}</Badge>
                </div>
                <p className="text-slate-500 text-sm mt-1">{siteName(d.site)} · {vhLabel(d.vehicule)}</p>
              </div>
            </div>
            <button onClick={()=>{openEdit(d);setDetail(null);}} className="text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm hover:bg-blue-50">Modifier</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 mb-4">
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} className={"px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px "+(activeTab===t.id?"border-blue-600 text-blue-600":"border-transparent text-slate-500 hover:text-slate-700")}>{t.label}</button>
            ))}
          </div>

          {activeTab==="profil" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["Telephone travail", d.telephone],["Telephone perso", d.telephonePerso],
                ["Adresse", d.adresse],["Contact urgence", d.contactUrgence],
                ["Tel urgence", d.contactUrgenceTel],["Type contrat", d.typeContrat||"Salarie"],
              ].map(([l,val])=>(
                <div key={l} className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500">{l}</span>
                  <span className="text-xs font-medium text-slate-700">{val||"—"}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab==="kyc" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-700 text-sm mb-3">Permis de conduire</h4>
                {[["Numero",d.permisNum],["Type",d.permisType],["Delivrance",d.permisDelivrance],["Expiration",d.permisExpiration]].map(([l,val])=>(
                  <div key={l} className={"flex justify-between py-2 border-b border-slate-100"}>
                    <span className="text-xs text-slate-500">{l}</span>
                    <span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 text-sm mb-3">Piece d identite ({d.pieceType||"CNI"})</h4>
                {[["Numero",d.pieceNum],["Delivrance",d.pieceDelivrance],["Expiration",d.pieceExpiration]].map(([l,val])=>(
                  <div key={l} className={"flex justify-between py-2 border-b border-slate-100"}>
                    <span className="text-xs text-slate-500">{l}</span>
                    <span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab==="performance" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">Note Yango</div><div className="font-bold text-lg text-amber-500">{d.noteYango||"—"}/5</div></div>
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">KPI Interne</div><KpiBar value={d.kpi}/></div>
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">Courses</div><div className="font-semibold text-sm">{d.courses.toLocaleString()}</div></div>
              <div className="p-4 bg-emerald-50 rounded-xl"><div className="text-xs text-slate-500">CA Total</div><div className="font-semibold text-sm text-emerald-600">{fmt(d.ca)}</div></div>
              <div className="p-4 bg-red-50 rounded-xl"><div className="text-xs text-slate-500">Penalites</div><div className="font-semibold text-sm text-red-600">{fmt(d.pen)}</div></div>
              <div className="p-4 bg-amber-50 rounded-xl"><div className="text-xs text-slate-500">Avance en cours</div><div className="font-semibold text-sm text-amber-600">{fmt(d.avance)}</div></div>
              {paie && <>
                <div className="p-4 bg-emerald-50 rounded-xl"><div className="text-xs text-slate-500">Dernier net</div><div className="font-semibold text-sm text-emerald-600">{fmt(paie.net)}</div></div>
                <div className="p-4 bg-blue-50 rounded-xl"><div className="text-xs text-slate-500">Periode</div><div className="font-semibold text-sm">{paie.periode}</div></div>
              </>}
            </div>
          )}

          {activeTab==="incidents" && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="text-xs text-slate-500 mb-1">Solde dettes en cours</div>
                <div className="font-bold text-red-600 text-lg">{fmt(d.dettes||0)}</div>
                {d.detteCommentaire && <div className="text-xs text-slate-500 mt-1">{d.detteCommentaire}</div>}
              </div>
              {d.commentaires && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Commentaires & incidents</div>
                  <div className="text-sm text-slate-700">{d.commentaires}</div>
                </div>
              )}
              {!d.dettes && !d.commentaires && <div className="text-slate-400 text-sm text-center py-4">Aucun incident enregistre</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Chauffeurs</h1>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Matricule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Site</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Shift</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Yango</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">KPI</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(d=>{
              const alerts = getDriverAlerts(d);
              return (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 cursor-pointer" onClick={()=>setDetail(d.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">{d.prenom[0]}{d.nom[0]}</div>
                      <div>
                        <div className="font-medium text-sm text-slate-800">{d.prenom} {d.nom}</div>
                        {alerts.length > 0 && <div className="text-xs text-amber-600">⚠ {alerts[0]}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{d.matricule||d.id}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{siteName(d.site)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vhLabel(d.vehicule)}</td>
                  <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">Shift {d.shift}</Badge></td>
                  <td className="px-4 py-3"><span className="text-sm font-bold text-amber-500">{d.noteYango||"—"}</span><span className="text-xs text-slate-400">/5</span></td>
                  <td className="px-4 py-3"><KpiBar value={d.kpi}/></td>
                  <td className="px-4 py-3"><Badge color={sc(d.status)}>{d.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(d)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                      <button onClick={()=>setConfirmDelete(d)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Suppr.</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto my-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">{editItem?"Modifier le chauffeur":"Ajouter un chauffeur"}</h2>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">X</button>
            </div>
            {/* Tabs modal */}
            <div className="flex gap-1 px-6 pt-4 border-b border-slate-200">
              {[{id:"profil",label:"Profil"},{id:"kyc",label:"KYC"},{id:"performance",label:"Perf & Notes"},{id:"incidents",label:"Incidents"}].map(t=>(
                <button key={t.id} onClick={()=>setActiveTab(t.id)} className={"px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors "+(activeTab===t.id?"border-blue-600 text-blue-600":"border-transparent text-slate-500")}>{t.label}</button>
              ))}
            </div>
            <div className="p-6 space-y-4">

              {activeTab==="profil" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label><input value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Prenom *</label><input value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Matricule <span className="text-slate-400 text-xs">(auto)</span></label>
                    <input value={form.matricule||genInitiales(form.prenom||"X",form.nom||"X",DRIVERS)} onChange={e=>setForm({...form,matricule:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Type de contrat</label>
                    <select value={form.typeContrat} onChange={e=>setForm({...form,typeContrat:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Salarie</option><option>Prestataire a l essai</option><option>Freelance</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Site</label>
                    <select value={form.site} onChange={e=>setForm({...form,site:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value={1}>Abidjan</option><option value={2}>Yamoussoukro</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                    <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="A">Shift A (06h-14h)</option><option value="B">Shift B (15h-23h)</option><option value="C">Shift C (22h-06h)</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                    <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Actif</option><option>Suspendu</option><option>Inactif</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Tel. travail</label><input value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+225..."/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Tel. personnel</label><input value={form.telephonePerso} onChange={e=>setForm({...form,telephonePerso:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label><input value={form.adresse} onChange={e=>setForm({...form,adresse:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Commune, quartier"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact urgence</label><input value={form.contactUrgence} onChange={e=>setForm({...form,contactUrgence:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Tel urgence</label><input value={form.contactUrgenceTel} onChange={e=>setForm({...form,contactUrgenceTel:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                </div>
              )}

              {activeTab==="kyc" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-1 border-b">Permis de conduire</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Numero permis</label><input value={form.permisNum} onChange={e=>setForm({...form,permisNum:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label><input value={form.permisType} onChange={e=>setForm({...form,permisType:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="B, D..."/></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Date delivrance</label><input type="date" value={form.permisDelivrance} onChange={e=>setForm({...form,permisDelivrance:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiration <span className="text-amber-600 text-xs">(alerte 30j)</span></label><input type="date" value={form.permisExpiration} onChange={e=>setForm({...form,permisExpiration:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-1 border-b">Piece d identite</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select value={form.pieceType} onChange={e=>setForm({...form,pieceType:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>CNI</option><option>Passeport</option><option>Titre sejour</option>
                        </select>
                      </div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Numero</label><input value={form.pieceNum} onChange={e=>setForm({...form,pieceNum:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Date delivrance</label><input type="date" value={form.pieceDelivrance} onChange={e=>setForm({...form,pieceDelivrance:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                      <div><label className="block text-sm font-medium text-slate-700 mb-1">Expiration <span className="text-amber-600 text-xs">(alerte 30j)</span></label><input type="date" value={form.pieceExpiration} onChange={e=>setForm({...form,pieceExpiration:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab==="performance" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Note Yango <span className="text-xs text-slate-400">(sur 5)</span></label><input type="number" min="0" max="5" step="0.1" value={form.noteYango} onChange={e=>setForm({...form,noteYango:parseFloat(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">KPI Interne <span className="text-xs text-slate-400">(note standard: 80)</span></label><input type="number" min="0" max="100" value={form.kpi} onChange={e=>setForm({...form,kpi:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Courses</label><input type="number" value={form.courses} onChange={e=>setForm({...form,courses:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">CA (F CFA)</label><input type="number" value={form.ca} onChange={e=>setForm({...form,ca:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Penalites (F CFA)</label><input type="number" value={form.pen} onChange={e=>setForm({...form,pen:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Avance en cours (F CFA)</label><input type="number" value={form.avance} onChange={e=>setForm({...form,avance:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                </div>
              )}

              {activeTab==="incidents" && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Solde dettes en cours (F CFA)</label><input type="number" value={form.dettes||0} onChange={e=>setForm({...form,dettes:parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Detail de la dette</label><input value={form.detteCommentaire||""} onChange={e=>setForm({...form,detteCommentaire:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: manquant du 01/04..."/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Commentaires et incidents</label><textarea value={form.commentaires||""} onChange={e=>setForm({...form,commentaires:e.target.value})} rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Historique des incidents, remarques..."/></div>
                </div>
              )}

            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
              <button onClick={()=>setShowModal(false)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-2">Supprimer ce chauffeur ?</h3>
            <p className="text-sm text-slate-500 mb-4">{confirmDelete.prenom} {confirmDelete.nom}</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 border border-slate-200 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// ============================================================
// PAGE: PLANNING
// ============================================================
const PlanningPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-slate-900">Planning du jour</h1><div className="text-sm text-slate-500">Lundi 9 février 2026</div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4"><h3 className="font-semibold text-blue-800 mb-3">Shift A · 06:00 - 14:00</h3>
        <div className="space-y-2">{SHIFTS.filter(s=>s.type==="A").map(s=>(<div key={s.id} className="bg-white rounded-lg p-3 flex items-center justify-between"><div><div className="font-medium text-sm">{driverName(s.ch)}</div><div className="text-xs text-slate-400">{vhLabel(s.vh)}</div></div><div className="flex items-center gap-2"><Badge color={sc(s.status)}>{s.status}</Badge>{s.recette>0&&<span className="text-xs font-semibold text-emerald-600">{fmt(s.recette)}</span>}</div></div>))}</div>
      </div>
      <div className="bg-violet-50 rounded-xl border border-violet-200 p-4"><h3 className="font-semibold text-violet-800 mb-3">Shift B · 15:00 - 23:00</h3>
        <div className="space-y-2">{SHIFTS.filter(s=>s.type==="B").map(s=>(<div key={s.id} className="bg-white rounded-lg p-3 flex items-center justify-between"><div><div className="font-medium text-sm">{driverName(s.ch)}</div><div className="text-xs text-slate-400">{vhLabel(s.vh)}</div></div><div className="flex items-center gap-2"><Badge color={sc(s.status)}>{s.status}</Badge></div></div>))}</div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Règles de planning SAVER</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="p-4 bg-slate-50 rounded-lg"><div className="font-semibold text-slate-700 mb-1">Handover</div><div className="text-slate-500">30 min passation + 30 min recharge si SOC inf. 70%</div></div>
        <div className="p-4 bg-slate-50 rounded-lg"><div className="font-semibold text-slate-700 mb-1">Jours travaillés</div><div className="text-slate-500">6j/7 · ½ journée repos / 2 semaines</div></div>
        <div className="p-4 bg-slate-50 rounded-lg"><div className="font-semibold text-slate-700 mb-1">Heures sup</div><div className="text-slate-500">Interdites sauf rattrapage validé</div></div>
      </div>
    </div>
  </div>
);

// ============================================================
// PAGE: CHECK-IN / CHECK-OUT
// ============================================================
const CheckInPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Check-in / Check-out</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <StatCard label="Check-in effectués" value={SHIFTS.filter(s=>s.checkIn).length.toString()} sub={`sur ${SHIFTS.length} shifts`} color="text-emerald-600"/>
      <StatCard label="Check-out effectués" value={SHIFTS.filter(s=>s.checkOut).length.toString()} sub="shifts clôturés" color="text-blue-600"/>
      <StatCard label="Alertes check-in" value={SHIFTS.filter(s=>!s.checkIn&&s.status!=="Planifié").length.toString()} sub="manqués ou en retard" color="text-red-600"/>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Véhicule</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Shift</th><th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">GPS</th><th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Photo km</th><th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Photo VH</th><th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Empreinte</th><th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Selfie</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th></tr></thead>
        <tbody>{SHIFTS.map(s=>{const ci=s.checkIn;return(
          <tr key={s.id} className="border-b border-slate-100">
            <td className="px-4 py-3 text-sm font-medium text-slate-700">{driverName(s.ch)}</td>
            <td className="px-4 py-3 text-sm text-slate-600">{vhLabel(s.vh)}</td>
            <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">{s.type} ({s.debut}-{s.fin})</Badge></td>
            <td className="px-4 py-3 text-center">{ci?"✅":"❌"}</td>
            <td className="px-4 py-3 text-center">{ci?"✅":"❌"}</td>
            <td className="px-4 py-3 text-center">{ci?"✅":"❌"}</td>
            <td className="px-4 py-3 text-center">{ci?"✅":"❌"}</td>
            <td className="px-4 py-3 text-center">{ci?"✅":"❌"}</td>
            <td className="px-4 py-3"><Badge color={sc(s.status)}>{s.status}</Badge></td>
          </tr>
        )})}</tbody>
      </table>
    </div>
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <h3 className="font-semibold text-amber-800 text-sm mb-2">Preuves cumulatives obligatoires</h3>
      <div className="text-sm text-amber-700 space-y-1">
        <div>1. GPS actif · 2. Photo compteur km · 3. Photo véhicule · 4. Empreinte digitale · 5. Selfie KYC au volant</div>
        <div className="font-medium">Une preuve manquante = check refusé</div>
      </div>
    </div>
  </div>
);

// ============================================================
// PAGE: REVERSEMENTS
// ============================================================
const ReversementsPage = () => {
  const total = REVERSEMENTS.reduce((a,r)=>a+r.montant,0);
  const ecarts = REVERSEMENTS.filter(r=>r.ecart>0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Recettes & Reversements</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total reversé" value={fmt(total)} color="text-emerald-600"/>
        <StatCard label="Validés" value={REVERSEMENTS.filter(r=>r.status==="Validé").length.toString()} color="text-emerald-600"/>
        <StatCard label="Écarts détectés" value={ecarts.length.toString()} color="text-red-600"/>
        <StatCard label="En attente" value={REVERSEMENTS.filter(r=>r.status==="En attente").length.toString()} color="text-amber-600"/>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Canal</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Écart</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th></tr></thead>
          <tbody>{REVERSEMENTS.map(r=>(
            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-mono text-slate-500">{r.id}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{driverName(r.ch)}</td>
              <td className="px-4 py-3 text-sm font-semibold">{fmt(r.montant)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.canal}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.date}</td>
              <td className="px-4 py-3 text-sm">{r.ecart>0?<span className="text-red-600 font-semibold">{fmt(r.ecart)}</span>:<span className="text-emerald-600">OK</span>}</td>
              <td className="px-4 py-3"><Badge color={sc(r.status)}>{r.status}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {ecarts.length>0 && <div className="bg-red-50 border border-red-200 rounded-xl p-4"><h3 className="font-semibold text-red-800 text-sm mb-2">Règle SAVER : Tolérance maximale 5 000 FCFA</h3><div className="text-sm text-red-700">Écart > 5 000 F = dette chauffeur automatique + retenue sur paie</div></div>}
    </div>
  );
};

// ============================================================
// PAGE: KPI & PAIE
// ============================================================
const KpiPaiePage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">KPI, Paie & Incentives</h1>
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
      <h2 className="font-semibold text-slate-900 mb-3">Règles de rémunération SAVER</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="p-4 bg-emerald-50 rounded-lg"><div className="font-semibold text-emerald-800">Fixe</div><div className="text-emerald-700">75 000 F / 2 semaines</div><div className="text-xs text-emerald-600 mt-1">Si KPI minimum atteint</div></div>
        <div className="p-4 bg-blue-50 rounded-lg"><div className="font-semibold text-blue-800">Bonus</div><div className="text-blue-700">(75k/160) x 1.1 x surplus</div><div className="text-xs text-blue-600 mt-1">Plafond : 25 000 F</div></div>
        <div className="p-4 bg-red-50 rounded-lg"><div className="font-semibold text-red-800">Pénalités</div><div className="text-red-700">Retard: 2k/h · Absence: 10k</div><div className="text-xs text-red-600 mt-1">Déduites automatiquement</div></div>
        <div className="p-4 bg-amber-50 rounded-lg"><div className="font-semibold text-amber-800">KPI minimum</div><div className="text-amber-700">CA ≥ 65k OU ≥ 40 courses</div><div className="text-xs text-amber-600 mt-1">OU 8h/shift dont 7h en ligne</div></div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">Fiche de paie - Période 27/01 au 09/02</h2></div>
      <table className="w-full">
        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th><th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fixe</th><th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Bonus</th><th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pénalités</th><th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Retenue avance</th><th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Net</th></tr></thead>
        <tbody>{PAIE_HISTORY.map(p=>(
          <tr key={p.id} className="border-b border-slate-100">
            <td className="px-4 py-3 text-sm font-medium text-slate-700">{driverName(p.ch)}</td>
            <td className="px-4 py-3 text-sm text-right">{p.fixe>0?fmt(p.fixe):<span className="text-red-500">Ineligible</span>}</td>
            <td className="px-4 py-3 text-sm text-right text-emerald-600">{fmt(p.bonus)}</td>
            <td className="px-4 py-3 text-sm text-right text-red-600">{p.penalites>0?`-${fmt(p.penalites)}`:"—"}</td>
            <td className="px-4 py-3 text-sm text-right text-amber-600">{p.avanceRetenue>0?`-${fmt(p.avanceRetenue)}`:"—"}</td>
            <td className="px-4 py-3 text-sm text-right font-bold">{p.net>=0?<span className="text-emerald-700">{fmt(p.net)}</span>:<span className="text-red-700">{fmt(p.net)}</span>}</td>
          </tr>
        ))}</tbody>
        <tfoot><tr className="bg-slate-50"><td className="px-4 py-3 font-semibold text-sm">TOTAL</td><td className="px-4 py-3 text-right font-semibold text-sm">{fmt(PAIE_HISTORY.reduce((a,p)=>a+p.fixe,0))}</td><td className="px-4 py-3 text-right font-semibold text-sm text-emerald-600">{fmt(PAIE_HISTORY.reduce((a,p)=>a+p.bonus,0))}</td><td className="px-4 py-3 text-right font-semibold text-sm text-red-600">-{fmt(PAIE_HISTORY.reduce((a,p)=>a+p.penalites,0))}</td><td className="px-4 py-3 text-right font-semibold text-sm text-amber-600">-{fmt(PAIE_HISTORY.reduce((a,p)=>a+p.avanceRetenue,0))}</td><td className="px-4 py-3 text-right font-bold text-sm text-blue-700">{fmt(PAIE_HISTORY.reduce((a,p)=>a+p.net,0))}</td></tr></tfoot>
      </table>
    </div>
  </div>
);

// ============================================================
// PAGE: RECHARGE & ENERGIE
// ============================================================
const RechargePage = () => {
  const totalKwh = RECHARGES.reduce((a,r)=>a+r.kWh,0);
  const totalCout = RECHARGES.reduce((a,r)=>a+r.cout,0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Recharge & Énergie (EV Core)</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="kWh total" value={`${totalKwh} kWh`} color="text-blue-600"/>
        <StatCard label="Coût total" value={fmt(totalCout)} color="text-amber-600"/>
        <StatCard label="Coût moyen / kWh" value={fmt(Math.round(totalCout/totalKwh))} color="text-violet-600"/>
        <StatCard label="Recharges" value={RECHARGES.length.toString()} sub="Arnio · Neo · Illigo" color="text-slate-700"/>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Véhicule</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Partenaire</th><th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">kWh</th><th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Coût</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SOC</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Lieu</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th></tr></thead>
          <tbody>{RECHARGES.map(r=>(
            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium">{vhLabel(r.vh)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{driverName(r.ch)}</td>
              <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">{r.partenaire}</Badge></td>
              <td className="px-4 py-3 text-sm text-right font-semibold">{r.kWh}</td>
              <td className="px-4 py-3 text-sm text-right">{fmt(r.cout)}</td>
              <td className="px-4 py-3 text-sm"><span className="text-red-500">{r.socAv}%</span> → <span className="text-emerald-500">{r.socAp}%</span></td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.lieu}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{r.date}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><h3 className="font-semibold text-blue-800 text-sm mb-2">Anti-fraude recharge</h3><div className="text-sm text-blue-700">Bornes whitelistees uniquement · Recharge obligatoire si SOC < 70% au handover · Corrélation kWh / km</div></div>
    </div>
  );
};

// ============================================================
// PAGE: MAINTENANCE & SINISTRES
// ============================================================
const MaintenancePage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Maintenance & Sinistres</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Maintenances planifiées" value={MAINTENANCES.filter(m=>m.status==="Planifiée").length.toString()} color="text-blue-600"/>
      <StatCard label="En cours" value={MAINTENANCES.filter(m=>m.status==="En cours").length.toString()} color="text-amber-600"/>
      <StatCard label="Coût total maintenance" value={fmt(MAINTENANCES.reduce((a,m)=>a+m.cout,0))} color="text-red-600"/>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Interventions</h2>
      <div className="space-y-3">
        {MAINTENANCES.map(m=>(
          <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.type==="Corrective"?"bg-red-100 text-red-600":"bg-blue-100 text-blue-600"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div>
                <div className="font-medium text-sm text-slate-800">{m.desc}</div>
                <div className="text-xs text-slate-400">{vhLabel(m.vh)} · {m.type} · {m.garage}</div>
              </div>
            </div>
            <div className="text-right">
              <Badge color={sc(m.status)}>{m.status}</Badge>
              <div className="text-xs text-slate-400 mt-1">{m.date}{m.cout>0&&` · ${fmt(m.cout)}`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Sinistres</h2>
      <div className="space-y-3">
        {SINISTRES.map(s=>(
          <div key={s.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
            <div><div className="font-medium text-sm text-slate-800">{s.type} - {vhLabel(s.vh)}</div><div className="text-xs text-slate-500">{driverName(s.ch)} · {s.date} · Assurance: {s.assurance}</div></div>
            <div className="text-right"><Badge color={sc(s.status)}>{s.status}</Badge><div className="text-sm font-semibold text-red-600 mt-1">{fmt(s.montant)}</div></div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><h3 className="font-semibold text-slate-700 text-sm mb-2">Règle SAVER</h3><div className="text-sm text-slate-600">Maintenance préventive tous les 15 000 km ou 90 jours · Pièces sinistre obligatoires sous 24h</div></div>
  </div>
);

// ============================================================
// PAGE: GPS & ALERTES
// ============================================================
const GpsPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">GPS & Sécurité</h1>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Carte de la flotte</h2>
        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl h-80 flex items-center justify-center border border-slate-200">
          <div className="text-center text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p className="font-medium">Carte GPS LUOGU</p>
            <p className="text-sm">Intégration API boitier IOT SARL</p>
            <div className="mt-4 flex justify-center gap-4">
              {VEHICLES.map(v=>(
                <div key={v.id} className={`px-3 py-1.5 rounded-full text-xs font-medium ${v.status==="En exploitation"?"bg-emerald-100 text-emerald-700":v.status==="En recharge"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>
                  {v.immat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Alertes actives</h2>
        <div className="space-y-3">
          {ALERTS.filter(a=>!a.read).map(a=>(
            <div key={a.id} className={`p-3 rounded-lg border-l-4 ${a.sev==="critical"?"border-red-500 bg-red-50":a.sev==="warning"?"border-amber-500 bg-amber-50":"border-blue-500 bg-blue-50"}`}>
              <div className="text-sm font-medium text-slate-700">{a.msg}</div>
              <div className="text-xs text-slate-400 mt-1">{a.type} · {a.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Position des véhicules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VEHICLES.map(v=>(
          <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{v.immat}</span>
              <Badge color={sc(v.status)}>{v.status}</Badge>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>GPS: LUOGU-{v.id.split("-")[1]} · {siteName(v.site)}</div>
              <div>Chauffeurs: {v.binome.map(b=>driverName(b)).join(" / ")}</div>
              <SocBar soc={v.soc}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// PAGE: REPORTING
// ============================================================
const ReportingPage = () => {
  const totalCA = DRIVERS.reduce((a,d)=>a+d.ca,0);
  const totalCourses = DRIVERS.reduce((a,d)=>a+d.courses,0);
  const totalPen = DRIVERS.reduce((a,d)=>a+d.pen,0);
  const totalRecharge = RECHARGES.reduce((a,r)=>a+r.cout,0);
  const totalMaint = MAINTENANCES.reduce((a,m)=>a+m.cout,0);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-slate-900">Reporting & Exports</h1>
        <div className="flex gap-2">
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">Export Excel</button>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Export PDF</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="CA cumulé" value={fmt(totalCA)} color="text-emerald-600"/>
        <StatCard label="Courses totales" value={totalCourses.toLocaleString()} color="text-blue-600"/>
        <StatCard label="Coût recharge" value={fmt(totalRecharge)} color="text-amber-600"/>
        <StatCard label="Coût maintenance" value={fmt(totalMaint)} color="text-red-600"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">P&L par véhicule</h2>
          {VEHICLES.map(v=>{
            const vDrivers = DRIVERS.filter(d=>d.vehicule===v.id);
            const vCA = vDrivers.reduce((a,d)=>a+d.ca,0);
            const vRecharge = RECHARGES.filter(r=>r.vh===v.id).reduce((a,r)=>a+r.cout,0);
            const vMaint = MAINTENANCES.filter(m=>m.vh===v.id).reduce((a,m)=>a+m.cout,0);
            const margin = vCA - vRecharge - vMaint;
            return (
              <div key={v.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div><div className="font-medium text-sm">{v.immat}</div><div className="text-xs text-slate-400">{v.modele} · {v.km.toLocaleString()} km</div></div>
                <div className="text-right text-sm">
                  <div className="text-emerald-600">CA: {fmtK(vCA)} F</div>
                  <div className="text-slate-500">Coûts: {fmtK(vRecharge+vMaint)} F</div>
                  <div className="font-bold text-blue-700">Marge: {fmtK(margin)} F</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Performance par site</h2>
          {SITES.map(site=>{
            const sDrivers = DRIVERS.filter(d=>d.site===site.id);
            const sCA = sDrivers.reduce((a,d)=>a+d.ca,0);
            const sVh = VEHICLES.filter(v=>v.site===site.id);
            const sCourses = sDrivers.reduce((a,d)=>a+d.courses,0);
            return (
              <div key={site.id} className="mb-6 last:mb-0">
                <h3 className="font-semibold text-slate-700 mb-3">{site.name}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg"><div className="text-xs text-slate-500">CA</div><div className="font-bold text-emerald-600">{fmt(sCA)}</div></div>
                  <div className="p-3 bg-blue-50 rounded-lg"><div className="text-xs text-slate-500">Courses</div><div className="font-bold text-blue-600">{sCourses.toLocaleString()}</div></div>
                  <div className="p-3 bg-violet-50 rounded-lg"><div className="text-xs text-slate-500">Véhicules</div><div className="font-bold text-violet-600">{sVh.length}</div></div>
                  <div className="p-3 bg-amber-50 rounded-lg"><div className="text-xs text-slate-500">Chauffeurs</div><div className="font-bold text-amber-600">{sDrivers.length}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Rapports disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {["Recettes par chauffeur","Reversements & écarts","KPI & seuils","Paie détaillée","Recharge kWh/coût","Maintenance par VH","P&L analytique","Disponibilité flotte","Audit trail"].map(r=>(
            <button key={r} className="text-left p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <div className="font-medium text-sm text-slate-700">{r}</div>
              <div className="text-xs text-slate-400 mt-1">Excel · PDF · API</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PAGE: SITES
// ============================================================
const SitesPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-slate-900">Sites & Comptes Wave</h1><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Nouveau site</button></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {SITES.map(site=>{
        const sVh = VEHICLES.filter(v=>v.site===site.id);
        const sDr = DRIVERS.filter(d=>d.site===site.id);
        return (
          <div key={site.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-bold text-slate-900">{site.name}</h3><p className="text-sm text-slate-500">{site.ville} · Zone {site.zone}</p></div>
              <Badge color="bg-emerald-100 text-emerald-700">Actif</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-blue-600">{sVh.length}</div><div className="text-xs text-slate-500">Véhicules</div></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-violet-600">{sDr.length}</div><div className="text-xs text-slate-500">Chauffeurs</div></div>
              <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-emerald-600">{sVh.filter(v=>v.status==="En exploitation").length}</div><div className="text-xs text-slate-500">Actifs</div></div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg"><div className="text-xs text-slate-500">Compte Wave Business</div><div className="font-mono font-semibold text-blue-700">{site.waveAccount}</div></div>
          </div>
        );
      })}
    </div>
  </div>
);

// ============================================================
// PAGE: RBAC & AUDIT
// ============================================================
const RbacPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">RBAC & Audit</h1>
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Matrice des permissions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50"><th className="text-left p-3 font-semibold text-slate-700">Action</th><th className="p-3 text-center font-semibold text-slate-700">Chauffeur</th><th className="p-3 text-center font-semibold text-slate-700">Superviseur</th><th className="p-3 text-center font-semibold text-slate-700">Ops</th><th className="p-3 text-center font-semibold text-slate-700">Finance</th><th className="p-3 text-center font-semibold text-slate-700">Admin</th></tr></thead>
          <tbody>
            {[["Effectuer reversement",true,false,false,false,false],["Valider check-in",false,true,true,false,true],["Annuler opération",false,true,false,false,true],["Valider remplacement",false,false,true,false,true],["Autoriser avance",false,false,false,false,true],["Valider dépenses",false,false,false,true,true],["Immobiliser VH",false,false,true,false,true],["Accès reporting",false,false,true,true,true],["Gestion RBAC",false,false,false,false,true]].map(([action,...perms],i)=>(
              <tr key={i} className="border-b border-slate-100"><td className="p-3 text-slate-700">{action}</td>{perms.map((p,j)=><td key={j} className="p-3 text-center">{p?<span className="text-emerald-500 font-bold">✓</span>:<span className="text-slate-300">—</span>}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Journal d'audit (dernières actions)</h2>
      <div className="space-y-2">
        {[
          {user:"Lems Fal",action:"Connexion admin",time:"09/02 12:00",type:"auth"},
          {user:"Yao Patrick",action:"Validation check-in CH-001",time:"09/02 06:05",type:"check"},
          {user:"Konan Jean-Marc",action:"Création planning quotidien",time:"09/02 05:30",type:"planning"},
          {user:"Bénie Marie-Claire",action:"Validation reversement RV-004",time:"09/02 09:30",type:"finance"},
          {user:"Système",action:"Alerte SOC critique VH-005",time:"09/02 08:30",type:"alert"},
          {user:"Système",action:"Détection écart RV-003",time:"09/02 09:15",type:"alert"},
        ].map((log,i)=>(
          <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
            <div className="text-xs text-slate-400 w-24">{log.time}</div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{log.user[0]}</div>
            <div><div className="text-sm text-slate-700">{log.action}</div><div className="text-xs text-slate-400">{log.user}</div></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// SIDEBAR + MAIN LAYOUT
// ============================================================
const NAV = [
  {id:"dashboard",label:"Tableau de bord",icon:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"},
  {id:"vehicules",label:"Véhicules",icon:"M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"},
  {id:"chauffeurs",label:"Chauffeurs",icon:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197V21"},
  {id:"planning",label:"Planning",icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},
  {id:"checkin",label:"Check-in/out",icon:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"},
  {id:"reversements",label:"Reversements",icon:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
  {id:"kpi",label:"KPI & Paie",icon:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"},
  {id:"recharge",label:"Recharge EV",icon:"M13 10V3L4 14h7v7l9-11h-7z"},
  {id:"maintenance",label:"Maintenance",icon:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"},
  {id:"gps",label:"GPS & Sécurité",icon:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"},
  {id:"reporting",label:"Reporting",icon:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},
  {id:"sites",label:"Sites",icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"},
  {id:"rbac",label:"RBAC & Audit",icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"},
];

const NavIcon = ({d,className="w-5 h-5"}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d}/></svg>;

const App = () => {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const unread = ALERTS.filter(a=>!a.read).length;

  if (!user) return <LoginPage onLogin={(role)=>setUser({role, name: role==="admin"?"Lems Fal":role==="ops"?"Konan Jean-Marc":role==="finance"?"Bénie Marie-Claire":"Yao Patrick"})}/>;

  const pages = {dashboard:<DashboardPage/>,vehicules:<VehiculesPage/>,chauffeurs:<ChauffeursPage/>,planning:<PlanningPage/>,checkin:<CheckInPage/>,reversements:<ReversementsPage/>,kpi:<KpiPaiePage/>,recharge:<RechargePage/>,maintenance:<MaintenancePage/>,gps:<GpsPage/>,reporting:<ReportingPage/>,sites:<SitesPage/>,rbac:<RbacPage/>};

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className={`${sideOpen?"w-64":"w-20"} bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          {sideOpen && <div><div className="font-bold text-sm">SAVER Fleet Ops</div><div className="text-xs text-slate-400">Flotte VTC électrique</div></div>}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${page===n.id?"bg-blue-600/20 text-blue-400 border-r-2 border-blue-400":"text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              <NavIcon d={n.icon} className="w-5 h-5 flex-shrink-0"/>
              {sideOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          {sideOpen && <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-xs font-bold">{user.name[0]}</div><div><div className="text-sm font-medium">{user.name}</div><div className="text-xs text-slate-400 capitalize">{user.role}</div></div></div>}
          <button onClick={()=>setUser(null)} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>{sideOpen&&"Déconnexion"}</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <button onClick={()=>setSideOpen(!sideOpen)} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex items-center gap-4">
            <button className="relative text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              {unread>0&&<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unread}</span>}
            </button>
            <div className="h-8 w-px bg-slate-200"/>
            <div className="text-sm text-slate-500">{user.name}</div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{pages[page]}</main>
      </div>
    </div>
  );
};

export default App;
