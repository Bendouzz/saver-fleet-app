import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ============================================================
// INITIAL DATA
// ============================================================
const SITES_INIT = [
  { id: 1, name: "Abidjan", ville: "Abidjan", zone: "Cocody", waveAccount: "WB-ABJ-001" },
  { id: 2, name: "Yamoussoukro", ville: "Yamoussoukro", zone: "Centre", waveAccount: "WB-YAM-001" }
];

const VEHICLES_INIT = [];
const DRIVERS_INIT = [];
const SHIFTS_INIT = [];
const REVERSEMENTS_INIT = [];
const RECHARGES_INIT = [];
const MAINTENANCES_INIT = [];
const ALERTS_INIT = [];
const PAIE_INIT = [];

// ============================================================
// HELPERS
// ============================================================
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n) + " F";
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1) + "M" : n >= 1000 ? Math.round(n/1000) + "k" : n.toString();
const sc = (s) => ({"Actif":"bg-emerald-100 text-emerald-700","En cours":"bg-blue-100 text-blue-700","Planifié":"bg-slate-100 text-slate-600","Terminé":"bg-emerald-100 text-emerald-700","Suspendu":"bg-red-100 text-red-700","Inactif":"bg-slate-200 text-slate-500","En exploitation":"bg-emerald-100 text-emerald-700","En recharge":"bg-amber-100 text-amber-700","Immobilisé":"bg-red-100 text-red-700","Validé":"bg-emerald-100 text-emerald-700","En attente":"bg-amber-100 text-amber-700","Écart détecté":"bg-red-100 text-red-700","Planifiée":"bg-blue-100 text-blue-700","Terminée":"bg-emerald-100 text-emerald-700","En instruction":"bg-amber-100 text-amber-700","Réparé":"bg-emerald-100 text-emerald-700"}[s]||"bg-slate-100 text-slate-600");
const genId = (prefix, list) => `${prefix}-${String(list.length + 1).padStart(3, "0")}`;

// ============================================================
// SHARED COMPONENTS
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

