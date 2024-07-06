export type SiteConfig = {
	author: string;
	title: string;
	description: string;
	lang: string;
	ogLocale: string;
	date: {
		locale: string | string[] | undefined;
		options: Intl.DateTimeFormatOptions;
	};
	webmentions?: {
		link: string;
		pingback?: string;
	};
};

export type PaginationLink = {
	url: string;
	text?: string;
	srLabel?: string;
};

export type SiteMeta = {
	title: string;
	description?: string;
	ogImage?: string | undefined;
	articleDate?: string | undefined;
};

/** Webmentions */
export type WebmentionsFeed = {
	type: string;
	name: string;
	children: WebmentionsChildren[];
};

export type WebmentionsChildren = {
	type: string;
	author: Author;
	url: string;
	published: string | null;
	"wm-received": string;
	"wm-id": number;
	"wm-source": string;
	"wm-target": string;
	"wm-protocol": string;
	"wm-property": WebmentionProperty;
	content?: {
		text: string;
	};
	[key: string]: unknown;
};

export type Author = {
	type: string;
	name: string;
	photo: string;
	url: string;
};

export type WebmentionProperty = "like-of" | "mention-of" | "in-reply-to" | "repost-of";

export type Content = {
	"content-type": string;
	value: string;
	html: string;
	text: string;
};

export type Rels = {
	canonical: string;
};

export type Summary = {
	"content-type": string;
	value: string;
};
