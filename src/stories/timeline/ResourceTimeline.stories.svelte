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
	長期間 bar (6 ヶ月) で hover tooltip が viewport 内に表示されることを visual に確認する
	story。 旧 #32 sticky label は #39 で revert され、 hover tooltip に役割を集約 (#39 →
	#42 でカーソル追従)。 visibleCols を絞って bar が viewport を必ず超える設定。
-->
<Story
	name="LongDurationBar"
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
				label: 'G社 6 ヶ月案件 (hover で tooltip がカーソルに追従)',
				color: '#4f46e5'
			}
		]
	}}
/>

<!--
	#34: resource rail を `resourceColWidth: 'auto'` で内容に fit させる story。
	min/max は default の 100 / 400 px。 短名は 100px floor、 長名は 400px cap で
	ellipsis。 fixed 200px の story と並べて比較できる。
-->
<Story
	name="AutoFitResourceRail (#34)"
	args={{
		zoom: ZOOMS.day,
		visibleCols: 14,
		resourceColWidth: 'auto',
		resources: [
			{ id: 'a', name: '田中' },
			{ id: 'b', name: '高橋太郎' },
			{ id: 'c', name: '高橋太郎 (営業1部 マネージャー)' },
			{ id: 'd', name: 'すごく長い名前で max を超える場合の挙動確認用エントリー' }
		],
		assignments: [
			{ id: 'aa1', resourceId: 'a', startDate: new Date(2026, 4, 4), endDate: new Date(2026, 4, 8), label: '短', color: '#4f46e5' },
			{ id: 'aa2', resourceId: 'b', startDate: new Date(2026, 4, 4), endDate: new Date(2026, 4, 10), label: '中', color: '#10b981' },
			{ id: 'aa3', resourceId: 'c', startDate: new Date(2026, 4, 4), endDate: new Date(2026, 4, 12), label: '長', color: '#f59e0b' },
			{ id: 'aa4', resourceId: 'd', startDate: new Date(2026, 4, 4), endDate: new Date(2026, 4, 14), label: '超長', color: '#ef4444' }
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

<!--
	#85: onActivate (bar click + keyboard Enter/Space) を Storybook actions に流す story。
	click と drag を threshold (4px) で見分けるため、 hover → mousedown → 即 mouseup で
	onActivate が発火し、 5px 以上 drag したら onMove に切り替わる。
-->
<Story
	name="ClickToActivate (#85)"
	args={{
		zoom: ZOOMS.day,
		visibleCols: 14
	}}
/>
