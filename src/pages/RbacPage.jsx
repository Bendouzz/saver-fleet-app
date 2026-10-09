import { useState, useEffect } from "react";
import { supabase, inviteUser } from "../supabase.js";
import { Badge } from "../components/ui/Badge.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Confirm } from "../components/ui/Confirm.jsx";
import { Select } from "../components/ui/Select.jsx";
import { Input } from "../components/ui/Input.jsx";

export const RbacPage = ({currentUser}) => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({name:"",email:"",role:"ops"});
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({current:"",next:"",confirm:""});
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);

  useEffect(() => { getUsers().then(setUsers); }, []);

  const handleAddUser = async () => {
    setUserError(""); setUserSuccess("");
    if(!newUser.name||!newUser.email) return setUserError("Nom et email requis");
    if(!newUser.email.includes("@")) return setUserError("Email invalide");
    if(users.find(u=>u.email===newUser.email)) return setUserError("Email deja utilise");
    const result = await inviteUser(newUser.email, newUser.name, newUser.role);
    if(result.error) return setUserError("Erreur: "+result.error.message);
    const lien = window.location.origin+"?token="+result.token;
    setInviteInfo({ name:newUser.name, email:newUser.email, lien, token:result.token });
    getUsers().then(setUsers);
    setShowAddUser(false);
    setNewUser({name:"",email:"",role:"ops"});
  };

  const handleDelete = async (id) => {
    if(id===currentUser?.id) return alert("Vous ne pouvez pas supprimer votre propre compte");
    await supabase.from("users").delete().eq("id",id);
    setUsers(u=>u.filter(x=>x.id!==id));
    setConfirmDelete(null);
  };

  const handleRoleChange = async (id, role) => {
    await supabase.from("users").update({role}).eq("id",id);
    setUsers(u=>u.map(x=>x.id===id?{...x,role}:x));
  };

  const handleChangePwd = async () => {
    setPwdError(""); setPwdSuccess("");
    const me = users.find(u=>u.id===currentUser?.id);
    if(!me||me.password!==pwdForm.current) return setPwdError("Mot de passe actuel incorrect");
    if(pwdForm.next.length<6) return setPwdError("Nouveau mot de passe minimum 6 caracteres");
    if(pwdForm.next!==pwdForm.confirm) return setPwdError("Les mots de passe ne correspondent pas");
    await supabase.from("users").update({password:pwdForm.next}).eq("id",currentUser.id);
    setPwdSuccess("Mot de passe modifie avec succes !");
    setPwdForm({current:"",next:"",confirm:""});
  };

  const roleColor = (r) => ({"admin":"bg-red-100 text-red-700","ops":"bg-emerald-100 text-emerald-700","finance":"bg-emerald-100 text-emerald-700","supervisor":"bg-violet-100 text-violet-700","dispatcher":"bg-amber-100 text-amber-700"}[r]||"bg-slate-100 text-slate-600 dark:text-slate-400");
  const roleLabel = (r) => ({"admin":"Administrateur","ops":"Ops Manager","finance":"Finance","supervisor":"Superviseur Logistique","dispatcher":"Dispatcher"}[r]||r);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des comptes</h1>

      {/* Alerte lien invitation */}
      {inviteInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-emerald-800 mb-1">Compte cree pour {inviteInfo.name}</div>
              <div className="text-sm text-emerald-700 mb-3">Envoyez ce lien a {inviteInfo.email} pour qu il definisse son mot de passe :</div>
              <div className="bg-white border border-emerald-200 rounded-lg px-4 py-2 font-mono text-sm text-slate-700 dark:text-slate-300 break-all">{inviteInfo.lien}</div>
              <div className="text-xs text-emerald-600 mt-2">Token : {inviteInfo.token}</div>
            </div>
            <button onClick={()=>setInviteInfo(null)} className="text-emerald-400 hover:text-emerald-600 ml-4 text-xl font-bold">x</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Utilisateurs ({users.length})</h2>
            <p className="text-xs text-slate-400 mt-0.5">Seul l administrateur peut creer et modifier les comptes</p>
          </div>
          {currentUser?.role==="admin"&&(
            <button onClick={()=>{setShowAddUser(true);setUserError("");setUserSuccess("");}} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
              + Creer un compte
            </button>
          )}
        </div>
        <div className="space-y-3">
          {users.map(u=>(
            <div key={u.id} className={"flex items-center justify-between p-4 rounded-xl border "+(u.invite_pending?"bg-amber-50 border-amber-200":"bg-slate-50 border-slate-100 dark:border-slate-700")}>
              <div className="flex items-center gap-3">
                <div className={"w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm "+(u.invite_pending?"bg-amber-400":"bg-gradient-to-br from-blue-500 to-violet-500")}>
                  {(u.name||"?")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm text-slate-800 dark:text-slate-100">
                    {u.name}
                    {u.id===currentUser?.id&&<span className="text-xs text-blue-500 ml-2">(vous)</span>}
                    {u.invite_pending&&<span className="text-xs text-amber-600 ml-2">— invitation en attente</span>}
                  </div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {u.id===currentUser?.id&&(
                  <button onClick={()=>{setShowChangePwd(true);setPwdForm({current:"",next:"",confirm:""});setPwdError("");setPwdSuccess("");}} className="text-blue-600 text-xs border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    Modifier mot de passe
                  </button>
                )}
                {currentUser?.role==="admin"&&u.id!==currentUser?.id?(
                  <select value={u.role} onChange={e=>handleRoleChange(u.id,e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="admin">Administrateur</option>
                    <option value="ops">Ops Manager</option>
                    <option value="finance">Finance</option>
                    <option value="supervisor">Superviseur</option>
                    <option value="dispatcher">Dispatcher</option>
                  </select>
                ):(
                  <Badge color={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                )}
                {currentUser?.role==="admin"&&u.id!==currentUser?.id&&(
                  <button onClick={()=>setConfirmDelete(u)} className="text-red-500 text-xs border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CREER COMPTE */}
      {showAddUser&&(
        <Modal title="Creer un nouveau compte" onClose={()=>setShowAddUser(false)}
          footer={<><button onClick={()=>setShowAddUser(false)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-lg text-sm">Annuler</button><button onClick={handleAddUser} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">Envoyer invitation</button></>}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 mb-2">
            Un lien sera genere pour que l utilisateur definisse son propre mot de passe.
          </div>
          {userError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{userError}</div>}
          <Input label="Nom complet" value={newUser.name} onChange={v=>setNewUser({...newUser,name:v})} required/>
          <Input label="Email" value={newUser.email} onChange={v=>setNewUser({...newUser,email:v})} type="email" required/>
          <Select label="Role" value={newUser.role} onChange={v=>setNewUser({...newUser,role:v})} options={[
            {value:"ops",label:"Ops Manager"},
            {value:"supervisor",label:"Superviseur Logistique"},
            {value:"finance",label:"Finance"},
            {value:"dispatcher",label:"Dispatcher"},
            {value:"admin",label:"Administrateur"},
          ]}/>
        </Modal>
      )}

      {/* MODAL CHANGER MOT DE PASSE */}
      {showChangePwd&&(
        <Modal title="Modifier mon mot de passe" onClose={()=>{setShowChangePwd(false);setPwdError("");setPwdSuccess("");}}>
          {pwdError&&<div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{pwdError}</div>}
          {pwdSuccess&&<div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-3 py-2 rounded-lg">{pwdSuccess}</div>}
          <Input label="Mot de passe actuel" value={pwdForm.current} onChange={v=>setPwdForm({...pwdForm,current:v})} type="password"/>
          <Input label="Nouveau mot de passe" value={pwdForm.next} onChange={v=>setPwdForm({...pwdForm,next:v})} type="password"/>
          <Input label="Confirmer le nouveau mot de passe" value={pwdForm.confirm} onChange={v=>setPwdForm({...pwdForm,confirm:v})} type="password"/>
          <button onClick={handleChangePwd} className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">Modifier le mot de passe</button>
        </Modal>
      )}

      {confirmDelete&&<Confirm msg={"Supprimer le compte de "+confirmDelete.name+" ?"} onConfirm={()=>handleDelete(confirmDelete.id)} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
};
