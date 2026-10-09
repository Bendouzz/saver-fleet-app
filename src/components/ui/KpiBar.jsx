import React from "react";

export const KpiBar = ({value}) => {
  const col = value>=80?"bg-emerald-500":value>=60?"bg-amber-500":"bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={"h-full "+col+" rounded-full"} style={{width:value+"%"}}/></div><span className="text-xs text-slate-600 dark:text-slate-400">{value}%</span></div>;
};

