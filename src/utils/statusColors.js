// Injection CSS globale pour le mode sombre
const darkModeCSS = `
  .dark-mode * {
    --tw-bg-opacity: 1;
  }
  .dark-mode .bg-white {
    background-color: #1e293b !important;
  }
  .dark-mode .bg-slate-50 {
    background-color: #0f172a !important;
  }
  .dark-mode .bg-slate-100 {
    background-color: #0f172a !important;
  }
  .dark-mode .border-slate-200 {
    border-color: #334155 !important;
  }
  .dark-mode .border-slate-100 {
    border-color: #1e293b !important;
  }
  .dark-mode .text-slate-900 {
    color: #f1f5f9 !important;
  }
  .dark-mode .text-slate-800 {
    color: #e2e8f0 !important;
  }
  .dark-mode .text-slate-700 {
    color: #cbd5e1 !important;
  }
  .dark-mode .text-slate-600 {
    color: #94a3b8 !important;
  }
  .dark-mode .text-slate-500 {
    color: #64748b !important;
  }
  .dark-mode .text-slate-400 {
    color: #475569 !important;
  }
  .dark-mode .hover\\:bg-slate-50:hover {
    background-color: #1e293b !important;
  }
  .dark-mode .hover\\:bg-blue-50:hover {
    background-color: #1e3a5f !important;
  }
  .dark-mode input, .dark-mode select, .dark-mode textarea {
    background-color: #334155 !important;
    color: #f1f5f9 !important;
    border-color: #475569 !important;
  }
  .dark-mode input::placeholder {
    color: #64748b !important;
  }
  .dark-mode .bg-slate-900 {
    background-color: #020617 !important;
  }
  .dark-mode .border-slate-700 {
    border-color: #334155 !important;
  }
`;

if(typeof document !== "undefined") {
  const style = document.createElement("style");
  style.id = "dark-mode-styles";
  style.textContent = darkModeCSS;
  if(!document.getElementById("dark-mode-styles")) {
    document.head.appendChild(style);
  }
}

// Status colors mapping
export const sc = (s) => {
  const map = {
    "Actif":"bg-emerald-100 text-emerald-700","En exploitation":"bg-emerald-100 text-emerald-700",
    "En cours":"bg-emerald-100 text-emerald-700","Planifie":"bg-slate-100 text-slate-600 dark:text-slate-400",
    "Planifié":"bg-slate-100 text-slate-600 dark:text-slate-400","Terminé":"bg-slate-100 text-slate-500 dark:text-slate-400",
    "Termine":"bg-slate-100 text-slate-500 dark:text-slate-400","Suspendu":"bg-red-100 text-red-700",
    "Inactif":"bg-slate-100 text-slate-400","En recharge":"bg-amber-100 text-amber-700",
    "Maintenance":"bg-orange-100 text-orange-700","Immobilisé":"bg-red-100 text-red-700",
    "Immobilise":"bg-red-100 text-red-700","Validé":"bg-emerald-100 text-emerald-700",
    "En attente":"bg-amber-100 text-amber-700","Écart détecté":"bg-red-100 text-red-700",
    "Ecart detecte":"bg-red-100 text-red-700","Planifiée":"bg-emerald-100 text-emerald-700",
    "Terminée":"bg-slate-100 text-slate-500 dark:text-slate-400",
  };
  return map[s] || "bg-slate-100 text-slate-600 dark:text-slate-400";
};
