import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert("Connexion réussie !");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-2xl rounded-2xl w-96 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600 italic">SAVER App</h1>
          <p className="text-gray-500">Connectez-vous à votre espace</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Email professionnel</label>
          <input type="email" required className="w-full border p-2 rounded-lg mt-1" 
            onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Mot de passe</label>
          <input type="password" required className="w-full border p-2 rounded-lg mt-1" 
            onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
};

export default Login;