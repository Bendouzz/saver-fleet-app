
import { useState } from "react";
import { Confirm } from "../components/ui/Confirm.jsx";

const STATUTS_VEH = ["En exploitation", "En recharge", "Maintenance", "Hors service", "Immobilise"];
const MARQUES = ["BYD", "Hyundai", "Kia", "Tesla", "Renault", "Peugeot", "Nissan", "Volkswagen", "Autre"];
const CLASSES_VTC = ["Eco", "Confort", "Confort+", "Business", "Premium", "VIP", "Standard", "Coursier", "Livraison", "Interurbain"];
const TYPES_SERVICE = ["VTC", "Location B2B", "Location B2C"];
const TYPES_CONTRAT = ["Interne SAVER", "Externe client gestion"];
const COULEURS = ["Blanc", "Noir", "Gris", "Argent", "Bleu", "Rouge", "Vert", "Jaune", "Orange", "Marron", "Beige", "Autre"];

function joursRestants(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function genCalendarUrl(immat, dateExpiration, numeroAssurance) {
  if (!dateExpiration) return null;
  const expDate = new Date(dateExpiration);
  const alertDate = new Date(expDate);
  alertDate.setDate(alertDate.getDate() - 7);
  const fmt = d => d.toISOString().replace(/[-:]/g, "").slice(0, 8);
  const text = encodeURIComponent("Renouvellement assurance - " + immat);
  const details = encodeURIComponent("N° assurance : " + (numeroAssurance || "-") + "\nExpiration : " + expDate.toLocaleDateString("fr-FR"));
  const dates = fmt(alertDate) + "/" + fmt(expDate);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
}

function PhotoInput({ label, value, onChange, required }) {
  function handle(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => onChange(r.result);
    r.readAsDataURL(file);
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input type="file" accept="image/*" onChange={handle} className="text-slate-400 text-sm mb-2 w-full" />
      {value && (
        <img src={value} alt="" className="mt-1 h-16 w-24 object-cover rounded-lg border border-slate-600 cursor-pointer"
          onClick={() => window.open(value)} />
      )}
    </div>
  );
}

const BADGE_STATUS = {
  "En exploitation": "bg-green-900/60 text-green-400 border border-green-800",
  "En recharge":     "bg-blue-900/60 text-blue-400 border border-blue-800",
  "Maintenance":     "bg-amber-900/60 text-amber-400 border border-amber-800",
  "Hors service":    "bg-red-900/60 text-red-400 border border-red-800",
  "Immobilise":      "bg-red-900/60 text-red-400 border border-red-800",
};

const emptyForm = {
  immat: "", marque: "", modele: "", couleur: "", annee: new Date().getFullYear(),
  site: 1, autonomie: 0, km: 0, soc: 100,
  status: "En exploitation", typeContrat: "Interne SAVER", typeService: "VTC",
  classesService: [], vin: "", numeroChassis: "", capaciteBatterie: 0,
  carteGriseNum: "", carteGriseDate: "", carteGriseProprietaire: "",
  visiteDate: "", visiteDateDebut: "",
  assuranceNum: "", assuranceDebut: "", assuranceFin: "",
  clientNom: "", montantContrat: "", dateDebutContrat: "", dateFinContrat: "", montantRembourse: "",
  photo_carte_grise: null, photo_visite: null, photo_assurance: null,
  photo_ext_avant: null, photo_ext_arriere: null, photo_ext_gauche: null, photo_ext_droite: null,
  photo_interieur: null, photo_tableau_bord: null, photo_ecran: null, photo_sieges: null,
};

export const VehiculesPage = ({ vehicles = [], onAdd, onUpdate, onDelete, sites = [] }) => {
  const [showModal, setShowModal]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [onglet, setOnglet]           = useState("identite");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm]               = useState(emptyForm);

  const sitesList = sites.length > 0 ? sites : [{ id: 1, name: "Abidjan" }];

  const filtered = vehicles.filter(v => filterStatus === "all" || v.status === filterStatus);

  const totalAlertesVT  = vehicles.filter(v => { const j = joursRestants(v.technical_visit_expiry || v.visiteDate); return j !== null && j <= 15; }).length;
  const totalAlertesAss = vehicles.filter(v => { const j = joursRestants(v.insurance_expiry || v.assurancefin); return j !== null && j <= 7; }).length;

  const openAdd = () => {
    setForm(emptyForm);
    setEditItem(null);
    setOnglet("identite");
    setShowModal(true);
  };

  const openEdit = (v) => {
    setForm({
      ...emptyForm, ...v,
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
      photo_carte_grise: v.photo_carte_grise || null,
      photo_visite: v.photo_visite || null,
      photo_assurance: v.photo_assurance || null,
      photo_ext_avant: v.photos_ext?.[0] || null,
      photo_ext_arriere: v.photos_ext?.[1] || null,
      photo_ext_gauche: v.photos_ext?.[2] || null,
      photo_ext_droite: v.photos_ext?.[3] || null,
      photo_interieur: v.photos_int?.[0] || null,
      photo_tableau_bord: v.photos_int?.[1] || null,
      photo_ecran: v.photos_int?.[2] || null,
      photo_sieges: v.photos_int?.[3] || null,
    });
    setEditItem(v);
    setOnglet("identite");
    setShowModal(true);
  };

  const photosExtOk = () => form.photo_ext_avant && form.photo_ext_arriere && form.photo_ext_gauche && form.photo_ext_droite;

  const handleSave = async () => {
    if (!form.immat) return alert("Immatriculation obligatoire");
    if (!photosExtOk()) return alert("Les 4 photos exterieures sont obligatoires");
    const payload = {
      immat: form.immat, marque: form.marque || null, modele: form.modele || null,
      couleur: form.couleur || null, annee: form.annee || null,
      site: form.site || 1, autonomie: form.autonomie || 0, km: form.km || 0, soc: form.soc || 0,
      status: form.status || "En exploitation",
      typecontrat: form.typeContrat || "Interne SAVER",
      vin_number: form.vin || null,
      battery_capacity_kwh: form.capaciteBatterie || null,
      vehicle_year: form.annee || null,
      vehicle_color: form.couleur || null,
      service_type: form.typeService || "VTC",
      service_class: form.classesService || [],
      technical_visit_expiry: form.visiteDate || null,
      insurance_expiry: form.assuranceFin || null,
      cartegrisenum: form.carteGriseNum || null,
      cartegrisedate: form.carteGriseDate || null,
      cartegriseproprietaire: form.carteGriseProprietaire || null,
      assurancenum: form.assuranceNum || null,
      assurancedebut: form.assuranceDebut || null,
      assurancefin: form.assuranceFin || null,
      numerochassis: form.numeroChassis || null,
      photo_carte_grise: form.photo_carte_grise || null,
      photo_visite: form.photo_visite || null,
      photo_assurance: form.photo_assurance || null,
      photos_ext: [form.photo_ext_avant, form.photo_ext_arriere, form.photo_ext_gauche, form.photo_ext_droite].filter(Boolean),
      photos_int: [form.photo_interieur, form.photo_tableau_bord, form.photo_ecran, form.photo_sieges].filter(Boolean),
    };
    if (editItem) await onUpdate(editItem.id, payload);
    else await onAdd({ ...payload, id: "VH-" + Date.now() });
    setShowModal(false);
  };

  const hc = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const hi = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const ONGLETS = [
    { id: "identite", label: "Identite" },
    { id: "documents", label: "Documents" },
    { id: "service", label: "Service" },
    { id: "photos", label: "Photos" },
    { id: "contrat", label: "Contrat client" },
  ];

  const INP = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500";
  const LBL = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── HEADER ── */}
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Vehicules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} vehicule(s)
            {totalAlertesVT > 0 && <span className="ml-2 text-amber-400">· {totalAlertesVT} VT a renouveler</span>}
            {totalAlertesAss > 0 && <span className="ml-2 text-red-400">· {totalAlertesAss} assurance(s) urgentes</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">
            <option value="all">Tous statuts</option>
            {STATUTS_VEH.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            + Ajouter un vehicule
          </button>
        </div>
      </div>

      {/* ── ALERTES GLOBALES ── */}
      <div className="px-6 pt-4">
        {vehicles.map(v => {
          const jVT  = joursRestants(v.technical_visit_expiry || v.visiteDate);
          const jAss = joursRestants(v.insurance_expiry || v.assurancefin);
          return (
            <div key={v.id}>
              {jVT !== null && jVT <= 15 && (
                <div className="bg-amber-900/40 border border-amber-800 rounded-xl px-4 py-3 mb-2 text-sm text-amber-300">
                  VT {v.immat} expire {jVT <= 0 ? `depuis ${Math.abs(jVT)} jour(s)` : `dans ${jVT} jour(s)`} — Planifier la visite technique
                </div>
              )}
              {jAss !== null && jAss <= 7 && (
                <div className="bg-red-900/40 border border-red-800 rounded-xl px-4 py-3 mb-2 text-sm text-red-300 flex items-center gap-3">
                  <span>Assurance {v.immat} expire {jAss <= 0 ? `depuis ${Math.abs(jAss)} jour(s)` : `dans ${jAss} jour(s)`}</span>
                  {genCalendarUrl(v.immat, v.insurance_expiry || v.assurancefin, v.assurancenum) && (
                    <a href={genCalendarUrl(v.immat, v.insurance_expiry || v.assurancefin, v.assurancenum)}
                      target="_blank" rel="noreferrer"
                      className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shrink-0">
                      Ajouter Google Calendar
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── GRILLE VEHICULES ── */}
      <div className="flex-1 p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm">Aucun vehicule</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(v => {
              const jVT  = joursRestants(v.technical_visit_expiry || v.visiteDate);
              const jAss = joursRestants(v.insurance_expiry || v.assurancefin);
              const classes = v.service_class || v.classesService || [];
              const photo = (v.photos_ext || [])[0] || null;
              return (
                <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                  {photo && (
                    <img src={photo} alt="" className="w-full h-36 object-cover" />
                  )}
                  {!photo && (
                    <div className="w-full h-36 bg-slate-900/50 flex items-center justify-center text-slate-600 text-sm">
                      Aucune photo
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-lg text-white">{v.immat}</div>
                        <div className="text-sm text-slate-400">{v.marque} {v.modele}{v.annee ? ` · ${v.annee}` : ""}{v.vehicle_color || v.couleur ? ` · ${v.vehicle_color || v.couleur}` : ""}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_STATUS[v.status] || "bg-slate-700 text-slate-300"}`}>
                        {v.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="text-slate-500">Batterie : <span className="text-slate-200 font-medium">{v.soc || 0}%{v.battery_capacity_kwh || v.capaciteBatterie ? ` (${v.battery_capacity_kwh || v.capaciteBatterie} kWh)` : ""}</span></div>
                      <div className="text-slate-500">Contrat : <span className="text-slate-200">{v.typecontrat || v.typeContrat || "-"}</span></div>
                      <div className="text-slate-500">Service : <span className="text-blue-400">{v.service_type || v.typeService || "VTC"}</span></div>
                      {classes.length > 0 && <div className="text-slate-500">Classes : <span className="text-violet-400">{classes.join(", ")}</span></div>}
                    </div>

                    {/* Barres SOC */}
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full ${(v.soc || 0) > 50 ? "bg-green-400" : (v.soc || 0) > 20 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${v.soc || 0}%` }} />
                    </div>

                    {jVT !== null && jVT <= 15 && (
                      <div className="bg-amber-900/40 rounded-lg px-3 py-1.5 text-xs text-amber-300 mb-2">
                        VT expire {jVT <= 0 ? `depuis ${Math.abs(jVT)}j` : `dans ${jVT}j`}
                      </div>
                    )}
                    {jAss !== null && jAss <= 7 && (
                      <div className="bg-red-900/40 rounded-lg px-3 py-1.5 text-xs text-red-300 mb-2">
                        Assurance expire {jAss <= 0 ? `depuis ${Math.abs(jAss)}j` : `dans ${jAss}j`}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(v)}
                        className="flex-1 text-xs border border-blue-800 text-blue-400 py-2 rounded-lg hover:bg-blue-900/30 font-medium">
                        Modifier
                      </button>
                      <button onClick={() => setConfirmDelete(v)}
                        className="text-xs border border-red-800 text-red-400 px-3 py-2 rounded-lg hover:bg-red-900/30">
                        Suppr.
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center p-6 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl p-7 my-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                {editItem ? `Modifier · ${form.immat}` : "Nouveau vehicule"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 flex-wrap mb-6">
              {ONGLETS.map(o => (
                <button key={o.id} onClick={() => setOnglet(o.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${onglet === o.id ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:text-slate-200"}`}>
                  {o.label}
                </button>
              ))}
            </div>

            {/* ── IDENTITE ── */}
            {onglet === "identite" && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Identification</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={LBL}>Immatriculation *</label>
                    <input className={INP} value={form.immat} onChange={hi("immat")} placeholder="AB 1234 CD" />
                  </div>
                  <div>
                    <label className={LBL}>Marque</label>
                    <select className={INP} value={form.marque} onChange={hi("marque")}>
                      <option value="">-- Choisir --</option>
                      {MARQUES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LBL}>Modele</label>
                    <input className={INP} value={form.modele} onChange={hi("modele")} />
                  </div>
                  <div>
                    <label className={LBL}>Couleur</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COULEURS.map(c => (
                        <button key={c} type="button" onClick={() => setForm(f => ({ ...f, couleur: c }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${form.couleur === c ? "bg-blue-600 text-white border-blue-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-600"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={LBL}>Annee</label>
                    <input className={INP} type="number" value={form.annee} onChange={e => setForm(f => ({ ...f, annee: parseInt(e.target.value) || new Date().getFullYear() }))} />
                  </div>
                  <div>
                    <label className={LBL}>Classe vehicule</label>
                    <input className={INP} value={form.modele} onChange={hi("classe")} placeholder="Berline, SUV..." />
                  </div>
                  <div>
                    <label className={LBL}>Capacite batterie (kWh)</label>
                    <input className={INP} type="number" step="0.1" value={form.capaciteBatterie} onChange={e => setForm(f => ({ ...f, capaciteBatterie: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className={LBL}>Autonomie actuelle (%)</label>
                    <input className={INP} type="number" min="0" max="100" value={form.soc} onChange={e => setForm(f => ({ ...f, soc: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className={LBL}>Kilometrage</label>
                    <input className={INP} type="number" value={form.km} onChange={e => setForm(f => ({ ...f, km: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className={LBL}>Numero VIN</label>
                    <input className={INP} value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value, numeroChassis: e.target.value }))} placeholder="17 caracteres" />
                  </div>
                  <div>
                    <label className={LBL}>Statut</label>
                    <select className={INP} value={form.status} onChange={hi("status")}>
                      {STATUTS_VEH.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LBL}>Type de contrat flotte</label>
                    <select className={INP} value={form.typeContrat} onChange={hi("typeContrat")}>
                      {TYPES_CONTRAT.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LBL}>Site</label>
                    <select className={INP} value={String(form.site)} onChange={e => setForm(f => ({ ...f, site: parseInt(e.target.value) }))}>
                      {sitesList.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {onglet === "documents" && (
              <div className="space-y-4">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                  <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">Carte grise</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LBL}>Numero carte grise</label>
                      <input className={INP} value={form.carteGriseNum} onChange={hi("carteGriseNum")} />
                    </div>
                    <div>
                      <label className={LBL}>Date d'immatriculation</label>
                      <input className={INP} type="date" value={form.carteGriseDate} onChange={hi("carteGriseDate")} />
                    </div>
                    <div className="col-span-2">
                      <label className={LBL}>Proprietaire (carte grise)</label>
                      <input className={INP} value={form.carteGriseProprietaire} onChange={hi("carteGriseProprietaire")} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <PhotoInput label="Photo carte grise" value={form.photo_carte_grise} onChange={hc("photo_carte_grise")} />
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">Visite technique</div>
                  {joursRestants(form.visiteDate) !== null && joursRestants(form.visiteDate) <= 15 && (
                    <div className="bg-amber-900/40 border border-amber-800 rounded-xl px-4 py-3 mb-3 text-sm text-amber-300">
                      Expire {joursRestants(form.visiteDate) <= 0 ? `depuis ${Math.abs(joursRestants(form.visiteDate))} jour(s)` : `dans ${joursRestants(form.visiteDate)} jour(s)`}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LBL}>Date debut VT</label>
                      <input className={INP} type="date" value={form.visiteDateDebut} onChange={hi("visiteDateDebut")} />
                    </div>
                    <div>
                      <label className={LBL}>Date expiration VT</label>
                      <input className={INP} type="date" value={form.visiteDate} onChange={hi("visiteDate")} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <PhotoInput label="Photo carte visite technique" value={form.photo_visite} onChange={hc("photo_visite")} />
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Assurance</div>
                  {joursRestants(form.assuranceFin) !== null && joursRestants(form.assuranceFin) <= 7 && (
                    <div className="bg-red-900/40 border border-red-800 rounded-xl px-4 py-3 mb-3 text-sm text-red-300">
                      Assurance expire {joursRestants(form.assuranceFin) <= 0 ? `depuis ${Math.abs(joursRestants(form.assuranceFin))} jour(s)` : `dans ${joursRestants(form.assuranceFin)} jour(s)`}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LBL}>N° assurance</label>
                      <input className={INP} value={form.assuranceNum} onChange={hi("assuranceNum")} />
                    </div>
                    <div>
                      <label className={LBL}>Date debut assurance</label>
                      <input className={INP} type="date" value={form.assuranceDebut} onChange={hi("assuranceDebut")} />
                    </div>
                    <div className="col-span-2">
                      <label className={LBL}>Date expiration assurance</label>
                      <input className={INP} type="date" value={form.assuranceFin} onChange={hi("assuranceFin")} />
                    </div>
                  </div>
                  {form.assuranceFin && (
                    <a href={genCalendarUrl(form.immat, form.assuranceFin, form.assuranceNum) || "#"}
                      target="_blank" rel="noreferrer"
                      className="inline-block mt-3 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                      Ajouter rappel Google Calendar (J-7)
                    </a>
                  )}
                  <div className="mt-4">
                    <PhotoInput label="Photo / scan assurance" value={form.photo_assurance} onChange={hc("photo_assurance")} />
                  </div>
                </div>
              </div>
            )}

            {/* ── SERVICE ── */}
            {onglet === "service" && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4">Type de service</div>
                <div className="mb-5">
                  <label className={LBL}>Type de service vehicule</label>
                  <select className={`${INP} max-w-xs`} value={form.typeService} onChange={hi("typeService")}>
                    {TYPES_SERVICE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {form.typeService === "VTC" && (
                  <div>
                    <label className={LBL}>Classes de service activees (VTC)</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CLASSES_VTC.map(cls => {
                        const selected = (form.classesService || []).includes(cls);
                        return (
                          <button key={cls} type="button"
                            onClick={() => {
                              const arr = form.classesService || [];
                              setForm(f => ({ ...f, classesService: selected ? arr.filter(c => c !== cls) : [...arr, cls] }));
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selected ? "bg-blue-600 text-white border-blue-600" : "bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-600"}`}>
                            {cls}
                          </button>
                        );
                      })}
                    </div>
                    {(form.classesService || []).length === 0 && (
                      <div className="text-amber-400 text-xs mt-2">Selectionnez au moins une classe de service</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── PHOTOS ── */}
            {onglet === "photos" && (
              <div className="space-y-4">
                <div className="bg-amber-900/40 border border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-300">
                  Les 4 photos exterieures sont obligatoires pour valider la fiche vehicule
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Exterieurs (obligatoires)</div>
                  <div className="grid grid-cols-2 gap-4">
                    <PhotoInput required label="Avant" value={form.photo_ext_avant} onChange={hc("photo_ext_avant")} />
                    <PhotoInput required label="Arriere" value={form.photo_ext_arriere} onChange={hc("photo_ext_arriere")} />
                    <PhotoInput required label="Cote gauche" value={form.photo_ext_gauche} onChange={hc("photo_ext_gauche")} />
                    <PhotoInput required label="Cote droit" value={form.photo_ext_droite} onChange={hc("photo_ext_droite")} />
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                  <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">Interieurs</div>
                  <div className="grid grid-cols-2 gap-4">
                    <PhotoInput label="Habitacle interieur" value={form.photo_interieur} onChange={hc("photo_interieur")} />
                    <PhotoInput label="Tableau de bord" value={form.photo_tableau_bord} onChange={hc("photo_tableau_bord")} />
                    <PhotoInput label="Ecran / Systeme" value={form.photo_ecran} onChange={hc("photo_ecran")} />
                    <PhotoInput label="Sieges" value={form.photo_sieges} onChange={hc("photo_sieges")} />
                  </div>
                </div>
              </div>
            )}

            {/* ── CONTRAT CLIENT ── */}
            {onglet === "contrat" && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-5">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">Contrat client (Externe)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LBL}>Nom du client</label>
                    <input className={INP} value={form.clientNom || ""} onChange={hi("clientNom")} />
                  </div>
                  <div>
                    <label className={LBL}>Montant contrat (FCFA)</label>
                    <input className={INP} type="number" value={form.montantContrat || ""} onChange={hi("montantContrat")} />
                  </div>
                  <div>
                    <label className={LBL}>Date debut contrat</label>
                    <input className={INP} type="date" value={form.dateDebutContrat || ""} onChange={hi("dateDebutContrat")} />
                  </div>
                  <div>
                    <label className={LBL}>Date fin contrat</label>
                    <input className={INP} type="date" value={form.dateFinContrat || ""} onChange={hi("dateFinContrat")} />
                  </div>
                  <div>
                    <label className={LBL}>Montant rembourse (FCFA)</label>
                    <input className={INP} type="number" value={form.montantRembourse || ""} onChange={hi("montantRembourse")} />
                  </div>
                  {form.montantContrat && form.montantRembourse && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="text-xs text-slate-500 mb-1">Restant a rembourser</div>
                      <div className="text-xl font-bold text-amber-400">
                        {(parseFloat(form.montantContrat) - parseFloat(form.montantRembourse)).toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-xl text-sm hover:bg-slate-700">
                Annuler
              </button>
              <button onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                {editItem ? "Enregistrer" : "Ajouter le vehicule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <Confirm msg={`Supprimer le vehicule ${confirmDelete.immat} ?`}
          onConfirm={async () => { await onDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};
