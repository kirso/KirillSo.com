import { supabase } from "./supabaseClient";

export async function getEmbeddings() {
	const { data, error } = await supabase.from("embeddings").select("embedding, text");
	if (error) throw new Error(`Supabase error: ${error.message}`);
	return data;
}
