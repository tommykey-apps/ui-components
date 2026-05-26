<script lang="ts">
	import type { Assignment, BarLabels } from './types.js';

	type DragMode = 'idle' | 'move' | 'resize-start' | 'resize-end';

	type Props = {
		assignment: Assignment;
		x: number;
		y: number;
		width: number;
		height: number;
		minWidth?: number;
		draggable?: boolean;
		resizable?: boolean;
		ariaDescribedBy?: string;
		/**
		 * #33: a11y 文字列 (resize handle の aria-label) を consumer の locale で override。
		 * default は英語、 ResourceTimeline 経由で渡すのが通常 (consumer は `<ResourceTimeline labels={...}>`)。
		 * #59: 部分指定可 (内部で個別 fallback)。 bits-ui 流の primitive 設計に合わせる。
		 */
		labels?: BarLabels;
		onDragEnd?: (dx: number, dy: number) => void;
		onResizeEnd?: (edge: 'start' | 'end', dx: number) => void;
		/** キーボード矢印で move (units, rows)。Shift で 5 倍 */
		onKeyMove?: (units: number, rows: number) => void;
		/** Alt + 矢印で resize (start / end edge を ±1 unit) */
		onKeyResize?: (edge: 'start' | 'end', units: number) => void;
		/**
		 * #85: pointer click (drag に至らない) + keyboard (Enter / Space) で発火する unified
		 * activation callback。 React Aria の onPress と同思想で input agnostic 命名。
		 * consumer は detail dialog 起動などに使う。 resize handle 上の click では発火しない。
		 */
		onActivate?: (assignment: Assignment) => void;
	};

	let {
		assignment,
		x,
		y,
		width,
		height,
		minWidth = 16,
		draggable = true,
		resizable = true,
		ariaDescribedBy,
		labels,
		onDragEnd,
		onResizeEnd,
		onKeyMove,
		onKeyResize,
		onActivate
	}: Props = $props();

	// #85: click vs drag 判定の閾値 (px)。 dnd-kit / react-dnd 等の慣例で 3-5px。
	// 手ブレ・touch 微動を吸収しつつ意図的な drag は拾える値。
	const CLICK_THRESHOLD_PX = 4;

	// #59: partial 上書きを許す。 各 key で個別 fallback (default は英語)
	const resolvedLabels = $derived({
		resizeStart: labels?.resizeStart ?? 'Resize start',
		resizeEnd: labels?.resizeEnd ?? 'Resize end'
	});

	let mode = $state<DragMode>('idle');
	let startX = 0;
	let startY = 0;
	let dx = $state(0);
	let dy = $state(0);

	let liveLeft = $derived(x + (mode === 'move' || mode === 'resize-start' ? dx : 0));
	let liveTop = $derived(y + (mode === 'move' ? dy : 0));
	let liveWidth = $derived(
		mode === 'resize-start'
			? Math.max(width - dx, minWidth)
			: mode === 'resize-end'
				? Math.max(width + dx, minWidth)
				: width
	);

	function startDrag(e: PointerEvent, nextMode: Exclude<DragMode, 'idle'>) {
		if (e.button !== 0) return;
		mode = nextMode;
		startX = e.clientX;
		startY = e.clientY;
		dx = 0;
		dy = 0;
		try {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		} catch {
			// synthetic event 等で未対応
		}
	}

	function handlePointerDownBody(e: PointerEvent) {
		if (!draggable) return;
		startDrag(e, 'move');
	}

	function handlePointerDownLeft(e: PointerEvent) {
		if (!resizable) return;
		e.stopPropagation();
		startDrag(e, 'resize-start');
	}

	function handlePointerDownRight(e: PointerEvent) {
		if (!resizable) return;
		e.stopPropagation();
		startDrag(e, 'resize-end');
	}

	function handlePointerMove(e: PointerEvent) {
		if (mode === 'idle') return;
		dx = e.clientX - startX;
		dy = e.clientY - startY;
	}

	function handlePointerUp() {
		if (mode === 'idle') return;
		const finalDx = dx;
		const finalDy = dy;
		const endedMode = mode;
		mode = 'idle';
		dx = 0;
		dy = 0;

		if (endedMode === 'move') {
			// #85: drag threshold 以下なら click 扱いで onActivate を発火、 onDragEnd は呼ばない。
			// 4px の遊びで手ブレ / touch 微動を吸収。 resize handle は別 mode なのでここに来ない。
			if (Math.hypot(finalDx, finalDy) < CLICK_THRESHOLD_PX) {
				onActivate?.(assignment);
			} else {
				onDragEnd?.(finalDx, finalDy);
			}
		} else if (endedMode === 'resize-start') {
			onResizeEnd?.('start', finalDx);
		} else if (endedMode === 'resize-end') {
			onResizeEnd?.('end', finalDx);
		}
	}

	/**
	 * #72: keyboard modifier matrix (Bar body focus 時)。
	 *
	 * | Key         | (none)              | Alt                       | Shift               | Shift+Alt          |
	 * |-------------|---------------------|---------------------------|---------------------|--------------------|
	 * | ArrowLeft   | move -1 col         | resize start -1           | move -5 cols        | resize start -1    |
	 * | ArrowRight  | move +1 col         | resize end +1             | move +5 cols        | resize end +1      |
	 * | ArrowUp     | (no-op, native)     | (no-op, native)           | move -1 row         | move -1 row        |
	 * | ArrowDown   | (no-op, native)     | (no-op, native)           | move +1 row         | move +1 row        |
	 * | Enter / Space | onActivate        | onActivate                | onActivate          | onActivate         |
	 *
	 * 縦方向 (ArrowUp/Down) は Shift 必須 = 「明示的に行移動」 する場合のみ実行。
	 * Shift 無し時はブラウザ native (scroll 等) を残す。 Alt+ArrowUp/Down はあえて
	 * 「縦方向 resize」 を定義しない (概念的に存在しない) ため native default 通過、
	 * WAI-ARIA APG の「desktop convention に従う」 方針。
	 */
	function handleKeydown(e: KeyboardEvent) {
		const step = e.shiftKey ? 5 : 1;
		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				if (e.altKey) onKeyResize?.('start', -1);
				else onKeyMove?.(-step, 0);
				break;
			case 'ArrowRight':
				e.preventDefault();
				if (e.altKey) onKeyResize?.('end', 1);
				else onKeyMove?.(step, 0);
				break;
			case 'ArrowUp':
				if (e.shiftKey) {
					e.preventDefault();
					onKeyMove?.(0, -1);
				}
				break;
			case 'ArrowDown':
				if (e.shiftKey) {
					e.preventDefault();
					onKeyMove?.(0, 1);
				}
				break;
			// #85: WAI-ARIA Button pattern (Enter / Space で activation)。
			// pointer click と unified に onActivate を発火。 Space は page scroll を抑止。
			case 'Enter':
			case ' ':
				e.preventDefault();
				onActivate?.(assignment);
				break;
		}
	}

	// #81: focusable role="separator" な handle が自身に focus を受けた時の resize 操作。
	// body の handleKeydown は Alt 必須だが、 handle 上は edge が自明なので Alt 不要。
	function handleHandleKeydown(edge: 'start' | 'end') {
		return (e: KeyboardEvent) => {
			const step = e.shiftKey ? 5 : 1;
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				onKeyResize?.(edge, -step);
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				onKeyResize?.(edge, step);
			}
		};
	}
