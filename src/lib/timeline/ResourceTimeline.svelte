<script lang="ts">
	import { format } from 'date-fns';
	import { Tooltip } from 'bits-ui';
	import Bar from './Bar.svelte';
	import type { Assignment, HeaderTier, Resource, TimelineLabels, ZoomLevel } from './types.js';
	import {
		addUnits,
		allocateLanes,
		barRect,
		maxEndCol,
		startOfUnit,
		viewportColumns
	} from './projection.js';
	import { ZOOMS } from './zoom.js';
	import { resolveLabels } from './labels.js';
	import { computeRailWidth } from './rail-width.js';
	import { createCanvasMeasurer } from './measure-text.js';

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
		/**
		 * Resource 列 (左 sticky rail) の幅。
		 *   - `number` (px): 固定幅 (default 200)、 従来挙動 (#34 以前)
		 *   - `'auto'`: 内容に合わせて自動 fit。 `resourceColMinWidth` / `resourceColMaxWidth` で上下限制御。
		 * #34: 短名ばかりで余白多い / 長名で省略される問題への対処。
		 */
		resourceColWidth?: number | 'auto';
		/** \`resourceColWidth='auto'\` の最小幅 px (default 100) */
		resourceColMinWidth?: number;
		/** \`resourceColWidth='auto'\` の最大幅 px (default 400)、 超過分は ellipsis */
		resourceColMaxWidth?: number;
		visibleCols?: number;
		/** canvas 末端のスクロール余白(列数)。最遠 Assignment の endDate +α まで grid を描画する */
		bufferCols?: number;
		/**
		 * #33: a11y / aria-live で使う文字列の i18n override。 default は英語。
		 * consumer (例: resource-planner) の locale state を渡して翻訳済を流せる。
		 */
		labels?: TimelineLabels;
		onMove?: (assignment: Assignment) => void;
		onResize?: (assignment: Assignment) => void;
	};

	let {
		resources,
		assignments,
		viewportStart = $bindable(new Date()),
		zoom = ZOOMS.day,
		rowHeight = 40,
		barHeight = 32,
		laneGap = 4,
		resourceColWidth = 200,
		resourceColMinWidth = 100,
		resourceColMaxWidth = 400,
		visibleCols,
		bufferCols = 7,
		labels,
		onMove,
		onResize
	}: Props = $props();

	// i18n labels を merge して常に全 key 揃った state にする (#33)
	const L = $derived(resolveLabels(labels));

	// .timeline element ref(drag-to-pan で scrollLeft 制御)
	let timelineEl = $state<HTMLDivElement | undefined>();

	/**
	 * resourceColWidth='auto' のとき rail 幅を計算: 各 resource 名を Canvas
	 * \`measureText\` (advance + actualBoundingBox の max) で実測 → \`computeRailWidth\`
	 * で min/max clamp → CSS 変数 \`--ui-resource-col-width\` に流し込む。
	 *
	 * text → grid track 間の chrome (padding + border) は \`getComputedStyle\` で
	 * row / aside から実測し加算 (静的マジック数値だと CSS 変更時に乖離するため)。
	 * 詳細経緯は #43 参照。
	 */
	const RAIL_SAFETY_PX = 1;
	// 初期値はリテラル (Props default min に揃える) — $effect 内で即座に上書きされる
	let measuredRailWidth = $state(100);

	function readPx(value: string): number {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : 0;
	}

	$effect(() => {
		if (resourceColWidth !== 'auto') return;
		// reactive deps: resources / min / max
		const names = resources.map((r) => r.name);
		const min = resourceColMinWidth;
		const max = resourceColMaxWidth;

		function remeasure() {
			if (!timelineEl) return;
			const row = timelineEl.querySelector<HTMLElement>('.resource-row');
			const aside = timelineEl.querySelector<HTMLElement>('.resources');
			if (!row || !aside) return; // 初回 render 前

			// font: row の computed style から CSS \`font\` shorthand を構築 (canvas に流す)
			const rowCS = getComputedStyle(row);
			const font = `${rowCS.fontStyle} ${rowCS.fontVariant} ${rowCS.fontWeight} ${rowCS.fontSize} ${rowCS.fontFamily}`;

			// chrome: text → grid track の間に挟まる padding + border の総和
			// (row padding + aside border)。 マジック数値ではなく DOM から計算で robust に。
			const asideCS = getComputedStyle(aside);
			const chrome =
				readPx(rowCS.paddingLeft) +
				readPx(rowCS.paddingRight) +
				readPx(rowCS.borderLeftWidth) +
				readPx(rowCS.borderRightWidth) +
				readPx(asideCS.borderLeftWidth) +
				readPx(asideCS.borderRightWidth);

			const measure = createCanvasMeasurer(font);
			if (!measure) return; // SSR / non-DOM
			const widths = names.map((n) => measure(n));
			measuredRailWidth = computeRailWidth(widths, {
				min,
				max,
				padding: chrome + RAIL_SAFETY_PX
			});
		}

		remeasure();

		// font load 完了で metric が変わるので再測定 (modern browsers only)
		if (typeof document !== 'undefined' && document.fonts?.ready) {
			document.fonts.ready.then(remeasure);
		}
	});

	const resolvedRailWidth = $derived(
		resourceColWidth === 'auto' ? `${measuredRailWidth}px` : `${resourceColWidth}px`
	);

	// viewportStart / zoom が変わった時 scrollLeft を 0 にリセット(drag-pan 残留を消す)
	$effect(() => {
		void viewportStart;
		void zoom;
		if (timelineEl) timelineEl.scrollLeft = 0;
	});

	// drag-to-pan 状態
	const PAN_THRESHOLD = 5;
	let panStartX = 0;
	let panStartScrollLeft = 0;
	let panActive = $state(false);
	let panPointerId: number | null = null;

	function handleCanvasPointerDown(e: PointerEvent) {
		if (e.button !== 0 || !timelineEl) return;
		const target = e.target as HTMLElement;
		// Bar 上は除外(既存 Bar drag に委譲)
		if (target.closest('.bar')) return;
		panStartX = e.clientX;
		panStartScrollLeft = timelineEl.scrollLeft;
		panPointerId = e.pointerId;
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {
			// synthetic event 等で未対応の場合は無視
		}
	}

	function handleCanvasPointerMove(e: PointerEvent) {
		if (!timelineEl || panPointerId === null) return;
		const dx = e.clientX - panStartX;
		if (!panActive && Math.abs(dx) >= PAN_THRESHOLD) {
			panActive = true;
		}
		if (panActive) {
			timelineEl.scrollLeft = panStartScrollLeft - dx;
		}
	}

	function handleCanvasPointerUp() {
		panActive = false;
		panPointerId = null;
	}

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

	function groupHeaderCells(cells: Date[], tier: HeaderTier): HeaderGroup[] {
		const fn = tier.format ?? ((d: Date) => format(d, tier.fmt ?? ''));
		return cells.reduce<HeaderGroup[]>((acc, col, i) => {
			const value = fn(col);
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
			groups: groupHeaderCells(columns, tier)
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

<!-- #28: Bar の tooltip 用に Provider を 1 度だけ wrap (delayDuration を snappy に短縮)。
	consumer に Provider 提供を強要しない (library 内で self-contained)。 -->
<Tooltip.Provider delayDuration={200} skipDelayDuration={300}>
<div
	bind:this={timelineEl}
	class="timeline"
	style:--ui-row-height="{rowHeight}px"
	style:--ui-resource-col-width={resolvedRailWidth}
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
			<div
				class="resource-row"
				style:height="{row.height}px"
				title={row.resource.name}
			>{row.resource.name}</div>
		{/each}
	</aside>

	<div
		class="canvas"
		class:panning={panActive}
		role="region"
		aria-label={L.canvas.region}
		style:width="{canvasWidth}px"
		style:height="{canvasHeight}px"
		onpointerdown={handleCanvasPointerDown}
		onpointermove={handleCanvasPointerMove}
		onpointerup={handleCanvasPointerUp}
		onpointercancel={handleCanvasPointerUp}
	>
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
					labels={L.bar}
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
						statusMessage = L.status.move(fmtRange(updated));
						onMove?.(updated);
					}}
					onResizeEnd={(edge, dx) => {
						const colDelta = Math.round(dx / zoom.colWidth);
						if (colDelta === 0) return;
						if (edge === 'start') {
							const newStart = addUnits(layout.assignment.startDate, colDelta, zoom.unit);
							if (newStart >= layout.assignment.endDate) return;
							const updated = { ...layout.assignment, startDate: newStart };
							statusMessage = L.status.resizeStart(fmtRange(updated));
							onResize?.(updated);
						} else {
							const newEnd = addUnits(layout.assignment.endDate, colDelta, zoom.unit);
							if (newEnd <= layout.assignment.startDate) return;
							const updated = { ...layout.assignment, endDate: newEnd };
							statusMessage = L.status.resizeEnd(fmtRange(updated));
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
						statusMessage = L.status.keyMove(fmtRange(updated));
						onMove?.(updated);
					}}
					onKeyResize={(edge, units) => {
						if (edge === 'start') {
							const newStart = addUnits(layout.assignment.startDate, units, zoom.unit);
							if (newStart >= layout.assignment.endDate) return;
							const updated = { ...layout.assignment, startDate: newStart };
							statusMessage = L.status.keyResizeStart(fmtRange(updated));
							onResize?.(updated);
						} else {
							const newEnd = addUnits(layout.assignment.endDate, units, zoom.unit);
							if (newEnd <= layout.assignment.startDate) return;
							const updated = { ...layout.assignment, endDate: newEnd };
							statusMessage = L.status.keyResizeEnd(fmtRange(updated));
							onResize?.(updated);
						}
					}}
				/>
			{/each}
	</div>

	<div id={statusId} role="status" aria-live="polite" class="sr-only">{statusMessage}</div>
</div>
</Tooltip.Provider>

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
		/* resource 列の幅は CSS 変数 \`--ui-resource-col-width\` で固定 (auto-fit 時も JS が実測値を代入)。
		   sticky 子と track sizing の両立が不可なので minmax/fit-content は使わない (詳細 #43)。 */
		grid-template-columns: var(--ui-resource-col-width, 200px) auto;
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
		/*
		 * 列幅は grid-template-columns の 1 列目 (\`var(--ui-resource-col-width, 200px)\`) を継承する。
		 * #43 (v0.9.x) で auto-fit は JS 実測 + CSS 変数注入に移行 (track sizing 非依存)、
		 * sticky positioning とは独立に動作する。
		 */
		min-width: 0;
		flex-shrink: 0;
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
		/* 長い名前は省略 + `title` 属性 (上記マークアップ) で full text を hover 表示。 */
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}


	.canvas {
		grid-row: 2;
		grid-column: 2;
		position: relative;
		/* drag/resize 中の Bar (z-index: 10) が sticky な .resources / .headers (z-index: 2/3) を
		   覆わないよう、canvas 自身で stacking context を切る (#22)。bar の z-index は canvas 内部
		   だけで評価され、canvas 全体は親 grid 内で auto = 0 のまま sticky 領域より下に保たれる。 */
		isolation: isolate;
		cursor: grab;
		user-select: none;
		touch-action: pan-y;
	}

	.canvas.panning {
		cursor: grabbing;
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
