// Mappers Supabase → App
export const mapVehicle = (r) => ({
  ...r,
  site: r.site || 1,
  soc: r.soc || 0,
  km: r.km || 0,
  autonomie: r.autonomie || 0,
  modele: r.modele || "",
  immat: r.immat || "",
  status: r.status || "En exploitation",
  marque: r.marque || "",
  // Colonnes en minuscules Supabase
  vin: r.vin_number || r.numerochassis || "",
  capaciteBatterie: r.battery_capacity_kwh || 0,
  annee: r.vehicle_year || "",
  couleur: r.vehicle_color || "",
  typeService: r.service_type || "VTC",
  classesService: r.service_class || [],
  visiteDate: r.technical_visit_expiry || "",
  assuranceFin: r.insurance_expiry || r.assurancefin || "",
  typeContrat: r.typecontrat || r.typeContrat || "Interne SAVER",
  assuranceNum: r.assurancenum || r.assuranceNum || "",
  assuranceDebut: r.assurancedebut || r.assuranceDebut || "",
  carteGriseNum: r.cartegrisenum || r.carteGriseNum || "",
  carteGriseDate: r.cartegrisedate || r.carteGriseDate || "",
  carteGriseProprietaire: r.cartegriseproprietaire || r.carteGriseProprietaire || "",
  numeroChassis: r.numerochassis || r.numeroChassis || r.vin_number || "",
  binome: r.binome || [],
  // Photos
  photosExt: Array.isArray(r.photos_ext) ? r.photos_ext : (r.photos_ext ? JSON.parse(r.photos_ext) : []),
  photosInt: Array.isArray(r.photos_int) ? r.photos_int : (r.photos_int ? JSON.parse(r.photos_int) : []),
  photoCarteGrise: r.photo_carte_grise || null,
  photoVisite: r.photo_visite || null,
  photoAssurance: r.photo_assurance || null,
});

export const mapDriver = (r) => ({
  ...r,
  nom: r.nom || "",
  prenom: r.prenom || "",
  site: r.site || 1,
  status: r.status || "Actif",
  kpi: r.kpi || 80,
  courses: r.courses || 0,
  ca: r.ca || 0,
  pen: r.pen || 0,
  avance: r.avance || 0,
  // Nouvelles colonnes
  matricule: r.driver_code || r.id,
  permisNum: r.license_number || "",
  permisExpiration: r.license_expiry_date || "",
  pieceNum: r.id_card_number || "",
  pieceExpiration: r.id_card_expiry_date || "",
  typeContrat: r.contract_type || "Salarie",
  contactUrgence: r.emergency_contact || "",
  noteYango: r.yango_score || 4.0,
  noteInterne: r.internal_score || 80,
  telephone: r.telephone || "",
  telephonePerso: r.telephoneperso || r.telephonePerso || "",
  adresse: r.adresse || "",
  dettes: r.dettes || 0,
  detteCommentaire: r.dettecommentaire || r.detteCommentaire || "",
  commentaires: r.commentaires || "",
  vehicule: r.vehicule || "",
  shift: r.shift || "A",
  permisType: r.permistype || r.permisType || "",
  permisDelivrance: r.permisdelivrance || r.permisDelivrance || "",
  pieceType: r.piecetype || r.pieceType || "CNI",
  pieceDelivrance: r.piecedelivrance || r.pieceDelivrance || "",
  // Contact urgence - split depuis emergency_contact "num1 - num2"
  contactUrgence: (r.emergency_contact && r.emergency_contact.includes(" - "))
    ? r.emergency_contact.split(" - ")[0].trim()
    : (r.emergency_contact || r.contactUrgence || ""),
  contactUrgenceTel: r.contacturgencetel || r.emergency_phone
    || ((r.emergency_contact && r.emergency_contact.includes(" - "))
      ? r.emergency_contact.split(" - ")[1].trim()
      : "") || "",
  // Scores
  noteYango: r.yango_score || r.noteYango || 4.0,
  noteInterne: r.internal_score || r.noteInterne || 80,
  // Matricule
  matricule: r.driver_code || r.matricule || r.id,
  // Contrat
  typeContrat: r.contract_type || r.typeContrat || "Salarie",
  // Permis
  permisNum: r.license_number || r.permisNum || "",
  permisExpiration: r.license_expiry_date || r.permisExpiration || "",
  permisType: r.permistype || r.license_type || r.permisType || "",
  permisDelivrance: r.permisdelivrance || r.license_issue_date || r.permisDelivrance || "",
  // Piece ID
  pieceNum: r.id_card_number || r.pieceNum || "",
  pieceExpiration: r.id_card_expiry_date || r.pieceExpiration || "",
  pieceType: r.piecetype || r.pieceType || "CNI",
  pieceDelivrance: r.piecedelivrance || r.id_card_issue_date || r.pieceDelivrance || "",
  photoFace: r.photo_face || null,
  photosProfil: Array.isArray(r.photos_profil) ? r.photos_profil : (r.photos_profil ? JSON.parse(r.photos_profil) : []),
  photoPleinPied: r.photo_plein_pied || null,
  photoPermis: r.photo_permis || null,
  photoPiece: r.photo_piece || null,
});