</script>

<!--
	#84: sticky label 採用 (#39 の再挑戦)。 業界実装 (DHTMLX `sticky:true`、 Ben Nadel の Angular Gantt) に
	倣い、 `.bar` から `overflow:hidden` を外して `.label` を `position:sticky; left:<rail width>` にした。
	#39 で「CSS spec 上不可」 と判断したのは誤りで、 `overflow:hidden` を親から外して label 側に
	max-width を移せば CSS only で実現可能 (Ben Nadel パターン)。 これに伴い従来の hover tooltip
	(bits-ui Tooltip + cursorAnchor / floating-ui virtual element) は完全廃止 — #42 / #60 の bug も
	本実装で吸収。
-->
<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<div
	role="button"
	tabindex={0}
	aria-label={assignment.label ?? assignment.id}
	aria-describedby={ariaDescribedBy}
	class="bar"
	class:dragging={mode === 'move'}
	class:resizing={mode === 'resize-start' || mode === 'resize-end'}
	style:--bar-left="{liveLeft}px"
	style:--bar-top="{liveTop}px"
	style:--bar-width="{liveWidth}px"
	style:--bar-height="{height}px"
	style:--bar-bg-override={assignment.color ?? null}
	onpointerdown={handlePointerDownBody}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onkeydown={handleKeydown}
