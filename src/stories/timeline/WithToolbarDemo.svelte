<script lang="ts">
	import ResourceTimeline from '$lib/timeline/ResourceTimeline.svelte';
	import TimelineToolbar from '$lib/timeline/TimelineToolbar.svelte';
	import { ZOOMS } from '$lib/timeline/zoom.js';
	import type { Assignment, Resource } from '$lib/timeline/types.js';

	type Props = {
		resources: Resource[];
		assignments: Assignment[];
		initialViewportStart: Date;
	};

	let { resources, assignments: initialAssignments, initialViewportStart }: Props = $props();

	// initial を一度だけ取って以降はローカル state
	// svelte-ignore state_referenced_locally
	let assignments = $state(initialAssignments);
	// svelte-ignore state_referenced_locally
	let viewportStart = $state(initialViewportStart);
	let zoom = $state(ZOOMS.day);
</script>

<div class="demo">
	<TimelineToolbar
		bind:viewportStart
		bind:zoom
		labels={{
			today: '今日',
			prev: '前へ',
			next: '次へ',
			zoomDay: '日',
			zoomWeek: '週',
			zoomMonth: '月',
			zoomYear: '年'
		}}
		ariaLabels={{ prev: '前の期間へ', next: '次の期間へ' }}
	/>
	<ResourceTimeline
		{resources}
		{assignments}
		bind:viewportStart
		{zoom}
		onMove={(updated) => {
			assignments = assignments.map((a) => (a.id === updated.id ? updated : a));
		}}
		onResize={(updated) => {
			assignments = assignments.map((a) => (a.id === updated.id ? updated : a));
		}}
	/>
</div>

<style>
	.demo {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