export const mapShift = (r) => ({
  ...r,
  vh: r.vh || "",
  ch: r.ch || "",
  type: r.shift_type?.replace("Shift ","") || r.type || "A",
  debut: r.debut || "06:00",
  fin: r.fin || "14:00",
  status: r.status || "Planifie",
  recette: r.recette || r.revenue_cash || 0,
  checkIn: r.check_in || false,
  checkOut: r.check_out || false,
  // DD Driving datas
  heureDebutReelle: r.real_start_time || "",
  heureFinReelle: r.real_end_time || "",
  kmParcourus: r.km_driven || 0,
  autonomieDebut: r.battery_start || 0,
  autonomieFin: r.battery_end || 0,
  nbCourses: r.courses_count || 0,
  revenusGeneres: r.revenue_cash || 0,
  commissionYango: r.yango_commission || 0,
  depensesAutorisees: r.authorized_expenses || 0,
  noteYangoShift: r.yango_rating || 0,
  lieuDebut: r.lieuDebut || "",
  lieuFin: r.lieuFin || "",
  responsableZone: r.responsableZone || "",
  commentaireShift: r.commentaireShift || "",
  date: r.planned_start_date || (r.created_at ? r.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
});

export const mapReversement = (r) => ({
  ...r,
  ch: r.driver_id || r.ch || "",
  montant: r.amount_sent || r.montant || 0,
  canal: r.canal || "Wave",
  date: r.date || r.created_at?.split("T")[0] || "",
  status: r.status || "En attente",
  ecart: r.ecart || 0,
  depensesAutorisees: r.authorized_expenses || 0,
  preuve: r.transaction_proof_url || "",
});

export const mapRecharge = (r) => ({
  ...r,
  vh: r.vh || "",
  ch: r.ch || "",
  kWh: r.kwh || r.kWh || 0,
  cout: r.cout || 0,
  lieu: r.lieu || "",
  duree: r.duree || 0,
  socAv: r.soc_av || 0,
  socAp: r.soc_ap || 0,
  date: r.date || "",
  partenaire: r.partenaire || "",
  typeCharge: r.typeCharge || "Partenaire",
});

export const mapMaintenance = (r) => ({
  ...r,
  vh: r.vh || "",
  desc: r.description || r.desc || "",
  cout: r.cout || 0,
  garage: r.garage || "",
  status: r.status || "Planifiee",
  date: r.date || "",
  type: r.type || "Preventive",
});

export const mapSite = (r) => ({
  ...r,
  name: r.name || "",
  ville: r.ville || "",
  zone: r.zone || "",
  waveAccount: r.waveAccount || r["waveAccount"] || "",
  businessType: r.businessType || r["businessType"] || "Wave Business",
});
