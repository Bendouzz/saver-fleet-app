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

