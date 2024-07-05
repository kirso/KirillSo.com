import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

console.log("UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL);
console.log(
	"UPSTASH_REDIS_REST_TOKEN (first 5 chars):",
	process.env.UPSTASH_REDIS_REST_TOKEN?.substring(0, 5),
);

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const ratelimit = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(10, "10 s"),
	analytics: false,
	prefix: "ratelimit",
});

export async function checkRateLimit(identifier: string) {
	console.log("Checking rate limit for:", identifier);
	try {
		console.log("About to call ratelimit.limit");
		const result = await ratelimit.limit(identifier);
		console.log("ratelimit.limit call completed");
		console.log("Rate limit result:", JSON.stringify(result, null, 2));
		return result;
	} catch (error: unknown) {
		console.error("Error in checkRateLimit:", error);
		if (error instanceof Error) {
			console.error("Error stack:", error.stack);
			throw new Error(`Rate limit check failed: ${error.message}`);
		} else {
			throw new Error(`Rate limit check failed: ${String(error)}`);
		}
	}
}

export async function testRedisConnection() {
	try {
		console.log("Testing Redis connection...");
		await redis.set("test-key", "test-value");
		const value = await redis.get("test-key");
		console.log("Redis connection test result:", value);
		await redis.del("test-key");
		console.log("Redis connection test completed successfully");
	} catch (error: unknown) {
		console.error("Redis connection test failed:", error);
		if (error instanceof Error) {
			console.error("Error details:", error.message);
			console.error("Error stack:", error.stack);
		}
		throw error;
	}
}
