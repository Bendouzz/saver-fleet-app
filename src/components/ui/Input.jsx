import React from "react";

export const Input = ({label, value, onChange, type="text", placeholder="", required=false, hint=""}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}{required&&<span className="text-red-500 ml-1">*</span>}{hint&&<span className="text-xs text-slate-400 ml-1">{hint}</span>}</label>
    <input type={type} value={value||""} onChange={e=>onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value)} placeholder={placeholder} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"/>
  </div>
);

