import { useState } from "react";
import { supabase, getUsers } from "../supabase.js";

const ROLE_ACCOUNTS = [
  {role:"admin", label:"Administrateur", email:"admin@saver.ci", icon:"shield", color:"from-red-500 to-red-600"},
  {role:"ops", label:"Ops Manager", email:"ops@saver.ci", icon:"truck", color:"from-blue-500 to-blue-600"},
  {role:"finance", label:"Finance", email:"finance@saver.ci", icon:"cash", color:"from-emerald-500 to-emerald-600"},
  {role:"supervisor", label:"Superviseur Logistique", email:"superviseur@saver.ci", icon:"eye", color:"from-violet-500 to-violet-600"},
  {role:"dispatcher", label:"Dispatcher", email:"dispatcher@saver.ci", icon:"map", color:"from-amber-500 to-amber-600"},
];


const RoleIcon = ({icon}) => {
  const icons = {
    shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    truck: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    cash: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  };
  return <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]}/></svg>;
};

const LoginPage = ({onLogin}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  const handleReset = async () => {
    if(!resetEmail) return setResetMsg({ok:false, text:"Email requis"});
    setResetLoading(true);
    const users = await getUsers();
    const found = users.find(u => u.email === resetEmail);
    if(!found) {
      setResetLoading(false);
      return setResetMsg({ok:false, text:"Aucun compte avec cet email"});
    }
    // Generer un token de reinitialisation
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from("users").update({invite_token: token, invite_pending: false}).eq("email", resetEmail);
    const lien = window.location.origin + "?token=" + token;
    setResetLoading(false);
    setResetMsg({ok:true, text:"Lien genere ! Copiez-le : " + lien});
  };

  const handleLogin = async () => {
    if (!email) return setError("Email requis");
    if (!password) return setError("Mot de passe requis");
    setError(""); setLoading(true);
    const users = await getUsers();
    const found = users.find(u => u.email===email && u.password===password);
    setLoading(false);
    if (!found) return setError("Email ou mot de passe incorrect");
    if (found.invite_pending) return setError("Vous devez d abord definir votre mot de passe via le lien d invitation");
    onLogin(found);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Easy by Saver</h1>
          <p className="text-blue-300 mt-2">Gestion de flotte VTC electrique</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <h2 className="text-white font-semibold text-center mb-6">Connexion</h2>

          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}

          <div className="space-y-4">
            {/* Login / Email */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Login</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="votre@email.com" autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Role</label>
              <select value={role} onChange={e=>{
                setRole(e.target.value);
                const found = ROLE_ACCOUNTS.find(r=>r.role===e.target.value);
                if(found && !email) setEmail(found.email);
              }} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 [&>option]:bg-slate-800">
                <option value="">-- Choisir votre role --</option>
                {ROLE_ACCOUNTS.map(r=><option key={r.role} value={r.role}>{r.label}</option>)}
                <option value="custom">Autre compte</option>
              </select>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>

            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            {showResetForm ? (
              <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
                <p className="text-blue-200 text-sm text-center">Entrez votre email pour reinitialiser votre mot de passe</p>
                <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                {resetMsg && <div className={`text-sm px-3 py-2 rounded-lg ${resetMsg.ok ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>{resetMsg.text}</div>}
                <button onClick={handleReset} disabled={resetLoading}
                  className="w-full bg-white/20 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-white/30 transition-all disabled:opacity-50">
                  {resetLoading ? "Envoi..." : "Envoyer le lien"}
                </button>
                <button onClick={()=>{setShowResetForm(false);setResetMsg(null);setResetEmail("");}}
                  className="w-full text-blue-300 text-sm hover:text-white transition-colors">
                  ← Retour à la connexion
                </button>
              </div>
            ) : (
              <button onClick={()=>setShowResetForm(true)} className="w-full text-blue-300 text-xs hover:text-white transition-colors text-center mt-2">
                Mot de passe oublié ?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

};


export { LoginPage };
