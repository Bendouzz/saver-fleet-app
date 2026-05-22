// MaintenancePage.jsx — Easy by Saver · Dark theme Tailwind
import { useState } from "react";
import { Modal }   from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input }   from "../components/ui/Input.jsx";
import { Select }  from "../components/ui/Select.jsx";
import { fmt }     from "../utils/formatters.js";

const STATUS_STYLE = {
  Planifiee:  "bg-blue-900/60 text-blue-400 border border-blue-800",
  "Planifiée":"bg-blue-900/60 text-blue-400 border border-blue-800",
  "En cours": "bg-amber-900/60 text-amber-400 border border-amber-800",
  Terminee:   "bg-green-900/60 text-green-400 border border-green-800",
  "Terminée": "bg-green-900/60 text-green-400 border border-green-800",
  Annulee:    "bg-red-900/60 text-red-400 border border-red-800",
  "Annulée":  "bg-red-900/60 text-red-400 border border-red-800",
};

const TYPE_STYLE = {
  Preventive:  { bg: "bg-blue-900/60",   text: "text-blue-400" },
  Corrective:  { bg: "bg-red-900/60",    text: "text-red-400" },
  Inspection:  { bg: "bg-amber-900/60",  text: "text-amber-400" },
};

export const MaintenancePage = ({ maintenances = [], vehicles = [], onAdd, onUpdate, onDelete }) => {
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("all");
  const [filterType,    setFilterType]    = useState("all");
  const [showModal,     setShowModal]     = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = { vh: "", type: "Preventive", desc: "", status: "Planifiee", dateDebut: "", dateFin: "", cout: 0, garage: "", factureStatus: "En attente", commentaireAnnulation: "" };
  const [form, setForm] = useState(emptyForm);
  const F = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.vh || !form.desc) return;
    const payload = {
      vh: form.vh, type: form.type || "Preventive",
      description: form.desc, status: form.status || "Planifiee",
      date: form.dateDebut || new Date().toISOString().split("T")[0],
      cout: form.cout || 0, garage: form.garage || null,
      factureStatus: form.factureStatus || null,
      commentaireAnnulation: form.commentaireAnnulation || null,
    };
    if (editItem) await onUpdate(editItem.id, payload);
    else          await onAdd({ ...payload, id: "MT-" + Date.now() });
    setShowModal(false);
  };

  const filtered = maintenances
    .filter(m => !search || (m.desc || m.description || "").toLowerCase().includes(search.toLowerCase()) || (vehicles.find(v => v.id === m.vh)?.immat || "").toLowerCase().includes(search.toLowerCase()))
    .filter(m => filterStatus === "all" || m.status === filterStatus || (filterStatus === "Planifiee" && m.status === "Planifiée"))
    .filter(m => filterType === "all" || m.type === filterType);

  const stats = {
    planifiees: maintenances.filter(m => m.status === "Planifiee" || m.status === "Planifiée").length,
    enCours:    maintenances.filter(m => m.status === "En cours").length,
    terminees:  maintenances.filter(m => m.status === "Terminee" || m.status === "Terminée").length,
    cout:       maintenances.reduce((a, m) => a + (m.cout || 0), 0),
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Maintenance</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">{filtered.length} intervention(s)</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditItem(null); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          + Ajouter
        </button>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Planifiées",  stats.planifiees, "text-blue-400",  "bg-blue-900/40"],
          ["En cours",    stats.enCours,    "text-amber-400", "bg-amber-900/40"],
          ["Terminées",   stats.terminees,  "text-green-400", "bg-green-900/40"],
          ["Coût total",  fmt(stats.cout),  "text-red-400",   "bg-red-900/40"],
        ].map(([l, v, col, bg]) => (
          <div key={l} className={`${bg} rounded-xl p-4 border border-slate-700`}>
            <div className={`text-xl font-bold ${col}`}>{v}</div>
            <div className="text-[10px] text-slate-500 mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* ── FILTRES ─────────────────────────────────────────────────────────── */}
      <div className="px-6 pb-4 flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48" />
        {[["all","Tous"],["Planifiee","Planifiées"],["En cours","En cours"],["Terminee","Terminées"],["Annulee","Annulées"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filterStatus === v ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}>
            {l}
          </button>
        ))}
        {[["all","Tous types"],["Preventive","Préventive"],["Corrective","Corrective"],["Inspection","Inspection"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilterType(v)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filterType === v ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── LISTE ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">Aucune maintenance</div>
          )}
          {filtered.map(m => {
            const vh       = vehicles.find(v => v.id === m.vh);
            const typeS    = TYPE_STYLE[m.type] || TYPE_STYLE["Preventive"];
            const statusCl = STATUS_STYLE[m.status] || "bg-slate-700 text-slate-400";
            return (
              <div key={m.id} className="flex items-center gap-4 p-4 border-b border-slate-700 last:border-0 hover:bg-slate-700/30 transition-colors">
                {/* Icône type */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeS.bg}`}>
                  <svg className={`w-5 h-5 ${typeS.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{m.desc || m.description}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {vh?.immat || m.vh} · {m.type}
                    {m.garage && ` · ${m.garage}`}
                    {(m.date || m.dateDebut) && ` · ${m.date || m.dateDebut}`}
                  </div>
                </div>
                {/* Cout */}
                {(m.cout || 0) > 0 && (
                  <div className="text-sm font-semibold text-red-400 shrink-0">{fmt(m.cout)}</div>
                )}
                {/* Statut */}
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusCl}`}>{m.status}</span>
                {/* Actions */}
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => { setForm({ ...emptyForm, ...m, desc: m.desc || m.description || "" }); setEditItem(m); setShowModal(true); }}
                    className="text-[11px] text-blue-400 border border-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-900/40">
                    Modifier
                  </button>
                  <button onClick={() => setConfirmDelete(m)}
                    className="text-[11px] text-red-400 border border-red-800 px-2.5 py-1 rounded-lg hover:bg-red-900/40">
                    Suppr.
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <Modal title={editItem ? "Modifier maintenance" : "Ajouter maintenance"} onClose={() => setShowModal(false)}
          footer={
            <>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-600 text-slate-300 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold">{editItem ? "Enregistrer" : "Ajouter"}</button>
            </>
          }>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Véhicule *" value={form.vh} onChange={F("vh")} options={[{ value: "", label: "-- Choisir --" }, ...vehicles.map(v => ({ value: v.id, label: v.immat }))]} />
            <Select label="Type" value={form.type} onChange={F("type")} options={["Preventive", "Corrective", "Inspection"]} />
            <div className="col-span-2"><Input label="Description *" value={form.desc} onChange={F("desc")} required /></div>
            <Input label="Garage" value={form.garage} onChange={F("garage")} placeholder="Ex: Garage Central" />
            <Select label="Statut" value={form.status} onChange={F("status")} options={["Planifiee", "En cours", "Terminee", "Annulee"]} />
            <Input label="Date début" value={form.dateDebut} onChange={F("dateDebut")} type="date" />
            <Input label="Date fin" value={form.dateFin} onChange={F("dateFin")} type="date" />
            {(form.status === "En cours" || form.status === "Terminee") && (
              <>
                <Input label="Coût (F CFA)" value={form.cout} onChange={v => setForm(f => ({ ...f, cout: parseInt(v) || 0 }))} type="number" />
                <Select label="Statut facture" value={form.factureStatus} onChange={F("factureStatus")} options={["En attente", "Payee"]} />
              </>
            )}
            {(form.status === "Annulee" || form.status === "Annulée") && (
              <div className="col-span-2"><Input label="Motif d'annulation" value={form.commentaireAnnulation} onChange={F("commentaireAnnulation")} /></div>
            )}
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Confirm msg={`Supprimer cette maintenance ?`}
          onConfirm={async () => { await onDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};
