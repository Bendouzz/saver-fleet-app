import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// Injection CSS globale pour le mode sombre
const darkModeCSS = `
  .dark-mode * {
    --tw-bg-opacity: 1;
  }
  .dark-mode .bg-white {
    background-color: #1e293b !important;
  }
  .dark-mode .bg-slate-50 {
    background-color: #0f172a !important;
  }
  .dark-mode .bg-slate-100 {
    background-color: #0f172a !important;
  }
  .dark-mode .border-slate-200 {
    border-color: #334155 !important;
  }
  .dark-mode .border-slate-100 {
    border-color: #1e293b !important;
  }
  .dark-mode .text-slate-900 {
    color: #f1f5f9 !important;
  }
  .dark-mode .text-slate-800 {
    color: #e2e8f0 !important;
  }
  .dark-mode .text-slate-700 {
    color: #cbd5e1 !important;
  }
  .dark-mode .text-slate-600 {
    color: #94a3b8 !important;
  }
  .dark-mode .text-slate-500 {
    color: #64748b !important;
  }
  .dark-mode .text-slate-400 {
    color: #475569 !important;
  }
  .dark-mode .hover\:bg-slate-50:hover {
    background-color: #1e293b !important;
  }
  .dark-mode .hover\:bg-blue-50:hover {
    background-color: #1e3a5f !important;
  }
  .dark-mode input, .dark-mode select, .dark-mode textarea {
    background-color: #334155 !important;
    color: #f1f5f9 !important;
    border-color: #475569 !important;
  }
  .dark-mode input::placeholder {
    color: #64748b !important;
  }
  .dark-mode .bg-slate-900 {
    background-color: #020617 !important;
  }
  .dark-mode .border-slate-700 {
    border-color: #334155 !important;
  }
`;

// Injecter le CSS
if(typeof document !== "undefined") {
  const style = document.createElement("style");
  style.id = "dark-mode-styles";
  style.textContent = darkModeCSS;
  if(!document.getElementById("dark-mode-styles")) {
    document.head.appendChild(style);
  }
}

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
  // Photos
  photosExt: Array.isArray(r.photos_ext) ? r.photos_ext : (r.photos_ext ? JSON.parse(r.photos_ext) : []),
  photosInt: Array.isArray(r.photos_int) ? r.photos_int : (r.photos_int ? JSON.parse(r.photos_int) : []),
  photoCarteGrise: r.photo_carte_grise || null,
  photoVisite: r.photo_visite || null,
  photoAssurance: r.photo_assurance || null,
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
  // Contact urgence - split depuis emergency_contact "num1 - num2"
  contactUrgence: (r.emergency_contact && r.emergency_contact.includes(" - "))
    ? r.emergency_contact.split(" - ")[0].trim()
    : (r.emergency_contact || r.contactUrgence || ""),
  contactUrgenceTel: r.contacturgencetel || r.emergency_phone
    || ((r.emergency_contact && r.emergency_contact.includes(" - "))
      ? r.emergency_contact.split(" - ")[1].trim()
      : "") || "",
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
  photoFace: r.photo_face || null,
  photosProfil: Array.isArray(r.photos_profil) ? r.photos_profil : (r.photos_profil ? JSON.parse(r.photos_profil) : []),
  photoPleinPied: r.photo_plein_pied || null,
  photoPermis: r.photo_permis || null,
  photoPiece: r.photo_piece || null,
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
    "En cours":"bg-emerald-100 text-emerald-700","Planifie":"bg-slate-100 text-slate-600 dark:text-slate-400",
    "Planifié":"bg-slate-100 text-slate-600 dark:text-slate-400","Terminé":"bg-slate-100 text-slate-500 dark:text-slate-400",
    "Termine":"bg-slate-100 text-slate-500 dark:text-slate-400","Suspendu":"bg-red-100 text-red-700",
    "Inactif":"bg-slate-100 text-slate-400","En recharge":"bg-amber-100 text-amber-700",
    "Maintenance":"bg-orange-100 text-orange-700","Immobilisé":"bg-red-100 text-red-700",
    "Immobilise":"bg-red-100 text-red-700","Validé":"bg-emerald-100 text-emerald-700",
    "En attente":"bg-amber-100 text-amber-700","Écart détecté":"bg-red-100 text-red-700",
    "Ecart detecte":"bg-red-100 text-red-700","Planifiée":"bg-emerald-100 text-emerald-700",
    "Terminée":"bg-slate-100 text-slate-500 dark:text-slate-400",
  };
  return map[s] || "bg-slate-100 text-slate-600 dark:text-slate-400";
};

const SocBar = ({soc}) => {
  const col = soc > 70 ? "bg-emerald-500" : soc > 40 ? "bg-amber-500" : "bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={"h-full "+col+" rounded-full"} style={{width:soc+"%"}}/></div><span className="text-xs font-medium text-slate-600 dark:text-slate-400">{soc}%</span></div>;
};

const KpiBar = ({value}) => {
  const col = value>=80?"bg-emerald-500":value>=60?"bg-amber-500":"bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={"h-full "+col+" rounded-full"} style={{width:value+"%"}}/></div><span className="text-xs text-slate-600 dark:text-slate-400">{value}%</span></div>;
};

const StatCard = ({label, value, sub, color="text-slate-900 dark:text-white", icon}) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
      {icon && <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-white "+icon.bg}>{icon.el}</div>}
    </div>
    <div className={"text-2xl font-bold "+color}>{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
  </div>
);

const Modal = ({title, onClose, children, footer}) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto my-4">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 text-xl font-bold">x</button>
      </div>
      <div className="p-6 space-y-4">{children}</div>
      {footer && <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 bg-white">{footer}</div>}
    </div>
  </div>
);

const Confirm = ({msg, onConfirm, onCancel}) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">{msg}</h3>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-slate-200 dark:border-slate-700 py-2 rounded-lg text-sm">Annuler</button>
        <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Confirmer</button>
      </div>
    </div>
  </div>
);

const Input = ({label, value, onChange, type="text", placeholder="", required=false, hint=""}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}{required&&<span className="text-red-500 ml-1">*</span>}{hint&&<span className="text-xs text-slate-400 ml-1">{hint}</span>}</label>
    <input type={type} value={value||""} onChange={e=>onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value)} placeholder={placeholder} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"/>
  </div>
);

const Select = ({label, value, onChange, options}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <select value={value||""} onChange={e=>onChange(e.target.value)} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
      {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const NavIcon = ({d, className}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d}/></svg>;


// ============================================================
// PHOTO UPLOAD COMPONENT
// ============================================================
const uploadToSupabase = async (file, bucket, folder) => {
  const ext = file.name.split(".").pop().toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2,8)}.${ext}`;
  const path = folder ? `${folder}/${fileName}` : fileName;
  
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    }
  );
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errText}`);
  }
  
  // Construire l URL publique directement
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  console.log("Photo uploadee:", publicUrl);
  return publicUrl;
};

