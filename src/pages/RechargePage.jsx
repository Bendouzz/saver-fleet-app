// RechargePage.jsx — Easy by Saver · Dark theme Tailwind · Onglets Saisie/Analyse
import { useState, useMemo } from "react";
import { Confirm } from "../components/ui/Confirm.jsx";
import { fmt } from "../utils/formatters.js";

const fmtK = (n) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n >= 1_000 ? Math.round(n / 1_000) + "k" : (n || 0).toString();

// ─── RÉFÉRENTIEL LIEUX ──────────────────────────────────────────────────────
const LIEUX_DOMESTIQUES = [
  "Domicile chauffeur",
  "Depot SAVER - Cocody",
  "Depot SAVER - Yopougon",
  "Prise murale partagee",
  "Autre domicile",
];

const OPERATEURS_BORNES = {
  "TotalEnergies CI":  ["Station Total - Riviera 2", "Station Total - Plateau", "Station Total - Marcory", "Station Total - Yopougon", "Autre borne TotalEnergies"],
  "CIE Mobilite":      ["Borne CIE - Cocody Angre", "Borne CIE - Riviera Palmeraie", "Borne CIE - Marcory Zone 4", "Autre borne CIE"],
  "Bolore":            ["Hub Bolore - Port d'Abidjan", "Site Bolore - Vridi", "Autre borne Bolore"],
  "Shell CI":          ["Station Shell - Adjame", "Station Shell - Yopougon Niangon", "Station Shell - Plateau", "Autre borne Shell"],
};

const TYPE_LABELS = ["Domestique AC lent", "Domestique DC rapide", "Borne partenaire"];
const TYPE_STYLE = {
  "Domestique AC lent":   "bg-blue-900/60 text-blue-400 border border-blue-800",
  "Domestique DC rapide": "bg-violet-900/60 text-violet-400 border border-violet-800",
  "Borne partenaire":     "bg-green-900/60 text-green-400 border border-green-800",
  "Partenaire":           "bg-green-900/60 text-green-400 border border-green-800",
};

const INP = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500";
const LBL = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

const emptyForm = {
  vh: "", ch: "", date: new Date().toISOString().slice(0, 10),
  typeCharge: "Borne partenaire",
  operateur: "", lieu: "",
  kWh: "", cout: "", duree: "", socAv: "", socAp: "", note: ""
};

