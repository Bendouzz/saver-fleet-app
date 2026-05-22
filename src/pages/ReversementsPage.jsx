// ReversementsPage.jsx — Easy by Saver · Dark theme Tailwind · Onglets Saisie/Historique
import { useState } from "react";
import { Confirm } from "../components/ui/Confirm.jsx";
import { PhotoUpload } from "../components/ui/PhotoUpload.jsx";
import { fmt } from "../utils/formatters.js";

const SITES = ["Depot Principal SAVER - Cocody", "Depot Secondaire SAVER - Yopougon", "Borne SAVER - Adjame", "Borne SAVER - Treichville", "Borne SAVER - Plateau", "Autre"];
const OPERATEURS_MM = ["Wave", "Orange Money", "MTN MoMo", "Moov Money"];
const CANAUX = ["Especes", "Wave Business", "Orange Money Business", "MTN Mobile Money", "Moov Money", "Cash"];

function getPeriodeDefaut() {
  const fin = new Date();
  const debut = new Date();
  debut.setDate(debut.getDate() - 13);
  return { debut: debut.toISOString().slice(0, 10), fin: fin.toISOString().slice(0, 10) };
}

function analyserEcart(montant, montantAttendu, depenseMontant, canal, operateur) {
  const m   = parseFloat(montant);
  const ma  = parseFloat(montantAttendu);
  const dep = parseFloat(depenseMontant) || 0;
  if (!ma || isNaN(m) || isNaN(ma)) return null;
  const ecartBrut = ma - m;
  const ecartPct  = (ecartBrut / ma) * 100;
  const fraisWave = (canal === "Wave Business" || (canal === "Mobile Money" && operateur === "Wave")) ? ma * 0.01 : 0;
  const ecartNonExplique = ecartBrut - fraisWave - dep;
  if (ecartNonExplique <= 0.5) {
    if (fraisWave > 0 && dep > 0) return { label: "OK · Frais Wave + Depense", color: "text-green-400", ok: true };
    if (fraisWave > 0) return { label: "OK · Frais Wave 1%", color: "text-green-400", ok: true };
    if (dep > 0) return { label: "OK · Depense autorisee", color: "text-amber-400", ok: true };
    return { label: "OK", color: "text-green-400", ok: true };
  }
  if (dep > 0) return { label: `Ecart ${ecartPct.toFixed(1)}% · Depense partielle`, color: "text-amber-400", ok: false, detail: `Non explique: ${Math.round(ecartNonExplique).toLocaleString("fr-FR")} F` };
  return { label: `ECART ${ecartPct.toFixed(1)}%`, color: "text-red-400", ok: false, detail: `${Math.round(ecartBrut).toLocaleString("fr-FR")} F manquant` };
}

const emptyForm = {
  ch: "", montant: "", montantAttendu: "", date: new Date().toISOString().slice(0, 10),
  commentaire: "", site: "", modePaiement: "Especes",
  operateur: "", numeroMM: "", referenceTransaction: "",
  preuve: "", depenseAutorisee: false, depenseMontant: "", depensePreuve: ""
};

const INP = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500";
const LBL = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

