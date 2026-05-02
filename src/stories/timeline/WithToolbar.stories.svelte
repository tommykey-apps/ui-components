<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import WithToolbarDemo from './WithToolbarDemo.svelte';
	import { ASSIGNMENTS, RESOURCES, VIEWPORT_START } from './fixtures.js';

	const { Story } = defineMeta({
		title: 'Timeline/WithToolbar',
		component: WithToolbarDemo,
		tags: ['autodocs'],
		args: {
			resources: RESOURCES,
			assignments: ASSIGNMENTS,
			initialViewportStart: VIEWPORT_START
		}
	});
</script>

<Story name="Default" />
