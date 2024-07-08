---
title: "Building Astro blog chat component with Svelte, Supabase, OpenAI and Upstash."
description: "Implementing a Svelte-based chat component with OpenAI integration, Supabase for data storage, and streaming responses in an Astro blog."
publishDate: "2024-07-07"
tags: ["astro", "svelte", "openai", "supabase", "webdev", "ai"]
draft: true
coverImage:
  src: "./Web Development Almasi.jpg"
  alt: "Code written on a screen"
  credit: "Ferenc Almasi"
---

## Table of Contents

1. [Introduction](#introduction)
2. [Project Setup](#project-setup)
3. [Supabase Setup](#supabase-setup)
4. [OpenAI Setup](#openai-setup)
5. [Generating and Storing Embeddings](#generating-and-storing-embeddings)
6. [Implementing the Svelte Chat Component](#implementing-the-svelte-chat-component)
7. [Creating the API Endpoint](#creating-the-api-endpoint)
8. [Implementing Rate Limiting](#implementing-rate-limiting)
9. [Integrating the Chat Component](#integrating-the-chat-component)
10. [Testing and Debugging](#testing-and-debugging)
11. [Deployment Considerations](#deployment-considerations)
12. [Conclusion](#conclusion)

## Introduction

As a product manager and tinkerer for life, I’m always looking for ways to enhance my personal website and explore new technologies. Recently, I decided to add an AI-powered chat component to my Astro based blog. This project allowed me to dive deep into several exciting technologies: Astro, Svelte, OpenAI, and Supabase.

In this comprehensive guide, I’ll walk you through the process of creating a chat interface where visitors can ask questions about you and your work. They will then receive AI-generated responses based on the content of your CV or any other text you choose to use as a knowledge base.

This project combines several key components:

1. A Svelte-based chat interface for a smooth user experience
2. An Astro API endpoint to handle requests
3. OpenAI for generating embeddings and chat responses
4. Supabase for storing and retrieving embeddings
5. Streaming responses for real-time interaction
6. Rate limiting to prevent abuse

By the end of this tutorial, you’ll have a fully functional AI chat component that you can customize and integrate into your own Astro-based website.

## Project Setup

Let’s start by setting up our project and installing the necessary dependencies.

### Step 1: Create or Use an Existing Astro Project

If you don’t already have an Astro project, you can create one using the following command:

```bash
npm create astro@latest
```

Follow the prompts to set up your project. If you’re adding this to an existing project, navigate to your project directory.

### Step 2: Install Dependencies

We’ll need to install several packages to make our AI chat component work. Run the following command in your project directory:

```bash
npm install @astrojs/svelte svelte openai @supabase/supabase-js @upstash/redis @upstash/ratelimit
```

This command installs:

- `@astrojs/svelte` and `svelte` for our chat component
- `openai` for interacting with the OpenAI API
- `@supabase/supabase-js` for our database interactions
- `@upstash/redis` and `@upstash/ratelimit` for implementing rate limiting

### Step 3: Configure Astro

Now, we need to update our Astro configuration to use Svelte. Open your `astro.config.mjs` file and modify it as follows:

```javascript
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

export default defineConfig({
	integrations: [svelte()],
	// Your other configurations...
});
```

This configuration tells Astro to use the Svelte integration, allowing us to create and use Svelte components in our Astro project.

### Step 4: Set Up Environment Variables

Create a `.env` file in your project root if you don’t already have one. We’ll add our API keys and other sensitive information to this file later.

```bash
touch .env
```

Make sure to add `.env` to your `.gitignore` file to prevent sensitive information from being committed to your repository.

With these steps completed, we’ve laid the groundwork for our AI chat component. In the next section, we’ll set up our Supabase database to store and retrieve embeddings.
