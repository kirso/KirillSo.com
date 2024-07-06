import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl!, supabaseKey!);
