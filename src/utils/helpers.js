// Fichier : src/utils/helpers.js

export const generateDriverCode = (firstname, lastname, index = 1) => {
  // On s'assure que les prénoms et noms existent pour éviter les erreurs
  if (!firstname || !lastname) return '';
  
  const initials = (firstname[0] + lastname[0]).toUpperCase();
  return `${initials}-${String(index).padStart(2, '0')}`;
};

export const calculateSAVERPay = (shifts) => {
  // 1. Cumul des données sur la période (2 semaines)
  const totalDays = shifts.length;
  const totalCash = shifts.reduce((sum, s) => sum + (Number(s.revenue_cash) || 0), 0);
  const totalCom = shifts.reduce((sum, s) => sum + (Number(s.yango_commission) || 0), 0);
  const totalCourses = shifts.reduce((sum, s) => sum + (Number(s.courses_count) || 0), 0);

  // 2. Salaire de base (5 357 F / jour)
  const baseSalary = 5357 * totalDays;

  // 3. Recettes nettes et Surplus (Objectif 350k)
  const netRevenue = totalCash - totalCom;
  const surplus = Math.max(0, netRevenue - 350000);

  // 4. Bonus selon paliers de courses (Objectif 168 courses)
  const extraCourses = totalCourses - 168;
  let bonusRate = 0;

  if (extraCourses >= 36) bonusRate = 0.75;
  else if (extraCourses >= 26) bonusRate = 0.50;
  else if (extraCourses >= 20) bonusRate = 0.35;
  else if (extraCourses >= 11) bonusRate = 0.25;
  else if (extraCourses >= 1) bonusRate = 0.10;

  // 5. Plafond du bonus à 25 000 F
  const calculatedBonus = Math.min(25000, surplus * bonusRate);

  return {
    baseSalary,
    calculatedBonus,
    netToPay: baseSalary + calculatedBonus,
    totalCourses,
    netRevenue
  };
};