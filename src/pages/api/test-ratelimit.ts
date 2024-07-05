import type { APIRoute } from "astro";
import { checkRateLimit, testRedisConnection } from "../../lib/services/ratelimit";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
	const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
	console.log("Request from IP:", ip);

	try {
		console.log("Testing Redis connection...");
		await testRedisConnection();
		console.log("Redis connection test passed");

		console.log("About to check rate limit");
		const result = await checkRateLimit(ip);
		console.log("Rate limit check completed", result);

		const { success, limit, reset, remaining } = result;

		console.log("Rate limit check result:", { success, limit, reset, remaining });

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

		return new Response(
			JSON.stringify({
				message: "Rate limit test successful",
				remaining,
				limit,
				reset: new Date(reset * 1000).toISOString(), // Convert seconds to milliseconds
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: unknown) {
		console.error("Error in rate limit check:", error);
		let errorMessage = "Internal server error";
		let errorDetails = "";
		if (error instanceof Error) {
			console.error("Error stack:", error.stack);
			errorMessage = error.message;
			errorDetails = error.stack || "";
		} else if (typeof error === "string") {
			errorMessage = error;
		}
		return new Response(JSON.stringify({ error: errorMessage, details: errorDetails }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
