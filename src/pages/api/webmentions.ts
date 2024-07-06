import type { APIRoute } from "astro";
import { getWebmentionsForUrl } from "../../utils/webmentions";
import type { WebmentionsChildren } from "../../types";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const targetUrl = url.searchParams.get("url");
	if (!targetUrl) {
		return new Response(JSON.stringify({ error: "No URL provided" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const webmentions: WebmentionsChildren[] = await getWebmentionsForUrl(targetUrl);
		return new Response(JSON.stringify(webmentions), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Error fetching webmentions:", error);
		return new Response(JSON.stringify({ error: "Failed to fetch webmentions" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
