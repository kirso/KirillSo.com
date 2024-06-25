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

interface EmbeddingData {
	embedding: number[] | string;
	text: string;
}

export const POST: APIRoute = async ({ request }) => {
	console.log("Function invoked");
	try {
		console.log("Parsing request body");
		const rawBody = await request.text();
		console.log("Raw body:", rawBody);

		const parsedBody = JSON.parse(rawBody);
		console.log("Parsed body:", parsedBody);

		const { input } = parsedBody as { input: string };
		console.log("Input:", input);

		console.log("Querying Supabase");
		console.log("Supabase URL:", process.env.SUPABASE_URL);
		console.log("Supabase Key (first 5 chars):", process.env.SUPABASE_KEY?.substring(0, 5));

		const { data: embeddingData, error: supabaseError } = await supabase
			.from("embeddings")
			.select("embedding, text");

		if (supabaseError) {
			console.error("Supabase error:", supabaseError);
			throw new Error(`Supabase error: ${supabaseError.message}`);
		}

		console.log("Raw Supabase response:", embeddingData);

		if (!embeddingData) {
			throw new Error("Supabase returned null or undefined data");
		}

		if (embeddingData.length === 0) {
			console.log("Supabase returned an empty array. Checking table information...");

			// Query for table information
			const { data: tableInfo, error: tableError } = await supabase
				.from("embeddings")
				.select("count");

			if (tableError) {
				console.error("Error fetching table information:", tableError);
			} else {
				console.log("Table information:", tableInfo);
			}

			throw new Error(
				"No embedding data found in the Supabase table. Please check if the table is populated.",
			);
		}

		console.log("Embedding data retrieved, count:", embeddingData.length);
		console.log("First embedding item:", embeddingData[0]);

		// Convert string embeddings to number arrays
		const processedEmbeddings: EmbeddingData[] = embeddingData
			.map((item: EmbeddingData) => {
				if (typeof item.embedding === "string") {
					try {
						return {
							...item,
							embedding: JSON.parse(item.embedding) as number[],
						};
					} catch (error) {
						console.error("Error parsing embedding string:", error);
						return null;
					}
				}
				return item;
			})
			.filter((item): item is EmbeddingData => item !== null);

		console.log("Processed embeddings count:", processedEmbeddings.length);
		if (processedEmbeddings.length === 0) {
			throw new Error("All embeddings failed to process");
		}

		console.log("Creating OpenAI embedding");
		const embeddingResponse = await openai.embeddings.create({
			input: input,
			model: "text-embedding-ada-002",
		});

		console.log("OpenAI embedding created");

		const userEmbedding = embeddingResponse.data[0]?.embedding;
		if (!userEmbedding || !Array.isArray(userEmbedding)) {
			throw new Error("Failed to generate valid user embedding");
		}

		console.log("Finding best match");
		let bestMatch: string | null = null;
		let highestSimilarity = -1;

		for (const doc of processedEmbeddings) {
			if (Array.isArray(doc.embedding)) {
				const similarity = cosineSimilarity(doc.embedding, userEmbedding);
				if (similarity > highestSimilarity) {
					highestSimilarity = similarity;
					bestMatch = doc.text;
				}
			}
		}

		console.log("Best match found:", bestMatch ? bestMatch.substring(0, 100) + "..." : "No match");

		if (!bestMatch) {
			throw new Error("No matching embedding found");
		}

		console.log("Creating OpenAI chat completion");
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
	} catch (error) {
		console.error("Error in serverless function:", error);
		const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
		const errorDetails = error instanceof Error ? error.stack : "";

		console.error("Error details:", errorMessage, errorDetails);

		return new Response(
			JSON.stringify({
				error: errorMessage,
				details: errorDetails,
				message:
					"There was an error processing your request. Please check the server logs for more information.",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};

function cosineSimilarity(a: number[], b: number[]): number {
	const dotProduct = a.reduce((sum, _, i) => sum + (a[i] ?? 0) * (b[i] ?? 0), 0);
	const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}
