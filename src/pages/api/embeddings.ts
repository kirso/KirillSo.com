import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabaseClient";
import OpenAI from "openai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

// Do not pre-render this route
export const prerender = false;

// Initialize OpenAI client using environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
	throw new Error("OPENAI_API_KEY is not defined in the environment variables");
}
const openai = new OpenAI({ apiKey: openaiApiKey });

// Initialize rate limiter
const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 5, // limit each IP to 5 requests per windowMs
	message: "Too many requests, please try again after 5 minutes.",
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers each IP to 100 requests per windowMs
});

export const POST: APIRoute = async ({ request }) => {
	// Apply rate limiting
	try {
		await new Promise((resolve, reject) => {
			// @ts-ignore: Express middleware in Astro
			limiter(request, {}, (result: any) => {
				if (result instanceof Error) {
					reject(result);
				} else {
					resolve(result);
				}
			});
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: "Too many requests, please try again later." }), {
			status: 429,
			headers: { "Content-Type": "application/json" },
		});
	}

	console.log("Request method:", request.method);
	console.log("Request headers:", Object.fromEntries(request.headers));

	let rawBody, parsedBody;
	try {
		rawBody = await request.text();
		console.log("Raw body:", rawBody);

		if (!rawBody) {
			throw new Error("Empty request body");
		}

		parsedBody = JSON.parse(rawBody);
		console.log("Parsed body:", parsedBody);

		if (!parsedBody || typeof parsedBody.input === "undefined") {
			throw new Error("Missing 'input' property in JSON");
		}

		const { input } = parsedBody;
		console.log("Input:", input);

		let { data: embeddingData, error: supabaseError } = await supabase
			.from("embeddings")
			.select("embedding, text");

		if (supabaseError) {
			console.error("Supabase error:", supabaseError);
			throw new Error(`Supabase error: ${supabaseError.message}`);
		}

		if (!embeddingData || embeddingData.length === 0) {
			console.log("No embedding data retrieved from Supabase");
			throw new Error("No data found");
		}

		// Parse string embeddings into arrays
		embeddingData = embeddingData.map((item) => ({
			...item,
			embedding: typeof item.embedding === "string" ? JSON.parse(item.embedding) : item.embedding,
		}));

		console.log(`Retrieved ${embeddingData.length} embeddings from Supabase`);

		let userEmbedding: number[];
		try {
			const embeddingResponse = await openai.embeddings.create({
				input: input,
				model: "text-embedding-ada-002",
			});
			userEmbedding = embeddingResponse.data[0]?.embedding as number[];
			if (!userEmbedding || !Array.isArray(userEmbedding)) {
				throw new Error("Invalid user embedding");
			}
			console.log("User embedding sample:", userEmbedding.slice(0, 10));
		} catch (error) {
			console.error("Error creating user embedding:", error);
			throw new Error("Failed to create user embedding");
		}

		let highestSimilarity = -1;
		let bestMatch: string | null = null;

		function cosineSimilarity(a: number[], b: number[]): number {
			if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
				throw new Error("Vectors must be of the same length and non-empty arrays.");
			}
			const dotProduct = a.reduce((sum, _, i) => sum + (a[i] ?? 0) * (b[i] ?? 0), 0);
			const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
			const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
			return dotProduct / (magnitudeA * magnitudeB);
		}

		for (const doc of embeddingData) {
			if (Array.isArray(doc.embedding) && doc.embedding.length === userEmbedding.length) {
				const similarity = cosineSimilarity(doc.embedding, userEmbedding);
				if (similarity > highestSimilarity) {
					highestSimilarity = similarity;
					bestMatch = doc.text;
				}
			} else {
				console.log("Skipping invalid embedding:", doc.embedding);
			}
		}

		console.log("Highest similarity:", highestSimilarity);
		console.log("Best match:", bestMatch ? bestMatch.substring(0, 100) + "..." : "No match found");

		if (!bestMatch) {
			bestMatch = "I don't have specific information about that in my knowledge base.";
			console.log("No match found, using fallback response");
		}

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

		const answer =
			completionResponse.choices[0]?.message?.content?.trim() ||
			"Sorry, I couldn't generate a response.";
		return new Response(JSON.stringify({ answer }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error: unknown) {
		console.error("Error details:", error);
		let errorMessage = "An unknown error occurred";
		let errorDetails = "";

		if (error instanceof Error) {
			errorMessage = error.message;
			errorDetails = error.stack || "";
		} else if (typeof error === "string") {
			errorMessage = error;
		}

		return new Response(
			JSON.stringify({
				error: errorMessage,
				details: errorDetails,
				rawBody: rawBody,
				parsedBody: parsedBody,
				contentType: request.headers.get("Content-Type"),
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
