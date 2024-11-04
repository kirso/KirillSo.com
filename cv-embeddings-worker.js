import { OpenAI } from "openai";

export default {
	async fetch(request, env) {
		const { searchParams } = new URL(request.url);
		const action = searchParams.get("action");

		switch (action) {
			case "insert":
				return handleInsert(request, env);
			case "query":
				return handleQuery(request, env);
			default:
				return new Response("Invalid action", { status: 400 });
		}
	},
};

async function handleInsert(request, env) {
	const { text } = await request.json();
	const embedding = await generateEmbedding(text, env);
	await env.CV_EMBEDDINGS.insert([
		{
			id: "cv",
			values: embedding,
			metadata: { text },
		},
	]);
	return new Response("CV embedding inserted", { status: 200 });
}

async function handleQuery(request, env) {
	const { query } = await request.json();
	const queryEmbedding = await generateEmbedding(query, env);
	const results = await env.CV_EMBEDDINGS.query(queryEmbedding, {
		topK: 1,
		returnValues: true,
		returnMetadata: true,
	});
	return Response.json(results);
}

async function generateEmbedding(text, env) {
	const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
	const response = await openai.embeddings.create({
		input: text,
		model: "text-embedding-ada-002",
	});
	return response.data[0].embedding;
}
