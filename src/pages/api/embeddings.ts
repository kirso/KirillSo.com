import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabaseClient";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const prerender = false;

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
	console.error("OPENAI_API_KEY is not defined");
	throw new Error("OPENAI_API_KEY is not defined in the environment variables");
}
const openai = new OpenAI({ apiKey: openaiApiKey });

export const POST: APIRoute = async ({ request }) => {
	console.log("Function invoked");
	try {
		const rawBody = await request.text();
		console.log("Raw body:", rawBody);

		const parsedBody = JSON.parse(rawBody);
		console.log("Parsed body:", parsedBody);

		const { input } = parsedBody;
		console.log("Input:", input);

		// Supabase query for embeddings
		const { data: embeddingData, error: supabaseError } = await supabase
			.from("embeddings")
			.select("embedding, text");

		if (supabaseError) {
			console.error("Supabase error:", supabaseError);
			throw new Error(`Supabase error: ${supabaseError.message}`);
		}

		console.log("Embedding data retrieved");

		// OpenAI embedding creation
		const embeddingResponse = await openai.embeddings.create({
			input: input,
			model: "text-embedding-ada-002",
		});

		console.log("OpenAI embedding created");

		const userEmbedding = embeddingResponse.data[0]?.embedding;
		if (!userEmbedding) {
			throw new Error("Failed to generate user embedding");
		}

		let bestMatch = null;
		let highestSimilarity = -1;

		for (const doc of embeddingData) {
			const similarity = cosineSimilarity(doc.embedding, userEmbedding);
			if (similarity > highestSimilarity) {
				highestSimilarity = similarity;
				bestMatch = doc.text;
			}
		}

		console.log("Best match found:", bestMatch ? bestMatch.substring(0, 100) + "..." : "No match");

		const completionResponse = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: `You are an AI assistant with knowledge about Kirill. Use the following context to answer questions about him: "${bestMatch}". If the context doesn't provide enough information to answer the question directly, use it as a starting point and provide a relevant response based on general knowledge about product managers.`,
				},
				{ role: "user", content: input },
			],
			max_tokens: 150,
		});

		console.log("OpenAI completion response received");

		return new Response(
			JSON.stringify({ answer: completionResponse.choices[0]?.message?.content?.trim() }),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: unknown) {
		console.error("Error in serverless function:", error);
		let errorMessage = "An error occurred";
		let errorDetails = "";

		if (error instanceof Error) {
			errorMessage = error.message;
			errorDetails = error.stack || "";
		} else if (typeof error === "string") {
			errorMessage = error;
		}

		return new Response(JSON.stringify({ error: errorMessage, details: errorDetails }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

function cosineSimilarity(a: number[], b: number[]): number {
	const dotProduct = a.reduce((sum, _, i) => sum + (a[i] ?? 0) * (b[i] ?? 0), 0);
	const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}
