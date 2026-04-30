<script lang="ts">
	import ResourceTimeline from '$lib/timeline/ResourceTimeline.svelte';
	import type { Assignment, Resource, ZoomLevel } from '$lib/timeline/types.js';

	type Props = {
		resources: Resource[];
		initialAssignments: Assignment[];
		viewportStart: Date;
		zoom: ZoomLevel;
		visibleCols?: number;
	};

	let { resources, initialAssignments, viewportStart, zoom, visibleCols }: Props = $props();

	// initialAssignments は初期値のみ取得し、以降はローカルstate
	// svelte-ignore state_referenced_locally
	let assignments = $state(initialAssignments);
</script>

<ResourceTimeline
	{resources}
	{assignments}
	{viewportStart}
	{zoom}
	{visibleCols}
	onMove={(updated) => {
		assignments = assignments.map((a) => (a.id === updated.id ? updated : a));
	}}
	onResize={(updated) => {
		assignments = assignments.map((a) => (a.id === updated.id ? updated : a));
	}}
/>
