// LoginPage.jsx — Easy by Saver · Dark theme Tailwind
// Logique identique — visuel aligné sur Login_mockup.html
import { useState } from "react";
import { apiFetch } from "../hooks/useApi.js";

const ROLE_ACCOUNTS = [
  { role: "admin",      label: "Administrateur",         email: "admin@saver.ci" },
  { role: "ops",        label: "Ops Manager",            email: "ops@saver.ci" },
  { role: "finance",    label: "Finance",                email: "finance@saver.ci" },
  { role: "supervisor", label: "Superviseur Logistique", email: "superviseur@saver.ci" },
  { role: "dispatcher", label: "Dispatcher",             email: "dispatcher@saver.ci" },
];

const ROLE_COLORS = {
  admin:      "bg-red-900/60 text-red-400 border border-red-800",
  ops:        "bg-blue-900/60 text-blue-400 border border-blue-800",
  finance:    "bg-green-900/60 text-green-400 border border-green-800",
  supervisor: "bg-violet-900/60 text-violet-400 border border-violet-800",
  dispatcher: "bg-amber-900/60 text-amber-400 border border-amber-800",
};

// Indicateur de force de mot de passe
const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
};
const STRENGTH_LABEL = ["", "Très faible", "Faible", "Moyen", "Fort", "Très fort"];
const STRENGTH_COLOR = ["", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500", "bg-green-600"];

const EyeIcon = ({ show }) => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {show
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
    }
  </svg>
);

// ─── ÉCRAN CONNEXION ─────────────────────────────────────────────────────────
const ScreenLogin = ({ onLogin, onForgot }) => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const handleLogin = async () => {
    if (!email)    return setError("Email requis");
    if (!password) return setError("Mot de passe requis");
    setError(""); setLoading(true);
    try {
      const { token, user } = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
      localStorage.setItem("saver_token", token);
      setLoading(false);
      onLogin(user);
    } catch (e) {
      setLoading(false);
      setError("Email ou mot de passe incorrect");
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Rôle</label>
        <select value={role} onChange={e => {
          setRole(e.target.value);
          const found = ROLE_ACCOUNTS.find(r => r.role === e.target.value);
          if (found && !email) setEmail(found.email);
        }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-800">
          <option value="">-- Choisir votre rôle --</option>
          {ROLE_ACCOUNTS.map(r => <option key={r.role} value={r.role}>{r.label}</option>)}
          <option value="custom">Autre compte</option>
        </select>
        {role && role !== "custom" && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {ROLE_ACCOUNTS.filter(r => r.role === role).map(r => (
              <span key={r.role} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[r.role]}`}>{r.label}</span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus placeholder="votre@email.com"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500" />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Mot de passe</label>
        <div className="relative">
          <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500" />
          <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <EyeIcon show={showPwd} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-800 text-red-400 text-sm px-4 py-2.5 rounded-xl">{error}</div>
      )}

      <button onClick={handleLogin} disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-50">
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      <button onClick={onForgot} className="w-full text-slate-500 hover:text-slate-300 text-xs transition-colors text-center">
        Mot de passe oublié ?
      </button>
    </div>
  );
};

// ─── ÉCRAN MOT DE PASSE OUBLIÉ ───────────────────────────────────────────────
const ScreenForgot = ({ onBack }) => {
  const [resetEmail,   setResetEmail]   = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg,     setResetMsg]     = useState(null);

  const handleReset = async () => {
    if (!resetEmail) return setResetMsg({ ok: false, text: "Email requis" });
    setResetLoading(true);
    try {
      // Vérifier que l'email existe via l'API
      const users = await apiFetch("/utilisateurs");
      const found = users.find(u => u.email === resetEmail);
      if (!found) { setResetLoading(false); return setResetMsg({ ok: false, text: "Aucun compte avec cet email" }); }
      const token = Math.random().toString(36).substring(2, 10).toUpperCase();
      const lien = window.location.origin + "?token=" + token;
      setResetLoading(false);
      setResetMsg({ ok: true, text: "Lien généré : " + lien });
    } catch {
      setResetLoading(false);
      setResetMsg({ ok: false, text: "Erreur serveur" });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm text-center">Entrez votre email pour réinitialiser votre mot de passe.</p>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
        <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="votre@email.com"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500" />
      </div>
      {resetMsg && (
        <div className={`text-sm px-4 py-2.5 rounded-xl break-all ${resetMsg.ok ? "bg-green-900/40 border border-green-800 text-green-400" : "bg-red-900/40 border border-red-800 text-red-400"}`}>{resetMsg.text}</div>
      )}
      <button onClick={handleReset} disabled={resetLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
        {resetLoading ? "Envoi..." : "Envoyer le lien"}
      </button>
      <button onClick={onBack} className="w-full text-slate-500 hover:text-slate-300 text-xs transition-colors text-center">
        ← Retour à la connexion
      </button>
    </div>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [screen, setScreen] = useState("login"); // login | forgot

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(30,58,138,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(15,118,110,0.10) 0%, transparent 60%)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Easy by Saver</h1>
          <p className="text-slate-500 text-sm mt-1">Gestion de flotte VTC électrique</p>
        </div>

        {/* Carte */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-7 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-white text-base">
              {screen === "login" ? "Connexion" : "Mot de passe oublié"}
            </h2>
            {screen !== "login" && (
              <button onClick={() => setScreen("login")} className="text-slate-500 hover:text-slate-300 text-xs">← Retour</button>
            )}
          </div>

          {screen === "login"  && <ScreenLogin  onLogin={onLogin} onForgot={() => setScreen("forgot")} />}
          {screen === "forgot" && <ScreenForgot onBack={() => setScreen("login")} />}
        </div>

        {/* Comptes démo */}
        {screen === "login" && (
          <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Comptes démo</div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_ACCOUNTS.map(r => (
                <button key={r.role} className={`text-[10px] font-bold px-2 py-1 rounded-full ${ROLE_COLORS[r.role]}`} disabled>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { LoginPage };
