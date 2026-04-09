import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Ton client Supabase

const ShiftCompletionForm = ({ shiftId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    km_driven: '',
    battery_end: '',
    courses_count: '',
    revenue_cash: '',
    yango_commission: '',
    authorized_expenses: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('shifts')
      .update({
        ...formData,
        real_end_time: new Date().toISOString(),
        status: 'Terminé'
      })
      .eq('id', shiftId);

    if (error) alert("Erreur lors de la mise à jour : " + error.message);
    else alert("Shift clôturé avec succès !");
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold border-b pb-2">Clôture de Shift (DD Driving Datas)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kilométrage */}
        <div>
          <label className="block text-sm font-medium">KM parcourus</label>
          <input 
            type="number" 
            className="w-full border p-2 rounded" 
            onChange={(e) => setFormData({...formData, km_driven: e.target.value})}
            required 
          />
        </div>

        {/* Revenus Espèces */}
        <div>
          <label className="block text-sm font-medium">Revenus générés (Espèces)</label>
          <input 
            type="number" 
            className="w-full border p-2 rounded" 
            onChange={(e) => setFormData({...formData, revenue_cash: e.target.value})}
            required 
          />
        </div>
      </div>

      {/* Ajoute ici les autres champs : courses, commission, etc. */}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
      >
        {loading ? 'Enregistrement...' : 'Valider la fin de shift'}
      </button>
    </form>
  );
};

export default ShiftCompletionForm;