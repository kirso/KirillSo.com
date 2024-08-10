import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs/promises";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid"; // Add this import

const id = import.meta.env.RESUME_EMBEDDING_ID || uuidv4();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

// Initialize Supabase client
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error("SUPABASE_URL or SUPABASE_KEY is not defined in the environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openaiApiKey = import.meta.env.OPENAI_API_KEY;

if (!openaiApiKey) {
	throw new Error("OPENAI_API_KEY is not defined in the environment variables");
}

const openai = new OpenAI({ apiKey: openaiApiKey });

async function generateEmbeddings() {
	try {
		// Read the resume.md file
		const resumePath = path.join(__dirname, "..", "..", "public", "files", "resume.md");
		const resumeContent = await fs.readFile(resumePath, "utf8");

		// Generate embedding for the entire resume content
		const embeddingResponse = await openai.embeddings.create({
			input: resumeContent,
			model: "text-embedding-ada-002",
		});

		if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
			throw new Error("No embedding found in OpenAI response");
		}

		const embedding = embeddingResponse.data[0].embedding;

		// Generate a UUID for the id
		const id = uuidv4();

		// Store the embedding in Supabase
		const { data, error } = await supabase
			.from("embeddings")
			.upsert([{ embedding, id, text: resumeContent }], { onConflict: "id" });

		if (error) {
			throw error;
		}

		console.log("Embedding generated and stored successfully.");
	} catch (error) {
		console.error("Error generating or storing embedding:", error);
	}
}

generateEmbeddings();
