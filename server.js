// server.js — Easy by Saver · API Express → Supabase PostgreSQL
// Installation : npm install express cors pg bcrypt jsonwebtoken helmet express-rate-limit
// Lancement    : node server.js  (ou nodemon server.js)

const express   = require("express");
const cors      = require("cors");
const rateLimit = require("express-rate-limit");
const { Pool }  = require("pg");
const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");

const JWT_SECRET = "saver_secret_key_2025";
const PORT = process.env.PORT || 3001;

// ── CONNEXION SUPABASE ────────────────────────────────────────────────────────
// Supabase Dashboard → Settings → Database → Connection string → URI
// Copier-coller la connection string "Transaction pooler" (port 6543) ou "Session" (port 5432)
// Session pooler — IPv4 compatible (remplace la connexion directe IPv6)
// Si ça échoue encore, va dans Supabase → Connect → Session pooler et copie le host exact
const pool = new Pool({
  host:     "aws-1-eu-west-1.pooler.supabase.com",
  port:     5432,
  database: "postgres",
  user:     "postgres.tgmzrhldehltqsloylqs",
  password: "Mgji6VTmSCiQBPGO",
  ssl:      { rejectUnauthorized: false },
});

// Test connexion au démarrage
pool.query("SELECT 1").then(() => console.log("Supabase PostgreSQL connecte")).catch(e => console.error("Connexion Supabase echouee:", e.message));

const app = express();

// ── SÉCURITÉ ──────────────────────────────────────────────────────────────────
// CORS en premier (avant helmet) pour que les preflight OPTIONS passent
const corsOptions = {
  origin: (origin, cb) => {
    // Autoriser : pas d'origine, localhost, et tous les domaines Vercel du projet
    if (
      !origin ||
      origin === "http://localhost:3000" ||
      origin === "http://localhost:3001" ||
      /^https:\/\/saver-fleet-.*\.vercel\.app$/.test(origin) ||
      origin === "https://saver-fleet-app.vercel.app"
    ) {
      return cb(null, true);
    }
    cb(new Error("CORS non autorisé : " + origin));
  }
};
app.use(cors(corsOptions));

// Masquer X-Powered-By manuellement (sans helmet)
app.disable("x-powered-by");

// Rate limiting : max 10 tentatives de login par IP par 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: "50mb" }));

// ── MIDDLEWARE AUTH ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token manquant" });
  try {
    req.user = jwt.verify(header.replace("Bearer ", ""), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expire" });
  }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post("/auth/login", loginLimiter, async (req, res) => {
  try {
    const { email, password, mot_de_passe } = req.body;
    const pwd = mot_de_passe || password;
    if (!email || !pwd) return res.status(400).json({ error: "Email et mot de passe requis" });

    const r = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: "Email incorrect" });

    // Support bcrypt ET plaintext (migration progressive)
    let ok = false;
    const isHashed = user.password?.startsWith("$2b$") || user.password?.startsWith("$2a$");
    if (isHashed) {
      ok = await bcrypt.compare(pwd, user.password);
    } else {
      ok = user.password === pwd;
      // Migration auto : hasher le mot de passe en clair
      if (ok) {
        const hash = await bcrypt.hash(pwd, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, user.id]);
      }
    }
    if (!ok) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error("/auth/login", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/auth/me", auth, async (req, res) => {
  const r = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [req.user.id]);
  res.json(r.rows[0] || null);
});

