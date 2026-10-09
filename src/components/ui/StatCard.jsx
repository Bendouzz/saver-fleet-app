import React from "react";

export const StatCard = ({label, value, sub, color="text-slate-900 dark:text-white", icon}) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
      {icon && <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-white "+icon.bg}>{icon.el}</div>}
    </div>
    <div className={"text-2xl font-bold "+color}>{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
  </div>
);

