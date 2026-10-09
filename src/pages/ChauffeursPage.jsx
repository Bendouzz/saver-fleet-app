import { useState, useRef } from "react";
import { Badge } from "../components/ui/Badge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { KpiBar } from "../components/ui/KpiBar.jsx";
import { PhotoUpload } from "../components/ui/PhotoUpload.jsx";
import { sc } from "../utils/statusColors.js";
import { fmt } from "../utils/formatters.js";

export const ChauffeursPage = ({drivers, vehicles, onAdd, onUpdate, onDelete, sites}) => {
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
