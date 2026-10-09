import React from "react";

export const SocBar = ({soc}) => {
  const col = soc > 70 ? "bg-emerald-500" : soc > 40 ? "bg-amber-500" : "bg-red-500";
  return <div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"><div className={"h-full "+col+" rounded-full"} style={{width:soc+"%"}}/></div><span className="text-xs font-medium text-slate-600 dark:text-slate-400">{soc}%</span></div>;
};

