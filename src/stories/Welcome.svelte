<script lang="ts">
	let { name = 'ui-components' }: { name?: string } = $props();
</script>

<section class="welcome">
	<h1>@tommykey-apps/{name}</h1>
	<p>Reusable Svelte 5 component library — Storybook playground.</p>
	<p class="hint">Add stories under <code>src/lib/&lt;component&gt;/*.stories.svelte</code>.</p>
</section>

<style>
	.welcome {
		font-family: var(--ui-font, system-ui, sans-serif);
		padding: 2rem;
		max-width: 40rem;
		color: var(--ui-fg, #1a1a1a);
		background: var(--ui-bg, #fafafa);
		border-radius: var(--ui-radius, 8px);
	}
	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}
	p {
		margin: 0.25rem 0;
	}
	.hint {
		margin-top: 1rem;
		color: var(--ui-fg-muted, #666);
		font-size: 0.875rem;
	}
	code {
		background: var(--ui-code-bg, #eee);
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-family: ui-monospace, monospace;
	}
</style>
