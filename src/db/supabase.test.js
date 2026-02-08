import { supabase } from "../config/supabase.js";

export const testSupabaseConnection = async () => {
  try {
    // This table ALWAYS exists in Postgres
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
    } else {
      console.log("✅ Supabase connection established successfully");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }
};

