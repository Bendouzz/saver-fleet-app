// RbacPage.jsx — Easy by Saver · Dark theme Tailwind
// Logique identique — visuel aligné sur Admin_mockup.html
import { useState, useEffect } from "react";
import { supabase, inviteUser, getUsers } from "../supabase.js";
import { Modal }   from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Select }  from "../components/ui/Select.jsx";
import { Input }   from "../components/ui/Input.jsx";

const ROLE_COLORS = {
  admin:      "bg-red-900/60 text-red-400 border border-red-800",
  ops:        "bg-blue-900/60 text-blue-400 border border-blue-800",
  finance:    "bg-green-900/60 text-green-400 border border-green-800",
  supervisor: "bg-violet-900/60 text-violet-400 border border-violet-800",
  dispatcher: "bg-amber-900/60 text-amber-400 border border-amber-800",
};

const ROLE_LABELS = {
  admin: "Administrateur", ops: "Ops Manager", finance: "Finance",
  supervisor: "Superviseur Logistique", dispatcher: "Dispatcher",
};

// Permissions par rôle (11 modules)
const MODULES = ["Dashboard", "Planning", "Chauffeurs", "Véhicules", "Maintenance", "Recharges EV", "Reversements", "KPI & Paie", "Reporting", "GPS", "Admin"];
const ROLE_PERMS = {
  admin:      [1,1,1,1,1,1,1,1,1,1,1],
  ops:        [1,1,1,1,1,1,1,0,1,1,0],
  finance:    [1,0,1,0,0,0,1,1,1,0,0],
  supervisor: [1,1,1,1,1,1,0,0,1,1,0],
  dispatcher: [1,1,1,0,0,0,0,0,0,1,0],
};

const TABS = [
  { id: "users",    label: "Utilisateurs" },
  { id: "roles",    label: "Rôles & permissions" },
  { id: "activity", label: "Journal d'activité" },
];

