<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ResourceTimeline from '$lib/timeline/ResourceTimeline.svelte';
	import { ZOOMS } from '$lib/timeline/zoom.js';
	import { ASSIGNMENTS, RESOURCES, VIEWPORT_START } from './fixtures.js';
	import InteractiveTimeline from './InteractiveTimeline.svelte';

	const { Story } = defineMeta({
		title: 'Timeline/ResourceTimeline',
		component: ResourceTimeline,
		tags: ['autodocs'],
		args: {
			resources: RESOURCES,
			assignments: ASSIGNMENTS,
			viewportStart: VIEWPORT_START
		}
	});
</script>

<Story name="Default" args={{ zoom: ZOOMS.day }} />

<Story
	name="Interactive (Drag)"
	args={{
		resources: RESOURCES,
		assignments: ASSIGNMENTS,
		viewportStart: VIEWPORT_START,
		zoom: ZOOMS.day
	}}
>
	{#snippet template(args)}
		<InteractiveTimeline
			resources={args.resources}
			initialAssignments={args.assignments}
			viewportStart={args.viewportStart!}
			zoom={args.zoom!}
			visibleCols={args.visibleCols}
		/>
	{/snippet}
</Story>

<Story name="DayZoom" args={{ zoom: ZOOMS.day, visibleCols: 14 }} />

<Story name="WeekZoom" args={{ zoom: ZOOMS.week, visibleCols: 12 }} />

<Story name="MonthZoom" args={{ zoom: ZOOMS.month, visibleCols: 12 }} />

<Story name="YearZoom" args={{ zoom: ZOOMS.year, visibleCols: 5 }} />

<Story name="Empty" args={{ zoom: ZOOMS.day, assignments: [] }} />

<!--
	#32: 長期間 bar (6 ヶ月) で label が viewport 外に隠れない (sticky) regression を visual
	に確認する story。 visibleCols を絞って bar が viewport を必ず超えるよう設定。 horizontal
	scroll しても label が左端に追従するのが期待挙動。
-->
<Story
	name="LongDurationBar (#32)"
	args={{
		zoom: ZOOMS.day,
		visibleCols: 14,
		resources: [{ id: 'tanaka', name: '田中 太郎' }],
		assignments: [
			{
				id: 'long-1',
				resourceId: 'tanaka',
				startDate: new Date(2026, 4, 1),
				endDate: new Date(2026, 9, 31),
				label: 'G社 6 ヶ月案件 (sticky label demo)',
				color: '#4f46e5'
			}
		]
	}}
/>

<Story
	name="ManyResources"
	args={{
		zoom: ZOOMS.week,
		resources: Array.from({ length: 30 }, (_, i) => ({
			id: `r${i}`,
			name: `要員 ${i + 1}`
		})),
		assignments: Array.from({ length: 60 }, (_, i) => ({
			id: `m${i}`,
			resourceId: `r${i % 30}`,
			startDate: new Date(`2026-0${Math.floor(i / 20) + 5}-0${(i % 4) * 7 + 4}T00:00:00Z`),
			endDate: new Date(`2026-0${Math.floor(i / 20) + 5}-${15 + (i % 4) * 3}T00:00:00Z`),
			label: `案件 ${i + 1}`,
			color: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
		}))
	}}
/>
