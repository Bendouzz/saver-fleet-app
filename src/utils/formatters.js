// Formatters utilitaires
export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n||0) + " F";
export const fmtK = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+"M" : n >= 1000 ? Math.round(n/1000)+"k" : (n||0).toString();
