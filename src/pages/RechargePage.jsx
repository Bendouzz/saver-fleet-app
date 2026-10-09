import { useState } from "react";
import { Badge } from "../components/ui/Badge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { sc } from "../utils/statusColors.js";
import { fmt } from "../utils/formatters.js";
import { StatCard } from "../components/ui/StatCard.jsx";
const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"M" : n >= 1000 ? Math.round(n/1000)+"k" : (n||0).toString();

export const RechargePage = ({recharges, vehicles, drivers, onAdd, onUpdate, onDelete}) => {
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

