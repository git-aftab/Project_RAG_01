import { createClient } from "@supabase/supabase-js";
import "dotenv/config"

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_API_KEY,
)

export{supabase}