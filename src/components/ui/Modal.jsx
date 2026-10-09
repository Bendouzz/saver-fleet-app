import React from "react";

export const Modal = ({title, onClose, children, footer}) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto my-4">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 text-xl font-bold">x</button>
      </div>
      <div className="p-6 space-y-4">{children}</div>
      {footer && <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 bg-white">{footer}</div>}
    </div>
  </div>
);

