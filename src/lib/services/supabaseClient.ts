import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Initialize Supabase client using environment variables
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl!, supabaseKey!);
