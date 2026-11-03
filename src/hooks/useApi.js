// useApi.js — Easy by Saver · Hook React → Express API localhost:3001
// Remplace useSupabase. Interface identique : { data, loading, add, update, remove, reload }

import { useState, useEffect, useCallback } from "react";

// En production : REACT_APP_API_URL pointe vers l'URL Railway/Render
// En local : fallback vers localhost:3001
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Récupérer le token JWT stocké à la connexion
export const getToken = () => {
  try { return localStorage.getItem("saver_token") || ""; }
  catch { return ""; }
};

// Appel API générique — toujours avec Authorization Bearer
export const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status} — ${txt}`);
  }
  return res.json();
};

// ── HOOK PRINCIPAL ────────────────────────────────────────────────────────────
// endpoint : nom de la route Express (ex: "vehicules", "chauffeurs", "planning")
// mapper   : fonction de transformation optionnelle (même que dans mappers.js)
export const useApi = (endpoint, mapper = x => x) => {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    try {
      const rows = await apiFetch("/" + endpoint);
      setData((rows || []).map(mapper));
      setLastUpdate(new Date());
    } catch (e) {
      console.error("[useApi] Chargement " + endpoint + " :", e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
    // Pas de temps-réel Supabase ici — rafraîchissement manuel après chaque mutation
  }, []);

  const add = async (item) => {
    try {
      await apiFetch("/" + endpoint, { method: "POST", body: item });
      await load();
      return null;
    } catch (e) {
      console.error("[useApi] add " + endpoint + " :", e.message);
      return e;
    }
  };

  const update = async (id, item) => {
    try {
      await apiFetch("/" + endpoint + "/" + id, { method: "PUT", body: item });
      await load();
      return null;
    } catch (e) {
      console.error("[useApi] update " + endpoint + "/" + id + " :", e.message);
      return e;
    }
  };

  const remove = async (id) => {
    try {
      await apiFetch("/" + endpoint + "/" + id, { method: "DELETE" });
      await load();
      return null;
    } catch (e) {
      console.error("[useApi] remove " + endpoint + "/" + id + " :", e.message);
      return e;
    }
  };

  return { data, loading, lastUpdate, add, update, remove, reload: load };
};
