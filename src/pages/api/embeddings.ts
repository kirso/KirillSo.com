import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	console.log("Function invoked");
	try {
		const rawBody = await request.text();
		console.log("Raw body:", rawBody);

		const parsedBody = JSON.parse(rawBody);
		console.log("Parsed body:", parsedBody);

		const { input } = parsedBody;
		console.log("Input:", input);

		// Simple response
		return new Response(
			JSON.stringify({
				message: "Function executed successfully",
				receivedInput: input,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: unknown) {
		console.error("Error in serverless function:", error);
		let errorMessage = "An error occurred";
		let errorDetails = "";

		if (error instanceof Error) {
			errorMessage = error.message;
			errorDetails = error.stack || "";
		} else if (typeof error === "string") {
			errorMessage = error;
		}

		console.error("Error details:", errorMessage, errorDetails);

		return new Response(JSON.stringify({ error: errorMessage, details: errorDetails }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
