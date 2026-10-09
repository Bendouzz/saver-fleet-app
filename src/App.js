import { useState, useEffect } from "react";
import { supabase, getUsers } from "./supabase.js";
import { useSupabase } from "./hooks/useSupabase.js";
import { mapVehicle, mapDriver, mapShift, mapReversement, mapRecharge, mapMaintenance, mapSite } from "./utils/mappers.js";
import { ALL_NAV, getNav, ROLE_LABELS } from "./utils/navigation.js";
import { NavIcon } from "./components/ui/NavIcon.jsx";
import { Badge } from "./components/ui/Badge.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SetPasswordPage } from "./pages/SetPasswordPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { VehiculesPage } from "./pages/VehiculesPage.jsx";
import { ChauffeursPage } from "./pages/ChauffeursPage.jsx";
import { PlanningPage } from "./pages/PlanningPage.jsx";
import { ReversementsPage } from "./pages/ReversementsPage.jsx";
import { KpiPaiePage } from "./pages/KpiPaiePage.jsx";
import { RechargePage } from "./pages/RechargePage.jsx";
import { MaintenancePage } from "./pages/MaintenancePage.jsx";
import { ReportingPage } from "./pages/ReportingPage.jsx";
import { GpsPage } from "./pages/GpsPage.jsx";
import { SitesPage } from "./pages/SitesPage.jsx";
import { RbacPage } from "./pages/RbacPage.jsx";

