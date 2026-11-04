import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";

// Hook Supabase generique avec temps réel
export const useSupabase = (table, mapper = x=>x) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    const { data: rows } = await supabase.from(table).select("*").order("created_at", {ascending:false});
    setData((rows||[]).map(mapper));
    setLoading(false);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    load();
    // Écoute temps réel — se déclenche dès qu'une ligne est insérée, modifiée ou supprimée
    const channel = supabase
      .channel("realtime-" + table)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const add = async (item) => {
    const { error } = await supabase.from(table).insert(item);
    if (!error) load();
    return error;
  };

  const update = async (id, item) => {
    const { error } = await supabase.from(table).update(item).eq("id", id);
    if (!error) load();
    return error;
  };

  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) load();
    return error;
  };

  return { data, loading, lastUpdate, add, update, remove, reload: load };
};

