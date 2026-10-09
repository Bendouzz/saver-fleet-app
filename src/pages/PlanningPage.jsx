import { useState } from "react";
import { supabase } from "../supabase.js";
import { Badge } from "../components/ui/Badge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Select } from "../components/ui/Select.jsx";
import { PhotoUpload } from "../components/ui/PhotoUpload.jsx";
import { sc } from "../utils/statusColors.js";
import { fmt } from "../utils/formatters.js";

export const PlanningPage = ({shifts, vehicles, drivers, onAdd, onUpdate, onDelete, sites}) => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showDDModal, setShowDDModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [ddForm, setDDForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const sitesList = sites.length>0?sites:[{id:1,name:"Abidjan"},{id:2,name:"Yamoussoukro"}];

  const emptyShift = {vh:"",ch:"",type:"A",date:new Date().toISOString().split("T")[0],debut:"06:00",fin:"14:00",status:"Planifie",lieuDebut:"",lieuFin:"",responsableZone:"",recette:0,commentaireShift:""};
  const [form, setForm] = useState(emptyShift);

  const shiftHoraires = {A:"06:00 - 14:00",B:"15:00 - 23:00",C:"22:00 - 06:00"};
  const shiftColors = {
    A:{bg:"bg-blue-50",border:"border-blue-200",title:"text-blue-800",badge:"bg-blue-600",light:"bg-emerald-100 text-emerald-700"},
    B:{bg:"bg-violet-50",border:"border-violet-200",title:"text-violet-800",badge:"bg-violet-600",light:"bg-violet-100 text-violet-700"},
    C:{bg:"bg-slate-50",border:"border-slate-200 dark:border-slate-700",title:"text-slate-800 dark:text-slate-100",badge:"bg-slate-600",light:"bg-slate-100 text-slate-600 dark:text-slate-400"},
  };

  const getDriver = (id) => drivers.find(d=>d.id===id);
  const getVehicle = (id) => vehicles.find(v=>v.id===id);

  // Stats
  const totalShifts = shifts.length;
  const enCours = shifts.filter(s=>s.status==="En cours").length;
  const termines = shifts.filter(s=>s.status==="Terminé"||s.status==="Termine").length;
  const planifies = shifts.filter(s=>s.status==="Planifie"||s.status==="Planifié").length;
  const ddSaisis = shifts.filter(s=>(s.status==="Terminé"||s.status==="Termine")&&(s.courses_count>0||s.nbCourses>0)).length;

  const handleSave = async () => {
    if(!form.vh||!form.ch) return setSaving(false)||alert("Vehicule et chauffeur requis");
    setSaving(true);
    if(editItem){
      await onUpdate(editItem.id, {
        vh:form.vh, ch:form.ch,
        type:form.type, shift_type:"Shift "+form.type,
        planned_start_date:form.date,
        debut:form.debut||"06:00", fin:form.fin||"14:00",
        status:form.status||"Planifie",
        lieuDebut:form.lieuDebut||null, lieuFin:form.lieuFin||null,
        responsableZone:form.responsableZone||null,
        recette:parseFloat(form.recette)||0,
        revenue_cash:parseFloat(form.recette)||0,
      });
    } else {
      await onAdd({
        id:"SH-"+Date.now(),
        vh:form.vh, ch:form.ch,
        type:form.type, shift_type:"Shift "+form.type,
        planned_start_date:form.date,
        debut:form.debut||"06:00", fin:form.fin||"14:00",
        status:form.status||"Planifie",
        lieuDebut:form.lieuDebut||null, lieuFin:form.lieuFin||null,
        responsableZone:form.responsableZone||null,
        recette:parseFloat(form.recette)||0,
        revenue_cash:parseFloat(form.recette)||0,
        check_in:false, check_out:false,
        courses_count:0, yango_commission:0,
        authorized_expenses:0, yango_rating:0,
        km_driven:0, battery_start:0, battery_end:0,
      });
    }
    setSaving(false);
    setShowModal(false);
    setEditItem(null);
  };

  const openEdit = (s) => {
    setForm({
      vh:s.vh||"", ch:s.ch||"", type:s.type||"A",
      date:(s.date||s.planned_start_date||"").split("T")[0]||new Date().toISOString().split("T")[0],
      debut:s.debut||"06:00", fin:s.fin||"14:00",
      status:s.status||"Planifie",
      lieuDebut:s.lieuDebut||"", lieuFin:s.lieuFin||"",
      responsableZone:s.responsableZone||"",
      recette:s.recette||0, commentaireShift:s.commentaireShift||"",
    });
    setEditItem(s);
    setShowModal(true);
  };

  const handleCheckin = async (s) => {
    await onUpdate(s.id, {status:"En cours", check_in:true});
  };

  const handleCheckout = async (s) => {
    await onUpdate(s.id, {status:"Terminé", check_out:true});
    // Attendre que le statut soit bien mis a jour avant d ouvrir DD
    await new Promise(resolve => setTimeout(resolve, 800));
    setDDForm({heureDebutReelle:"",heureFinReelle:"",kmParcourus:0,nbCourses:0,revenusGeneres:0,commissionYango:0,autonomieDebut:100,autonomieFin:0,depensesAutorisees:0,noteYangoShift:0,commentaireShift:""});
    setSelectedShift({...s, status:"Terminé"});
    setShowDDModal(true);
  };

  const handleSaveDD = async () => {
    if(!selectedShift) return;
    setSaving(true);
    try {
      // Champs de base — toujours présents dans la table shifts
      const shiftDate = selectedShift.date || selectedShift.planned_start_date || new Date().toISOString().split("T")[0];
      // Convertir "HH:MM" en timestamp complet pour Supabase
      const toTimestamp = (timeStr) => {
        if(!timeStr) return null;
        // Si déjà un timestamp complet, on retourne tel quel
        if(timeStr.includes("T") || timeStr.includes("-")) return timeStr;
        return `${shiftDate}T${timeStr}:00`;
      };
      const payload = {
        courses_count: parseInt(ddForm.nbCourses)||0,
        revenue_cash: parseFloat(ddForm.revenusGeneres)||0,
        yango_commission: parseFloat(ddForm.commissionYango)||0,
        authorized_expenses: parseFloat(ddForm.depensesAutorisees)||0,
        yango_rating: parseFloat(ddForm.noteYangoShift)||0,
        km_driven: parseFloat(ddForm.kmParcourus)||0,
        battery_start: parseFloat(ddForm.autonomieDebut)||0,
        battery_end: parseFloat(ddForm.autonomieFin)||0,
        real_start_time: toTimestamp(ddForm.heureDebutReelle),
        real_end_time: toTimestamp(ddForm.heureFinReelle),
        status: "Terminé",
      };
      const { error } = await supabase.from("shifts").update(payload).eq("id", selectedShift.id);
      if(error) {
        console.error("Erreur sauvegarde DD:", error);
        alert("Erreur lors de la sauvegarde : " + (error.message||"Vérifiez votre connexion et réessayez."));
        setSaving(false);
        return;
      }
      // Photos en option — on ignore si ça échoue (colonnes peut-être absentes)
      try {
        const photoPayload = {};
        if(ddForm.photoSelfie) photoPayload.photo_selfie = ddForm.photoSelfie;
        if(ddForm.photosFinShift?.length) photoPayload.photos_fin_shift = ddForm.photosFinShift;
        if(ddForm.capturesYango?.length) photoPayload.captures_yango = ddForm.capturesYango;
        if(ddForm.capturesBord?.length) photoPayload.captures_bord = ddForm.capturesBord;
        if(Object.keys(photoPayload).length > 0) {
          await supabase.from("shifts").update(photoPayload).eq("id", selectedShift.id);
        }
      } catch(_){}
      setSaving(false);
      setShowDDModal(false);
    } catch(e) {
      console.error("Erreur inattendue DD:", e);
      alert("Erreur inattendue. Vérifiez votre connexion et réessayez.");
      setSaving(false);
    }
  };

  // Calculs DD
  const ratioCommission = ddForm.revenusGeneres>0 ? Math.round((ddForm.commissionYango/ddForm.revenusGeneres)*100) : 0;
  const consoBatterie = (ddForm.autonomieDebut||0)-(ddForm.autonomieFin||0);
  const recetteNette = (ddForm.revenusGeneres||0)-(ddForm.commissionYango||0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Planning et Shifts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
          {filterDate && <button onClick={()=>setFilterDate("")} className="text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200">Tous les jours</button>}
          <button onClick={()=>{setForm(emptyShift);setEditItem(null);setShowModal(true);}} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Planifier shift
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"Total shifts",value:totalShifts,color:"text-slate-700 dark:text-slate-300",bg:"bg-slate-50"},
          {label:"Planifies",value:planifies,color:"text-blue-600",bg:"bg-blue-50"},
          {label:"En cours",value:enCours,color:"text-emerald-600",bg:"bg-emerald-50"},
          {label:"Termines",value:termines,color:"text-slate-500 dark:text-slate-400",bg:"bg-slate-50"},
          {label:"DD saisis",value:ddSaisis+"/"+termines,color:"text-violet-600",bg:"bg-violet-50"},
        ].map(s=>(
          <div key={s.label} className={s.bg+" rounded-xl p-4 border border-slate-200 dark:border-slate-700"}>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</div>
            <div className={"text-2xl font-bold "+s.color}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Grille shifts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["A","B","C"].map(type=>{
          const col=shiftColors[type];
          const shiftList=shifts.filter(s=>s.type===type && (filterDate===""||((s.date||s.planned_start_date||"").startsWith(filterDate))));
          return (
            <div key={type} className={col.bg+" rounded-xl border "+col.border+" p-4"}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={"font-bold text-base "+col.title}>Shift {type}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{shiftHoraires[type]}</p>
                </div>
                <span className={"text-xs px-2.5 py-1 rounded-full text-white font-medium "+col.badge}>{shiftList.length} shift{shiftList.length>1?"s":""}</span>
              </div>
              <div className="space-y-3">
                {shiftList.length===0&&(
                  <div className="text-center py-6 text-slate-400">
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <p className="text-xs">Aucun shift</p>
                  </div>
                )}
                {shiftList.map(s=>{
                  const driver = getDriver(s.ch);
                  const vehicle = getVehicle(s.vh);
                  const hasDDData = (s.courses_count>0||s.nbCourses>0);
                  const isTermine = s.status==="Terminé"||s.status==="Termine";
                  return (
                    <div key={s.id} className="bg-white rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                      {/* En-tete shift */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {driver?(driver.prenom||"?")[0]+(driver.nom||"?")[0]:"?"}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-800 dark:text-slate-100">{driver?driver.prenom+" "+driver.nom:"—"}</div>
                            <div className="text-xs text-slate-400">{vehicle?.immat||"—"} {driver?.matricule?"· "+driver.matricule:""}</div>
                          </div>
                        </div>
                        <Badge color={sc(s.status)}>{s.status}</Badge>
                      </div>

                      {/* Recette si disponible */}
                      {(s.recette>0||s.revenue_cash>0)&&(
                        <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-50 rounded-lg">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          <span className="text-xs font-semibold text-emerald-700">{fmt(s.recette||s.revenue_cash||0)}</span>
                        </div>
                      )}

                      {/* DD Data resume si saisi */}
                      {isTermine&&hasDDData&&(
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 mb-2 space-y-1">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">DD Driving Datas</div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>Courses: <strong className="text-slate-700 dark:text-slate-300">{s.courses_count||s.nbCourses||0}</strong></span>
                            <span>Rev: <strong className="text-emerald-600">{fmt(s.revenue_cash||s.revenusGeneres||0)}</strong></span>
                            <span>Com.: <strong className="text-red-500">{fmt(s.yango_commission||s.commissionYango||0)}</strong></span>
                            <span>Note: <strong className="text-amber-500">{s.yango_rating||s.noteYangoShift||0}/5</strong></span>
                            {s.km_driven>0&&<span>Km: <strong className="text-slate-700 dark:text-slate-300">{s.km_driven}</strong></span>}
                            {(s.battery_start>0)&&<span>Batterie: <strong className="text-blue-600">{s.battery_start}%→{s.battery_end}%</strong></span>}
                          </div>
                        </div>
                      )}

                      {/* Alerte DD manquant */}
                      {isTermine&&!hasDDData&&(
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                          <div className="text-xs text-amber-700 font-medium">DD Driving Datas non saisis</div>
                          <div className="text-xs text-amber-600">La paie ne peut pas etre calculee sans ces donnees</div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={()=>openEdit(s)} className="text-xs text-slate-500 border border-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                          Modifier
                        </button>
                        {(s.status==="Planifie"||s.status==="Planifié")&&(
                          <button onClick={()=>handleCheckin(s)} className="flex-1 text-xs bg-emerald-500 text-white px-2 py-1.5 rounded-lg hover:bg-emerald-600 font-medium">
                            Check-in
                          </button>
                        )}
                        {s.status==="En cours"&&(
                          <button onClick={()=>handleCheckout(s)} className="flex-1 text-xs bg-violet-500 text-white px-2 py-1.5 rounded-lg hover:bg-violet-600 font-medium">
                            Check-out
                          </button>
                        )}
                        {isTermine&&(
                          <button onClick={()=>setConfirmDelete(s)} className="text-xs text-red-500 border border-red-200 px-2 py-1.5 rounded-lg hover:bg-red-50">
                            Suppr.
                          </button>
                        )}
                        {isTermine&&(
                          <button onClick={()=>{
                            const toHHMM = (ts) => { if(!ts) return ""; if(ts.includes("T")) return ts.substring(11,16); return ts.substring(0,5); };
                            setDDForm({
                              heureDebutReelle:toHHMM(s.real_start_time),
                              heureFinReelle:toHHMM(s.real_end_time),
                              kmParcourus:s.km_driven||0,
                              nbCourses:s.courses_count||s.nbCourses||0,
                              revenusGeneres:s.revenue_cash||s.revenusGeneres||0,
                              commissionYango:s.yango_commission||s.commissionYango||0,
                              autonomieDebut:s.battery_start||100,
                              autonomieFin:s.battery_end||0,
                              depensesAutorisees:s.authorized_expenses||s.depensesAutorisees||0,
                              noteYangoShift:s.yango_rating||s.noteYangoShift||0,
                              commentaireShift:s.commentaireShift||"",
                            });
                            setSelectedShift(s);
                            setShowDDModal(true);
                          }} className={"flex-1 text-xs px-2 py-1.5 rounded-lg font-medium "+(hasDDData?"bg-emerald-100 text-emerald-700 hover:bg-blue-200":"bg-blue-600 text-white hover:bg-blue-700")}>
                            {hasDDData?"Modifier DD":"Saisir DD"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL AJOUT SHIFT */}
      {showModal&&(
        <Modal title={editItem?"Modifier le shift":"Planifier un shift"} onClose={()=>{setShowModal(false);setEditItem(null);}}
          footer={<><button onClick={()=>{setShowModal(false);setEditItem(null);}} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving?"Enregistrement...":(editItem?"Enregistrer":"Planifier")}</button></>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Input label="Date" value={form.date} onChange={v=>setForm({...form,date:v})} type="date"/></div>
            <Select label="Vehicule" value={form.vh} onChange={v=>setForm({...form,vh:v})} options={[{value:"",label:"-- Choisir --"},...vehicles.map(v=>({value:v.id,label:v.immat}))]}/>
            <Select label="Chauffeur" value={form.ch} onChange={v=>setForm({...form,ch:v})} options={[{value:"",label:"-- Choisir --"},...drivers.filter(d=>d.status==="Actif").map(d=>({value:d.id,label:d.prenom+" "+d.nom+" ("+(d.matricule||d.id)+")"}))]}/> 
            <Select label="Type de shift" value={form.type} onChange={v=>setForm({...form,type:v})} options={[{value:"A",label:"Shift A (06h-14h)"},{value:"B",label:"Shift B (15h-23h)"},{value:"C",label:"Shift C (22h-06h)"}]}/>
            <Select label="Statut" value={form.status} onChange={v=>setForm({...form,status:v})} options={["Planifie","En cours","Termine"]}/>
            <Input label="Lieu de debut" value={form.lieuDebut} onChange={v=>setForm({...form,lieuDebut:v})} placeholder="Ex: Cocody"/>
            <Input label="Lieu de fin" value={form.lieuFin} onChange={v=>setForm({...form,lieuFin:v})} placeholder="Ex: Plateau"/>
            <div className="col-span-2"><Input label="Responsable de zone" value={form.responsableZone} onChange={v=>setForm({...form,responsableZone:v})}/></div>
            <div className="col-span-2">
              <Input label="Recette du shift (F CFA)" value={form.recette||""} onChange={v=>setForm({...form,recette:v})} type="number" placeholder="Ex: 15000"/>
              <div className="text-xs text-slate-400 mt-1">Montant collecté par le chauffeur — utilisé pour le classement CA et les graphiques</div>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-2">
            <div className="text-xs text-emerald-700 font-medium">Message WhatsApp automatique envoye au chauffeur apres planification</div>
          </div>
        </Modal>
      )}

      {/* MODAL DD DRIVING DATAS */}
      {showDDModal&&selectedShift&&(()=>{const driver=getDriver(selectedShift.ch);const vehicle=getVehicle(selectedShift.vh);return(
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto my-4">
              {/* Header DD */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">DD Driving Datas</h2>
                    <p className="text-blue-200 text-sm mt-1">Donnees quotidiennes du shift</p>
                  </div>
                  <button onClick={()=>setShowDDModal(false)} className="text-white/70 hover:text-white text-2xl font-bold">x</button>
                </div>
                {/* Info chauffeur + vehicule */}
                <div className="flex items-center gap-3 mt-4 bg-white/10 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {driver?(driver.prenom||"?")[0]+(driver.nom||"?")[0]:"?"}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{driver?driver.prenom+" "+driver.nom:"—"}</div>
                    <div className="text-blue-200 text-xs">{vehicle?.immat||"—"} · Shift {selectedShift.type} · {selectedShift.date||selectedShift.planned_start_date||""}</div>
                  </div>
                  <div className="ml-auto">
                    <Badge color={"bg-emerald-100 text-emerald-700"}>Shift {selectedShift.type}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Info saisie */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-sm font-medium text-blue-800 mb-1">Comment saisir les DD ?</div>
                  <div className="text-xs text-blue-700">Ces donnees proviennent des captures ecran du chauffeur — portefeuille Yango PRO (Commandes + Especes) et ecran de bord du vehicule (autonomie debut/fin)</div>
                </div>

                {/* Section Temps */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Heures reelles (10% du KPI)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Heure debut reelle" value={ddForm.heureDebutReelle||""} onChange={v=>setDDForm({...ddForm,heureDebutReelle:v})} type="time"/>
                    <Input label="Heure fin reelle" value={ddForm.heureFinReelle||""} onChange={v=>setDDForm({...ddForm,heureFinReelle:v})} type="time"/>
                  </div>
                </div>

                {/* Section Courses et Revenus */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Courses et revenus (30% du KPI)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre de courses (5%)" value={ddForm.nbCourses||0} onChange={v=>setDDForm({...ddForm,nbCourses:parseInt(v)||0})} type="number"/>
                    <Input label="Revenus generes — F CFA (25%)" value={ddForm.revenusGeneres||0} onChange={v=>setDDForm({...ddForm,revenusGeneres:parseInt(v)||0})} type="number"/>
                    <Input label="Commission Yango — F CFA (15%)" value={ddForm.commissionYango||0} onChange={v=>setDDForm({...ddForm,commissionYango:parseInt(v)||0})} type="number"/>
                    <Input label="Depenses autorisees — F CFA" value={ddForm.depensesAutorisees||0} onChange={v=>setDDForm({...ddForm,depensesAutorisees:parseInt(v)||0})} type="number"/>
                  </div>
                </div>

                {/* Section Batterie */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Consommation batterie (15% du KPI)</div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="Autonomie debut (%)" value={ddForm.autonomieDebut||0} onChange={v=>setDDForm({...ddForm,autonomieDebut:parseInt(v)||0})} type="number"/>
                    <Input label="Autonomie fin (%)" value={ddForm.autonomieFin||0} onChange={v=>setDDForm({...ddForm,autonomieFin:parseInt(v)||0})} type="number"/>
                    <Input label="Km parcourus" value={ddForm.kmParcourus||0} onChange={v=>setDDForm({...ddForm,kmParcourus:parseFloat(v)||0})} type="number"/>
                  </div>
                </div>

                {/* Note Yango */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Note et etat vehicule</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Note Yango du shift (/5) — 10%" value={ddForm.noteYangoShift||0} onChange={v=>setDDForm({...ddForm,noteYangoShift:parseFloat(v)||0})} type="number"/>
                    <div className="col-span-1"></div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etat vehicule et commentaires (20%)</label>
                      <textarea value={ddForm.commentaireShift||""} onChange={e=>setDDForm({...ddForm,commentaireShift:e.target.value})} rows={3} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Etat du vehicule, incidents, remarques..."/>
                    </div>
                  </div>
                </div>

                {/* Analyse automatique */}
                {ddForm.revenusGeneres>0&&(
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Analyse automatique</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recette nette</div>
                        <div className="font-bold text-emerald-600 text-sm">{fmt(recetteNette)}</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ratio commission</div>
                        <div className={"font-bold text-sm "+(ratioCommission>25?"text-red-600":ratioCommission>18?"text-amber-600":"text-emerald-600")}>{ratioCommission}%</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Conso batterie</div>
                        <div className="font-bold text-blue-600 text-sm">{consoBatterie}%</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Moy. par course</div>
                        <div className="font-bold text-violet-600 text-sm">{ddForm.nbCourses>0?fmt(Math.round(recetteNette/ddForm.nbCourses)):"—"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 bg-white rounded-b-2xl">
                <button onClick={()=>setShowDDModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50">Annuler</button>
                <button onClick={handleSaveDD} disabled={saving} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {saving?"Enregistrement...":"Enregistrer les DD"}
                </button>
              </div>
            </div>
          </div>
      );
      })()}
      {confirmDelete&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Supprimer ce shift ?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Cette action est irreversible.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="flex-1 border border-slate-200 dark:border-slate-700 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={async()=>{await onDelete(confirmDelete.id);setConfirmDelete(null);}} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
