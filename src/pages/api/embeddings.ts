import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAIApi(new Configuration({ apiKey: openaiApiKey }));

export const post: APIRoute = async ({ request }) => {
	const { input } = await request.json();

	const { data: embeddingData } = await supabase.from("embeddings").select("embedding, text");
};
