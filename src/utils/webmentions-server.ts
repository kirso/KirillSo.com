import fs from "fs/promises";
import path from "path";
import type { WebmentionsFeed, WebmentionsChildren } from "@/types";

const DOMAIN = import.meta.env.SITE;
const WEBMENTION_API_KEY = import.meta.env.PUBLIC_WEBMENTION_API_KEY;

export async function fetchWebmentionsForUrl(url: string): Promise<WebmentionsChildren[]> {
	const target = `${DOMAIN}${url}`;
	const response = await fetch(
		`https://webmention.io/api/mentions.jf2?target=${target}&token=${WEBMENTION_API_KEY}&per-page=1000`,
	);
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data: WebmentionsFeed = await response.json();
	return data.children;
}

export async function saveWebmentions(webmentions: Record<string, WebmentionsChildren[]>) {
	const dirPath = path.join(process.cwd(), "src", "data");
	const filePath = path.join(dirPath, "webmentions.json");

	await fs.mkdir(dirPath, { recursive: true });
	await fs.writeFile(filePath, JSON.stringify(webmentions, null, 2));
}

export async function loadWebmentions(): Promise<Record<string, WebmentionsChildren[]>> {
	const filePath = path.join(process.cwd(), "src", "data", "webmentions.json");
	const fileContent = await fs.readFile(filePath, "utf-8");
	return JSON.parse(fileContent);
}