const KpiBar = ({value}) => {
  const col = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full ${col} rounded-full`} style={{width:`${Math.min(value,100)}%`}}/></div><span className="text-xs font-semibold">{value}</span></div>;
};

// Modal générique
const Modal = ({title, onClose, children}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const InputField = ({label, value, onChange, type="text", options, required}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
    {options ? (
      <select value={value} onChange={e=>onChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    )}
  </div>
);

// Confirmation dialog
const ConfirmDialog = ({message, onConfirm, onCancel}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer la suppression</h3>
      <p className="text-slate-500 text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
        <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Supprimer</button>
      </div>
    </div>
  </div>
);

// ============================================================
// AUTH SYSTEM - Supabase
// ============================================================
const ADMIN_DEFAULT = { id: "U-001", name: "Lems Fal", email: "admin@saver.ci", password: "saver2024", role: "admin" };

const getUsers = async () => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error || !data || data.length === 0) return [ADMIN_DEFAULT];
    return data;
  } catch { return [ADMIN_DEFAULT]; }
};

const saveUser = async (user) => {
  try { await supabase.from("users").upsert(user); } catch {}
};

const LoginPage = ({onLogin}) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("ops");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    if (!email || !password) { setLoading(false); return setError("Email et mot de passe requis"); }
    const users = await getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    setLoading(false);
    if (!found) return setError("Email ou mot de passe incorrect");
    onLogin(found);
  };

  const handleRegister = async () => {
    setError(""); setLoading(true);
    if (!name || !email || !password) { setLoading(false); return setError("Tous les champs sont requis"); }
    if (password.length < 6) { setLoading(false); return setError("Mot de passe minimum 6 caractères"); }
    const users = await getUsers();
    if (users.find(u => u.email === email)) { setLoading(false); return setError("Cet email est déjà utilisé"); }
    const newUser = { id: `U-${Date.now()}`, name, email, password, role };
    await saveUser(newUser);
    setLoading(false);
    setSuccess("Compte créé ! Vous pouvez vous connecter.");
    setMode("login");
    setEmail(email);
    setPassword("");
  };

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
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button className="flex-1 py-2 rounded-lg text-sm font-medium bg-white text-slate-900">Connexion</button>
          </div>

          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-sm px-4 py-2 rounded-lg mb-4">{success}</div>}

          <div className="space-y-4">
              <div>
                <label className="block text-sm text-blue-200 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
              </div>
              <div>
                <label className="block text-sm text-blue-200 mb-1.5">Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
              </div>
              <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all shadow-lg">
                Se connecter
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD
// ============================================================
const DashboardPage = ({vehicles, drivers, shifts, reversements, alerts, recharges}) => {
  const [periode, setPeriode] = useState("jour");

  // Stats véhicules
  const activeVh = vehicles.filter(v=>v.status==="En exploitation").length;
  const enRechargeVh = vehicles.filter(v=>v.status==="En recharge").length;
  const immobiliseVh = vehicles.filter(v=>v.status==="Immobilisé" || v.status==="Maintenance").length;
  const avgSoc = vehicles.length > 0 ? Math.round(vehicles.reduce((a,v)=>a+v.soc,0)/vehicles.length) : 0;

  // Stats shifts
  const shiftEnCours = shifts.filter(s=>s.status==="En cours").length;
  const shiftPlanifie = shifts.filter(s=>s.status==="Planifié").length;
  const shiftTermine = shifts.filter(s=>s.status==="Terminé").length;

  // Stats recettes selon période
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now()-7*24*60*60*1000).toISOString().split("T")[0];
  const monthAgo = new Date(Date.now()-30*24*60*60*1000).toISOString().split("T")[0];
  const filterDate = periode==="jour" ? today : periode==="semaine" ? weekAgo : monthAgo;
  const totalRecette = shifts.reduce((a,s)=>a+s.recette,0);
  const totalReverse = reversements.filter(r=>r.status==="Validé").reduce((a,r)=>a+r.montant,0);
  const reversementsFiltered = reversements.filter(r=> !filterDate || r.date >= filterDate);
  const recetteFiltered = reversementsFiltered.reduce((a,r)=>a+r.montant,0);

  // Stats chauffeurs
  const totalDrivers = drivers.filter(d=>d.status==="Actif").length;
  const topDrivers = [...drivers].sort((a,b)=>b.ca-a.ca).slice(0,5);

  const alertCount = alerts.filter(a=>!a.read).length;
  const driverName = (id) => { const d=drivers.find(x=>x.id===id); return d?d.prenom+" "+d.nom:"—"; };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm">Vue temps réel · {new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex gap-2">
          {["jour","semaine","mois"].map(p=>(
            <button key={p} onClick={()=>setPeriode(p)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${periode===p?"bg-blue-600 text-white":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`Recettes (${periode})`} value={fmt(recetteFiltered)} sub={`Total cumulé : ${fmt(totalRecette)}`} color="text-emerald-600" icon={{bg:"bg-emerald-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}} />
        <StatCard label="Shifts actifs" value={shiftEnCours.toString()} sub={`${shiftPlanifie} planifiés · ${shiftTermine} terminés`} color="text-blue-600" icon={{bg:"bg-blue-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}} />
        <StatCard label="Chauffeurs actifs" value={totalDrivers.toString()} sub={`${drivers.filter(d=>d.status==="Suspendu").length} suspendu(s)`} color="text-violet-600" icon={{bg:"bg-violet-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>}} />
        <StatCard label="Alertes actives" value={alertCount.toString()} sub={`${alerts.filter(a=>!a.read&&a.sev==="critical").length} critiques`} color="text-red-600" icon={{bg:"bg-red-500",el:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}} />
      </div>

      {/* Véhicules status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">En exploitation</span>
            <span className="text-2xl font-bold text-emerald-700">{activeVh}</span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width:`${vehicles.length>0?(activeVh/vehicles.length)*100:0}%`}}/></div>
          <div className="text-xs text-emerald-600 mt-1">{vehicles.length > 0 ? Math.round((activeVh/vehicles.length)*100) : 0}% de la flotte</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-700">En recharge</span>
            <span className="text-2xl font-bold text-amber-700">{enRechargeVh}</span>
          </div>
          <div className="w-full bg-amber-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{width:`${vehicles.length>0?(enRechargeVh/vehicles.length)*100:0}%`}}/></div>
          <div className="text-xs text-amber-600 mt-1">SOC moyen : {avgSoc}%</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Immobilisés</span>
            <span className="text-2xl font-bold text-red-700">{immobiliseVh}</span>
          </div>
          <div className="w-full bg-red-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{width:`${vehicles.length>0?(immobiliseVh/vehicles.length)*100:0}%`}}/></div>
          <div className="text-xs text-red-600 mt-1">{vehicles.length > 0 ? Math.round((immobiliseVh/vehicles.length)*100) : 0}% de la flotte</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Cashflow</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-emerald-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Recettes</div><div className="text-lg font-bold text-emerald-600">{fmt(totalRecette)}</div></div>
            <div className="text-center p-4 bg-blue-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Reversés</div><div className="text-lg font-bold text-blue-600">{fmt(totalReverse)}</div></div>
            <div className="text-center p-4 bg-amber-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">En attente</div><div className="text-lg font-bold text-amber-600">{fmt(totalRecette-totalReverse)}</div></div>
          </div>
          {/* Top chauffeurs */}
          <h3 className="text-sm font-semibold text-slate-700 mb-3">🏆 Top chauffeurs par CA</h3>
          <div className="space-y-2">
            {topDrivers.length > 0 ? topDrivers.map((d,i)=>(
              <div key={d.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i===0?"bg-yellow-500":i===1?"bg-slate-400":i===2?"bg-amber-600":"bg-slate-300"}`}>{i+1}</div>
                <div className="flex-1"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">{d.prenom} {d.nom}</span><span className="text-sm font-semibold text-emerald-600">{fmt(d.ca)}</span></div><div className="w-full bg-slate-100 rounded-full h-1.5 mt-1"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width:`${topDrivers[0].ca>0?(d.ca/topDrivers[0].ca)*100:0}%`}}/></div></div>
              </div>
            )) : <div className="text-sm text-slate-400 text-center py-4">Aucun chauffeur enregistré</div>}
          </div>
        </div>

        {/* Alertes + derniers reversements */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Derniers reversements</h2>
            <div className="space-y-2">
              {reversements.slice(0,4).map(r=>(
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{driverName(r.ch).charAt(0)}</div><div><div className="text-xs font-medium text-slate-700">{driverName(r.ch)}</div><div className="text-xs text-slate-400">{r.canal}</div></div></div>
                  <div className="text-right"><div className="text-xs font-semibold">{fmt(r.montant)}</div><Badge color={sc(r.status)}>{r.status}</Badge></div>
                </div>
              ))}
              {reversements.length === 0 && <div className="text-sm text-slate-400 text-center py-2">Aucun reversement</div>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-3">Alertes</h2>
            <div className="space-y-2">
              {alerts.filter(a=>!a.read).slice(0,4).map(a=>(
                <div key={a.id} className={`flex gap-2 p-2 rounded-lg border-l-4 bg-slate-50 ${a.sev==="critical"?"border-red-500":a.sev==="warning"?"border-amber-500":"border-blue-500"}`}>
                  <div><div className="text-xs font-medium text-slate-700">{a.msg}</div><div className="text-xs text-slate-400">{a.type}</div></div>
                </div>
              ))}
              {alerts.filter(a=>!a.read).length===0 && <div className="text-sm text-slate-400 text-center py-2">Aucune alerte active ✅</div>}
            </div>
          </div>
        </div>
      </div>

      {/* État de charge flotte */}
      {vehicles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">État de charge de la flotte</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v=>(
              <div key={v.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div><div className="font-medium text-sm text-slate-800">{v.immat}</div><div className="text-xs text-slate-400">{v.modele}</div><Badge color={sc(v.status)}>{v.status}</Badge></div>
                <div className="text-right"><SocBar soc={v.soc}/><div className="text-xs text-slate-400 mt-1">{v.km.toLocaleString()} km</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// VEHICULES PAGE - FULL CRUD
// ============================================================
const VehiculesPage = ({vehicles, onAdd, onUpdate, onDelete}) => {
  const SITES = SITES_INIT;
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({immat:"",modele:"",site:1,autonomie:400,km:0,soc:100,status:"En exploitation"});

  const siteName = (id) => SITES.find(s=>s.id===id)?.name||"";
  const filtered = filter==="all" ? vehicles : vehicles.filter(v=>v.site===parseInt(filter));

  const openAdd = () => { setForm({immat:"",modele:"",site:1,autonomie:400,km:0,soc:100,status:"En exploitation"}); setEditItem(null); setShowModal(true); };
  const openEdit = (v) => { setForm({...v}); setEditItem(v.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.immat || !form.modele) return alert("Immatriculation et modèle requis");
    setSaving(true);
    const data = {...form, site:parseInt(form.site), km:parseInt(form.km), soc:parseInt(form.soc), autonomie:parseInt(form.autonomie)};
    if (editItem) {
      await onUpdate(editItem, data);
    } else {
      const newId = genId("VH", vehicles);
      await onAdd({...data, id: newId});
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await onDelete(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Véhicules</h1>
        <div className="flex gap-2">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous les sites</option><option value="1">Abidjan</option><option value="2">Yamoussoukro</option>
          </select>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Ajouter
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Véhicule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Site</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SOC</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Km</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(v=>(
              <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3"><div className="font-medium text-sm text-slate-800">{v.immat}</div><div className="text-xs text-slate-400">{v.modele}</div></td>
                <td className="px-4 py-3 text-sm text-slate-600">{siteName(v.site)}</td>
                <td className="px-4 py-3"><SocBar soc={v.soc}/></td>
                <td className="px-4 py-3 text-sm text-slate-600">{v.km.toLocaleString()}</td>
                <td className="px-4 py-3"><Badge color={sc(v.status)}>{v.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(v)} className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                    <button onClick={()=>setConfirmDelete(v)} className="text-red-600 hover:text-red-800 text-xs font-medium border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier le véhicule" : "Ajouter un véhicule"} onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <InputField label="Immatriculation" value={form.immat} onChange={v=>setForm({...form,immat:v})} required />
            <InputField label="Modèle" value={form.modele} onChange={v=>setForm({...form,modele:v})} required />
            <InputField label="Site" value={form.site} onChange={v=>setForm({...form,site:v})} options={[{value:1,label:"Abidjan"},{value:2,label:"Yamoussoukro"}]} />
            <InputField label="Autonomie (km)" value={form.autonomie} onChange={v=>setForm({...form,autonomie:v})} type="number" />
            <InputField label="Kilométrage" value={form.km} onChange={v=>setForm({...form,km:v})} type="number" />
            <InputField label="SOC (%)" value={form.soc} onChange={v=>setForm({...form,soc:v})} type="number" />
            <InputField label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={[{value:"En exploitation",label:"En exploitation"},{value:"En recharge",label:"En recharge"},{value:"Maintenance",label:"Maintenance"},{value:"Immobilisé",label:"Immobilisé"}]} />
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Supprimer le véhicule ${confirmDelete.immat} ?`}
          onConfirm={()=>handleDelete(confirmDelete.id)}
          onCancel={()=>setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

// ============================================================
// CHAUFFEURS PAGE - FULL CRUD
// ============================================================
const ChauffeursPage = ({drivers, onAdd, onUpdate, onDelete, vehicles}) => {
  const SITES = SITES_INIT;
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({nom:"",prenom:"",site:1,vehicule:"",shift:"A",status:"Actif",kpi:80,courses:0,ca:0,pen:0,avance:0});

  const siteName = (id) => SITES.find(s=>s.id===id)?.name||"";
  const vhLabel = (id) => vehicles.find(x=>x.id===id)?.immat||"—";
  const filtered = drivers.filter(d => !search || `${d.prenom} ${d.nom}`.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({nom:"",prenom:"",site:1,vehicule:"",shift:"A",status:"Actif",kpi:80,courses:0,ca:0,pen:0,avance:0}); setEditItem(null); setShowModal(true); };
  const openEdit = (d) => { setForm({...d}); setEditItem(d.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nom || !form.prenom) return alert("Nom et prénom requis");
    if (editItem) {
      await onUpdate(editItem, {...form, site:parseInt(form.site), kpi:parseInt(form.kpi), courses:parseInt(form.courses), ca:parseInt(form.ca), pen:parseInt(form.pen), avance:parseInt(form.avance)});
    } else {
      const newId = genId("CH", drivers);
      await onAdd({...form, id:newId, site:parseInt(form.site), kpi:parseInt(form.kpi), courses:parseInt(form.courses), ca:parseInt(form.ca), pen:parseInt(form.pen), avance:parseInt(form.avance)});
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => { await onDelete(id); setConfirmDelete(null); };

  if (detail) {
    const d = drivers.find(x=>x.id===detail);
    if (!d) { setDetail(null); return null; }
    return (
      <div className="space-y-6">
        <button onClick={()=>setDetail(null)} className="text-sm text-blue-600 hover:underline">← Retour</button>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">{d.prenom[0]}{d.nom[0]}</div>
            <div><h2 className="text-xl font-bold text-slate-900">{d.prenom} {d.nom}</h2><p className="text-slate-500 text-sm">{d.id} · Shift {d.shift} · {siteName(d.site)}</p><Badge color={sc(d.status)}>{d.status}</Badge></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">Véhicule</div><div className="font-semibold text-sm">{vhLabel(d.vehicule)}</div></div>
            <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">Score KPI</div><KpiBar value={d.kpi}/></div>
            <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">Courses totales</div><div className="font-semibold text-sm">{d.courses.toLocaleString()}</div></div>
            <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">CA total</div><div className="font-semibold text-sm text-emerald-600">{fmt(d.ca)}</div></div>
            <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">Pénalités</div><div className="font-semibold text-sm text-red-600">{fmt(d.pen)}</div></div>
            <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">Avance en cours</div><div className="font-semibold text-sm text-amber-600">{fmt(d.avance)}</div></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>openEdit(d)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Modifier</button>
            <button onClick={()=>setConfirmDelete(d)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">Supprimer</button>
          </div>
        </div>
        {showModal && (
          <Modal title="Modifier le chauffeur" onClose={()=>setShowModal(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Prénom" value={form.prenom} onChange={v=>setForm({...form,prenom:v})} required />
                <InputField label="Nom" value={form.nom} onChange={v=>setForm({...form,nom:v})} required />
              </div>
              <InputField label="Site" value={form.site} onChange={v=>setForm({...form,site:v})} options={[{value:1,label:"Abidjan"},{value:2,label:"Yamoussoukro"}]} />
              <InputField label="Shift" value={form.shift} onChange={v=>setForm({...form,shift:v})} options={[{value:"A",label:"Shift A (06h-14h)"},{value:"B",label:"Shift B (15h-23h)"}]} />
              <InputField label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={[{value:"Actif",label:"Actif"},{value:"Suspendu",label:"Suspendu"},{value:"Inactif",label:"Inactif"}]} />
              <InputField label="KPI" value={form.kpi} onChange={v=>setForm({...form,kpi:v})} type="number" />
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Annuler</button>
                <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Enregistrer</button>
              </div>
            </div>
          </Modal>
        )}
        {confirmDelete && <ConfirmDialog message={`Supprimer ${confirmDelete.prenom} ${confirmDelete.nom} ?`} onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Chauffeurs</h1>
        <div className="flex gap-2">
          <div className="relative"><svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Site</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Véhicule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Shift</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">KPI</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(d=>(
              <tr key={d.id} className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors">
                <td className="px-4 py-3" onClick={()=>setDetail(d.id)}><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">{d.prenom[0]}{d.nom[0]}</div><div><div className="font-medium text-sm text-slate-800">{d.prenom} {d.nom}</div><div className="text-xs text-slate-400">{d.id}</div></div></div></td>
                <td className="px-4 py-3 text-sm text-slate-600">{siteName(d.site)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{vhLabel(d.vehicule)}</td>
                <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">Shift {d.shift}</Badge></td>
                <td className="px-4 py-3"><KpiBar value={d.kpi}/></td>
                <td className="px-4 py-3"><Badge color={sc(d.status)}>{d.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={()=>openEdit(d)} className="text-blue-600 text-xs font-medium border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                    <button onClick={()=>setConfirmDelete(d)} className="text-red-600 text-xs font-medium border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier le chauffeur" : "Ajouter un chauffeur"} onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Prénom" value={form.prenom} onChange={v=>setForm({...form,prenom:v})} required />
              <InputField label="Nom" value={form.nom} onChange={v=>setForm({...form,nom:v})} required />
            </div>
            <InputField label="Site" value={form.site} onChange={v=>setForm({...form,site:v})} options={[{value:1,label:"Abidjan"},{value:2,label:"Yamoussoukro"}]} />
            <InputField label="Véhicule" value={form.vehicule} onChange={v=>setForm({...form,vehicule:v})} options={[{value:"",label:"— Choisir —"},...vehicles.map(v=>({value:v.id,label:v.immat}))]} />
            <InputField label="Shift" value={form.shift} onChange={v=>setForm({...form,shift:v})} options={[{value:"A",label:"Shift A (06h-14h)"},{value:"B",label:"Shift B (15h-23h)"}]} />
            <InputField label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={[{value:"Actif",label:"Actif"},{value:"Suspendu",label:"Suspendu"},{value:"Inactif",label:"Inactif"}]} />
            <InputField label="KPI (/100)" value={form.kpi} onChange={v=>setForm({...form,kpi:v})} type="number" />
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete && <ConfirmDialog message={`Supprimer ${confirmDelete.prenom} ${confirmDelete.nom} ?`} onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />}
    </div>
  );
};

// ============================================================
// SHIFTS PAGE - FULL CRUD
// ============================================================
const PlanningPage = ({shifts, onAdd, onUpdate, onDelete, vehicles, drivers}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({vh:"",ch:"",type:"A",debut:"06:00",fin:"14:00",status:"Planifié",checkIn:false,checkOut:false,recette:0,reverse:0});

  const driverName = (id) => { const d=drivers.find(x=>x.id===id); return d?d.prenom+" "+d.nom:"—"; };
  const vhLabel = (id) => vehicles.find(x=>x.id===id)?.immat||"—";

  const openAdd = () => { setForm({vh:"",ch:"",type:"A",debut:"06:00",fin:"14:00",status:"Planifié",checkIn:false,checkOut:false,recette:0,reverse:0}); setEditItem(null); setShowModal(true); };
  const openEdit = (s) => { setForm({...s}); setEditItem(s.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.vh || !form.ch) return alert("Véhicule et chauffeur requis");
    if (editItem) {
      await onUpdate(editItem, {...form, recette:parseInt(form.recette), reverse:parseInt(form.reverse)});
    } else {
      const newId = genId("SH", shifts);
      await onAdd({...form, id:newId, recette:parseInt(form.recette), reverse:parseInt(form.reverse)});
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => { await onDelete(id); setConfirmDelete(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Planning du jour</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter shift</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["A","B"].map(type => (
          <div key={type} className={`${type==="A"?"bg-blue-50 border-blue-200":"bg-violet-50 border-violet-200"} rounded-xl border p-4`}>
            <h3 className={`font-semibold mb-3 ${type==="A"?"text-blue-800":"text-violet-800"}`}>Shift {type} · {type==="A"?"06:00 - 14:00":"15:00 - 23:00"}</h3>
            <div className="space-y-2">
              {shifts.filter(s=>s.type===type).map(s=>(
                <div key={s.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div><div className="font-medium text-sm">{driverName(s.ch)}</div><div className="text-xs text-slate-400">{vhLabel(s.vh)}</div></div>
                  <div className="flex items-center gap-2">
                    <Badge color={sc(s.status)}>{s.status}</Badge>
                    {s.recette>0&&<span className="text-xs font-semibold text-emerald-600">{fmt(s.recette)}</span>}
                    <button onClick={()=>openEdit(s)} className="text-blue-600 text-xs border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50">Modifier</button>
                    <button onClick={()=>setConfirmDelete(s)} className="text-red-600 text-xs border border-red-200 px-2 py-0.5 rounded hover:bg-red-50">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier le shift" : "Ajouter un shift"} onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <InputField label="Véhicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"— Choisir —"},...vehicles.map(v=>({value:v.id,label:v.immat}))]} required />
            <InputField label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"— Choisir —"},...drivers.map(d=>({value:d.id,label:`${d.prenom} ${d.nom}`}))]} required />
            <InputField label="Type de shift" value={form.type} onChange={v=>setForm({...form,type:v})} options={[{value:"A",label:"Shift A (06h-14h)"},{value:"B",label:"Shift B (15h-23h)"}]} />
            <InputField label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={[{value:"Planifié",label:"Planifié"},{value:"En cours",label:"En cours"},{value:"Terminé",label:"Terminé"},{value:"Suspendu",label:"Suspendu"}]} />
            <InputField label="Recette (F)" value={form.recette} onChange={v=>setForm({...form,recette:v})} type="number" />
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete && <ConfirmDialog message="Supprimer ce shift ?" onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />}
    </div>
  );
};

// ============================================================
// REVERSEMENTS PAGE - FULL CRUD
// ============================================================
const ReversementsPage = ({reversements, onAdd, onUpdate, onDelete, drivers}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ch:"",montant:0,canal:"Wave",date:new Date().toISOString().split("T")[0],status:"En attente",ecart:0});

  const driverName = (id) => { const d=drivers.find(x=>x.id===id); return d?d.prenom+" "+d.nom:"—"; };
  const total = reversements.reduce((a,r)=>a+r.montant,0);

  const openAdd = () => { setForm({ch:"",montant:0,canal:"Wave",date:new Date().toISOString().split("T")[0],status:"En attente",ecart:0}); setEditItem(null); setShowModal(true); };
  const openEdit = (r) => { setForm({...r}); setEditItem(r.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.ch) return alert("Chauffeur requis");
    if (editItem) {
      await onUpdate(editItem, {...form, montant:parseInt(form.montant), ecart:parseInt(form.ecart)});
    } else {
      const newId = genId("RV", reversements);
      await onAdd({...form, id:newId, montant:parseInt(form.montant), ecart:parseInt(form.ecart)});
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => { await onDelete(id); setConfirmDelete(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Recettes & Reversements</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total reversé" value={fmt(total)} color="text-emerald-600"/>
        <StatCard label="Validés" value={reversements.filter(r=>r.status==="Validé").length.toString()} color="text-emerald-600"/>
        <StatCard label="Écarts détectés" value={reversements.filter(r=>r.ecart>0).length.toString()} color="text-red-600"/>
        <StatCard label="En attente" value={reversements.filter(r=>r.status==="En attente").length.toString()} color="text-amber-600"/>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Canal</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Écart</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>{reversements.map(r=>(
            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-mono text-slate-500">{r.id}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{driverName(r.ch)}</td>
              <td className="px-4 py-3 text-sm font-semibold">{fmt(r.montant)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.canal}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{r.date}</td>
              <td className="px-4 py-3 text-sm">{r.ecart>0?<span className="text-red-600 font-semibold">{fmt(r.ecart)}</span>:<span className="text-emerald-600">OK</span>}</td>
              <td className="px-4 py-3"><Badge color={sc(r.status)}>{r.status}</Badge></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={()=>openEdit(r)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                  <button onClick={()=>setConfirmDelete(r)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier le reversement" : "Ajouter un reversement"} onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <InputField label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"— Choisir —"},...drivers.map(d=>({value:d.id,label:`${d.prenom} ${d.nom}`}))]} required />
            <InputField label="Montant (F)" value={form.montant} onChange={v=>setForm({...form,montant:v})} type="number" />
            <InputField label="Canal" value={form.canal} onChange={v=>setForm({...form,canal:v})} options={[{value:"Wave",label:"Wave Business"},{value:"Orange Money",label:"Orange Money"},{value:"Cash",label:"Cash"}]} />
            <InputField label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date" />
            <InputField label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={[{value:"En attente",label:"En attente"},{value:"Validé",label:"Validé"},{value:"Écart détecté",label:"Écart détecté"}]} />
            <InputField label="Écart (F)" value={form.ecart} onChange={v=>setForm({...form,ecart:v})} type="number" />
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete && <ConfirmDialog message="Supprimer ce reversement ?" onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />}
    </div>
  );
};

// ============================================================
// MAINTENANCE PAGE - FULL CRUD
// ============================================================
const MaintenancePage = ({maintenances, onAdd, onUpdate, onDelete, vehicles}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({vh:"",type:"Préventive",desc:"",status:"Planifiée",date:"",cout:0,garage:""});

  const vhLabel = (id) => vehicles.find(x=>x.id===id)?.immat||"—";

  const openAdd = () => { setForm({vh:"",type:"Préventive",desc:"",status:"Planifiée",date:new Date().toISOString().split("T")[0],cout:0,garage:""}); setEditItem(null); setShowModal(true); };
  const openEdit = (m) => { setForm({...m}); setEditItem(m.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.vh || !form.desc) return alert("Véhicule et description requis");
    if (editItem) {
      await onUpdate(editItem, {...form, cout:parseInt(form.cout)});
    } else {
      const newId = genId("MT", maintenances);
      await onAdd({...form, id:newId, cout:parseInt(form.cout)});
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => { await onDelete(id); setConfirmDelete(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Planifiées" value={maintenances.filter(m=>m.status==="Planifiée").length.toString()} color="text-blue-600"/>
        <StatCard label="En cours" value={maintenances.filter(m=>m.status==="En cours").length.toString()} color="text-amber-600"/>
        <StatCard label="Coût total" value={fmt(maintenances.reduce((a,m)=>a+m.cout,0))} color="text-red-600"/>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="space-y-3">
          {maintenances.map(m=>(
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
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Badge color={sc(m.status)}>{m.status}</Badge>
                  <div className="text-xs text-slate-400 mt-1">{m.date}{m.cout>0&&` · ${fmt(m.cout)}`}</div>
                </div>
                <button onClick={()=>openEdit(m)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                <button onClick={()=>setConfirmDelete(m)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier la maintenance" : "Ajouter une maintenance"} onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <InputField label="Véhicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"— Choisir —"},...vehicles.map(v=>({value:v.id,label:v.immat}))]} required />
            <InputField label="Type" value={form.type} onChange={v=>setForm({...form,type:v})} options={[{value:"Préventive",label:"Préventive"},{value:"Corrective",label:"Corrective"},{value:"Inspection",label:"Inspection"}]} />
            <InputField label="Description" value={form.desc} onChange={v=>setForm({...form,desc:v})} required />
            <InputField label="Garage" value={form.garage} onChange={v=>setForm({...form,garage:v})} />
            <InputField label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date" />
            <InputField label="Coût (F)" value={form.cout} onChange={v=>setForm({...form,cout:v})} type="number" />
            <InputField label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={[{value:"Planifiée",label:"Planifiée"},{value:"En cours",label:"En cours"},{value:"Terminée",label:"Terminée"},{value:"Annulée",label:"Annulée"}]} />
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete && <ConfirmDialog message="Supprimer cette maintenance ?" onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />}
    </div>
  );
};

// ============================================================
// RECHARGE PAGE - FULL CRUD
// ============================================================
const RechargePage = ({recharges, onAdd, onUpdate, onDelete, vehicles, drivers}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({vh:"",ch:"",partenaire:"Arnio",kWh:0,cout:0,lieu:"",duree:0,socAv:0,socAp:0,date:new Date().toISOString().split("T")[0]});

  const vhLabel = (id) => vehicles.find(x=>x.id===id)?.immat||"—";
  const driverName = (id) => { const d=drivers.find(x=>x.id===id); return d?d.prenom+" "+d.nom:"—"; };

  const openAdd = () => { setForm({vh:"",ch:"",partenaire:"Arnio",kWh:0,cout:0,lieu:"",duree:0,socAv:0,socAp:0,date:new Date().toISOString().split("T")[0]}); setEditItem(null); setShowModal(true); };
  const openEdit = (r) => { setForm({...r}); setEditItem(r.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.vh) return alert("Véhicule requis");
    if (editItem) {
      await onUpdate(editItem, {...form, kWh:parseInt(form.kWh), cout:parseInt(form.cout), duree:parseInt(form.duree), socAv:parseInt(form.socAv), socAp:parseInt(form.socAp)});
    } else {
      const newId = genId("RC", recharges);
      await onAdd({...form, id:newId, kWh:parseInt(form.kWh), cout:parseInt(form.cout), duree:parseInt(form.duree), socAv:parseInt(form.socAv), socAp:parseInt(form.socAp)});
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => { await onDelete(id); setConfirmDelete(null); };

  const totalKwh = recharges.reduce((a,r)=>a+r.kWh,0);
  const totalCout = recharges.reduce((a,r)=>a+r.cout,0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Recharge & Énergie</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="kWh total" value={`${totalKwh} kWh`} color="text-blue-600"/>
        <StatCard label="Coût total" value={fmt(totalCout)} color="text-amber-600"/>
        <StatCard label="Coût moyen / kWh" value={totalKwh>0?fmt(Math.round(totalCout/totalKwh)):"—"} color="text-violet-600"/>
        <StatCard label="Recharges" value={recharges.length.toString()} color="text-slate-700"/>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Véhicule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Partenaire</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">kWh</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Coût</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SOC</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>{recharges.map(r=>(
            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium">{vhLabel(r.vh)}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{driverName(r.ch)}</td>
              <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">{r.partenaire}</Badge></td>
              <td className="px-4 py-3 text-sm text-right font-semibold">{r.kWh}</td>
              <td className="px-4 py-3 text-sm text-right">{fmt(r.cout)}</td>
              <td className="px-4 py-3 text-sm"><span className="text-red-500">{r.socAv}%</span> → <span className="text-emerald-500">{r.socAp}%</span></td>
              <td className="px-4 py-3 text-sm text-slate-500">{r.date}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={()=>openEdit(r)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                  <button onClick={()=>setConfirmDelete(r)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editItem ? "Modifier la recharge" : "Ajouter une recharge"} onClose={()=>setShowModal(false)}>
          <div className="space-y-4">
            <InputField label="Véhicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"— Choisir —"},...vehicles.map(v=>({value:v.id,label:v.immat}))]} required />
            <InputField label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"— Choisir —"},...drivers.map(d=>({value:d.id,label:`${d.prenom} ${d.nom}`}))]} />
            <InputField label="Partenaire" value={form.partenaire} onChange={v=>setForm({...form,partenaire:v})} options={[{value:"Arnio",label:"Arnio"},{value:"Neo",label:"Neo"},{value:"Illigo",label:"Illigo"}]} />
            <InputField label="Lieu" value={form.lieu} onChange={v=>setForm({...form,lieu:v})} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="kWh" value={form.kWh} onChange={v=>setForm({...form,kWh:v})} type="number" />
              <InputField label="Coût (F)" value={form.cout} onChange={v=>setForm({...form,cout:v})} type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="SOC avant (%)" value={form.socAv} onChange={v=>setForm({...form,socAv:v})} type="number" />
              <InputField label="SOC après (%)" value={form.socAp} onChange={v=>setForm({...form,socAp:v})} type="number" />
            </div>
            <InputField label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date" />
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">{editItem?"Enregistrer":"Ajouter"}</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete && <ConfirmDialog message="Supprimer cette recharge ?" onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />}
    </div>
  );
};

// ============================================================
// KPI & PAIE PAGE
// ============================================================
const KpiPaiePage = ({paie, drivers}) => {
  const driverName = (id) => { const d=drivers.find(x=>x.id===id); return d?d.prenom+" "+d.nom:"—"; };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">KPI, Paie & Incentives</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
        <h2 className="font-semibold text-slate-900 mb-3">Règles de rémunération SAVER</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-emerald-50 rounded-lg"><div className="font-semibold text-emerald-800">Fixe</div><div className="text-emerald-700">75 000 F / 2 semaines</div></div>
          <div className="p-4 bg-blue-50 rounded-lg"><div className="font-semibold text-blue-800">Bonus</div><div className="text-blue-700">(75k/160) x 1.1 x surplus</div></div>
          <div className="p-4 bg-red-50 rounded-lg"><div className="font-semibold text-red-800">Pénalités</div><div className="text-red-700">Retard: 2k/h · Absence: 10k</div></div>
          <div className="p-4 bg-amber-50 rounded-lg"><div className="font-semibold text-amber-800">KPI minimum</div><div className="text-amber-700">CA ≥ 65k OU ≥ 40 courses</div></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200"><h2 className="font-semibold text-slate-900">Fiche de paie</h2></div>
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fixe</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Bonus</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pénalités</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Retenue</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Net</th>
          </tr></thead>
          <tbody>{paie.map(p=>(
            <tr key={p.id} className="border-b border-slate-100">
              <td className="px-4 py-3 text-sm font-medium text-slate-700">{driverName(p.ch)}</td>
              <td className="px-4 py-3 text-sm text-right">{p.fixe>0?fmt(p.fixe):<span className="text-red-500">Inéligible</span>}</td>
              <td className="px-4 py-3 text-sm text-right text-emerald-600">{fmt(p.bonus)}</td>
              <td className="px-4 py-3 text-sm text-right text-red-600">{p.penalites>0?`-${fmt(p.penalites)}`:"—"}</td>
              <td className="px-4 py-3 text-sm text-right text-amber-600">{p.avanceRetenue>0?`-${fmt(p.avanceRetenue)}`:"—"}</td>
              <td className="px-4 py-3 text-sm text-right font-bold">{p.net>=0?<span className="text-emerald-700">{fmt(p.net)}</span>:<span className="text-red-700">{fmt(p.net)}</span>}</td>
            </tr>
          ))}</tbody>
          <tfoot><tr className="bg-slate-50">
            <td className="px-4 py-3 font-semibold text-sm">TOTAL</td>
            <td className="px-4 py-3 text-right font-semibold text-sm">{fmt(paie.reduce((a,p)=>a+p.fixe,0))}</td>
            <td className="px-4 py-3 text-right font-semibold text-sm text-emerald-600">{fmt(paie.reduce((a,p)=>a+p.bonus,0))}</td>
            <td className="px-4 py-3 text-right font-semibold text-sm text-red-600">-{fmt(paie.reduce((a,p)=>a+p.penalites,0))}</td>
            <td className="px-4 py-3 text-right font-semibold text-sm text-amber-600">-{fmt(paie.reduce((a,p)=>a+p.avanceRetenue,0))}</td>
            <td className="px-4 py-3 text-right font-bold text-sm text-blue-700">{fmt(paie.reduce((a,p)=>a+p.net,0))}</td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// GPS PAGE
// ============================================================
const GpsPage = ({vehicles, alerts}) => (
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
            <div className="mt-4 flex justify-center flex-wrap gap-2">
              {vehicles.map(v=>(
                <div key={v.id} className={`px-3 py-1.5 rounded-full text-xs font-medium ${v.status==="En exploitation"?"bg-emerald-100 text-emerald-700":v.status==="En recharge"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>{v.immat}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Alertes actives</h2>
        <div className="space-y-3">
          {alerts.filter(a=>!a.read).map(a=>(
            <div key={a.id} className={`p-3 rounded-lg border-l-4 ${a.sev==="critical"?"border-red-500 bg-red-50":a.sev==="warning"?"border-amber-500 bg-amber-50":"border-blue-500 bg-blue-50"}`}>
              <div className="text-sm font-medium text-slate-700">{a.msg}</div>
              <div className="text-xs text-slate-400 mt-1">{a.type} · {a.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// REPORTING PAGE
// ============================================================
const ReportingPage = ({vehicles, drivers, recharges, maintenances}) => {
  const totalCA = drivers.reduce((a,d)=>a+d.ca,0);
  const totalCourses = drivers.reduce((a,d)=>a+d.courses,0);
  const totalRecharge = recharges.reduce((a,r)=>a+r.cout,0);
  const totalMaint = maintenances.reduce((a,m)=>a+m.cout,0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reporting & Exports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="CA cumulé" value={fmt(totalCA)} color="text-emerald-600"/>
        <StatCard label="Courses totales" value={totalCourses.toLocaleString()} color="text-blue-600"/>
        <StatCard label="Coût recharge" value={fmt(totalRecharge)} color="text-amber-600"/>
        <StatCard label="Coût maintenance" value={fmt(totalMaint)} color="text-red-600"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">P&L par véhicule</h2>
          {vehicles.map(v=>{
            const vDrivers = drivers.filter(d=>d.vehicule===v.id);
            const vCA = vDrivers.reduce((a,d)=>a+d.ca,0);
            const vRecharge = recharges.filter(r=>r.vh===v.id).reduce((a,r)=>a+r.cout,0);
            const vMaint = maintenances.filter(m=>m.vh===v.id).reduce((a,m)=>a+m.cout,0);
            const margin = vCA - vRecharge - vMaint;
            return (
              <div key={v.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div><div className="font-medium text-sm">{v.immat}</div><div className="text-xs text-slate-400">{v.modele}</div></div>
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
          <h2 className="font-semibold text-slate-900 mb-4">Rapports disponibles</h2>
          <div className="grid grid-cols-1 gap-3">
            {["Recettes par chauffeur","Reversements & écarts","KPI & seuils","Paie détaillée","Recharge kWh/coût","Maintenance par VH","P&L analytique","Disponibilité flotte"].map(r=>(
              <button key={r} className="text-left p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <div className="font-medium text-sm text-slate-700">{r}</div>
                <div className="text-xs text-slate-400 mt-1">Excel · PDF · API</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SITES PAGE
// ============================================================
const SitesPage = ({vehicles, drivers, sites, onAdd, onUpdate, onDelete}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({name:"", ville:"", zone:"", waveAccount:""});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () => { setForm({name:"",ville:"",zone:"",waveAccount:""}); setEditItem(null); setShowModal(true); };
  const openEdit = (s) => { setForm({...s}); setEditItem(s); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.ville) return;
    if (editItem) { await onUpdate(editItem.id, form); }
    else { await onAdd({...form, id: Date.now()}); }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Sites & Comptes Wave</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <span className="text-lg">+</span> Ajouter un site
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sites.map(site=>{
          const sVh = vehicles.filter(v=>v.site===site.id||v.site===site.name);
          const sDr = drivers.filter(d=>d.site===site.id||d.site===site.name);
          return (
            <div key={site.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-lg font-bold text-slate-900">{site.name}</h3><p className="text-sm text-slate-500">{site.ville} · Zone {site.zone}</p></div>
                <div className="flex items-center gap-2">
                  <Badge color="bg-emerald-100 text-emerald-700">Actif</Badge>
                  <button onClick={()=>openEdit(site)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                  <button onClick={()=>setConfirmDelete(site)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-blue-600">{sVh.length}</div><div className="text-xs text-slate-500">Véhicules</div></div>
                <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-violet-600">{sDr.length}</div><div className="text-xs text-slate-500">Chauffeurs</div></div>
                <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-emerald-600">{sVh.filter(v=>v.status==="En exploitation").length}</div><div className="text-xs text-slate-500">Actifs</div></div>
              </div>
              {site.waveAccount && <div className="p-3 bg-blue-50 rounded-lg"><div className="text-xs text-slate-500">Compte Wave Business</div><div className="font-mono font-semibold text-blue-700">{site.waveAccount}</div></div>}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editItem?"Modifier le site":"Ajouter un site"}</h2>
              <button onClick={()=>setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nom du site *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Abidjan"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Ville *</label><input value={form.ville} onChange={e=>setForm({...form,ville:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Abidjan"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Zone</label><input value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Cocody"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Compte Wave Business</label><input value={form.waveAccount} onChange={e=>setForm({...form,waveAccount:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: WB-ABJ-001"/></div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
      {confirmDelete && <ConfirmDialog message={`Supprimer le site "${confirmDelete.name}" ?`} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// RBAC PAGE
// ============================================================
const RbacPage = ({currentUser}) => {
  const [users, setUsers] = useState([ADMIN_DEFAULT]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({name:"",email:"",password:"",role:"ops"});
  const [userError, setUserError] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({current:"",next:"",confirm:""});
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  const handleAddUser = async () => {
    setUserError("");
    if (!newUser.name || !newUser.email || !newUser.password) return setUserError("Tous les champs sont requis");
    if (newUser.password.length < 6) return setUserError("Mot de passe minimum 6 caractères");
    if (users.find(u=>u.email===newUser.email)) return setUserError("Cet email est déjà utilisé");
    const u = {...newUser, id:`U-${Date.now()}`};
    await saveUser(u);
    setUsers(prev=>[...prev, u]);
    setShowAddUser(false);
  };

  const handleChangePwd = async () => {
    setPwdError(""); setPwdSuccess("");
    const me = users.find(u=>u.id===currentUser?.id);
    if (!me || me.password !== pwdForm.current) return setPwdError("Mot de passe actuel incorrect");
    if (pwdForm.next.length < 6) return setPwdError("Nouveau mot de passe minimum 6 caractères");
    if (pwdForm.next !== pwdForm.confirm) return setPwdError("Les mots de passe ne correspondent pas");
    await supabase.from("users").update({password: pwdForm.next}).eq("id", currentUser.id);
    setPwdSuccess("Mot de passe modifié avec succès !");
    setPwdForm({current:"",next:"",confirm:""});
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) return alert("Vous ne pouvez pas supprimer votre propre compte !");
    await supabase.from("users").delete().eq("id", id);
    setUsers(u => u.filter(x=>x.id!==id));
    setConfirmDelete(null);
  };

  const handleRoleChange = async (id, role) => {
    await supabase.from("users").update({role}).eq("id", id);
    setUsers(u => u.map(x=>x.id===id?{...x,role}:x));
  };

  const roleColor = (r) => ({"admin":"bg-red-100 text-red-700","ops":"bg-blue-100 text-blue-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700"}[r]||"bg-slate-100 text-slate-600");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">RBAC & Audit</h1>

      {/* Gestion utilisateurs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Utilisateurs ({users.length})</h2>
        <div className="space-y-3">
          {users.map(u=>(
            <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white font-bold">{u.name[0]}</div>
                <div>
                  <div className="font-medium text-sm text-slate-800">{u.name} {u.id===currentUser?.id && <span className="text-xs text-blue-500">(vous)</span>}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {currentUser?.role==="admin" && u.id!==currentUser?.id ? (
                  <select value={u.role} onChange={e=>handleRoleChange(u.id,e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="admin">Admin</option>
                    <option value="ops">Ops</option>
                    <option value="finance">Finance</option>
                    <option value="supervisor">Superviseur</option>
                  </select>
                ) : (
                  <Badge color={roleColor(u.role)}>{u.role}</Badge>
                )}
                {u.id===currentUser?.id && (
                  <button onClick={()=>{setShowChangePwd(true);setPwdForm({current:"",next:"",confirm:""});setPwdError("");setPwdSuccess("");}} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Changer mot de passe</button>
                )}
                {currentUser?.role==="admin" && u.id!==currentUser?.id && (
                  <button onClick={()=>setConfirmDelete(u)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matrice permissions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Matrice des permissions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50"><th className="text-left p-3 font-semibold text-slate-700">Action</th><th className="p-3 text-center font-semibold text-slate-700">Superviseur</th><th className="p-3 text-center font-semibold text-slate-700">Ops</th><th className="p-3 text-center font-semibold text-slate-700">Finance</th><th className="p-3 text-center font-semibold text-slate-700">Admin</th></tr></thead>
            <tbody>
              {[["Effectuer reversement",false,false,false,true],["Valider check-in",true,true,false,true],["Annuler opération",true,false,false,true],["Valider remplacement",false,true,false,true],["Autoriser avance",false,false,false,true],["Valider dépenses",false,false,true,true],["Immobiliser VH",false,true,false,true],["Accès reporting",false,true,true,true],["Gestion RBAC",false,false,false,true]].map(([action,...perms],i)=>(
                <tr key={i} className="border-b border-slate-100"><td className="p-3 text-slate-700">{action}</td>{perms.map((p,j)=><td key={j} className="p-3 text-center">{p?<span className="text-emerald-500 font-bold">✓</span>:<span className="text-slate-300">—</span>}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && <ConfirmDialog message={`Supprimer le compte de ${confirmDelete.name} ?`} onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)} />}

      {/* Modal ajout utilisateur */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Créer un compte</h2>
              <button onClick={()=>setShowAddUser(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {userError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{userError}</div>}
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nom complet *</label><input value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Prénom Nom"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email *</label><input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe *</label><input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Minimum 6 caractères"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                <select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ops">Ops Manager</option>
                  <option value="supervisor">Superviseur</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={()=>setShowAddUser(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
              <button onClick={handleAddUser} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changement mot de passe */}
      {showChangePwd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Modifier mon mot de passe</h2>
              <button onClick={()=>{setShowChangePwd(false);setPwdError("");setPwdSuccess("");}} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {pwdError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{pwdError}</div>}
              {pwdSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-3 py-2 rounded-lg">{pwdSuccess}</div>}
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label><input type="password" value={pwdForm.current} onChange={e=>setPwdForm({...pwdForm,current:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label><input type="password" value={pwdForm.next} onChange={e=>setPwdForm({...pwdForm,next:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Minimum 6 caractères"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le nouveau mot de passe</label><input type="password" value={pwdForm.confirm} onChange={e=>setPwdForm({...pwdForm,confirm:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={()=>{setShowChangePwd(false);setPwdError("");setPwdSuccess("");}} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
              <button onClick={handleChangePwd} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Modifier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// NAVIGATION
// ============================================================
const NAV = [
  {id:"dashboard",label:"Tableau de bord",icon:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"},
  {id:"vehicules",label:"Véhicules",icon:"M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"},
  {id:"chauffeurs",label:"Chauffeurs",icon:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"},
  {id:"planning",label:"Planning",icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},
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

// ============================================================
// MAIN APP
// ============================================================
// ============================================================
// SUPABASE HOOKS
// ============================================================
const useSupabaseTable = (table, mapper = (x) => x) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
    if (!error && rows) setData(rows.map(mapper));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (item) => {
    const { data: row, error } = await supabase.from(table).insert([item]).select().single();
    if (!error && row) setData(prev => [...prev, mapper(row)]);
    return { row, error };
  };

  const update = async (id, item) => {
    const { data: row, error } = await supabase.from(table).update(item).eq("id", id).select().single();
    if (!error && row) setData(prev => prev.map(x => x.id === id ? mapper(row) : x));
    return { row, error };
  };

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) setData(prev => prev.filter(x => x.id !== id));
    return { error };
  };

  return { data, setData, loading, load, add, update, remove };
};

const App = () => {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);

  // Supabase connecté
  const vh = useSupabaseTable("vehicles");
  const dr = useSupabaseTable("drivers");
  const sh = useSupabaseTable("shifts", r => ({...r, checkIn: r.check_in, checkOut: r.check_out}));
  const rv = useSupabaseTable("reversements");
  const rc = useSupabaseTable("recharges", r => ({...r, kWh: r.kwh, socAv: r.soc_av, socAp: r.soc_ap}));
  const mt = useSupabaseTable("maintenances", r => ({...r, desc: r.description}));
  const si = useSupabaseTable("sites");

  const [alerts] = useState(ALERTS_INIT);
  const [paie] = useState(PAIE_INIT);

  const loading = vh.loading || dr.loading;
  const unread = alerts.filter(a=>!a.read).length;

  // Wrappers CRUD Véhicules
  const addVehicle = async (item) => { await vh.add(item); };
  const updateVehicle = async (id, item) => { await vh.update(id, item); };
  const removeVehicle = async (id) => { await vh.remove(id); };

  // Wrappers CRUD Chauffeurs
  const addDriver = async (item) => { await dr.add(item); };
  const updateDriver = async (id, item) => { await dr.update(id, item); };
  const removeDriver = async (id) => { await dr.remove(id); };

  // Wrappers CRUD Shifts
  const addShift = async (item) => { 
    const { checkIn, checkOut, reverse, ...rest } = item;
    await sh.add({...rest, check_in: checkIn||false, check_out: checkOut||false, reversement: reverse||0}); 
  };
  const updateShift = async (id, item) => { 
    const { checkIn, checkOut, reverse, ...rest } = item;
    await sh.update(id, {...rest, check_in: checkIn||false, check_out: checkOut||false, reversement: reverse||0}); 
  };
  const removeShift = async (id) => { await sh.remove(id); };

  // Wrappers CRUD Reversements
  const addReversement = async (item) => { await rv.add(item); };
  const updateReversement = async (id, item) => { await rv.update(id, item); };
  const removeReversement = async (id) => { await rv.remove(id); };

  // Wrappers CRUD Recharges
  const addRecharge = async (item) => { await rc.add({...item, kwh: item.kWh, soc_av: item.socAv, soc_ap: item.socAp}); };
  const updateRecharge = async (id, item) => { await rc.update(id, {...item, kwh: item.kWh, soc_av: item.socAv, soc_ap: item.socAp}); };
  const removeRecharge = async (id) => { await rc.remove(id); };

  // Wrappers CRUD Maintenances
  const addMaintenance = async (item) => { await mt.add({...item, description: item.desc}); };
  const updateMaintenance = async (id, item) => { await mt.update(id, {...item, description: item.desc}); };
  const removeMaintenance = async (id) => { await mt.remove(id); };

  if (!user) return <LoginPage onLogin={(u)=>setUser(u)}/>;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-blue-300">Chargement des données...</p>
      </div>
    </div>
  );

  const pages = {
    dashboard: <DashboardPage vehicles={vh.data} drivers={dr.data} shifts={sh.data} reversements={rv.data} alerts={alerts} recharges={rc.data}/>,
    vehicules: <VehiculesPage vehicles={vh.data} onAdd={addVehicle} onUpdate={updateVehicle} onDelete={removeVehicle}/>,
    chauffeurs: <ChauffeursPage drivers={dr.data} vehicles={vh.data} onAdd={addDriver} onUpdate={updateDriver} onDelete={removeDriver}/>,
    planning: <PlanningPage shifts={sh.data} vehicles={vh.data} drivers={dr.data} onAdd={addShift} onUpdate={updateShift} onDelete={removeShift}/>,
    reversements: <ReversementsPage reversements={rv.data} drivers={dr.data} onAdd={addReversement} onUpdate={updateReversement} onDelete={removeReversement}/>,
    kpi: <KpiPaiePage paie={paie} drivers={dr.data}/>,
    recharge: <RechargePage recharges={rc.data} vehicles={vh.data} drivers={dr.data} onAdd={addRecharge} onUpdate={updateRecharge} onDelete={removeRecharge}/>,
    maintenance: <MaintenancePage maintenances={mt.data} vehicles={vh.data} onAdd={addMaintenance} onUpdate={updateMaintenance} onDelete={removeMaintenance}/>,
    gps: <GpsPage vehicles={vh.data} alerts={alerts}/>,
    reporting: <ReportingPage vehicles={vh.data} drivers={dr.data} recharges={rc.data} maintenances={mt.data}/>,
    sites: <SitesPage vehicles={vh.data} drivers={dr.data} sites={si.data.length>0?si.data:SITES_INIT} onAdd={si.add} onUpdate={si.update} onDelete={si.remove}/>,
    rbac: <RbacPage currentUser={user}/>,
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Overlay mobile */}
      {sideOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={()=>setSideOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`${sideOpen?"w-64 translate-x-0":"-translate-x-full lg:translate-x-0 lg:w-20"} fixed lg:relative z-30 h-full lg:h-auto bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          {sideOpen && <div><div className="font-bold text-sm">SAVER Fleet Ops</div><div className="text-xs text-slate-400">Flotte VTC électrique</div></div>}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>{setPage(n.id); if(window.innerWidth<1024)setSideOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${page===n.id?"bg-blue-600/20 text-blue-400 border-r-2 border-blue-400":"text-slate-400 hover:text-white hover:bg-slate-800"}`}>
              <NavIcon d={n.icon} className="w-5 h-5 flex-shrink-0"/>
              {sideOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          {sideOpen && <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-xs font-bold">{user.name[0]}</div><div><div className="text-sm font-medium">{user.name}</div><div className="text-xs text-slate-400 capitalize">{user.role}</div></div></div>}
          <button onClick={()=>setUser(null)} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {sideOpen&&"Déconnexion"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={()=>setSideOpen(!sideOpen)} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="text-sm font-semibold text-slate-700 lg:hidden">{NAV.find(n=>n.id===page)?.label}</div>
          <div className="flex items-center gap-3">
            <button className="relative text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              {unread>0&&<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unread}</span>}
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-px bg-slate-200"/>
              <div className="text-sm text-slate-500">{user.name}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{pages[page]}</main>
      </div>
    </div>
  );
};

export default App;
