// PlanningPage.jsx — Easy by Saver · Dark theme Tailwind · Redesign complet
import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { Confirm } from "../components/ui/Confirm.jsx";

const SHIFTS = ["A", "B", "C"];
const TYPES_SERVICE = ["Yango", "Course privee", "Location", "Navette entreprise", "Autre"];
const CLASSES_SERVICE = ["Standard", "Comfort", "Premium", "Minibus"];
const LIEUX = [
  "Cocody - Riviera", "Cocody - 2 Plateaux", "Cocody - Angre", "Cocody - Attoban",
  "Plateau - Centre administratif", "Plateau - Indenié",
  "Adjame - Marche", "Adjame - 220 logements",
  "Yopougon - Sideci", "Yopougon - Selmer", "Yopougon - Keneya",
  "Marcory - Zone 4", "Marcory - Anoumabo",
  "Treichville - Zone industrielle",
  "Abobo - Gare", "Abobo - Avocatier",
  "Port-Bouet - Aeroport", "Port-Bouet - Vridi",
  "Bingerville", "Grand-Bassam", "Depot SAVER Cocody", "Depot SAVER Yopougon"
];
const STATUTS = ["Planifie", "En cours", "Termine", "Annule"];

const BADGE_STATUT = {
  "Planifie":  "bg-blue-900/60 text-blue-400 border border-blue-800",
  "En cours":  "bg-green-900/60 text-green-400 border border-green-800",
  "Termine":   "bg-slate-700 text-slate-400 border border-slate-600",
  "Annule":    "bg-red-900/60 text-red-400 border border-red-800",
};

function genWhatsApp(numero, sh, chauffeur, vehicule) {
  if (!numero) return null;
  const clean = numero.replace(/\D/g, "");
  const ci = clean.startsWith("225") ? clean : "225" + clean;
  const msg = `Bonjour ${chauffeur?.prenom || ""} ${chauffeur?.nom || ""},\n\nVotre shift est planifie :\n- Date : ${sh.planned_start_date || sh.date || ""}\n- Shift : ${sh.type || ""}\n- Heure debut : ${sh.debut || ""}\n- Vehicule : ${vehicule?.immat || sh.vh || ""}\n- Lieu de debut : ${sh.lieuDebut || ""}\n\nMerci d'etre pret a l'heure.\nEquipe SAVER`;
  return "https://wa.me/" + ci + "?text=" + encodeURIComponent(msg);
}

