import { defineConfig } from "astro/config";
import fs from "fs";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import remarkUnwrapImages from "remark-unwrap-images";
import rehypeExternalLinks from "rehype-external-links";
import { remarkReadingTime } from "./src/utils/remark-reading-time";
import icon from "astro-icon";
import expressiveCode from "astro-expressive-code";
import { expressiveCodeOptions } from "./src/site.config";
import svelte from "@astrojs/svelte";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
	site: "https://www.kirillso.com/",
	output: "hybrid",
	markdown: {
		remarkPlugins: [remarkUnwrapImages, remarkReadingTime],
		rehypePlugins: [
			[
				rehypeExternalLinks,
				{
					target: "_blank",
					rel: ["nofollow, noopener, noreferrer"],
				},
			],
		],
		remarkRehype: {
			footnoteLabelProperties: {
				className: [""],
			},
		},
	},
	integrations: [
		expressiveCode(expressiveCodeOptions),
		icon(),
		tailwind({
			applyBaseStyles: false,
		}),
		sitemap(),
		mdx(),
		svelte(),
	],
	image: {
		domains: ["webmention.io"],
	},
	// https://docs.astro.build/en/guides/prefetch/
	prefetch: true,
	vite: {
		define: {
			"process.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
			"process.env.SUPABASE_KEY": JSON.stringify(process.env.SUPABASE_KEY),
			"process.env.OPENAI_API_KEY": JSON.stringify(process.env.OPENAI_API_KEY),
			"import.meta.env.WEBMENTION_API_KEY": JSON.stringify(process.env.WEBMENTION_API_KEY),
		},
		plugins: [rawFonts([".ttf", ".woff"])],
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
		build: {
			rollupOptions: {
				external: [
					"node:util",
					"node:stream",
					"node:events",
					"node:os",
					"node:path",
					"child_process",
					"node:child_process",
					"node:crypto",
					"fs",
				],
			},
		},
	},
	adapter: vercel({
		webAnalytics: { enabled: true },
	}),
});
function rawFonts(ext: Array<string>) {
	return {
		name: "vite-plugin-raw-fonts",
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore:next-line
		transform(_, id) {
			if (ext.some((e) => id.endsWith(e))) {
				const buffer = fs.readFileSync(id);
				return {
					code: `export default ${JSON.stringify(buffer)}`,
					map: null,
				};
			}
		},
	};
}
