import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openaiApiKey = import.meta.env.OPENAI_API_KEY;
if (!openaiApiKey) {
	throw new Error("OPENAI_API_KEY is not defined in the environment variables");
}

export const openai = new OpenAI({
	apiKey: openaiApiKey,
	baseURL: "https://oai.hconeai.com/v1",
	defaultHeaders: {
		"Helicone-Auth": `Bearer ${process.env.HELICONE_AUTH_HEADER}`,
		"helicone-stream-usage": "true",
	},
});

export async function createEmbedding(input: string) {
	return await openai.embeddings.create({
		input: input,
		model: "text-embedding-ada-002",
	});
}

export async function createChatCompletion(messages: any[], maxTokens: number = 200) {
	return await openai.chat.completions.create({
		model: "gpt-3.5-turbo-16k",
		messages: messages,
		max_tokens: maxTokens,
		temperature: 0.7,
		stream: true,
	});
}