// ── VÉHICULES ─────────────────────────────────────────────────────────────────
app.get("/vehicules", auth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM vehicles ORDER BY created_at DESC");
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/vehicules", auth, async (req, res) => {
  try {
    const b = req.body;
    const serialize = (v) => Array.isArray(v) ? JSON.stringify(v) : (v || "[]");
    const r = await pool.query(
      `INSERT INTO vehicles (
        id, immat, marque, modele, status, soc, km, autonomie, site,
        typecontrat, vin_number, battery_capacity_kwh, vehicle_year, vehicle_color,
        service_type, service_class, technical_visit_expiry, insurance_expiry,
        assurancenum, assurancedebut, assurancefin,
        cartegrisenum, cartegrisedate, cartegriseproprietaire, numerochassis,
        photos_ext, photos_int, photo_carte_grise, photo_visite, photo_assurance
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      ) RETURNING *`,
      [
        b.id || "VH-" + Date.now(),
        b.immat || null, b.marque || null, b.modele || null,
        b.status || "En exploitation",
        b.soc || 0, b.km || 0, b.autonomie || 0, b.site || 1,
        b.typecontrat || "Interne SAVER",
        b.vin_number || null,
        b.battery_capacity_kwh ? parseFloat(b.battery_capacity_kwh) : null,
        b.vehicle_year ? parseInt(b.vehicle_year) : null,
        b.vehicle_color || null,
        b.service_type || "VTC",
        serialize(b.service_class),
        b.technical_visit_expiry || null, b.insurance_expiry || null,
        b.assurancenum || null, b.assurancedebut || null, b.assurancefin || null,
        b.cartegrisenum || null, b.cartegrisedate || null,
        b.cartegriseproprietaire || null, b.numerochassis || null,
        serialize(b.photos_ext), serialize(b.photos_int),
        b.photo_carte_grise || null, b.photo_visite || null, b.photo_assurance || null,
      ]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/vehicules/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const fields = [
      "immat","marque","modele","status","soc","km","autonomie","site","typecontrat",
      "vin_number","battery_capacity_kwh","vehicle_year","vehicle_color","service_type",
      "service_class","technical_visit_expiry","insurance_expiry",
      "assurancenum","assurancedebut","assurancefin",
      "cartegrisenum","cartegrisedate","cartegriseproprietaire","numerochassis",
      "photos_ext","photos_int","photo_carte_grise","photo_visite","photo_assurance"
    ];
    const arrayFields = ["service_class","photos_ext","photos_int"];
    const sets = fields.map((f, i) => `${f} = COALESCE($${i + 1}, ${f})`).join(", ");
    const vals = fields.map(f => {
      if (b[f] === undefined) return null;
      if (arrayFields.includes(f) && Array.isArray(b[f])) return JSON.stringify(b[f]);
      return b[f] ?? null;
    });
    const r = await pool.query(
      `UPDATE vehicles SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/vehicules/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM vehicles WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CHAUFFEURS ────────────────────────────────────────────────────────────────
app.get("/chauffeurs", auth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM drivers ORDER BY created_at DESC");
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/chauffeurs", auth, async (req, res) => {
  try {
    const b = req.body;
    // Générer driver_code auto si absent
    let driver_code = b.driver_code || b.matricule;
    if (!driver_code) {
      const initiales = ((b.prenom?.[0] || "") + (b.nom?.[0] || "")).toUpperCase() || "DR";
      const cnt = await pool.query("SELECT COUNT(*) FROM drivers WHERE driver_code LIKE $1", [initiales + "%"]);
      driver_code = initiales + "-" + String(parseInt(cnt.rows[0].count) + 1).padStart(2, "0");
    }
    const r = await pool.query(
      `INSERT INTO drivers (
        id, nom, prenom, driver_code, telephone, telephoneperso, status, site,
        vehicule, shift, kpi, courses, ca, pen, avance, contract_type, adresse,
        emergency_contact, contacturgencetel,
        license_number, license_expiry_date, permistype, permisdelivrance,
        id_card_number, id_card_expiry_date, piecetype, piecedelivrance,
        yango_score, internal_score, commentaires, dettes, dettecommentaire,
        photo_face, photos_profil, photo_plein_pied, photo_permis, photo_piece
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37
      ) RETURNING *`,
      [
        b.id || "CH-" + Date.now(),
        b.nom || null, b.prenom || null, driver_code,
        b.telephone || null, b.telephoneperso || null,
        b.status || "Actif", b.site || 1,
        b.vehicule || null, b.shift || "A",
        b.kpi || 80, b.courses || 0, b.ca || 0, b.pen || 0, b.avance || 0,
        b.contract_type || "Salarie",
        b.adresse || null,
        b.emergency_contact || null, b.contacturgencetel || null,
        b.license_number || null, b.license_expiry_date || null,
        b.permistype || null, b.permisdelivrance || null,
        b.id_card_number || null, b.id_card_expiry_date || null,
        b.piecetype || "CNI", b.piecedelivrance || null,
        b.yango_score || 4.0, b.internal_score || 80,
        b.commentaires || null, b.dettes || 0, b.dettecommentaire || null,
        b.photo_face || null,
        JSON.stringify(Array.isArray(b.photos_profil) ? b.photos_profil : []),
        b.photo_plein_pied || null, b.photo_permis || null, b.photo_piece || null,
      ]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/chauffeurs/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const fields = [
      "nom","prenom","driver_code","telephone","telephoneperso","status","site",
      "vehicule","shift","kpi","courses","ca","pen","avance","contract_type","adresse",
      "emergency_contact","contacturgencetel",
      "license_number","license_expiry_date","permistype","permisdelivrance",
      "id_card_number","id_card_expiry_date","piecetype","piecedelivrance",
      "yango_score","internal_score","commentaires","dettes","dettecommentaire",
      "photo_face","photos_profil","photo_plein_pied","photo_permis","photo_piece"
    ];
    const sets = fields.map((f, i) => `${f} = COALESCE($${i + 1}, ${f})`).join(", ");
    const vals = fields.map(f => {
      if (b[f] === undefined) return null;
      if (f === "photos_profil" && Array.isArray(b[f])) return JSON.stringify(b[f]);
      return b[f] ?? null;
    });
    const r = await pool.query(
      `UPDATE drivers SET ${sets} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/chauffeurs/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM drivers WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PLANNING (SHIFTS) ─────────────────────────────────────────────────────────
app.get("/planning", auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.*, v.immat, d.nom, d.prenom, d.driver_code
      FROM shifts s
      LEFT JOIN vehicles v ON s.vh = v.id
      LEFT JOIN drivers d ON s.ch = d.id
      ORDER BY s.planned_start_date DESC, s.created_at DESC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/planning", auth, async (req, res) => {
  try {
    const b = req.body;
    const r = await pool.query(
      `INSERT INTO shifts (
        id, vh, ch, type, shift_type, planned_start_date, debut, fin, status,
        "lieuDebut", "lieuFin", "responsableZone", "responsableZoneContact"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        b.id || "SH-" + Date.now(),
        b.vh || null, b.ch || null,
        b.type || "A",
        "Shift " + (b.type || "A"),
        b.planned_start_date || b.date || null,
        b.debut || "06:00", b.fin || "14:00",
        b.status || "Planifie",
        b.lieuDebut || null, b.lieuFin || null,
        b.responsableZone || null, b.responsableZoneContact || null,
      ]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/planning/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const allowed = [
      "vh","ch","type","shift_type","planned_start_date","debut","fin","status",
      "lieuDebut","lieuFin","responsableZone","responsableZoneContact",
      "check_in","check_out","real_start_time","real_end_time",
      "km_driven","battery_start","battery_end","courses_count","revenue_cash",
      "recette","yango_commission","authorized_expenses","yango_rating",
      "photo_selfie","photos_fin_shift","captures_yango","captures_bord","commentaireShift"
    ];
    const partial = {};
    allowed.forEach(f => { if (b[f] !== undefined) partial[f] = b[f]; });
    const keys = Object.keys(partial);
    if (keys.length === 0) return res.json({});
    // Guillemets pour colonnes camelCase
    const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
    const r = await pool.query(
      `UPDATE shifts SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...keys.map(k => partial[k]), req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/planning/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM shifts WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REVERSEMENTS ──────────────────────────────────────────────────────────────
app.get("/reversements", auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT rv.*, d.nom, d.prenom, d.driver_code
      FROM reversements rv
      LEFT JOIN drivers d ON rv.ch = d.id
      ORDER BY rv.date DESC, rv.created_at DESC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/reversements", auth, async (req, res) => {
  try {
    const b = req.body;
    const r = await pool.query(
      `INSERT INTO reversements (
        id, ch, driver_id, montant, amount_sent, amount_requested,
        canal, date, status, ecart, authorized_expenses, transaction_proof_url, commentaire, site
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        b.id || "RV-" + Date.now(),
        b.ch || null, b.ch || null,
        b.montant || 0, b.montant || 0,
        b.amount_requested || b.montant || 0,
        b.canal || "Especes",
        b.date || new Date().toISOString().slice(0, 10),
        b.status || "En attente",
        b.ecart || 0,
        b.authorized_expenses || 0,
        b.transaction_proof_url || null,
        b.commentaire || null,
        b.site || null,
      ]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/reversements/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const allowed = [
      "ch","driver_id","montant","amount_sent","amount_requested",
      "canal","date","status","ecart","authorized_expenses",
      "transaction_proof_url","commentaire","site"
    ];
    const partial = {};
    allowed.forEach(f => { if (b[f] !== undefined) partial[f] = b[f]; });
    const keys = Object.keys(partial);
    if (keys.length === 0) return res.json({});
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const r = await pool.query(
      `UPDATE reversements SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...keys.map(k => partial[k]), req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/reversements/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM reversements WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RECHARGES ─────────────────────────────────────────────────────────────────
app.get("/recharges", auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT rc.*, v.immat, d.nom, d.prenom, d.driver_code
      FROM recharges rc
      LEFT JOIN vehicles v ON rc.vh = v.id
      LEFT JOIN drivers d ON rc.ch = d.id
      ORDER BY rc.date DESC, rc.created_at DESC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/recharges", auth, async (req, res) => {
  try {
    const b = req.body;
    const r = await pool.query(
      `INSERT INTO recharges (id, vh, ch, kwh, cout, lieu, duree, soc_av, soc_ap, date, partenaire, "typeCharge", note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        b.id || "RC-" + Date.now(),
        b.vh || null, b.ch || null,
        b.kWh || b.kwh || 0,
        b.cout || 0,
        b.lieu || null, b.duree || 0,
        b.soc_av || b.socAv || 0,
        b.soc_ap || b.socAp || 0,
        b.date || new Date().toISOString().slice(0, 10),
        b.partenaire || b.operateur || null,
        b.typeCharge || "Borne partenaire",
        b.note || null,
      ]
    );
    // Mettre à jour le SOC du véhicule
    const newSoc = b.soc_ap || b.socAp;
    if (newSoc && b.vh) {
      await pool.query("UPDATE vehicles SET soc = $1 WHERE id = $2", [newSoc, b.vh]);
    }
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/recharges/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const partial = {};
    const map = { kWh: "kwh", kwh: "kwh", socAv: "soc_av", socAp: "soc_ap", soc_av: "soc_av", soc_ap: "soc_ap" };
    ["vh","ch","lieu","duree","cout","date","partenaire","note"].forEach(f => { if (b[f] !== undefined) partial[f] = b[f]; });
    Object.entries(map).forEach(([src, dst]) => { if (b[src] !== undefined) partial[dst] = b[src]; });
    if (b.typeCharge !== undefined) partial['"typeCharge"'] = b.typeCharge;
    const keys = Object.keys(partial);
    if (keys.length === 0) return res.json({});
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const r = await pool.query(
      `UPDATE recharges SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...keys.map(k => partial[k]), req.params.id]
    );
    const newSoc = b.soc_ap || b.socAp;
    if (newSoc && b.vh) {
      await pool.query("UPDATE vehicles SET soc = $1 WHERE id = $2", [newSoc, b.vh]);
    }
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/recharges/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM recharges WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MAINTENANCES ──────────────────────────────────────────────────────────────
app.get("/maintenance", auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT m.*, v.immat, v.marque
      FROM maintenances m
      LEFT JOIN vehicles v ON m.vh = v.id
      ORDER BY m.date DESC
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/maintenance", auth, async (req, res) => {
  try {
    const b = req.body;
    const r = await pool.query(
      `INSERT INTO maintenances (id, vh, type, description, status, date, cout, garage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        b.id || "MT-" + Date.now(),
        b.vh || null,
        b.type || "Preventive",
        b.description || b.desc || null,
        b.status || "Planifiee",
        b.date || new Date().toISOString().slice(0, 10),
        b.cout || 0,
        b.garage || null,
      ]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/maintenance/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const partial = {};
    ["vh","type","status","date","cout","garage"].forEach(f => { if (b[f] !== undefined) partial[f] = b[f]; });
    if (b.description !== undefined) partial.description = b.description;
    if (b.desc !== undefined) partial.description = b.desc;
    const keys = Object.keys(partial);
    if (keys.length === 0) return res.json({});
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const r = await pool.query(
      `UPDATE maintenances SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
      [...keys.map(k => partial[k]), req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/maintenance/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM maintenances WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SITES ─────────────────────────────────────────────────────────────────────
app.get("/sites", auth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM sites ORDER BY created_at DESC");
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/sites", auth, async (req, res) => {
  try {
    const b = req.body;
    const r = await pool.query(
      `INSERT INTO sites (id, name, ville, zone, "waveAccount", "businessType")
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [b.id || "ST-" + Date.now(), b.name, b.ville || null, b.zone || null, b.waveAccount || null, b.businessType || "Wave Business"]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/sites/:id", auth, async (req, res) => {
  try {
    const b = req.body;
    const r = await pool.query(
      `UPDATE sites SET name=$1, ville=$2, zone=$3, "waveAccount"=$4, "businessType"=$5 WHERE id=$6 RETURNING *`,
      [b.name, b.ville || null, b.zone || null, b.waveAccount || null, b.businessType || null, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/sites/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM sites WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UTILISATEURS ──────────────────────────────────────────────────────────────
app.get("/utilisateurs", auth, async (req, res) => {
  try {
    const r = await pool.query("SELECT id, name, email, role FROM users ORDER BY created_at DESC");
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/utilisateurs", auth, async (req, res) => {
  try {
    const { name, email, password, mot_de_passe, role } = req.body;
    const pwd = password || mot_de_passe;
    const hash = await bcrypt.hash(pwd, 10);
    const r = await pool.query(
      "INSERT INTO users (id, name, email, password, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role",
      ["USR-" + Date.now(), name, email, hash, role || "dispatcher"]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/utilisateurs/:id", auth, async (req, res) => {
  try {
    const { name, email, role, password, mot_de_passe } = req.body;
    const pwd = password || mot_de_passe;
    if (pwd) {
      const hash = await bcrypt.hash(pwd, 10);
      await pool.query("UPDATE users SET name=$1, email=$2, role=$3, password=$4 WHERE id=$5", [name, email, role, hash, req.params.id]);
    } else {
      await pool.query("UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4", [name, email, role, req.params.id]);
    }
    const r = await pool.query("SELECT id, name, email, role FROM users WHERE id=$1", [req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/utilisateurs/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── STATS DASHBOARD ───────────────────────────────────────────────────────────
app.get("/stats", auth, async (req, res) => {
  try {
    const [v, d, s] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM vehicles"),
      pool.query("SELECT COUNT(*) FROM drivers WHERE status = 'Actif'"),
      pool.query("SELECT COUNT(*) FROM shifts WHERE status = 'En cours'"),
    ]);
    res.json({
      vehicules:      parseInt(v.rows[0].count),
      chauffeurs:     parseInt(d.rows[0].count),
      shiftsEnCours:  parseInt(s.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\nAPI Easy by Saver demarree → http://localhost:${PORT}`);
  console.log("Routes disponibles : /auth/login, /vehicules, /chauffeurs, /planning, /reversements, /recharges, /maintenance, /sites, /utilisateurs\n");
});
