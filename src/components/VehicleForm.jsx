import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const VehicleForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: '',
    brand: '',
    model: '',
    vin_number: '',
    battery_capacity_kwh: '',
    service_type: 'VTC',
    technical_visit_expiry: '',
    service_class: []
  });

  const classesOptions = ['Eco', 'Confort', 'Business', 'VIP', 'Livraison'];

  const handleClassChange = (className) => {
    const currentClasses = [...formData.service_class];
    if (currentClasses.includes(className)) {
      setFormData({...formData, service_class: currentClasses.filter(c => c !== className)});
    } else {
      setFormData({...formData, service_class: [...currentClasses, className]});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('vehicles').insert([formData]);
    if (error) alert("Erreur : " + error.message);
    else alert("Véhicule enregistré avec succès !");
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Nouveau Véhicule</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Plaque d'immatriculation" className="border p-2 rounded" 
            onChange={(e) => setFormData({...formData, plate_number: e.target.value})} required />
          <input type="text" placeholder="NIV (Châssis)" className="border p-2 rounded" 
            onChange={(e) => setFormData({...formData, vin_number: e.target.value})} />
          <input type="number" placeholder="Capacité Batterie (kWh)" className="border p-2 rounded" 
            onChange={(e) => setFormData({...formData, battery_capacity_kwh: e.target.value})} />
          <input type="date" title="Expiration Visite Technique" className="border p-2 rounded" 
            onChange={(e) => setFormData({...formData, technical_visit_expiry: e.target.value})} />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">Classes de service :</label>
          <div className="flex flex-wrap gap-2">
            {classesOptions.map(cls => (
              <button key={cls} type="button" 
                onClick={() => handleClassChange(cls)}
                className={`px-3 py-1 rounded-full border ${formData.service_class.includes(cls) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {cls}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-md font-bold">
          {loading ? 'Enregistrement...' : 'Enregistrer le Véhicule'}
        </button>
      </form>
    </div>
  );
};

export default VehicleForm;