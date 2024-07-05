export function cosineSimilarity(a: number[], b: number[]): number {
	if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
		throw new Error("Invalid input for cosine similarity calculation");
	}
	const dotProduct = a.reduce((sum, _, i) => sum + (a[i] ?? 0) * (b[i] ?? 0), 0);
	const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + (val ?? 0) ** 2, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}

export function findBestMatch(userEmbedding: number[], embeddingData: any[]) {
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

	return bestMatch;
}