const App = () => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("saver_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Sauvegarder la session a chaque changement d utilisateur
  useEffect(() => {
    if(user) {
      localStorage.setItem("saver_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("saver_user");
    }
  }, [user]);
  const [page, setPage] = useState(() => localStorage.getItem("saver_page") || "dashboard");

  // Sauvegarder la page actuelle a chaque changement
  useEffect(() => {
    localStorage.setItem("saver_page", page);
  }, [page]);
  const [sideOpen, setSideOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({current:"", next:"", confirm:""});
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const handleChangePwd = async () => {
    setPwdError(""); setPwdSuccess("");
    if(!pwdForm.current) return setPwdError("Mot de passe actuel requis");
    if(pwdForm.next.length < 6) return setPwdError("Nouveau mot de passe minimum 6 caracteres");
    if(pwdForm.next !== pwdForm.confirm) return setPwdError("Les mots de passe ne correspondent pas");
    const users = await getUsers();
    const me = users.find(u => u.id === user?.id);
    if(!me || me.password !== pwdForm.current) return setPwdError("Mot de passe actuel incorrect");
    await supabase.from("users").update({password: pwdForm.next}).eq("id", user.id);
    setPwdSuccess("Mot de passe modifie avec succes !");
    setPwdForm({current:"", next:"", confirm:""});
    setTimeout(() => { setShowPwdModal(false); setPwdSuccess(""); }, 2000);
  };
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Global search results - avec guards pour eviter les crashes
  const searchResults = search.length >= 2 ? [
    ...(vh?.data||[]).filter(v => 
      (v.immat||"").toLowerCase().includes(search.toLowerCase()) ||
      (v.marque||"").toLowerCase().includes(search.toLowerCase()) ||
      (v.modele||"").toLowerCase().includes(search.toLowerCase())
    ).map(v => ({type:"vehicule", label:(v.immat||"")+" — "+(v.marque||"")+" "+(v.modele||""), id:v.id, page:"vehicules"})),
    ...(dr?.data||[]).filter(d =>
      (d.nom||"").toLowerCase().includes(search.toLowerCase()) ||
      (d.prenom||"").toLowerCase().includes(search.toLowerCase()) ||
      (d.matricule||d.driver_code||"").toLowerCase().includes(search.toLowerCase())
    ).map(d => ({type:"chauffeur", label:(d.prenom||"")+" "+(d.nom||"")+" ("+(d.matricule||d.driver_code||"")+")", id:d.id, page:"chauffeurs"})),
  ] : [];

  // Apply dark mode via CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if(darkMode) {
      root.style.setProperty("--bg-primary", "#0f172a");
      root.style.setProperty("--bg-secondary", "#1e293b");
      root.style.setProperty("--bg-card", "#1e293b");
      root.style.setProperty("--bg-input", "#334155");
      root.style.setProperty("--bg-hover", "#334155");
      root.style.setProperty("--bg-table-header", "#1e293b");
      root.style.setProperty("--text-primary", "#f1f5f9");
      root.style.setProperty("--text-secondary", "#94a3b8");
      root.style.setProperty("--text-muted", "#64748b");
      root.style.setProperty("--border-color", "#334155");
      root.style.setProperty("--border-light", "#334155");
      root.classList.add("dark-mode");
    } else {
      root.style.setProperty("--bg-primary", "#f1f5f9");
      root.style.setProperty("--bg-secondary", "#f8fafc");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--bg-input", "#ffffff");
      root.style.setProperty("--bg-hover", "#f8fafc");
      root.style.setProperty("--bg-table-header", "#f8fafc");
      root.style.setProperty("--text-primary", "#0f172a");
      root.style.setProperty("--text-secondary", "#475569");
      root.style.setProperty("--text-muted", "#94a3b8");
      root.style.setProperty("--border-color", "#e2e8f0");
      root.style.setProperty("--border-light", "#f1f5f9");
      root.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Supabase hooks
  const vh = useSupabase("vehicles", mapVehicle);
  const dr = useSupabase("drivers", mapDriver);
  const sh = useSupabase("shifts", mapShift);
  const rv = useSupabase("reversements", mapReversement);
  const rc = useSupabase("recharges", mapRecharge);
  const mt = useSupabase("maintenances", mapMaintenance);
  const si = useSupabase("sites", mapSite);

  const buildVehiclePayload = (item) => ({
    immat:item.immat||null, marque:item.marque||null, modele:item.modele||null,
    site:item.site||1, autonomie:item.autonomie||0, km:item.km||0, soc:item.soc||0,
    status:item.status||"En exploitation", typecontrat:item.typeContrat||"Interne SAVER",
    vin_number:item.vin||null, battery_capacity_kwh:item.capaciteBatterie||null,
    vehicle_year:item.annee||null, vehicle_color:item.couleur||null,
    service_type:item.typeService||"VTC", service_class:item.classesService||[],
    technical_visit_expiry:item.visiteDate||null, insurance_expiry:item.assuranceFin||null,
    assurancenum:item.assuranceNum||null, assurancedebut:item.assuranceDebut||null,
    assurancefin:item.assuranceFin||null,
    cartegrisenum:item.carteGriseNum||null, cartegrisedate:item.carteGriseDate||null,
    cartegriseproprietaire:item.carteGriseProprietaire||null, numerochassis:item.numeroChassis||null,
    photo_carte_grise:item.photoCarteGrise||null,
    photo_visite:item.photoVisite||null,
    photo_assurance:item.photoAssurance||null,
    photos_ext:item.photosExt||[],
    photos_int:item.photosInt||[],
  });
  const addVehicle = async (item) => {
    const payload = {
      id:"VH-"+Date.now(),
      immat:item.immat||null,
      marque:item.marque||null,
      modele:item.modele||null,
      site:item.site||1,
      autonomie:item.autonomie||0,
      km:item.km||0,
      soc:item.soc||0,
      status:item.status||"En exploitation",
      typecontrat:item.typecontrat||item.typeContrat||"Interne SAVER",
      vin_number:item.vin_number||item.vin||null,
      battery_capacity_kwh:item.battery_capacity_kwh||item.capaciteBatterie||null,
      vehicle_year:item.vehicle_year||item.annee||null,
      vehicle_color:item.vehicle_color||item.couleur||null,
      service_type:item.service_type||item.typeService||"VTC",
      service_class:item.service_class||item.classesService||[],
      technical_visit_expiry:item.technical_visit_expiry||item.visiteDate||null,
      insurance_expiry:item.insurance_expiry||item.assuranceFin||null,
      cartegrisenum:item.cartegrisenum||item.carteGriseNum||null,
      cartegrisedate:item.cartegrisedate||item.carteGriseDate||null,
      cartegriseproprietaire:item.cartegriseproprietaire||item.carteGriseProprietaire||null,
      assurancenum:item.assurancenum||item.assuranceNum||null,
      assurancedebut:item.assurancedebut||item.assuranceDebut||null,
      assurancefin:item.assurancefin||item.assuranceFin||null,
      numerochassis:item.numerochassis||item.numeroChassis||item.vin||null,
      binome:item.binome||[],
      photo_carte_grise:item.photo_carte_grise||item.photoCarteGrise||null,
      photo_visite:item.photo_visite||item.photoVisite||null,
      photo_assurance:item.photo_assurance||item.photoAssurance||null,
      photos_ext:item.photos_ext||item.photosExt||[],
      photos_int:item.photos_int||item.photosInt||[],
    };
    return await vh.add(payload);
  };
  const updateVehicle = async (id, item) => {
    // Merge buildVehiclePayload + champs directs deja en minuscules
    const base = buildVehiclePayload(item);
    const merged = {
      ...base,
      battery_capacity_kwh: item.battery_capacity_kwh || item.capaciteBatterie || base.battery_capacity_kwh || null,
      service_type: item.service_type || item.typeService || base.service_type || "VTC",
      service_class: item.service_class || item.classesService || base.service_class || [],
      technical_visit_expiry: item.technical_visit_expiry || item.visiteDate || base.technical_visit_expiry || null,
      insurance_expiry: item.insurance_expiry || item.assuranceFin || base.insurance_expiry || null,
      cartegrisenum: item.cartegrisenum || item.carteGriseNum || base.cartegrisenum || null,
      cartegrisedate: item.cartegrisedate || item.carteGriseDate || base.cartegrisedate || null,
      cartegriseproprietaire: item.cartegriseproprietaire || item.carteGriseProprietaire || base.cartegriseproprietaire || null,
      assurancenum: item.assurancenum || item.assuranceNum || base.assurancenum || null,
      assurancedebut: item.assurancedebut || item.assuranceDebut || base.assurancedebut || null,
      assurancefin: item.assurancefin || item.assuranceFin || base.assurancefin || null,
      numerochassis: item.numerochassis || item.numeroChassis || item.vin || base.numerochassis || null,
      typecontrat: item.typecontrat || item.typeContrat || base.typecontrat || "Interne SAVER",
      photo_carte_grise: item.photo_carte_grise || item.photoCarteGrise || null,
      photo_visite: item.photo_visite || item.photoVisite || null,
      photo_assurance: item.photo_assurance || item.photoAssurance || null,
      photos_ext: item.photos_ext || item.photosExt || [],
      photos_int: item.photos_int || item.photosInt || [],
    };
    return await vh.update(id, merged);
  };

  const buildDriverPayload = (item) => ({
    nom:item.nom||null,
    prenom:item.prenom||null,
    site:item.site||1,
    vehicule:item.vehicule||null,
    shift:item.shift||"A",
    status:item.status||"Actif",
    kpi:item.kpi||80,
    courses:item.courses||0,
    ca:item.ca||0,
    pen:item.pen||0,
    avance:item.avance||0,
    driver_code:item.matricule||null,
    contract_type:item.typeContrat||"Salarie",
    yango_score:item.noteYango||4.0,
    internal_score:item.noteInterne||80,
    license_number:item.permisNum||null,
    license_expiry_date:item.permisExpiration||null,
    id_card_number:item.pieceNum||null,
    id_card_expiry_date:item.pieceExpiration||null,
    emergency_contact:(item.contactUrgence||"")+" - "+(item.contactUrgenceTel||""),
    telephone:item.telephone||null,
    telephoneperso:item.telephonePerso||null,
    adresse:item.adresse||null,
    commentaires:item.commentaires||null,
    dettes:item.dettes||0,
    dettecommentaire:item.detteCommentaire||null,
    permistype:item.permisType||null,
    permisdelivrance:item.permisDelivrance||null,
    piecetype:item.pieceType||"CNI",
    piecedelivrance:item.pieceDelivrance||null,
    contacturgencetel:item.contactUrgenceTel||null,
    photo_face:item.photoFace||null,
    photos_profil:item.photosProfil||[],
    photo_plein_pied:item.photoPleinPied||null,
    photo_permis:item.photoPermis||null,
    photo_piece:item.photoPiece||null,
  });
  const addDriver = async (item) => {
    // item vient directement du handleSave avec les bons noms de colonnes
    // On n utilise PAS buildDriverPayload pour eviter l ecrasement
    // Generer matricule si absent
    const matricule = item.driver_code || item.matricule ||
      (item.nom && item.prenom ? ((item.nom[0]||"X")+(item.prenom[0]||"X")).toUpperCase()+"-"+(String(Date.now()).slice(-2)) : "DR-01");
    const payload = {
      id:"CH-"+Date.now(),
      nom:item.nom||null, prenom:item.prenom||null,
      site:item.site||1, vehicule:item.vehicule||null,
      shift:item.shift||"A", status:item.status||"Actif",
      kpi:item.kpi||80, courses:item.courses||0,
      ca:item.ca||0, pen:item.pen||0, avance:item.avance||0,
      driver_code:matricule,
      contract_type:item.contract_type||item.typeContrat||"Salarie",
      telephone:item.telephone||null,
      telephoneperso:item.telephoneperso||item.telephonePerso||null,
      adresse:item.adresse||null,
      emergency_contact:item.emergency_contact||null,
      contacturgencetel:item.contacturgencetel||item.contactUrgenceTel||null,
      license_number:item.license_number||item.permisNum||null,
      license_expiry_date:item.license_expiry_date||item.permisExpiration||null,
      id_card_number:item.id_card_number||item.pieceNum||null,
      id_card_expiry_date:item.id_card_expiry_date||item.pieceExpiration||null,
      permistype:item.permistype||item.permisType||null,
      permisdelivrance:item.permisdelivrance||item.permisDelivrance||null,
      piecetype:item.piecetype||item.pieceType||"CNI",
      piecedelivrance:item.piecedelivrance||item.pieceDelivrance||null,
      yango_score:item.yango_score||item.noteYango||4.0,
      internal_score:item.internal_score||item.noteInterne||80,
      commentaires:item.commentaires||null,
      dettes:item.dettes||0,
      dettecommentaire:item.dettecommentaire||item.detteCommentaire||null,
      photo_face:item.photo_face||item.photoFace||null,
      photos_profil:item.photos_profil||item.photosProfil||[],
      photo_plein_pied:item.photo_plein_pied||item.photoPleinPied||null,
      photo_permis:item.photo_permis||item.photoPermis||null,
      photo_piece:item.photo_piece||item.photoPiece||null,
    };
    return await dr.add(payload);
  };
  const updateDriver = async (id, item) => {
    // Merge buildDriverPayload + champs directs deja mappes
    const base = buildDriverPayload(item);
    const merged = {
      ...base,
      // Contrat
      contract_type: item.contract_type || item.typeContrat || base.contract_type || "Salarie",
      // Contact urgence
      emergency_contact: item.emergency_contact || base.emergency_contact || null,
      contacturgencetel: item.contacturgencetel || item.contactUrgenceTel || base.contacturgencetel || null,
      // KYC permis
      license_number: item.license_number || item.permisNum || base.license_number || null,
      license_expiry_date: item.license_expiry_date || item.permisExpiration || base.license_expiry_date || null,
      permistype: item.permistype || item.permisType || base.permistype || null,
      permisdelivrance: item.permisdelivrance || item.permisDelivrance || base.permisdelivrance || null,
      // KYC piece
      id_card_number: item.id_card_number || item.pieceNum || base.id_card_number || null,
      id_card_expiry_date: item.id_card_expiry_date || item.pieceExpiration || base.id_card_expiry_date || null,
      piecetype: item.piecetype || item.pieceType || base.piecetype || "CNI",
      piecedelivrance: item.piecedelivrance || item.pieceDelivrance || base.piecedelivrance || null,
      // Coordonnees
      telephone: item.telephone || base.telephone || null,
      telephoneperso: item.telephoneperso || item.telephonePerso || base.telephoneperso || null,
      adresse: item.adresse || base.adresse || null,
      // Performance
      yango_score: item.yango_score || item.noteYango || base.yango_score || 4.0,
      internal_score: item.internal_score || item.noteInterne || base.internal_score || 80,
      // Creance
      commentaires: item.commentaires || base.commentaires || null,
      dettes: item.dettes !== undefined ? item.dettes : (base.dettes || 0),
      dettecommentaire: item.dettecommentaire || item.detteCommentaire || base.dettecommentaire || null,
      // Photos
      photo_face: item.photo_face || item.photoFace || base.photo_face || null,
      photos_profil: item.photos_profil || item.photosProfil || base.photos_profil || [],
      photo_plein_pied: item.photo_plein_pied || item.photoPleinPied || base.photo_plein_pied || null,
      photo_permis: item.photo_permis || item.photoPermis || base.photo_permis || null,
      photo_piece: item.photo_piece || item.photoPiece || base.photo_piece || null,
    };
    return await dr.update(id, merged);
  };

  const buildShiftPayload = (item) => ({
    vh:item.vh||null, ch:item.ch||null,
    type:item.type||"A", shift_type:"Shift "+(item.type||"A"),
    planned_start_date:item.date||null, debut:item.debut||"06:00", fin:item.fin||"14:00",
    status:item.status||"Planifie", recette:item.recette||0,
    check_in:item.checkIn||false, check_out:item.checkOut||false,
    real_start_time:item.heureDebutReelle||null, real_end_time:item.heureFinReelle||null,
    km_driven:item.kmParcourus||0, battery_start:item.autonomieDebut||0, battery_end:item.autonomieFin||0,
    courses_count:item.nbCourses||0, revenue_cash:item.revenusGeneres||0,
    yango_commission:item.commissionYango||0, authorized_expenses:item.depensesAutorisees||0,
    yango_rating:item.noteYangoShift||0,
  });
  const addShift = async (item) => await sh.add({...buildShiftPayload(item), id:"SH-"+Date.now()});
  const updateShift = async (id, item) => {
    // Construire le payload directement sans filtre complexe
    const payload = {
      ...(item.vh !== undefined && { vh: item.vh }),
      ...(item.ch !== undefined && { ch: item.ch }),
      ...(item.type !== undefined && { type: item.type, shift_type: "Shift "+item.type }),
      ...(item.planned_start_date !== undefined && { planned_start_date: item.planned_start_date }),
      ...(item.debut !== undefined && { debut: item.debut }),
      ...(item.fin !== undefined && { fin: item.fin }),
      ...(item.lieuDebut !== undefined && { lieuDebut: item.lieuDebut }),
      ...(item.lieuFin !== undefined && { lieuFin: item.lieuFin }),
      ...(item.responsableZone !== undefined && { responsableZone: item.responsableZone }),
      ...(item.status !== undefined && { status: item.status }),
      ...(item.check_in !== undefined && { check_in: item.check_in }),
      ...(item.check_out !== undefined && { check_out: item.check_out }),
      ...(item.checkIn !== undefined && { check_in: item.checkIn }),
      ...(item.checkOut !== undefined && { check_out: item.checkOut }),
      ...(item.courses_count !== undefined && { courses_count: item.courses_count }),
      ...(item.nbCourses !== undefined && { courses_count: item.nbCourses }),
      ...(item.revenue_cash !== undefined && { revenue_cash: item.revenue_cash, recette: item.revenue_cash }),
      ...(item.revenusGeneres !== undefined && { revenue_cash: item.revenusGeneres, recette: item.revenusGeneres }),
      ...(item.recette !== undefined && { recette: item.recette }),
      ...(item.yango_commission !== undefined && { yango_commission: item.yango_commission }),
      ...(item.commissionYango !== undefined && { yango_commission: item.commissionYango }),
      ...(item.authorized_expenses !== undefined && { authorized_expenses: item.authorized_expenses }),
      ...(item.depensesAutorisees !== undefined && { authorized_expenses: item.depensesAutorisees }),
      ...(item.yango_rating !== undefined && { yango_rating: item.yango_rating }),
      ...(item.noteYangoShift !== undefined && { yango_rating: item.noteYangoShift }),
      ...(item.km_driven !== undefined && { km_driven: item.km_driven }),
      ...(item.kmParcourus !== undefined && { km_driven: item.kmParcourus }),
      ...(item.battery_start !== undefined && { battery_start: item.battery_start }),
      ...(item.autonomieDebut !== undefined && { battery_start: item.autonomieDebut }),
      ...(item.battery_end !== undefined && { battery_end: item.battery_end }),
      ...(item.autonomieFin !== undefined && { battery_end: item.autonomieFin }),
      ...(item.real_start_time !== undefined && { real_start_time: item.real_start_time }),
      ...(item.heureDebutReelle !== undefined && { real_start_time: item.heureDebutReelle||null }),
      ...(item.real_end_time !== undefined && { real_end_time: item.real_end_time }),
      ...(item.heureFinReelle !== undefined && { real_end_time: item.heureFinReelle||null }),
      ...(item.photo_selfie !== undefined && { photo_selfie: item.photo_selfie }),
      ...(item.photos_fin_shift !== undefined && { photos_fin_shift: item.photos_fin_shift }),
      ...(item.captures_yango !== undefined && { captures_yango: item.captures_yango }),
      ...(item.captures_bord !== undefined && { captures_bord: item.captures_bord }),
    };
    const { error } = await supabase.from("shifts").update(payload).eq("id", id);
    if (!error) sh.reload();
    return error;
  };

  const buildReversementPayload = (item) => ({
    ch: item.ch||null,
    driver_id: item.ch||null,
    montant: item.montant||0,
    amount_sent: item.montant||0,
    amount_requested: item.montant||0,
    canal: item.canal||"Wave Business",
    date: item.date||new Date().toISOString().split("T")[0],
    status: item.status||"En attente",
    ecart: item.ecart||0,
    authorized_expenses: item.authorized_expenses||item.depensesAutorisees||0,
    transaction_proof_url: item.transaction_proof_url||item.preuve||null,
    commentaire: item.commentaire||null,
  });
  const addReversement = async (item) => await rv.add({...buildReversementPayload(item), id:"RV-"+Date.now()});
  const updateReversement = async (id, item) => {
    // Update partiel — on envoie seulement les champs fournis
    const partial = {};
    if(item.status !== undefined) partial.status = item.status;
    if(item.ch !== undefined) { partial.ch = item.ch; partial.driver_id = item.ch; }
    if(item.montant !== undefined) { partial.montant = item.montant; partial.amount_sent = item.montant; partial.amount_requested = item.montant; }
    if(item.canal !== undefined) partial.canal = item.canal;
    if(item.date !== undefined) partial.date = item.date;
    if(item.ecart !== undefined) partial.ecart = item.ecart;
    if(item.authorized_expenses !== undefined) partial.authorized_expenses = item.authorized_expenses;
    if(item.depensesAutorisees !== undefined) partial.authorized_expenses = item.depensesAutorisees;
    if(item.transaction_proof_url !== undefined) partial.transaction_proof_url = item.transaction_proof_url;
    if(item.preuve !== undefined) partial.transaction_proof_url = item.preuve;
    if(item.commentaire !== undefined) partial.commentaire = item.commentaire;
    return await rv.update(id, partial);
  };

  const buildRechargePayload = (item) => ({
    vh: item.vh||null,
    ch: item.ch||null,
    partenaire: item.partenaire||"Domestique",
    kwh: item.kWh||item.kwh||0,
    cout: item.cout||0,
    lieu: item.lieu||null,
    duree: item.duree||0,
    soc_av: item.socAv||item.soc_av||0,
    soc_ap: item.socAp||item.soc_ap||0,
    date: item.date||new Date().toISOString().split("T")[0],
  });
  const addRecharge = async (item) => await rc.add({...buildRechargePayload(item), id:"RC-"+Date.now()});
  const updateRecharge = async (id, item) => await rc.update(id, buildRechargePayload(item));

  const buildMaintenancePayload = (item) => ({
    vh: item.vh||null,
    type: item.type||"Entretien",
    description: item.desc||item.description||null,
    status: item.status||"Planifiee",
    date: item.dateDebut||item.date||new Date().toISOString().split("T")[0],
    cout: item.cout||0,
    garage: item.garage||null,
  });
  const addMaintenance = async (item) => await mt.add({...buildMaintenancePayload(item), id:"MT-"+Date.now()});
  const updateMaintenance = async (id, item) => await mt.update(id, buildMaintenancePayload(item));

  const handleLogin = async (u) => {
    try {
      const {data} = await supabase.from("users").select("*").eq("id",u.id).single();
      setUser(data||u);
    } catch {
      setUser(u);
    }
  };

  // Verifier si c est un lien d invitation
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get("token");
  if (inviteToken) return <SetPasswordPage token={inviteToken} onDone={()=>window.location.href=window.location.pathname}/>;

  if (!user) return <LoginPage onLogin={handleLogin}/>;

  const pages = {
    dashboard: <DashboardPage vehicles={vh.data} drivers={dr.data} shifts={sh.data} reversements={rv.data} user={user}/>,
    vehicules: <VehiculesPage vehicles={vh.data} onAdd={addVehicle} onUpdate={updateVehicle} onDelete={vh.remove} sites={si.data}/>,
    chauffeurs: <ChauffeursPage drivers={dr.data} vehicles={vh.data} onAdd={addDriver} onUpdate={updateDriver} onDelete={dr.remove} sites={si.data}/>,
    planning: <PlanningPage shifts={sh.data} vehicles={vh.data} drivers={dr.data} onAdd={addShift} onUpdate={updateShift} onDelete={sh.remove} sites={si.data}/>,
    reversements: <ReversementsPage reversements={rv.data} drivers={dr.data} shifts={sh.data} onAdd={addReversement} onUpdate={updateReversement} onDelete={rv.remove} user={user}/>,
    kpi: <KpiPaiePage drivers={dr.data} shifts={sh.data} reversements={rv.data}/>,
    recharge: <RechargePage recharges={rc.data} vehicles={vh.data} drivers={dr.data} onAdd={addRecharge} onUpdate={updateRecharge} onDelete={rc.remove}/>,
    maintenance: <MaintenancePage maintenances={mt.data} vehicles={vh.data} onAdd={addMaintenance} onUpdate={updateMaintenance} onDelete={mt.remove}/>,
    gps: <GpsPage vehicles={vh.data}/>,
    reporting: <ReportingPage vehicles={vh.data} drivers={dr.data} recharges={rc.data} maintenances={mt.data} shifts={sh.data} reversements={rv.data}/>,
    sites: <SitesPage sites={si.data} vehicles={vh.data} drivers={dr.data} onAdd={si.add} onUpdate={si.update} onDelete={si.remove}/>,
    rbac: <RbacPage currentUser={user}/>,
  };

  const unread = 0;

  return (
    <><div className="min-h-screen bg-slate-100 flex">
      {sideOpen&&<div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={()=>setSideOpen(false)}/>}
      <aside className={(sideOpen?"w-64 translate-x-0":"-translate-x-full lg:translate-x-0 lg:w-20")+" fixed lg:relative z-30 h-full lg:h-auto bg-slate-950 text-white flex flex-col transition-all duration-300 flex-shrink-0"}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          {sideOpen&&<div><div className="font-bold text-sm">Easy by Saver</div><div className="text-xs text-slate-400">Gestion de flotte VTC</div></div>}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {getNav(user?.role).map(n=>(
            <button key={n.id} onClick={()=>{setPage(n.id);if(window.innerWidth<1024)setSideOpen(false);}} className={"w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors "+(page===n.id?"bg-emerald-600/20 text-emerald-400 border-r-2 border-emerald-400":"text-slate-400 hover:text-white hover:bg-slate-800")}>
              <NavIcon d={n.icon} className="w-5 h-5 flex-shrink-0"/>
              {sideOpen&&<span>{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700/50">
          {sideOpen&&<div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-xs font-bold">{(user.name||"?")[0]}</div><div><div className="text-sm font-medium">{user.name}</div><div className="text-xs text-slate-400">{ROLE_LABELS[user.role]||user.role}</div></div></div>}
          <button onClick={()=>{setShowPwdModal(true);setPwdForm({current:"",next:"",confirm:""});setPwdError("");setPwdSuccess("");}} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            {sideOpen&&"Changer mot de passe"}
          </button>
          <button onClick={()=>{setUser(null);setPage("dashboard");}} className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {sideOpen&&"Deconnexion"}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className={`border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200 dark:border-slate-700"}`}>
          <button onClick={()=>setSideOpen(!sideOpen)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:text-slate-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 lg:hidden">{ALL_NAV.find(n=>n.id===page)?.label}</div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setDarkMode(!darkMode)} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all" title={darkMode?"Mode clair":"Mode sombre"}>
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-px bg-slate-200"/>
              <div className="text-sm text-slate-500 dark:text-slate-400">{user.name}</div>
              <Badge color={{"admin":"bg-red-100 text-red-700","ops":"bg-emerald-100 text-emerald-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700","dispatcher":"bg-amber-100 text-amber-700"}[user.role]||"bg-slate-100 text-slate-600 dark:text-slate-400"}>{ROLE_LABELS[user.role]||user.role}</Badge>
            </div>
          </div>
        </header>
        <main className={`flex-1 p-4 lg:p-6 overflow-y-auto ${darkMode ? "bg-slate-900" : "bg-slate-100"}`}>{pages[page]}</main>
      </div>
    </div>
    {showPwdModal&&(
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Changer mon mot de passe</h2>
            <button onClick={()=>setShowPwdModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 text-xl font-bold">x</button>
          </div>
          {pwdError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{pwdError}</div>}
          {pwdSuccess&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-3 py-2 rounded-lg mb-3">{pwdSuccess}</div>}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mot de passe actuel</label>
              <input type="password" value={pwdForm.current} onChange={e=>setPwdForm({...pwdForm,current:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nouveau mot de passe</label>
              <input type="password" value={pwdForm.next} onChange={e=>setPwdForm({...pwdForm,next:e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Minimum 6 caracteres"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmer le nouveau mot de passe</label>
              <input type="password" value={pwdForm.confirm} onChange={e=>setPwdForm({...pwdForm,confirm:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleChangePwd()} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setShowPwdModal(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={handleChangePwd} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Modifier</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default App;