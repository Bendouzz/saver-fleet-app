import { useState } from "react";
import { SUPABASE_URL, SUPABASE_KEY } from "../../supabase.js";

export const uploadToSupabase = async (file, bucket, folder) => {
  const ext = file.name.split(".").pop().toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2,8)}.${ext}`;
  const path = folder ? `${folder}/${fileName}` : fileName;
  
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    }
  );
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errText}`);
  }
  
  // Construire l URL publique directement
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  console.log("Photo uploadee:", publicUrl);
  return publicUrl;
};

export const PhotoUpload = ({ label, bucket, folder, value, onChange, multiple = false, hint = "" }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localUrls, setLocalUrls] = useState(
    value ? (Array.isArray(value) ? value : [value]).filter(Boolean) : []
  );
  const urls = localUrls;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for(const file of files) {
        const url = await uploadToSupabase(file, bucket, folder);
        uploaded.push(url);
        console.log("Photo uploadee:", url);
      }
      let newUrls;
      if (multiple) {
        newUrls = [...localUrls, ...uploaded];
      } else {
        newUrls = [uploaded[0]];
      }
      setLocalUrls(newUrls);
      onChange(multiple ? newUrls : newUrls[0]);
    } catch (err) {
      console.error("Erreur upload:", err);
      setError("Erreur: " + err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeUrl = (idx) => {
    if (multiple) {
      onChange(urls.filter((_, i) => i !== idx));
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <div key={idx} className="relative group">
              <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => window.open(url, "_blank")}/>
              <button type="button" onClick={() => removeUrl(idx)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
            </div>
          ))}
        </div>
      )}
      <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? "border-blue-300 bg-blue-50" : "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}>
        <input type="file" accept="image/*" multiple={multiple} onChange={handleFiles} className="hidden" disabled={uploading}/>
        {uploading ? (
          <><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/><span className="text-sm text-blue-600">Upload en cours...</span></>
        ) : (
          <><svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span className="text-sm text-slate-500 dark:text-slate-400">{multiple ? "Cliquer pour ajouter des photos" : "Cliquer pour ajouter une photo"}</span>
          {urls.length > 0 && <span className="ml-auto text-xs text-emerald-600 font-medium">{urls.length} photo{urls.length > 1 ? "s" : ""}</span>}</>
        )}
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
