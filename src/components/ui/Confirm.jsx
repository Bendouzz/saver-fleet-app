import React from "react";

export const Confirm = ({msg, onConfirm, onCancel}) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">{msg}</h3>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-slate-200 dark:border-slate-700 py-2 rounded-lg text-sm">Annuler</button>
        <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm">Confirmer</button>
      </div>
    </div>
  </div>
);

