import { useState } from "react";
import { Badge } from "../components/ui/Badge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { PhotoUpload } from "../components/ui/PhotoUpload.jsx";
import { sc } from "../utils/statusColors.js";
import { fmt } from "../utils/formatters.js";
import { StatCard } from "../components/ui/StatCard.jsx";
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"M" : n >= 1000 ? Math.round(n/1000)+"k" : (n||0).toString();

export const ReversementsPage = ({reversements, drivers, shifts, onAdd, onUpdate, onDelete, user}) => {
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

  const emptyForm = {ch:"",montant:0,montantDeclare:0,canal:"Wave Business",date:new Date().toISOString().split("T")[0],status:"En attente",ecart:0,depensesAutorisees:0,preuve:"",commentaire:""};
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
      ch:r.ch||"", montant:r.montant||0, montantDeclare:r.montant_declare||r.montantDeclare||r.montant||0, canal:r.canal||"Wave Business",
      date:r.date||"", status:r.status||"En attente", ecart:r.ecart||0,
      depensesAutorisees:r.authorized_expenses||r.depensesAutorisees||0,
      preuve:r.transaction_proof_url||r.preuve||"",
      commentaire:r.commentaire||""
    });
    setEditItem(r);
    setShowModal(true);
  };

  // Calcul ecart : recette déclarée - dépenses - montant versé
  const calcEcart = (montantVerse, montantDeclare, depenses, canal) => {
    if(!montantDeclare || montantDeclare <= 0) return 0;
    const tolerance = (canal==="Wave Business" || canal==="Wave") ? montantDeclare * 0.01 : 0;
    const montantAttendu = montantDeclare - (depenses || 0);
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
            <Input label="Recette declaree par le chauffeur (F CFA)" value={form.montantDeclare||""} onChange={v=>{const val=parseInt(v)||0;setForm({...form,montantDeclare:val});}} type="number" placeholder="Ex: 18000"/>
            <Input label="Montant verse par le chauffeur (F CFA)" value={form.montant} onChange={v=>setForm({...form,montant:parseInt(v)||0})} type="number" required/>
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
          {form.montantDeclare>0&&form.montant>0&&(
            <div className={`rounded-lg p-3 mt-2 text-xs ${calcEcart(form.montant,form.montantDeclare,form.depensesAutorisees||0,form.canal)>0?"bg-red-50 dark:bg-red-900/20 text-red-600":"bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"}`}>
              {calcEcart(form.montant,form.montantDeclare,form.depensesAutorisees||0,form.canal)>0
                ? <>⚠ Ecart detecte : <strong>{fmt(calcEcart(form.montant,form.montantDeclare,form.depensesAutorisees||0,form.canal))}</strong> manquant{form.canal==="Wave Business"&&<span className="text-xs opacity-70"> (tolerance 1% frais Wave deduite)</span>}</>
                : <>✓ Reversement conforme — aucun ecart</>
              }
            </div>
          )}
        </Modal>
      )}
      {confirmDelete&&<Confirm msg={"Supprimer le reversement de "+(drivers.find(d=>d.id===confirmDelete.ch)?.prenom||"ce chauffeur")+" ?"} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};
