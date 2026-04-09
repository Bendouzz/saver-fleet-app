import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const PayoutForm = ({ driverId, netAmountDue }) => {
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [expenses, setExpenses] = useState(0);

  // Calcul du montant final après frais Wave (1%) 
  const waveFees = (netAmountDue - expenses) * 0.01;
  const finalAmount = netAmountDue - expenses - waveFees;

  const handleUploadPayout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload de la capture d'écran dans le bucket "shift-photos"
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `payout_${Date.now()}.${fileExt}`;
      const { data: uploadData } = await supabase.storage
        .from('shift-photos')
        .upload(`payouts/${fileName}`, proofFile);

      const { data: urlData } = supabase.storage
        .from('shift-photos')
        .getPublicUrl(`payouts/${fileName}`);

      // 2. Enregistrement en base de données [cite: 123]
      const { error } = await supabase.from('payouts').insert([{
        driver_id: driverId,
        amount_requested: netAmountDue,
        amount_sent: finalAmount,
        authorized_expenses: expenses,
        transaction_proof_url: urlData.publicUrl
      }]);

      if (error) throw error;
      alert("Reversement enregistré avec succès !");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUploadPayout} className="p-6 bg-white rounded-xl shadow-lg border space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Valider un Reversement</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm">Montant dû : <strong>{netAmountDue} FCFA</strong></p>
        <p className="text-sm text-red-600">Frais Wave (1%) : -{waveFees.toFixed(0)} FCFA </p>
        <p className="text-lg font-bold text-green-700 mt-2">À envoyer : {finalAmount.toFixed(0)} FCFA</p>
      </div>

      <div>
        <label className="block text-sm font-medium">Dépenses autorisées (si applicable) [cite: 129]</label>
        <input 
          type="number" 
          className="w-full border p-2 rounded"
          onChange={(e) => setExpenses(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Capture d'écran (Wave/Orange) </label>
        <input 
          type="file" 
          required
          onChange={(e) => setProofFile(e.target.files[0])}
          className="w-full text-sm"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading || !proofFile}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        {loading ? "Enregistrement..." : "Confirmer le Paiement"}
      </button>
    </form>
  );
};

export default PayoutForm;