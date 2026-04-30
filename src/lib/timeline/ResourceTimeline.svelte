<script lang="ts">
	import { format } from 'date-fns';
	import Bar from './Bar.svelte';
	import type { Assignment, Resource, ZoomLevel } from './types.js';
	import {
		addUnits,
		allocateLanes,
		barRect,
		maxEndCol,
		startOfUnit,
		viewportColumns
	} from './projection.js';
	import { ZOOMS } from './zoom.js';

	type Props = {
		resources: Resource[];
		assignments: Assignment[];
		viewportStart?: Date;
		zoom?: ZoomLevel;
		/** 単一 lane 行の最低高さ(px)。lane が増えると伸びる */
		rowHeight?: number;
		/** 各バーの実高さ(px) */
		barHeight?: number;
		/** lane 間の縦 gap(px、上下ぶん) */
		laneGap?: number;
		resourceColWidth?: number;
		visibleCols?: number;
		/** canvas 末端のスクロール余白(列数)。最遠 Assignment の endDate +α まで grid を描画する */
		bufferCols?: number;
		onMove?: (assignment: Assignment) => void;
		onResize?: (assignment: Assignment) => void;
	};

	let {
		resources,
		assignments,
		viewportStart = new Date(),
		zoom = ZOOMS.day,
		rowHeight = 40,
		barHeight = 32,
		laneGap = 4,
		resourceColWidth = 200,
		visibleCols,
		bufferCols = 7,
		onMove,
		onResize
	}: Props = $props();

	let visibleColsResolved = $derived(visibleCols ?? zoom.visibleCols);
	let origin = $derived(startOfUnit(viewportStart, zoom.unit));
	// canvas 末端を assignments の最遠 endDate + buffer まで拡張(横スクロール時に grid が途切れないように)
	let canvasCols = $derived(
		Math.max(visibleColsResolved, maxEndCol(assignments, origin, zoom.unit) + bufferCols)
	);
	let columns = $derived(viewportColumns(origin, canvasCols, zoom.unit));
	let canvasWidth = $derived(canvasCols * zoom.colWidth);

	type RowLayout = {
		resource: Resource;
		rowTop: number;
		height: number;
		lanes: Map<string, number>;
		laneCount: number;
	};

	let rowLayouts = $derived.by(() => {
		let top = 0;
		const result: RowLayout[] = [];
		for (const r of resources) {
			const rAssignments = assignments.filter((a) => a.resourceId === r.id);
			const { lanes, laneCount } = allocateLanes(rAssignments);
			const used = Math.max(laneCount, 1);
			const height = Math.max(rowHeight, used * (barHeight + laneGap) + laneGap);
			result.push({ resource: r, rowTop: top, height, lanes, laneCount });
			top += height;
		}
		return result;
	});

	let canvasHeight = $derived(rowLayouts.reduce((sum, r) => sum + r.height, 0));

	let statusMessage = $state('');
	const statusId = `tt-status-${Math.random().toString(36).slice(2, 9)}`;

	function fmtRange(a: Assignment): string {
		const fmt = (d: Date) =>
			`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		const resource = resources.find((r) => r.id === a.resourceId);
		const name = resource?.name ?? a.resourceId;
		return `${name}: ${a.label ?? a.id} ${fmt(a.startDate)} 〜 ${fmt(a.endDate)}`;
	}

	type HeaderGroup = { value: string; span: number; startIdx: number };

	function groupHeaderCells(cells: Date[], fmt: string): HeaderGroup[] {
		return cells.reduce<HeaderGroup[]>((acc, col, i) => {
			const value = format(col, fmt);
			const last = acc[acc.length - 1];
			if (last && last.value === value) {
				last.span += 1;
			} else {
				acc.push({ value, span: 1, startIdx: i });
			}
			return acc;
		}, []);
	}

	let headerTiers = $derived(
		zoom.headers.map((tier) => ({
			tier,
			groups: groupHeaderCells(columns, tier.fmt)
		}))
	);

	type Layout = {
		assignment: Assignment;
		x: number;
		y: number;
		width: number;
		height: number;
	};

	let layouts: Layout[] = $derived(
		assignments
			.map((a) => {
				const row = rowLayouts.find((r) => r.resource.id === a.resourceId);
				if (!row) return null;
				const laneIndex = row.lanes.get(a.id) ?? 0;
				const rect = barRect(a, origin, zoom);
				return {
					assignment: a,
					x: rect.x,
					y: row.rowTop + laneGap + laneIndex * (barHeight + laneGap),
					width: rect.width,
					height: barHeight
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
		{#each headerTiers as tier, tierIndex (tierIndex)}
			<div class="header-row">
				{#each tier.groups as cell (cell.startIdx)}
					<div class="header-cell" style:width="{cell.span * zoom.colWidth}px">
						{cell.value}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<aside class="resources" style:height="{canvasHeight}px">
		{#each rowLayouts as row (row.resource.id)}
			<div class="resource-row" style:height="{row.height}px">{row.resource.name}</div>
		{/each}
	</aside>

	<div class="canvas" style:width="{canvasWidth}px" style:height="{canvasHeight}px">
		{#each rowLayouts as row (row.resource.id)}
			<div class="grid-row" style:top="{row.rowTop}px" style:height="{row.height}px">
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
					height={layout.height}
					minWidth={zoom.colWidth}
					ariaDescribedBy={statusId}
					onDragEnd={(dx, dy) => {
						const colDelta = Math.round(dx / zoom.colWidth);
						// 行跨ぎ判定: y + dy がどの rowLayout の範囲に入るかで決める(等高 row 前提の Math.round は不可)
						const targetY = layout.y + dy;
						const newRow = rowLayouts.find(
							(r) => targetY >= r.rowTop && targetY < r.rowTop + r.height
						);
						const newResourceId = newRow?.resource.id ?? layout.assignment.resourceId;
						if (colDelta === 0 && newResourceId === layout.assignment.resourceId) return;
						const updated: Assignment = {
							...layout.assignment,
							resourceId: newResourceId,
							startDate: addUnits(layout.assignment.startDate, colDelta, zoom.unit),
							endDate: addUnits(layout.assignment.endDate, colDelta, zoom.unit)
						};
						statusMessage = `移動 ${fmtRange(updated)}`;
						onMove?.(updated);
					}}
					onResizeEnd={(edge, dx) => {
						const colDelta = Math.round(dx / zoom.colWidth);
						if (colDelta === 0) return;
						if (edge === 'start') {
							const newStart = addUnits(layout.assignment.startDate, colDelta, zoom.unit);
							if (newStart >= layout.assignment.endDate) return;
							const updated = { ...layout.assignment, startDate: newStart };
							statusMessage = `開始日変更 ${fmtRange(updated)}`;
							onResize?.(updated);
						} else {
							const newEnd = addUnits(layout.assignment.endDate, colDelta, zoom.unit);
							if (newEnd <= layout.assignment.startDate) return;
							const updated = { ...layout.assignment, endDate: newEnd };
							statusMessage = `終了日変更 ${fmtRange(updated)}`;
							onResize?.(updated);
						}
					}}
					onKeyMove={(units, rows) => {
						const currentRowIndex = resources.findIndex(
							(r) => r.id === layout.assignment.resourceId
						);
						const newRowIndex = Math.max(
							0,
							Math.min(resources.length - 1, currentRowIndex + rows)
						);
						const newResourceId = resources[newRowIndex].id;
						if (units === 0 && newResourceId === layout.assignment.resourceId) return;
						const updated: Assignment = {
							...layout.assignment,
							resourceId: newResourceId,
							startDate: addUnits(layout.assignment.startDate, units, zoom.unit),
							endDate: addUnits(layout.assignment.endDate, units, zoom.unit)
						};
						statusMessage = `キー移動 ${fmtRange(updated)}`;
						onMove?.(updated);
					}}
					onKeyResize={(edge, units) => {
						if (edge === 'start') {
							const newStart = addUnits(layout.assignment.startDate, units, zoom.unit);
							if (newStart >= layout.assignment.endDate) return;
							const updated = { ...layout.assignment, startDate: newStart };
							statusMessage = `キー開始日変更 ${fmtRange(updated)}`;
							onResize?.(updated);
						} else {
							const newEnd = addUnits(layout.assignment.endDate, units, zoom.unit);
							if (newEnd <= layout.assignment.startDate) return;
							const updated = { ...layout.assignment, endDate: newEnd };
							statusMessage = `キー終了日変更 ${fmtRange(updated)}`;
							onResize?.(updated);
						}
					}}
				/>
			{/each}
	</div>

	<div id={statusId} role="status" aria-live="polite" class="sr-only">{statusMessage}</div>
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
	.timeline {
		display: grid;
		grid-template-columns: var(--ui-resource-col-width) auto;
		grid-template-rows: auto auto;
		font-family: var(--ui-font, system-ui, sans-serif);
		color: var(--ui-fg, #1a1a1a);
		background: var(--ui-bg, #ffffff);
		border: 1px solid var(--ui-border, #e5e5e5);
		border-radius: var(--ui-radius, 6px);
		overflow: auto;
		max-height: 100%;
		/* iOS Safari momentum scroll での sticky 安定化 */
		-webkit-overflow-scrolling: touch;
	}

	.corner {
		grid-row: 1;
		grid-column: 1;
		position: sticky;
		top: 0;
		left: 0;
		z-index: 3;
		border-right: 1px solid var(--ui-border, #e5e5e5);
		border-bottom: 1px solid var(--ui-border, #e5e5e5);
		background: var(--ui-header-bg, #f7f7f8);
	}

	.headers {
		grid-row: 1;
		grid-column: 2;
		position: sticky;
		top: 0;
		z-index: 2;
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
		position: sticky;
		left: 0;
		z-index: 2;
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

	.canvas {
		grid-row: 2;
		grid-column: 2;
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
