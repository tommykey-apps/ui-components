<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Welcome from './Welcome.svelte';

	const { Story } = defineMeta({
		title: 'Welcome',
		component: Welcome,
		tags: ['autodocs']
	});
</script>

<Story name="Default" args={{ name: 'ui-components' }} />
