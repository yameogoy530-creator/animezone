import { supabase } from "./supabase.js";
import { s, updateCounts } from "./state.js";
import { render, toast } from "./render.js";

const migrationKey = "oc-favs";
let authRevision = 0;

function readLocalFavorites() {
  try {
    return JSON.parse(localStorage.getItem(migrationKey) || "[]").map(String);
  } catch {
    return [];
  }
}

function getEmailRedirectTo() {
  return new URL(window.location.pathname, window.location.origin).href;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getEmailRedirectTo() }
  });
  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: getEmailRedirectTo() }
  });
  if (error) throw error;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function syncFavorites(user, revision) {
  const localFavorites = readLocalFavorites();
  let migrationSucceeded = true;

  if (localFavorites.length) {
    const rows = localFavorites.map(animeId => ({
      user_id: user.id,
      mal_id: Number(animeId)
    }));
    try {
      const { error } = await supabase
        .from("favorites")
        .upsert(rows, { onConflict: "user_id,mal_id" });
      if (error) throw error;
      localStorage.removeItem(migrationKey);
    } catch {
      migrationSucceeded = false;
      toast("La synchronisation des favoris locaux a échoué.");
    }
  }

  let result;
  try {
    result = await supabase
      .from("favorites")
      .select("mal_id")
      .eq("user_id", user.id);
  } catch {
    toast("Impossible de charger les favoris du compte.");
    updateCounts();
    render();
    return;
  }

  if (revision !== authRevision) return;
  const { data, error } = result;
  if (error) {
    toast("Impossible de charger les favoris du compte.");
    updateCounts();
    render();
    return;
  }

  s.favs = new Set(data.map(row => String(row.mal_id)));
  if (!migrationSucceeded) {
    localFavorites.forEach(id => s.favs.add(id));
  }
  updateCounts();
  render();
}

export function onAuthStateChange(onChange = () => {}) {
  return supabase.auth.onAuthStateChange((event, session) => {
    const revision = ++authRevision;
    const user = session?.user || null;

    queueMicrotask(async () => {
      s.user = user;
      if (!user) {
        s.favs = new Set(readLocalFavorites());
        updateCounts();
        render();
        onChange(event, null);
        return;
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        await syncFavorites(user, revision);
      }
      if (revision === authRevision) onChange(event, user);
    });
  });
}
