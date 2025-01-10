import type { APIContext, InferGetStaticPropsType } from "astro";
import satori, { type SatoriOptions } from "satori";
import { Resvg } from "@resvg/resvg-js";
import { siteConfig } from "@/site-config";
import { getAllPosts, getFormattedDate } from "@/utils";
import fs from "fs/promises";

// Font loading
const fontRegular = await fs.readFile("./public/fonts/AtkinsonHyperlegible-Regular.ttf");
const fontBold = await fs.readFile("./public/fonts/AtkinsonHyperlegible-Bold.ttf");

const ogOptions: SatoriOptions = {
	width: 1200,
	height: 630,
	// debug: true,
	fonts: [
		{
			name: "Atkinson Hyperlegible",
			data: await fontRegular,
			weight: 400,
			style: "normal",
		},
		{
			name: "Atkinson Hyperlegible",
			data: await fontBold,
			weight: 700,
			style: "normal",
		},
	],
};

const markup = (title: string, pubDate: string) => ({
	type: 'div',
	props: {
		tw: 'flex flex-col w-full h-full bg-[#1d1f21] text-[#c9cacc]',
		children: [
			{
				type: 'div',
				props: {
					tw: 'flex flex-col flex-1 w-full p-10 justify-center',
					children: [
						{
							type: 'p',
							props: {
								tw: 'text-2xl mb-6',
								children: pubDate
							}
						},
						{
							type: 'h1',
							props: {
								tw: 'text-6xl font-bold leading-snug text-white',
								children: title
							}
						}
					]
				}
			},
			{
				type: 'div',
				props: {
					tw: 'flex items-center justify-between w-full p-10 border-t border-[#2bbc89] text-xl',
					children: [
						{
							type: 'div',
							props: {
								tw: 'flex items-center',
								children: [
									{
										type: 'svg',
										props: {
											width: '50',
											height: '50',
											viewBox: '0 0 900 900',
											preserveAspectRatio: 'xMidYMid meet',
											fill: 'none',
											xmlns: 'http://www.w3.org/2000/svg',
											children: [
												{
													type: 'path',
													props: {
														d: 'M900 540V360L750 270V180L750 90L600 0V180L450 90V180V270L600 360V540L675 585L750 630V540V450L900 540Z',
														fill: '#CAFFF4'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M300 360V540L450 630V540V450L300 360Z',
														fill: '#CAFFF4'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M0 360V540L150 450V540V630L300 540V360L450 270V180V90L300 180V0L150 90V180L150 270L0 360Z',
														fill: '#5DE4C7'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M750 630L900 540L750 450V540V630Z',
														fill: '#327567'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M450 270L300 360L450 450L600 360L450 270Z',
														fill: '#327567'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M0 540L150 630V540V450L0 540Z',
														fill: '#327567'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M600 720L750 630L675 585L600 540L450 630L300 540L150 630L300 720L150 810L300 900L450 810L600 900L750 810L600 720Z',
														fill: '#327567'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M450 90L300 1.04907e-05V180L450 90Z',
														fill: '#327567'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M300 720L150 630V720V810L300 720Z',
														fill: '#48AF99'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M600 540V360L450 450V540V630L600 540Z',
														fill: '#48AF99'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M750 630L600 720L750 810V720V630Z',
														fill: '#48AF99'
													}
												},
												{
													type: 'path',
													props: {
														d: 'M600 0L450 90L600 180V0Z',
														fill: '#48AF99'
													}
												}
											]
										}
									},
									{
										type: 'p',
										props: {
											tw: 'ml-3 font-semibold',
											children: siteConfig.title
										}
									}
								]
							}
						},
						{
							type: 'p',
							props: {
								children: ['by ', siteConfig.author]
							}
						}
					]
				}
			}
		]
	}
});

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export async function GET(context: APIContext) {
	const { title, pubDate } = context.props as Props;

	const postDate = getFormattedDate(pubDate, {
		weekday: "long",
		month: "long",
	});

	const svg = await satori(markup(title, postDate), ogOptions);
	const png = new Resvg(svg).render().asPng();
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
