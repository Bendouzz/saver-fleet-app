
import { useState } from "react";

// ─── POSITIONS SIMULÉES ABIDJAN ───────────────────────────────────────────────
const DEFAULT_MARKERS = [
  { id: "mk1", x: 38,  y: 42,  status: "En service",   immat: "AB-001-CI", driver: "Koné Amadou",    tel: "+225 07 12 34 56", shift: "A", soc: 82 },
  { id: "mk2", x: 55,  y: 30,  status: "En service",   immat: "AB-002-CI", driver: "Traoré Moussa",  tel: "+225 05 98 76 54", shift: "B", soc: 61 },
  { id: "mk3", x: 67,  y: 55,  status: "En service",   immat: "AB-003-CI", driver: "Diallo Ibrahim", tel: "+225 01 23 45 67", shift: "A", soc: 74 },
  { id: "mk4", x: 25,  y: 62,  status: "En service",   immat: "AB-004-CI", driver: "Coulibaly Jean",  tel: "+225 07 77 88 99", shift: "C", soc: 45 },
  { id: "mk5", x: 72,  y: 25,  status: "Disponible",   immat: "AB-005-CI", driver: "Yao Kouassi",    tel: "+225 05 55 66 77", shift: "B", soc: 95 },
  { id: "mk6", x: 48,  y: 70,  status: "Maintenance",  immat: "AB-006-CI", driver: "Bamba Seydou",   tel: "+225 01 44 55 66", shift: "—", soc: 30 },
  { id: "mk7", x: 83,  y: 72,  status: "Hors service", immat: "AB-007-CI", driver: "Ouattara Ali",   tel: "+225 07 11 22 33", shift: "—", soc: 12 },
];

const STATUS_STYLE = {
  "En service":   { dot: "bg-blue-500",   ring: "ring-blue-400",   badge: "bg-blue-900/60 text-blue-400 border border-blue-800",   label: "En service" },
  "Disponible":   { dot: "bg-green-500",  ring: "ring-green-400",  badge: "bg-green-900/60 text-green-400 border border-green-800",  label: "Disponible" },
  "Maintenance":  { dot: "bg-amber-500",  ring: "ring-amber-400",  badge: "bg-amber-900/60 text-amber-400 border border-amber-800",  label: "Maintenance" },
  "Hors service": { dot: "bg-red-500",    ring: "ring-red-400",    badge: "bg-red-900/60 text-red-400 border border-red-800",        label: "Hors service" },
};

const LAYERS = [
  { id: "vehicles", label: "Véhicules",  color: "text-blue-400" },
  { id: "ev",       label: "Bornes EV",  color: "text-green-400" },
  { id: "garages",  label: "Garages",    color: "text-amber-400" },
  { id: "lavage",   label: "Lavage",     color: "text-violet-400" },
  { id: "vulcano",  label: "Vulcaniseurs", color: "text-slate-400" },
];

// Points d'intérêt simulés (Bornes EV, Garages, etc.)
const POI = [
  { id: "ev1",  layer: "ev",      x: 30, y: 55, label: "Borne EV · Plateau" },
  { id: "ev2",  layer: "ev",      x: 75, y: 40, label: "Borne EV · Marcory" },
  { id: "g1",   layer: "garages", x: 20, y: 30, label: "Garage Central" },
  { id: "g2",   layer: "garages", x: 60, y: 78, label: "Garage Sud" },
  { id: "l1",   layer: "lavage",  x: 45, y: 18, label: "Lavage · Cocody" },
  { id: "v1",   layer: "vulcano", x: 88, y: 58, label: "Vulcaniseur · Port Bouet" },
];

const POI_STYLE = {
  ev:      { bg: "bg-green-900/80 border-green-700",  dot: "bg-green-400",   icon: "⚡" },
  garages: { bg: "bg-amber-900/80 border-amber-700",  dot: "bg-amber-400",   icon: "🔧" },
  lavage:  { bg: "bg-violet-900/80 border-violet-700",dot: "bg-violet-400",  icon: "💧" },
  vulcano: { bg: "bg-slate-700 border-slate-600",     dot: "bg-slate-400",   icon: "O" },
};

