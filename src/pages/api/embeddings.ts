import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabaseClient";
import OpenAIApi from "openai";

// Initialize supabase client
const openaiApiKey = process.env.OPENAI_API_KEY;

// Initialize OpenAI client

const openai = new OpenAIApi({ apiKey: openaiApiKey });

export const post: APIRoute = async ({ request }) => {
	// parse the input from the request body
	const { input } = await request.json();
	// fetch all document embeddings from Supabase
	const { data: embeddingData } = await supabase.from("embeddings").select("embedding, text");
	// Generate embedding for the user's input using OpenAI
	const response = await openai.embeddings.create({
		model: "text-embedding-ada-002",
		input: input,
	});

	const userEmbedding = response!.data[0]!.embedding;

	// Find the document with the highest similarity
	let highestSimilarity = -1;
	let bestMatch = null;

	function cosineSimilarity(a: number[], b: number[]) {
		const dotProduct = a.reduce((sum, val, i) => sum + val * b[i]!, 0);
		const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
		const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
		return dotProduct / (magA * magB);
	}
	if (embeddingData) {
		for (const doc of embeddingData) {
			const similarity = cosineSimilarity(doc.embedding, userEmbedding);
			if (similarity > highestSimilarity) {
				highestSimilarity = similarity;
				bestMatch = doc.text;
			}
		}
	}

	// Generate a response using the best matching document
	const openaiResponse = await openai.completions.create({
		model: "text-davinci-003",
		prompt: `Based on the following document: "${bestMatch}", respond to the question: "${input}"`,
		max_tokens: 150,
	});

	// Return the response to the client as JSON
	return new Response(JSON.stringify({ answer: openaiResponse!.choices[0]!.text.trim() }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
};
