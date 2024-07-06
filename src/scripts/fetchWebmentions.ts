import { fetchWebmentionsForUrl, saveWebmentions } from "../utils/webmentions-server";

async function fetchAndSaveWebmentions() {
	try {
		// Fetch webmentions for the homepage
		const homepageWebmentions = await fetchWebmentionsForUrl("/");

		const webmentions = {
			"/": homepageWebmentions,
		};

		await saveWebmentions(webmentions);

		console.log("Webmentions fetched and saved successfully");
	} catch (error) {
		console.error("Error fetching and saving webmentions:", error);
	}
}

fetchAndSaveWebmentions();