const PhotoUpload = ({ label, bucket, folder, value, onChange, multiple = false, hint = "" }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localUrls, setLocalUrls] = useState(
    value ? (Array.isArray(value) ? value : [value]).filter(Boolean) : []
  );
  const urls = localUrls;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for(const file of files) {
        const url = await uploadToSupabase(file, bucket, folder);
        uploaded.push(url);
        console.log("Photo uploadee:", url);
      }
      let newUrls;
      if (multiple) {
        newUrls = [...localUrls, ...uploaded];
      } else {
        newUrls = [uploaded[0]];
      }
      setLocalUrls(newUrls);
      onChange(multiple ? newUrls : newUrls[0]);
    } catch (err) {
      console.error("Erreur upload:", err);
      setError("Erreur: " + err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeUrl = (idx) => {
    if (multiple) {
      onChange(urls.filter((_, i) => i !== idx));
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <div key={idx} className="relative group">
              <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => window.open(url, "_blank")}/>
              <button type="button" onClick={() => removeUrl(idx)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
            </div>
          ))}
        </div>
      )}
      <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? "border-blue-300 bg-blue-50" : "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}>
        <input type="file" accept="image/*" multiple={multiple} onChange={handleFiles} className="hidden" disabled={uploading}/>
        {uploading ? (
          <><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/><span className="text-sm text-blue-600">Upload en cours...</span></>
        ) : (
          <><svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span className="text-sm text-slate-500 dark:text-slate-400">{multiple ? "Cliquer pour ajouter des photos" : "Cliquer pour ajouter une photo"}</span>
          {urls.length > 0 && <span className="ml-auto text-xs text-emerald-600 font-medium">{urls.length} photo{urls.length > 1 ? "s" : ""}</span>}</>
        )}
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

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
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  const handleReset = async () => {
    if(!resetEmail) return setResetMsg({ok:false, text:"Email requis"});
    setResetLoading(true);
    const users = await getUsers();
    const found = users.find(u => u.email === resetEmail);
    if(!found) {
      setResetLoading(false);
      return setResetMsg({ok:false, text:"Aucun compte avec cet email"});
    }
    // Generer un token de reinitialisation
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from("users").update({invite_token: token, invite_pending: false}).eq("email", resetEmail);
    const lien = window.location.origin + "?token=" + token;
    setResetLoading(false);
    setResetMsg({ok:true, text:"Lien genere ! Copiez-le : " + lien});
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
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
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            {showResetForm ? (
              <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
                <p className="text-blue-200 text-sm text-center">Entrez votre email pour reinitialiser votre mot de passe</p>
                <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                {resetMsg && <div className={`text-sm px-3 py-2 rounded-lg ${resetMsg.ok ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>{resetMsg.text}</div>}
                <button onClick={handleReset} disabled={resetLoading}
                  className="w-full bg-white/20 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-all disabled:opacity-50">
                  {resetLoading ? "Envoi..." : "Envoyer le lien"}
                </button>
                <button onClick={()=>{setShowResetForm(false);setResetMsg(null);setResetEmail("");}}
                  className="w-full text-blue-300 text-sm hover:text-white transition-colors">
                  ← Retour à la connexion
                </button>
              </div>
            ) : (
              <button onClick={()=>setShowResetForm(true)} className="w-full text-blue-300 text-xs hover:text-white transition-colors text-center mt-2">
                Mot de passe oublié ?
              </button>
            )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
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
  // Top chauffeurs calcule depuis les VRAIES recettes des shifts (pas la colonne statique ca)
  const driverRevenues = drivers.map(d => {
    const driverShifts = shifts.filter(s => String(s.ch) === String(d.id));
    const ddCA = driverShifts.reduce((a,s) => a + (parseFloat(s.revenue_cash)||parseFloat(s.recette)||0), 0);
    const realCA = ddCA > 0 ? ddCA : (parseFloat(d.ca)||0);
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

  // Données graphiques - recettes 7 derniers jours
  const last7Days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const dayShifts = shifts.filter(s=>{
      const shiftDate = new Date(s.date||s.planned_start_date||"");
      return shiftDate.toDateString() === d.toDateString();
    });
    const recettes = dayShifts.reduce((a,s)=>a+(s.revenue_cash||s.recette||0),0);
    return { jour: d.toLocaleDateString("fr-FR",{weekday:"short", day:"numeric"}), recettes, shifts: dayShifts.length };
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
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
          <div className="text-2xl font-bold">{fmtK(totalRecette)} F</div>
          <div className="text-xs opacity-70 mt-1">{reversementsEnAttente} en attente · {ecarts} ecart(s)</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-5 text-white">
          <div className="text-xs font-medium opacity-80 uppercase tracking-wide mb-2">Reversements valides</div>
          <div className="text-2xl font-bold">{fmtK(totalReverse)} F</div>
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
                <Tooltip formatter={(v,name)=>name==="recettes"?[fmtK(v)+" F","Recettes"]:[v+" shift(s)","Shifts"]} contentStyle={{borderRadius:"8px",border:"1px solid #e2e8f0",fontSize:"12px"}}/>
                <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:"11px",color:"#64748b"}}>{v==="recettes"?"Recettes (F)":"Shifts"}</span>}/>
                <Bar yAxisId="left" dataKey="recettes" fill="#10B981" radius={[4,4,0,0]} minPointSize={2}/>
                <Bar yAxisId="right" dataKey="shifts" fill="#3B82F6" radius={[4,4,0,0]} minPointSize={2}/>
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
    </div>
  );
};
// ============================================================
// VEHICULES PAGE
// ============================================================
const VehiculesPage = ({vehicles, onAdd, onUpdate, onDelete, sites}) => {
  const [filter, setFilter] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // cards or table

  const emptyForm = {immat:"",marque:"",modele:"",couleur:"",annee:new Date().getFullYear(),site:1,autonomie:400,km:0,soc:100,status:"En exploitation",typeContrat:"Interne SAVER",typeService:"VTC",classesService:[],vin:"",numeroChassis:"",capaciteBatterie:0,carteGriseNum:"",carteGriseDate:"",carteGriseProprietaire:"",visiteDate:"",assuranceNum:"",assuranceDebut:"",assuranceFin:"",binome:[]};
  const [form, setForm] = useState(emptyForm);
  const photoRefs = useRef({});

  const updatePhoto = (key, value) => {
    photoRefs.current[key] = value;
    console.log("updatePhoto:", key, value);
    setForm(f => ({...f, [key]: value}));
  };

  const sitesList = sites.length > 0 ? sites : [{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];
  const filtered = vehicles
    .filter(v=>filter==="all"||String(v.site)===filter)
    .filter(v=>filterType==="all"||v.typeService===filterType)
    .filter(v=>filterStatus==="all"||v.status===filterStatus);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); photoRefs.current = {}; };
  const openEdit = (v) => { 
    setForm({
      ...emptyForm, ...v,
      photoCarteGrise: v.photo_carte_grise || v.photoCarteGrise || null,
      photoVisite: v.photo_visite || v.photoVisite || null,
      photoAssurance: v.photo_assurance || v.photoAssurance || null,
      photosExt: v.photos_ext || v.photosExt || [],
      photosInt: v.photos_int || v.photosInt || [],
      typeContrat: v.typecontrat || v.typeContrat || "Interne SAVER",
      typeService: v.service_type || v.typeService || "VTC",
      classesService: v.service_class || v.classesService || [],
      capaciteBatterie: v.battery_capacity_kwh || v.capaciteBatterie || 0,
      vin: v.vin_number || v.vin || "",
      numeroChassis: v.numerochassis || v.numeroChassis || "",
      carteGriseNum: v.cartegrisenum || v.carteGriseNum || "",
      carteGriseDate: v.cartegrisedate || v.carteGriseDate || "",
      carteGriseProprietaire: v.cartegriseproprietaire || v.carteGriseProprietaire || "",
      assuranceNum: v.assurancenum || v.assuranceNum || "",
      assuranceDebut: v.assurancedebut || v.assuranceDebut || "",
      assuranceFin: v.assurancefin || v.assuranceFin || "",
      visiteDate: v.technical_visit_expiry || v.visiteDate || "",
      couleur: v.vehicle_color || v.couleur || "",
      annee: v.vehicle_year || v.annee || new Date().getFullYear(),
    }); 
    setEditItem(v); 
    setShowModal(true); 
  };

  const getAlerts = (v) => {
    const alerts = [];
    if (v.assuranceFin) { const diff=Math.floor((new Date(v.assuranceFin)-new Date())/(86400000)); if(diff<=7) alerts.push({label:"Assurance J-"+diff,color:"text-red-600 bg-red-50"}); }
    if (v.visiteDate) { const diff=Math.floor((new Date(v.visiteDate)-new Date())/(86400000)); if(diff<=15) alerts.push({label:"Visite tech. J-"+diff,color:"text-amber-600 bg-amber-50"}); }
    return alerts;
  };

  const handleSave = async () => {
    if (!form.immat) return;
    // Fusionner form + photoRefs pour ne pas perdre les URLs
    const photos = photoRefs.current;
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
      photo_carte_grise: photos.photoCarteGrise || form.photoCarteGrise || null,
      photo_visite: photos.photoVisite || form.photoVisite || null,
      photo_assurance: photos.photoAssurance || form.photoAssurance || null,
      photos_ext: photos.photosExt || form.photosExt || [],
      photos_int: photos.photosInt || form.photosInt || [],
    };
    console.log("Payload photos:", payload.photo_carte_grise, payload.photos_ext);
    if (editItem) { await onUpdate(editItem.id, payload); }
    else { await onAdd({...payload, id:"VH-"+Date.now()}); }
    setShowModal(false);
  };

  const totalAlerts = vehicles.reduce((a,v)=>a+getAlerts(v).length,0);

  const statusColors = {
    "En exploitation": "from-emerald-500 to-emerald-600",
    "En recharge": "from-amber-500 to-amber-600",
    "Maintenance": "from-orange-500 to-orange-600",
    "Immobilise": "from-red-500 to-red-600",
    "Immobilisé": "from-red-500 to-red-600",
  };

  if (detail) {
    const v = vehicles.find(x=>x.id===detail);
    if (!v) { setDetail(null); return null; }
    const alerts = getAlerts(v);
    const siteName = sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site;
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>

        {alerts.map((a,i)=>(
          <div key={i} className={"flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border "+a.color}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            {a.label}
          </div>
        ))}

        {/* Hero card */}
        <div className={`bg-gradient-to-br ${statusColors[v.status]||"from-blue-500 to-blue-600"} rounded-2xl p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-bold mb-1">{v.immat}</div>
              <div className="text-white/80 text-lg">{v.marque} {v.modele} {v.annee&&"· "+v.annee}</div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{v.couleur||"—"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{v.typeContrat||"Interne"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{v.typeService||"VTC"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{siteName}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={()=>{openEdit(v);setDetail(null);}} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
                Modifier
              </button>
              <div className="text-right">
                <div className="text-white/60 text-xs">SOC</div>
                <div className="text-2xl font-bold">{v.soc||0}%</div>
              </div>
            </div>
          </div>
          {/* SOC bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all" style={{width:(v.soc||0)+"%"}}/>
          </div>
          <div className="flex justify-between text-white/60 text-xs mt-1">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {label:"Kilometrage", value:(v.km||0).toLocaleString()+" km", icon:"🛣️"},
            {label:"Autonomie", value:(v.autonomie||0)+" km", icon:"⚡"},
            {label:"Batterie", value:(v.capaciteBatterie||"—")+" kWh", icon:"🔋"},
          ].map(s=>(
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-slate-800 text-sm">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-xs">📋</span>
              Carte grise
            </h3>
            {[["N° CG",v.carteGriseNum],["Date immat.",v.carteGriseDate],["Proprietaire",v.carteGriseProprietaire],["Num. Chassis",v.vin||v.numeroChassis]].map(([l,val])=>(
              <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-medium text-slate-700">{val||"—"}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center text-xs">🛡️</span>
              Assurance & Visite
            </h3>
            {[["N° Assurance",v.assuranceNum],["Debut",v.assuranceDebut],["Fin assurance",v.assuranceFin],["Visite technique",v.visiteDate]].map(([l,val])=>(
              <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className={"text-xs font-medium "+((l==="Fin assurance"||l==="Visite technique")&&val&&new Date(val)<new Date(Date.now()+15*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Classes de service */}
        {(v.classesService||[]).length>0&&(
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Classes de service</h3>
            <div className="flex flex-wrap gap-2">
              {(v.classesService||[]).map(c=><span key={c} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">{c}</span>)}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicules</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} vehicule(s) 
            {totalAlerts>0&&<span className="ml-2 text-red-500">· {totalAlerts} alerte(s)</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={()=>setViewMode("cards")} className={"px-3 py-1.5 rounded-md text-xs font-medium transition-all "+(viewMode==="cards"?"bg-white shadow text-slate-700":"text-slate-400")}>
              Cartes
            </button>
            <button onClick={()=>setViewMode("table")} className={"px-3 py-1.5 rounded-md text-xs font-medium transition-all "+(viewMode==="table"?"bg-white shadow text-slate-700":"text-slate-400")}>
              Tableau
            </button>
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous les sites</option>
            {sitesList.map(s=><option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous statuts</option>
            <option value="En exploitation">En exploitation</option>
            <option value="En recharge">En recharge</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Immobilise">Immobilise</option>
          </select>
          <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"En exploitation", count:vehicles.filter(v=>v.status==="En exploitation").length, color:"bg-emerald-500", bg:"bg-emerald-50 border-emerald-200"},
          {label:"En recharge", count:vehicles.filter(v=>v.status==="En recharge").length, color:"bg-amber-500", bg:"bg-amber-50 border-amber-200"},
          {label:"Maintenance", count:vehicles.filter(v=>v.status==="Maintenance").length, color:"bg-orange-500", bg:"bg-orange-50 border-orange-200"},
          {label:"Immobilises", count:vehicles.filter(v=>v.status==="Immobilise"||v.status==="Immobilisé").length, color:"bg-red-500", bg:"bg-red-50 border-red-200"},
        ].map(s=>(
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg} cursor-pointer`} onClick={()=>setFilterStatus(s.label==="Immobilises"?"Immobilise":s.label)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">{s.label}</span>
              <div className={`w-2 h-2 rounded-full ${s.color}`}/>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{s.count}</div>
          </div>
        ))}
      </div>

      {/* Vue cartes */}
      {viewMode==="cards"&&(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length===0&&(
            <div className="col-span-3 text-center py-12 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Aucun vehicule
            </div>
          )}
          {filtered.map(v=>{
            const alerts = getAlerts(v);
            const gradient = statusColors[v.status]||"from-blue-500 to-blue-600";
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                {/* Card header */}
                <div className={`bg-gradient-to-r ${gradient} p-4 text-white`} onClick={()=>setDetail(v.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-lg">{v.immat}</div>
                      <div className="text-white/80 text-sm">{v.marque} {v.modele} {v.annee&&"· "+v.annee}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-xs">SOC</div>
                      <div className="text-xl font-bold">{v.soc||0}%</div>
                    </div>
                  </div>
                  {/* SOC bar */}
                  <div className="mt-3 bg-white/20 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{width:(v.soc||0)+"%"}}/>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4" onClick={()=>setDetail(v.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge color={sc(v.status)}>{v.status}</Badge>
                    <span className="text-xs text-slate-400">{sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400">Kilometrage</div>
                      <div className="font-semibold text-slate-700">{(v.km||0).toLocaleString()} km</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400">Autonomie</div>
                      <div className="font-semibold text-slate-700">{v.autonomie||0} km</div>
                    </div>
                  </div>
                  {alerts.length>0&&(
                    <div className="mt-3 space-y-1">
                      {alerts.map((a,i)=><div key={i} className={"text-xs px-2 py-1 rounded-lg font-medium "+a.color}>{a.label}</div>)}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-4 pb-4 flex gap-2">
                  <button onClick={()=>openEdit(v)} className="flex-1 text-xs border border-blue-200 text-blue-600 py-2 rounded-lg hover:bg-blue-50 font-medium transition-all">Modifier</button>
                  <button onClick={()=>setConfirmDelete(v)} className="text-xs border border-red-200 text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vue tableau */}
      {viewMode==="table"&&(
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicule</th>
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
                      <div className="text-xs text-slate-400">{v.marque} {v.modele}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site}</td>
                    <td className="px-4 py-3"><SocBar soc={v.soc||0}/></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{(v.km||0).toLocaleString()}</td>
                    <td className="px-4 py-3">{alerts.length>0?<div className="space-y-1">{alerts.map((a,i)=><div key={i} className={"text-xs px-2 py-0.5 rounded-full font-medium "+a.color}>{a.label}</div>)}</div>:<span className="text-xs text-emerald-500">OK</span>}</td>
                    <td className="px-4 py-3"><Badge color={sc(v.status)}>{v.status}</Badge></td>
                    <td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>openEdit(v)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button><button onClick={()=>setConfirmDelete(v)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Suppr.</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ajout/modification */}
      {showModal && (
        <Modal title={editItem?"Modifier le vehicule":"Ajouter un vehicule"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
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
                <div className="col-span-2">
                </div>
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSite, setFilterSite] = useState("all");

  const sitesList = sites.length>0?sites:[{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];
  const filtered = drivers
    .filter(d=>!search||`${d.prenom} ${d.nom}`.toLowerCase().includes(search.toLowerCase()))
    .filter(d=>filterStatus==="all"||d.status===filterStatus)
    .filter(d=>filterSite==="all"||String(d.site)===filterSite);

  const genMatricule = (prenom, nom) => {
    const base=((nom||"X")[0]+(prenom||"X")[0]).toUpperCase();
    const count=drivers.filter(d=>(d.matricule||d.driver_code||"").startsWith(base)).length+1;
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
      noteYango: parseFloat(d.yango_score || d.noteYango || 4.0),
      noteInterne: parseInt(d.internal_score || d.noteInterne || 80),
      matricule: d.matricule || d.driver_code || "",
      telephone: d.telephone || "",
      telephonePerso: d.telephonePerso || d.telephoneperso || "",
      contactUrgence: d.contactUrgence || 
        ((d.emergency_contact && d.emergency_contact.includes(" - "))
          ? d.emergency_contact.split(" - ")[0].trim()
          : d.emergency_contact || ""),
      contactUrgenceTel: d.contactUrgenceTel || d.contacturgencetel ||
        ((d.emergency_contact && d.emergency_contact.includes(" - "))
          ? d.emergency_contact.split(" - ")[1].trim()
          : "") || "",
    }); 
    setEditItem(d); setShowModal(true); setActiveTab("profil"); 
  };

  const getDriverAlerts = (d) => {
    const alerts=[];
    if(d.permisExpiration||d.license_expiry_date){const exp=d.permisExpiration||d.license_expiry_date;const diff=Math.floor((new Date(exp)-new Date())/86400000);if(diff<=30)alerts.push("Permis expire dans "+diff+"j");}
    if(d.pieceExpiration||d.id_card_expiry_date){const exp=d.pieceExpiration||d.id_card_expiry_date;const diff=Math.floor((new Date(exp)-new Date())/86400000);if(diff<=30)alerts.push("Piece ID expire dans "+diff+"j");}
    return alerts;
  };

  const handleSave = async () => {
    if (!form.nom||!form.prenom) return;
    const mat = form.matricule||genMatricule(form.prenom,form.nom);
    const payload = {
      nom:form.nom||null, prenom:form.prenom||null, site:form.site||1, vehicule:form.vehicule||null,
      shift:form.shift||"A", status:form.status||"Actif", kpi:form.kpi||80, courses:form.courses||0,
      ca:form.ca||0, pen:form.pen||0, avance:form.avance||0, driver_code:mat,
      contract_type:form.typeContrat||"Salarie", telephone:form.telephone||null,
      telephoneperso:form.telephonePerso||null, adresse:form.adresse||null,
      emergency_contact:(form.contactUrgence||"")+" - "+(form.contactUrgenceTel||""),
      contacturgencetel:form.contactUrgenceTel||null,
      license_number:form.permisNum||null, license_expiry_date:form.permisExpiration||null,
      id_card_number:form.pieceNum||null, id_card_expiry_date:form.pieceExpiration||null,
      permistype:form.permisType||null, permisdelivrance:form.permisDelivrance||null,
      piecetype:form.pieceType||"CNI", piecedelivrance:form.pieceDelivrance||null,
      yango_score:form.noteYango||4.0, internal_score:form.noteInterne||80,
      commentaires:form.commentaires||null, dettes:form.dettes||0,
      dettecommentaire:form.detteCommentaire||null,
      photo_face:form.photoFace||null, photos_profil:form.photosProfil||[],
      photo_plein_pied:form.photoPleinPied||null, photo_permis:form.photoPermis||null,
      photo_piece:form.photoPiece||null,
    };
    if(editItem){await onUpdate(editItem.id,payload);}
    else{await onAdd({...payload,id:"CH-"+Date.now()});}
    setShowModal(false);
  };

  const tabs = [{id:"profil",label:"Profil"},{id:"kyc",label:"KYC"},{id:"performance",label:"Perf."},{id:"creance",label:"Creance"}];

  const shiftColors = {"A":"bg-emerald-100 text-emerald-700","B":"bg-violet-100 text-violet-700","C":"bg-slate-100 text-slate-600"};

  if(detail){
    const d=drivers.find(x=>x.id===detail);
    if(!d){setDetail(null);return null;}
    const alerts=getDriverAlerts(d);
    const mat = d.matricule||d.driver_code||d.id;
    const vh = vehicles.find(v=>v.id===d.vehicule);
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        {alerts.map((a,i)=><div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200">{a}</div>)}
        
        {/* Hero */}
        <div className="bg-emerald-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-2xl font-bold">
                {(d.prenom||"?")[0]}{(d.nom||"?")[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{d.prenom} {d.nom}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono">{mat}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Shift {d.shift}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{d.typeContrat||d.contract_type||"Salarie"}</span>
                </div>
                <p className="text-white/70 text-sm mt-1">{sitesList.find(s=>s.id===d.site||String(s.id)===String(d.site))?.name} {vh&&"· "+vh.immat}</p>
              </div>
            </div>
            <button onClick={()=>{openEdit(d);setDetail(null);}} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium">
              Modifier
            </button>
          </div>
          {/* KPI bar */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{d.noteYango||d.yango_score||"—"}</div>
              <div className="text-white/60 text-xs mt-1">Note Yango</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{d.kpi||0}%</div>
              <div className="text-white/60 text-xs mt-1">KPI Interne</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{(d.courses||0)}</div>
              <div className="text-white/60 text-xs mt-1">Courses</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={"px-5 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap "+(activeTab===t.id?"border-emerald-600 text-emerald-600":"border-transparent text-slate-500 hover:text-slate-700")}>{t.label}</button>)}
          </div>
          <div className="p-6">
            {activeTab==="profil"&&(
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[["Tel. travail",d.telephone],["Tel. perso",d.telephonePerso||d.telephoneperso],["Adresse",d.adresse],["Urgence 1",d.contactUrgence||(d.emergency_contact?.split(" - ")[0])],["Urgence 2",d.contactUrgenceTel||d.contacturgencetel],["Contrat",d.typeContrat||d.contract_type]].map(([l,val])=>(
                  <div key={l} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500 w-28">{l}</span>
                    <span className="text-sm font-medium text-slate-700 flex-1">{val||"—"}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab==="kyc"&&(
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">🪪</span>
                    Permis de conduire
                  </h4>
                  {[["N°",d.permisNum||d.license_number],["Type",d.permisType||d.permistype],["Delivrance",d.permisDelivrance||d.permisdelivrance],["Expiration",d.permisExpiration||d.license_expiry_date]].map(([l,val])=>(
                    <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-500">{l}</span>
                      <span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-xs">📄</span>
                    Piece ID ({d.pieceType||d.piecetype||"CNI"})
                  </h4>
                  {[["N°",d.pieceNum||d.id_card_number],["Delivrance",d.pieceDelivrance||d.piecedelivrance],["Expiration",d.pieceExpiration||d.id_card_expiry_date]].map(([l,val])=>(
                    <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-xs text-slate-500">{l}</span>
                      <span className={"text-xs font-medium "+(l==="Expiration"&&val&&new Date(val)<new Date(Date.now()+30*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
                        {activeTab==="performance"&&(
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[["Note Yango",d.noteYango||d.yango_score||"—","text-amber-500","/5"],["KPI Interne",(d.kpi||0)+"%","text-blue-600",""],["Courses",(d.courses||0).toLocaleString(),"text-slate-700",""],["CA",fmt(d.ca||0),"text-emerald-600",""],["Penalites",fmt(d.pen||0),"text-red-500",""],["Avance",fmt(d.avance||0),"text-amber-600",""]].map(([l,val,color,suffix])=>(
                  <div key={l} className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className={"text-xl font-bold "+color}>{val}{suffix}</div>
                    <div className="text-xs text-slate-500 mt-1">{l}</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab==="creance"&&(
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                  <div className="text-xs text-slate-500 mb-1">Solde dettes</div>
                  <div className="text-2xl font-bold text-red-600">{fmt(d.dettes||0)}</div>
                  {(d.detteCommentaire||d.dettecommentaire)&&<div className="text-xs text-slate-500 mt-2">{d.detteCommentaire||d.dettecommentaire}</div>}
                </div>
                {d.commentaires&&<div className="bg-slate-50 rounded-xl p-4"><div className="text-xs text-slate-500 mb-1">Commentaires</div><div className="text-sm text-slate-700">{d.commentaires}</div></div>}
                {!d.dettes&&!d.commentaires&&<div className="text-slate-400 text-sm text-center py-8">Aucune creance</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chauffeurs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} chauffeur(s) · {drivers.filter(d=>d.status==="Actif").length} actifs</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"/>
          </div>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous statuts</option>
            <option value="Actif">Actifs</option>
            <option value="Suspendu">Suspendus</option>
            <option value="Inactif">Inactifs</option>
          </select>
          <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:"Actifs", count:drivers.filter(d=>d.status==="Actif").length, color:"bg-emerald-500", bg:"bg-emerald-50 border-emerald-200"},
          {label:"Suspendus", count:drivers.filter(d=>d.status==="Suspendu").length, color:"bg-amber-500", bg:"bg-amber-50 border-amber-200"},
          {label:"Inactifs", count:drivers.filter(d=>d.status==="Inactif").length, color:"bg-slate-500", bg:"bg-slate-50 border-slate-200"},
        ].map(s=>(
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-600">{s.label}</span>
              <div className={`w-2 h-2 rounded-full ${s.color}`}/>
            </div>
            <div className="text-2xl font-bold text-slate-800">{s.count}</div>
          </div>
        ))}
      </div>

      {/* Liste chauffeurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length===0&&(
          <div className="col-span-3 text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Aucun chauffeur
          </div>
        )}
        {filtered.map(d=>{
          const alerts = getDriverAlerts(d);
          const mat = d.matricule||d.driver_code||"—";
          const vh = vehicles.find(v=>v.id===d.vehicule);
          const siteName = sitesList.find(s=>s.id===d.site||String(s.id)===String(d.site))?.name||"—";
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
              <div className="p-5" onClick={()=>setDetail(d.id)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {(d.prenom||"?")[0]}{(d.nom||"?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{d.prenom} {d.nom}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{mat}</span>
                      <Badge color={sc(d.status)}>{d.status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Infos */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">Vehicule</div>
                    <div className="text-xs font-semibold text-slate-700 truncate">{vh?.immat||"—"}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="text-xs text-slate-400">Site</div>
                    <div className="text-xs font-semibold text-slate-700">{siteName}</div>
                  </div>
                </div>

                {/* KPI + Yango */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold text-sm">{d.noteYango||d.yango_score||"—"}</span>
                    <span className="text-xs text-slate-400">/5 Yango</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${shiftColors[d.shift]||"bg-slate-100 text-slate-600"}`}>Shift {d.shift}</span>
                  <KpiBar value={d.kpi||0}/>
                </div>

                {alerts.length>0&&(
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    <div className="text-xs text-amber-700">⚠ {alerts[0]}</div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-4 flex gap-2 border-t border-slate-100 pt-3">
                <button onClick={()=>openEdit(d)} className="flex-1 text-xs border border-blue-200 text-blue-600 py-2 rounded-lg hover:bg-blue-50 font-medium transition-all">Modifier</button>
                <button onClick={()=>setConfirmDelete(d)} className="text-xs border border-red-200 text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal&&(
        <Modal title={editItem?"Modifier chauffeur":"Ajouter chauffeur"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
            {tabs.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={"px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap "+(activeTab===t.id?"border-emerald-600 text-emerald-600":"border-transparent text-slate-500")}>{t.label}</button>)}
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
              <Input label="Numero urgence 2" value={form.contactUrgenceTel||""} onChange={v=>setForm({...form,contactUrgenceTel:v})} placeholder="+225..."/>
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
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Commentaires</label><textarea value={form.commentaires||""} onChange={e=>setForm({...form,commentaires:e.target.value})} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/></div>
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
  const [editItem, setEditItem] = useState(null);
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
    A:{bg:"bg-blue-50",border:"border-blue-200",title:"text-blue-800",badge:"bg-blue-600",light:"bg-emerald-100 text-emerald-700"},
    B:{bg:"bg-violet-50",border:"border-violet-200",title:"text-violet-800",badge:"bg-violet-600",light:"bg-violet-100 text-violet-700"},
    C:{bg:"bg-slate-50",border:"border-slate-200 dark:border-slate-700",title:"text-slate-800 dark:text-slate-100",badge:"bg-slate-600",light:"bg-slate-100 text-slate-600 dark:text-slate-400"},
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
    if(!form.vh||!form.ch) return setSaving(false)||alert("Vehicule et chauffeur requis");
    setSaving(true);
    if(editItem){
      await onUpdate(editItem.id, {
        vh:form.vh, ch:form.ch,
        type:form.type, shift_type:"Shift "+form.type,
        planned_start_date:form.date,
        debut:form.debut||"06:00", fin:form.fin||"14:00",
        status:form.status||"Planifie",
        lieuDebut:form.lieuDebut||null, lieuFin:form.lieuFin||null,
        responsableZone:form.responsableZone||null,
      });
    } else {
      await onAdd({
        id:"SH-"+Date.now(),
        vh:form.vh, ch:form.ch,
        type:form.type, shift_type:"Shift "+form.type,
        planned_start_date:form.date,
        debut:form.debut||"06:00", fin:form.fin||"14:00",
        status:form.status||"Planifie",
        lieuDebut:form.lieuDebut||null, lieuFin:form.lieuFin||null,
        responsableZone:form.responsableZone||null,
        recette:0, check_in:false, check_out:false,
        courses_count:0, revenue_cash:0, yango_commission:0,
        authorized_expenses:0, yango_rating:0,
        km_driven:0, battery_start:0, battery_end:0,
      });
    }
    setSaving(false);
    setShowModal(false);
    setEditItem(null);
  };

  const openEdit = (s) => {
    setForm({
      vh:s.vh||"", ch:s.ch||"", type:s.type||"A",
      date:(s.date||s.planned_start_date||"").split("T")[0]||new Date().toISOString().split("T")[0],
      debut:s.debut||"06:00", fin:s.fin||"14:00",
      status:s.status||"Planifie",
      lieuDebut:s.lieuDebut||"", lieuFin:s.lieuFin||"",
      responsableZone:s.responsableZone||"",
      recette:s.recette||0, commentaireShift:s.commentaireShift||"",
    });
    setEditItem(s);
    setShowModal(true);
  };

  const handleCheckin = async (s) => {
    await onUpdate(s.id, {status:"En cours", check_in:true});
  };

  const handleCheckout = async (s) => {
    await onUpdate(s.id, {status:"Terminé", check_out:true});
    // Attendre que le statut soit bien mis a jour avant d ouvrir DD
    await new Promise(resolve => setTimeout(resolve, 800));
    setDDForm({heureDebutReelle:"",heureFinReelle:"",kmParcourus:0,nbCourses:0,revenusGeneres:0,commissionYango:0,autonomieDebut:100,autonomieFin:0,depensesAutorisees:0,noteYangoShift:0,commentaireShift:""});
    setSelectedShift({...s, status:"Terminé"});
    setShowDDModal(true);
  };

  const handleSaveDD = async () => {
    if(!selectedShift) return;
    setSaving(true);
    await onUpdate(selectedShift.id, {
      courses_count: ddForm.nbCourses||0,
      revenue_cash: ddForm.revenusGeneres||0,
      recette: ddForm.revenusGeneres||0,
      yango_commission: ddForm.commissionYango||0,
      authorized_expenses: ddForm.depensesAutorisees||0,
      yango_rating: ddForm.noteYangoShift||0,
      km_driven: ddForm.kmParcourus||0,
      battery_start: ddForm.autonomieDebut||0,
      battery_end: ddForm.autonomieFin||0,
      real_start_time: ddForm.heureDebutReelle||null,
      real_end_time: ddForm.heureFinReelle||null,
      photo_selfie: ddForm.photoSelfie||null,
      photos_fin_shift: ddForm.photosFinShift||[],
      captures_yango: ddForm.capturesYango||[],
      captures_bord: ddForm.capturesBord||[],
    });
    // Attendre que Supabase confirme avant de fermer
    await new Promise(resolve => setTimeout(resolve, 500));
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planning et Shifts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
          <button onClick={()=>{setForm(emptyShift);setEditItem(null);setShowModal(true);}} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Planifier shift
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"Total shifts",value:totalShifts,color:"text-slate-700 dark:text-slate-300",bg:"bg-slate-50"},
          {label:"Planifies",value:planifies,color:"text-blue-600",bg:"bg-blue-50"},
          {label:"En cours",value:enCours,color:"text-emerald-600",bg:"bg-emerald-50"},
          {label:"Termines",value:termines,color:"text-slate-500 dark:text-slate-400",bg:"bg-slate-50"},
          {label:"DD saisis",value:ddSaisis+"/"+termines,color:"text-violet-600",bg:"bg-violet-50"},
        ].map(s=>(
          <div key={s.label} className={s.bg+" rounded-xl p-4 border border-slate-200 dark:border-slate-700"}>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</div>
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">{shiftHoraires[type]}</p>
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
                    <div key={s.id} className="bg-white rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                      {/* En-tete shift */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {driver?(driver.prenom||"?")[0]+(driver.nom||"?")[0]:"?"}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{driver?driver.prenom+" "+driver.nom:"—"}</div>
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
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 mb-2 space-y-1">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">DD Driving Datas</div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>Courses: <strong className="text-slate-700 dark:text-slate-300">{s.courses_count||s.nbCourses||0}</strong></span>
                            <span>Rev: <strong className="text-emerald-600">{fmt(s.revenue_cash||s.revenusGeneres||0)}</strong></span>
                            <span>Com.: <strong className="text-red-500">{fmt(s.yango_commission||s.commissionYango||0)}</strong></span>
                            <span>Note: <strong className="text-amber-500">{s.yango_rating||s.noteYangoShift||0}/5</strong></span>
                            {s.km_driven>0&&<span>Km: <strong className="text-slate-700 dark:text-slate-300">{s.km_driven}</strong></span>}
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
                        <button onClick={()=>openEdit(s)} className="text-xs text-slate-500 border border-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                          Modifier
                        </button>
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
                          }} className={"flex-1 text-xs px-2 py-1.5 rounded-lg font-medium "+(hasDDData?"bg-emerald-100 text-emerald-700 hover:bg-blue-200":"bg-blue-600 text-white hover:bg-blue-700")}>
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
        <Modal title={editItem?"Modifier le shift":"Planifier un shift"} onClose={()=>{setShowModal(false);setEditItem(null);}}
          footer={<><button onClick={()=>{setShowModal(false);setEditItem(null);}} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving?"Enregistrement...":(editItem?"Enregistrer":"Planifier")}</button></>}>
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
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto my-4">
              {/* Header DD */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-t-2xl">
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
                    <Badge color={"bg-emerald-100 text-emerald-700"}>Shift {selectedShift.type}</Badge>
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
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Heures reelles (10% du KPI)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Heure debut reelle" value={ddForm.heureDebutReelle||""} onChange={v=>setDDForm({...ddForm,heureDebutReelle:v})} type="time"/>
                    <Input label="Heure fin reelle" value={ddForm.heureFinReelle||""} onChange={v=>setDDForm({...ddForm,heureFinReelle:v})} type="time"/>
                  </div>
                </div>

                {/* Section Courses et Revenus */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Courses et revenus (30% du KPI)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre de courses (5%)" value={ddForm.nbCourses||0} onChange={v=>setDDForm({...ddForm,nbCourses:parseInt(v)||0})} type="number"/>
                    <Input label="Revenus generes — F CFA (25%)" value={ddForm.revenusGeneres||0} onChange={v=>setDDForm({...ddForm,revenusGeneres:parseInt(v)||0})} type="number"/>
                    <Input label="Commission Yango — F CFA (15%)" value={ddForm.commissionYango||0} onChange={v=>setDDForm({...ddForm,commissionYango:parseInt(v)||0})} type="number"/>
                    <Input label="Depenses autorisees — F CFA" value={ddForm.depensesAutorisees||0} onChange={v=>setDDForm({...ddForm,depensesAutorisees:parseInt(v)||0})} type="number"/>
                  </div>
                </div>

                {/* Section Batterie */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Consommation batterie (15% du KPI)</div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Autonomie debut (%)" value={ddForm.autonomieDebut||0} onChange={v=>setDDForm({...ddForm,autonomieDebut:parseInt(v)||0})} type="number"/>
                    <Input label="Autonomie fin (%)" value={ddForm.autonomieFin||0} onChange={v=>setDDForm({...ddForm,autonomieFin:parseInt(v)||0})} type="number"/>
                    <Input label="Km parcourus" value={ddForm.kmParcourus||0} onChange={v=>setDDForm({...ddForm,kmParcourus:parseFloat(v)||0})} type="number"/>
                  </div>
                </div>

                {/* Note Yango */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Note et etat vehicule</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Note Yango du shift (/5) — 10%" value={ddForm.noteYangoShift||0} onChange={v=>setDDForm({...ddForm,noteYangoShift:parseFloat(v)||0})} type="number"/>
                    <div className="col-span-1"></div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etat vehicule et commentaires (20%)</label>
                      <textarea value={ddForm.commentaireShift||""} onChange={e=>setDDForm({...ddForm,commentaireShift:e.target.value})} rows={3} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Etat du vehicule, incidents, remarques..."/>
                    </div>
                  </div>
                </div>

                {/* Analyse automatique */}
                {ddForm.revenusGeneres>0&&(
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Analyse automatique</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recette nette</div>
                        <div className="font-bold text-emerald-600 text-sm">{fmt(recetteNette)}</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ratio commission</div>
                        <div className={"font-bold text-sm "+(ratioCommission>25?"text-red-600":ratioCommission>18?"text-amber-600":"text-emerald-600")}>{ratioCommission}%</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Conso batterie</div>
                        <div className="font-bold text-blue-600 text-sm">{consoBatterie}%</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Moy. par course</div>
                        <div className="font-bold text-violet-600 text-sm">{ddForm.nbCourses>0?fmt(Math.round(recetteNette/ddForm.nbCourses)):"—"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 bg-white rounded-b-2xl">
                <button onClick={()=>setShowDDModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50">Annuler</button>
                <button onClick={handleSaveDD} disabled={saving} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {saving?"Enregistrement...":"Enregistrer les DD"}
                </button>
              </div>
            </div>
          </div>
      );
      })()}
      {confirmDelete&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Supprimer ce shift ?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Cette action est irreversible.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 border border-slate-200 dark:border-slate-700 py-2 rounded-lg text-sm">Annuler</button>
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
const ReversementsPage = ({reversements, drivers, shifts, onAdd, onUpdate, onDelete, user}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterDriver, setFilterDriver] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriode, setFilterPeriode] = useState("tout");
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");

  // Calcul periode 14 jours
  const getPeriodeDates = () => {
    const now = new Date();
    const debut = new Date(now);
    debut.setDate(now.getDate() - 14);
    return { debut: debut.toISOString().split("T")[0], fin: now.toISOString().split("T")[0] };
  };

  const emptyForm = {ch:"",montant:0,canal:"Wave Business",date:new Date().toISOString().split("T")[0],status:"En attente",ecart:0,depensesAutorisees:0,preuve:"",commentaire:""};
  const [form, setForm] = useState(emptyForm);
  const [shiftInfo, setShiftInfo] = useState(null);

  // Recherche automatique du shift quand chauffeur + date changent
  const findShift = (chId, date) => {
    if(!chId || !date) { setShiftInfo(null); return; }
    const found = shifts.filter(s => 
      s.ch === chId && 
      (s.status === "Terminé" || s.status === "Termine") &&
      (s.planned_start_date || s.date || "").startsWith(date)
    );
    if(found.length > 0) {
      const s = found[0];
      setShiftInfo(s);
    } else {
      setShiftInfo(null);
    }
  };

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

  // Calcul ecart automatique base sur les recettes DD du shift
  const calcEcart = (montantVerse, montantDeclare, depenses, canal) => {
    const revenuBase = shiftInfo ? (shiftInfo.revenue_cash || shiftInfo.recette || montantDeclare) : montantDeclare;
    const tolerance = (canal==="Wave Business" || canal==="Wave") ? revenuBase * 0.01 : 0;
    const montantAttendu = revenuBase - (depenses || 0);
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
    .filter(r=>filterStatus==="all"||r.status===filterStatus)
    .filter(r=>{
      if(filterPeriode==="14j") {
        const {debut, fin} = getPeriodeDates();
        return (r.date||"") >= debut && (r.date||"") <= fin;
      }
      if(filterPeriode==="custom" && filterDateDebut && filterDateFin) {
        return (r.date||"") >= filterDateDebut && (r.date||"") <= filterDateFin;
      }
      return true;
    });

  const total = filtered.reduce((a,r)=>a+(r.montant||0),0);
  const totalEcart = filtered.reduce((a,r)=>a+(r.ecart||0),0);
  const nbEcarts = filtered.filter(r=>(r.ecart||0)>0).length;
  const nbEnAttente = filtered.filter(r=>r.status==="En attente").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recettes et Reversements</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Suivi quotidien des versements Wave / Orange Money</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
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
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap gap-3">
        <select value={filterDriver} onChange={e=>setFilterDriver(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white">
          <option value="all">Tous les chauffeurs</option>
          {drivers.map(d=><option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white">
          <option value="all">Tous les statuts</option>
          <option value="En attente">En attente</option>
          <option value="Validé">Valides</option>
          <option value="Ecart detecte">Ecarts detectes</option>
        </select>
        <select value={filterPeriode} onChange={e=>setFilterPeriode(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white">
          <option value="tout">Toute la periode</option>
          <option value="14j">14 derniers jours</option>
          <option value="custom">Periode personnalisee</option>
        </select>
        {filterPeriode==="custom"&&(
          <>
            <input type="date" value={filterDateDebut} onChange={e=>setFilterDateDebut(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white"/>
            <input type="date" value={filterDateFin} onChange={e=>setFilterDateFin(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white"/>
          </>
        )}
        {(filterDriver!=="all"||filterStatus!=="all"||filterPeriode!=="tout")&&(
          <button onClick={()=>{setFilterDriver("all");setFilterStatus("all");setFilterPeriode("tout");setFilterDateDebut("");setFilterDateFin("");}}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-2 rounded-lg">
            Effacer filtres
          </button>
        )}
        <div className="ml-auto text-xs text-slate-400 dark:text-slate-500 self-center">
          {filtered.length} reversement(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Montant verse</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Canal</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Depenses aut.</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Preuve</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ecart</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Statut</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={9} className="text-center py-8 text-slate-400 text-sm">Aucun reversement</td></tr>}
            {filtered.map(r=>{
              const driver=drivers.find(d=>d.id===r.ch);
              const hasEcart = (r.ecart||0)>0;
              const depenses = r.authorized_expenses||r.depensesAutorisees||0;
              return (
                <tr key={r.id} className={"border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"+(hasEcart?" bg-red-50/30":"")}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{driver?driver.prenom+" "+driver.nom:"—"}</div>
                    <div className="text-xs text-slate-400">{driver?.matricule||""}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{fmt(r.montant||0)}</td>
                  <td className="px-4 py-3"><Badge color="bg-emerald-100 text-emerald-700">{r.canal||"—"}</Badge></td>
                  <td className="px-4 py-3 text-sm text-amber-600">{depenses>0?fmt(depenses):"—"}</td>
                  <td className="px-4 py-3">
                    {(r.transaction_proof_url||r.preuve)?
                      <a href={r.transaction_proof_url||r.preuve} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                        Voir preuve
                      </a>:
                      <span className="text-xs text-slate-400">Pas de preuve</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{r.date||"—"}</td>
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
                      <button onClick={()=>openEdit(r)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">Modifier</button>
                      {r.status==="En attente"&&(user?.role==="finance"||user?.role==="admin")&&<button onClick={async()=>await onUpdate(r.id,{
  status:"Validé",
  ch:r.ch, driver_id:r.ch,
  montant:r.montant, amount_sent:r.montant, amount_requested:r.montant,
  canal:r.canal, date:r.date, ecart:r.ecart||0,
  authorized_expenses:r.authorized_expenses||r.depensesAutorisees||0,
  transaction_proof_url:r.transaction_proof_url||r.preuve||null,
  commentaire:r.commentaire||null,
})} className="text-emerald-600 text-xs border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-50">Valider</button>}
                      {r.status==="En attente"&&!(user?.role==="finance"||user?.role==="admin")&&<span className="text-xs text-slate-400 italic px-2 py-1">En attente Finance</span>}
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
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-2">
            L ecart est calcule automatiquement. Tolerance de 1% pour les frais Wave Business.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Select label="Chauffeur" value={form.ch} onChange={v=>{setForm({...form,ch:v});findShift(v,form.date);}} options={[{value:"",label:"-- Choisir --"},...drivers.map(d=>({value:d.id,label:d.prenom+" "+d.nom+" ("+(d.matricule||d.id)+")"}))]}/> 
            </div>
            {shiftInfo && (
              <div className="col-span-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Shift trouvé automatiquement</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Recettes DD : <strong>{shiftInfo.revenue_cash||shiftInfo.recette||0} F</strong></span>
                  <span>Shift : <strong>{shiftInfo.shift_type||"Shift "+shiftInfo.type}</strong></span>
                  <span>Courses : <strong>{shiftInfo.courses_count||0}</strong></span>
                  <span>Commission : <strong>{shiftInfo.yango_commission||0} F</strong></span>
                </div>
              </div>
            )}
            {form.ch && !shiftInfo && form.date && (
              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-xs text-amber-700">⚠ Aucun shift terminé trouvé pour ce chauffeur à cette date</div>
              </div>
            )}
            <Input label="Montant verse (F CFA)" value={form.montant} onChange={v=>setForm({...form,montant:parseInt(v)||0})} type="number" required/>
            <Select label="Canal" value={form.canal} onChange={v=>setForm({...form,canal:v})} options={["Wave Business","Orange Money Business","MTN Mobile Money","Moov Money","Cash"]}/>
            <Input label="Date" value={form.date} onChange={v=>{setForm({...form,date:v});findShift(form.ch,v);}} type="date"/>
            <Input label="Depenses autorisees (F CFA)" value={form.depensesAutorisees||0} onChange={v=>setForm({...form,depensesAutorisees:parseInt(v)||0})} type="number"/>
            <div className="col-span-2">
              <PhotoUpload label="Preuve de paiement (capture Wave/OM/Mobile Money)" bucket="reversement-proofs" folder={"reversements/"+(form.date||"new")} value={form.preuve||""} onChange={url=>setForm(f=>({...f,preuve:url}))} hint="Capture d'ecran de la transaction"/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Commentaire</label>
              <textarea value={form.commentaire||""} onChange={e=>setForm({...form,commentaire:e.target.value})} rows={2} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Remarques eventuelles..."/>
            </div>
          </div>
          {form.montant>0&&(
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recharge EV</h1>
        <button onClick={()=>{setForm(emptyForm);setEditItem(null);setShowModal(true);}} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">+ Ajouter recharge</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total kWh consommes" value={totalKwh.toFixed(1)+" kWh"} color="text-emerald-600"/>
        <StatCard label="Cout total recharges" value={fmtK(totalCout)+" F"} color="text-amber-600"/>
        <StatCard label="Sessions de recharge" value={filtered.length.toString()} color="text-blue-600"/>
      </div>
      <div className="flex gap-3 flex-wrap">
        <select value={filterVh} onChange={e=>setFilterVh(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white">
          <option value="all">Tous les vehicules</option>
          {vehicles.map(v=><option key={v.id} value={v.id}>{v.immat}</option>)}
        </select>
        <select value={filterDriver} onChange={e=>setFilterDriver(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white">
          <option value="all">Tous les chauffeurs</option>
          {drivers.map(d=><option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>)}
        </select>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Vehicule</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Chauffeur</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Partenaire</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">kWh</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cout</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SOC</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(r=>(
              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{r.date}</td>
                <td className="px-4 py-3 text-sm font-medium">{vehicles.find(v=>v.id===r.vh)?.immat||r.vh}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{drivers.find(d=>d.id===r.ch)?`${drivers.find(d=>d.id===r.ch).prenom} ${drivers.find(d=>d.id===r.ch).nom}`:"—"}</td>
                <td className="px-4 py-3"><Badge color="bg-emerald-100 text-emerald-700">{r.typeCharge||"Partenaire"}</Badge></td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{r.partenaire||"—"}</td>
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
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance</h1>
        <button onClick={()=>{setForm(emptyForm);setEditItem(null);setShowModal(true);}} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">+ Ajouter</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Planifiees" value={maintenances.filter(m=>m.status==="Planifiee"||m.status==="Planifiée").length.toString()} color="text-blue-600"/>
        <StatCard label="En cours" value={maintenances.filter(m=>m.status==="En cours").length.toString()} color="text-amber-600"/>
        <StatCard label="Cout total" value={fmt(maintenances.reduce((a,m)=>a+(m.cout||0),0))} color="text-red-600"/>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700">
        <div className="space-y-0">
          {maintenances.length===0&&<div className="text-center text-slate-400 py-8">Aucune maintenance</div>}
          {maintenances.map(m=>(
            <div key={m.id} className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <div className="flex items-center gap-4">
                <div className={"w-10 h-10 rounded-lg flex items-center justify-center "+(m.type==="Corrective"?"bg-red-100 text-red-600":"bg-blue-100 text-blue-600")}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{m.desc||m.description}</div>
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
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
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

// ============================================================
// GPS PAGE
// ============================================================
const GpsPage = ({vehicles}) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">GPS et Securite</h1>
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
      <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Carte de la flotte</h2>
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl h-64 flex items-center justify-center border border-slate-200 dark:border-slate-700">
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sites et Comptes Business</h1>
        <button onClick={()=>{setForm(emptyForm);setEditItem(null);setShowModal(true);}} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">+ Ajouter site</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displaySites.map(site=>{
          const sVh=vehicles.filter(v=>String(v.site)===String(site.id)||v.site===site.name);
          const sDr=drivers.filter(d=>String(d.site)===String(site.id)||d.site===site.name);
          return (
            <div key={site.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-lg font-bold">{site.name}</h3><p className="text-sm text-slate-500 dark:text-slate-400">{site.ville} · Zone {site.zone}</p></div>
                <div className="flex gap-2">
                  <Badge color="bg-emerald-100 text-emerald-700">Actif</Badge>
                  <button onClick={()=>{setForm({...emptyForm,...site});setEditItem(site);setShowModal(true);}} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded">Modifier</button>
                  <button onClick={()=>setConfirmDelete(site)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded">Suppr.</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><div className="text-lg font-bold text-blue-600">{sVh.length}</div><div className="text-xs text-slate-500 dark:text-slate-400">Vehicules</div></div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><div className="text-lg font-bold text-violet-600">{sDr.length}</div><div className="text-xs text-slate-500 dark:text-slate-400">Chauffeurs</div></div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><div className="text-lg font-bold text-emerald-600">{sVh.filter(v=>v.status==="En exploitation").length}</div><div className="text-xs text-slate-500 dark:text-slate-400">Actifs</div></div>
              </div>
              {site.waveAccount&&<div className="p-3 bg-blue-50 rounded-lg"><div className="text-xs text-slate-500 dark:text-slate-400">Compte Business · {site.businessType||"Wave Business"}</div><div className="font-mono font-semibold text-blue-700">{site.waveAccount}</div></div>}
            </div>
          );
        })}
      </div>

      {showModal&&(
        <Modal title={editItem?"Modifier site":"Ajouter site"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
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

  const roleColor = (r) => ({"admin":"bg-red-100 text-red-700","ops":"bg-emerald-100 text-emerald-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700","dispatcher":"bg-amber-100 text-amber-700"}[r]||"bg-slate-100 text-slate-600 dark:text-slate-400");
  const roleLabel = (r) => ({"admin":"Administrateur","ops":"Ops Manager","finance":"Finance","supervisor":"Superviseur Logistique","dispatcher":"Dispatcher"}[r]||r);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des comptes</h1>

      {/* Alerte lien invitation */}
      {inviteInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-emerald-800 mb-1">Compte cree pour {inviteInfo.name}</div>
              <div className="text-sm text-emerald-700 mb-3">Envoyez ce lien a {inviteInfo.email} pour qu il definisse son mot de passe :</div>
              <div className="bg-white border border-emerald-200 rounded-lg px-4 py-2 font-mono text-sm text-slate-700 dark:text-slate-300 break-all">{inviteInfo.lien}</div>
              <div className="text-xs text-emerald-600 mt-2">Token : {inviteInfo.token}</div>
            </div>
            <button onClick={()=>setInviteInfo(null)} className="text-emerald-400 hover:text-emerald-600 ml-4 text-xl font-bold">x</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Utilisateurs ({users.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Seul l administrateur peut creer et modifier les comptes</p>
          </div>
          {currentUser?.role==="admin"&&(
            <button onClick={()=>{setShowAddUser(true);setUserError("");setUserSuccess("");}} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
              + Creer un compte
            </button>
          )}
        </div>
        <div className="space-y-3">
          {users.map(u=>(
            <div key={u.id} className={"flex items-center justify-between p-4 rounded-xl border "+(u.invite_pending?"bg-amber-50 border-amber-200":"bg-slate-50 border-slate-100 dark:border-slate-700")}>
              <div className="flex items-center gap-3">
                <div className={"w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm "+(u.invite_pending?"bg-amber-400":"bg-gradient-to-br from-blue-500 to-violet-500")}>
                  {(u.name||"?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-100">
                    {u.name}
                    {u.id===currentUser?.id&&<span className="text-xs text-blue-500 ml-2">(vous)</span>}
                    {u.invite_pending&&<span className="text-xs text-amber-600 ml-2">— invitation en attente</span>}
                  </div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {u.id===currentUser?.id&&(
                  <button onClick={()=>{setShowChangePwd(true);setPwdForm({current:"",next:"",confirm:""});setPwdError("");setPwdSuccess("");}} className="text-blue-600 text-xs border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    Modifier mot de passe
                  </button>
                )}
                {currentUser?.role==="admin"&&u.id!==currentUser?.id?(
                  <select value={u.role} onChange={e=>handleRoleChange(u.id,e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
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
          footer={<><button onClick={()=>setShowAddUser(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleAddUser} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">Envoyer invitation</button></>}>
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
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("saver_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Sauvegarder la session a chaque changement d utilisateur
  useEffect(() => {
    if(user) {
      localStorage.setItem("saver_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("saver_user");
    }
  }, [user]);
  const [page, setPage] = useState(() => localStorage.getItem("saver_page") || "dashboard");

  // Sauvegarder la page actuelle a chaque changement
  useEffect(() => {
    localStorage.setItem("saver_page", page);
  }, [page]);
  const [sideOpen, setSideOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({current:"", next:"", confirm:""});
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const handleChangePwd = async () => {
    setPwdError(""); setPwdSuccess("");
    if(!pwdForm.current) return setPwdError("Mot de passe actuel requis");
    if(pwdForm.next.length < 6) return setPwdError("Nouveau mot de passe minimum 6 caracteres");
    if(pwdForm.next !== pwdForm.confirm) return setPwdError("Les mots de passe ne correspondent pas");
    const users = await getUsers();
    const me = users.find(u => u.id === user?.id);
    if(!me || me.password !== pwdForm.current) return setPwdError("Mot de passe actuel incorrect");
    await supabase.from("users").update({password: pwdForm.next}).eq("id", user.id);
    setPwdSuccess("Mot de passe modifie avec succes !");
    setPwdForm({current:"", next:"", confirm:""});
    setTimeout(() => { setShowPwdModal(false); setPwdSuccess(""); }, 2000);
  };
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Global search results - avec guards pour eviter les crashes
  const searchResults = search.length >= 2 ? [
    ...(vh?.data||[]).filter(v => 
      (v.immat||"").toLowerCase().includes(search.toLowerCase()) ||
      (v.marque||"").toLowerCase().includes(search.toLowerCase()) ||
      (v.modele||"").toLowerCase().includes(search.toLowerCase())
    ).map(v => ({type:"vehicule", label:(v.immat||"")+" — "+(v.marque||"")+" "+(v.modele||""), id:v.id, page:"vehicules"})),
    ...(dr?.data||[]).filter(d =>
      (d.nom||"").toLowerCase().includes(search.toLowerCase()) ||
      (d.prenom||"").toLowerCase().includes(search.toLowerCase()) ||
      (d.matricule||d.driver_code||"").toLowerCase().includes(search.toLowerCase())
    ).map(d => ({type:"chauffeur", label:(d.prenom||"")+" "+(d.nom||"")+" ("+(d.matricule||d.driver_code||"")+")", id:d.id, page:"chauffeurs"})),
  ] : [];

  // Apply dark mode via CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if(darkMode) {
      root.style.setProperty("--bg-primary", "#0f172a");
      root.style.setProperty("--bg-secondary", "#1e293b");
      root.style.setProperty("--bg-card", "#1e293b");
      root.style.setProperty("--bg-input", "#334155");
      root.style.setProperty("--bg-hover", "#334155");
      root.style.setProperty("--bg-table-header", "#1e293b");
      root.style.setProperty("--text-primary", "#f1f5f9");
      root.style.setProperty("--text-secondary", "#94a3b8");
      root.style.setProperty("--text-muted", "#64748b");
      root.style.setProperty("--border-color", "#334155");
      root.style.setProperty("--border-light", "#334155");
      root.classList.add("dark-mode");
    } else {
      root.style.setProperty("--bg-primary", "#f1f5f9");
      root.style.setProperty("--bg-secondary", "#f8fafc");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--bg-input", "#ffffff");
      root.style.setProperty("--bg-hover", "#f8fafc");
      root.style.setProperty("--bg-table-header", "#f8fafc");
      root.style.setProperty("--text-primary", "#0f172a");
      root.style.setProperty("--text-secondary", "#475569");
      root.style.setProperty("--text-muted", "#94a3b8");
      root.style.setProperty("--border-color", "#e2e8f0");
      root.style.setProperty("--border-light", "#f1f5f9");
      root.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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
    photo_carte_grise:item.photoCarteGrise||null,
    photo_visite:item.photoVisite||null,
    photo_assurance:item.photoAssurance||null,
    photos_ext:item.photosExt||[],
    photos_int:item.photosInt||[],
  });
  const addVehicle = async (item) => {
    const payload = {
      id:"VH-"+Date.now(),
      immat:item.immat||null,
      marque:item.marque||null,
      modele:item.modele||null,
      site:item.site||1,
      autonomie:item.autonomie||0,
      km:item.km||0,
      soc:item.soc||0,
      status:item.status||"En exploitation",
      typecontrat:item.typecontrat||item.typeContrat||"Interne SAVER",
      vin_number:item.vin_number||item.vin||null,
      battery_capacity_kwh:item.battery_capacity_kwh||item.capaciteBatterie||null,
      vehicle_year:item.vehicle_year||item.annee||null,
      vehicle_color:item.vehicle_color||item.couleur||null,
      service_type:item.service_type||item.typeService||"VTC",
      service_class:item.service_class||item.classesService||[],
      technical_visit_expiry:item.technical_visit_expiry||item.visiteDate||null,
      insurance_expiry:item.insurance_expiry||item.assuranceFin||null,
      cartegrisenum:item.cartegrisenum||item.carteGriseNum||null,
      cartegrisedate:item.cartegrisedate||item.carteGriseDate||null,
      cartegriseproprietaire:item.cartegriseproprietaire||item.carteGriseProprietaire||null,
      assurancenum:item.assurancenum||item.assuranceNum||null,
      assurancedebut:item.assurancedebut||item.assuranceDebut||null,
      assurancefin:item.assurancefin||item.assuranceFin||null,
      numerochassis:item.numerochassis||item.numeroChassis||item.vin||null,
      binome:item.binome||[],
      photo_carte_grise:item.photo_carte_grise||item.photoCarteGrise||null,
      photo_visite:item.photo_visite||item.photoVisite||null,
      photo_assurance:item.photo_assurance||item.photoAssurance||null,
      photos_ext:item.photos_ext||item.photosExt||[],
      photos_int:item.photos_int||item.photosInt||[],
    };
    return await vh.add(payload);
  };
  const updateVehicle = async (id, item) => {
    // Merge buildVehiclePayload + champs directs deja en minuscules
    const base = buildVehiclePayload(item);
    const merged = {
      ...base,
      battery_capacity_kwh: item.battery_capacity_kwh || item.capaciteBatterie || base.battery_capacity_kwh || null,
      service_type: item.service_type || item.typeService || base.service_type || "VTC",
      service_class: item.service_class || item.classesService || base.service_class || [],
      technical_visit_expiry: item.technical_visit_expiry || item.visiteDate || base.technical_visit_expiry || null,
      insurance_expiry: item.insurance_expiry || item.assuranceFin || base.insurance_expiry || null,
      cartegrisenum: item.cartegrisenum || item.carteGriseNum || base.cartegrisenum || null,
      cartegrisedate: item.cartegrisedate || item.carteGriseDate || base.cartegrisedate || null,
      cartegriseproprietaire: item.cartegriseproprietaire || item.carteGriseProprietaire || base.cartegriseproprietaire || null,
      assurancenum: item.assurancenum || item.assuranceNum || base.assurancenum || null,
      assurancedebut: item.assurancedebut || item.assuranceDebut || base.assurancedebut || null,
      assurancefin: item.assurancefin || item.assuranceFin || base.assurancefin || null,
      numerochassis: item.numerochassis || item.numeroChassis || item.vin || base.numerochassis || null,
      typecontrat: item.typecontrat || item.typeContrat || base.typecontrat || "Interne SAVER",
      photo_carte_grise: item.photo_carte_grise || item.photoCarteGrise || null,
      photo_visite: item.photo_visite || item.photoVisite || null,
      photo_assurance: item.photo_assurance || item.photoAssurance || null,
      photos_ext: item.photos_ext || item.photosExt || [],
      photos_int: item.photos_int || item.photosInt || [],
    };
    return await vh.update(id, merged);
  };

  const buildDriverPayload = (item) => ({
    nom:item.nom||null,
    prenom:item.prenom||null,
    site:item.site||1,
    vehicule:item.vehicule||null,
    shift:item.shift||"A",
    status:item.status||"Actif",
    kpi:item.kpi||80,
    courses:item.courses||0,
    ca:item.ca||0,
    pen:item.pen||0,
    avance:item.avance||0,
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
    photo_face:item.photoFace||null,
    photos_profil:item.photosProfil||[],
    photo_plein_pied:item.photoPleinPied||null,
    photo_permis:item.photoPermis||null,
    photo_piece:item.photoPiece||null,
  });
  const addDriver = async (item) => {
    // item vient directement du handleSave avec les bons noms de colonnes
    // On n utilise PAS buildDriverPayload pour eviter l ecrasement
    // Generer matricule si absent
    const matricule = item.driver_code || item.matricule ||
      (item.nom && item.prenom ? ((item.nom[0]||"X")+(item.prenom[0]||"X")).toUpperCase()+"-"+(String(Date.now()).slice(-2)) : "DR-01");
    const payload = {
      id:"CH-"+Date.now(),
      nom:item.nom||null, prenom:item.prenom||null,
      site:item.site||1, vehicule:item.vehicule||null,
      shift:item.shift||"A", status:item.status||"Actif",
      kpi:item.kpi||80, courses:item.courses||0,
      ca:item.ca||0, pen:item.pen||0, avance:item.avance||0,
      driver_code:matricule,
      contract_type:item.contract_type||item.typeContrat||"Salarie",
      telephone:item.telephone||null,
      telephoneperso:item.telephoneperso||item.telephonePerso||null,
      adresse:item.adresse||null,
      emergency_contact:item.emergency_contact||null,
      contacturgencetel:item.contacturgencetel||item.contactUrgenceTel||null,
      license_number:item.license_number||item.permisNum||null,
      license_expiry_date:item.license_expiry_date||item.permisExpiration||null,
      id_card_number:item.id_card_number||item.pieceNum||null,
      id_card_expiry_date:item.id_card_expiry_date||item.pieceExpiration||null,
      permistype:item.permistype||item.permisType||null,
      permisdelivrance:item.permisdelivrance||item.permisDelivrance||null,
      piecetype:item.piecetype||item.pieceType||"CNI",
      piecedelivrance:item.piecedelivrance||item.pieceDelivrance||null,
      yango_score:item.yango_score||item.noteYango||4.0,
      internal_score:item.internal_score||item.noteInterne||80,
      commentaires:item.commentaires||null,
      dettes:item.dettes||0,
      dettecommentaire:item.dettecommentaire||item.detteCommentaire||null,
      photo_face:item.photo_face||item.photoFace||null,
      photos_profil:item.photos_profil||item.photosProfil||[],
      photo_plein_pied:item.photo_plein_pied||item.photoPleinPied||null,
      photo_permis:item.photo_permis||item.photoPermis||null,
      photo_piece:item.photo_piece||item.photoPiece||null,
    };
    return await dr.add(payload);
  };
  const updateDriver = async (id, item) => {
    // Merge buildDriverPayload + champs directs deja mappes
    const base = buildDriverPayload(item);
    const merged = {
      ...base,
      // Contrat
      contract_type: item.contract_type || item.typeContrat || base.contract_type || "Salarie",
      // Contact urgence
      emergency_contact: item.emergency_contact || base.emergency_contact || null,
      contacturgencetel: item.contacturgencetel || item.contactUrgenceTel || base.contacturgencetel || null,
      // KYC permis
      license_number: item.license_number || item.permisNum || base.license_number || null,
      license_expiry_date: item.license_expiry_date || item.permisExpiration || base.license_expiry_date || null,
      permistype: item.permistype || item.permisType || base.permistype || null,
      permisdelivrance: item.permisdelivrance || item.permisDelivrance || base.permisdelivrance || null,
      // KYC piece
      id_card_number: item.id_card_number || item.pieceNum || base.id_card_number || null,
      id_card_expiry_date: item.id_card_expiry_date || item.pieceExpiration || base.id_card_expiry_date || null,
      piecetype: item.piecetype || item.pieceType || base.piecetype || "CNI",
      piecedelivrance: item.piecedelivrance || item.pieceDelivrance || base.piecedelivrance || null,
      // Coordonnees
      telephone: item.telephone || base.telephone || null,
      telephoneperso: item.telephoneperso || item.telephonePerso || base.telephoneperso || null,
      adresse: item.adresse || base.adresse || null,
      // Performance
      yango_score: item.yango_score || item.noteYango || base.yango_score || 4.0,
      internal_score: item.internal_score || item.noteInterne || base.internal_score || 80,
      // Creance
      commentaires: item.commentaires || base.commentaires || null,
      dettes: item.dettes !== undefined ? item.dettes : (base.dettes || 0),
      dettecommentaire: item.dettecommentaire || item.detteCommentaire || base.dettecommentaire || null,
      // Photos
      photo_face: item.photo_face || item.photoFace || base.photo_face || null,
      photos_profil: item.photos_profil || item.photosProfil || base.photos_profil || [],
      photo_plein_pied: item.photo_plein_pied || item.photoPleinPied || base.photo_plein_pied || null,
      photo_permis: item.photo_permis || item.photoPermis || base.photo_permis || null,
      photo_piece: item.photo_piece || item.photoPiece || base.photo_piece || null,
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
    // Construire le payload directement sans filtre complexe
    const payload = {
      ...(item.vh !== undefined && { vh: item.vh }),
      ...(item.ch !== undefined && { ch: item.ch }),
      ...(item.type !== undefined && { type: item.type, shift_type: "Shift "+item.type }),
      ...(item.planned_start_date !== undefined && { planned_start_date: item.planned_start_date }),
      ...(item.debut !== undefined && { debut: item.debut }),
      ...(item.fin !== undefined && { fin: item.fin }),
      ...(item.lieuDebut !== undefined && { lieuDebut: item.lieuDebut }),
      ...(item.lieuFin !== undefined && { lieuFin: item.lieuFin }),
      ...(item.responsableZone !== undefined && { responsableZone: item.responsableZone }),
      ...(item.status !== undefined && { status: item.status }),
      ...(item.check_in !== undefined && { check_in: item.check_in }),
      ...(item.check_out !== undefined && { check_out: item.check_out }),
      ...(item.checkIn !== undefined && { check_in: item.checkIn }),
      ...(item.checkOut !== undefined && { check_out: item.checkOut }),
      ...(item.courses_count !== undefined && { courses_count: item.courses_count }),
      ...(item.nbCourses !== undefined && { courses_count: item.nbCourses }),
      ...(item.revenue_cash !== undefined && { revenue_cash: item.revenue_cash, recette: item.revenue_cash }),
      ...(item.revenusGeneres !== undefined && { revenue_cash: item.revenusGeneres, recette: item.revenusGeneres }),
      ...(item.recette !== undefined && { recette: item.recette }),
      ...(item.yango_commission !== undefined && { yango_commission: item.yango_commission }),
      ...(item.commissionYango !== undefined && { yango_commission: item.commissionYango }),
      ...(item.authorized_expenses !== undefined && { authorized_expenses: item.authorized_expenses }),
      ...(item.depensesAutorisees !== undefined && { authorized_expenses: item.depensesAutorisees }),
      ...(item.yango_rating !== undefined && { yango_rating: item.yango_rating }),
      ...(item.noteYangoShift !== undefined && { yango_rating: item.noteYangoShift }),
      ...(item.km_driven !== undefined && { km_driven: item.km_driven }),
      ...(item.kmParcourus !== undefined && { km_driven: item.kmParcourus }),
      ...(item.battery_start !== undefined && { battery_start: item.battery_start }),
      ...(item.autonomieDebut !== undefined && { battery_start: item.autonomieDebut }),
      ...(item.battery_end !== undefined && { battery_end: item.battery_end }),
      ...(item.autonomieFin !== undefined && { battery_end: item.autonomieFin }),
      ...(item.real_start_time !== undefined && { real_start_time: item.real_start_time }),
      ...(item.heureDebutReelle !== undefined && { real_start_time: item.heureDebutReelle||null }),
      ...(item.real_end_time !== undefined && { real_end_time: item.real_end_time }),
      ...(item.heureFinReelle !== undefined && { real_end_time: item.heureFinReelle||null }),
      ...(item.photo_selfie !== undefined && { photo_selfie: item.photo_selfie }),
      ...(item.photos_fin_shift !== undefined && { photos_fin_shift: item.photos_fin_shift }),
      ...(item.captures_yango !== undefined && { captures_yango: item.captures_yango }),
      ...(item.captures_bord !== undefined && { captures_bord: item.captures_bord }),
    };
    const { error } = await supabase.from("shifts").update(payload).eq("id", id);
    if (!error) sh.reload();
    return error;
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
    authorized_expenses: item.authorized_expenses||item.depensesAutorisees||0,
    transaction_proof_url: item.transaction_proof_url||item.preuve||null,
    commentaire: item.commentaire||null,
  });
  const addReversement = async (item) => await rv.add({...buildReversementPayload(item), id:"RV-"+Date.now()});
  const updateReversement = async (id, item) => {
    // Update partiel — on envoie seulement les champs fournis
    const partial = {};
    if(item.status !== undefined) partial.status = item.status;
    if(item.ch !== undefined) { partial.ch = item.ch; partial.driver_id = item.ch; }
    if(item.montant !== undefined) { partial.montant = item.montant; partial.amount_sent = item.montant; partial.amount_requested = item.montant; }
    if(item.canal !== undefined) partial.canal = item.canal;
    if(item.date !== undefined) partial.date = item.date;
    if(item.ecart !== undefined) partial.ecart = item.ecart;
    if(item.authorized_expenses !== undefined) partial.authorized_expenses = item.authorized_expenses;
    if(item.depensesAutorisees !== undefined) partial.authorized_expenses = item.depensesAutorisees;
    if(item.transaction_proof_url !== undefined) partial.transaction_proof_url = item.transaction_proof_url;
    if(item.preuve !== undefined) partial.transaction_proof_url = item.preuve;
    if(item.commentaire !== undefined) partial.commentaire = item.commentaire;
    return await rv.update(id, partial);
  };

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
    reversements: <ReversementsPage reversements={rv.data} drivers={dr.data} shifts={sh.data} onAdd={addReversement} onUpdate={updateReversement} onDelete={rv.remove} user={user}/>,
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
    <><div className="min-h-screen bg-slate-100 flex">
      {sideOpen&&<div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={()=>setSideOpen(false)}/>}
      <aside className={(sideOpen?"w-64 translate-x-0":"-translate-x-full lg:translate-x-0 lg:w-20")+" fixed lg:relative z-30 h-full lg:h-auto bg-slate-950 text-white flex flex-col transition-all duration-300 flex-shrink-0"}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          {sideOpen&&<div><div className="font-bold text-sm">Easy by Saver</div><div className="text-xs text-slate-400">Gestion de flotte VTC</div></div>}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {getNav(user?.role).map(n=>(
            <button key={n.id} onClick={()=>{setPage(n.id);if(window.innerWidth<1024)setSideOpen(false);}} className={"w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors "+(page===n.id?"bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400":"text-slate-400 hover:text-white hover:bg-slate-800")}>
              <NavIcon d={n.icon} className="w-5 h-5 flex-shrink-0"/>
              {sideOpen&&<span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          {sideOpen&&<div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-xs font-bold">{(user.name||"?")[0]}</div><div><div className="text-sm font-medium">{user.name}</div><div className="text-xs text-slate-400">{ROLE_LABELS[user.role]||user.role}</div></div></div>}
          <button onClick={()=>{setShowPwdModal(true);setPwdForm({current:"",next:"",confirm:""});setPwdError("");setPwdSuccess("");}} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            {sideOpen&&"Changer mot de passe"}
          </button>
          <button onClick={()=>{setUser(null);setPage("dashboard");}} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {sideOpen&&"Deconnexion"}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className={`border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 dark:border-slate-700"}`}>
          <button onClick={()=>setSideOpen(!sideOpen)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:text-slate-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 lg:hidden">{ALL_NAV.find(n=>n.id===page)?.label}</div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setDarkMode(!darkMode)} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all" title={darkMode?"Mode clair":"Mode sombre"}>
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-px bg-slate-200"/>
              <div className="text-sm text-slate-500 dark:text-slate-400">{user.name}</div>
              <Badge color={{"admin":"bg-red-100 text-red-700","ops":"bg-emerald-100 text-emerald-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700","dispatcher":"bg-amber-100 text-amber-700"}[user.role]||"bg-slate-100 text-slate-600 dark:text-slate-400"}>{ROLE_LABELS[user.role]||user.role}</Badge>
            </div>
          </div>
        </header>
        <main className={`flex-1 p-4 lg:p-6 overflow-y-auto ${darkMode ? "bg-slate-900" : "bg-slate-100"}`}>{pages[page]}</main>
      </div>
    </div>
    {showPwdModal&&(
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Changer mon mot de passe</h2>
            <button onClick={()=>setShowPwdModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 text-xl font-bold">x</button>
          </div>
          {pwdError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{pwdError}</div>}
          {pwdSuccess&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-3 py-2 rounded-lg mb-3">{pwdSuccess}</div>}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mot de passe actuel</label>
              <input type="password" value={pwdForm.current} onChange={e=>setPwdForm({...pwdForm,current:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nouveau mot de passe</label>
              <input type="password" value={pwdForm.next} onChange={e=>setPwdForm({...pwdForm,next:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Minimum 6 caracteres"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmer le nouveau mot de passe</label>
              <input type="password" value={pwdForm.confirm} onChange={e=>setPwdForm({...pwdForm,confirm:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleChangePwd()} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowPwdModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={handleChangePwd} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Modifier</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default App;