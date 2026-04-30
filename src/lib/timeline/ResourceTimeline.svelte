<script lang="ts">
	import { format } from 'date-fns';
	import Bar from './Bar.svelte';
	import type { Assignment, Resource, ZoomLevel } from './types.js';
	import { addUnits, barRect, startOfUnit, viewportColumns } from './projection.js';
	import { ZOOMS } from './zoom.js';

	type Props = {
		resources: Resource[];
		assignments: Assignment[];
		viewportStart?: Date;
		zoom?: ZoomLevel;
		rowHeight?: number;
		resourceColWidth?: number;
		visibleCols?: number;
		onMove?: (assignment: Assignment) => void;
		onResize?: (assignment: Assignment) => void;
	};

	let {
		resources,
		assignments,
		viewportStart = new Date(),
		zoom = ZOOMS.day,
		rowHeight = 40,
		resourceColWidth = 200,
		visibleCols,
		onMove,
		onResize
	}: Props = $props();

	let cols = $derived(visibleCols ?? zoom.visibleCols);
	let origin = $derived(startOfUnit(viewportStart, zoom.unit));
	let columns = $derived(viewportColumns(origin, cols, zoom.unit));
	let canvasWidth = $derived(cols * zoom.colWidth);
	let canvasHeight = $derived(resources.length * rowHeight);

	type Layout = {
		assignment: Assignment;
		x: number;
		y: number;
		width: number;
	};

	let layouts: Layout[] = $derived(
		assignments
			.map((a) => {
				const rowIndex = resources.findIndex((r) => r.id === a.resourceId);
				if (rowIndex === -1) return null;
				const rect = barRect(a, origin, zoom);
				return {
					assignment: a,
					x: rect.x,
					y: rowIndex * rowHeight + 2,
					width: rect.width
				};
			})
			.filter((l): l is Layout => l !== null)
	);
</script>

<div
	class="timeline"
	style:--ui-row-height="{rowHeight}px"
	style:--ui-resource-col-width="{resourceColWidth}px"
	style:--ui-canvas-width="{canvasWidth}px"
	style:--ui-canvas-height="{canvasHeight}px"
	style:--ui-col-width="{zoom.colWidth}px"
>
	<div class="corner"></div>

	<div class="headers" style:width="{canvasWidth}px">
		{#each zoom.headers as tier, tierIndex (tierIndex)}
			<div class="header-row">
				{#each columns as col, ci (ci)}
					<div class="header-cell" style:width="{zoom.colWidth}px">
						{format(col, tier.fmt)}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<aside class="resources">
		{#each resources as resource (resource.id)}
			<div class="resource-row">{resource.name}</div>
		{/each}
	</aside>

	<div class="canvas-wrap">
		<div class="canvas" style:width="{canvasWidth}px" style:height="{canvasHeight}px">
			{#each resources as _, rowIndex (rowIndex)}
				<div class="grid-row" style:top="{rowIndex * rowHeight}px">
					{#each columns as _col, ci (ci)}
						<div class="grid-cell" style:left="{ci * zoom.colWidth}px" style:width="{zoom.colWidth}px"></div>
					{/each}
				</div>
			{/each}

			{#each layouts as layout (layout.assignment.id)}
				<Bar
					assignment={layout.assignment}
					x={layout.x}
					y={layout.y}
					width={layout.width}
					height={rowHeight - 4}
					minWidth={zoom.colWidth}
					onDragEnd={(dx, dy) => {
						const colDelta = Math.round(dx / zoom.colWidth);
						const rowDelta = Math.round(dy / rowHeight);
						const currentRow = resources.findIndex(
							(r) => r.id === layout.assignment.resourceId
						);
						const newRow = Math.max(0, Math.min(resources.length - 1, currentRow + rowDelta));
						const newResourceId = resources[newRow].id;
						if (colDelta === 0 && newResourceId === layout.assignment.resourceId) return;
						onMove?.({
							...layout.assignment,
							resourceId: newResourceId,
							startDate: addUnits(layout.assignment.startDate, colDelta, zoom.unit),
							endDate: addUnits(layout.assignment.endDate, colDelta, zoom.unit)
						});
					}}
					onResizeEnd={(edge, dx) => {
						const colDelta = Math.round(dx / zoom.colWidth);
						if (colDelta === 0) return;
						if (edge === 'start') {
							const newStart = addUnits(layout.assignment.startDate, colDelta, zoom.unit);
							if (newStart >= layout.assignment.endDate) return;
							onResize?.({ ...layout.assignment, startDate: newStart });
						} else {
							const newEnd = addUnits(layout.assignment.endDate, colDelta, zoom.unit);
							if (newEnd <= layout.assignment.startDate) return;
							onResize?.({ ...layout.assignment, endDate: newEnd });
						}
					}}
				/>
			{/each}
		</div>
	</div>
</div>

<style>
	.timeline {
		display: grid;
		grid-template-columns: var(--ui-resource-col-width) 1fr;
		grid-template-rows: auto 1fr;
		font-family: var(--ui-font, system-ui, sans-serif);
		color: var(--ui-fg, #1a1a1a);
		background: var(--ui-bg, #ffffff);
		border: 1px solid var(--ui-border, #e5e5e5);
		border-radius: var(--ui-radius, 6px);
		overflow: hidden;
	}

	.corner {
		grid-row: 1;
		grid-column: 1;
		border-right: 1px solid var(--ui-border, #e5e5e5);
		border-bottom: 1px solid var(--ui-border, #e5e5e5);
		background: var(--ui-header-bg, #f7f7f8);
	}

	.headers {
		grid-row: 1;
		grid-column: 2;
		background: var(--ui-header-bg, #f7f7f8);
		border-bottom: 1px solid var(--ui-border, #e5e5e5);
	}

	.header-row {
		display: flex;
		min-height: 28px;
	}
	.header-row + .header-row {
		border-top: 1px solid var(--ui-border, #e5e5e5);
	}

	.header-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--ui-header-font-size, 12px);
		font-weight: 500;
		color: var(--ui-header-fg, #555);
		border-right: 1px solid var(--ui-border, #e5e5e5);
		box-sizing: border-box;
		flex-shrink: 0;
	}

	.resources {
		grid-row: 2;
		grid-column: 1;
		display: flex;
		flex-direction: column;
		border-right: 1px solid var(--ui-border, #e5e5e5);
		background: var(--ui-resource-bg, #fafafa);
	}

	.resource-row {
		height: var(--ui-row-height);
		display: flex;
		align-items: center;
		padding: 0 12px;
		font-size: var(--ui-row-font-size, 13px);
		border-bottom: 1px solid var(--ui-border, #e5e5e5);
		box-sizing: border-box;
	}

	.canvas-wrap {
		grid-row: 2;
		grid-column: 2;
		overflow-x: auto;
		overflow-y: hidden;
	}

	.canvas {
		position: relative;
	}

	.grid-row {
		position: absolute;
		left: 0;
		right: 0;
		height: var(--ui-row-height);
		border-bottom: 1px solid var(--ui-border, #eeeeee);
		box-sizing: border-box;
	}

	.grid-cell {
		position: absolute;
		top: 0;
		bottom: 0;
		border-right: 1px solid var(--ui-grid, #f2f2f3);
		box-sizing: border-box;
	}
</style>
