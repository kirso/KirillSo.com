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
		const parsedBody = await request.json();
		const { input } = parsedBody;
		console.log("Input:", input);

		const { data: embeddingData, error: supabaseError } = await supabase
			.from("embeddings")
			.select("embedding, text");

		if (supabaseError) {
			throw new Error(`Supabase error: ${supabaseError.message}`);
		}

		if (!embeddingData || embeddingData.length === 0) {
			throw new Error("No embedding data found in the Supabase table.");
		}

		const embeddingResponse = await openai.embeddings.create({
			input: input,
			model: "text-embedding-ada-002",
		});

		const userEmbedding = embeddingResponse.data[0]?.embedding;
		if (!userEmbedding || !Array.isArray(userEmbedding)) {
			throw new Error("Failed to generate valid user embedding");
		}

		let bestMatch = null;
		let highestSimilarity = -1;

		for (const doc of embeddingData) {
			let docEmbedding: number[];
			if (typeof doc.embedding === "string") {
				try {
					docEmbedding = JSON.parse(doc.embedding);
				} catch (error) {
					console.error("Error parsing embedding:", error);
					continue;
				}
			} else if (Array.isArray(doc.embedding)) {
				docEmbedding = doc.embedding;
			} else {
				console.error("Invalid embedding format:", doc.embedding);
				continue;
			}

			if (!Array.isArray(docEmbedding) || docEmbedding.length !== userEmbedding.length) {
				console.error("Incompatible embedding:", docEmbedding);
				continue;
			}

			const similarity = cosineSimilarity(docEmbedding, userEmbedding);
			if (similarity > highestSimilarity) {
				highestSimilarity = similarity;
				bestMatch = doc.text;
			}
		}

		if (!bestMatch) {
			throw new Error("No matching embedding found");
		}

		const stream = await openai.chat.completions.create({
			model: "gpt-3.5-turbo-16k",
			messages: [
				{
					role: "system",
					content: `You are an AI assistant with knowledge about Kirill. Use the following context to answer questions about him: "${bestMatch}". Provide concise but complete answers. Aim for responses between 100-150 words. If the context doesn't provide enough information to answer the question directly, use it as a starting point and provide a relevant response based on general knowledge about product managers.`,
				},
				{ role: "user", content: input },
			],
			max_tokens: 200,
			temperature: 0.7,
			stream: true,
		});

		let fullResponse = "";
		const readable = new ReadableStream({
			async start(controller) {
				for await (const chunk of stream) {
					const content = chunk.choices[0]?.delta?.content || "";
					fullResponse += content;
					controller.enqueue(content);
				}

				// Ensure the response ends with a complete sentence
				if (fullResponse) {
					const lastSentenceEnd = fullResponse.lastIndexOf(".");
					if (lastSentenceEnd !== -1 && lastSentenceEnd !== fullResponse.length - 1) {
						const completeResponse = fullResponse.substring(0, lastSentenceEnd + 1);
						controller.enqueue("\n\n[Response truncated for brevity]");
						fullResponse = completeResponse;
					}
				}

				controller.close();
			},
		});

		return new Response(readable, {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	} catch (error) {
		console.error("Error in serverless function:", error);
		const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

function cosineSimilarity(a: number[], b: number[]): number {
	if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
		throw new Error("Invalid input for cosine similarity calculation");
	}
	const dotProduct = a.reduce((sum, _, i) => sum + (a[i] ?? 0) * (b[i] ?? 0), 0);
	const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}
