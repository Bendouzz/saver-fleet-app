import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE CLIENT
// ============================================================
const SUPABASE_URL = "https://tgmzrhldehltqsloylqs.supabase.co";
const SUPABASE_KEY = "sb_publishable_LURLrl4BHKhrC-sWyf2SPw_p45JMMgS";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// HELPERS
// ============================================================
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n||0) + " F";
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"M" : n >= 1000 ? Math.round(n/1000)+"k" : (n||0).toString();

// Hook Supabase generique
const useSupabase = (table, mapper = x=>x) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: rows } = await supabase.from(table).select("*").order("created_at", {ascending:false});
    setData((rows||[]).map(mapper));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (item) => {
    const { error } = await supabase.from(table).insert(item);
    if (!error) load();
    return error;
  };

  const update = async (id, item) => {
    const { error } = await supabase.from(table).update(item).eq("id", id);
    if (!error) load();
    return error;
  };

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) load();
    return error;
  };

  return { data, loading, add, update, remove, reload: load };
};

// AUTH via table users
const getUsers = async () => {
  const { data } = await supabase.from("users").select("*");
  return data || [];
};
const saveUser = async (user) => {
  await supabase.from("users").upsert(user);
};

// ============================================================
// MAPPERS Supabase → App
// ============================================================
const mapVehicle = (r) => ({
  ...r,
  site: r.site || 1,
  soc: r.soc || 0,
  km: r.km || 0,
  autonomie: r.autonomie || 0,
  modele: r.modele || "",
  immat: r.immat || "",
  status: r.status || "En exploitation",
  // Nouvelles colonnes
  vin: r.vin_number || "",
  capaciteBatterie: r.battery_capacity_kwh || 0,
  annee: r.vehicle_year || "",
  couleur: r.vehicle_color || "",
  typeService: r.service_type || "VTC",
  classesService: r.service_class || [],
  visiteDate: r.technical_visit_expiry || "",
  assuranceFin: r.insurance_expiry || "",
  typeContrat: r.typeContrat || "Interne SAVER",
  assuranceNum: r.assuranceNum || "",
  assuranceDebut: r.assuranceDebut || "",
  carteGriseNum: r.carteGriseNum || "",
  carteGriseDate: r.carteGriseDate || "",
  carteGriseProprietaire: r.carteGriseProprietaire || "",
  marque: r.marque || "",
  numeroChassis: r.numeroChassis || "",
  binome: r.binome || [],
});

const mapDriver = (r) => ({
  ...r,
  nom: r.nom || "",
  prenom: r.prenom || "",
  site: r.site || 1,
  status: r.status || "Actif",
  kpi: r.kpi || 80,
  courses: r.courses || 0,
  ca: r.ca || 0,
  pen: r.pen || 0,
  avance: r.avance || 0,
  // Nouvelles colonnes
  matricule: r.driver_code || r.id,
  permisNum: r.license_number || "",
  permisExpiration: r.license_expiry_date || "",
  pieceNum: r.id_card_number || "",
  pieceExpiration: r.id_card_expiry_date || "",
  typeContrat: r.contract_type || "Salarie",
  contactUrgence: r.emergency_contact || "",
  noteYango: r.yango_score || 4.0,
  noteInterne: r.internal_score || 80,
  telephone: r.telephone || "",
  telephonePerso: r.telephonePerso || "",
  adresse: r.adresse || "",
  dettes: r.dettes || 0,
  commentaires: r.commentaires || "",
  vehicule: r.vehicule || "",
  shift: r.shift || "A",
});

const mapShift = (r) => ({
  ...r,
  vh: r.vh || "",
  ch: r.ch || "",
  type: r.shift_type?.replace("Shift ","") || r.type || "A",
  debut: r.debut || "06:00",
  fin: r.fin || "14:00",
  status: r.status || "Planifie",
  recette: r.recette || r.revenue_cash || 0,
  checkIn: r.check_in || false,
  checkOut: r.check_out || false,
  // DD Driving datas
  heureDebutReelle: r.real_start_time || "",
  heureFinReelle: r.real_end_time || "",
  kmParcourus: r.km_driven || 0,
  autonomieDebut: r.battery_start || 0,
  autonomieFin: r.battery_end || 0,
  nbCourses: r.courses_count || 0,
  revenusGeneres: r.revenue_cash || 0,
  commissionYango: r.yango_commission || 0,
  depensesAutorisees: r.authorized_expenses || 0,
  noteYangoShift: r.yango_rating || 0,
  lieuDebut: r.lieuDebut || "",
  lieuFin: r.lieuFin || "",
  responsableZone: r.responsableZone || "",
  commentaireShift: r.commentaireShift || "",
  date: r.planned_start_date || r.date || new Date().toISOString().split("T")[0],
});

const mapReversement = (r) => ({
  ...r,
  ch: r.driver_id || r.ch || "",
  montant: r.amount_sent || r.montant || 0,
  canal: r.canal || "Wave",
  date: r.date || r.created_at?.split("T")[0] || "",
  status: r.status || "En attente",
  ecart: r.ecart || 0,
  depensesAutorisees: r.authorized_expenses || 0,
  preuve: r.transaction_proof_url || "",
});

const mapRecharge = (r) => ({
  ...r,
  vh: r.vh || "",
  ch: r.ch || "",
  kWh: r.kwh || r.kWh || 0,
  cout: r.cout || 0,
  lieu: r.lieu || "",
  duree: r.duree || 0,
  socAv: r.soc_av || 0,
  socAp: r.soc_ap || 0,
  date: r.date || "",
  partenaire: r.partenaire || "",
  typeCharge: r.typeCharge || "Partenaire",
});

const mapMaintenance = (r) => ({
  ...r,
  vh: r.vh || "",
  desc: r.description || r.desc || "",
  cout: r.cout || 0,
  garage: r.garage || "",
  status: r.status || "Planifiee",
  date: r.date || "",
  type: r.type || "Preventive",
});

const mapSite = (r) => ({
  ...r,
  name: r.name || "",
  ville: r.ville || "",
  zone: r.zone || "",
  waveAccount: r.waveAccount || r["waveAccount"] || "",
  businessType: r.businessType || r["businessType"] || "Wave Business",
});

// ============================================================
// UI COMPONENTS
// ============================================================
const Badge = ({color, children}) => <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium "+color}>{children}</span>;

const sc = (s) => {
  const map = {
    "Actif":"bg-emerald-100 text-emerald-700","En exploitation":"bg-emerald-100 text-emerald-700",
    "En cours":"bg-blue-100 text-blue-700","Planifie":"bg-slate-100 text-slate-600",
    "Planifié":"bg-slate-100 text-slate-600","Terminé":"bg-slate-100 text-slate-500",
    "Termine":"bg-slate-100 text-slate-500","Suspendu":"bg-red-100 text-red-700",
    "Inactif":"bg-slate-100 text-slate-400","En recharge":"bg-amber-100 text-amber-700",
    "Maintenance":"bg-orange-100 text-orange-700","Immobilisé":"bg-red-100 text-red-700",
    "Immobilise":"bg-red-100 text-red-700","Validé":"bg-emerald-100 text-emerald-700",
    "En attente":"bg-amber-100 text-amber-700","Écart détecté":"bg-red-100 text-red-700",
    "Ecart detecte":"bg-red-100 text-red-700","Planifiée":"bg-blue-100 text-blue-700",
    "Terminée":"bg-slate-100 text-slate-500",
  };
  return map[s] || "bg-slate-100 text-slate-600";
};

const SocBar = ({soc}) => {
  const col = soc > 70 ? "bg-emerald-500" : soc > 40 ? "bg-amber-500" : "bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={"h-full "+col+" rounded-full"} style={{width:soc+"%"}}/></div><span className="text-xs font-medium text-slate-600">{soc}%</span></div>;
};

const KpiBar = ({value}) => {
  const col = value>=80?"bg-emerald-500":value>=60?"bg-amber-500":"bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={"h-full "+col+" rounded-full"} style={{width:value+"%"}}/></div><span className="text-xs text-slate-600">{value}%</span></div>;
};

const StatCard = ({label, value, sub, color="text-slate-900", icon}) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      {icon && <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-white "+icon.bg}>{icon.el}</div>}
    </div>
    <div className={"text-2xl font-bold "+color}>{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
  </div>
);

const Modal = ({title, onClose, children, footer}) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto my-4">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">x</button>
      </div>
      <div className="p-6 space-y-4">{children}</div>
      {footer && <div className="flex gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white">{footer}</div>}
    </div>
  </div>
);

const Confirm = ({msg, onConfirm, onCancel}) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
      <h3 className="font-bold text-slate-900 mb-3">{msg}</h3>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-slate-200 py-2 rounded-lg text-sm">Annuler</button>
        <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Confirmer</button>
      </div>
    </div>
  </div>
);

const Input = ({label, value, onChange, type="text", placeholder="", required=false, hint=""}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required&&<span className="text-red-500 ml-1">*</span>}{hint&&<span className="text-xs text-slate-400 ml-1">{hint}</span>}</label>
    <input type={type} value={value||""} onChange={e=>onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value)} placeholder={placeholder} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
  </div>
);

