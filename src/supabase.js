import { createClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE CLIENT
// ============================================================
export const SUPABASE_URL = "https://tgmzrhldehltqsloylqs.supabase.co";
export const SUPABASE_KEY = "sb_publishable_LURLrl4BHKhrC-sWyf2SPw_p45JMMgS";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// AUTH via table users
export const getUsers = async () => {
  const { data } = await supabase.from("users").select("*");
  return data || [];
};
export const saveUser = async (user) => {
  await supabase.from("users").upsert(user);
};

// Supabase Auth - inviter un utilisateur par email
export const inviteUser = async (email, name, role) => {
  const token = Math.random().toString(36).substring(2, 10).toUpperCase();
  const id = "U-"+Date.now();
  const { error } = await supabase.from("users").insert({
    id, name, email, role, password:"", invite_token:token, invite_pending:true
  });
  if (error) return { error };
  return { token, id };
};