export const RbacPage = ({ currentUser }) => {
  const [activeTab,     setActiveTab]     = useState("users");
  const [users,         setUsers]         = useState([]);
  const [showAddUser,   setShowAddUser]   = useState(false);
  const [newUser,       setNewUser]       = useState({ name: "", email: "", role: "ops" });
  const [userError,     setUserError]     = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm,       setPwdForm]       = useState({ current: "", next: "", confirm: "" });
  const [pwdError,      setPwdError]      = useState("");
  const [pwdSuccess,    setPwdSuccess]    = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [inviteInfo,    setInviteInfo]    = useState(null);

  useEffect(() => { getUsers().then(setUsers); }, []);

  const handleAddUser = async () => {
    setUserError("");
    if (!newUser.name || !newUser.email) return setUserError("Nom et email requis");
    if (!newUser.email.includes("@")) return setUserError("Email invalide");
    if (users.find(u => u.email === newUser.email)) return setUserError("Email déjà utilisé");
    const result = await inviteUser(newUser.email, newUser.name, newUser.role);
    if (result.error) return setUserError("Erreur: " + result.error.message);
    const lien = window.location.origin + "?token=" + result.token;
    setInviteInfo({ name: newUser.name, email: newUser.email, lien, token: result.token });
    getUsers().then(setUsers);
    setShowAddUser(false);
    setNewUser({ name: "", email: "", role: "ops" });
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) return alert("Vous ne pouvez pas supprimer votre propre compte");
    await supabase.from("users").delete().eq("id", id);
    setUsers(u => u.filter(x => x.id !== id));
    setConfirmDelete(null);
  };

  const handleRoleChange = async (id, role) => {
    await supabase.from("users").update({ role }).eq("id", id);
    setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
  };

  const handleChangePwd = async () => {
    setPwdError(""); setPwdSuccess("");
    const me = users.find(u => u.id === currentUser?.id);
    if (!me || me.password !== pwdForm.current) return setPwdError("Mot de passe actuel incorrect");
    if (pwdForm.next.length < 6) return setPwdError("Minimum 6 caractères");
    if (pwdForm.next !== pwdForm.confirm) return setPwdError("Les mots de passe ne correspondent pas");
    await supabase.from("users").update({ password: pwdForm.next }).eq("id", currentUser.id);
    setPwdSuccess("Mot de passe modifié avec succès !");
    setPwdForm({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100" style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Administration</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">{users.length} utilisateur(s)</p>
        </div>
        {activeTab === "users" && currentUser?.role === "admin" && (
          <button onClick={() => { setShowAddUser(true); setUserError(""); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            + Créer un compte
          </button>
        )}
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-700 px-6 gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-all ${activeTab === t.id ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── ALERTE INVITATION ─────────────────────────────────────────── */}
        {inviteInfo && (
          <div className="bg-green-900/30 border border-green-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-green-400 text-sm mb-1">Compte créé pour {inviteInfo.name}</div>
                <div className="text-[11px] text-slate-400 mb-2">Envoyez ce lien à {inviteInfo.email} pour qu'il définisse son mot de passe :</div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-300 break-all">{inviteInfo.lien}</div>
                <div className="text-[10px] text-slate-500 mt-1.5">Token : {inviteInfo.token}</div>
              </div>
              <button onClick={() => setInviteInfo(null)} className="text-slate-500 hover:text-slate-300 shrink-0">✕</button>
            </div>
          </div>
        )}

        {/* ── TAB : UTILISATEURS ────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">Aucun utilisateur</div>
            )}
            {users.map(u => (
              <div key={u.id} className={`flex items-center gap-4 p-4 border-b border-slate-700 last:border-0 transition-colors ${u.invite_pending ? "bg-amber-900/10" : "hover:bg-slate-700/20"}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${u.invite_pending ? "bg-amber-700/60 text-amber-300" : "bg-gradient-to-br from-blue-700 to-violet-700 text-white"}`}>
                  {(u.name || "?")[0].toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{u.name}</span>
                    {u.id === currentUser?.id && <span className="text-[10px] text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded-full border border-blue-800">vous</span>}
                    {u.invite_pending && <span className="text-[10px] text-amber-400 bg-amber-900/40 px-1.5 py-0.5 rounded-full border border-amber-800">invitation en attente</span>}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[u.role] || "bg-slate-700 text-slate-400"}`}>{ROLE_LABELS[u.role] || u.role}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{u.email}</div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {u.id === currentUser?.id && (
                    <button onClick={() => { setShowChangePwd(true); setPwdForm({ current: "", next: "", confirm: "" }); setPwdError(""); setPwdSuccess(""); }}
                      className="text-[11px] text-blue-400 border border-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-900/40">
                      Mot de passe
                    </button>
                  )}
                  {currentUser?.role === "admin" && u.id !== currentUser?.id && (
                    <>
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 [&>option]:bg-slate-800">
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <button onClick={() => setConfirmDelete(u)}
                        className="text-[11px] text-red-400 border border-red-800 px-2.5 py-1.5 rounded-lg hover:bg-red-900/40">
                        Suppr.
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB : RÔLES & PERMISSIONS ─────────────────────────────────── */}
        {activeTab === "roles" && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <div className="font-semibold text-white text-sm">Matrice des permissions</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Lecture seule — modifiable par l'administrateur système</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/30">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">Module</th>
                    {Object.keys(ROLE_PERMS).map(r => (
                      <th key={r} className="px-3 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[r] || "bg-slate-700 text-slate-400"}`}>{ROLE_LABELS[r]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod, i) => (
                    <tr key={mod} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-4 py-2.5 font-medium text-slate-300">{mod}</td>
                      {Object.keys(ROLE_PERMS).map(r => (
                        <td key={r} className="px-3 py-2.5 text-center">
                          {ROLE_PERMS[r][i] ? (
                            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center mx-auto">
                              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5"><path d="M5 13l4 4L19 7"/></svg>
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded bg-slate-700 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB : JOURNAL D'ACTIVITÉ ─────────────────────────────────── */}
        {activeTab === "activity" && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <div className="font-semibold text-white text-sm">Journal d'activité</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dernières actions enregistrées</div>
            </div>
            <div className="divide-y divide-slate-700">
              {/* Activité simulée — à brancher sur une table activity_log */}
              {[
                { time: "Aujourd'hui 08:42", user: currentUser?.name || "Admin", action: "Connexion", type: "login" },
                { time: "Aujourd'hui 08:40", user: currentUser?.name || "Admin", action: "Page ouverte : Dashboard", type: "nav" },
                { time: "Hier 17:30", user: "Ops Manager", action: "Shift planifié : SH-001", type: "create" },
                { time: "Hier 16:15", user: "Finance", action: "Export Excel généré : Payroll", type: "export" },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-700/20">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.type === "login" ? "bg-green-400" : log.type === "create" ? "bg-blue-400" : log.type === "export" ? "bg-violet-400" : "bg-slate-500"}`} />
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">{log.action}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{log.user} · {log.time}</div>
                  </div>
                </div>
              ))}
              <div className="px-5 py-4 text-center text-[11px] text-slate-600">Journal complet disponible après connexion d'une table <code className="text-slate-500">activity_log</code></div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL CRÉER COMPTE ──────────────────────────────────────────────── */}
      {showAddUser && (
        <Modal title="Créer un nouveau compte" onClose={() => setShowAddUser(false)}
          footer={
            <>
              <button onClick={() => setShowAddUser(false)} className="flex-1 border border-slate-600 text-slate-300 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={handleAddUser} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold">Envoyer invitation</button>
            </>
          }>
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 text-[11px] text-blue-400 mb-3">
            Un lien d'invitation sera généré pour que l'utilisateur définisse son mot de passe.
          </div>
          {userError && <div className="bg-red-900/40 border border-red-800 text-red-400 text-sm px-3 py-2 rounded-lg mb-3">{userError}</div>}
          <div className="space-y-3">
            <Input label="Nom complet *" value={newUser.name}  onChange={v => setNewUser({ ...newUser, name: v })}  required />
            <Input label="Email *"       value={newUser.email} onChange={v => setNewUser({ ...newUser, email: v })} type="email" required />
            <Select label="Rôle" value={newUser.role} onChange={v => setNewUser({ ...newUser, role: v })} options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
          </div>
        </Modal>
      )}

      {/* ── MODAL CHANGER MOT DE PASSE ──────────────────────────────────────── */}
      {showChangePwd && (
        <Modal title="Modifier mon mot de passe" onClose={() => { setShowChangePwd(false); setPwdError(""); setPwdSuccess(""); }}
          footer={
            <>
              <button onClick={() => setShowChangePwd(false)} className="flex-1 border border-slate-600 text-slate-300 py-2 rounded-lg text-sm">Annuler</button>
              <button onClick={handleChangePwd} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold">Modifier</button>
            </>
          }>
          {pwdError   && <div className="bg-red-900/40 border border-red-800 text-red-400 text-sm px-3 py-2 rounded-lg mb-3">{pwdError}</div>}
          {pwdSuccess && <div className="bg-green-900/40 border border-green-800 text-green-400 text-sm px-3 py-2 rounded-lg mb-3">{pwdSuccess}</div>}
          <div className="space-y-3">
            <Input label="Mot de passe actuel"         value={pwdForm.current}  onChange={v => setPwdForm({ ...pwdForm, current: v })}  type="password" />
            <Input label="Nouveau mot de passe"        value={pwdForm.next}     onChange={v => setPwdForm({ ...pwdForm, next: v })}     type="password" />
            <Input label="Confirmer le nouveau mot de passe" value={pwdForm.confirm} onChange={v => setPwdForm({ ...pwdForm, confirm: v })} type="password" />
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Confirm msg={`Supprimer le compte de ${confirmDelete.name} ?`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};
