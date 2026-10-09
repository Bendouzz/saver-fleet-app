import { useState, useRef } from "react";
import { Badge } from "../components/ui/Badge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { SocBar } from "../components/ui/SocBar.jsx";
import { PhotoUpload } from "../components/ui/PhotoUpload.jsx";
import { sc } from "../utils/statusColors.js";

export const VehiculesPage = ({vehicles, onAdd, onUpdate, onDelete, sites}) => {
  const [filter, setFilter] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // cards or table

  const emptyForm = {immat:"",marque:"",modele:"",couleur:"",annee:new Date().getFullYear(),site:1,autonomie:400,km:0,soc:100,status:"En exploitation",typeContrat:"Interne SAVER",typeService:"VTC",classesService:[],vin:"",numeroChassis:"",capaciteBatterie:0,carteGriseNum:"",carteGriseDate:"",carteGriseProprietaire:"",visiteDate:"",assuranceNum:"",assuranceDebut:"",assuranceFin:"",binome:[]};
  const [form, setForm] = useState(emptyForm);
  const photoRefs = useRef({});

  const updatePhoto = (key, value) => {
    photoRefs.current[key] = value;
    console.log("updatePhoto:", key, value);
    setForm(f => ({...f, [key]: value}));
  };

  const sitesList = sites.length > 0 ? sites : [{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];
  const filtered = vehicles
    .filter(v=>filter==="all"||String(v.site)===filter)
    .filter(v=>filterType==="all"||v.typeService===filterType)
    .filter(v=>filterStatus==="all"||v.status===filterStatus);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); photoRefs.current = {}; };
  const openEdit = (v) => { 
    setForm({
      ...emptyForm, ...v,
      photoCarteGrise: v.photo_carte_grise || v.photoCarteGrise || null,
      photoVisite: v.photo_visite || v.photoVisite || null,
      photoAssurance: v.photo_assurance || v.photoAssurance || null,
      photosExt: v.photos_ext || v.photosExt || [],
      photosInt: v.photos_int || v.photosInt || [],
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
    }); 
    setEditItem(v); 
    setShowModal(true); 
  };

  const getAlerts = (v) => {
    const alerts = [];
    if (v.assuranceFin) { const diff=Math.floor((new Date(v.assuranceFin)-new Date())/(86400000)); if(diff<=7) alerts.push({label:"Assurance J-"+diff,color:"text-red-600 bg-red-50"}); }
    if (v.visiteDate) { const diff=Math.floor((new Date(v.visiteDate)-new Date())/(86400000)); if(diff<=15) alerts.push({label:"Visite tech. J-"+diff,color:"text-amber-600 bg-amber-50"}); }
    return alerts;
  };

  const handleSave = async () => {
    if (!form.immat) return;
    // Fusionner form + photoRefs pour ne pas perdre les URLs
    const photos = photoRefs.current;
    const payload = {
      immat:form.immat||null, marque:form.marque||null, modele:form.modele||null,
      couleur:form.couleur||null, annee:form.annee||null,
      site:form.site||1, autonomie:form.autonomie||0, km:form.km||0, soc:form.soc||0,
      status:form.status||"En exploitation",
      typecontrat:form.typeContrat||"Interne SAVER",
      vin_number:form.vin||null,
      battery_capacity_kwh:form.capaciteBatterie||null,
      vehicle_year:form.annee||null,
      vehicle_color:form.couleur||null,
      service_type:form.typeService||"VTC",
      service_class:form.classesService||[],
      technical_visit_expiry:form.visiteDate||null,
      insurance_expiry:form.assuranceFin||null,
      cartegrisenum:form.carteGriseNum||null,
      cartegrisedate:form.carteGriseDate||null,
      cartegriseproprietaire:form.carteGriseProprietaire||null,
      assurancenum:form.assuranceNum||null,
      assurancedebut:form.assuranceDebut||null,
      assurancefin:form.assuranceFin||null,
      numerochassis:form.numeroChassis||null,
      binome:form.binome||[],
      photo_carte_grise: photos.photoCarteGrise || form.photoCarteGrise || null,
      photo_visite: photos.photoVisite || form.photoVisite || null,
      photo_assurance: photos.photoAssurance || form.photoAssurance || null,
      photos_ext: photos.photosExt || form.photosExt || [],
      photos_int: photos.photosInt || form.photosInt || [],
    };
    console.log("Payload photos:", payload.photo_carte_grise, payload.photos_ext);
    if (editItem) { await onUpdate(editItem.id, payload); }
    else { await onAdd({...payload, id:"VH-"+Date.now()}); }
    setShowModal(false);
  };

  const totalAlerts = vehicles.reduce((a,v)=>a+getAlerts(v).length,0);

  const statusColors = {
    "En exploitation": "from-emerald-500 to-emerald-600",
    "En recharge": "from-amber-500 to-amber-600",
    "Maintenance": "from-orange-500 to-orange-600",
    "Immobilise": "from-red-500 to-red-600",
    "Immobilisé": "from-red-500 to-red-600",
  };

  if (detail) {
    const v = vehicles.find(x=>x.id===detail);
    if (!v) { setDetail(null); return null; }
    const alerts = getAlerts(v);
    const siteName = sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site;
    return (
      <div className="space-y-4">
        <button onClick={()=>setDetail(null)} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>

        {alerts.map((a,i)=>(
          <div key={i} className={"flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border "+a.color}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            {a.label}
          </div>
        ))}

        {/* Hero card */}
        <div className={`bg-gradient-to-br ${statusColors[v.status]||"from-blue-500 to-blue-600"} rounded-2xl p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl font-bold mb-1">{v.immat}</div>
              <div className="text-white/80 text-lg">{v.marque} {v.modele} {v.annee&&"· "+v.annee}</div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{v.couleur||"—"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{v.typeContrat||"Interne"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{v.typeService||"VTC"}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{siteName}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={()=>{openEdit(v);setDetail(null);}} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
                Modifier
              </button>
              <div className="text-right">
                <div className="text-white/60 text-xs">SOC</div>
                <div className="text-2xl font-bold">{v.soc||0}%</div>
              </div>
            </div>
          </div>
          {/* SOC bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all" style={{width:(v.soc||0)+"%"}}/>
          </div>
          <div className="flex justify-between text-white/60 text-xs mt-1">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {label:"Kilometrage", value:(v.km||0).toLocaleString()+" km", icon:"🛣️"},
            {label:"Autonomie", value:(v.autonomie||0)+" km", icon:"⚡"},
            {label:"Batterie", value:(v.capaciteBatterie||"—")+" kWh", icon:"🔋"},
          ].map(s=>(
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-slate-800 text-sm">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center text-xs">📋</span>
              Carte grise
            </h3>
            {[["N° CG",v.carteGriseNum],["Date immat.",v.carteGriseDate],["Proprietaire",v.carteGriseProprietaire],["Num. Chassis",v.vin||v.numeroChassis]].map(([l,val])=>(
              <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-medium text-slate-700">{val||"—"}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center text-xs">🛡️</span>
              Assurance & Visite
            </h3>
            {[["N° Assurance",v.assuranceNum],["Debut",v.assuranceDebut],["Fin assurance",v.assuranceFin],["Visite technique",v.visiteDate]].map(([l,val])=>(
              <div key={l} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{l}</span>
                <span className={"text-xs font-medium "+((l==="Fin assurance"||l==="Visite technique")&&val&&new Date(val)<new Date(Date.now()+15*86400000)?"text-red-600":"text-slate-700")}>{val||"—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Classes de service */}
        {(v.classesService||[]).length>0&&(
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Classes de service</h3>
            <div className="flex flex-wrap gap-2">
              {(v.classesService||[]).map(c=><span key={c} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">{c}</span>)}
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicules</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} vehicule(s) 
            {totalAlerts>0&&<span className="ml-2 text-red-500">· {totalAlerts} alerte(s)</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={()=>setViewMode("cards")} className={"px-3 py-1.5 rounded-md text-xs font-medium transition-all "+(viewMode==="cards"?"bg-white shadow text-slate-700":"text-slate-400")}>
              Cartes
            </button>
            <button onClick={()=>setViewMode("table")} className={"px-3 py-1.5 rounded-md text-xs font-medium transition-all "+(viewMode==="table"?"bg-white shadow text-slate-700":"text-slate-400")}>
              Tableau
            </button>
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous les sites</option>
            {sitesList.map(s=><option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">Tous statuts</option>
            <option value="En exploitation">En exploitation</option>
            <option value="En recharge">En recharge</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Immobilise">Immobilise</option>
          </select>
          <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"En exploitation", count:vehicles.filter(v=>v.status==="En exploitation").length, color:"bg-emerald-500", bg:"bg-emerald-50 border-emerald-200"},
          {label:"En recharge", count:vehicles.filter(v=>v.status==="En recharge").length, color:"bg-amber-500", bg:"bg-amber-50 border-amber-200"},
          {label:"Maintenance", count:vehicles.filter(v=>v.status==="Maintenance").length, color:"bg-orange-500", bg:"bg-orange-50 border-orange-200"},
          {label:"Immobilises", count:vehicles.filter(v=>v.status==="Immobilise"||v.status==="Immobilisé").length, color:"bg-red-500", bg:"bg-red-50 border-red-200"},
        ].map(s=>(
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg} cursor-pointer`} onClick={()=>setFilterStatus(s.label==="Immobilises"?"Immobilise":s.label)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">{s.label}</span>
              <div className={`w-2 h-2 rounded-full ${s.color}`}/>
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{s.count}</div>
          </div>
        ))}
      </div>

      {/* Vue cartes */}
      {viewMode==="cards"&&(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length===0&&(
            <div className="col-span-3 text-center py-12 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Aucun vehicule
            </div>
          )}
          {filtered.map(v=>{
            const alerts = getAlerts(v);
            const gradient = statusColors[v.status]||"from-blue-500 to-blue-600";
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                {/* Card header */}
                <div className={`bg-gradient-to-r ${gradient} p-4 text-white`} onClick={()=>setDetail(v.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-lg">{v.immat}</div>
                      <div className="text-white/80 text-sm">{v.marque} {v.modele} {v.annee&&"· "+v.annee}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-xs">SOC</div>
                      <div className="text-xl font-bold">{v.soc||0}%</div>
                    </div>
                  </div>
                  {/* SOC bar */}
                  <div className="mt-3 bg-white/20 rounded-full h-1.5">
                    <div className="bg-white h-1.5 rounded-full" style={{width:(v.soc||0)+"%"}}/>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4" onClick={()=>setDetail(v.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge color={sc(v.status)}>{v.status}</Badge>
                    <span className="text-xs text-slate-400">{sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400">Kilometrage</div>
                      <div className="font-semibold text-slate-700">{(v.km||0).toLocaleString()} km</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <div className="text-slate-400">Autonomie</div>
                      <div className="font-semibold text-slate-700">{v.autonomie||0} km</div>
                    </div>
                  </div>
                  {alerts.length>0&&(
                    <div className="mt-3 space-y-1">
                      {alerts.map((a,i)=><div key={i} className={"text-xs px-2 py-1 rounded-lg font-medium "+a.color}>{a.label}</div>)}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-4 pb-4 flex gap-2">
                  <button onClick={()=>openEdit(v)} className="flex-1 text-xs border border-blue-200 text-blue-600 py-2 rounded-lg hover:bg-blue-50 font-medium transition-all">Modifier</button>
                  <button onClick={()=>setConfirmDelete(v)} className="text-xs border border-red-200 text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vue tableau */}
      {viewMode==="table"&&(
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Vehicule</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Site</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">SOC</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Km</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Alertes</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(v=>{
                const alerts=getAlerts(v);
                return (
                  <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 cursor-pointer" onClick={()=>setDetail(v.id)}>
                      <div className="font-medium text-sm text-slate-800">{v.immat}</div>
                      <div className="text-xs text-slate-400">{v.marque} {v.modele}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{sitesList.find(s=>s.id===v.site||String(s.id)===String(v.site))?.name||v.site}</td>
                    <td className="px-4 py-3"><SocBar soc={v.soc||0}/></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{(v.km||0).toLocaleString()}</td>
                    <td className="px-4 py-3">{alerts.length>0?<div className="space-y-1">{alerts.map((a,i)=><div key={i} className={"text-xs px-2 py-0.5 rounded-full font-medium "+a.color}>{a.label}</div>)}</div>:<span className="text-xs text-emerald-500">OK</span>}</td>
                    <td className="px-4 py-3"><Badge color={sc(v.status)}>{v.status}</Badge></td>
                    <td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>openEdit(v)} className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Modifier</button><button onClick={()=>setConfirmDelete(v)} className="text-red-600 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50">Suppr.</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ajout/modification */}
      {showModal && (
        <Modal title={editItem?"Modifier le vehicule":"Ajouter un vehicule"} onClose={()=>setShowModal(false)}
          footer={<><button onClick={()=>setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm">{editItem?"Enregistrer":"Ajouter"}</button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Input label="Immatriculation" value={form.immat} onChange={v=>setForm({...form,immat:v})} required placeholder="Ex: AB-1234-CI"/></div>
              <Input label="Marque" value={form.marque} onChange={v=>setForm({...form,marque:v})} placeholder="BYD"/>
              <Input label="Modele" value={form.modele} onChange={v=>setForm({...form,modele:v})} placeholder="e6"/>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {["Blanc","Noir","Gris","Argent","Bleu","Rouge","Vert","Jaune","Orange","Marron","Beige","Autre"].map(c=>(
                    <button key={c} type="button" onClick={()=>setForm({...form,couleur:c})}
                      className={"px-3 py-1.5 rounded-lg text-xs font-medium border transition-all "+(form.couleur===c?"bg-blue-600 text-white border-blue-600":"bg-white text-slate-600 border-slate-200 hover:border-blue-300")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Annee" value={form.annee} onChange={v=>setForm({...form,annee:parseInt(v)||new Date().getFullYear()})} type="number"/>
              <Input label="Numero de Chassis (VIN)" value={form.vin} onChange={v=>setForm({...form,vin:v,numeroChassis:v})} placeholder="Ex: VF1RFD00X56789012"/>
              <Input label="Capacite batterie (kWh)" value={form.capaciteBatterie} onChange={v=>setForm({...form,capaciteBatterie:parseInt(v)||0})} type="number"/>
              <Input label="Autonomie (km)" value={form.autonomie} onChange={v=>setForm({...form,autonomie:parseInt(v)||0})} type="number"/>
              <Input label="Kilometrage" value={form.km} onChange={v=>setForm({...form,km:parseInt(v)||0})} type="number"/>
              <Input label="SOC (%)" value={form.soc} onChange={v=>setForm({...form,soc:parseInt(v)||0})} type="number"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Site" value={String(form.site)} onChange={v=>setForm({...form,site:parseInt(v)})} options={sitesList.map(s=>({value:String(s.id),label:s.name}))}/>
              <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["En exploitation","En recharge","Maintenance","Immobilise"]}/>
              <Select label="Type de contrat" value={form.typeContrat} onChange={v=>setForm({...form,typeContrat:v})} options={["Interne SAVER","Externe client gestion"]}/>
              <Select label="Type de service" value={form.typeService} onChange={v=>setForm({...form,typeService:v})} options={["VTC","Location B2B","Location B2C"]}/>
            </div>
            {form.typeService==="VTC"&&(
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Classes de service</label>
                <div className="flex flex-wrap gap-2">
                  {["Eco","Confort","Confort+","Business","Premium","VIP","Standard","Coursier","Livraison","Interurbain"].map(c=>(
                    <label key={c} className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={(form.classesService||[]).includes(c)} onChange={e=>{const arr=form.classesService||[];setForm({...form,classesService:e.target.checked?[...arr,c]:arr.filter(x=>x!==c)});}} className="rounded"/>
                      <span className="text-xs text-slate-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Carte grise</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="N° Carte grise" value={form.carteGriseNum} onChange={v=>setForm({...form,carteGriseNum:v})}/>
                <Input label="Date immatriculation" value={form.carteGriseDate} onChange={v=>setForm({...form,carteGriseDate:v})} type="date"/>
                <div className="col-span-2"><Input label="Proprietaire" value={form.carteGriseProprietaire} onChange={v=>setForm({...form,carteGriseProprietaire:v})}/></div>
                <div className="col-span-2">
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Visite technique et Assurance</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Input label="Expiration visite technique" value={form.visiteDate} onChange={v=>setForm({...form,visiteDate:v})} type="date" hint="(alerte 15j avant)"/></div>
                <Input label="N° Assurance" value={form.assuranceNum} onChange={v=>setForm({...form,assuranceNum:v})}/>
                <Input label="Debut assurance" value={form.assuranceDebut} onChange={v=>setForm({...form,assuranceDebut:v})} type="date"/>
                <div className="col-span-2"><Input label="Fin assurance" value={form.assuranceFin} onChange={v=>setForm({...form,assuranceFin:v})} type="date" hint="(alerte 7j avant)"/></div>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {confirmDelete&&<Confirm msg={"Supprimer le vehicule "+confirmDelete.immat+" ?"} onConfirm={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};
