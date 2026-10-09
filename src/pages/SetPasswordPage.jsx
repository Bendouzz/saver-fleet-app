import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

export const SetPasswordPage = ({token, onDone}) => {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    supabase.from("users").select("*").eq("invite_token", token).single()
      .then(({data}) => { if(data) setUserInfo(data); else setError("Lien invalide ou expire."); });
  }, [token]);

  const handleSetPassword = async () => {
    if(pwd.length < 6) return setError("Mot de passe minimum 6 caracteres");
    if(pwd !== confirm) return setError("Les mots de passe ne correspondent pas");
    setLoading(true);
    const { error: err } = await supabase.from("users")
      .update({ password: pwd, invite_token: null, invite_pending: false })
      .eq("invite_token", token);
    setLoading(false);
    if(err) return setError("Erreur: "+err.message);
    onDone();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Easy by Saver</h1>
          <p className="text-blue-300 mt-2">Definir votre mot de passe</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
          {userInfo && (
            <div className="bg-white/10 rounded-xl p-4 mb-5">
              <div className="text-white font-semibold">{userInfo.name}</div>
              <div className="text-blue-300 text-sm">{userInfo.email}</div>
              <div className="text-blue-300 text-sm capitalize mt-1">Role : {userInfo.role}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Nouveau mot de passe</label>
              <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Minimum 6 caracteres" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1.5">Confirmer le mot de passe</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSetPassword()} placeholder="Retapez votre mot de passe" className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </div>
            <button onClick={handleSetPassword} disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50">
              {loading ? "Enregistrement..." : "Definir mon mot de passe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD PAGE
