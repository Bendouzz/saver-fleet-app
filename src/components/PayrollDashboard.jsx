import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { calculateSAVERPay } from '../utils/helpers';

const PayrollDashboard = () => {
  const [payData, setPayData] = useState([]);

  useEffect(() => {
    const fetchPayroll = async () => {
      // On récupère les shifts terminés des 14 derniers jours
      const { data, error } = await supabase
        .from('shifts')
        .select(`*, drivers(firstname, lastname, matricule)`)
        .eq('status', 'Terminé');

      if (data) {
        // Logique pour grouper par chauffeur et calculer
        // (On pourra l'affiner ensemble si tu veux)
        setPayData(data);
      }
    };
    fetchPayroll();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">États de Paie & KPI</h1>
      <div className="overflow-x-auto p-4 bg-gray-50 rounded-xl">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="p-3">Chauffeur</th>
              <th className="p-3">Jours</th>
              <th className="p-3">Salaire Base</th>
              <th className="p-3">Bonus</th>
              <th className="p-3">Net à Payer</th>
            </tr>
          </thead>
          <tbody>
            {/* Ici on bouclera sur les données de Supabase */}
            <tr className="border-b text-center">
              <td className="p-3">Yao Koffi (YK-01)</td>
              <td className="p-3">12</td>
              <td className="p-3">64 284 F</td>
              <td className="p-3">15 000 F</td>
              <td className="p-3 font-bold">79 284 F</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollDashboard;
