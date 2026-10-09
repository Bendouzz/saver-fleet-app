import React from "react";

export const Badge = ({color, children}) => <span className={"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium "+color}>{children}</span>;