export const ReversementsPage = ({ reversements = [], drivers = [], shifts = [], onAdd, onUpdate, onDelete, user }) => {
  const [onglet, setOnglet]               = useState("saisie");
  const [form, setForm]                   = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editId, setEditId]               = useState(null);

  const periode = getPeriodeDefaut();
  const [filtreDebut, setFiltreDebut]       = useState(periode.debut);
  const [filtreFin, setFiltreFin]           = useState(periode.fin);
  const [filtreChauffeur, setFiltreChauffeur] = useState("");
  const [filtreSite, setFiltreSite]         = useState("");
  const [filtreStatut, setFiltreStatut]     = useState("");

  // Recherche automatique du shift quand chauffeur + date changent
  const findShift = (chId, date) => {
    if (!chId || !date) return null;
    return shifts.find(s =>
      s.ch === chId &&
      (s.status === "Terminé" || s.status === "Termine") &&
      (s.planned_start_date || s.date || "").startsWith(date)
    ) || null;
  };
  const shiftAuto = findShift(form.ch, form.date);

  const hi = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const openEdit = (r) => {
    setForm({
      ...emptyForm,
      ch: r.ch || "",
      montant: r.montant || "",
      montantAttendu: r.amount_requested || r.montant || "",
      date: r.date || "",
      commentaire: r.commentaire || "",
      site: r.site || "",
      modePaiement: r.canal?.includes("Mobile") || OPERATEURS_MM.some(o => r.canal?.includes(o)) ? "Mobile Money" : "Especes",
      operateur: r.operateur || "",
      preuve: r.transaction_proof_url || r.preuve || "",
      depenseMontant: r.authorized_expenses || 0,
    });
    setEditId(r.id);
    setOnglet("saisie");
  };

  const handleAjouter = async () => {
    if (!form.ch) return alert("Chauffeur obligatoire");
    if (!form.montant) return alert("Montant obligatoire");
    if (!form.date) return alert("Date obligatoire");
    if (form.modePaiement === "Mobile Money" && !form.operateur) return alert("Operateur mobile money obligatoire");
    const canalFinal = form.modePaiement === "Mobile Money" ? (form.operateur || "Mobile Money") + " Business" : "Especes";
    const payload = {
      ch: form.ch, driver_id: form.ch,
      montant: parseFloat(form.montant) || 0,
      amount_sent: parseFloat(form.montant) || 0,
      amount_requested: parseFloat(form.montantAttendu) || parseFloat(form.montant) || 0,
      canal: canalFinal,
      date: form.date,
      status: "En attente",
      ecart: 0,
      authorized_expenses: form.depenseAutorisee ? (parseFloat(form.depenseMontant) || 0) : 0,
      transaction_proof_url: form.preuve || null,
      commentaire: form.commentaire || null,
      site: form.site || null,
    };
    if (editId) {
      await onUpdate(editId, payload);
      setEditId(null);
    } else {
      await onAdd({ ...payload, id: "RV-" + Date.now() });
    }
    setForm(emptyForm);
  };

  const listeFiltree = reversements.filter(r => {
    if (filtreChauffeur && r.ch !== filtreChauffeur) return false;
    if (filtreSite && r.site !== filtreSite) return false;
    if (filtreStatut && r.status !== filtreStatut) return false;
    if (filtreDebut && (r.date || "") < filtreDebut) return false;
    if (filtreFin && (r.date || "") > filtreFin) return false;
    return true;
  });

  const totalRecu    = listeFiltree.reduce((s, r) => s + parseFloat(r.montant || 0), 0);
  const totalAttendu = listeFiltree.reduce((s, r) => s + parseFloat(r.amount_requested || r.montant || 0), 0);
  const ecartTotal   = totalAttendu - totalRecu;
  const nbAlertes    = listeFiltree.filter(r => {
    const info = analyserEcart(r.montant, r.amount_requested || r.montant, r.authorized_expenses, r.canal, r.operateur);
    return info && !info.ok;
  }).length;

  const ecartInfo = analyserEcart(form.montant, form.montantAttendu, form.depenseAutorisee ? form.depenseMontant : 0, form.modePaiement === "Mobile Money" ? "Wave Business" : "Especes", form.operateur);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── HEADER ── */}
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Reversements</h1>
        <p className="text-xs text-slate-500 mt-0.5">Suivi des versements chauffeurs</p>
      </div>

      {/* ── ALERTE ECARTS ── */}
      {nbAlertes > 0 && (
        <div className="mx-6 mt-4 bg-red-900/40 border border-red-800 rounded-xl px-5 py-3 text-red-300 font-bold text-sm">
          {nbAlertes} reversement(s) avec ecart inexplique
        </div>
      )}

      {/* ── ONGLETS ── */}
      <div className="px-6 pt-4 flex gap-2">
        {[["saisie", "Saisie reversement"], ["historique", "Historique filtrable"]].map(([id, label]) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${onglet === id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-6 pb-6 pt-5">

        {/* ─────────── SAISIE ─────────── */}
        {onglet === "saisie" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-3xl">
            <h3 className="text-base font-bold text-white mb-5">
              {editId ? "Modifier le reversement" : "Nouveau reversement"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LBL}>Date *</label>
                <input className={INP} type="date" value={form.date} onChange={hi("date")} />
              </div>
              <div>
                <label className={LBL}>Chauffeur *</label>
                <select className={INP} value={form.ch} onChange={hi("ch")}>
                  <option value="">-- Choisir --</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_code || d.matricule} · {d.prenom} {d.nom}</option>)}
                </select>
              </div>
              <div>
                <label className={LBL}>Site / Depot</label>
                <select className={INP} value={form.site} onChange={hi("site")}>
                  <option value="">-- Aucun --</option>
                  {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Shift auto */}
              {shiftAuto && (
                <div className="col-span-2 bg-green-900/30 border border-green-800 rounded-xl px-4 py-3">
                  <div className="text-xs font-bold text-green-400 mb-2">Shift trouve automatiquement</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-green-300">
                    <span>Recettes DD : <strong>{shiftAuto.revenue_cash || shiftAuto.recette || 0} F</strong></span>
                    <span>Shift : <strong>{shiftAuto.shift_type || "Shift " + shiftAuto.type}</strong></span>
                    <span>Courses : <strong>{shiftAuto.courses_count || 0}</strong></span>
                    <span>Commission : <strong>{shiftAuto.yango_commission || 0} F</strong></span>
                  </div>
                </div>
              )}
              {form.ch && !shiftAuto && form.date && (
                <div className="col-span-2 bg-amber-900/30 border border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-300">
                  Aucun shift termine trouve pour ce chauffeur a cette date
                </div>
              )}

              <div>
                <label className={LBL}>Montant attendu (FCFA)</label>
                <input className={INP} type="number" value={form.montantAttendu} onChange={hi("montantAttendu")} />
              </div>
              <div>
                <label className={LBL}>Montant recu (FCFA) *</label>
                <input className={INP} type="number" value={form.montant} onChange={hi("montant")} />
              </div>

              {/* Analyse ecart */}
              {ecartInfo && (
                <div className={`col-span-2 rounded-xl px-4 py-3 border ${ecartInfo.ok ? "bg-green-900/30 border-green-800" : "bg-red-900/30 border-red-800"}`}>
                  <span className={`font-bold ${ecartInfo.color}`}>{ecartInfo.label}</span>
                  {ecartInfo.detail && <span className="ml-3 text-slate-400 text-xs">{ecartInfo.detail}</span>}
                </div>
              )}

              <div>
                <label className={LBL}>Mode de paiement</label>
                <select className={INP} value={form.modePaiement} onChange={hi("modePaiement")}>
                  <option value="Especes">Especes</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              {form.modePaiement === "Mobile Money" && (
                <>
                  <div>
                    <label className={LBL}>Operateur *</label>
                    <select className={INP} value={form.operateur} onChange={hi("operateur")}>
                      <option value="">-- Choisir --</option>
                      {OPERATEURS_MM.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LBL}>Numero mobile money</label>
                    <input className={INP} value={form.numeroMM} onChange={hi("numeroMM")} placeholder="07 XX XX XX XX" />
                  </div>
                  <div className="col-span-2">
                    <label className={LBL}>Reference transaction</label>
                    <input className={INP} value={form.referenceTransaction} onChange={hi("referenceTransaction")} />
                  </div>
                  {form.operateur === "Wave" && (
                    <div className="col-span-2 bg-amber-900/30 border border-amber-800 rounded-xl px-4 py-2 text-xs text-amber-300">
                      Frais Wave 1% appliques automatiquement dans le calcul d'ecart
                    </div>
                  )}
                </>
              )}

              <div className="col-span-2">
                <label className={LBL}>Preuve de reversement (screenshot Wave / recu)</label>
                <PhotoUpload label="" bucket="reversement-proofs" folder={"reversements/" + (form.date || "new")} value={form.preuve} onChange={url => setForm(f => ({ ...f, preuve: url }))} hint="Capture d'ecran de la transaction" />
              </div>

              <div className="col-span-2">
                <label className={LBL}>Commentaire</label>
                <input className={INP} value={form.commentaire} onChange={hi("commentaire")} />
              </div>
            </div>

            {/* Depense autorisee */}
            <div className="mt-5 bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <label className="flex items-center gap-3 font-semibold text-slate-200 cursor-pointer text-sm">
                <input type="checkbox" checked={form.depenseAutorisee} onChange={hi("depenseAutorisee")} className="w-4 h-4 rounded" />
                Depense autorisee a deduire
              </label>
              {form.depenseAutorisee && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className={LBL}>Montant depense (FCFA)</label>
                    <input className={INP} type="number" value={form.depenseMontant} onChange={hi("depenseMontant")} />
                  </div>
                  <div>
                    <label className={LBL}>Justificatif depense (photo)</label>
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const r = new FileReader();
                      r.onload = () => setForm(f => ({ ...f, depensePreuve: r.result }));
                      r.readAsDataURL(file);
                    }} className="text-slate-400 text-sm" />
                    {form.depensePreuve && (
                      <img src={form.depensePreuve} alt="" className="mt-2 h-14 w-20 object-cover rounded-lg border border-slate-600" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              {editId && (
                <button onClick={() => { setForm(emptyForm); setEditId(null); }}
                  className="border border-slate-600 text-slate-300 px-5 py-2.5 rounded-xl text-sm hover:bg-slate-700">
                  Annuler
                </button>
              )}
              <button onClick={handleAjouter}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                {editId ? "Enregistrer" : "Ajouter le reversement"}
              </button>
            </div>
          </div>
        )}

        {/* ─────────── HISTORIQUE ─────────── */}
        {onglet === "historique" && (
          <>
            {/* Filtres */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={LBL}>Chauffeur</label>
                  <select className={INP} value={filtreChauffeur} onChange={e => setFiltreChauffeur(e.target.value)}>
                    <option value="">Tous</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_code || d.matricule} · {d.prenom} {d.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Site</label>
                  <select className={INP} value={filtreSite} onChange={e => setFiltreSite(e.target.value)}>
                    <option value="">Tous</option>
                    {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Du</label>
                  <input className={INP} type="date" value={filtreDebut} onChange={e => setFiltreDebut(e.target.value)} />
                </div>
                <div>
                  <label className={LBL}>Au</label>
                  <input className={INP} type="date" value={filtreFin} onChange={e => setFiltreFin(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 mt-4 items-center">
                <select className={`${INP} max-w-xs`} value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="En attente">En attente</option>
                  <option value="Validé">Valides</option>
                  <option value="Rejete">Rejetes</option>
                </select>
                <button onClick={() => { setFiltreChauffeur(""); setFiltreSite(""); setFiltreStatut(""); setFiltreDebut(periode.debut); setFiltreFin(periode.fin); }}
                  className="border border-slate-600 text-slate-400 px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
                  Reset
                </button>
                <span className="text-xs text-slate-500 ml-auto">{listeFiltree.length} reversement(s)</span>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Total recu", val: fmt(totalRecu) + " F", color: "text-green-400" },
                { label: "Total attendu", val: fmt(totalAttendu) + " F", color: "text-blue-400" },
                { label: "Ecart global", val: fmt(ecartTotal) + " F", color: ecartTotal > totalAttendu * 0.01 ? "text-red-400" : "text-green-400" },
                { label: "Nb reversements", val: listeFiltree.length, color: "text-violet-400" },
              ].map(k => (
                <div key={k.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-center">
                  <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
                  <div className="text-xs text-slate-500 mt-2">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    {["Date", "Chauffeur", "Site", "Mode", "Attendu", "Recu", "Depense", "Ecart", "Preuve", "Statut", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listeFiltree.length === 0 && (
                    <tr><td colSpan={11} className="text-center py-12 text-slate-500 text-sm">Aucun reversement sur cette periode</td></tr>
                  )}
                  {listeFiltree.map(r => {
                    const driver = drivers.find(d => d.id === r.ch);
                    const info = analyserEcart(r.montant, r.amount_requested || r.montant, r.authorized_expenses, r.canal, r.operateur);
                    const isValide = r.status === "Validé" || r.status === "Valide";
                    return (
                      <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString("fr-FR") : "-"}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{driver ? `${driver.driver_code || driver.matricule} · ${driver.prenom} ${driver.nom}` : "-"}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{r.site || "-"}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{r.canal || "-"}</td>
                        <td className="px-4 py-3 text-slate-300">{r.amount_requested ? fmt(r.amount_requested) + " F" : "-"}</td>
                        <td className="px-4 py-3 font-bold text-green-400">{fmt(r.montant || 0)} F</td>
                        <td className="px-4 py-3 text-amber-400">{r.authorized_expenses ? fmt(r.authorized_expenses) + " F" : "-"}</td>
                        <td className="px-4 py-3">
                          {info ? (
                            <div>
                              <span className={`font-bold text-xs ${info.color}`}>{info.label}</span>
                              {info.detail && <div className="text-slate-500 text-[10px]">{info.detail}</div>}
                            </div>
                          ) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(r.transaction_proof_url || r.preuve) ? (
                            <img src={r.transaction_proof_url || r.preuve} alt="" className="h-8 w-10 object-cover rounded cursor-pointer"
                              onClick={() => window.open(r.transaction_proof_url || r.preuve)} />
                          ) : <span className="text-slate-600 text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isValide ? "bg-green-900/60 text-green-400 border-green-800" : r.status === "En attente" ? "bg-amber-900/60 text-amber-400 border-amber-800" : "bg-red-900/60 text-red-400 border-red-800"}`}>
                            {r.status || "En attente"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {r.status === "En attente" && (user?.role === "finance" || user?.role === "admin") && (
                              <button onClick={() => onUpdate(r.id, { status: "Validé", ch: r.ch, driver_id: r.ch, montant: r.montant, amount_sent: r.montant, amount_requested: r.amount_requested || r.montant, canal: r.canal, date: r.date, ecart: r.ecart || 0, authorized_expenses: r.authorized_expenses || 0, transaction_proof_url: r.transaction_proof_url || null, commentaire: r.commentaire || null })}
                                className="text-[11px] text-green-400 border border-green-800 px-2 py-1 rounded-lg hover:bg-green-900/30">
                                Valider
                              </button>
                            )}
                            <button onClick={() => openEdit(r)}
                              className="text-[11px] text-blue-400 border border-blue-800 px-2 py-1 rounded-lg hover:bg-blue-900/30">
                              Modifier
                            </button>
                            <button onClick={() => setConfirmDelete(r)}
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
          </>
        )}
      </div>

      {confirmDelete && (
        <Confirm msg={`Supprimer le reversement de ${drivers.find(d => d.id === confirmDelete.ch)?.prenom || "ce chauffeur"} ?`}
          onConfirm={async () => { await onDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};