const Select = ({label, value, onChange, options}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select value={value||""} onChange={e=>onChange(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const NavIcon = ({d, className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d}/></svg>;

// ============================================================
// LOGIN PAGE
// ============================================================
const LoginPage = ({onLogin}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    if (!email || !password) { setLoading(false); return setError("Email et mot de passe requis"); }
    const users = await getUsers();
    const found = users.find(u => u.email===email && u.password===password);
    setLoading(false);
    if (!found) return setError("Email ou mot de passe incorrect");
    const {data} = await supabase.from("users").select("*").eq("id", found.id).single().then(r=>r).catch(()=>({data:found}));
    
    onLogin(data || found);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white">SAVER Fleet Ops</h1>
          <p className="text-blue-300 mt-2">Gestion de flotte VTC electrique</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <div className="flex gap-2 mb-6">
            <button className="flex-1 py-2 rounded-lg text-sm font-medium bg-white text-slate-900">Connexion</button>
          </div>
          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
          <div className="space-y-4">
            <div><label className="block text-sm text-blue-200 mb-1.5">Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/></div>
            <div><label className="block text-sm text-blue-200 mb-1.5">Mot de passe</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/></div>
            <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD PAGE
// ============================================================
const DashboardPage = ({vehicles, drivers, shifts, reversements}) => {
  const [periode, setPeriode] = useState("jour");

  const activeVh = vehicles.filter(v=>v.status==="En exploitation").length;
  const enRechargeVh = vehicles.filter(v=>v.status==="En recharge").length;
  const immobiliseVh = vehicles.filter(v=>v.status==="Immobilise"||v.status==="Immobilisé"||v.status==="Maintenance").length;
  const avgSoc = vehicles.length > 0 ? Math.round(vehicles.reduce((a,v)=>a+(v.soc||0),0)/vehicles.length) : 0;
  const shiftEnCours = shifts.filter(s=>s.status==="En cours").length;
  const shiftPlanifie = shifts.filter(s=>s.status==="Planifie"||s.status==="Planifié").length;
  const totalDrivers = drivers.filter(d=>d.status==="Actif").length;
  const totalReverse = reversements.filter(r=>r.status==="Validé"||r.status==="Valide"||r.status==="Complété").reduce((a,r)=>a+(r.montant||0),0);
  const totalRecette = shifts.reduce((a,s)=>a+(s.recette||0),0);
  const topDrivers = [...drivers].sort((a,b)=>(b.ca||0)-(a.ca||0)).slice(0,5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm">{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex gap-2">
          {["jour","semaine","mois"].map(p=>(
            <button key={p} onClick={()=>setPeriode(p)} className={"px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all "+(periode===p?"bg-blue-600 text-white":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recettes cumulees" value={fmtK(totalRecette)+" F"} sub={shiftEnCours+" shifts en cours"} color="text-emerald-600"/>
        <StatCard label="Reverses valides" value={fmtK(totalReverse)+" F"} sub="total valide" color="text-blue-600"/>
        <StatCard label="Chauffeurs actifs" value={totalDrivers.toString()} sub={shiftPlanifie+" shifts planifies"} color="text-violet-600"/>
        <StatCard label="Flotte active" value={activeVh+"/"+vehicles.length} sub={"SOC moy: "+avgSoc+"%"} color="text-emerald-600"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-emerald-700">En exploitation</span><span className="text-2xl font-bold text-emerald-700">{activeVh}</span></div>
          <div className="w-full bg-emerald-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width:vehicles.length>0?(activeVh/vehicles.length)*100+"%":"0%"}}/></div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-amber-700">En recharge</span><span className="text-2xl font-bold text-amber-700">{enRechargeVh}</span></div>
          <div className="w-full bg-amber-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{width:vehicles.length>0?(enRechargeVh/vehicles.length)*100+"%":"0%"}}/></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-red-700">Immobilises</span><span className="text-2xl font-bold text-red-700">{immobiliseVh}</span></div>
          <div className="w-full bg-red-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{width:vehicles.length>0?(immobiliseVh/vehicles.length)*100+"%":"0%"}}/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Top chauffeurs par CA</h2>
          {topDrivers.length===0 ? <p className="text-slate-400 text-sm">Aucun chauffeur</p> : (
            <div className="space-y-3">
              {topDrivers.map((d,i)=>(
                <div key={d.id} className="flex items-center gap-3">
                  <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white "+(i===0?"bg-yellow-500":i===1?"bg-slate-400":i===2?"bg-amber-600":"bg-slate-300")}>{i+1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">{d.prenom} {d.nom}</span><span className="text-sm font-semibold text-emerald-600">{fmt(d.ca||0)}</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width:topDrivers[0]?.ca>0?((d.ca||0)/(topDrivers[0].ca||1))*100+"%":"0%"}}/></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Etat de charge flotte</h2>
          {vehicles.length===0 ? <p className="text-slate-400 text-sm">Aucun vehicule</p> : (
            <div className="space-y-3">
              {vehicles.slice(0,6).map(v=>(
                <div key={v.id} className="flex items-center justify-between">
                  <div><div className="text-sm font-medium text-slate-700">{v.immat}</div><div className="text-xs text-slate-400">{v.modele}</div></div>
                  <div className="flex items-center gap-3"><SocBar soc={v.soc||0}/><Badge color={sc(v.status)}>{v.status}</Badge></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// VEHICULES PAGE
// ============================================================
const VehiculesPage = ({vehicles, onAdd, onUpdate, onDelete, sites}) => {
  const [filter, setFilter] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = {immat:"",marque:"",modele:"",couleur:"",annee:new Date().getFullYear(),site:1,autonomie:400,km:0,soc:100,status:"En exploitation",typeContrat:"Interne SAVER",typeService:"VTC",classesService:[],vin:"",numeroChassis:"",capaciteBatterie:0,carteGriseNum:"",carteGriseDate:"",carteGriseProprietaire:"",visiteDate:"",assuranceNum:"",assuranceDebut:"",assuranceFin:"",binome:[]};
  const [form, setForm] = useState(emptyForm);

  const sitesList = sites.length > 0 ? sites : [{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];
  const filtered = vehicles.filter(v=>filter==="all"||String(v.site)===filter).filter(v=>filterType==="all"||v.typeService===filterType);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); };
  const openEdit = (v) => { setForm({...emptyForm,...v}); setEditItem(v); setShowModal(true); };

  const getAlerts = (v) => {
    const alerts = [];
    if (v.assuranceFin) { const diff=Math.floor((new Date(v.assuranceFin)-new Date())/(86400000)); if(diff<=7) alerts.push({label:"Assurance expire dans "+diff+"j",color:"text-red-600 bg-red-50"}); }
    if (v.visiteDate) { const diff=Math.floor((new Date(v.visiteDate)-new Date())/(86400000)); if(diff<=15) alerts.push({label:"Visite technique dans "+diff+"j",color:"text-amber-600 bg-amber-50"}); }
    return alerts;
  };

  const handleSave = async () => {
    if (!form.immat) return;
    const payload = {
      immat:form.immat, marque:form.marque, modele:form.modele, couleur:form.couleur,
      annee:form.annee, site:form.site, autonomie:form.autonomie, km:form.km, soc:form.soc,
      status:form.status, typeContrat:form.typeContrat,
      vin_number:form.vin, battery_capacity_kwh:form.capaciteBatterie,
      vehicle_year:form.annee, vehicle_color:form.couleur,
      service_type:form.typeService, service_class:form.classesService,
      technical_visit_expiry:form.visiteDate||null,
      insurance_expiry:form.assuranceFin||null,
      carteGriseNum:form.carteGriseNum, carteGriseDate:form.carteGriseDate||null,
      carteGriseProprietaire:form.carteGriseProprietaire,
      assuranceNum:form.assuranceNum, assuranceDebut:form.assuranceDebut||null,
      numeroChassis:form.numeroChassis, binome:form.binome,
    };
    if (editItem) { await onUpdate(editItem.id, payload); }
    else { await onAdd({...payload, id:"VH-"+Date.now()}); }
    setShowModal(false);
  };

  const totalAlerts = vehicles.reduce((a,v)=>a+getAlerts(v).length,0);

  if (detail) {
    const v = vehicles.find(x=>x.id===detail);
    if (!v) { setDetail(null); return null; }
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="text-sm text-blue-600 hover:underline">← Retour</button>
        {getAlerts(v).map((a,i)=><div key={i} className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium "+a.color}>{a.label}</div>)}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">{(v.immat||"").substring(0,2)}</div>
              <div>
                <h2 className="text-xl font-bold">{v.immat}</h2>
                <p className="text-slate-500 text-sm">{v.marque} {v.modele} {v.annee&&"· "+v.annee} {v.couleur&&"· "+v.couleur}</p>
                <div className="flex gap-2 mt-1 flex-wrap"><Badge color={sc(v.status)}>{v.status}</Badge><Badge color="bg-blue-100 text-blue-700">{v.typeContrat||"Interne"}</Badge><Badge color="bg-violet-100 text-violet-700">{v.typeService||"VTC"}</Badge></div>
              </div>
            </div>
            <button onClick={()=>{openEdit(v);setDetail(null);}} className="text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm">Modifier</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Technique</h3>
              {[["VIN",v.vin],["Chassis",v.numeroChassis],["Autonomie",v.autonomie+"km"],["Batterie",v.capaciteBatterie+"kWh"],["Classes",(v.classesService||[]).join(", ")||"—"]].map(([l,val])=>(
                <div key={l} className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-xs text-slate-500">{l}</span><span className="text-xs font-medium text-slate-700">{val||"—"}</span></div>
              ))}
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-xs text-slate-500">Km</span><span className="text-xs font-medium text-slate-700">{(v.km||0).toLocaleString()}</span></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Documents</h3>
              {[["CG N°",v.carteGriseNum],["CG Date",v.carteGriseDate],["Proprietaire",v.carteGriseProprietaire],["Visite exp.",v.visiteDate],["Assurance N°",v.assuranceNum],["Assur. debut",v.assuranceDebut],["Assur. fin",v.assuranceFin]].map(([l,val])=>(
                <div key={l} className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-xs text-slate-500">{l}</span><span className={"text-xs font-medium "+(l==="Assur. fin"&&val&&new Date(val)<new Date(Date.now()+7*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span></div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Etat</h3>
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 mb-2">SOC</div><SocBar soc={v.soc||0}/></div>
              <div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Site</div><div className="font-semibold text-sm">{sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site}</div></div>
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
          {totalAlerts>0&&<p className="text-xs text-red-500 mt-0.5">{totalAlerts} alerte(s) documentaire(s)</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous les sites</option>
            {sitesList.map(s=><option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous types</option><option value="VTC">VTC</option><option value="Location B2B">Location B2B</option><option value="Location B2C">Location B2C</option>
          </select>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
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
              const alerts=getAlerts(v);
              return (
                <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 cursor-pointer" onClick={()=>setDetail(v.id)}>
                    <div className="font-medium text-sm text-slate-800">{v.immat}</div>
                    <div className="text-xs text-slate-400">{v.marque} {v.modele} {v.annee&&"· "+v.annee}</div>
                  </td>
                  <td className="px-4 py-3"><Badge color="bg-violet-100 text-violet-700">{v.typeService||"VTC"}</Badge><div className="text-xs text-slate-400 mt-0.5">{v.typeContrat||"Interne"}</div></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site}</td>
                  <td className="px-4 py-3"><SocBar soc={v.soc||0}/></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{(v.km||0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {alerts.length>0?<div className="space-y-1">{alerts.map((a,i)=><div key={i} className={"text-xs px-2 py-0.5 rounded-full font-medium "+a.color}>{a.label}</div>)}</div>:<span className="text-xs text-emerald-500">OK</span>}
                  </td>
                  <td className="px-4 py-3"><Badge color={sc(v.status)}>{v.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>openEdit(v)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button><button onClick={()=>setConfirmDelete(v)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Suppr.</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editItem?"Modifier le vehicule":"Ajouter un vehicule"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Input label="Immatriculation" value={form.immat} onChange={v=>setForm({...form,immat:v})} required placeholder="Ex: AB-1234-CI"/></div>
              <Input label="Marque" value={form.marque} onChange={v=>setForm({...form,marque:v})} placeholder="BYD"/>
              <Input label="Modele" value={form.modele} onChange={v=>setForm({...form,modele:v})} placeholder="e6"/>
              <Input label="Couleur" value={form.couleur} onChange={v=>setForm({...form,couleur:v})}/>
              <Input label="Annee" value={form.annee} onChange={v=>setForm({...form,annee:parseInt(v)||new Date().getFullYear()})} type="number"/>
              <Input label="VIN" value={form.vin} onChange={v=>setForm({...form,vin:v})} placeholder="17 caracteres"/>
              <Input label="N Chassis" value={form.numeroChassis} onChange={v=>setForm({...form,numeroChassis:v})}/>
              <Input label="Capacite batterie (kWh)" value={form.capaciteBatterie} onChange={v=>setForm({...form,capaciteBatterie:parseInt(v)||0})} type="number"/>
              <Input label="Autonomie (km)" value={form.autonomie} onChange={v=>setForm({...form,autonomie:parseInt(v)||0})} type="number"/>
              <Input label="Kilometrage" value={form.km} onChange={v=>setForm({...form,km:parseInt(v)||0})} type="number"/>
              <Input label="SOC (%)" value={form.soc} onChange={v=>setForm({...form,soc:parseInt(v)||0})} type="number"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Site" value={String(form.site)} onChange={v=>setForm({...form,site:parseInt(v)})} options={sitesList.map(s=>({value:String(s.id),label:s.name}))}/>
              <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["En exploitation","En recharge","Maintenance","Immobilise"]}/>
              <Select label="Type de contrat" value={form.typeContrat} onChange={v=>setForm({...form,typeContrat:v})} options={["Interne SAVER","Externe client gestion"]}/>
              <Select label="Type de service" value={form.typeService} onChange={v=>setForm({...form,typeService:v})} options={["VTC","Location B2B","Location B2C"]}/>
            </div>
            {form.typeService==="VTC"&&(
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Classes de service</label>
                <div className="flex flex-wrap gap-2">
                  {["Eco","Confort","Confort+","Business","Premium","VIP","Standard","Coursier","Livraison","Interurbain"].map(c=>(
                    <label key={c} className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={(form.classesService||[]).includes(c)} onChange={e=>{const arr=form.classesService||[];setForm({...form,classesService:e.target.checked?[...arr,c]:arr.filter(x=>x!==c)});}} className="rounded"/>
                      <span className="text-xs text-slate-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Carte grise</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="N° Carte grise" value={form.carteGriseNum} onChange={v=>setForm({...form,carteGriseNum:v})}/>
                <Input label="Date immatriculation" value={form.carteGriseDate} onChange={v=>setForm({...form,carteGriseDate:v})} type="date"/>
                <div className="col-span-2"><Input label="Proprietaire" value={form.carteGriseProprietaire} onChange={v=>setForm({...form,carteGriseProprietaire:v})}/></div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Visite technique et Assurance</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Input label="Expiration visite technique" value={form.visiteDate} onChange={v=>setForm({...form,visiteDate:v})} type="date" hint="(alerte 15j avant)"/></div>
                <Input label="N° Assurance" value={form.assuranceNum} onChange={v=>setForm({...form,assuranceNum:v})}/>
                <Input label="Debut assurance" value={form.assuranceDebut} onChange={v=>setForm({...form,assuranceDebut:v})} type="date"/>
                <div className="col-span-2"><Input label="Fin assurance" value={form.assuranceFin} onChange={v=>setForm({...form,assuranceFin:v})} type="date" hint="(alerte 7j avant)"/></div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete&&<Confirm msg={"Supprimer le vehicule "+confirmDelete.immat+" ?"} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// CHAUFFEURS PAGE
// ============================================================
const ChauffeursPage = ({drivers, vehicles, onAdd, onUpdate, onDelete, sites}) => {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("profil");

  const sitesList = sites.length>0?sites:[{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];
  const filtered = drivers.filter(d=>!search||`${d.prenom} ${d.nom}`.toLowerCase().includes(search.toLowerCase()));

  const genMatricule = (prenom, nom) => {
    const base=((prenom||"X")[0]+(nom||"X")[0]).toUpperCase();
    const count=drivers.filter(d=>(d.matricule||"").startsWith(base)).length+1;
    return base+"-"+String(count).padStart(2,"0");
  };

  const emptyForm = {nom:"",prenom:"",site:1,vehicule:"",shift:"A",status:"Actif",kpi:80,courses:0,ca:0,pen:0,avance:0,typeContrat:"Salarie",telephone:"",telephonePerso:"",adresse:"",contactUrgence:"",contactUrgenceTel:"",permisNum:"",permisDelivrance:"",permisExpiration:"",permisType:"",pieceType:"CNI",pieceNum:"",pieceDelivrance:"",pieceExpiration:"",noteYango:4.0,noteInterne:80,commentaires:"",dettes:0,detteCommentaire:"",matricule:""};
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); setActiveTab("profil"); };
  const openEdit = (d) => { setForm({...emptyForm,...d}); setEditItem(d); setShowModal(true); setActiveTab("profil"); };

  const getDriverAlerts = (d) => {
    const alerts=[];
    if(d.permisExpiration){const diff=Math.floor((new Date(d.permisExpiration)-new Date())/86400000);if(diff<=30)alerts.push("Permis expire dans "+diff+"j");}
    if(d.pieceExpiration){const diff=Math.floor((new Date(d.pieceExpiration)-new Date())/86400000);if(diff<=30)alerts.push("Piece ID expire dans "+diff+"j");}
    return alerts;
  };

  const handleSave = async () => {
    if (!form.nom||!form.prenom) return;
    const mat = form.matricule||genMatricule(form.prenom,form.nom);
    const payload = {
      nom:form.nom, prenom:form.prenom, site:form.site, vehicule:form.vehicule,
      shift:form.shift, status:form.status, kpi:form.kpi, courses:form.courses,
      ca:form.ca, pen:form.pen, avance:form.avance,
      driver_code:mat, matricule:mat,
      contract_type:form.typeContrat, typeContrat:form.typeContrat,
      telephone:form.telephone, telephonePerso:form.telephonePerso,
      adresse:form.adresse,
      emergency_contact:form.contactUrgence+" - "+form.contactUrgenceTel,
      contactUrgence:form.contactUrgence, contactUrgenceTel:form.contactUrgenceTel,
      license_number:form.permisNum, license_expiry_date:form.permisExpiration||null,
      id_card_number:form.pieceNum, id_card_expiry_date:form.pieceExpiration||null,
      yango_score:form.noteYango, noteYango:form.noteYango,
      internal_score:form.noteInterne,
      commentaires:form.commentaires, dettes:form.dettes, detteCommentaire:form.detteCommentaire,
    };
    if(editItem){await onUpdate(editItem.id,payload);}
    else{await onAdd({...payload,id:"CH-"+Date.now()});}
    setShowModal(false);
  };

  const tabs = [{id:"profil",label:"Profil"},{id:"kyc",label:"KYC"},{id:"performance",label:"Perf."},{id:"incidents",label:"Incidents"}];

  if(detail){
    const d=drivers.find(x=>x.id===detail);
    if(!d){setDetail(null);return null;}
    const alerts=getDriverAlerts(d);
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="text-sm text-blue-600 hover:underline">← Retour</button>
        {alerts.map((a,i)=><div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-600 bg-amber-50">{a}</div>)}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">{(d.prenom||"?")[0]}{(d.nom||"?")[0]}</div>
              <div>
                <h2 className="text-xl font-bold">{d.prenom} {d.nom}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{d.matricule||d.id}</span>
                  <Badge color="bg-blue-100 text-blue-700">Shift {d.shift}</Badge>
                  <Badge color={sc(d.status)}>{d.status}</Badge>
                  <Badge color="bg-violet-100 text-violet-700">{d.typeContrat||"Salarie"}</Badge>
                </div>
                <p className="text-slate-500 text-sm mt-1">{sitesList.find(s=>s.id===d.site||String(s.id)===String(d.site))?.name} · {vehicles.find(v=>v.id===d.vehicule)?.immat||"—"}</p>
              </div>
            </div>
            <button onClick={()=>{openEdit(d);setDetail(null);}} className="text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm">Modifier</button>
          </div>
          <div className="flex gap-1 border-b border-slate-200 mb-4">
            {tabs.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={"px-4 py-2 text-sm font-medium border-b-2 -mb-px "+(activeTab===t.id?"border-blue-600 text-blue-600":"border-transparent text-slate-500")}>{t.label}</button>)}
          </div>
          {activeTab==="profil"&&<div className="grid grid-cols-1 md:grid-cols-2 gap-2">{[["Tel. travail",d.telephone],["Tel. perso",d.telephonePerso],["Adresse",d.adresse],["Contact urgence",d.contactUrgence],["Tel urgence",d.contactUrgenceTel],["Contrat",d.typeContrat]].map(([l,val])=><div key={l} className="flex justify-between py-2 border-b border-slate-100"><span className="text-xs text-slate-500">{l}</span><span className="text-xs font-medium text-slate-700">{val||"—"}</span></div>)}</div>}
          {activeTab==="kyc"&&<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-semibold text-sm mb-3">Permis</h4>{[["N°",d.permisNum],["Type",d.permisType],["Delivrance",d.permisDelivrance],["Expiration",d.permisExpiration]].map(([l,val])=><div key={l} className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-xs text-slate-500">{l}</span><span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span></div>)}</div><div><h4 className="font-semibold text-sm mb-3">Piece ID ({d.pieceType||"CNI"})</h4>{[["N°",d.pieceNum],["Delivrance",d.pieceDelivrance],["Expiration",d.pieceExpiration]].map(([l,val])=><div key={l} className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-xs text-slate-500">{l}</span><span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span></div>)}</div></div>}
          {activeTab==="performance"&&<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[["Note Yango",(d.noteYango||"—")+"/5","text-amber-500"],["KPI",d.kpi+"%","text-blue-600"],["Courses",(d.courses||0).toLocaleString(),"text-slate-700"],["CA",fmt(d.ca||0),"text-emerald-600"],["Penalites",fmt(d.pen||0),"text-red-600"],["Avance",fmt(d.avance||0),"text-amber-600"]].map(([l,val,color])=><div key={l} className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">{l}</div><div className={"font-bold text-lg "+color}>{val}</div></div>)}</div>}
          {activeTab==="incidents"&&<div className="space-y-4"><div className="p-4 bg-red-50 rounded-xl border border-red-100"><div className="text-xs text-slate-500 mb-1">Solde dettes</div><div className="font-bold text-red-600 text-lg">{fmt(d.dettes||0)}</div>{d.detteCommentaire&&<div className="text-xs text-slate-500 mt-1">{d.detteCommentaire}</div>}</div>{d.commentaires&&<div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Commentaires</div><div className="text-sm">{d.commentaires}</div></div>}{!d.dettes&&!d.commentaires&&<div className="text-slate-400 text-sm text-center py-4">Aucun incident</div>}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Chauffeurs</h1>
        <div className="flex gap-2">
          <div className="relative"><svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
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
              const alerts=getDriverAlerts(d);
              return (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 cursor-pointer" onClick={()=>setDetail(d.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">{(d.prenom||"?")[0]}{(d.nom||"?")[0]}</div>
                      <div><div className="font-medium text-sm text-slate-800">{d.prenom} {d.nom}</div>{alerts.length>0&&<div className="text-xs text-amber-600">⚠ {alerts[0]}</div>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{d.matricule||d.id}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{sitesList.find(s=>s.id===d.site||String(s.id)===String(d.site))?.name||d.site}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{vehicles.find(v=>v.id===d.vehicule)?.immat||"—"}</td>
                  <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">Shift {d.shift}</Badge></td>
                  <td className="px-4 py-3"><span className="text-sm font-bold text-amber-500">{d.noteYango||"—"}</span><span className="text-xs text-slate-400">/5</span></td>
                  <td className="px-4 py-3"><KpiBar value={d.kpi||0}/></td>
                  <td className="px-4 py-3"><Badge color={sc(d.status)}>{d.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>openEdit(d)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button><button onClick={()=>setConfirmDelete(d)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Suppr.</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editItem?"Modifier chauffeur":"Ajouter chauffeur"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="flex gap-1 border-b border-slate-200 mb-4">
            {tabs.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={"px-3 py-2 text-sm font-medium border-b-2 -mb-px "+(activeTab===t.id?"border-blue-600 text-blue-600":"border-transparent text-slate-500")}>{t.label}</button>)}
          </div>
          {activeTab==="profil"&&(
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nom" value={form.nom} onChange={v=>setForm({...form,nom:v})} required/>
              <Input label="Prenom" value={form.prenom} onChange={v=>setForm({...form,prenom:v})} required/>
              <Input label="Matricule (auto)" value={form.matricule||genMatricule(form.prenom||"X",form.nom||"X")} onChange={v=>setForm({...form,matricule:v})}/>
              <Select label="Type contrat" value={form.typeContrat} onChange={v=>setForm({...form,typeContrat:v})} options={["Salarie","Prestataire a l essai","Freelance"]}/>
              <Select label="Site" value={String(form.site)} onChange={v=>setForm({...form,site:parseInt(v)})} options={sitesList.map(s=>({value:String(s.id),label:s.name}))}/>
              <Select label="Shift" value={form.shift} onChange={v=>setForm({...form,shift:v})} options={[{value:"A",label:"Shift A (06h-14h)"},{value:"B",label:"Shift B (15h-23h)"},{value:"C",label:"Shift C (22h-06h)"}]}/>
              <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["Actif","Suspendu","Inactif"]}/>
              <Select label="Vehicule" value={form.vehicule} onChange={v=>setForm({...form,vehicule:v})} options={[{value:"",label:"-- Choisir --"},...vehicles.map(v=>({value:v.id,label:v.immat}))]}/>
              <Input label="Tel. travail" value={form.telephone} onChange={v=>setForm({...form,telephone:v})} placeholder="+225..."/>
              <Input label="Tel. perso" value={form.telephonePerso} onChange={v=>setForm({...form,telephonePerso:v})}/>
              <div className="col-span-2"><Input label="Adresse" value={form.adresse} onChange={v=>setForm({...form,adresse:v})} placeholder="Commune, quartier"/></div>
              <Input label="Contact urgence" value={form.contactUrgence} onChange={v=>setForm({...form,contactUrgence:v})}/>
              <Input label="Tel urgence" value={form.contactUrgenceTel} onChange={v=>setForm({...form,contactUrgenceTel:v})}/>
            </div>
          )}
          {activeTab==="kyc"&&(
            <div className="space-y-4">
              <div><p className="text-xs font-semibold text-slate-500 uppercase mb-3">Permis de conduire</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="N° Permis" value={form.permisNum} onChange={v=>setForm({...form,permisNum:v})}/>
                  <Input label="Type" value={form.permisType} onChange={v=>setForm({...form,permisType:v})} placeholder="B, D..."/>
                  <Input label="Date delivrance" value={form.permisDelivrance} onChange={v=>setForm({...form,permisDelivrance:v})} type="date"/>
                  <Input label="Expiration" value={form.permisExpiration} onChange={v=>setForm({...form,permisExpiration:v})} type="date" hint="(alerte 30j)"/>
                </div>
              </div>
              <div><p className="text-xs font-semibold text-slate-500 uppercase mb-3">Piece d identite</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type" value={form.pieceType} onChange={v=>setForm({...form,pieceType:v})} options={["CNI","Passeport","Titre sejour"]}/>
                  <Input label="N° Piece" value={form.pieceNum} onChange={v=>setForm({...form,pieceNum:v})}/>
                  <Input label="Date delivrance" value={form.pieceDelivrance} onChange={v=>setForm({...form,pieceDelivrance:v})} type="date"/>
                  <Input label="Expiration" value={form.pieceExpiration} onChange={v=>setForm({...form,pieceExpiration:v})} type="date" hint="(alerte 30j)"/>
                </div>
              </div>
            </div>
          )}
          {activeTab==="performance"&&(
            <div className="grid grid-cols-2 gap-3">
              <Input label="Note Yango (/5)" value={form.noteYango} onChange={v=>setForm({...form,noteYango:parseFloat(v)||0})} type="number"/>
              <Input label="KPI Interne (0-100)" value={form.kpi} onChange={v=>setForm({...form,kpi:parseInt(v)||80})} type="number"/>
              <Input label="Courses" value={form.courses} onChange={v=>setForm({...form,courses:parseInt(v)||0})} type="number"/>
              <Input label="CA (F CFA)" value={form.ca} onChange={v=>setForm({...form,ca:parseInt(v)||0})} type="number"/>
              <Input label="Penalites" value={form.pen} onChange={v=>setForm({...form,pen:parseInt(v)||0})} type="number"/>
              <Input label="Avance en cours" value={form.avance} onChange={v=>setForm({...form,avance:parseInt(v)||0})} type="number"/>
            </div>
          )}
          {activeTab==="incidents"&&(
            <div className="space-y-3">
              <Input label="Solde dettes (F CFA)" value={form.dettes||0} onChange={v=>setForm({...form,dettes:parseInt(v)||0})} type="number"/>
              <Input label="Detail dette" value={form.detteCommentaire||""} onChange={v=>setForm({...form,detteCommentaire:v})} placeholder="Ex: manquant du 01/04..."/>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Commentaires et incidents</label><textarea value={form.commentaires||""} onChange={e=>setForm({...form,commentaires:e.target.value})} rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
            </div>
          )}
        </Modal>
      )}
      {confirmDelete&&<Confirm msg={"Supprimer "+confirmDelete.prenom+" "+confirmDelete.nom+" ?"} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// PLANNING PAGE
// ============================================================
const PlanningPage = ({shifts, vehicles, drivers, onAdd, onUpdate, sites}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDDModal, setShowDDModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [ddForm, setDDForm] = useState({});
  const sitesList = sites.length>0?sites:[{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];

  const emptyShift = {vh:"",ch:"",type:"A",date:new Date().toISOString().split("T")[0],debut:"06:00",fin:"14:00",status:"Planifie",lieuDebut:"",lieuFin:"",responsableZone:"",recette:0,commentaireShift:""};
  const [form, setForm] = useState(emptyShift);

  const shiftHoraires = {A:"06:00-14:00",B:"15:00-23:00",C:"22:00-06:00"};
  const shiftColors = {A:{bg:"bg-blue-50",border:"border-blue-200",title:"text-blue-800"},B:{bg:"bg-violet-50",border:"border-violet-200",title:"text-violet-800"},C:{bg:"bg-slate-50",border:"border-slate-200",title:"text-slate-800"}};

  const handleSave = async () => {
    if(!form.vh||!form.ch) return alert("Vehicule et chauffeur requis");
    const payload = {
      vh:form.vh, ch:form.ch, type:form.type,
      shift_type:"Shift "+form.type,
      planned_start_date:form.date,
      date:form.date, debut:form.debut, fin:form.fin,
      status:form.status, recette:form.recette||0,
      lieuDebut:form.lieuDebut, lieuFin:form.lieuFin,
      responsableZone:form.responsableZone,
      commentaireShift:form.commentaireShift,
      check_in:false, check_out:false,
    };
    await onAdd({...payload, id:"SH-"+Date.now()});
    setShowModal(false);
  };

  const handleSaveDD = async () => {
    if(!selectedShift) return;
    const payload = {
      real_start_time:ddForm.heureDebutReelle||null,
      real_end_time:ddForm.heureFinReelle||null,
      km_driven:ddForm.kmParcourus||0,
      battery_start:ddForm.autonomieDebut||0,
      battery_end:ddForm.autonomieFin||0,
      courses_count:ddForm.nbCourses||0,
      revenue_cash:ddForm.revenusGeneres||0, recette:ddForm.revenusGeneres||0,
      yango_commission:ddForm.commissionYango||0,
      authorized_expenses:ddForm.depensesAutorisees||0,
      yango_rating:ddForm.noteYangoShift||0,
      commentaireShift:ddForm.commentaireShift||"",
    };
    await onUpdate(selectedShift.id, payload);
    setShowDDModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planning et Shifts</h1>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2"/>
          <button onClick={()=>{setForm(emptyShift);setShowModal(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter shift</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["A","B","C"].map(type=>{
          const col=shiftColors[type];
          const shiftList=shifts.filter(s=>s.type===type);
          return (
            <div key={type} className={col.bg+" rounded-xl border "+col.border+" p-4"}>
              <h3 className={"font-semibold "+col.title+" mb-3 flex items-center justify-between"}>
                <span>Shift {type} · {shiftHoraires[type]}</span>
                <span className="text-xs bg-white/70 px-2 py-0.5 rounded-full">{shiftList.length}</span>
              </h3>
              <div className="space-y-2">
                {shiftList.length===0&&<div className="text-xs text-slate-400 text-center py-2">Aucun shift</div>}
                {shiftList.map(s=>(
                  <div key={s.id} className="bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <div><div className="font-medium text-sm">{drivers.find(d=>d.id===s.ch)?`${drivers.find(d=>d.id===s.ch).prenom} ${drivers.find(d=>d.id===s.ch).nom}`:"—"}</div><div className="text-xs text-slate-400">{vehicles.find(v=>v.id===s.vh)?.immat||"—"}</div></div>
                      <Badge color={sc(s.status)}>{s.status}</Badge>
                    </div>
                    {s.lieuDebut&&<div className="text-xs text-slate-500">Depart: {s.lieuDebut}</div>}
                    {s.recette>0&&<div className="text-xs font-semibold text-emerald-600 mt-1">{fmt(s.recette)}</div>}
                    {(s.status==="Terminé"||s.status==="Termine")&&(
                      <div className="bg-slate-50 rounded-lg p-2 mt-2 text-xs text-slate-500 space-y-0.5">
                        {s.nbCourses>0&&<div>Courses: {s.nbCourses} · Rev: {fmt(s.revenusGeneres||0)}</div>}
                        {s.commissionYango>0&&<div>Commission Yango: {fmt(s.commissionYango)}</div>}
                        {s.noteYangoShift>0&&<div className="text-amber-600">Note: {s.noteYangoShift}/5</div>}
                      </div>
                    )}
                    <div className="flex gap-1 mt-2">
                      {(s.status==="Terminé"||s.status==="Termine")&&<button onClick={()=>{setDDForm({...s});setSelectedShift(s);setShowDDModal(true);}} className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded">DD Data</button>}
                      {(s.status==="Planifie"||s.status==="Planifié")&&<button onClick={async()=>await onUpdate(s.id,{status:"En cours",check_in:true})} className="text-xs text-emerald-600 border border-emerald-200 px-2 py-1 rounded">Check-in</button>}
                      {s.status==="En cours"&&<button onClick={async()=>await onUpdate(s.id,{status:"Terminé",check_out:true})} className="text-xs text-violet-600 border border-violet-200 px-2 py-1 rounded">Check-out</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">W</div>
        <div><div className="font-semibold text-emerald-800 text-sm">Alertes WhatsApp automatiques</div><div className="text-xs text-emerald-700">Chauffeur notifie a la validation · Alerte dispatcher si shift non demarre 15 min apres l heure prevue</div></div>
      </div>

      {showModal&&(
        <Modal title="Ajouter un shift" onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Planifier</button></>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Input label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/></div>
            <Select label="Vehicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"-- Choisir --"},...vehicles.map(v=>({value:v.id,label:v.immat}))]}/>
            <Select label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"-- Choisir --"},...drivers.filter(d=>d.status==="Actif").map(d=>({value:d.id,label:`${d.prenom} ${d.nom} (${d.matricule||d.id})`}))]}/>
            <Select label="Type de shift" value={form.type} onChange={v=>setForm({...form,type:v})} options={[{value:"A",label:"Shift A (06h-14h)"},{value:"B",label:"Shift B (15h-23h)"},{value:"C",label:"Shift C (22h-06h)"}]}/>
            <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["Planifie","En cours","Termine"]}/>
            <Input label="Lieu de debut" value={form.lieuDebut} onChange={v=>setForm({...form,lieuDebut:v})} placeholder="Ex: Cocody"/>
            <Input label="Lieu de fin" value={form.lieuFin} onChange={v=>setForm({...form,lieuFin:v})} placeholder="Ex: Plateau"/>
            <div className="col-span-2"><Input label="Responsable de zone" value={form.responsableZone} onChange={v=>setForm({...form,responsableZone:v})}/></div>
            <Input label="Recette (F CFA)" value={form.recette} onChange={v=>setForm({...form,recette:parseInt(v)||0})} type="number"/>
          </div>
        </Modal>
      )}

      {showDDModal&&(
        <Modal title={"DD Driving Datas - "+(selectedShift?drivers.find(d=>d.id===selectedShift.ch)?.prenom+" "+drivers.find(d=>d.id===selectedShift.ch)?.nom:"")} onClose={()=>setShowDDModal(false)}
          footer={<><button onClick={()=>setShowDDModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSaveDD} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Enregistrer DD</button></>}>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 mb-2">Saisir depuis les captures ecran du chauffeur (portefeuille Yango, ecran de bord)</div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Heure debut reelle" value={ddForm.heureDebutReelle||""} onChange={v=>setDDForm({...ddForm,heureDebutReelle:v})} type="time"/>
            <Input label="Heure fin reelle" value={ddForm.heureFinReelle||""} onChange={v=>setDDForm({...ddForm,heureFinReelle:v})} type="time"/>
            <Input label="Km parcourus" value={ddForm.kmParcourus||0} onChange={v=>setDDForm({...ddForm,kmParcourus:parseFloat(v)||0})} type="number"/>
            <Input label="Nb courses" value={ddForm.nbCourses||0} onChange={v=>setDDForm({...ddForm,nbCourses:parseInt(v)||0})} type="number"/>
            <Input label="Revenus generes (F CFA)" value={ddForm.revenusGeneres||0} onChange={v=>setDDForm({...ddForm,revenusGeneres:parseInt(v)||0})} type="number"/>
            <Input label="Commission Yango (F CFA)" value={ddForm.commissionYango||0} onChange={v=>setDDForm({...ddForm,commissionYango:parseInt(v)||0})} type="number"/>
            <Input label="Autonomie debut (%)" value={ddForm.autonomieDebut||0} onChange={v=>setDDForm({...ddForm,autonomieDebut:parseInt(v)||0})} type="number"/>
            <Input label="Autonomie fin (%)" value={ddForm.autonomieFin||0} onChange={v=>setDDForm({...ddForm,autonomieFin:parseInt(v)||0})} type="number"/>
            <Input label="Depenses autorisees" value={ddForm.depensesAutorisees||0} onChange={v=>setDDForm({...ddForm,depensesAutorisees:parseInt(v)||0})} type="number"/>
            <Input label="Note Yango shift (/5)" value={ddForm.noteYangoShift||0} onChange={v=>setDDForm({...ddForm,noteYangoShift:parseFloat(v)||0})} type="number"/>
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Etat vehicule et commentaires</label><textarea value={ddForm.commentaireShift||""} onChange={e=>setDDForm({...ddForm,commentaireShift:e.target.value})} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          </div>
          {(ddForm.revenusGeneres>0&&ddForm.commissionYango>0)&&(
            <div className="bg-slate-50 rounded-lg p-3 mt-2 text-xs text-slate-600">
              <div>Ratio commission: {Math.round((ddForm.commissionYango/ddForm.revenusGeneres)*100)}%</div>
              <div>Consommation: {(ddForm.autonomieDebut||0)-(ddForm.autonomieFin||0)}% batterie</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// REVERSEMENTS PAGE
// ============================================================
const ReversementsPage = ({reversements, drivers, onAdd, onUpdate, onDelete}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterPeriode, setFilterPeriode] = useState("all");
  const [filterDriver, setFilterDriver] = useState("all");

  const emptyForm = {ch:"",montant:0,canal:"Wave Business",date:new Date().toISOString().split("T")[0],status:"En attente",ecart:0,depensesAutorisees:0,preuve:"",commentaire:""};
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); };
  const openEdit = (r) => { setForm({...emptyForm,...r}); setEditItem(r); setShowModal(true); };

  const handleSave = async () => {
    if(!form.ch||!form.montant) return alert("Chauffeur et montant requis");
    const payload = {
      ch:form.ch, driver_id:form.ch,
      montant:form.montant, amount_sent:form.montant, amount_requested:form.montant,
      canal:form.canal, date:form.date, status:form.status,
      ecart:form.ecart||0, authorized_expenses:form.depensesAutorisees||0,
      transaction_proof_url:form.preuve||"",
    };
    if(editItem){await onUpdate(editItem.id,payload);}
    else{await onAdd({...payload,id:"RV-"+Date.now()});}
    setShowModal(false);
  };

  const filtered = reversements
    .filter(r=>filterDriver==="all"||r.ch===filterDriver);

  const total = filtered.reduce((a,r)=>a+(r.montant||0),0);
  const ecarts = filtered.filter(r=>r.ecart>0||r.status==="Ecart detecte"||r.status==="Écart détecté");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Recettes et Reversements</h1>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total reverse" value={fmtK(total)+" F"} color="text-emerald-600"/>
        <StatCard label="Valides" value={filtered.filter(r=>r.status==="Validé"||r.status==="Valide"||r.status==="Complété").length.toString()} color="text-emerald-600"/>
        <StatCard label="Ecarts detectes" value={ecarts.length.toString()} color="text-red-600"/>
        <StatCard label="En attente" value={filtered.filter(r=>r.status==="En attente").length.toString()} color="text-amber-600"/>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={filterDriver} onChange={e=>setFilterDriver(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="all">Tous les chauffeurs</option>
          {drivers.map(d=><option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Canal</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Depenses</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Preuve</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ecart</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(r=>{
              const driver=drivers.find(d=>d.id===r.ch);
              return (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{driver?`${driver.prenom} ${driver.nom}`:"—"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{fmt(r.montant||0)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.canal}</td>
                  <td className="px-4 py-3 text-sm text-amber-600">{r.depensesAutorisees>0?fmt(r.depensesAutorisees):"—"}</td>
                  <td className="px-4 py-3">{r.preuve?<a href={r.preuve} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Voir</a>:<span className="text-xs text-slate-400">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.date}</td>
                  <td className="px-4 py-3">{r.ecart>0?<span className="text-xs font-semibold text-red-600">-{fmt(r.ecart)}</span>:<span className="text-xs text-emerald-500">OK</span>}</td>
                  <td className="px-4 py-3"><Badge color={sc(r.status)}>{r.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(r)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button>
                      {r.status==="En attente"&&<button onClick={async()=>await onUpdate(r.id,{status:"Validé"})} className="text-emerald-600 text-xs border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-50">Valider</button>}
                      <button onClick={()=>setConfirmDelete(r)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Suppr.</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editItem?"Modifier reversement":"Ajouter reversement"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Select label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"-- Choisir --"},...drivers.map(d=>({value:d.id,label:`${d.prenom} ${d.nom}`}))]}/></div>
            <Input label="Montant (F CFA)" value={form.montant} onChange={v=>setForm({...form,montant:parseInt(v)||0})} type="number" required/>
            <Select label="Canal" value={form.canal} onChange={v=>setForm({...form,canal:v})} options={["Wave Business","Orange Money Business","MTN Mobile Money","Moov Money","Cash"]}/>
            <Input label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/>
            <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["En attente","Validé","Rejete","Ecart detecte"]}/>
            <Input label="Depenses autorisees (F CFA)" value={form.depensesAutorisees||0} onChange={v=>setForm({...form,depensesAutorisees:parseInt(v)||0})} type="number"/>
            <Input label="Ecart detecte (F CFA)" value={form.ecart||0} onChange={v=>setForm({...form,ecart:parseInt(v)||0})} type="number"/>
            <div className="col-span-2"><Input label="URL preuve de paiement (screenshot Wave...)" value={form.preuve||""} onChange={v=>setForm({...form,preuve:v})} placeholder="https://..."/></div>
          </div>
        </Modal>
      )}
      {confirmDelete&&<Confirm msg={"Supprimer ce reversement ?"} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// KPI & PAIE PAGE - Nouveau systeme SAVER
// ============================================================
const KpiPaiePage = ({drivers, shifts}) => {
  const FIXE_JOURNALIER = 5357; // F CFA par jour (modifiable)
  const KPI_RECETTES = 25000; // par shift de 8h
  const KPI_COURSES = 12; // par shift
  const BONUS_MAX = 25000;

  const [periodeDebut, setPeriodeDebut] = useState("");
  const [periodeFin, setPeriodeFin] = useState("");

  const calcPaie = (d) => {
    const shiftsDriver = shifts.filter(s=>(s.status==="Terminé"||s.status==="Termine")&&s.ch===d.id);
    const joursTravailes = shiftsDriver.length;
    const salaireBase = joursTravailes * FIXE_JOURNALIER;

    const totalRecettesNettes = shiftsDriver.reduce((a,s)=>{
      const rev = s.revenusGeneres||s.recette||0;
      const commission = s.commissionYango||0;
      return a + (rev - commission);
    },(0));

    const objectifRecettes = joursTravailes * KPI_RECETTES;
    const surplus = Math.max(0, totalRecettesNettes - objectifRecettes);

    const totalCourses = shiftsDriver.reduce((a,s)=>a+(s.nbCourses||0),0);
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

  const paies = drivers.filter(d=>d.status==="Actif").map(calcPaie);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">KPI, Paie et Incentives</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Regles de remuneration SAVER</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-emerald-50 rounded-xl"><div className="font-semibold text-emerald-800">Fixe journalier</div><div className="text-emerald-700">{fmt(FIXE_JOURNALIER)} / jour</div></div>
          <div className="p-4 bg-blue-50 rounded-xl"><div className="font-semibold text-blue-800">KPI Recettes</div><div className="text-blue-700">{fmt(KPI_RECETTES)} / shift</div></div>
          <div className="p-4 bg-violet-50 rounded-xl"><div className="font-semibold text-violet-800">KPI Courses</div><div className="text-violet-700">{KPI_COURSES} courses / shift</div></div>
          <div className="p-4 bg-amber-50 rounded-xl"><div className="font-semibold text-amber-800">Bonus max</div><div className="text-amber-700">{fmt(BONUS_MAX)}</div></div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <div className="font-semibold text-slate-700 text-sm mb-2">Paliers de bonus (courses supplementaires)</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[[1,10,"10%"],[11,19,"25%"],[20,25,"35%"],[26,35,"50%"],[36,"...","75%"]].map(([min,max,pct])=>(
              <div key={min} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg"><span className="text-slate-600">{min}-{max} courses</span> → <span className="font-semibold text-blue-600">{pct} du surplus</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Fiche de paie (calcul automatique)</h2>
          <span className="text-xs text-slate-400">{paies.length} chauffeur(s)</span>
        </div>
        {paies.length===0?<div className="text-center text-slate-400 py-8">Ajoutez des chauffeurs et des shifts pour voir la paie</div>:(
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Jours</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Courses sup.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Surplus</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Palier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Base</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Bonus</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Deductions</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">NET</th>
              </tr></thead>
              <tbody>
                {paies.map(({d,joursTravailes,salaireBase,surplus,coursesSup,palierPct,bonus,avances,manquants,net})=>(
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{d.prenom} {d.nom}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{joursTravailes}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{coursesSup}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{fmtK(surplus)} F</td>
                    <td className="px-4 py-3 text-sm text-right"><span className={"px-2 py-0.5 rounded-full text-xs font-semibold "+(palierPct>=0.5?"bg-emerald-100 text-emerald-700":palierPct>0?"bg-blue-100 text-blue-700":"bg-slate-100 text-slate-500")}>{Math.round(palierPct*100)}%</span></td>
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

// ============================================================
// RECHARGE EV PAGE
// ============================================================
const RechargePage = ({recharges, vehicles, drivers, onAdd, onUpdate, onDelete}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterVh, setFilterVh] = useState("all");
  const [filterDriver, setFilterDriver] = useState("all");

  const emptyForm = {vh:"",ch:"",date:new Date().toISOString().split("T")[0],typeCharge:"Partenaire",partenaire:"",lieu:"",kWh:0,cout:0,duree:0,socAv:0,socAp:0};
  const [form, setForm] = useState(emptyForm);

  const handleSave = async () => {
    if(!form.vh) return alert("Vehicule requis");
    const payload = {...form, kwh:form.kWh, soc_av:form.socAv, soc_ap:form.socAp};
    if(editItem){await onUpdate(editItem.id,payload);}
    else{await onAdd({...payload,id:"RC-"+Date.now()});}
    setShowModal(false);
  };

  const filtered = recharges
    .filter(r=>filterVh==="all"||r.vh===filterVh)
    .filter(r=>filterDriver==="all"||r.ch===filterDriver);

  const totalKwh = filtered.reduce((a,r)=>a+(r.kWh||0),0);
  const totalCout = filtered.reduce((a,r)=>a+(r.cout||0),0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Recharge EV</h1>
        <button onClick={()=>{setForm(emptyForm);setEditItem(null);setShowModal(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter recharge</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total kWh consommes" value={totalKwh.toFixed(1)+" kWh"} color="text-emerald-600"/>
        <StatCard label="Cout total recharges" value={fmtK(totalCout)+" F"} color="text-amber-600"/>
        <StatCard label="Sessions de recharge" value={filtered.length.toString()} color="text-blue-600"/>
      </div>
      <div className="flex gap-3 flex-wrap">
        <select value={filterVh} onChange={e=>setFilterVh(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="all">Tous les vehicules</option>
          {vehicles.map(v=><option key={v.id} value={v.id}>{v.immat}</option>)}
        </select>
        <select value={filterDriver} onChange={e=>setFilterDriver(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="all">Tous les chauffeurs</option>
          {drivers.map(d=><option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Partenaire</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">kWh</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cout</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SOC</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(r=>(
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">{r.date}</td>
                <td className="px-4 py-3 text-sm font-medium">{vehicles.find(v=>v.id===r.vh)?.immat||r.vh}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{drivers.find(d=>d.id===r.ch)?`${drivers.find(d=>d.id===r.ch).prenom} ${drivers.find(d=>d.id===r.ch).nom}`:"—"}</td>
                <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">{r.typeCharge||"Partenaire"}</Badge></td>
                <td className="px-4 py-3 text-sm text-slate-600">{r.partenaire||"—"}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{r.kWh} kWh</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{fmt(r.cout||0)}</td>
                <td className="px-4 py-3 text-sm"><span className="text-red-500">{r.socAv}%</span> → <span className="text-emerald-500">{r.socAp}%</span></td>
                <td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>{setForm({...emptyForm,...r});setEditItem(r);setShowModal(true);}} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded">Modifier</button><button onClick={()=>setConfirmDelete(r)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded">Suppr.</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editItem?"Modifier recharge":"Ajouter recharge"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Input label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/></div>
            <Select label="Vehicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"-- Choisir --"},...vehicles.map(v=>({value:v.id,label:v.immat}))]}/>
            <Select label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"-- Choisir --"},...drivers.map(d=>({value:d.id,label:`${d.prenom} ${d.nom}`}))]}/>
            <Select label="Type de charge" value={form.typeCharge} onChange={v=>setForm({...form,typeCharge:v})} options={["Domestique AC lent","Domestique DC rapide","Partenaire"]}/>
            <Input label="Partenaire / Lieu" value={form.partenaire} onChange={v=>setForm({...form,partenaire:v})} placeholder="Ex: Arnio, Neo, Illigo..."/>
            <Input label="kWh" value={form.kWh} onChange={v=>setForm({...form,kWh:parseFloat(v)||0})} type="number"/>
            <Input label="Cout (F CFA)" value={form.cout} onChange={v=>setForm({...form,cout:parseInt(v)||0})} type="number"/>
            <Input label="Duree (min)" value={form.duree} onChange={v=>setForm({...form,duree:parseInt(v)||0})} type="number"/>
            <Input label="SOC avant (%)" value={form.socAv} onChange={v=>setForm({...form,socAv:parseInt(v)||0})} type="number"/>
            <Input label="SOC apres (%)" value={form.socAp} onChange={v=>setForm({...form,socAp:parseInt(v)||0})} type="number"/>
          </div>
        </Modal>
      )}
      {confirmDelete&&<Confirm msg="Supprimer cette recharge ?" onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// MAINTENANCE PAGE
// ============================================================
const MaintenancePage = ({maintenances, vehicles, onAdd, onUpdate, onDelete}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = {vh:"",type:"Preventive",desc:"",status:"Planifiee",dateDebut:"",dateFin:"",cout:0,garage:"",factureStatus:"En attente",commentaireAnnulation:""};
  const [form, setForm] = useState(emptyForm);

  const handleSave = async () => {
    if(!form.vh||!form.desc) return alert("Vehicule et description requis");
    const payload = {...form, description:form.desc, date:form.dateDebut};
    if(editItem){await onUpdate(editItem.id,payload);}
    else{await onAdd({...payload,id:"MT-"+Date.now()});}
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
        <button onClick={()=>{setForm(emptyForm);setEditItem(null);setShowModal(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Planifiees" value={maintenances.filter(m=>m.status==="Planifiee"||m.status==="Planifiée").length.toString()} color="text-blue-600"/>
        <StatCard label="En cours" value={maintenances.filter(m=>m.status==="En cours").length.toString()} color="text-amber-600"/>
        <StatCard label="Cout total" value={fmt(maintenances.reduce((a,m)=>a+(m.cout||0),0))} color="text-red-600"/>
      </div>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="space-y-0">
          {maintenances.length===0&&<div className="text-center text-slate-400 py-8">Aucune maintenance</div>}
          {maintenances.map(m=>(
            <div key={m.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className={"w-10 h-10 rounded-lg flex items-center justify-center "+(m.type==="Corrective"?"bg-red-100 text-red-600":"bg-blue-100 text-blue-600")}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-800">{m.desc||m.description}</div>
                  <div className="text-xs text-slate-400">{vehicles.find(v=>v.id===m.vh)?.immat||m.vh} · {m.type} · {m.garage}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Badge color={sc(m.status)}>{m.status}</Badge>
                  <div className="text-xs text-slate-400 mt-1">{m.date||m.dateDebut}{m.cout>0&&" · "+fmt(m.cout)}</div>
                  {m.factureStatus&&<div className="text-xs text-slate-400">{m.factureStatus}</div>}
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>{setForm({...emptyForm,...m,desc:m.desc||m.description||""});setEditItem(m);setShowModal(true);}} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded">Modifier</button>
                  <button onClick={()=>setConfirmDelete(m)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded">Suppr.</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal&&(
        <Modal title={editItem?"Modifier maintenance":"Ajouter maintenance"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Vehicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"-- Choisir --"},...vehicles.map(v=>({value:v.id,label:v.immat}))]}/>
            <Select label="Type" value={form.type} onChange={v=>setForm({...form,type:v})} options={["Preventive","Corrective","Inspection"]}/>
            <div className="col-span-2"><Input label="Description" value={form.desc} onChange={v=>setForm({...form,desc:v})} required/></div>
            <Input label="Garage" value={form.garage} onChange={v=>setForm({...form,garage:v})}/>
            <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["Planifiee","En cours","Terminee","Annulee"]}/>
            <Input label="Date debut" value={form.dateDebut} onChange={v=>setForm({...form,dateDebut:v})} type="date"/>
            <Input label="Date fin" value={form.dateFin} onChange={v=>setForm({...form,dateFin:v})} type="date"/>
            {(form.status==="En cours"||form.status==="Terminee")&&<Input label="Montant facture (F CFA)" value={form.cout} onChange={v=>setForm({...form,cout:parseInt(v)||0})} type="number"/>}
            {(form.status==="En cours"||form.status==="Terminee")&&<Select label="Statut facture" value={form.factureStatus} onChange={v=>setForm({...form,factureStatus:v})} options={["En attente de paiement","Payee"]}/>}
            {form.status==="Annulee"&&<div className="col-span-2"><Input label="Motif d annulation" value={form.commentaireAnnulation} onChange={v=>setForm({...form,commentaireAnnulation:v})}/></div>}
          </div>
        </Modal>
      )}
      {confirmDelete&&<Confirm msg="Supprimer cette maintenance ?" onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// REPORTING PAGE
// ============================================================
const ReportingPage = ({vehicles, drivers, recharges, maintenances, shifts, reversements}) => {
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
    w.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{background:#1e40af;color:white;padding:8px;font-size:12px}h1{color:#1e293b}</style></head><body><h1>${title}</h1><p style="color:#64748b;font-size:12px">SAVER Fleet Ops · ${new Date().toLocaleDateString("fr-FR")}</p><table><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>${tableRows}</table></body></html>`);
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
      <h1 className="text-2xl font-bold text-slate-900">Reporting et Exports</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="CA cumule" value={fmtK(totalCA)+" F"} color="text-emerald-600"/>
        <StatCard label="Courses totales" value={totalCourses.toLocaleString()} color="text-blue-600"/>
        <StatCard label="Cout recharge" value={fmtK(totalRecharge)+" F"} color="text-amber-600"/>
        <StatCard label="Cout maintenance" value={fmtK(totalMaint)+" F"} color="text-red-600"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">P&L par vehicule</h2>
          {vehicles.length===0?<p className="text-slate-400 text-sm">Aucun vehicule</p>:vehicles.map(v=>{
            const vCA=drivers.filter(d=>d.vehicule===v.id).reduce((a,d)=>a+(d.ca||0),0);
            const vRecharge=recharges.filter(r=>r.vh===v.id).reduce((a,r)=>a+(r.cout||0),0);
            const vMaint=maintenances.filter(m=>m.vh===v.id).reduce((a,m)=>a+(m.cout||0),0);
            return (
              <div key={v.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div><div className="font-medium text-sm">{v.immat}</div><div className="text-xs text-slate-400">{v.modele}</div></div>
                <div className="text-right text-xs"><div className="text-emerald-600 font-medium">CA: {fmtK(vCA)} F</div><div className="text-slate-500">Couts: {fmtK(vRecharge+vMaint)} F</div><div className="font-bold text-blue-700">Marge: {fmtK(vCA-vRecharge-vMaint)} F</div></div>
              </div>
            );
          })}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Rapports disponibles</h2>
          <div className="space-y-3">
            {rapports.map(r=>(
              <div key={r.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div><div className="font-medium text-sm text-slate-700">{r.label}</div><div className="text-xs text-slate-400">{r.desc}</div></div>
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

// ============================================================
// GPS PAGE
// ============================================================
const GpsPage = ({vehicles}) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">GPS et Securite</h1>
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-semibold text-slate-900 mb-4">Carte de la flotte</h2>
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl h-64 flex items-center justify-center border border-slate-200">
        <div className="text-center text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <p className="font-medium">Carte GPS LUOGU</p>
          <p className="text-sm">Integration API boitier IoT en attente</p>
          <div className="mt-4 flex justify-center flex-wrap gap-2">
            {vehicles.map(v=><div key={v.id} className={"px-3 py-1.5 rounded-full text-xs font-medium "+(v.status==="En exploitation"?"bg-emerald-100 text-emerald-700":v.status==="En recharge"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700")}>{v.immat}</div>)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================
// SITES PAGE
// ============================================================
const SitesPage = ({sites, vehicles, drivers, onAdd, onUpdate, onDelete}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const emptyForm = {name:"",ville:"",zone:"",waveAccount:"",businessType:"Wave Business"};
  const [form, setForm] = useState(emptyForm);

  const handleSave = async () => {
    if(!form.name||!form.ville) return;
    if(editItem){await onUpdate(editItem.id,form);}
    else{await onAdd({...form,id:Date.now()});}
    setShowModal(false);
  };

  const displaySites = sites.length>0?sites:[{id:1,name:"Abidjan",ville:"Abidjan",zone:"Cocody",waveAccount:"WB-ABJ-001",businessType:"Wave Business"},{id:2,name:"Yamoussoukro",ville:"Yamoussoukro",zone:"Centre",waveAccount:"WB-YAM-001",businessType:"Wave Business"}];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Sites et Comptes Business</h1>
        <button onClick={()=>{setForm(emptyForm);setEditItem(null);setShowModal(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter site</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displaySites.map(site=>{
          const sVh=vehicles.filter(v=>String(v.site)===String(site.id)||v.site===site.name);
          const sDr=drivers.filter(d=>String(d.site)===String(site.id)||d.site===site.name);
          return (
            <div key={site.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-lg font-bold">{site.name}</h3><p className="text-sm text-slate-500">{site.ville} · Zone {site.zone}</p></div>
                <div className="flex gap-2">
                  <Badge color="bg-emerald-100 text-emerald-700">Actif</Badge>
                  <button onClick={()=>{setForm({...emptyForm,...site});setEditItem(site);setShowModal(true);}} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded">Modifier</button>
                  <button onClick={()=>setConfirmDelete(site)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded">Suppr.</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-blue-600">{sVh.length}</div><div className="text-xs text-slate-500">Vehicules</div></div>
                <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-violet-600">{sDr.length}</div><div className="text-xs text-slate-500">Chauffeurs</div></div>
                <div className="text-center p-3 bg-slate-50 rounded-lg"><div className="text-lg font-bold text-emerald-600">{sVh.filter(v=>v.status==="En exploitation").length}</div><div className="text-xs text-slate-500">Actifs</div></div>
              </div>
              {site.waveAccount&&<div className="p-3 bg-blue-50 rounded-lg"><div className="text-xs text-slate-500">Compte Business · {site.businessType||"Wave Business"}</div><div className="font-mono font-semibold text-blue-700">{site.waveAccount}</div></div>}
            </div>
          );
        })}
      </div>

      {showModal&&(
        <Modal title={editItem?"Modifier site":"Ajouter site"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <Input label="Nom du site" value={form.name} onChange={v=>setForm({...form,name:v})} required/>
          <Input label="Ville" value={form.ville} onChange={v=>setForm({...form,ville:v})} required/>
          <Input label="Zone" value={form.zone} onChange={v=>setForm({...form,zone:v})}/>
          <Select label="Type de compte Business" value={form.businessType} onChange={v=>setForm({...form,businessType:v})} options={["Wave Business","Orange Money Business","MTN Mobile Money","Moov Money"]}/>
          <Input label="Numero de compte Business" value={form.waveAccount} onChange={v=>setForm({...form,waveAccount:v})} placeholder="Ex: WB-ABJ-001"/>
        </Modal>
      )}
      {confirmDelete&&<Confirm msg={"Supprimer le site "+confirmDelete.name+" ?"} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// RBAC PAGE
// ============================================================
const RbacPage = ({currentUser}) => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({name:"",email:"",password:"",role:"ops"});
  const [userError, setUserError] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({current:"",next:"",confirm:""});
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { getUsers().then(setUsers); }, []);

  const handleAddUser = async () => {
    setUserError("");
    if(!newUser.name||!newUser.email||!newUser.password) return setUserError("Tous les champs sont requis");
    if(newUser.password.length<6) return setUserError("Mot de passe minimum 6 caracteres");
    if(users.find(u=>u.email===newUser.email)) return setUserError("Email deja utilise");
    const u={...newUser,id:"U-"+Date.now()};
    await saveUser(u);
    setUsers(prev=>[...prev,u]);
    setShowAddUser(false);
    setNewUser({name:"",email:"",password:"",role:"ops"});
  };

  const handleDelete = async (id) => {
    if(id===currentUser?.id) return alert("Vous ne pouvez pas supprimer votre propre compte");
    await supabase.from("users").delete().eq("id",id);
    setUsers(u=>u.filter(x=>x.id!==id));
    setConfirmDelete(null);
  };

  const handleRoleChange = async (id, role) => {
    await supabase.from("users").update({role}).eq("id",id);
    setUsers(u=>u.map(x=>x.id===id?{...x,role}:x));
  };

  const handleChangePwd = async () => {
    setPwdError(""); setPwdSuccess("");
    const me = users.find(u=>u.id===currentUser?.id);
    if(!me||me.password!==pwdForm.current) return setPwdError("Mot de passe actuel incorrect");
    if(pwdForm.next.length<6) return setPwdError("Nouveau mot de passe minimum 6 caracteres");
    if(pwdForm.next!==pwdForm.confirm) return setPwdError("Les mots de passe ne correspondent pas");
    await supabase.from("users").update({password:pwdForm.next}).eq("id",currentUser.id);
    setPwdSuccess("Mot de passe modifie avec succes !");
    setPwdForm({current:"",next:"",confirm:""});
  };

  const roleColor = (r) => ({"admin":"bg-red-100 text-red-700","ops":"bg-blue-100 text-blue-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700"}[r]||"bg-slate-100 text-slate-600");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">RBAC et Audit</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Utilisateurs ({users.length})</h2>
          {currentUser?.role==="admin"&&<button onClick={()=>{setShowAddUser(true);setUserError("");}} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700">+ Ajouter</button>}
        </div>
        <div className="space-y-3">
          {users.map(u=>(
            <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white font-bold">{(u.name||"?")[0]}</div>
                <div><div className="font-medium text-sm">{u.name} {u.id===currentUser?.id&&<span className="text-xs text-blue-500">(vous)</span>}</div><div className="text-xs text-slate-400">{u.email}</div></div>
              </div>
              <div className="flex items-center gap-3">
                {u.id===currentUser?.id&&<button onClick={()=>{setShowChangePwd(true);setPwdForm({current:"",next:"",confirm:""});setPwdError("");setPwdSuccess("");}} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Changer mot de passe</button>}
                {currentUser?.role==="admin"&&u.id!==currentUser?.id?(<select value={u.role} onChange={e=>handleRoleChange(u.id,e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none"><option value="admin">Admin</option><option value="ops">Ops</option><option value="finance">Finance</option><option value="supervisor">Superviseur</option></select>):(<Badge color={roleColor(u.role)}>{u.role}</Badge>)}
                {currentUser?.role==="admin"&&u.id!==currentUser?.id&&<button onClick={()=>setConfirmDelete(u)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddUser&&(
        <Modal title="Creer un compte" onClose={()=>setShowAddUser(false)}
          footer={<><button onClick={()=>setShowAddUser(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleAddUser} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Creer</button></>}>
          {userError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{userError}</div>}
          <Input label="Nom complet" value={newUser.name} onChange={v=>setNewUser({...newUser,name:v})}/>
          <Input label="Email" value={newUser.email} onChange={v=>setNewUser({...newUser,email:v})} type="email"/>
          <Input label="Mot de passe" value={newUser.password} onChange={v=>setNewUser({...newUser,password:v})} type="password"/>
          <Select label="Role" value={newUser.role} onChange={v=>setNewUser({...newUser,role:v})} options={[{value:"ops",label:"Ops Manager"},{value:"supervisor",label:"Superviseur"},{value:"finance",label:"Finance"},{value:"admin",label:"Admin"}]}/>
        </Modal>
      )}

      {showChangePwd&&(
        <Modal title="Modifier mon mot de passe" onClose={()=>{setShowChangePwd(false);setPwdError("");setPwdSuccess("");}}>
          {pwdError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{pwdError}</div>}
          {pwdSuccess&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-3 py-2 rounded-lg">{pwdSuccess}</div>}
          <Input label="Mot de passe actuel" value={pwdForm.current} onChange={v=>setPwdForm({...pwdForm,current:v})} type="password"/>
          <Input label="Nouveau mot de passe" value={pwdForm.next} onChange={v=>setPwdForm({...pwdForm,next:v})} type="password"/>
          <Input label="Confirmer" value={pwdForm.confirm} onChange={v=>setPwdForm({...pwdForm,confirm:v})} type="password"/>
          <button onClick={handleChangePwd} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm">Modifier</button>
        </Modal>
      )}

      {confirmDelete&&<Confirm msg={"Supprimer le compte de "+confirmDelete.name+" ?"} onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};

// ============================================================
// NAVIGATION
// ============================================================
const ALL_NAV = [
  {id:"dashboard",label:"Tableau de bord",roles:["admin","ops","finance","supervisor","dispatcher"],icon:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"},
  {id:"vehicules",label:"Vehicules",roles:["admin","ops","supervisor"],icon:"M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"},
  {id:"chauffeurs",label:"Chauffeurs",roles:["admin","ops","dispatcher"],icon:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"},
  {id:"planning",label:"Planning",roles:["admin","ops","supervisor","dispatcher"],icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"},
  {id:"reversements",label:"Reversements",roles:["admin","finance","dispatcher"],icon:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"},
  {id:"kpi",label:"KPI et Paie",roles:["admin","finance"],icon:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"},
  {id:"recharge",label:"Recharge EV",roles:["admin","ops","supervisor"],icon:"M13 10V3L4 14h7v7l9-11h-7z"},
  {id:"maintenance",label:"Maintenance",roles:["admin","ops","supervisor"],icon:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"},
  {id:"gps",label:"GPS et Securite",roles:["admin","ops","supervisor"],icon:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"},
  {id:"reporting",label:"Reporting",roles:["admin","finance"],icon:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"},
  {id:"sites",label:"Sites",roles:["admin"],icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"},
  {id:"rbac",label:"RBAC et Audit",roles:["admin"],icon:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"},
];

const getNav = (role) => ALL_NAV.filter(n => n.roles.includes(role||"ops"));

const ROLE_LABELS = {
  admin: "Administrateur",
  ops: "Ops Manager",
  finance: "Finance",
  supervisor: "Superviseur Logistique",
  dispatcher: "Dispatcher",
};

// ============================================================
// APP PRINCIPAL
// ============================================================
const App = () => {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);

  // Supabase hooks
  const vh = useSupabase("vehicles", mapVehicle);
  const dr = useSupabase("drivers", mapDriver);
  const sh = useSupabase("shifts", mapShift);
  const rv = useSupabase("reversements", mapReversement);
  const rc = useSupabase("recharges", mapRecharge);
  const mt = useSupabase("maintenances", mapMaintenance);
  const si = useSupabase("sites", mapSite);

  // Handlers avec mapping inverse
  const addVehicle = async (item) => {
    const { vin, capaciteBatterie, annee, couleur, typeService, classesService, visiteDate, assuranceFin, ...rest } = item;
    return await vh.add({ ...rest, vin_number:vin, battery_capacity_kwh:capaciteBatterie, vehicle_year:annee, vehicle_color:couleur, service_type:typeService, service_class:classesService, technical_visit_expiry:visiteDate||null, insurance_expiry:assuranceFin||null });
  };
  const updateVehicle = async (id, item) => {
    const { vin, capaciteBatterie, annee, couleur, typeService, classesService, visiteDate, assuranceFin, ...rest } = item;
    return await vh.update(id, { ...rest, vin_number:vin, battery_capacity_kwh:capaciteBatterie, vehicle_year:annee, vehicle_color:couleur, service_type:typeService, service_class:classesService, technical_visit_expiry:visiteDate||null, insurance_expiry:assuranceFin||null });
  };

  const addDriver = async (item) => {
    const { matricule, noteYango, typeContrat, permisNum, permisExpiration, pieceNum, pieceExpiration, contactUrgence, contactUrgenceTel, ...rest } = item;
    return await dr.add({ ...rest, driver_code:matricule, yango_score:noteYango, contract_type:typeContrat, license_number:permisNum, license_expiry_date:permisExpiration||null, id_card_number:pieceNum, id_card_expiry_date:pieceExpiration||null, emergency_contact:(contactUrgence||"")+" - "+(contactUrgenceTel||"") });
  };
  const updateDriver = async (id, item) => {
    const { matricule, noteYango, typeContrat, permisNum, permisExpiration, pieceNum, pieceExpiration, contactUrgence, contactUrgenceTel, ...rest } = item;
    return await dr.update(id, { ...rest, driver_code:matricule, yango_score:noteYango, contract_type:typeContrat, license_number:permisNum, license_expiry_date:permisExpiration||null, id_card_number:pieceNum, id_card_expiry_date:pieceExpiration||null, emergency_contact:(contactUrgence||"")+" - "+(contactUrgenceTel||"") });
  };

  const addShift = async (item) => {
    const { type, date, checkIn, checkOut, heureDebutReelle, heureFinReelle, kmParcourus, autonomieDebut, autonomieFin, nbCourses, revenusGeneres, commissionYango, depensesAutorisees, noteYangoShift, ...rest } = item;
    return await sh.add({ ...rest, shift_type:"Shift "+type, type, planned_start_date:date||null, date, check_in:checkIn||false, check_out:checkOut||false, real_start_time:heureDebutReelle||null, real_end_time:heureFinReelle||null, km_driven:kmParcourus||0, battery_start:autonomieDebut||0, battery_end:autonomieFin||0, courses_count:nbCourses||0, revenue_cash:revenusGeneres||0, yango_commission:commissionYango||0, authorized_expenses:depensesAutorisees||0, yango_rating:noteYangoShift||0 });
  };
  const updateShift = async (id, item) => {
    const payload = {...item};
    if(item.type) payload.shift_type = "Shift "+item.type;
    if(item.checkIn!==undefined) payload.check_in = item.checkIn;
    if(item.checkOut!==undefined) payload.check_out = item.checkOut;
    if(item.heureDebutReelle!==undefined) { payload.real_start_time = item.heureDebutReelle||null; delete payload.heureDebutReelle; }
    if(item.heureFinReelle!==undefined) { payload.real_end_time = item.heureFinReelle||null; delete payload.heureFinReelle; }
    if(item.kmParcourus!==undefined) { payload.km_driven = item.kmParcourus; delete payload.kmParcourus; }
    if(item.autonomieDebut!==undefined) { payload.battery_start = item.autonomieDebut; delete payload.autonomieDebut; }
    if(item.autonomieFin!==undefined) { payload.battery_end = item.autonomieFin; delete payload.autonomieFin; }
    if(item.nbCourses!==undefined) { payload.courses_count = item.nbCourses; delete payload.nbCourses; }
    if(item.revenusGeneres!==undefined) { payload.revenue_cash = item.revenusGeneres; delete payload.revenusGeneres; }
    if(item.commissionYango!==undefined) { payload.yango_commission = item.commissionYango; delete payload.commissionYango; }
    if(item.depensesAutorisees!==undefined) { payload.authorized_expenses = item.depensesAutorisees; delete payload.depensesAutorisees; }
    if(item.noteYangoShift!==undefined) { payload.yango_rating = item.noteYangoShift; delete payload.noteYangoShift; }
    return await sh.update(id, payload);
  };

  const addReversement = async (item) => {
    const { ch, montant, depensesAutorisees, preuve, ...rest } = item;
    return await rv.add({ ...rest, ch, driver_id:ch, montant, amount_sent:montant, amount_requested:montant, authorized_expenses:depensesAutorisees||0, transaction_proof_url:preuve||"" });
  };
  const updateReversement = async (id, item) => {
    const { ch, montant, depensesAutorisees, preuve, ...rest } = item;
    return await rv.update(id, { ...rest, ch, driver_id:ch, montant, amount_sent:montant, amount_requested:montant, authorized_expenses:depensesAutorisees||0, transaction_proof_url:preuve||"" });
  };

  const addRecharge = async (item) => {
    const { kWh, socAv, socAp, ...rest } = item;
    return await rc.add({ ...rest, kWh, kwh:kWh, soc_av:socAv, soc_ap:socAp });
  };
  const updateRecharge = async (id, item) => {
    const { kWh, socAv, socAp, ...rest } = item;
    return await rc.update(id, { ...rest, kWh, kwh:kWh, soc_av:socAv, soc_ap:socAp });
  };

  const addMaintenance = async (item) => {
    const { desc, dateDebut, ...rest } = item;
    return await mt.add({ ...rest, description:desc, date:dateDebut||item.date||null });
  };
  const updateMaintenance = async (id, item) => {
    const { desc, dateDebut, ...rest } = item;
    return await mt.update(id, { ...rest, description:desc, date:dateDebut||item.date||null });
  };

  const handleLogin = async (u) => {
    try {
      const {data} = await supabase.from("users").select("*").eq("id",u.id).single();
      setUser(data||u);
    } catch {
      setUser(u);
    }
  };

  if (!user) return <LoginPage onLogin={handleLogin}/>;

  const pages = {
    dashboard: <DashboardPage vehicles={vh.data} drivers={dr.data} shifts={sh.data} reversements={rv.data}/>,
    vehicules: <VehiculesPage vehicles={vh.data} onAdd={addVehicle} onUpdate={updateVehicle} onDelete={vh.remove} sites={si.data}/>,
    chauffeurs: <ChauffeursPage drivers={dr.data} vehicles={vh.data} onAdd={addDriver} onUpdate={updateDriver} onDelete={dr.remove} sites={si.data}/>,
    planning: <PlanningPage shifts={sh.data} vehicles={vh.data} drivers={dr.data} onAdd={addShift} onUpdate={updateShift} sites={si.data}/>,
    reversements: <ReversementsPage reversements={rv.data} drivers={dr.data} onAdd={addReversement} onUpdate={updateReversement} onDelete={rv.remove}/>,
    kpi: <KpiPaiePage drivers={dr.data} shifts={sh.data}/>,
    recharge: <RechargePage recharges={rc.data} vehicles={vh.data} drivers={dr.data} onAdd={addRecharge} onUpdate={updateRecharge} onDelete={rc.remove}/>,
    maintenance: <MaintenancePage maintenances={mt.data} vehicles={vh.data} onAdd={addMaintenance} onUpdate={updateMaintenance} onDelete={mt.remove}/>,
    gps: <GpsPage vehicles={vh.data}/>,
    reporting: <ReportingPage vehicles={vh.data} drivers={dr.data} recharges={rc.data} maintenances={mt.data} shifts={sh.data} reversements={rv.data}/>,
    sites: <SitesPage sites={si.data} vehicles={vh.data} drivers={dr.data} onAdd={si.add} onUpdate={si.update} onDelete={si.remove}/>,
    rbac: <RbacPage currentUser={user}/>,
  };

  const unread = 0;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {sideOpen&&<div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={()=>setSideOpen(false)}/>}
      <aside className={(sideOpen?"w-64 translate-x-0":"-translate-x-full lg:translate-x-0 lg:w-20")+" fixed lg:relative z-30 h-full lg:h-auto bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0"}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          {sideOpen&&<div><div className="font-bold text-sm">SAVER Fleet Ops</div><div className="text-xs text-slate-400">Flotte VTC electrique</div></div>}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {getNav(user?.role).map(n=>(
            <button key={n.id} onClick={()=>{setPage(n.id);if(window.innerWidth<1024)setSideOpen(false);}} className={"w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors "+(page===n.id?"bg-blue-600/20 text-blue-400 border-r-2 border-blue-400":"text-slate-400 hover:text-white hover:bg-slate-800")}>
              <NavIcon d={n.icon} className="w-5 h-5 flex-shrink-0"/>
              {sideOpen&&<span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          {sideOpen&&<div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-xs font-bold">{(user.name||"?")[0]}</div><div><div className="text-sm font-medium">{user.name}</div><div className="text-xs text-slate-400">{ROLE_LABELS[user.role]||user.role}</div></div></div>}
          <button onClick={()=>setUser(null)} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {sideOpen&&"Deconnexion"}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={()=>setSideOpen(!sideOpen)} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="text-sm font-semibold text-slate-700 lg:hidden">{NAV.find(n=>n.id===page)?.label}</div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-px bg-slate-200"/>
              <div className="text-sm text-slate-500">{user.name}</div>
              <Badge color={{"admin":"bg-red-100 text-red-700","ops":"bg-blue-100 text-blue-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700","dispatcher":"bg-amber-100 text-amber-700"}[user.role]||"bg-slate-100 text-slate-600"}>{ROLE_LABELS[user.role]||user.role}</Badge>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{pages[page]}</main>
      </div>
    </div>
  );
};

export default App;
