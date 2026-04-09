import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ShiftPlanning = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState({
    driver_id: '',
    vehicle_id: '',
    shift_type: 'Shift A',
    planned_start_date: new Date().toISOString().split('T')[0]
  });

  // Charger les listes au démarrage
  useEffect(() => {
    const fetchData = async () => {
      const { data: d } = await supabase.from('drivers').select('id, firstname, lastname, driver_code');
      const { data: v } = await supabase.from('vehicles').select('id, plate_number, brand');
      if (d) setDrivers(d);
      if (v) setVehicles(v);
    };
    fetchData();
  }, []);

  const handlePlanShift = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('shifts').insert([
      { 
        ...assignment,
        status: 'Programmé' // Le shift commence en mode programmé
      }
    ]);

    if (error) alert("Erreur planning : " + error.message);
    else alert("Shift planifié avec succès ! Le chauffeur peut maintenant débuter sa journée.");
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 border-t-4 border-blue-600">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 Planifier une Rotation</h2>
      
      <form onSubmit={handlePlanShift} className="space-y-4">
        {/* Sélection Chauffeur */}
        <div>
          <label className="block text-sm font-semibold mb-1">Chauffeur</label>
          <select 
            required
            className="w-full border p-3 rounded-lg bg-gray-50"
            onChange={(e) => setAssignment({...assignment, driver_id: e.target.value})}
          >
            <option value="">-- Choisir un chauffeur --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.firstname} {d.lastname} ({d.driver_code})</option>
            ))}
          </select>
        </div>

        {/* Sélection Véhicule */}
        <div>
          <label className="block text-sm font-semibold mb-1">Véhicule</label>
          <select 
            required
            className="w-full border p-3 rounded-lg bg-gray-50"
            onChange={(e) => setAssignment({...assignment, vehicle_id: e.target.value})}
          >
            <option value="">-- Choisir un véhicule --</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plate_number} - {v.brand}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Type de Shift */}
          <div>
            <label className="block text-sm font-semibold mb-1">Rotation</label>
            <select 
              className="w-full border p-3 rounded-lg bg-gray-50"
              onChange={(e) => setAssignment({...assignment, shift_type: e.target.value})}
            >
              <option value="Shift A">Shift A (Matin)</option>
              <option value="Shift B">Shift B (Soir)</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-1">Date prévue</label>
            <input 
              type="date" 
              className="w-full border p-3 rounded-lg bg-gray-50"
              value={assignment.planned_start_date}
              onChange={(e) => setAssignment({...assignment, planned_start_date: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg"
        >
          {loading ? 'Enregistrement...' : 'Valider le Planning'}
        </button>
      </form>
    </div>
  );
};

export default ShiftPlanning;