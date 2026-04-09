import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const LiveDashboard = () => {
  const [activeShifts, setActiveShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveShifts = async () => {
      // On récupère les shifts avec les infos du chauffeur et du véhicule
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id,
          status,
          shift_type,
          planned_start_date,
          drivers (firstname, lastname, driver_code),
          vehicles (plate_number, brand)
        `)
        .order('planned_start_date', { ascending: false });

      if (data) setActiveShifts(data);
      setLoading(false);
    };

    fetchActiveShifts();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement du tableau de bord...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Suivi des Rotations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeShifts.map((shift) => (
          <div key={shift.id} className={`p-5 rounded-2xl shadow-sm border-l-8 ${
            shift.status === 'Terminé' ? 'border-green-500 bg-green-50' : 
            shift.status === 'Programmé' ? 'border-blue-500 bg-blue-50' : 'border-yellow-500 bg-yellow-50'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">{shift.shift_type}</p>
                <h3 className="text-lg font-bold text-gray-800">
                  {shift.drivers?.firstname} {shift.drivers?.lastname}
                </h3>
                <p className="text-sm text-gray-600">Matricule : {shift.drivers?.driver_code}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                shift.status === 'Terminé' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'
              }`}>
                {shift.status}
              </span>
            </div>

            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium">🚗 Véhicule : {shift.vehicles?.plate_number}</p>
              <p className="text-xs text-gray-500">{shift.vehicles?.brand}</p>
            </div>

            {shift.status !== 'Terminé' && (
              <button className="w-full mt-4 bg-white border border-gray-300 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">
                Clôturer le Shift (DD Data)
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveDashboard;