import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://zxcbdisojecinxcjyafs.supabase.co";
const supabaseAnonKey = "sb_publishable_tWTf-MWX0Mgb-TJTXycWbQ_szRsGE-v";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
