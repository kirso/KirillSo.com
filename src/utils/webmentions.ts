import type { WebmentionsChildren, WebmentionProperty } from "../types";

const SITE_URL = import.meta.env.SITE;
const WEBMENTION_API_KEY = import.meta.env.WEBMENTION_API_KEY;

export async function getWebmentionsForUrl(url: string): Promise<WebmentionsChildren[]> {
	console.log("Fetching webmentions for URL:", url);
	console.log("WEBMENTION_API_KEY:", WEBMENTION_API_KEY ? "Set" : "Not set");

	if (typeof window === "undefined") {
		console.log("Running in server environment");
		try {
			const apiUrl = `https://webmention.io/api/mentions.jf2?target=${url}&token=${WEBMENTION_API_KEY}`;
			console.log("Fetching from:", apiUrl);
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			console.log("Webmention.io response:", data);
			return data.children || [];
		} catch (error) {
			console.error("Error fetching webmentions during build:", error);
			return [];
		}
	} else {
		console.log("Running in browser environment");
		const apiUrl = new URL("/api/webmentions", SITE_URL);
		apiUrl.searchParams.set("url", url);

		try {
			const response = await fetch(apiUrl.toString());
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data: WebmentionsChildren[] = await response.json();
			console.log("Webmentions fetched successfully:", data);
			return data;
		} catch (error) {
			console.error("Error fetching webmentions:", error);
			return [];
		}
	}
}

export function filterWebmentions(
	webmentions: WebmentionsChildren[],
	type: WebmentionProperty,
): WebmentionsChildren[] {
	return webmentions.filter((mention) => mention["wm-property"] === type);
}

export function getWebmentionCounts(
	webmentions: WebmentionsChildren[],
): Record<WebmentionProperty, number> {
	const counts: Record<WebmentionProperty, number> = {
		"like-of": 0,
		"mention-of": 0,
		"in-reply-to": 0,
		"repost-of": 0,
	};

	webmentions.forEach((mention) => {
		if (mention["wm-property"] in counts) {
			counts[mention["wm-property"]]++;
		}
	});

	return counts;
}
