import type { APIRoute } from "astro";
import { createEmbedding, createChatCompletion } from "../../lib/services/openai";
import { getEmbeddings } from "../../lib/services/supabase";
import { ratelimit } from "../../lib/services/ratelimit";
import { findBestMatch } from "../../lib/utils/embedding";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	console.log("Function invoked");

	const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
	const { success, limit, reset, remaining } = await ratelimit.limit(ip);

	if (!success) {
		return new Response(JSON.stringify({ error: "Too many requests, please try again later." }), {
			status: 429,
			headers: {
				"Content-Type": "application/json",
				"X-RateLimit-Limit": limit.toString(),
				"X-RateLimit-Remaining": remaining.toString(),
				"X-RateLimit-Reset": reset.toString(),
			},
		});
	}

	try {
		const { input } = await request.json();
		console.log("Input:", input);

		const embeddingData = await getEmbeddings();
		const embeddingResponse = await createEmbedding(input);
		const userEmbedding = embeddingResponse.data[0]?.embedding;

		if (!userEmbedding || !Array.isArray(userEmbedding)) {
			throw new Error("Failed to generate valid user embedding");
		}

		const bestMatch = findBestMatch(userEmbedding, embeddingData);

		if (!bestMatch) {
			throw new Error("No matching embedding found");
		}

		const stream = await createChatCompletion([
			{
				role: "system",
				content: `You are an AI assistant with knowledge about Kirill. Use the following context to answer questions about him: "${bestMatch}". Provide concise but complete answers. Aim for responses between 100-150 words. If the context doesn't provide enough information to answer the question directly, use it as a starting point and provide a relevant response based on general knowledge about product managers.`,
			},
			{ role: "user", content: input },
		]);

		const readable = new ReadableStream({
			async start(controller) {
				for await (const chunk of stream) {
					const content = chunk.choices[0]?.delta?.content || "";
					controller.enqueue(content);
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