>
	<span class="label">{assignment.label ?? ''}</span>

	{#if resizable}
		<!-- #81: WAI-ARIA 上 focusable splitter separator は valid だが、 Svelte linter は
		     separator を interactive role と認識しないため ignore directive で抑制 -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<!-- #63: handle の pointerdown で setPointerCapture を取れば pointermove/up/cancel
		     は capture 経由で親 bar の listener に届く。 handle に redundant listener 不要 -->
		<div
			class="handle handle-start"
			role="separator"
			tabindex={0}
			aria-orientation="vertical"
			aria-valuenow={0}
			aria-label={resolvedLabels.resizeStart}
			onpointerdown={handlePointerDownLeft}
			onkeydown={handleHandleKeydown('start')}
		></div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="handle handle-end"
			role="separator"
			tabindex={0}
			aria-orientation="vertical"
			aria-valuenow={100}
			aria-label={resolvedLabels.resizeEnd}
			onpointerdown={handlePointerDownRight}
			onkeydown={handleHandleKeydown('end')}
		></div>
	{/if}
</div>

<style>
	.bar {
		position: absolute;
		left: var(--bar-left);
		top: var(--bar-top);
		width: var(--bar-width);
		height: var(--bar-height);
		background: var(--bar-bg-override, var(--ui-bar-bg, #4f46e5));
		color: var(--ui-bar-fg, #ffffff);
		border-radius: var(--ui-bar-radius, 4px);
		padding: 0 8px;
		display: flex;
		align-items: center;
		box-shadow: var(--ui-bar-shadow, 0 1px 2px rgb(0 0 0 / 0.12));
		box-sizing: border-box;
		/* #84: sticky label を効かせるため親の clip 指定 (overflow) は付けない。 label 側 max-width で clip。 */
		user-select: none;
		font-family: var(--ui-font, system-ui, sans-serif);
		cursor: grab;
		transition: box-shadow 0.15s ease;
	}

	.bar.dragging,
	.bar.resizing {
		z-index: 10;
		box-shadow: var(--ui-bar-shadow-drag, 0 6px 16px rgb(0 0 0 / 0.22));
		transition: none;
	}

	.bar.dragging {
		cursor: grabbing;
	}

	/*
	 * #84: position: sticky で label を viewport 内に貼り付ける (Ben Nadel pattern)。
	 *  - left: rail 幅。 sticky の nearest scrolling ancestor は .timeline、 そこから
	 *    rail 右端の x 位置に貼り付ける (= rail の裏に潜らない)
	 *  - max-width: 100% で bar 幅まで (overflow:hidden を親から外したぶんを補償)
	 *  - bar の 8px padding 分 + handle 6px 分の余裕を残す (label が handle と被らない)
	 */
	.label {
		position: sticky;
		left: var(--ui-resource-col-width, 200px);
		/*
		 * #84: sticky shift には containing box (.bar) 内に余白が必要。 flex: 1 で
		 * label.width = bar.contentWidth にすると余白 0 で sticky shift できない。
		 * flex: 0 1 auto (intrinsic width) + max-width で bar 幅に clamp。
		 */
		flex: 0 1 auto;
		max-width: 100%;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		font-size: var(--ui-bar-font-size, 12px);
		font-weight: 500;
		/* sticky 化で handle 上に被っても pointer event を奪わないように */
		pointer-events: none;
	}

	.handle {
		position: absolute;
		top: 0;
		bottom: 0;
		width: var(--ui-handle-width, 6px);
		cursor: ew-resize;
		background: transparent;
		touch-action: none;
		/* sticky label に隠されないよう前面に */
		z-index: 1;
	}

	/* hit area 拡張 (#20、WCAG 2.5.8 AA: 24×24 最低 / 縦は AAA の 44 達成):
	   pseudo を pointer 判定領域として使う。visible な hairline は親 .handle のまま、
	   pseudo は完全透明だが pointer events を受けて parent の listener を発火させる。
	   - 縦: bar 高さ 32 + 上下 6 = 44 (AAA)
	   - 横: handle 6 + 左右 9 = 24 (AA)。narrow bar (zoom:day 1-day=64px) で両端 24+24=48 < 64 なので overlap しない。 */
	.handle::before {
		content: '';
		position: absolute;
		top: -6px;
		bottom: -6px;
		left: -9px;
		right: -9px;
	}

	.handle:hover {
		background: var(--ui-handle-hover, rgb(255 255 255 / 0.25));
	}

	.handle-start {
		left: 0;
	}

	.handle-end {
		right: 0;
	}
</style>
