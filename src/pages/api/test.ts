import type { APIRoute } from "astro";
export const prerender = false;

export const GET: APIRoute = () => {
	console.log("Test function invoked");
	return new Response(JSON.stringify({ message: "Test successful" }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
