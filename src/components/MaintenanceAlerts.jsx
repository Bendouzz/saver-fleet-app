import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const MaintenanceAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const checkExpirations = async () => {
      const fifteenDaysFromNow = new Date();
      fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);
      
      const isoDate = fifteenDaysFromNow.toISOString().split('T')[0];

      // On cherche les véhicules dont la visite technique expire bientôt
      const { data, error } = await supabase
        .from('vehicles')
        .select('plate_number, brand, technical_visit_expiry')
        .lte('technical_visit_expiry', isoDate);

      if (data) setAlerts(data);
    };

    checkExpirations();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((v, index) => (
        <div key={index} className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
          <div>
            <h4 className="text-red-800 font-bold">⚠️ Alerte Visite Technique</h4>
            <p className="text-sm text-red-700">
              Le véhicule <strong>{v.plate_number}</strong> ({v.brand}) expire le {new Date(v.technical_visit_expiry).toLocaleDateString()}.
            </p>
          </div>
          <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
            Prendre RDV
          </button>
        </div>
      ))}
    </div>
  );
};

export default MaintenanceAlerts;