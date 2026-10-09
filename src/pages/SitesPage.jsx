import { useState } from "react";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Select } from "../components/ui/Select.jsx";

export const SitesPage = ({sites, vehicles, drivers, onAdd, onUpdate, onDelete}) => {
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

