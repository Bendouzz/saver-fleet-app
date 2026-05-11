import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
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

// Supabase Auth - inviter un utilisateur par email
const inviteUser = async (email, name, role) => {
  // On cree le compte dans la table users avec un token d invitation
  const token = Math.random().toString(36).substring(2, 10).toUpperCase();
  const id = "U-"+Date.now();
  const { error } = await supabase.from("users").insert({
    id, name, email, role, password:"", invite_token:token, invite_pending:true
  });
  if (error) return { error };
  return { token, id };
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
  marque: r.marque || "",
  // Colonnes en minuscules Supabase
  vin: r.vin_number || r.numerochassis || "",
  capaciteBatterie: r.battery_capacity_kwh || 0,
  annee: r.vehicle_year || "",
  couleur: r.vehicle_color || "",
  typeService: r.service_type || "VTC",
  classesService: r.service_class || [],
  visiteDate: r.technical_visit_expiry || "",
  assuranceFin: r.insurance_expiry || r.assurancefin || "",
  typeContrat: r.typecontrat || r.typeContrat || "Interne SAVER",
  assuranceNum: r.assurancenum || r.assuranceNum || "",
  assuranceDebut: r.assurancedebut || r.assuranceDebut || "",
  carteGriseNum: r.cartegrisenum || r.carteGriseNum || "",
  carteGriseDate: r.cartegrisedate || r.carteGriseDate || "",
  carteGriseProprietaire: r.cartegriseproprietaire || r.carteGriseProprietaire || "",
  numeroChassis: r.numerochassis || r.numeroChassis || r.vin_number || "",
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
  telephonePerso: r.telephoneperso || r.telephonePerso || "",
  adresse: r.adresse || "",
  dettes: r.dettes || 0,
  detteCommentaire: r.dettecommentaire || r.detteCommentaire || "",
  commentaires: r.commentaires || "",
  vehicule: r.vehicule || "",
  shift: r.shift || "A",
  permisType: r.permistype || r.permisType || "",
  permisDelivrance: r.permisdelivrance || r.permisDelivrance || "",
  pieceType: r.piecetype || r.pieceType || "CNI",
  pieceDelivrance: r.piecedelivrance || r.pieceDelivrance || "",
  // Contact urgence
  contactUrgence: r.emergency_contact || r.contactUrgence || "",
  contactUrgenceTel: r.contacturgencetel || r.emergency_phone || r.contactUrgenceTel || "",
  // Scores
  noteYango: r.yango_score || r.noteYango || 4.0,
  noteInterne: r.internal_score || r.noteInterne || 80,
  // Matricule
  matricule: r.driver_code || r.matricule || r.id,
  // Contrat
  typeContrat: r.contract_type || r.typeContrat || "Salarie",
  // Permis
  permisNum: r.license_number || r.permisNum || "",
  permisExpiration: r.license_expiry_date || r.permisExpiration || "",
  permisType: r.permistype || r.license_type || r.permisType || "",
  permisDelivrance: r.permisdelivrance || r.license_issue_date || r.permisDelivrance || "",
  // Piece ID
  pieceNum: r.id_card_number || r.pieceNum || "",
  pieceExpiration: r.id_card_expiry_date || r.pieceExpiration || "",
  pieceType: r.piecetype || r.pieceType || "CNI",
  pieceDelivrance: r.piecedelivrance || r.id_card_issue_date || r.pieceDelivrance || "",
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
const ROLE_ACCOUNTS = [
  {role:"admin", label:"Administrateur", email:"admin@saver.ci", icon:"shield", color:"from-red-500 to-red-600"},
  {role:"ops", label:"Ops Manager", email:"ops@saver.ci", icon:"truck", color:"from-blue-500 to-blue-600"},
  {role:"finance", label:"Finance", email:"finance@saver.ci", icon:"cash", color:"from-emerald-500 to-emerald-600"},
  {role:"supervisor", label:"Superviseur Logistique", email:"superviseur@saver.ci", icon:"eye", color:"from-violet-500 to-violet-600"},
  {role:"dispatcher", label:"Dispatcher", email:"dispatcher@saver.ci", icon:"map", color:"from-amber-500 to-amber-600"},
];

const RoleIcon = ({icon}) => {
  const icons = {
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    truck: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    cash: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  };
  return <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]}/></svg>;
};

const LoginPage = ({onLogin}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) return setError("Email requis");
    if (!password) return setError("Mot de passe requis");
    setError(""); setLoading(true);
    const users = await getUsers();
    const found = users.find(u => u.email===email && u.password===password);
    setLoading(false);
    if (!found) return setError("Email ou mot de passe incorrect");
    if (found.invite_pending) return setError("Vous devez d abord definir votre mot de passe via le lien d invitation");
    onLogin(found);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Easy by Saver</h1>
          <p className="text-blue-300 mt-2">Gestion de flotte VTC electrique</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <h2 className="text-white font-semibold text-center mb-6">Connexion</h2>

          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}

          <div className="space-y-4">
            {/* Login / Email */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Login</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="votre@email.com" autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Role</label>
              <select value={role} onChange={e=>{
                setRole(e.target.value);
                const found = ROLE_ACCOUNTS.find(r=>r.role===e.target.value);
                if(found && !email) setEmail(found.email);
              }} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 [&>option]:bg-slate-800">
                <option value="">-- Choisir votre role --</option>
                {ROLE_ACCOUNTS.map(r=><option key={r.role} value={r.role}>{r.label}</option>)}
                <option value="custom">Autre compte</option>
              </select>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

};

