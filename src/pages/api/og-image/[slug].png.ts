import type { APIContext, InferGetStaticPropsType } from "astro";
import { getAllPosts, getFormattedDate } from "@/utils";
import { generateOgImage } from "@/lib/og-image/generator";

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { title, pubDate } = context.props as Props;

	const postDate = getFormattedDate(pubDate, {
		weekday: "long",
		month: "long",
	});

	const png = await generateOgImage(title, postDate);

	return new Response(png, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}

export async function getStaticPaths() {
	const posts = await getAllPosts();
	return posts
		.filter(({ data }) => !data.ogImage)
		.map((post) => ({
			params: { slug: post.slug },
			props: {
				title: post.data.title,
				pubDate: post.data.updatedDate ?? post.data.publishDate,
			},
		}));
}
