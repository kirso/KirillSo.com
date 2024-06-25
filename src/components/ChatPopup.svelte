<script>
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";

	let isOpen = false;
	let input = "";
	let messages = [];
	let isLoading = false;
	let currentStreamedMessage = "";

	onMount(() => {
		messages = [{ user: "bot", text: "Hello! How can I assist you?", isQuestion: false }];
	});

	async function handleSendMessage(event) {
		event.preventDefault();

		const trimmedInput = input.trim();
		if (!trimmedInput) return;

		messages = [...messages, { user: "user", text: trimmedInput, isQuestion: true }];
		input = "";
		isLoading = true;

		try {
			const response = await fetch("/api/embeddings", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
				},
				body: JSON.stringify({ input: trimmedInput }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Simulate streaming effect
			currentStreamedMessage = "";
			const words = data.answer.split(" ");
			for (let word of words) {
				currentStreamedMessage += word + " ";
				await new Promise((resolve) => setTimeout(resolve, 50)); // Adjust timing as needed
			}

			messages = [...messages, { user: "bot", text: data.answer, isQuestion: false }];
		} catch (error) {
			console.error("Failed to send message:", error);
			messages = [
				...messages,
				{
					user: "bot",
					text: error.message || "Sorry, there was an error processing your request.",
					isQuestion: false,
				},
			];
		} finally {
			isLoading = false;
			currentStreamedMessage = "";
		}
	}
</script>

<div class="fixed bottom-4 right-4 z-50">
	<button
		class="bg-accent text-bgColor hover:opacity-80 px-4 py-2 rounded-full font-bold transition-opacity"
		on:click={() => (isOpen = !isOpen)}
		aria-label={isOpen ? "Close chat" : "Open chat"}
	>
		{isOpen ? "Close" : "Chat"}
	</button>
	{#if isOpen}
		<div
			class="absolute bottom-16 right-0 w-80 max-h-96 bg-bgColor border border-textColor rounded-lg overflow-hidden flex flex-col shadow-lg"
			transition:fade
		>
			<div class="flex-grow overflow-y-auto p-4 space-y-2">
				{#each messages as msg}
					<div
						class="max-w-[80%] p-2 rounded-lg {msg.isQuestion
							? 'ml-auto text-accent'
							: 'mr-auto bg-gray-100 dark:bg-gray-800 text-textColor'}"
						transition:fade
					>
						{msg.text}
					</div>
				{/each}
				{#if isLoading}
					<div class="flex items-center space-x-2">
						<div class="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
						<div
							class="w-2 h-2 bg-accent rounded-full animate-bounce"
							style="animation-delay: 0.2s"
						></div>
						<div
							class="w-2 h-2 bg-accent rounded-full animate-bounce"
							style="animation-delay: 0.4s"
						></div>
					</div>
				{/if}
				{#if currentStreamedMessage}
					<div
						class="max-w-[80%] p-2 rounded-lg mr-auto bg-gray-100 dark:bg-gray-800 text-textColor"
					>
						{currentStreamedMessage}
					</div>
				{/if}
			</div>
			<form on:submit={handleSendMessage} class="p-2 border-t border-textColor">
				<input
					type="text"
					bind:value={input}
					placeholder="Type your message..."
					class="w-full p-2 mb-2 border border-textColor rounded-lg bg-bgColor text-textColor focus:outline-none focus:ring-2 focus:ring-accent"
				/>
				<button
					type="submit"
					class="w-full bg-accent text-bgColor px-4 py-2 rounded-lg font-bold transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!input || isLoading}
				>
					{isLoading ? "Sending..." : "Send"}
				</button>
			</form>
		</div>
	{/if}
</div>

<style>
	/* Add any additional styles here */
</style>