export const RechargePage = ({ recharges = [], vehicles = [], drivers = [], shifts = [], onAdd, onUpdate, onDelete }) => {
  const [onglet,        setOnglet]        = useState("saisie");
  const [form,          setForm]          = useState(emptyForm);
  const [editId,        setEditId]        = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterVh,      setFilterVh]      = useState("");

  // ── Auto-detect chauffeur (vehicule + date → shift terminé) ─────────────
  const autoDetect = useMemo(() => {
    if (!form.vh || !form.date) return null;
    const sh = shifts.find(s =>
      (s.vh || s.vehicle_id) === form.vh &&
      (s.status === "Terminé" || s.status === "Termine") &&
      (s.planned_start_date || s.date || "").startsWith(form.date)
    );
    if (!sh) return null;
    const drv = drivers.find(d => d.id === (sh.ch || sh.driver_id));
    return { shiftId: sh.id, chId: sh.ch || sh.driver_id, drv, shift: sh };
  }, [form.vh, form.date, shifts, drivers]);

  const hi = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const isDomestique = form.typeCharge.startsWith("Domestique");
  const isBorne      = form.typeCharge === "Borne partenaire";

  const handleSave = async () => {
    if (!form.vh) return alert("Vehicule obligatoire");
    if (!form.kWh) return alert("kWh obligatoire");
    const chFinal = form.ch || (autoDetect?.chId ?? "");
    const lieuFinal = form.lieu || form.operateur || "Non renseigne";
    const payload = {
      vh: form.vh, ch: chFinal || null,
      typeCharge: form.typeCharge,
      partenaire: isBorne ? (form.operateur || null) : null,
      lieu: lieuFinal,
      kWh: parseFloat(form.kWh) || 0, kwh: parseFloat(form.kWh) || 0,
      cout: parseInt(form.cout) || 0,
      duree: parseInt(form.duree) || 0,
      soc_av: parseInt(form.socAv) || 0, socAv: parseInt(form.socAv) || 0,
      soc_ap: parseInt(form.socAp) || 0, socAp: parseInt(form.socAp) || 0,
      note: form.note || null,
      date: form.date,
    };
    if (editId) {
      await onUpdate(editId, payload);
      setEditId(null);
    } else {
      await onAdd({ ...payload, id: "RC-" + Date.now() });
    }
    setForm(emptyForm);
  };

  const openEdit = (r) => {
    setForm({
      ...emptyForm,
      vh: r.vh || "", ch: r.ch || "", date: r.date || "",
      typeCharge: r.typeCharge || "Borne partenaire",
      operateur: r.partenaire || "", lieu: r.lieu || "",
      kWh: r.kWh ?? r.kwh ?? "", cout: r.cout || "", duree: r.duree || "",
      socAv: r.soc_av ?? r.socAv ?? "", socAp: r.soc_ap ?? r.socAp ?? "",
      note: r.note || ""
    });
    setEditId(r.id);
    setOnglet("saisie");
  };

  // ── Stats analyse ──────────────────────────────────────────────────────
  const filtered = recharges.filter(r => !filterVh || r.vh === filterVh);
  const totalKwh   = filtered.reduce((a, r) => a + (parseFloat(r.kWh || r.kwh || 0) || 0), 0);
  const totalCout  = filtered.reduce((a, r) => a + (r.cout || 0), 0);
  const avgGainSoc = filtered.length > 0 ? Math.round(filtered.reduce((a, r) => a + ((r.soc_ap ?? r.socAp ?? 0) - (r.soc_av ?? r.socAv ?? 0)), 0) / filtered.length) : 0;

  // Recharges par jour (last 14 days)
  const parJour = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = (r.date || "").slice(0, 10);
      if (!k) return;
      if (!map[k]) map[k] = { date: k, nb: 0, kwh: 0, cout: 0 };
      map[k].nb++;
      map[k].kwh  += parseFloat(r.kWh || r.kwh || 0) || 0;
      map[k].cout += r.cout || 0;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  }, [filtered]);

  const parType = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const t = r.typeCharge || "Inconnu";
      if (!map[t]) map[t] = { type: t, nb: 0, kwh: 0 };
      map[t].nb++;
      map[t].kwh += parseFloat(r.kWh || r.kwh || 0) || 0;
    });
    return Object.values(map).sort((a, b) => b.nb - a.nb);
  }, [filtered]);

  const parOperateur = useMemo(() => {
    const map = {};
    filtered.filter(r => r.typeCharge === "Borne partenaire").forEach(r => {
      const op = r.partenaire || "Autre";
      if (!map[op]) map[op] = { op, nb: 0, kwh: 0 };
      map[op].nb++;
      map[op].kwh += parseFloat(r.kWh || r.kwh || 0) || 0;
    });
    return Object.values(map).sort((a, b) => b.nb - a.nb);
  }, [filtered]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── HEADER ── */}
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Recharges EV</h1>
        <p className="text-xs text-slate-500 mt-0.5">{recharges.length} session(s) enregistrees</p>
      </div>

      {/* ── ONGLETS ── */}
      <div className="px-6 pt-4 flex gap-2">
        {[["saisie", "Saisie recharge"], ["analyse", "Analyse consommation"]].map(([id, label]) => (
          <button key={id} onClick={() => setOnglet(id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${onglet === id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-6 pb-6 pt-5">

        {/* ─────────── SAISIE ─────────── */}
        {onglet === "saisie" && (
          <>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-3xl mb-6">
              <h3 className="text-base font-bold text-white mb-5">
                {editId ? "Modifier la recharge" : "Nouvelle recharge"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LBL}>Date *</label>
                  <input className={INP} type="date" value={form.date} onChange={hi("date")} />
                </div>
                <div>
                  <label className={LBL}>Vehicule *</label>
                  <select className={INP} value={form.vh} onChange={hi("vh")}>
                    <option value="">-- Choisir --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.immat}</option>)}
                  </select>
                </div>

                {/* Auto-detect chauffeur */}
                {autoDetect ? (
                  <div className="col-span-2 bg-green-900/30 border border-green-800 rounded-xl px-4 py-3">
                    <div className="text-xs font-bold text-green-400 mb-2">Chauffeur detecte automatiquement</div>
                    <div className="flex items-center gap-4 text-sm text-green-300">
                      <span><strong>{autoDetect.drv ? `${autoDetect.drv.prenom} ${autoDetect.drv.nom}` : autoDetect.chId}</strong></span>
                      <span className="text-green-600">·</span>
                      <span>{autoDetect.shift.shift_type || "Shift " + autoDetect.shift.type}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={LBL}>Chauffeur (manuel si non detecte)</label>
                    <select className={INP} value={form.ch} onChange={hi("ch")}>
                      <option value="">-- Choisir --</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_code || d.matricule} · {d.prenom} {d.nom}</option>)}
                    </select>
                  </div>
                )}

                <div className={autoDetect ? "" : ""}>
                  <label className={LBL}>Type de charge</label>
                  <select className={INP} value={form.typeCharge} onChange={hi("typeCharge")}>
                    {TYPE_LABELS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Lieux selon type */}
                {isDomestique && (
                  <div className="col-span-2">
                    <label className={LBL}>Lieu de recharge domestique</label>
                    <select className={INP} value={form.lieu} onChange={hi("lieu")}>
                      <option value="">-- Choisir --</option>
                      {LIEUX_DOMESTIQUES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}

                {isBorne && (
                  <>
                    <div>
                      <label className={LBL}>Operateur borne *</label>
                      <select className={INP} value={form.operateur} onChange={e => setForm(f => ({ ...f, operateur: e.target.value, lieu: "" }))}>
                        <option value="">-- Choisir operateur --</option>
                        {Object.keys(OPERATEURS_BORNES).map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={LBL}>Station / Point de charge</label>
                      <select className={INP} value={form.lieu} onChange={hi("lieu")} disabled={!form.operateur}>
                        <option value="">-- Choisir station --</option>
                        {(OPERATEURS_BORNES[form.operateur] || []).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className={LBL}>kWh charges *</label>
                  <input className={INP} type="number" step="0.1" value={form.kWh} onChange={hi("kWh")} placeholder="Ex: 32.5" />
                </div>
                <div>
                  <label className={LBL}>Cout (FCFA)</label>
                  <input className={INP} type="number" value={form.cout} onChange={hi("cout")} placeholder="0" />
                </div>
                <div>
                  <label className={LBL}>SOC avant (%)</label>
                  <input className={INP} type="number" min="0" max="100" value={form.socAv} onChange={hi("socAv")} placeholder="15" />
                </div>
                <div>
                  <label className={LBL}>SOC apres (%)</label>
                  <input className={INP} type="number" min="0" max="100" value={form.socAp} onChange={hi("socAp")} placeholder="95" />
                </div>
                <div>
                  <label className={LBL}>Duree (min)</label>
                  <input className={INP} type="number" value={form.duree} onChange={hi("duree")} placeholder="0" />
                </div>
                <div>
                  <label className={LBL}>Note</label>
                  <input className={INP} value={form.note} onChange={hi("note")} />
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                {editId && (
                  <button onClick={() => { setForm(emptyForm); setEditId(null); }}
                    className="border border-slate-600 text-slate-300 px-5 py-2.5 rounded-xl text-sm hover:bg-slate-700">
                    Annuler
                  </button>
                )}
                <button onClick={handleSave}
                  className="bg-green-700 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                  {editId ? "Enregistrer" : "Ajouter la recharge"}
                </button>
              </div>
            </div>

            {/* Table historique dans onglet saisie */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-x-auto">
              <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-white text-sm">Historique</span>
                <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none" value={filterVh} onChange={e => setFilterVh(e.target.value)}>
                  <option value="">Tous les vehicules</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.immat}</option>)}
                </select>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    {["Date", "Vehicule", "Chauffeur", "Type", "Lieu / Operateur", "kWh", "Cout", "SOC", "Duree", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-10 text-slate-500 text-sm">Aucune recharge</td></tr>
                  )}
                  {filtered.map(r => {
                    const vh  = vehicles.find(v => v.id === r.vh);
                    const drv = drivers.find(d => d.id === r.ch);
                    const kWh = parseFloat(r.kWh || r.kwh || 0) || 0;
                    const socAv = r.soc_av ?? r.socAv ?? 0;
                    const socAp = r.soc_ap ?? r.socAp ?? 0;
                    const typeCl = TYPE_STYLE[r.typeCharge] || "bg-slate-700 text-slate-300";
                    return (
                      <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString("fr-FR") : "-"}</td>
                        <td className="px-4 py-3 font-semibold text-white">{vh?.immat || r.vh}</td>
                        <td className="px-4 py-3 text-slate-400">{drv ? `${drv.prenom} ${drv.nom}` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeCl}`}>{r.typeCharge || "Partenaire"}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{r.partenaire || r.lieu || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-green-400">{kWh.toFixed(1)} kWh</td>
                        <td className="px-4 py-3 text-slate-300">{r.cout ? fmt(r.cout) + " F" : "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-red-400 text-xs">{socAv}%</span>
                            <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${socAp}%` }} />
                            </div>
                            <span className="text-green-400 text-xs">{socAp}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{r.duree ? `${r.duree} min` : "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => openEdit(r)} className="text-[11px] text-blue-400 border border-blue-800 px-2 py-1 rounded-lg hover:bg-blue-900/30">Modifier</button>
                            <button onClick={() => setConfirmDelete(r)} className="text-[11px] text-red-400 border border-red-800 px-2 py-1 rounded-lg hover:bg-red-900/30">Suppr.</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-600 bg-slate-900/50">
                      <td colSpan={5} className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">TOTAL</td>
                      <td className="px-4 py-3 font-bold text-green-400">{totalKwh.toFixed(1)} kWh</td>
                      <td className="px-4 py-3 font-bold text-slate-300">{fmt(totalCout)} F</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}

        {/* ─────────── ANALYSE ─────────── */}
        {onglet === "analyse" && (
          <>
            {/* Filtres */}
            <div className="flex gap-3 mb-5 flex-wrap">
              <select className={`${INP} max-w-xs`} value={filterVh} onChange={e => setFilterVh(e.target.value)}>
                <option value="">Tous les vehicules</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.immat}</option>)}
              </select>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Sessions totales",   val: filtered.length,             color: "text-white" },
                { label: "kWh consommes",       val: totalKwh.toFixed(1) + " kWh", color: "text-green-400" },
                { label: "Cout total",          val: fmtK(totalCout) + " F",      color: "text-amber-400" },
                { label: "SOC moyen gagne",     val: "+" + avgGainSoc + "%",       color: "text-blue-400" },
              ].map(k => (
                <div key={k.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5 text-center">
                  <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
                  <div className="text-xs text-slate-500 mt-2">{k.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Par jour */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700">
                  <span className="font-semibold text-white text-sm">Consommation par jour (14 derniers)</span>
                </div>
                {parJour.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">Aucune donnee</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/30">
                        {["Date", "Sessions", "kWh", "Cout"].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parJour.map(j => (
                        <tr key={j.date} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                          <td className="px-4 py-2.5 text-slate-400">{new Date(j.date).toLocaleDateString("fr-FR")}</td>
                          <td className="px-4 py-2.5 text-slate-300">{j.nb}</td>
                          <td className="px-4 py-2.5 text-green-400 font-semibold">{parseFloat(j.kwh).toFixed(1)}</td>
                          <td className="px-4 py-2.5 text-slate-300">{j.cout ? fmt(j.cout) + " F" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="space-y-5">
                {/* Par type */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                  <div className="font-semibold text-white text-sm mb-4">Repartition par type</div>
                  {parType.length === 0 ? (
                    <div className="text-slate-500 text-sm">Aucune donnee</div>
                  ) : parType.map(t => (
                    <div key={t.type} className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>{t.type}</span>
                        <span className="font-semibold text-slate-300">{t.nb} sessions · {parseFloat(t.kwh).toFixed(1)} kWh</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${filtered.length > 0 ? Math.round(t.nb / filtered.length * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Par operateur borne */}
                {parOperateur.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="font-semibold text-white text-sm mb-4">Operateurs bornes utilises</div>
                    {parOperateur.map(o => (
                      <div key={o.op} className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>{o.op}</span>
                          <span className="font-semibold text-green-400">{parseFloat(o.kwh).toFixed(1)} kWh</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${parOperateur[0]?.kwh > 0 ? Math.round(o.kwh / parOperateur[0].kwh * 100) : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <Confirm msg="Supprimer cette recharge ?"
          onConfirm={async () => { await onDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};