// Rues simulées (lignes SVG)
const ROADS = [
  { d: "M 0,50 Q 30,45 60,50 T 100,48" },
  { d: "M 50,0 Q 48,30 50,60 T 52,100" },
  { d: "M 0,70 Q 40,65 80,70 T 100,68" },
  { d: "M 20,0 Q 22,50 18,100" },
  { d: "M 0,30 Q 50,28 100,32" },
  { d: "M 70,0 Q 72,40 68,100" },
];

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export const GpsPage = ({ vehicles = [], drivers = [] }) => {
  const [activeLayers, setActiveLayers] = useState({ vehicles: true, ev: true, garages: true, lavage: true, vulcano: true });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);  // marker id
  const [showPanel, setShowPanel] = useState(true);

  // Fusionner les données véhicules réels avec les marqueurs simulés
  const markers = DEFAULT_MARKERS.map((mk, i) => {
    const vh = vehicles[i];
    return vh ? { ...mk, immat: vh.immat, status: vh.status || mk.status, soc: vh.soc || mk.soc, id: vh.id } : mk;
  });

  const filteredMarkers = markers.filter(m =>
    activeLayers.vehicles &&
    (filterStatus === "all" || m.status === filterStatus)
  );

  const visiblePOI = POI.filter(p => activeLayers[p.layer]);

  const selectedMk = selected ? markers.find(m => m.id === selected) : null;

  const counts = {
    "En service":   markers.filter(m => m.status === "En service").length,
    "Disponible":   markers.filter(m => m.status === "Disponible").length,
    "Maintenance":  markers.filter(m => m.status === "Maintenance").length,
    "Hors service": markers.filter(m => m.status === "Hors service").length,
  };

  const toggleLayer = (id) => setActiveLayers(l => ({ ...l, [id]: !l[id] }));

  return (
    <div className="flex h-full bg-slate-900 text-slate-100 overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── CARTE ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden bg-slate-800">

        {/* Fond carte — grille type tuile sombre */}
        <div className="absolute inset-0 bg-slate-800"
          style={{ backgroundImage: "linear-gradient(rgba(100,116,139,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(100,116,139,0.08) 1px,transparent 1px)", backgroundSize: "40px 40px" }}>
        </div>

        {/* Zones de couleur (quartiers simulés) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full opacity-[0.06] bg-blue-400"   style={{ width: "45%", height: "45%", left: "10%",  top: "30%" }} />
          <div className="absolute rounded-full opacity-[0.05] bg-emerald-400" style={{ width: "35%", height: "40%", left: "50%",  top: "40%" }} />
          <div className="absolute rounded-full opacity-[0.05] bg-amber-400"  style={{ width: "30%", height: "30%", left: "20%",  top: "10%" }} />
        </div>

        {/* Rues SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {ROADS.map((r, i) => (
            <path key={i} d={r.d} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.8" />
          ))}
          {/* Route principale */}
          <path d="M 0,50 L 100,50" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1.2" />
          <path d="M 50,0 L 50,100" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1.2" />
        </svg>

        {/* Label zone */}
        <div className="absolute top-4 left-4 bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
          Abidjan · Flotte EV
        </div>

        {/* Points d'intérêt */}
        {visiblePOI.map(p => {
          const s = POI_STYLE[p.layer];
          return (
            <div key={p.id}
              className={`absolute flex items-center justify-center w-6 h-6 rounded-full border text-[10px] cursor-default ${s.bg} ${s.dot}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)" }}
              title={p.label}
            >
              <span className="text-white text-[10px]">{s.icon}</span>
            </div>
          );
        })}

        {/* Marqueurs véhicules */}
        {filteredMarkers.map(mk => {
          const st = STATUS_STYLE[mk.status] || STATUS_STYLE["Hors service"];
          const isSelected = selected === mk.id;
          return (
            <div key={mk.id} onClick={() => setSelected(isSelected ? null : mk.id)}
              className="absolute cursor-pointer group"
              style={{ left: `${mk.x}%`, top: `${mk.y}%`, transform: "translate(-50%,-50%)", zIndex: isSelected ? 20 : 10 }}>
              {/* Pulse */}
              {mk.status === "En service" && (
                <span className={`absolute inset-0 rounded-full animate-ping opacity-40 ${st.dot}`} />
              )}
              {/* Dot */}
              <div className={`w-4 h-4 rounded-full ${st.dot} ring-2 ${st.ring} ring-offset-1 ring-offset-slate-800 transition-transform ${isSelected ? "scale-150" : "group-hover:scale-125"}`} />
              {/* Label immat */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-slate-300 bg-slate-900/80 px-1 py-0.5 rounded hidden group-hover:block">
                {mk.immat}
              </div>
            </div>
          );
        })}

        {/* Popup sélectionné */}
        {selectedMk && (
          <div className="absolute z-30 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-4 w-56"
            style={{ left: `${Math.min(selectedMk.x + 3, 65)}%`, top: `${Math.max(selectedMk.y - 20, 5)}%` }}>
            <button onClick={() => setSelected(null)}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 text-sm leading-none">✕</button>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLE[selectedMk.status]?.dot || "bg-slate-500"}`} />
              <span className="font-bold text-white text-sm">{selectedMk.immat}</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Statut</span>
                <span className={`font-semibold px-1.5 py-0.5 rounded-full text-[10px] ${STATUS_STYLE[selectedMk.status]?.badge}`}>{selectedMk.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chauffeur</span>
                <span className="text-slate-300 font-medium truncate ml-2">{selectedMk.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift</span>
                <span className="text-slate-300">{selectedMk.shift}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">SOC batterie</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${selectedMk.soc >= 50 ? "bg-green-500" : selectedMk.soc >= 25 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${selectedMk.soc}%` }} />
                  </div>
                  <span className="text-slate-300 font-medium">{selectedMk.soc}%</span>
                </div>
              </div>
            </div>
            {/* Bouton WhatsApp */}
            <a href={`https://wa.me/${selectedMk.tel.replace(/\s/g, "")}`} target="_blank" rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white rounded-lg py-1.5 text-[11px] font-semibold w-full">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.534 5.845L0 24l6.336-1.61A11.948 11.948 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.546 9.546 0 01-4.862-1.323l-.35-.207-3.622.921.955-3.517-.228-.362A9.554 9.554 0 012.4 12c0-5.294 4.306-9.6 9.6-9.6 5.294 0 9.6 4.306 9.6 9.6 0 5.294-4.306 9.6-9.6 9.6z"/></svg>
              {selectedMk.tel}
            </a>
          </div>
        )}

        {/* Contrôles bas gauche : échelle + boussole */}
        <div className="absolute bottom-6 left-4 flex flex-col items-start gap-2">
          {/* Échelle */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-0.5 bg-slate-400" />
            <span className="text-[10px] text-slate-400">5 km</span>
          </div>
          {/* Boussole */}
          <div className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M12 2 L14 10 L12 9 L10 10 Z" fill="#f87171" />
              <path d="M12 22 L14 14 L12 15 L10 14 Z" fill="#94a3b8" />
            </svg>
          </div>
        </div>

        {/* Légende bas droite */}
        <div className="absolute bottom-6 right-4 bg-slate-900/80 border border-slate-700 rounded-lg p-3">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Légende</div>
          {Object.entries(STATUS_STYLE).map(([s, st]) => (
            <div key={s} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
              <span className="text-[10px] text-slate-400">{st.label}</span>
            </div>
          ))}
        </div>

        {/* Bouton toggle panneau */}
        <button onClick={() => setShowPanel(p => !p)}
          className="absolute top-4 right-4 bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-white z-10">
          {showPanel ? "Masquer panneau" : "Afficher panneau"}
        </button>
      </div>

      {/* ── PANNEAU DROIT ─────────────────────────────────────────────────── */}
      {showPanel && (
        <div className="w-72 shrink-0 border-l border-slate-700 flex flex-col bg-slate-900 overflow-y-auto">

          {/* Résumé flotte */}
          <div className="p-4 border-b border-slate-700">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Résumé flotte</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(counts).map(([s, n]) => {
                const st = STATUS_STYLE[s];
                return (
                  <button key={s} onClick={() => setFilterStatus(f => f === s ? "all" : s)}
                    className={`rounded-lg p-2.5 text-center border transition-all ${filterStatus === s ? st.badge : "bg-slate-800 border-slate-700 hover:border-slate-600"}`}>
                    <div className="text-xl font-bold text-white">{n}</div>
                    <div className={`text-[9px] mt-0.5 ${filterStatus === s ? "" : "text-slate-500"}`}>{s}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calques */}
          <div className="p-4 border-b border-slate-700">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Calques</div>
            <div className="space-y-2">
              {LAYERS.map(l => (
                <label key={l.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${activeLayers[l.id] ? "bg-blue-600 border-blue-600" : "border-slate-600"}`}
                    onClick={() => toggleLayer(l.id)}>
                    {activeLayers[l.id] && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-sm font-medium ${activeLayers[l.id] ? l.color : "text-slate-500"}`}>{l.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Liste véhicules */}
          <div className="p-4 flex-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Véhicules ({filteredMarkers.length})
            </div>
            <div className="space-y-2">
              {filteredMarkers.map(mk => {
                const st = STATUS_STYLE[mk.status] || STATUS_STYLE["Hors service"];
                const isSelected = selected === mk.id;
                return (
                  <div key={mk.id} onClick={() => setSelected(isSelected ? null : mk.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${isSelected ? "bg-blue-900/30 border-blue-800" : "bg-slate-800 border-slate-700 hover:border-slate-600"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">{mk.immat}</div>
                      <div className="text-[11px] text-slate-500 truncate">{mk.driver}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.badge}`}>{mk.status}</span>
                      {/* SOC mini */}
                      <div className="flex items-center gap-1">
                        <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${mk.soc >= 50 ? "bg-green-500" : mk.soc >= 25 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${mk.soc}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-500">{mk.soc}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredMarkers.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-6">Aucun véhicule</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React from "react";

export const GpsPage = ({vehicles}) => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">GPS et Securite</h1>
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
      <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Carte de la flotte</h2>
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl h-64 flex items-center justify-center border border-slate-200 dark:border-slate-700">
        <div className="text-center text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <p className="font-medium">Carte GPS LUOGU</p>
          <p className="text-sm">Integration API boitier IoT en attente</p>
          <div className="mt-4 flex justify-center flex-wrap gap-2">
            {vehicles.map(v=><div key={v.id} className={"px-3 py-1.5 rounded-full text-xs font-medium "+(v.status==="En exploitation"?"bg-emerald-100 text-emerald-700":v.status==="En recharge"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700")}>{v.immat}</div>)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

 d5271cf (refactor: architecture multi-fichiers)
