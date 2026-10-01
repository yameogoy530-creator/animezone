import { FALLBACK } from "./data.js";

export const $ = (q) => document.querySelector(q);
export const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const title=a=>a.title_english||a.title||"Titre inconnu", image=a=>a.images?.webp?.large_image_url||a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||FALLBACK;
export const genres=a=>[...(a.genres||[]),...(a.themes||[])].map(g=>g.name);