function PhotoInputMulti({ label, value, onChange }) {
  function handle(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const readers = files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(results => {
      const existing = Array.isArray(value) ? value : [];
      onChange([...existing, ...results]);
    });
  }
  const imgs = Array.isArray(value) ? value : [];
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input type="file" accept="image/*" multiple onChange={handle} className="text-slate-400 text-sm w-full" />
      {imgs.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {imgs.map((src, i) => (
            <img key={i} src={src} alt="" className="h-14 w-20 object-cover rounded-lg border border-slate-600 cursor-pointer"
              onClick={() => window.open(src)} />
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  vh: "", ch: "", type: "A",
  planned_start_date: "", date_fin: "",
  debut: "", fin: "",
  shift_type: "Shift A",
  status: "Planifie",
  type_service: "Yango",
  classe_service: "Standard",
  lieuDebut: "", lieuFin: "",
  responsableZone: "", responsableZoneContact: "",
  site: "",
  // En cours
  photo_selfie: null,
  commentaire_encours: "",
  // Termine (DD)
  real_start_time: "", real_end_time: "",
  km_driven: "", battery_start: "", battery_end: "",
  courses_count: "", revenue_cash: "", yango_commission: "", authorized_expenses: "", yango_rating: "",
  captures_yango: [], captures_bord: [], photos_fin_shift: [],
};

export const PlanningPage = ({ shifts = [], vehicles = [], drivers = [], onAdd, onUpdate, onDelete, sites = [] }) => {
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [alertes15min, setAlertes15min] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreChauffeur, setFiltreChauffeur] = useState("");

  // Alertes 15 min
  const verifier15min = (data) => {
    const now = new Date();
    const retards = data.filter(p => {
      if ((p.status !== "Planifie" && p.status !== "Planifié") || !p.debut || !p.planned_start_date) return false;
      const prevu = new Date((p.planned_start_date || "").slice(0, 10) + "T" + p.debut);
      const diff = (now - prevu) / 60000;
      return diff >= 15;
    });
    setAlertes15min(retards);
  };

  useEffect(() => {
    verifier15min(shifts);
    const interval = setInterval(() => verifier15min(shifts), 60000);
    return () => clearInterval(interval);
  }, [shifts]);

  const openAdd = () => {
    setForm({ ...emptyForm, planned_start_date: new Date().toISOString().slice(0, 10) });
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (sh) => {
    setForm({
      ...emptyForm, ...sh,
      type: sh.type || (sh.shift_type || "A").replace("Shift ", ""),
      planned_start_date: (sh.planned_start_date || sh.date || "").slice(0, 10),
      lieuDebut: sh.lieuDebut || "",
      lieuFin: sh.lieuFin || "",
      responsableZone: sh.responsableZone || "",
      responsableZoneContact: sh.responsableZoneContact || "",
      photo_selfie: sh.photo_selfie || null,
      commentaire_encours: sh.commentaire_encours || "",
      captures_yango: sh.captures_yango || [],
      captures_bord: sh.captures_bord || [],
      photos_fin_shift: sh.photos_fin_shift || [],
    });
    setEditItem(sh);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.vh) return alert("Vehicule obligatoire");
    if (!form.planned_start_date) return alert("Date de debut obligatoire");
    if ((form.status === "En cours") && !form.photo_selfie) return alert("Photo selfie prise de poste obligatoire");
    const payload = {
      vh: form.vh, ch: form.ch || null,
      type: form.type, shift_type: "Shift " + form.type,
      planned_start_date: form.planned_start_date,
      debut: form.debut || null, fin: form.fin || null,
      status: form.status || "Planifie",
      lieuDebut: form.lieuDebut || null,
      lieuFin: form.lieuFin || null,
      responsableZone: form.responsableZone || null,
      responsableZoneContact: form.responsableZoneContact || null,
      site: form.site || null,
      photo_selfie: form.photo_selfie || null,
      commentaire_encours: form.commentaire_encours || null,
      real_start_time: form.real_start_time || null,
      real_end_time: form.real_end_time || null,
      km_driven: form.km_driven ? parseInt(form.km_driven) : 0,
      battery_start: form.battery_start ? parseInt(form.battery_start) : 0,
      battery_end: form.battery_end ? parseInt(form.battery_end) : 0,
      courses_count: form.courses_count ? parseInt(form.courses_count) : 0,
      revenue_cash: form.revenue_cash ? parseInt(form.revenue_cash) : 0,
      recette: form.revenue_cash ? parseInt(form.revenue_cash) : 0,
      yango_commission: form.yango_commission ? parseInt(form.yango_commission) : 0,
      authorized_expenses: form.authorized_expenses ? parseInt(form.authorized_expenses) : 0,
      yango_rating: form.yango_rating ? parseFloat(form.yango_rating) : 0,
      captures_yango: form.captures_yango || [],
      captures_bord: form.captures_bord || [],
      photos_fin_shift: form.photos_fin_shift || [],
    };
    if (editItem) {
      const { error } = await supabase.from("shifts").update(payload).eq("id", editItem.id);
      if (!error) onUpdate && onUpdate(editItem.id, payload);
    } else {
      await onAdd({ ...payload, id: "SH-" + Date.now() });
    }
    // WhatsApp auto si chauffeur a un contact
    if (!editItem && form.ch && form.status === "Planifie") {
      const chauffeur = drivers.find(d => d.id === form.ch);
      const vehicule  = vehicles.find(v => v.id === form.vh);
      if (chauffeur?.telephone) {
        const url = genWhatsApp(chauffeur.telephone, form, chauffeur, vehicule);
        if (url) window.open(url, "_blank");
      }
    }
    setShowModal(false);
  };

  const filtered = shifts.filter(sh => {
    if (filtreStatut && sh.status !== filtreStatut) return false;
    if (filtreChauffeur && sh.ch !== filtreChauffeur) return false;
    return true;
  });

  const chaufSelected = drivers.find(d => d.id === form.ch);
  const vehSelected   = vehicles.find(v => v.id === form.vh);

  const INP = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500";
  const LBL = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
  const SEC = "bg-slate-900/50 border border-slate-700 rounded-xl p-5 mb-4";

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── HEADER ── */}
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Planning des shifts</h1>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} shift(s)</p>
        </div>
        <button onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          + Nouveau shift
        </button>
      </div>

      <div className="px-6 pt-4">
        {/* ── ALERTES 15 MIN ── */}
        {alertes15min.length > 0 && (
          <div className="bg-red-900/40 border border-red-800 rounded-xl px-5 py-4 mb-4">
            <div className="text-red-300 font-bold text-sm mb-2">
              ALERTE — {alertes15min.length} shift(s) planifie(s) non demarre(s) apres 15 min
            </div>
            {alertes15min.map(p => {
              const dr = drivers.find(d => d.id === p.ch);
              return (
                <div key={p.id} className="text-red-300 text-xs mb-1 flex items-center gap-3">
                  <span>· {dr ? `${dr.prenom} ${dr.nom}` : p.ch} — shift {p.type} prevu a {p.debut} — Vehicule {vehicles.find(v => v.id === p.vh)?.immat || p.vh}</span>
                  {p.responsableZoneContact && (
                    <a href={`https://wa.me/225${p.responsableZoneContact.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                      className="bg-green-700 hover:bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-semibold shrink-0">
                      Alerter WhatsApp
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── FILTRES ── */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Statut</label>
            <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">
              <option value="">Tous</option>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chauffeur</label>
            <select value={filtreChauffeur} onChange={e => setFiltreChauffeur(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">
              <option value="">Tous</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.prenom} {d.nom}</option>)}
            </select>
          </div>
          {(filtreStatut || filtreChauffeur) && (
            <button onClick={() => { setFiltreStatut(""); setFiltreChauffeur(""); }}
              className="text-xs text-red-400 border border-red-800 px-3 py-2 rounded-lg hover:bg-red-900/20">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="flex-1 px-6 pb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40">
                {["Date", "Chauffeur", "Vehicule", "Shift", "Heures", "Lieu debut", "Responsable", "Statut", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 text-sm">Aucun shift</td></tr>
              )}
              {filtered.map(sh => {
                const chauffeur = drivers.find(d => d.id === sh.ch);
                const vehicule  = vehicles.find(v => v.id === sh.vh);
                const waUrl     = chauffeur?.telephone ? genWhatsApp(chauffeur.telephone, sh, chauffeur, vehicule) : null;
                const shiftColor = sh.type === "A" ? "text-blue-400" : sh.type === "B" ? "text-violet-400" : "text-slate-300";
                return (
                  <tr key={sh.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200">{sh.planned_start_date ? new Date(sh.planned_start_date).toLocaleDateString("fr-FR") : "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : "-"}</div>
                      {chauffeur?.driver_code && <div className="text-[11px] text-slate-500">{chauffeur.driver_code}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{vehicule?.immat || sh.vh || "-"}</td>
                    <td className={`px-4 py-3 font-bold text-lg ${shiftColor}`}>{sh.type || "-"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{sh.debut || "-"} → {sh.fin || "-"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{sh.lieuDebut || "-"}</td>
                    <td className="px-4 py-3 text-xs">
                      {sh.responsableZone && <div className="font-semibold text-slate-300">{sh.responsableZone}</div>}
                      {sh.responsableZoneContact && <div className="text-slate-500">{sh.responsableZoneContact}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${BADGE_STATUT[sh.status] || "bg-slate-700 text-slate-400"}`}>
                        {sh.status || "Planifie"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => openEdit(sh)}
                          className="text-[11px] text-blue-400 border border-blue-800 px-2 py-1 rounded-lg hover:bg-blue-900/30">
                          Modifier
                        </button>
                        {waUrl && (
                          <a href={waUrl} target="_blank" rel="noreferrer"
                            className="text-[11px] text-green-400 border border-green-800 px-2 py-1 rounded-lg hover:bg-green-900/30">
                            WhatsApp
                          </a>
                        )}
                        <button onClick={() => setConfirmDelete(sh)}
                          className="text-[11px] text-red-400 border border-red-800 px-2 py-1 rounded-lg hover:bg-red-900/30">
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-start justify-center p-6 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl p-7 my-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">{editItem ? "Modifier le shift" : "Nouveau shift"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            {/* Periode */}
            <div className={SEC}>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Periode de programmation</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Date de debut *</label>
                  <input className={INP} type="date" value={form.planned_start_date} onChange={e => setForm(f => ({ ...f, planned_start_date: e.target.value }))} />
                </div>
                <div>
                  <label className={LBL}>Date de fin</label>
                  <input className={INP} type="date" value={form.date_fin || ""} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Affectation */}
            <div className={SEC}>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Affectation</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Vehicule *</label>
                  <select className={INP} value={form.vh} onChange={e => setForm(f => ({ ...f, vh: e.target.value }))}>
                    <option value="">-- Choisir --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.immat} · {v.marque} {v.modele}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Chauffeur</label>
                  <select className={INP} value={form.ch} onChange={e => setForm(f => ({ ...f, ch: e.target.value }))}>
                    <option value="">-- Choisir --</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_code || d.matricule} · {d.prenom} {d.nom}</option>)}
                  </select>
                </div>
                {chaufSelected && (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400">
                    Matricule : <span className="text-slate-200 font-bold">{chaufSelected.driver_code || chaufSelected.matricule}</span><br />
                    Tel : {chaufSelected.telephone || "non renseigne"}
                  </div>
                )}
                <div>
                  <label className={LBL}>Shift</label>
                  <select className={INP} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, shift_type: "Shift " + e.target.value }))}>
                    {SHIFTS.map(s => <option key={s} value={s}>Shift {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Heure debut prevue</label>
                  <input className={INP} type="time" value={form.debut} onChange={e => setForm(f => ({ ...f, debut: e.target.value }))} />
                </div>
                <div>
                  <label className={LBL}>Heure fin prevue</label>
                  <input className={INP} type="time" value={form.fin} onChange={e => setForm(f => ({ ...f, fin: e.target.value }))} />
                </div>
                <div>
                  <label className={LBL}>Type de service</label>
                  <select className={INP} value={form.type_service || "Yango"} onChange={e => setForm(f => ({ ...f, type_service: e.target.value }))}>
                    {TYPES_SERVICE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Classe</label>
                  <select className={INP} value={form.classe_service || "Standard"} onChange={e => setForm(f => ({ ...f, classe_service: e.target.value }))}>
                    {CLASSES_SERVICE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Lieux */}
            <div className={SEC}>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Lieux</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Lieu de debut de shift</label>
                  <select className={INP} value={form.lieuDebut} onChange={e => setForm(f => ({ ...f, lieuDebut: e.target.value }))}>
                    <option value="">-- Choisir --</option>
                    {LIEUX.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Lieu de fin de shift</label>
                  <select className={INP} value={form.lieuFin} onChange={e => setForm(f => ({ ...f, lieuFin: e.target.value }))}>
                    <option value="">-- Choisir --</option>
                    {LIEUX.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Site / Depot</label>
                  <input className={INP} value={form.site || ""} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Responsable */}
            <div className={SEC}>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Responsable de zone</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Nom du responsable</label>
                  <input className={INP} value={form.responsableZone} onChange={e => setForm(f => ({ ...f, responsableZone: e.target.value }))} placeholder="Nom complet" />
                </div>
                <div>
                  <label className={LBL}>Contact (pour WhatsApp alerte)</label>
                  <input className={INP} value={form.responsableZoneContact} onChange={e => setForm(f => ({ ...f, responsableZoneContact: e.target.value }))} placeholder="07 XX XX XX XX" />
                </div>
              </div>
            </div>

            {/* Statut */}
            <div className={SEC}>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Statut du shift</div>
              <div className="max-w-xs">
                <label className={LBL}>Statut</label>
                <select className={INP} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* En cours */}
            {form.status === "En cours" && (
              <div className="bg-green-900/20 border border-green-800 rounded-xl p-5 mb-4">
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4">Shift en cours</div>
                <div className="mb-4">
                  <label className={LBL}>Photo selfie prise de poste (chauffeur devant le vehicule) *</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = () => setForm(f => ({ ...f, photo_selfie: r.result }));
                    r.readAsDataURL(file);
                  }} className="text-slate-400 text-sm w-full mb-2" />
                  {form.photo_selfie && (
                    <img src={form.photo_selfie} alt="" className="h-16 w-24 object-cover rounded-lg border border-slate-600 cursor-pointer mt-1"
                      onClick={() => window.open(form.photo_selfie)} />
                  )}
                  {!form.photo_selfie && (
                    <div className="text-red-400 text-xs mt-1">Obligatoire avant de valider</div>
                  )}
                </div>
                <div>
                  <label className={LBL}>Commentaires en cours de shift</label>
                  <textarea value={form.commentaire_encours} onChange={e => setForm(f => ({ ...f, commentaire_encours: e.target.value }))}
                    rows={3} className={`${INP} resize-vertical`} placeholder="Observations, incidents, remarques..." />
                </div>
              </div>
            )}

            {/* Termine — DD */}
            {form.status === "Termine" && (
              <div className="bg-slate-900/50 border border-slate-600 rounded-xl p-5 mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Driving Data (DD) — Shift termine</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Heure debut reelle", "real_start_time", "time"],
                    ["Heure fin reelle", "real_end_time", "time"],
                    ["Km parcourus", "km_driven", "number"],
                    ["Autonomie debut (%)", "battery_start", "number"],
                    ["Autonomie fin (%)", "battery_end", "number"],
                    ["Nb courses", "courses_count", "number"],
                    ["Revenus generes (FCFA)", "revenue_cash", "number"],
                    ["Commission Yango (FCFA)", "yango_commission", "number"],
                    ["Depenses autorisees (FCFA)", "authorized_expenses", "number"],
                    ["Note Yango (/5)", "yango_rating", "number"],
                  ].map(([lbl, key, type]) => (
                    <div key={key}>
                      <label className={LBL}>{lbl}</label>
                      <input className={INP} type={type} step={type === "number" && key === "yango_rating" ? "0.1" : undefined}
                        value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <PhotoInputMulti label="Photos / Captures DD" value={form.captures_bord} onChange={v => setForm(f => ({ ...f, captures_bord: v }))} />
                  <PhotoInputMulti label="Photos fin de shift (etat vehicule 4 cotes)" value={form.photos_fin_shift} onChange={v => setForm(f => ({ ...f, photos_fin_shift: v }))} />
                </div>
              </div>
            )}

            {/* WhatsApp preview */}
            {chaufSelected?.telephone && form.status === "Planifie" && (
              <div className="bg-green-950 border border-green-800 rounded-xl p-5 mb-4">
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Message WhatsApp (envoi automatique a la creation)</div>
                <div className="text-xs text-slate-400 mb-3">
                  Destinataire : <span className="text-slate-200">{chaufSelected.prenom} {chaufSelected.nom} — {chaufSelected.telephone}</span>
                </div>
                <a href={genWhatsApp(chaufSelected.telephone, form, chaufSelected, vehSelected) || "#"} target="_blank" rel="noreferrer"
                  className="inline-block bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                  Tester le message WhatsApp
                </a>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-xl text-sm hover:bg-slate-700">
                Annuler
              </button>
              <button onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">
                {editItem ? "Enregistrer les modifications" : "Creer le shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <Confirm msg="Supprimer ce shift ?"
          onConfirm={async () => { await onDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};