// ============================================================
// PAGE DEFINITION MOT DE PASSE (nouveaux utilisateurs)
// ============================================================
const SetPasswordPage = ({token, onDone}) => {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    supabase.from("users").select("*").eq("invite_token", token).single()
      .then(({data}) => { if(data) setUserInfo(data); else setError("Lien invalide ou expire."); });
  }, [token]);

  const handleSetPassword = async () => {
    if(pwd.length < 6) return setError("Mot de passe minimum 6 caracteres");
    if(pwd !== confirm) return setError("Les mots de passe ne correspondent pas");
    setLoading(true);
    const { error: err } = await supabase.from("users")
      .update({ password: pwd, invite_token: null, invite_pending: false })
      .eq("invite_token", token);
    setLoading(false);
    if(err) return setError("Erreur: "+err.message);
    onDone();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Easy by Saver</h1>
          <p className="text-blue-300 mt-2">Definir votre mot de passe</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
          {userInfo && (
            <div className="bg-white/10 rounded-xl p-4 mb-5">
              <div className="text-white font-semibold">{userInfo.name}</div>
              <div className="text-blue-300 text-sm">{userInfo.email}</div>
              <div className="text-blue-300 text-sm capitalize mt-1">Role : {userInfo.role}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Nouveau mot de passe</label>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Minimum 6 caracteres" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Confirmer le mot de passe</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetPassword()} placeholder="Retapez votre mot de passe" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>
            <button onClick={handleSetPassword} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Enregistrement..." : "Definir mon mot de passe"}
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
const DashboardPage = ({vehicles, drivers, shifts, reversements, user}) => {
  const role = user?.role || "ops";
  const [periode, setPeriode] = useState("tout");

  // Filtre par periode
  const now = new Date();
  const filterShifts = (s) => {
    const d = new Date(s.date||s.planned_start_date||"");
    if(periode==="jour") return d.toDateString()===now.toDateString();
    if(periode==="semaine") { const start=new Date(now); start.setDate(now.getDate()-7); return d>=start; }
    if(periode==="mois") { const start=new Date(now); start.setDate(now.getDate()-30); return d>=start; }
    return true;
  };
  const filteredShifts = shifts.filter(filterShifts);
  const filteredReversements = reversements.filter(r => {
    const d = new Date(r.date||"");
    if(periode==="jour") return d.toDateString()===now.toDateString();
    if(periode==="semaine") { const start=new Date(now); start.setDate(now.getDate()-7); return d>=start; }
    if(periode==="mois") { const start=new Date(now); start.setDate(now.getDate()-30); return d>=start; }
    return true;
  });

  // Stats communes
  const activeVh = vehicles.filter(v=>v.status==="En exploitation").length;
  const enRechargeVh = vehicles.filter(v=>v.status==="En recharge").length;
  const immobiliseVh = vehicles.filter(v=>v.status==="Immobilise"||v.status==="Immobilisé"||v.status==="Maintenance").length;
  const avgSoc = vehicles.length > 0 ? Math.round(vehicles.reduce((a,v)=>a+(v.soc||0),0)/vehicles.length) : 0;
  const shiftEnCours = filteredShifts.filter(s=>s.status==="En cours").length;
  const shiftPlanifie = filteredShifts.filter(s=>s.status==="Planifie"||s.status==="Planifié").length;
  const shiftTermine = filteredShifts.filter(s=>s.status==="Terminé"||s.status==="Termine").length;
  const totalDrivers = drivers.filter(d=>d.status==="Actif").length;
  const totalReverse = filteredReversements.filter(r=>r.status==="Validé"||r.status==="Valide").reduce((a,r)=>a+(r.montant||0),0);
  const totalRecette = filteredShifts.reduce((a,s)=>a+(s.recette||s.revenue_cash||0),0);
  const ecarts = filteredReversements.filter(r=>(r.ecart||0)>0).length;
  const topDrivers = [...drivers].sort((a,b)=>(b.ca||0)-(a.ca||0)).slice(0,5);
  const ddManquants = filteredShifts.filter(s=>(s.status==="Terminé"||s.status==="Termine")&&!(s.courses_count>0||s.nbCourses>0)).length;

  // Alertes vehicules
  const alertesVh = vehicles.filter(v=>{
    const now = new Date();
    const assOk = v.assuranceFin&&Math.floor((new Date(v.assuranceFin)-now)/86400000)<=7;
    const vtOk = v.visiteDate&&Math.floor((new Date(v.visiteDate)-now)/86400000)<=15;
    return assOk||vtOk;
  });

  // Alertes chauffeurs
  const alertesCh = drivers.filter(d=>{
    const now = new Date();
    const permis = d.permisExpiration&&Math.floor((new Date(d.permisExpiration)-now)/86400000)<=30;
    const piece = d.pieceExpiration&&Math.floor((new Date(d.pieceExpiration)-now)/86400000)<=30;
    return permis||piece;
  });

  const today = new Date().toISOString().split("T")[0];
  const shiftsAujourdhui = filteredShifts.filter(s=>(s.date||s.planned_start_date||"").startsWith(today));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm">{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex gap-2">
          {["tout","jour","semaine","mois"].map(p=>(
            <button key={p} onClick={()=>setPeriode(p)} className={"px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all "+(periode===p?"bg-blue-600 text-white":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>{p==="tout"?"Tout":p}</button>
          ))}
        </div>
      </div>

      {/* ADMIN - Vue complete */}
      {role==="admin"&&(
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Recettes cumulees" value={fmtK(totalRecette)+" F"} sub={shiftEnCours+" shifts en cours"} color="text-emerald-600"/>
            <StatCard label="Reverses valides" value={fmtK(totalReverse)+" F"} sub={ecarts+" ecart(s) detecte(s)"} color="text-blue-600"/>
            <StatCard label="Chauffeurs actifs" value={totalDrivers.toString()} sub={shiftPlanifie+" shifts planifies"} color="text-violet-600"/>
            <StatCard label="Flotte active" value={activeVh+"/"+vehicles.length} sub={"SOC moy: "+avgSoc+"%"} color="text-emerald-600"/>
          </div>
          {(alertesVh.length>0||alertesCh.length>0||ddManquants>0||ecarts>0)&&(
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="font-semibold text-red-800 text-sm mb-2">Alertes actives</div>
              <div className="space-y-1">
                {alertesVh.length>0&&<div className="text-xs text-red-700">• {alertesVh.length} vehicule(s) avec documents expirant bientot</div>}
                {alertesCh.length>0&&<div className="text-xs text-red-700">• {alertesCh.length} chauffeur(s) avec documents expirant bientot</div>}
                {ddManquants>0&&<div className="text-xs text-amber-700">• {ddManquants} shift(s) sans DD Driving Datas</div>}
                {ecarts>0&&<div className="text-xs text-red-700">• {ecarts} ecart(s) detecte(s) dans les reversements</div>}
              </div>
            </div>
          )}
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
              {topDrivers.length===0?<p className="text-slate-400 text-sm">Aucun chauffeur</p>:(
                <div className="space-y-3">{topDrivers.map((d,i)=>(
                  <div key={d.id} className="flex items-center gap-3">
                    <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white "+(i===0?"bg-yellow-500":i===1?"bg-slate-400":i===2?"bg-amber-600":"bg-slate-300")}>{i+1}</div>
                    <div className="flex-1"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">{d.prenom} {d.nom}</span><span className="text-sm font-semibold text-emerald-600">{fmt(d.ca||0)}</span></div><div className="w-full bg-slate-100 rounded-full h-1.5 mt-1"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width:topDrivers[0]?.ca>0?((d.ca||0)/(topDrivers[0].ca||1))*100+"%":"0%"}}/></div></div>
                  </div>
                ))}</div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Etat de charge flotte</h2>
              {vehicles.length===0?<p className="text-slate-400 text-sm">Aucun vehicule</p>:(
                <div className="space-y-3">{vehicles.slice(0,6).map(v=>(
                  <div key={v.id} className="flex items-center justify-between">
                    <div><div className="text-sm font-medium text-slate-700">{v.immat}</div><div className="text-xs text-slate-400">{v.modele}</div></div>
                    <div className="flex items-center gap-3"><SocBar soc={v.soc||0}/><Badge color={sc(v.status)}>{v.status}</Badge></div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* OPS MANAGER */}
      {role==="ops"&&(
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Flotte active" value={activeVh+"/"+vehicles.length} sub={"SOC moy: "+avgSoc+"%"} color="text-emerald-600"/>
            <StatCard label="Shifts en cours" value={shiftEnCours.toString()} sub={shiftPlanifie+" planifies"} color="text-blue-600"/>
            <StatCard label="Shifts termines" value={shiftTermine.toString()} sub={ddManquants+" DD manquants"} color="text-slate-600"/>
            <StatCard label="Alertes vehicules" value={alertesVh.length.toString()} sub="documents expirant" color="text-red-600"/>
          </div>
          {ddManquants>0&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><div className="font-semibold text-amber-800 text-sm">⚠ {ddManquants} shift(s) sans DD Driving Datas — la paie ne peut pas etre calculee</div></div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-emerald-700">En exploitation</span><span className="text-2xl font-bold text-emerald-700">{activeVh}</span></div><div className="w-full bg-emerald-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{width:vehicles.length>0?(activeVh/vehicles.length)*100+"%":"0%"}}/></div></div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-amber-700">En recharge</span><span className="text-2xl font-bold text-amber-700">{enRechargeVh}</span></div><div className="w-full bg-amber-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{width:vehicles.length>0?(enRechargeVh/vehicles.length)*100+"%":"0%"}}/></div></div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-red-700">Immobilises</span><span className="text-2xl font-bold text-red-700">{immobiliseVh}</span></div><div className="w-full bg-red-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{width:vehicles.length>0?(immobiliseVh/vehicles.length)*100+"%":"0%"}}/></div></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Etat de charge flotte</h2>
            {vehicles.length===0?<p className="text-slate-400 text-sm">Aucun vehicule</p>:(
              <div className="space-y-3">{vehicles.map(v=>(
                <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div><div className="text-sm font-medium text-slate-700">{v.immat}</div><div className="text-xs text-slate-400">{v.marque} {v.modele}</div></div>
                  <div className="flex items-center gap-3"><SocBar soc={v.soc||0}/><Badge color={sc(v.status)}>{v.status}</Badge></div>
                </div>
              ))}</div>
            )}
          </div>
        </>
      )}

      {/* FINANCE */}
      {role==="finance"&&(
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Recettes cumulees" value={fmtK(totalRecette)+" F"} sub={shiftTermine+" shifts termines"} color="text-emerald-600"/>
            <StatCard label="Reverses valides" value={fmtK(totalReverse)+" F"} sub="total valide" color="text-blue-600"/>
            <StatCard label="Ecarts detectes" value={ecarts.toString()} sub="a verifier" color="text-red-600"/>
            <StatCard label="En attente" value={reversements.filter(r=>r.status==="En attente").length.toString()} sub="reversements" color="text-amber-600"/>
          </div>
          {ecarts>0&&<div className="bg-red-50 border border-red-200 rounded-xl p-4"><div className="font-semibold text-red-800 text-sm">⚠ {ecarts} ecart(s) detecte(s) dans les reversements — verification requise</div></div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Top chauffeurs par CA</h2>
              {topDrivers.length===0?<p className="text-slate-400 text-sm">Aucun chauffeur</p>:(
                <div className="space-y-3">{topDrivers.map((d,i)=>(
                  <div key={d.id} className="flex items-center gap-3">
                    <div className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white "+(i===0?"bg-yellow-500":i===1?"bg-slate-400":i===2?"bg-amber-600":"bg-slate-300")}>{i+1}</div>
                    <div className="flex-1"><div className="flex items-center justify-between"><span className="text-sm font-medium">{d.prenom} {d.nom}</span><span className="text-sm font-semibold text-emerald-600">{fmt(d.ca||0)}</span></div></div>
                  </div>
                ))}</div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Derniers reversements</h2>
              {reversements.length===0?<p className="text-slate-400 text-sm">Aucun reversement</p>:(
                <div className="space-y-2">{reversements.slice(0,6).map(r=>(
                  <div key={r.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="text-xs text-slate-600">{r.date||"—"} · {r.canal}</div>
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-emerald-600">{fmt(r.montant||0)}</span><Badge color={sc(r.status)}>{r.status}</Badge></div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* SUPERVISEUR */}
      {role==="supervisor"&&(
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Flotte active" value={activeVh+"/"+vehicles.length} color="text-emerald-600"/>
            <StatCard label="SOC moyen" value={avgSoc+"%"} sub="batterie flotte" color={avgSoc>50?"text-emerald-600":"text-red-600"}/>
            <StatCard label="En recharge" value={enRechargeVh.toString()} color="text-amber-600"/>
            <StatCard label="Alertes docs" value={(alertesVh.length+alertesCh.length).toString()} sub="vehicules + chauffeurs" color="text-red-600"/>
          </div>
          {alertesVh.length>0&&(
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="font-semibold text-amber-800 text-sm mb-2">Alertes documentaires vehicules</div>
              {alertesVh.map(v=><div key={v.id} className="text-xs text-amber-700">• {v.immat} — {v.assuranceFin?"Assurance exp. "+v.assuranceFin:""} {v.visiteDate?"Visite tech. "+v.visiteDate:""}</div>)}
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">SOC temps reel par vehicule</h2>
            {vehicles.length===0?<p className="text-slate-400 text-sm">Aucun vehicule</p>:(
              <div className="space-y-3">{vehicles.map(v=>(
                <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div><div className="text-sm font-medium">{v.immat}</div><div className="text-xs text-slate-400">{v.marque} {v.modele}</div></div>
                  <div className="flex items-center gap-3"><SocBar soc={v.soc||0}/><Badge color={sc(v.status)}>{v.status}</Badge></div>
                </div>
              ))}</div>
            )}
          </div>
        </>
      )}

      {/* DISPATCHER */}
      {role==="dispatcher"&&(
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Shifts aujourd hui" value={shiftsAujourdhui.length.toString()} color="text-blue-600"/>
            <StatCard label="En cours" value={shiftEnCours.toString()} color="text-emerald-600"/>
            <StatCard label="Planifies" value={shiftPlanifie.toString()} color="text-amber-600"/>
            <StatCard label="Chauffeurs actifs" value={totalDrivers.toString()} color="text-violet-600"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Shifts du jour</h2>
              {shiftsAujourdhui.length===0?<p className="text-slate-400 text-sm">Aucun shift aujourd hui</p>:(
                <div className="space-y-2">{shiftsAujourdhui.map(s=>(
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium">Shift {s.type}</div>
                    <div className="flex items-center gap-2"><span className="text-xs text-slate-500">{s.date}</span><Badge color={sc(s.status)}>{s.status}</Badge></div>
                  </div>
                ))}</div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Chauffeurs disponibles</h2>
              {drivers.filter(d=>d.status==="Actif").length===0?<p className="text-slate-400 text-sm">Aucun chauffeur</p>:(
                <div className="space-y-2">{drivers.filter(d=>d.status==="Actif").slice(0,8).map(d=>(
                  <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">{(d.prenom||"?")[0]}</div>
                      <span className="text-sm font-medium">{d.prenom} {d.nom}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{d.matricule}</span>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </>
      )}
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
      immat:form.immat||null, marque:form.marque||null, modele:form.modele||null,
      couleur:form.couleur||null, annee:form.annee||null,
      site:form.site||1, autonomie:form.autonomie||0, km:form.km||0, soc:form.soc||0,
      status:form.status||"En exploitation",
      typecontrat:form.typeContrat||"Interne SAVER",
      vin_number:form.vin||null,
      battery_capacity_kwh:form.capaciteBatterie||null,
      vehicle_year:form.annee||null,
      vehicle_color:form.couleur||null,
      service_type:form.typeService||"VTC",
      service_class:form.classesService||[],
      technical_visit_expiry:form.visiteDate||null,
      insurance_expiry:form.assuranceFin||null,
      cartegrisenum:form.carteGriseNum||null,
      cartegrisedate:form.carteGriseDate||null,
      cartegriseproprietaire:form.carteGriseProprietaire||null,
      assurancenum:form.assuranceNum||null,
      assurancedebut:form.assuranceDebut||null,
      assurancefin:form.assuranceFin||null,
      numerochassis:form.numeroChassis||null,
      binome:form.binome||[],
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
              {[["Num. Chassis",v.vin||v.numeroChassis||"—"],["Autonomie",v.autonomie+"km"],["Batterie",(v.capaciteBatterie||"—")+"kWh"],["Classes",(v.classesService||[]).join(", ")||"—"],["Carte grise",v.carteGriseNum||"—"],["Visite tech.",v.visiteDate||v.technical_visit_expiry||"—"],["Assurance",v.assuranceFin||v.insurance_expiry||"—"]].map(([l,val])=>(
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {["Blanc","Noir","Gris","Argent","Bleu","Rouge","Vert","Jaune","Orange","Marron","Beige","Autre"].map(c=>(
                    <button key={c} type="button" onClick={()=>setForm({...form,couleur:c})}
                      className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-all "+(form.couleur===c?"bg-blue-600 text-white border-blue-600":"bg-white text-slate-600 border-slate-200 hover:border-blue-300")}>
                      {c}
                    </button>
                  ))}
                </div>
                {form.couleur&&<div className="text-xs text-slate-500 mt-1">Selectionnee : <strong>{form.couleur}</strong></div>}
              </div>
              <Input label="Annee" value={form.annee} onChange={v=>setForm({...form,annee:parseInt(v)||new Date().getFullYear()})} type="number"/>
              <Input label="Numero de Chassis (VIN)" value={form.vin} onChange={v=>setForm({...form,vin:v,numeroChassis:v})} placeholder="Ex: VF1RFD00X56789012"/>
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
    const base=((nom||"X")[0]+(prenom||"X")[0]).toUpperCase();
    const count=drivers.filter(d=>(d.matricule||"").startsWith(base)).length+1;
    return base+"-"+String(count).padStart(2,"0");
  };

  const emptyForm = {nom:"",prenom:"",site:1,vehicule:"",shift:"A",status:"Actif",kpi:80,courses:0,ca:0,pen:0,avance:0,typeContrat:"Salarie",telephone:"",telephonePerso:"",adresse:"",contactUrgence:"",contactUrgenceTel:"",permisNum:"",permisDelivrance:"",permisExpiration:"",permisType:"",pieceType:"CNI",pieceNum:"",pieceDelivrance:"",pieceExpiration:"",noteYango:4.0,noteInterne:80,commentaires:"",dettes:0,detteCommentaire:"",matricule:""};
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); setActiveTab("profil"); };
  const openEdit = (d) => { 
    setForm({
      ...emptyForm, ...d,
      permisNum: d.permisNum || d.license_number || "",
      permisExpiration: d.permisExpiration || d.license_expiry_date || "",
      permisType: d.permisType || d.permistype || "",
      permisDelivrance: d.permisDelivrance || d.permisdelivrance || "",
      pieceNum: d.pieceNum || d.id_card_number || "",
      pieceExpiration: d.pieceExpiration || d.id_card_expiry_date || "",
      pieceType: d.pieceType || d.piecetype || "CNI",
      pieceDelivrance: d.pieceDelivrance || d.piecedelivrance || "",
      typeContrat: d.typeContrat || d.contract_type || "Salarie",
      noteYango: d.noteYango || d.yango_score || 4.0,
      noteInterne: d.noteInterne || d.internal_score || 80,
      matricule: d.matricule || d.driver_code || "",
      telephone: d.telephone || "",
      telephonePerso: d.telephonePerso || d.telephoneperso || "",
      contactUrgence: d.contactUrgence || d.emergency_contact || "",
      contactUrgenceTel: d.contactUrgenceTel || d.contacturgencetel || "",
    }); 
    setEditItem(d); setShowModal(true); setActiveTab("profil"); 
  };

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
      license_number:form.permisNum||null, license_expiry_date:form.permisExpiration||null,
      id_card_number:form.pieceNum||null, id_card_expiry_date:form.pieceExpiration||null,
      permistype:form.permisType||null, permisdelivrance:form.permisDelivrance||null,
      piecetype:form.pieceType||"CNI", piecedelivrance:form.pieceDelivrance||null,
      yango_score:form.noteYango, noteYango:form.noteYango,
      internal_score:form.noteInterne,
      commentaires:form.commentaires||null, dettes:form.dettes||0,
      dettecommentaire:form.detteCommentaire||null,
      telephone:form.telephone||null,
      telephoneperso:form.telephonePerso||null,
      adresse:form.adresse||null,
      contacturgencetel:form.contactUrgenceTel||null,
    };
    if(editItem){await onUpdate(editItem.id,payload);}
    else{await onAdd({...payload,id:"CH-"+Date.now()});}
    setShowModal(false);
  };

  const tabs = [{id:"profil",label:"Profil"},{id:"kyc",label:"KYC"},{id:"performance",label:"Perf."},{id:"creance",label:"Incidents"}];

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
          {activeTab==="kyc"&&<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-semibold text-sm mb-3">Permis</h4>{[["N°",d.permisNum||d.license_number],["Type",d.permisType||d.permistype],["Delivrance",d.permisDelivrance||d.permisdelivrance],["Expiration",d.permisExpiration||d.license_expiry_date]].map(([l,val])=><div key={l} className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-xs text-slate-500">{l}</span><span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span></div>)}</div><div><h4 className="font-semibold text-sm mb-3">Piece ID ({d.pieceType||d.piecetype||"CNI"})</h4>{[["N°",d.pieceNum||d.id_card_number],["Delivrance",d.pieceDelivrance||d.piecedelivrance],["Expiration",d.pieceExpiration||d.id_card_expiry_date]].map(([l,val])=><div key={l} className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-xs text-slate-500">{l}</span><span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span></div>)}</div></div>}
          {activeTab==="performance"&&<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[["Note Yango",(d.noteYango||"—")+"/5","text-amber-500"],["KPI",d.kpi+"%","text-blue-600"],["Courses",(d.courses||0).toLocaleString(),"text-slate-700"],["CA",fmt(d.ca||0),"text-emerald-600"],["Penalites",fmt(d.pen||0),"text-red-600"],["Avance",fmt(d.avance||0),"text-amber-600"]].map(([l,val,color])=><div key={l} className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500">{l}</div><div className={"font-bold text-lg "+color}>{val}</div></div>)}</div>}
          {activeTab==="creance"&&<div className="space-y-4"><div className="p-4 bg-red-50 rounded-xl border border-red-100"><div className="text-xs text-slate-500 mb-1">Solde dettes</div><div className="font-bold text-red-600 text-lg">{fmt(d.dettes||0)}</div>{d.detteCommentaire&&<div className="text-xs text-slate-500 mt-1">{d.detteCommentaire}</div>}</div>{d.commentaires&&<div className="p-4 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 mb-1">Commentaires</div><div className="text-sm">{d.commentaires}</div></div>}{!d.dettes&&!d.commentaires&&<div className="text-slate-400 text-sm text-center py-4">Aucun incident</div>}</div>}
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
              <Input label="Numero urgence 1" value={form.contactUrgence} onChange={v=>setForm({...form,contactUrgence:v})} placeholder="+225..."/>
              <Input label="Numero urgence 2" value={form.contactUrgenceTel} onChange={v=>setForm({...form,contactUrgenceTel:v})} placeholder="+225..."/>
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
          {activeTab==="creance"&&(
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
const PlanningPage = ({shifts, vehicles, drivers, onAdd, onUpdate, onDelete, sites}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDDModal, setShowDDModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [ddForm, setDDForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const sitesList = sites.length>0?sites:[{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];

  const emptyShift = {vh:"",ch:"",type:"A",date:new Date().toISOString().split("T")[0],debut:"06:00",fin:"14:00",status:"Planifie",lieuDebut:"",lieuFin:"",responsableZone:"",recette:0,commentaireShift:""};
  const [form, setForm] = useState(emptyShift);

  const shiftHoraires = {A:"06:00 - 14:00",B:"15:00 - 23:00",C:"22:00 - 06:00"};
  const shiftColors = {
    A:{bg:"bg-blue-50",border:"border-blue-200",title:"text-blue-800",badge:"bg-blue-600",light:"bg-blue-100 text-blue-700"},
    B:{bg:"bg-violet-50",border:"border-violet-200",title:"text-violet-800",badge:"bg-violet-600",light:"bg-violet-100 text-violet-700"},
    C:{bg:"bg-slate-50",border:"border-slate-200",title:"text-slate-800",badge:"bg-slate-600",light:"bg-slate-100 text-slate-600"},
  };

  const getDriver = (id) => drivers.find(d=>d.id===id);
  const getVehicle = (id) => vehicles.find(v=>v.id===id);

  // Stats
  const totalShifts = shifts.length;
  const enCours = shifts.filter(s=>s.status==="En cours").length;
  const termines = shifts.filter(s=>s.status==="Terminé"||s.status==="Termine").length;
  const planifies = shifts.filter(s=>s.status==="Planifie"||s.status==="Planifié").length;
  const ddSaisis = shifts.filter(s=>(s.status==="Terminé"||s.status==="Termine")&&(s.courses_count>0||s.nbCourses>0)).length;

  const handleSave = async () => {
    if(!form.vh||!form.ch) return alert("Vehicule et chauffeur requis");
    setSaving(true);
    await onAdd({...form, id:"SH-"+Date.now(), shift_type:"Shift "+form.type, planned_start_date:form.date, check_in:false, check_out:false});
    setSaving(false);
    setShowModal(false);
  };

  const handleCheckin = async (s) => {
    await onUpdate(s.id, {status:"En cours", check_in:true});
  };

  const handleCheckout = async (s) => {
    await onUpdate(s.id, {status:"Terminé", check_out:true});
    // Ouvrir DD directement apres checkout
    setDDForm({heureDebutReelle:"",heureFinReelle:"",kmParcourus:0,nbCourses:0,revenusGeneres:0,commissionYango:0,autonomieDebut:100,autonomieFin:0,depensesAutorisees:0,noteYangoShift:0,commentaireShift:""});
    setSelectedShift({...s, status:"Terminé"});
    setShowDDModal(true);
  };

  const handleSaveDD = async () => {
    if(!selectedShift) return;
    setSaving(true);
    const recetteNette = (ddForm.revenusGeneres||0) - (ddForm.commissionYango||0);
    await onUpdate(selectedShift.id, {
      real_start_time:ddForm.heureDebutReelle||null,
      real_end_time:ddForm.heureFinReelle||null,
      km_driven:ddForm.kmParcourus||0,
      battery_start:ddForm.autonomieDebut||0,
      battery_end:ddForm.autonomieFin||0,
      courses_count:ddForm.nbCourses||0,
      revenue_cash:ddForm.revenusGeneres||0,
      recette:ddForm.revenusGeneres||0,
      yango_commission:ddForm.commissionYango||0,
      authorized_expenses:ddForm.depensesAutorisees||0,
      yango_rating:ddForm.noteYangoShift||0,
    });
    setSaving(false);
    setShowDDModal(false);
  };

  // Calculs DD
  const ratioCommission = ddForm.revenusGeneres>0 ? Math.round((ddForm.commissionYango/ddForm.revenusGeneres)*100) : 0;
  const consoBatterie = (ddForm.autonomieDebut||0)-(ddForm.autonomieFin||0);
  const recetteNette = (ddForm.revenusGeneres||0)-(ddForm.commissionYango||0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planning et Shifts</h1>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <button onClick={()=>{setForm(emptyShift);setShowModal(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Ajouter shift
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"Total shifts",value:totalShifts,color:"text-slate-700",bg:"bg-slate-50"},
          {label:"Planifies",value:planifies,color:"text-blue-600",bg:"bg-blue-50"},
          {label:"En cours",value:enCours,color:"text-emerald-600",bg:"bg-emerald-50"},
          {label:"Termines",value:termines,color:"text-slate-500",bg:"bg-slate-50"},
          {label:"DD saisis",value:ddSaisis+"/"+termines,color:"text-violet-600",bg:"bg-violet-50"},
        ].map(s=>(
          <div key={s.label} className={s.bg+" rounded-xl p-4 border border-slate-200"}>
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={"text-2xl font-bold "+s.color}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Grille shifts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["A","B","C"].map(type=>{
          const col=shiftColors[type];
          const shiftList=shifts.filter(s=>s.type===type);
          return (
            <div key={type} className={col.bg+" rounded-xl border "+col.border+" p-4"}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={"font-bold text-base "+col.title}>Shift {type}</h3>
                  <p className="text-xs text-slate-500">{shiftHoraires[type]}</p>
                </div>
                <span className={"text-xs px-2.5 py-1 rounded-full text-white font-medium "+col.badge}>{shiftList.length} shift{shiftList.length>1?"s":""}</span>
              </div>
              <div className="space-y-3">
                {shiftList.length===0&&(
                  <div className="text-center py-6 text-slate-400">
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <p className="text-xs">Aucun shift</p>
                  </div>
                )}
                {shiftList.map(s=>{
                  const driver = getDriver(s.ch);
                  const vehicle = getVehicle(s.vh);
                  const hasDDData = (s.courses_count>0||s.nbCourses>0);
                  const isTermine = s.status==="Terminé"||s.status==="Termine";
                  return (
                    <div key={s.id} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                      {/* En-tete shift */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {driver?(driver.prenom||"?")[0]+(driver.nom||"?")[0]:"?"}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-800">{driver?driver.prenom+" "+driver.nom:"—"}</div>
                            <div className="text-xs text-slate-400">{vehicle?.immat||"—"} {driver?.matricule?"· "+driver.matricule:""}</div>
                          </div>
                        </div>
                        <Badge color={sc(s.status)}>{s.status}</Badge>
                      </div>

                      {/* Recette si disponible */}
                      {(s.recette>0||s.revenue_cash>0)&&(
                        <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-50 rounded-lg">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          <span className="text-xs font-semibold text-emerald-700">{fmt(s.recette||s.revenue_cash||0)}</span>
                        </div>
                      )}

                      {/* DD Data resume si saisi */}
                      {isTermine&&hasDDData&&(
                        <div className="bg-slate-50 rounded-lg p-2 mb-2 space-y-1">
                          <div className="text-xs font-semibold text-slate-600 mb-1">DD Driving Datas</div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                            <span>Courses: <strong className="text-slate-700">{s.courses_count||s.nbCourses||0}</strong></span>
                            <span>Rev: <strong className="text-emerald-600">{fmt(s.revenue_cash||s.revenusGeneres||0)}</strong></span>
                            <span>Com.: <strong className="text-red-500">{fmt(s.yango_commission||s.commissionYango||0)}</strong></span>
                            <span>Note: <strong className="text-amber-500">{s.yango_rating||s.noteYangoShift||0}/5</strong></span>
                            {s.km_driven>0&&<span>Km: <strong className="text-slate-700">{s.km_driven}</strong></span>}
                            {(s.battery_start>0)&&<span>Batterie: <strong className="text-blue-600">{s.battery_start}%→{s.battery_end}%</strong></span>}
                          </div>
                        </div>
                      )}

                      {/* Alerte DD manquant */}
                      {isTermine&&!hasDDData&&(
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                          <div className="text-xs text-amber-700 font-medium">DD Driving Datas non saisis</div>
                          <div className="text-xs text-amber-600">La paie ne peut pas etre calculee sans ces donnees</div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5 mt-2">
                        {(s.status==="Planifie"||s.status==="Planifié")&&(
                          <button onClick={()=>handleCheckin(s)} className="flex-1 text-xs bg-emerald-500 text-white px-2 py-1.5 rounded-lg hover:bg-emerald-600 font-medium">
                            Check-in
                          </button>
                        )}
                        {s.status==="En cours"&&(
                          <button onClick={()=>handleCheckout(s)} className="flex-1 text-xs bg-violet-500 text-white px-2 py-1.5 rounded-lg hover:bg-violet-600 font-medium">
                            Check-out
                          </button>
                        )}
                        {isTermine&&(
                          <button onClick={()=>setConfirmDelete(s)} className="text-xs text-red-500 border border-red-200 px-2 py-1.5 rounded-lg hover:bg-red-50">
                            Suppr.
                          </button>
                        )}
                        {isTermine&&(
                          <button onClick={()=>{
                            setDDForm({
                              heureDebutReelle:s.real_start_time||"",
                              heureFinReelle:s.real_end_time||"",
                              kmParcourus:s.km_driven||0,
                              nbCourses:s.courses_count||s.nbCourses||0,
                              revenusGeneres:s.revenue_cash||s.revenusGeneres||0,
                              commissionYango:s.yango_commission||s.commissionYango||0,
                              autonomieDebut:s.battery_start||100,
                              autonomieFin:s.battery_end||0,
                              depensesAutorisees:s.authorized_expenses||s.depensesAutorisees||0,
                              noteYangoShift:s.yango_rating||s.noteYangoShift||0,
                              commentaireShift:s.commentaireShift||"",
                            });
                            setSelectedShift(s);
                            setShowDDModal(true);
                          }} className={"flex-1 text-xs px-2 py-1.5 rounded-lg font-medium "+(hasDDData?"bg-blue-100 text-blue-700 hover:bg-blue-200":"bg-blue-600 text-white hover:bg-blue-700")}>
                            {hasDDData?"Modifier DD":"Saisir DD"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL AJOUT SHIFT */}
      {showModal&&(
        <Modal title="Planifier un shift" onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving?"Enregistrement...":"Planifier"}</button></>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Input label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/></div>
            <Select label="Vehicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"-- Choisir --"},...vehicles.map(v=>({value:v.id,label:v.immat}))]}/>
            <Select label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"-- Choisir --"},...drivers.filter(d=>d.status==="Actif").map(d=>({value:d.id,label:d.prenom+" "+d.nom+" ("+(d.matricule||d.id)+")"}))]}/> 
            <Select label="Type de shift" value={form.type} onChange={v=>setForm({...form,type:v})} options={[{value:"A",label:"Shift A (06h-14h)"},{value:"B",label:"Shift B (15h-23h)"},{value:"C",label:"Shift C (22h-06h)"}]}/>
            <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["Planifie","En cours","Termine"]}/>
            <Input label="Lieu de debut" value={form.lieuDebut} onChange={v=>setForm({...form,lieuDebut:v})} placeholder="Ex: Cocody"/>
            <Input label="Lieu de fin" value={form.lieuFin} onChange={v=>setForm({...form,lieuFin:v})} placeholder="Ex: Plateau"/>
            <div className="col-span-2"><Input label="Responsable de zone" value={form.responsableZone} onChange={v=>setForm({...form,responsableZone:v})}/></div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-2">
            <div className="text-xs text-emerald-700 font-medium">Message WhatsApp automatique envoye au chauffeur apres planification</div>
          </div>
        </Modal>
      )}

      {/* MODAL DD DRIVING DATAS */}
      {showDDModal&&selectedShift&&(()=>{const driver=getDriver(selectedShift.ch);const vehicle=getVehicle(selectedShift.vh);return(
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto my-4">
              {/* Header DD */}
              <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">DD Driving Datas</h2>
                    <p className="text-blue-200 text-sm mt-1">Donnees quotidiennes du shift</p>
                  </div>
                  <button onClick={()=>setShowDDModal(false)} className="text-white/70 hover:text-white text-2xl font-bold">x</button>
                </div>
                {/* Info chauffeur + vehicule */}
                <div className="flex items-center gap-3 mt-4 bg-white/10 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {driver?(driver.prenom||"?")[0]+(driver.nom||"?")[0]:"?"}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{driver?driver.prenom+" "+driver.nom:"—"}</div>
                    <div className="text-blue-200 text-xs">{vehicle?.immat||"—"} · Shift {selectedShift.type} · {selectedShift.date||selectedShift.planned_start_date||""}</div>
                  </div>
                  <div className="ml-auto">
                    <Badge color={"bg-blue-100 text-blue-700"}>Shift {selectedShift.type}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Info saisie */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-sm font-medium text-blue-800 mb-1">Comment saisir les DD ?</div>
                  <div className="text-xs text-blue-700">Ces donnees proviennent des captures ecran du chauffeur — portefeuille Yango PRO (Commandes + Especes) et ecran de bord du vehicule (autonomie debut/fin)</div>
                </div>

                {/* Section Temps */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Heures reelles (10% du KPI)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Heure debut reelle" value={ddForm.heureDebutReelle||""} onChange={v=>setDDForm({...ddForm,heureDebutReelle:v})} type="time"/>
                    <Input label="Heure fin reelle" value={ddForm.heureFinReelle||""} onChange={v=>setDDForm({...ddForm,heureFinReelle:v})} type="time"/>
                  </div>
                </div>

                {/* Section Courses et Revenus */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Courses et revenus (30% du KPI)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre de courses (5%)" value={ddForm.nbCourses||0} onChange={v=>setDDForm({...ddForm,nbCourses:parseInt(v)||0})} type="number"/>
                    <Input label="Revenus generes — F CFA (25%)" value={ddForm.revenusGeneres||0} onChange={v=>setDDForm({...ddForm,revenusGeneres:parseInt(v)||0})} type="number"/>
                    <Input label="Commission Yango — F CFA (15%)" value={ddForm.commissionYango||0} onChange={v=>setDDForm({...ddForm,commissionYango:parseInt(v)||0})} type="number"/>
                    <Input label="Depenses autorisees — F CFA" value={ddForm.depensesAutorisees||0} onChange={v=>setDDForm({...ddForm,depensesAutorisees:parseInt(v)||0})} type="number"/>
                  </div>
                </div>

                {/* Section Batterie */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Consommation batterie (15% du KPI)</div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Autonomie debut (%)" value={ddForm.autonomieDebut||0} onChange={v=>setDDForm({...ddForm,autonomieDebut:parseInt(v)||0})} type="number"/>
                    <Input label="Autonomie fin (%)" value={ddForm.autonomieFin||0} onChange={v=>setDDForm({...ddForm,autonomieFin:parseInt(v)||0})} type="number"/>
                    <Input label="Km parcourus" value={ddForm.kmParcourus||0} onChange={v=>setDDForm({...ddForm,kmParcourus:parseFloat(v)||0})} type="number"/>
                  </div>
                </div>

                {/* Note Yango */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Note et etat vehicule</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Note Yango du shift (/5) — 10%" value={ddForm.noteYangoShift||0} onChange={v=>setDDForm({...ddForm,noteYangoShift:parseFloat(v)||0})} type="number"/>
                    <div className="col-span-1"></div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Etat vehicule et commentaires (20%)</label>
                      <textarea value={ddForm.commentaireShift||""} onChange={e=>setDDForm({...ddForm,commentaireShift:e.target.value})} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Etat du vehicule, incidents, remarques..."/>
                    </div>
                  </div>
                </div>

                {/* Analyse automatique */}
                {ddForm.revenusGeneres>0&&(
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="text-sm font-semibold text-slate-700 mb-3">Analyse automatique</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">Recette nette</div>
                        <div className="font-bold text-emerald-600 text-sm">{fmt(recetteNette)}</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">Ratio commission</div>
                        <div className={"font-bold text-sm "+(ratioCommission>25?"text-red-600":ratioCommission>18?"text-amber-600":"text-emerald-600")}>{ratioCommission}%</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">Conso batterie</div>
                        <div className="font-bold text-blue-600 text-sm">{consoBatterie}%</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">Moy. par course</div>
                        <div className="font-bold text-violet-600 text-sm">{ddForm.nbCourses>0?fmt(Math.round(recetteNette/ddForm.nbCourses)):"—"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
                <button onClick={()=>setShowDDModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50">Annuler</button>
                <button onClick={handleSaveDD} disabled={saving} className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {saving?"Enregistrement...":"Enregistrer les DD"}
                </button>
              </div>
            </div>
          </div>
      );
      })()}
      {confirmDelete&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-2">Supprimer ce shift ?</h3>
            <p className="text-sm text-slate-500 mb-4">Cette action est irreversible.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 border border-slate-200 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
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
  const [filterDriver, setFilterDriver] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const emptyForm = {ch:"",montant:0,canal:"Wave Business",date:new Date().toISOString().split("T")[0],status:"En attente",ecart:0,depensesAutorisees:0,preuve:"",commentaire:""};
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({...emptyForm,
      ch:r.ch||"", montant:r.montant||0, canal:r.canal||"Wave Business",
      date:r.date||"", status:r.status||"En attente", ecart:r.ecart||0,
      depensesAutorisees:r.authorized_expenses||r.depensesAutorisees||0,
      preuve:r.transaction_proof_url||r.preuve||"",
      commentaire:r.commentaire||""
    });
    setEditItem(r);
    setShowModal(true);
  };

  // Calcul ecart automatique - tolerance 1% frais Wave
  const calcEcart = (montantVerse, montantDeclare, depenses, canal) => {
    const tolerance = canal==="Wave Business" ? montantDeclare * 0.01 : 0;
    const montantAttendu = montantDeclare - depenses;
    const ecart = montantAttendu - montantVerse - tolerance;
    return Math.max(0, Math.round(ecart));
  };

  const handleSave = async () => {
    if(!form.ch||!form.montant) return alert("Chauffeur et montant requis");
    const ecartAuto = calcEcart(form.montant, form.montant, form.depensesAutorisees||0, form.canal);
    const statusAuto = ecartAuto > 0 ? "Ecart detecte" : form.status;
    const payload = {
      ch:form.ch, driver_id:form.ch,
      montant:form.montant, amount_sent:form.montant, amount_requested:form.montant,
      canal:form.canal, date:form.date,
      status:statusAuto, ecart:ecartAuto||form.ecart||0,
      authorized_expenses:form.depensesAutorisees||0,
      transaction_proof_url:form.preuve||null,
      commentaire:form.commentaire||null,
    };
    if(editItem){await onUpdate(editItem.id, payload);}
    else{await onAdd({...payload, id:"RV-"+Date.now()});}
    setShowModal(false);
  };

  const filtered = reversements
    .filter(r=>filterDriver==="all"||r.ch===filterDriver)
    .filter(r=>filterStatus==="all"||r.status===filterStatus);

  const total = filtered.reduce((a,r)=>a+(r.montant||0),0);
  const totalEcart = filtered.reduce((a,r)=>a+(r.ecart||0),0);
  const nbEcarts = filtered.filter(r=>(r.ecart||0)>0).length;
  const nbEnAttente = filtered.filter(r=>r.status==="En attente").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recettes et Reversements</h1>
          <p className="text-xs text-slate-500 mt-0.5">Suivi quotidien des versements Wave / Orange Money</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Ajouter reversement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total reverse" value={fmtK(total)+" F"} color="text-emerald-600"/>
        <StatCard label="En attente" value={nbEnAttente.toString()} color="text-amber-600"/>
        <StatCard label="Ecarts detectes" value={nbEcarts.toString()} color="text-red-600"/>
        <StatCard label="Total ecarts" value={fmtK(totalEcart)+" F"} color="text-red-600"/>
      </div>

      {/* Alerte ecarts */}
      {nbEcarts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <div>
            <div className="font-semibold text-red-800 text-sm">{nbEcarts} ecart(s) detecte(s)</div>
            <div className="text-xs text-red-700 mt-0.5">Total des ecarts : {fmt(totalEcart)} — Verifier les reversements en rouge</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterDriver} onChange={e=>setFilterDriver(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="all">Tous les chauffeurs</option>
          {drivers.map(d=><option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="all">Tous les statuts</option>
          <option value="En attente">En attente</option>
          <option value="Validé">Valides</option>
          <option value="Ecart detecte">Ecarts detectes</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Montant verse</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Canal</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Depenses aut.</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Preuve</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ecart</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={9} className="text-center py-8 text-slate-400 text-sm">Aucun reversement</td></tr>}
            {filtered.map(r=>{
              const driver=drivers.find(d=>d.id===r.ch);
              const hasEcart = (r.ecart||0)>0;
              const depenses = r.authorized_expenses||r.depensesAutorisees||0;
              return (
                <tr key={r.id} className={"border-b border-slate-100 hover:bg-slate-50"+(hasEcart?" bg-red-50/30":"")}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-slate-800">{driver?driver.prenom+" "+driver.nom:"—"}</div>
                    <div className="text-xs text-slate-400">{driver?.matricule||""}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{fmt(r.montant||0)}</td>
                  <td className="px-4 py-3"><Badge color="bg-blue-100 text-blue-700">{r.canal||"—"}</Badge></td>
                  <td className="px-4 py-3 text-sm text-amber-600">{depenses>0?fmt(depenses):"—"}</td>
                  <td className="px-4 py-3">
                    {(r.transaction_proof_url||r.preuve)?
                      <a href={r.transaction_proof_url||r.preuve} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                        Voir preuve
                      </a>:
                      <span className="text-xs text-slate-400">Pas de preuve</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.date||"—"}</td>
                  <td className="px-4 py-3">
                    {hasEcart?
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        -{fmt(r.ecart||0)}
                      </span>:
                      <span className="text-xs text-emerald-500 font-medium">OK</span>
                    }
                  </td>
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

      {/* MODAL */}
      {showModal&&(
        <Modal title={editItem?"Modifier reversement":"Ajouter reversement"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-2">
            L ecart est calcule automatiquement. Tolerance de 1% pour les frais Wave Business.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Select label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"-- Choisir --"},...drivers.map(d=>({value:d.id,label:d.prenom+" "+d.nom+" ("+(d.matricule||d.id)+")"}))]}/> 
            </div>
            <Input label="Montant verse (F CFA)" value={form.montant} onChange={v=>setForm({...form,montant:parseInt(v)||0})} type="number" required/>
            <Select label="Canal" value={form.canal} onChange={v=>setForm({...form,canal:v})} options={["Wave Business","Orange Money Business","MTN Mobile Money","Moov Money","Cash"]}/>
            <Input label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/>
            <Input label="Depenses autorisees (F CFA)" value={form.depensesAutorisees||0} onChange={v=>setForm({...form,depensesAutorisees:parseInt(v)||0})} type="number"/>
            <div className="col-span-2">
              <Input label="URL preuve de paiement (screenshot Wave / Orange Money)" value={form.preuve||""} onChange={v=>setForm({...form,preuve:v})} placeholder="https://..."/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire</label>
              <textarea value={form.commentaire||""} onChange={e=>setForm({...form,commentaire:e.target.value})} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Remarques eventuelles..."/>
            </div>
          </div>
          {form.montant>0&&(
            <div className="bg-slate-50 rounded-lg p-3 mt-2 text-xs text-slate-600">
              Ecart calcule automatiquement : {fmt(calcEcart(form.montant,form.montant,form.depensesAutorisees||0,form.canal))} 
              {form.canal==="Wave Business"&&<span className="text-slate-400"> (tolerance 1% frais Wave deduite)</span>}
            </div>
          )}
        </Modal>
      )}
      {confirmDelete&&<Confirm msg={"Supprimer le reversement de "+(drivers.find(d=>d.id===confirmDelete.ch)?.prenom||"ce chauffeur")+" ?"} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
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
      const rev = s.revenue_cash||s.revenusGeneres||s.recette||0;
      const commission = s.yango_commission||s.commissionYango||0;
      return a + (rev - commission);
    },(0));

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
    const shiftsDriver = shiftsFiltres.filter(s=>(s.status==="Terminé"||s.status==="Termine")&&s.ch===d.id);
    const joursTravailes = shiftsDriver.length;
    const salaireBase = joursTravailes * FIXE_JOURNALIER;
    const totalRecettesNettes = shiftsDriver.reduce((a,s)=>{
      const rev = s.revenue_cash||s.revenusGeneres||s.recette||0;
      const commission = s.yango_commission||s.commissionYango||0;
      return a + (rev - commission);
    },0);
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
      .map(s => [
        s.planned_start_date||s.date||"",
        s.ch||"",
        1,
        8,
        s.revenue_cash||s.recette||0,
        s.courses_count||s.nbCourses||0,
        s.authorized_expenses||0,
        0,
        ""
      ]);
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
        <h1 className="text-2xl font-bold text-slate-900">KPI, Paie et Incentives</h1>
        <button onClick={exportExcelTD01} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Exporter Excel (TD01)
        </button>
      </div>

      {/* Filtre periode */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="font-semibold text-slate-700 text-sm">Periode de calcul :</div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Du</label>
          <input type="date" value={periodeDebut} onChange={e=>setPeriodeDebut(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Au</label>
          <input type="date" value={periodeFin} onChange={e=>setPeriodeFin(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        {(periodeDebut||periodeFin)&&<button onClick={()=>{setPeriodeDebut("");setPeriodeFin("");}} className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-lg">Effacer</button>}
        <div className="ml-auto text-xs text-slate-400">{paies.length} chauffeur(s) actifs · {shiftsFiltres.filter(s=>s.status==="Terminé"||s.status==="Termine").length} shifts termines</div>
      </div>

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
    const payload = {
      vh:form.vh, ch:form.ch||null,
      partenaire:form.partenaire||form.typeCharge||"Domestique",
      kwh:form.kWh||0, cout:form.cout||0,
      lieu:form.lieu||null, duree:form.duree||0,
      soc_av:form.socAv||0, soc_ap:form.socAp||0,
      date:form.date||new Date().toISOString().split("T")[0],
    };
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
    const payload = {
      vh:form.vh, type:form.type||"Preventive",
      description:form.desc||null, status:form.status||"Planifiee",
      date:form.dateDebut||form.date||new Date().toISOString().split("T")[0],
      cout:form.cout||0, garage:form.garage||null,
    };
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
  const [newUser, setNewUser] = useState({name:"",email:"",role:"ops"});
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({current:"",next:"",confirm:""});
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);

  useEffect(() => { getUsers().then(setUsers); }, []);

  const handleAddUser = async () => {
    setUserError(""); setUserSuccess("");
    if(!newUser.name||!newUser.email) return setUserError("Nom et email requis");
    if(!newUser.email.includes("@")) return setUserError("Email invalide");
    if(users.find(u=>u.email===newUser.email)) return setUserError("Email deja utilise");
    const result = await inviteUser(newUser.email, newUser.name, newUser.role);
    if(result.error) return setUserError("Erreur: "+result.error.message);
    const lien = window.location.origin+"?token="+result.token;
    setInviteInfo({ name:newUser.name, email:newUser.email, lien, token:result.token });
    getUsers().then(setUsers);
    setShowAddUser(false);
    setNewUser({name:"",email:"",role:"ops"});
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

  const roleColor = (r) => ({"admin":"bg-red-100 text-red-700","ops":"bg-blue-100 text-blue-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700","dispatcher":"bg-amber-100 text-amber-700"}[r]||"bg-slate-100 text-slate-600");
  const roleLabel = (r) => ({"admin":"Administrateur","ops":"Ops Manager","finance":"Finance","supervisor":"Superviseur Logistique","dispatcher":"Dispatcher"}[r]||r);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Gestion des comptes</h1>

      {/* Alerte lien invitation */}
      {inviteInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-emerald-800 mb-1">Compte cree pour {inviteInfo.name}</div>
              <div className="text-sm text-emerald-700 mb-3">Envoyez ce lien a {inviteInfo.email} pour qu il definisse son mot de passe :</div>
              <div className="bg-white border border-emerald-200 rounded-lg px-4 py-2 font-mono text-sm text-slate-700 break-all">{inviteInfo.lien}</div>
              <div className="text-xs text-emerald-600 mt-2">Token : {inviteInfo.token}</div>
            </div>
            <button onClick={()=>setInviteInfo(null)} className="text-emerald-400 hover:text-emerald-600 ml-4 text-xl font-bold">x</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-900">Utilisateurs ({users.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Seul l administrateur peut creer et modifier les comptes</p>
          </div>
          {currentUser?.role==="admin"&&(
            <button onClick={()=>{setShowAddUser(true);setUserError("");setUserSuccess("");}} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              + Creer un compte
            </button>
          )}
        </div>
        <div className="space-y-3">
          {users.map(u=>(
            <div key={u.id} className={"flex items-center justify-between p-4 rounded-xl border "+(u.invite_pending?"bg-amber-50 border-amber-200":"bg-slate-50 border-slate-100")}>
              <div className="flex items-center gap-3">
                <div className={"w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm "+(u.invite_pending?"bg-amber-400":"bg-gradient-to-br from-blue-500 to-violet-500")}>
                  {(u.name||"?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-800">
                    {u.name}
                    {u.id===currentUser?.id&&<span className="text-xs text-blue-500 ml-2">(vous)</span>}
                    {u.invite_pending&&<span className="text-xs text-amber-600 ml-2">— invitation en attente</span>}
                  </div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {u.id===currentUser?.id&&(
                  <button onClick={()=>{setShowChangePwd(true);setPwdForm({current:"",next:"",confirm:""});setPwdError("");setPwdSuccess("");}} className="text-blue-600 text-xs border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                    Modifier mot de passe
                  </button>
                )}
                {currentUser?.role==="admin"&&u.id!==currentUser?.id?(
                  <select value={u.role} onChange={e=>handleRoleChange(u.id,e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="admin">Administrateur</option>
                    <option value="ops">Ops Manager</option>
                    <option value="finance">Finance</option>
                    <option value="supervisor">Superviseur</option>
                    <option value="dispatcher">Dispatcher</option>
                  </select>
                ):(
                  <Badge color={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                )}
                {currentUser?.role==="admin"&&u.id!==currentUser?.id&&(
                  <button onClick={()=>setConfirmDelete(u)} className="text-red-500 text-xs border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CREER COMPTE */}
      {showAddUser&&(
        <Modal title="Creer un nouveau compte" onClose={()=>setShowAddUser(false)}
          footer={<><button onClick={()=>setShowAddUser(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleAddUser} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Envoyer invitation</button></>}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-2">
            Un lien sera genere pour que l utilisateur definisse son propre mot de passe.
          </div>
          {userError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{userError}</div>}
          <Input label="Nom complet" value={newUser.name} onChange={v=>setNewUser({...newUser,name:v})} required/>
          <Input label="Email" value={newUser.email} onChange={v=>setNewUser({...newUser,email:v})} type="email" required/>
          <Select label="Role" value={newUser.role} onChange={v=>setNewUser({...newUser,role:v})} options={[
            {value:"ops",label:"Ops Manager"},
            {value:"supervisor",label:"Superviseur Logistique"},
            {value:"finance",label:"Finance"},
            {value:"dispatcher",label:"Dispatcher"},
            {value:"admin",label:"Administrateur"},
          ]}/>
        </Modal>
      )}

      {/* MODAL CHANGER MOT DE PASSE */}
      {showChangePwd&&(
        <Modal title="Modifier mon mot de passe" onClose={()=>{setShowChangePwd(false);setPwdError("");setPwdSuccess("");}}>
          {pwdError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{pwdError}</div>}
          {pwdSuccess&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-3 py-2 rounded-lg">{pwdSuccess}</div>}
          <Input label="Mot de passe actuel" value={pwdForm.current} onChange={v=>setPwdForm({...pwdForm,current:v})} type="password"/>
          <Input label="Nouveau mot de passe" value={pwdForm.next} onChange={v=>setPwdForm({...pwdForm,next:v})} type="password"/>
          <Input label="Confirmer le nouveau mot de passe" value={pwdForm.confirm} onChange={v=>setPwdForm({...pwdForm,confirm:v})} type="password"/>
          <button onClick={handleChangePwd} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">Modifier le mot de passe</button>
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

  const buildVehiclePayload = (item) => ({
    immat:item.immat||null, marque:item.marque||null, modele:item.modele||null,
    site:item.site||1, autonomie:item.autonomie||0, km:item.km||0, soc:item.soc||0,
    status:item.status||"En exploitation", typecontrat:item.typeContrat||"Interne SAVER",
    vin_number:item.vin||null, battery_capacity_kwh:item.capaciteBatterie||null,
    vehicle_year:item.annee||null, vehicle_color:item.couleur||null,
    service_type:item.typeService||"VTC", service_class:item.classesService||[],
    technical_visit_expiry:item.visiteDate||null, insurance_expiry:item.assuranceFin||null,
    assurancenum:item.assuranceNum||null, assurancedebut:item.assuranceDebut||null,
    assurancefin:item.assuranceFin||null,
    cartegrisenum:item.carteGriseNum||null, cartegrisedate:item.carteGriseDate||null,
    cartegriseproprietaire:item.carteGriseProprietaire||null, numerochassis:item.numeroChassis||null,
  });
  const addVehicle = async (item) => await vh.add({...buildVehiclePayload(item), id:"VH-"+Date.now()});
  const updateVehicle = async (id, item) => await vh.update(id, buildVehiclePayload(item));

  const buildDriverPayload = (item) => ({
    nom:item.nom||null, prenom:item.prenom||null,
    site:item.site||1, vehicule:item.vehicule||null,
    shift:item.shift||"A", status:item.status||"Actif",
    kpi:item.kpi||80, courses:item.courses||0,
    ca:item.ca||0, pen:item.pen||0, avance:item.avance||0,
    driver_code:item.matricule||null,
    contract_type:item.typeContrat||"Salarie",
    yango_score:item.noteYango||4.0,
    internal_score:item.noteInterne||80,
    license_number:item.permisNum||null,
    license_expiry_date:item.permisExpiration||null,
    id_card_number:item.pieceNum||null,
    id_card_expiry_date:item.pieceExpiration||null,
    emergency_contact:(item.contactUrgence||"")+" - "+(item.contactUrgenceTel||""),
    telephone:item.telephone||null,
    telephoneperso:item.telephonePerso||null,
    adresse:item.adresse||null,
    commentaires:item.commentaires||null,
    dettes:item.dettes||0,
    dettecommentaire:item.detteCommentaire||null,
    permistype:item.permisType||null,
    permisdelivrance:item.permisDelivrance||null,
    piecetype:item.pieceType||"CNI",
    piecedelivrance:item.pieceDelivrance||null,
    contacturgencetel:item.contactUrgenceTel||null,
  });
  const addDriver = async (item) => await dr.add({...buildDriverPayload(item), id:"CH-"+Date.now()});
  const updateDriver = async (id, item) => {
    // Merge buildDriverPayload + champs directs deja mappes
    const base = buildDriverPayload(item);
    const merged = {
      ...base,
      license_number: item.license_number || item.permisNum || base.license_number || null,
      license_expiry_date: item.license_expiry_date || item.permisExpiration || base.license_expiry_date || null,
      permistype: item.permistype || item.permisType || base.permistype || null,
      permisdelivrance: item.permisdelivrance || item.permisDelivrance || base.permisdelivrance || null,
      id_card_number: item.id_card_number || item.pieceNum || base.id_card_number || null,
      id_card_expiry_date: item.id_card_expiry_date || item.pieceExpiration || base.id_card_expiry_date || null,
      piecetype: item.piecetype || item.pieceType || base.piecetype || "CNI",
      piecedelivrance: item.piecedelivrance || item.pieceDelivrance || base.piecedelivrance || null,
      telephone: item.telephone || base.telephone || null,
      telephoneperso: item.telephoneperso || item.telephonePerso || base.telephoneperso || null,
      adresse: item.adresse || base.adresse || null,
      commentaires: item.commentaires || base.commentaires || null,
      dettes: item.dettes || base.dettes || 0,
      dettecommentaire: item.dettecommentaire || item.detteCommentaire || base.dettecommentaire || null,
      contacturgencetel: item.contacturgencetel || item.contactUrgenceTel || base.contacturgencetel || null,
    };
    return await dr.update(id, merged);
  };

  const buildShiftPayload = (item) => ({
    vh:item.vh||null, ch:item.ch||null,
    type:item.type||"A", shift_type:"Shift "+(item.type||"A"),
    planned_start_date:item.date||null, debut:item.debut||"06:00", fin:item.fin||"14:00",
    status:item.status||"Planifie", recette:item.recette||0,
    check_in:item.checkIn||false, check_out:item.checkOut||false,
    real_start_time:item.heureDebutReelle||null, real_end_time:item.heureFinReelle||null,
    km_driven:item.kmParcourus||0, battery_start:item.autonomieDebut||0, battery_end:item.autonomieFin||0,
    courses_count:item.nbCourses||0, revenue_cash:item.revenusGeneres||0,
    yango_commission:item.commissionYango||0, authorized_expenses:item.depensesAutorisees||0,
    yango_rating:item.noteYangoShift||0,
  });
  const addShift = async (item) => await sh.add({...buildShiftPayload(item), id:"SH-"+Date.now()});
  const updateShift = async (id, item) => {
    const payload = {};
    if(item.status!==undefined) payload.status = item.status;
    if(item.check_in!==undefined) payload.check_in = item.check_in;
    if(item.check_out!==undefined) payload.check_out = item.check_out;
    if(item.checkIn!==undefined) payload.check_in = item.checkIn;
    if(item.checkOut!==undefined) payload.check_out = item.checkOut;
    if(item.recette!==undefined) payload.recette = item.recette;
    if(item.real_start_time!==undefined) payload.real_start_time = item.real_start_time;
    if(item.real_end_time!==undefined) payload.real_end_time = item.real_end_time;
    if(item.heureDebutReelle!==undefined) payload.real_start_time = item.heureDebutReelle||null;
    if(item.heureFinReelle!==undefined) payload.real_end_time = item.heureFinReelle||null;
    if(item.kmParcourus!==undefined) payload.km_driven = item.kmParcourus;
    if(item.autonomieDebut!==undefined) payload.battery_start = item.autonomieDebut;
    if(item.autonomieFin!==undefined) payload.battery_end = item.autonomieFin;
    if(item.nbCourses!==undefined) payload.courses_count = item.nbCourses;
    if(item.revenusGeneres!==undefined) { payload.revenue_cash = item.revenusGeneres; payload.recette = item.revenusGeneres; }
    if(item.commissionYango!==undefined) payload.yango_commission = item.commissionYango;
    if(item.depensesAutorisees!==undefined) payload.authorized_expenses = item.depensesAutorisees;
    if(item.noteYangoShift!==undefined) payload.yango_rating = item.noteYangoShift;
    if(item.commentaireShift!==undefined) payload.commentaireshift = item.commentaireShift;
    return await sh.update(id, payload);
  };

  const buildReversementPayload = (item) => ({
    ch: item.ch||null,
    driver_id: item.ch||null,
    montant: item.montant||0,
    amount_sent: item.montant||0,
    amount_requested: item.montant||0,
    canal: item.canal||"Wave Business",
    date: item.date||new Date().toISOString().split("T")[0],
    status: item.status||"En attente",
    ecart: item.ecart||0,
    authorized_expenses: item.depensesAutorisees||0,
    transaction_proof_url: item.preuve||null,
    commentaire: item.commentaire||null,
  });
  const addReversement = async (item) => await rv.add({...buildReversementPayload(item), id:"RV-"+Date.now()});
  const updateReversement = async (id, item) => await rv.update(id, buildReversementPayload(item));

  const buildRechargePayload = (item) => ({
    vh: item.vh||null,
    ch: item.ch||null,
    partenaire: item.partenaire||"Domestique",
    kwh: item.kWh||item.kwh||0,
    cout: item.cout||0,
    lieu: item.lieu||null,
    duree: item.duree||0,
    soc_av: item.socAv||item.soc_av||0,
    soc_ap: item.socAp||item.soc_ap||0,
    date: item.date||new Date().toISOString().split("T")[0],
  });
  const addRecharge = async (item) => await rc.add({...buildRechargePayload(item), id:"RC-"+Date.now()});
  const updateRecharge = async (id, item) => await rc.update(id, buildRechargePayload(item));

  const buildMaintenancePayload = (item) => ({
    vh: item.vh||null,
    type: item.type||"Entretien",
    description: item.desc||item.description||null,
    status: item.status||"Planifiee",
    date: item.dateDebut||item.date||new Date().toISOString().split("T")[0],
    cout: item.cout||0,
    garage: item.garage||null,
  });
  const addMaintenance = async (item) => await mt.add({...buildMaintenancePayload(item), id:"MT-"+Date.now()});
  const updateMaintenance = async (id, item) => await mt.update(id, buildMaintenancePayload(item));

  const handleLogin = async (u) => {
    try {
      const {data} = await supabase.from("users").select("*").eq("id",u.id).single();
      setUser(data||u);
    } catch {
      setUser(u);
    }
  };

  // Verifier si c est un lien d invitation
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get("token");
  if (inviteToken) return <SetPasswordPage token={inviteToken} onDone={()=>window.location.href=window.location.pathname}/>;

  if (!user) return <LoginPage onLogin={handleLogin}/>;

  const pages = {
    dashboard: <DashboardPage vehicles={vh.data} drivers={dr.data} shifts={sh.data} reversements={rv.data} user={user}/>,
    vehicules: <VehiculesPage vehicles={vh.data} onAdd={addVehicle} onUpdate={updateVehicle} onDelete={vh.remove} sites={si.data}/>,
    chauffeurs: <ChauffeursPage drivers={dr.data} vehicles={vh.data} onAdd={addDriver} onUpdate={updateDriver} onDelete={dr.remove} sites={si.data}/>,
    planning: <PlanningPage shifts={sh.data} vehicles={vh.data} drivers={dr.data} onAdd={addShift} onUpdate={updateShift} onDelete={sh.remove} sites={si.data}/>,
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
          {sideOpen&&<div><div className="font-bold text-sm">Easy by Saver</div><div className="text-xs text-slate-400">Gestion de flotte VTC</div></div>}
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
          <div className="text-sm font-semibold text-slate-700 lg:hidden">{ALL_NAV.find(n=>n.id===page)?.label}</div>
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
