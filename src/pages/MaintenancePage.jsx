import { useState } from "react";
import { Badge } from "../components/ui/Badge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { sc } from "../utils/statusColors.js";
import { fmt } from "../utils/formatters.js";
import { StatCard } from "../components/ui/StatCard.jsx";

export const MaintenancePage = ({maintenances, vehicles, onAdd, onUpdate, onDelete}) => {
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

