import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { generateDriverCode } from '../utils/helpers';

const DriverKYCForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    middle_name: '',
    license_number: '',
    license_expiry_date: '',
    id_card_number: '',
    contract_type: 'salarié',
    emergency_contact: '',
    home_gps_point: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Générer le matricule automatiquement
    const matricule = generateDriverCode(formData.firstname, formData.lastname);

    // 2. Envoyer les données à Supabase
    const { error } = await supabase
      .from('drivers')
      .insert([{ 
        ...formData, 
        driver_code: matricule 
      }]);

    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      alert(`Chauffeur enregistré avec succès ! Matricule généré : ${matricule}`);
      // Optionnel : réinitialiser le formulaire ici
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Nouveau Chauffeur (KYC Complet)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Identité */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom *</label>
            <input type="text" required className="w-full border p-2 rounded-md" 
              onChange={(e) => setFormData({...formData, lastname: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom *</label>
            <input type="text" required className="w-full border p-2 rounded-md" 
              onChange={(e) => setFormData({...formData, firstname: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deuxième nom</label>
            <input type="text" className="w-full border p-2 rounded-md" 
              onChange={(e) => setFormData({...formData, middle_name: e.target.value})} />
          </div>
        </div>

        {/* Section Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">N° Permis de conduire *</label>
            <input type="text" required className="w-full border p-2 rounded-md" 
              onChange={(e) => setFormData({...formData, license_number: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date d'expiration permis *</label>
            <input type="date" required className="w-full border p-2 rounded-md" 
              onChange={(e) => setFormData({...formData, license_expiry_date: e.target.value})} />
          </div>
        </div>

        {/* Section Contact d'Urgence et Localisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact d'urgence (Nom & Tel)</label>
            <input type="text" placeholder="Ex: Marie - 0707..." className="w-full border p-2 rounded-md" 
              onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Point GPS Domicile</label>
            <input type="text" placeholder="Lien Google Maps ou Coordonnées" className="w-full border p-2 rounded-md" 
              onChange={(e) => setFormData({...formData, home_gps_point: e.target.value})} />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 rounded-md text-white font-bold transition ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Enregistrement en cours...' : 'Enregistrer le Chauffeur'}
        </button>
      </form>
    </div>
  );
};

export default DriverKYCForm;