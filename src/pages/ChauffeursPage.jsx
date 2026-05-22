l
import { useState } from "react";
import { Modal }   from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input }   from "../components/ui/Input.jsx";
import { Select }  from "../components/ui/Select.jsx";
import { fmt }     from "../utils/formatters.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

const docStatus = (dateStr) => {
  const d = daysUntil(dateStr);
  if (d === null)  return { cls: "bg-slate-700 text-slate-400",             label: "Manquant" };
  if (d < 0)       return { cls: "bg-red-900/60 text-red-400 border border-red-800",   label: "Expiré" };
  if (d <= 30)     return { cls: "bg-amber-900/60 text-amber-400 border border-amber-800", label: `${d}j` };
  return           { cls: "bg-green-900/60 text-green-400 border border-green-800",    label: "OK" };
};

const shiftColors = {
  A: "bg-blue-900/60 text-blue-400 border border-blue-800",
  B: "bg-violet-900/60 text-violet-400 border border-violet-800",
  C: "bg-slate-700 text-slate-300",
};

const statusColors = {
  Actif:     "bg-green-900/60 text-green-400 border border-green-800",
  Suspendu:  "bg-amber-900/60 text-amber-400 border border-amber-800",
  Inactif:   "bg-red-900/60 text-red-400 border border-red-800",
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export const ChauffeursPage = ({ drivers = [], vehicles = [], onAdd, onUpdate, onDelete, sites = [] }) => {
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [selected,      setSelected]      = useState(null);   // id chauffeur sélectionné
  const [activeTab,     setActiveTab]     = useState("profil");
  const [showModal,     setShowModal]     = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const sitesList = sites.length > 0 ? sites : [{ id: 1, name: "Abidjan" }, { id: 2, name: "Yamoussoukro" }];

  const filtered = drivers
    .filter(d => !search || `${d.prenom} ${d.nom}`.toLowerCase().includes(search.toLowerCase()))
    .filter(d => filterStatus === "all" || d.status === filterStatus);

  const detail = selected ? drivers.find(d => d.id === selected) : null;

  // ─── FORMULAIRE ─────────────────────────────────────────────────────────────
  const emptyForm = {
    nom: "", prenom: "", site: 1, vehicule: "", shift: "A", status: "Actif",
    kpi: 80, courses: 0, ca: 0, pen: 0, avance: 0, typeContrat: "Salarie",
    telephone: "", telephonePerso: "", adresse: "", contactUrgence: "", contactUrgenceTel: "",
    permisNum: "", permisDelivrance: "", permisExpiration: "", permisType: "",
    pieceType: "CNI", pieceNum: "", pieceDelivrance: "", pieceExpiration: "",
    noteYango: 4.0, noteInterne: 80, commentaires: "", dettes: 0, detteCommentaire: "", matricule: "",
  };
  const [form, setForm] = useState(emptyForm);
  const F = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const genMatricule = (prenom, nom) => {
    const base = ((nom || "X")[0] + (prenom || "X")[0]).toUpperCase();
    const count = drivers.filter(d => (d.driver_code || "").startsWith(base)).length + 1;
    return base + "-" + String(count).padStart(2, "0");
  };

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setActiveTab("profil"); setShowModal(true); };
  const openEdit = (d) => {
    setForm({
      ...emptyForm, ...d,
      permisNum:       d.license_number        || d.permisNum       || "",
      permisExpiration: d.license_expiry_date  || d.permisExpiration || "",
      permisType:      d.permistype            || d.permisType       || "",
      permisDelivrance: d.permisdelivrance     || d.permisDelivrance || "",
      pieceNum:        d.id_card_number        || d.pieceNum         || "",
      pieceExpiration: d.id_card_expiry_date   || d.pieceExpiration  || "",
      pieceType:       d.piecetype             || d.pieceType        || "CNI",
      pieceDelivrance: d.piecedelivrance       || d.pieceDelivrance  || "",
      typeContrat:     d.contract_type         || d.typeContrat      || "Salarie",
      noteYango:       parseFloat(d.yango_score || d.noteYango       || 4.0),
      noteInterne:     parseInt(d.internal_score || d.noteInterne    || 80),
      matricule:       d.driver_code           || d.matricule        || "",
      telephonePerso:  d.telephoneperso        || d.telephonePerso   || "",
      contactUrgence:  d.emergency_contact?.split(" - ")[0]?.trim() || d.contactUrgence || "",
      contactUrgenceTel: d.contacturgencetel || d.emergency_contact?.split(" - ")[1]?.trim() || d.contactUrgenceTel || "",
    });
    setEditItem(d); setActiveTab("profil"); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom || !form.prenom) return;
    const mat = form.matricule || genMatricule(form.prenom, form.nom);
    const payload = {
      nom: form.nom, prenom: form.prenom, site: form.site, vehicule: form.vehicule || null,
      shift: form.shift, status: form.status, kpi: form.kpi, courses: form.courses,
      ca: form.ca, pen: form.pen, avance: form.avance, driver_code: mat,
      contract_type: form.typeContrat, telephone: form.telephone || null,
      telephoneperso: form.telephonePerso || null, adresse: form.adresse || null,
      emergency_contact: `${form.contactUrgence} - ${form.contactUrgenceTel}`,
      contacturgencetel: form.contactUrgenceTel || null,
      license_number: form.permisNum || null, license_expiry_date: form.permisExpiration || null,
      id_card_number: form.pieceNum || null, id_card_expiry_date: form.pieceExpiration || null,
      permistype: form.permisType || null, permisdelivrance: form.permisDelivrance || null,
      piecetype: form.pieceType, piecedelivrance: form.pieceDelivrance || null,
      yango_score: form.noteYango, internal_score: form.noteInterne,
      commentaires: form.commentaires || null,
      dettes: form.dettes, dettecommentaire: form.detteCommentaire || null,
    };
    if (editItem) await onUpdate(editItem.id, payload);
    else          await onAdd({ ...payload, id: "CH-" + Date.now() });
    setShowModal(false);
  };

  const TABS = [
    { id: "profil", label: "Profil" },
    { id: "kyc",    label: "KYC & Documents" },
    { id: "perf",   label: "Performance" },
    { id: "creance",label: "Créance" },
  ];

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-slate-900 text-slate-100 gap-0" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── PANNEAU GAUCHE : LISTE ───────────────────────────────────────── */}
      <div className="w-80 shrink-0 border-r border-slate-700 flex flex-col bg-slate-900">

        {/* Header liste */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold text-white text-sm">Chauffeurs</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{filtered.length} résultat(s) · {drivers.filter(d => d.status === "Actif").length} actifs</div>
            </div>
            <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              + Ajouter
            </button>
          </div>
          {/* Recherche */}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-2"
          />
          {/* Filtres statut */}
          <div className="flex gap-1">
            {[["all","Tous"], ["Actif","Actif"], ["Suspendu","Susp."], ["Inactif","Inactif"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-all ${filterStatus === v ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">Aucun chauffeur</div>
          )}
          {filtered.map(d => {
            const mat  = d.driver_code || d.matricule || "—";
            const vh   = vehicles.find(v => v.id === d.vehicule);
            const isSelected = selected === d.id;
            const permisAlert = daysUntil(d.license_expiry_date || d.permisExpiration);
            const pieceAlert  = daysUntil(d.id_card_expiry_date  || d.pieceExpiration);
            const hasAlert    = (permisAlert !== null && permisAlert <= 30) || (pieceAlert !== null && pieceAlert <= 30);

            return (
              <div
                key={d.id}
                onClick={() => { setSelected(d.id); setActiveTab("profil"); }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-800 transition-all ${isSelected ? "bg-blue-900/30 border-l-2 border-l-blue-500 pl-3.5" : "hover:bg-slate-800/50"}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                  {(d.prenom || "?")[0]}{(d.nom || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{d.prenom} {d.nom}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{mat} · {vh?.immat || "Sans véhicule"}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColors[d.status] || "bg-slate-700 text-slate-400"}`}>{d.status}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${shiftColors[d.shift] || "bg-slate-700 text-slate-300"}`}>Sh. {d.shift}</span>
                </div>
                {hasAlert && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PANNEAU DROIT : DETAIL ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-900">
        {!detail ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Sélectionne un chauffeur pour voir son profil
          </div>
        ) : (
          <DetailPanel
            d={detail} vehicles={vehicles} sitesList={sitesList}
            activeTab={activeTab} setActiveTab={setActiveTab}
            TABS={TABS} onEdit={() => openEdit(detail)} onDelete={() => setConfirmDelete(detail)}
          />
        )}
      </div>

      {/* ── MODAL AJOUT / MODIFICATION ──────────────────────────────────── */}
      {showModal && (
        <Modal
          title={editItem ? "Modifier chauffeur" : "Ajouter chauffeur"}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-slate-300 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold">{editItem ? "Enregistrer" : "Ajouter"}</button>
            </>
          }
        >
          {/* Tabs modal */}
          <div className="flex gap-1 border-b border-slate-700 mb-4 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap ${activeTab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "profil" && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nom *"    value={form.nom}    onChange={F("nom")}    required />
              <Input label="Prénom *" value={form.prenom} onChange={F("prenom")} required />
              <Input label="Matricule (auto)" value={form.matricule || genMatricule(form.prenom || "X", form.nom || "X")} onChange={F("matricule")} />
              <Select label="Type contrat" value={form.typeContrat} onChange={F("typeContrat")} options={["Salarie", "Prestataire a l essai", "Freelance"]} />
              <Select label="Site" value={String(form.site)} onChange={v => setForm(f => ({ ...f, site: parseInt(v) }))} options={sitesList.map(s => ({ value: String(s.id), label: s.name }))} />
              <Select label="Shift" value={form.shift} onChange={F("shift")} options={[{ value: "A", label: "Shift A (06h-14h)" }, { value: "B", label: "Shift B (15h-23h)" }, { value: "C", label: "Shift C (22h-06h)" }]} />
              <Select label="Statut" value={form.status} onChange={F("status")} options={["Actif", "Suspendu", "Inactif"]} />
              <Select label="Véhicule" value={form.vehicule} onChange={F("vehicule")} options={[{ value: "", label: "-- Choisir --" }, ...vehicles.map(v => ({ value: v.id, label: v.immat }))]} />
              <Input label="Tel. travail"  value={form.telephone}      onChange={F("telephone")}      placeholder="+225..." />
              <Input label="Tel. perso"    value={form.telephonePerso} onChange={F("telephonePerso")} />
              <div className="col-span-2"><Input label="Adresse" value={form.adresse} onChange={F("adresse")} placeholder="Commune, quartier" /></div>
              <Input label="Contact urgence 1" value={form.contactUrgence}    onChange={F("contactUrgence")}    placeholder="+225..." />
              <Input label="Contact urgence 2" value={form.contactUrgenceTel} onChange={F("contactUrgenceTel")} placeholder="+225..." />
            </div>
          )}

          {activeTab === "kyc" && (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Permis de conduire</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="N° Permis"       value={form.permisNum}        onChange={F("permisNum")} />
                  <Input label="Type"             value={form.permisType}       onChange={F("permisType")}       placeholder="B, D..." />
                  <Input label="Date délivrance"  value={form.permisDelivrance} onChange={F("permisDelivrance")} type="date" />
                  <Input label="Expiration"       value={form.permisExpiration} onChange={F("permisExpiration")} type="date" hint="alerte 30j" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pièce d'identité</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Type"            value={form.pieceType}       onChange={F("pieceType")}       options={["CNI", "Passeport", "Titre sejour"]} />
                  <Input  label="N° Pièce"         value={form.pieceNum}        onChange={F("pieceNum")} />
                  <Input  label="Date délivrance"  value={form.pieceDelivrance} onChange={F("pieceDelivrance")} type="date" />
                  <Input  label="Expiration"       value={form.pieceExpiration} onChange={F("pieceExpiration")} type="date" hint="alerte 30j" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "perf" && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Note Yango (/5)"    value={form.noteYango}   onChange={v => setForm(f => ({ ...f, noteYango: parseFloat(v) || 0 }))}   type="number" />
              <Input label="KPI Interne (0-100)" value={form.kpi}        onChange={v => setForm(f => ({ ...f, kpi: parseInt(v) || 80 }))}          type="number" />
              <Input label="Courses"            value={form.courses}     onChange={v => setForm(f => ({ ...f, courses: parseInt(v) || 0 }))}       type="number" />
              <Input label="CA (FCFA)"          value={form.ca}          onChange={v => setForm(f => ({ ...f, ca: parseInt(v) || 0 }))}            type="number" />
              <Input label="Pénalités"          value={form.pen}         onChange={v => setForm(f => ({ ...f, pen: parseInt(v) || 0 }))}           type="number" />
              <Input label="Avance en cours"    value={form.avance}      onChange={v => setForm(f => ({ ...f, avance: parseInt(v) || 0 }))}        type="number" />
            </div>
          )}

          {activeTab === "creance" && (
            <div className="space-y-3">
              <Input label="Solde dettes (FCFA)" value={form.dettes || 0}         onChange={v => setForm(f => ({ ...f, dettes: parseInt(v) || 0 }))}  type="number" />
              <Input label="Détail dette"         value={form.detteCommentaire || ""} onChange={F("detteCommentaire")} placeholder="Ex: manquant du 01/04..." />
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Commentaires</label>
                <textarea value={form.commentaires || ""} onChange={e => setForm(f => ({ ...f, commentaires: e.target.value }))} rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          )}
        </Modal>
      )}

      {confirmDelete && (
        <Confirm
          msg={`Supprimer ${confirmDelete.prenom} ${confirmDelete.nom} ?`}
          onConfirm={async () => { await onDelete(confirmDelete.id); setConfirmDelete(null); setSelected(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

// ─── SOUS-COMPOSANT : PANNEAU DETAIL ─────────────────────────────────────────
const DetailPanel = ({ d, vehicles, sitesList, activeTab, setActiveTab, TABS, onEdit, onDelete }) => {
  const mat   = d.driver_code || d.matricule || d.id;
  const vh    = vehicles.find(v => v.id === d.vehicule);
  const site  = sitesList.find(s => s.id === d.site || String(s.id) === String(d.site))?.name || "—";

  const permisExp = d.license_expiry_date || d.permisExpiration;
  const pieceExp  = d.id_card_expiry_date  || d.pieceExpiration;
  const pDS = docStatus(permisExp);
  const iDS = docStatus(pieceExp);

  return (
    <div className="p-6 space-y-5">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-xl bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300 shrink-0">
              {(d.prenom || "?")[0]}{(d.nom || "?")[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{d.prenom} {d.nom}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{mat}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[d.status] || "bg-slate-700 text-slate-400"}`}>{d.status}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shiftColors[d.shift] || "bg-slate-700 text-slate-300"}`}>Shift {d.shift}</span>
                <span className="text-[10px] text-slate-500">{d.contract_type || d.typeContrat || "Salarié"}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{site} {vh && `· ${vh.immat}`}</div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onEdit}   className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold">Modifier</button>
            <button onClick={onDelete} className="text-xs bg-red-900/60 hover:bg-red-900/80 text-red-400 px-3 py-1.5 rounded-lg border border-red-800">Supprimer</button>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            ["Note Yango", d.yango_score || d.noteYango || "—", "text-amber-400"],
            ["KPI Interne", (d.internal_score || d.kpi || 0) + "%", "text-blue-400"],
            ["Courses",     (d.courses || 0).toLocaleString(), "text-white"],
            ["CA (FCFA)",   fmt(d.ca || 0), "text-green-400"],
          ].map(([lbl, val, col]) => (
            <div key={lbl} className="bg-slate-900/60 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold ${col}`}>{val}</div>
              <div className="text-[10px] text-slate-500 mt-1">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-all ${activeTab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── PROFIL ──────────────────────────────────────────────────── */}
          {activeTab === "profil" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["Téléphone travail",  d.telephone],
                ["Téléphone perso",    d.telephoneperso || d.telephonePerso],
                ["Adresse",            d.adresse],
                ["Contact urgence 1",  d.emergency_contact?.split(" - ")[0] || d.contactUrgence],
                ["Contact urgence 2",  d.contacturgencetel || d.contactUrgenceTel],
                ["Type de contrat",    d.contract_type || d.typeContrat],
                ["Véhicule assigné",   vh?.immat || "—"],
                ["Site",               site],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider w-32 shrink-0 mt-0.5">{l}</span>
                  <span className="text-sm text-slate-200 font-medium">{v || "—"}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── KYC ─────────────────────────────────────────────────────── */}
          {activeTab === "kyc" && (
            <div className="space-y-5">
              {/* Validité documents */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Permis de conduire</div>
                  {[
                    ["Numéro",      d.license_number    || d.permisNum],
                    ["Type",        d.permistype        || d.permisType],
                    ["Délivrance",  d.permisdelivrance  || d.permisDelivrance],
                    ["Expiration",  permisExp],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                      <span className="text-[11px] text-slate-500">{l}</span>
                      <span className={`text-[11px] font-semibold ${l === "Expiration" ? pDS.cls.includes("red") ? "text-red-400" : pDS.cls.includes("amber") ? "text-amber-400" : "text-slate-300" : "text-slate-300"}`}>{v || "—"}</span>
                    </div>
                  ))}
                  <div className="mt-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pDS.cls}`}>{pDS.label}</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Pièce d'identité ({d.piecetype || d.pieceType || "CNI"})
                  </div>
                  {[
                    ["Numéro",     d.id_card_number   || d.pieceNum],
                    ["Délivrance", d.piecedelivrance  || d.pieceDelivrance],
                    ["Expiration", pieceExp],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                      <span className="text-[11px] text-slate-500">{l}</span>
                      <span className="text-[11px] font-semibold text-slate-300">{v || "—"}</span>
                    </div>
                  ))}
                  <div className="mt-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${iDS.cls}`}>{iDS.label}</span>
                  </div>
                </div>
              </div>

              {/* Photos KYC */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Photos KYC</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Portrait",    d.photo_face    || d.photo_face_url],
                    ["Plein pied",  d.photo_plein_pied || d.photo_full_body_url],
                    ["Permis",      d.photo_permis],
                    ["Pièce ID",    d.photo_piece],
                    ["Profil G.",   Array.isArray(d.photos_profil) ? d.photos_profil[0] : null],
                    ["Profil D.",   Array.isArray(d.photos_profil) ? d.photos_profil[1] : null],
                  ].map(([label, url]) => (
                    <div key={label} className="bg-slate-900/60 border border-slate-700 rounded-lg overflow-hidden aspect-square flex flex-col">
                      {url ? (
                        <img src={url} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-1">
                            <div className="w-3 h-3 rounded-full border-2 border-slate-600" />
                          </div>
                          <span className="text-[10px]">{label}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PERFORMANCE ─────────────────────────────────────────────── */}
          {activeTab === "perf" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ["Note Yango",   d.yango_score || d.noteYango || "—", "text-amber-400",  "/5"],
                ["KPI Interne",  (d.kpi || 0) + "%",                  "text-blue-400",   ""],
                ["Courses",      (d.courses || 0).toLocaleString(),    "text-white",      ""],
                ["CA total",     fmt(d.ca || 0),                       "text-green-400",  " F"],
                ["Pénalités",    fmt(d.pen || 0),                      "text-red-400",    " F"],
                ["Avance cours", fmt(d.avance || 0),                   "text-amber-400",  " F"],
              ].map(([l, v, col, suf]) => (
                <div key={l} className="bg-slate-900/50 rounded-lg p-4 text-center">
                  <div className={`text-xl font-bold ${col}`}>{v}{suf}</div>
                  <div className="text-[10px] text-slate-500 mt-1.5">{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── CRÉANCE ─────────────────────────────────────────────────── */}
          {activeTab === "creance" && (
            <div className="space-y-3">
              <div className={`rounded-lg p-4 ${(d.dettes || 0) > 0 ? "bg-red-900/30 border border-red-800" : "bg-slate-900/50 border border-slate-700"}`}>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Solde dettes</div>
                <div className={`text-2xl font-bold ${(d.dettes || 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                  {fmt(d.dettes || 0)} FCFA
                </div>
                {(d.dettecommentaire || d.detteCommentaire) && (
                  <div className="text-xs text-slate-400 mt-2">{d.dettecommentaire || d.detteCommentaire}</div>
                )}
              </div>
              {d.commentaires && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Commentaires</div>
                  <div className="text-sm text-slate-300">{d.commentaires}</div>
                </div>
              )}
              {!(d.dettes) && !d.commentaires && (
                <div className="text-slate-500 text-sm text-center py-8">Aucune créance enregistrée</div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};