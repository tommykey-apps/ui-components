<script lang="ts">
	import { format } from 'date-fns';
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
	import { createPointerDrag } from './pointer-drag.js';

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
		/**
		 * #68: edge ('start' | 'end') を optional positional argument で受け取る。
		 * 旧 consumer `(updated) => ...` は edge を無視するので backward-compatible。
		 */
		onResize?: (assignment: Assignment, edge?: 'start' | 'end') => void;
		/**
		 * #85: bar の pointer click + keyboard (Enter / Space) activation を unified に通知。
		 * consumer 側 detail dialog 起動などに使う。
		 */
		onActivate?: (assignment: Assignment) => void;
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
		onResize,
		onActivate
	}: Props = $props();

	// SSR-stable な id (Svelte 5 公式)。 #56: ランダム生成だと hydration mismatch
	const uid = $props.id();
	const statusId = `${uid}-status`;

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

		// #57: document.fonts.ready.then() は cancel 不可。 unmount / 再 run 後に resolve
		// した callback が $state write や DOM 参照を行うのを防ぐため teardown で flag を立てる
		let cancelled = false;

		function remeasure() {
			if (cancelled || !timelineEl) return;
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

		return () => {
			cancelled = true;
		};
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

	// drag-to-pan 状態 (#67: lifecycle は pointer-drag helper、 panActive のみ template 反映用)
	const PAN_THRESHOLD = 5;
	let panStartScrollLeft = 0;
	let panActive = $state(false);

	const canvasPan = createPointerDrag({
		onStart(e) {
			if (!timelineEl) return false;
			const target = e.target as HTMLElement;
			// Bar 上は除外 (Bar の drag に委譲)
			if (target.closest('.bar')) return false;
			panStartScrollLeft = timelineEl.scrollLeft;
		},
		onMove(dx) {
			if (!timelineEl) return;
			if (!panActive && Math.abs(dx) >= PAN_THRESHOLD) {
				panActive = true;
			}
			if (panActive) {
				timelineEl.scrollLeft = panStartScrollLeft - dx;
			}
		},
		onEnd() {
			panActive = false;
		}
	});

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
			// #61: col 単位で重複判定 (year/month zoom で同 col に詰まる bar を別 lane に積む)
			const { lanes, laneCount } = allocateLanes(rAssignments, {
				origin,
				unit: zoom.unit
			});
			const used = Math.max(laneCount, 1);
			const height = Math.max(rowHeight, used * (barHeight + laneGap) + laneGap);
			result.push({ resource: r, rowTop: top, height, lanes, laneCount });
			top += height;
		}
		return result;
	});

	let canvasHeight = $derived(rowLayouts.reduce((sum, r) => sum + r.height, 0));

	let statusMessage = $state('');

	function fmtRange(a: Assignment): string {
		// #64: date-fns format に統一 (CLAUDE.md `date-fns v4` 規約)
		const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
		const resource = resources.find((r) => r.id === a.resourceId);
		const name = resource?.name ?? a.resourceId;
		return `${name}: ${a.label ?? a.id} ${fmt(a.startDate)} 〜 ${fmt(a.endDate)}`;
	}

	/**
	 * #62: Bar の 4 callback (drag / resize / keyMove / keyResize) で重複していた
	 * Assignment 構築 + bounds check を helper に集約。 移動軸 (move) と resize 軸を
	 * 分けることで各 helper の関心事が明確 (AHA 原則 = 過剰抽象化を避ける部分集約)。
	 *
	 * 戻り値 `null` は no-op (delta が 0 + 行変化なし、 或いは resize で start/end が
	 * 反転するケース)。 caller 側で early return。
	 */
	function buildMovedAssignment(
		base: Assignment,
		opts: { colDelta: number; newResourceId: string }
	): Assignment | null {
		if (opts.colDelta === 0 && opts.newResourceId === base.resourceId) return null;
		return {
			...base,
			resourceId: opts.newResourceId,
			startDate: addUnits(base.startDate, opts.colDelta, zoom.unit),
			endDate: addUnits(base.endDate, opts.colDelta, zoom.unit)
		};
	}

	function buildResizedAssignment(
		base: Assignment,
		edge: 'start' | 'end',
		colDelta: number
	): Assignment | null {
		if (colDelta === 0) return null;
		if (edge === 'start') {
			const newStart = addUnits(base.startDate, colDelta, zoom.unit);
			if (newStart >= base.endDate) return null;
			return { ...base, startDate: newStart };
		}
		const newEnd = addUnits(base.endDate, colDelta, zoom.unit);
		if (newEnd <= base.startDate) return null;
		return { ...base, endDate: newEnd };
	}

	type HeaderGroup = { value: string; span: number; startIdx: number };

	function groupHeaderCells(cells: Date[], tier: HeaderTier): HeaderGroup[] {
		// #74: tier.fmt は string | ((Date) => string) の union (旧 fmt / format 2 field を統合)
		const fn = typeof tier.fmt === 'function' ? tier.fmt : (d: Date) => format(d, tier.fmt as string);
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

<!-- #84: Bar の hover tooltip は廃止し sticky label に置換、 Tooltip.Provider 不要に -->
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
		onpointerdown={canvasPan.onPointerDown}
		onpointermove={canvasPan.onPointerMove}
		onpointerup={canvasPan.onPointerUp}
		onpointercancel={canvasPan.onPointerUp}
	>
		{#each rowLayouts as row (row.resource.id)}
			<div class="grid-row" style:top="{row.rowTop}px" style:height="{row.height}px">
				<!-- #75: count しか必要としないので columns Date[] を消費せず canvasCols (number) で iterate -->
				{#each { length: canvasCols } as _, ci (ci)}
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
						// 行跨ぎ判定: y + dy がどの rowLayout の範囲に入るかで決める (等高 row 前提の Math.round は不可)
						const targetY = layout.y + dy;
						const newRow = rowLayouts.find(
							(r) => targetY >= r.rowTop && targetY < r.rowTop + r.height
						);
						const newResourceId = newRow?.resource.id ?? layout.assignment.resourceId;
						const updated = buildMovedAssignment(layout.assignment, { colDelta, newResourceId });
						if (!updated) return;
						statusMessage = L.status.move(fmtRange(updated));
						onMove?.(updated);
					}}
					onResizeEnd={(edge, dx) => {
						const colDelta = Math.round(dx / zoom.colWidth);
						const updated = buildResizedAssignment(layout.assignment, edge, colDelta);
						if (!updated) return;
						statusMessage = (edge === 'start' ? L.status.resizeStart : L.status.resizeEnd)(
							fmtRange(updated)
						);
						// #68: edge を 2nd 引数で transparent に渡す
						onResize?.(updated, edge);
					}}
					onKeyMove={(units, rows) => {
						const currentRowIndex = resources.findIndex(
							(r) => r.id === layout.assignment.resourceId
						);
						const newRowIndex = Math.max(
							0,
							Math.min(resources.length - 1, currentRowIndex + rows)
						);
						// #73 noUncheckedIndexedAccess: 実用上 resources は非空 (Bar 描画前提) だが静的解析 guard
						const newResource = resources[newRowIndex];
						if (!newResource) return;
						const updated = buildMovedAssignment(layout.assignment, {
							colDelta: units,
							newResourceId: newResource.id
						});
						if (!updated) return;
						statusMessage = L.status.keyMove(fmtRange(updated));
						onMove?.(updated);
					}}
					onKeyResize={(edge, units) => {
						const updated = buildResizedAssignment(layout.assignment, edge, units);
						if (!updated) return;
						statusMessage = (edge === 'start' ? L.status.keyResizeStart : L.status.keyResizeEnd)(
							fmtRange(updated)
						);
						onResize?.(updated, edge);
					}}
					onActivate={onActivate}
				/>
			{/each}
	</div>

	<!-- #70: aria-atomic="true" で SR が連続更新の中間値を skip せず最終値を atomic に announce -->
	<div id={statusId} role="status" aria-live="polite" aria-atomic="true" class="sr-only">{statusMessage}</div>
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
