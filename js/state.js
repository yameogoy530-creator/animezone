import { allCatalog } from "./data.js";
import { $, genres } from "./utils.js";
import { supabase } from "./supabase.js";
export const animeCache=new Map(allCatalog.map(item=>[String(item.mal_id),item]));
export const s={tab:"new",query:"",genre:"all",items:[],page:1,next:false,favs:new Set(JSON.parse(localStorage.getItem("oc-favs")||"[]").map(String)),controller:null,timer:null,user:null,preferences:null};
export function updateCounts(){$("#nav-count").textContent=s.favs.size;$("#fav-count").textContent=s.favs.size}
export function filtered(){let items=s.tab==="favorites"?[...animeCache.values()].filter(a=>s.favs.has(String(a.mal_id))):s.items;if(s.genre!=="all")items=items.filter(a=>genres(a).includes(s.genre));if(s.query.trim()){const q=s.query.trim().toLocaleLowerCase("fr");items=items.filter(a=>[a.title,a.title_english,a.title_japanese,...(a.title_synonyms||[])].filter(Boolean).some(t=>t.toLocaleLowerCase("fr").includes(q)))}return items}
const dialog = $("#dialog");
let effects = {};

export function setStateEffects(nextEffects) {
  effects = nextEffects;
}

export async function toggleFav(id) {
  const key = String(id);
  const wasFavorite = s.favs.has(key);
  if (wasFavorite) {
    s.favs.delete(key);
    effects.toast("Retiré de ta liste.");
  } else {
    s.favs.add(key);
    effects.toast("Ajouté à ta liste !");
  }
  if (!s.user) {
    localStorage.setItem("oc-favs", JSON.stringify([...s.favs]));
  }
  updateCounts();
  if (dialog.open) effects.openDetail(key);
  effects.render();

  if (s.user) {
    let error;
    try {
      const result = wasFavorite
        ? await supabase.from("favorites").delete().eq("user_id", s.user.id).eq("mal_id", Number(key))
        : await supabase.from("favorites").upsert(
          { user_id: s.user.id, mal_id: Number(key) },
          { onConflict: "user_id,mal_id" }
        );
      error = result.error;
    } catch (requestError) {
      error = requestError;
    }

    if (error) {
      if (wasFavorite) s.favs.add(key);
      else s.favs.delete(key);
      updateCounts();
      if (dialog.open) effects.openDetail(key);
      effects.render();
      effects.toast("Impossible de synchroniser ce favori.");
    }
  }
  effects.refreshRecommendations?.();
}