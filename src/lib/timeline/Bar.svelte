<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import { createCursorAnchor, type VirtualAnchor } from './cursor-anchor.js';
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
		 * default は英語、 ResourceTimeline 経由で渡すのが通常 (consumer は \`<ResourceTimeline labels={...}>\`)。
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

	/**
	 * #42: hover tooltip をカーソルに追従させる。
	 * bits-ui default は trigger 要素 (bar) の中心が anchor になるが、 wide bar (例 6 ヶ月案件)
	 * では bar の center が viewport 外/右端になり tooltip が画面端に貼りつく。
	 *
	 * floating-ui の virtual element pattern で pointermove ごとに anchor を作り直す。
	 * Tooltip.Content の \`align="start" sideOffset / alignOffset\` で「カーソル右上」配置。
	 */
	let cursorAnchor = $state<VirtualAnchor | null>(null);

	function handlePointerEnter(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		cursorAnchor = createCursorAnchor(e.clientX, e.clientY);
	}

	// #60: pointerleave で cursorAnchor を null に戻すと bits-ui が trigger 要素 (bar) を
	// anchor に fallback して、 close transition 中の 1 RAF で tooltip が画面左に飛んで描画
	// される。 anchor は最後の cursor 位置で保持しておき unmount で GC、 次回 pointerenter で
	// createCursorAnchor が新 instance を作るので stale 参照問題なし。

	let liveLeft = $derived(
		x + (mode === 'move' || mode === 'resize-start' ? dx : 0)
	);
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
		// #42: drag 中でも hover 中でも cursor 座標を tooltip anchor として更新する。
		// drag 中は tooltip を隠す挙動でも OK (bits-ui 自動)。 anchor 更新自体は安全。
		if (e.pointerType === 'mouse' && cursorAnchor) {
			cursorAnchor = createCursorAnchor(e.clientX, e.clientY);
		}
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
	hover tooltip は常時 enabled (#39)、 Portal で Gantt overflow:hidden を回避 (#28)。
	cursor follow は customAnchor + virtual element (#42)、 公式 mergeProps で hover 検出を温存 (#50)。
-->
<Tooltip.Root>
	<!--
		#42 hotfix (#48): bits-ui 公式 pattern に従い、 自前のイベントハンドラは
		\`Tooltip.Trigger\` component に直接渡す。 bits-ui の \`mergeProps\` が内部 hover
		検出ハンドラと自動合成して child snippet の \`props\` に流してくれる。
		https://next.bits-ui.com/docs/child-snippet
	-->
	<Tooltip.Trigger
		role="button"
		tabindex={0}
		aria-label={assignment.label ?? assignment.id}
		aria-describedby={ariaDescribedBy}
		onpointerdown={handlePointerDownBody}
		onpointerenter={handlePointerEnter}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		onkeydown={handleKeydown}
	>
		{#snippet child({ props })}
			<div
				{...props}
				class="bar"
				class:dragging={mode === 'move'}
				class:resizing={mode === 'resize-start' || mode === 'resize-end'}
				style:--bar-left="{liveLeft}px"
				style:--bar-top="{liveTop}px"
				style:--bar-width="{liveWidth}px"
				style:--bar-height="{height}px"
				style:--bar-bg-override={assignment.color ?? null}
			>
				<span class="label">{assignment.label ?? ''}</span>

				{#if resizable}
					<!-- #81: WAI-ARIA 上 focusable splitter separator は valid だが、 Svelte linter は
					     separator を interactive role と認識しないため ignore directive で抑制 -->
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div
						class="handle handle-start"
						role="separator"
						tabindex={0}
						aria-orientation="vertical"
						aria-valuenow={0}
						aria-label={resolvedLabels.resizeStart}
						onpointerdown={handlePointerDownLeft}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
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
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
						onkeydown={handleHandleKeydown('end')}
					></div>
				{/if}
			</div>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<!--
			#42: customAnchor で virtual element (cursor 座標) を渡し、 floating-ui に
			「bar 中心」ではなく「カーソル位置」を anchor として扱わせる。
			- side="top" align="start" + sideOffset / alignOffset で「カーソル右上」配置
			- cursorAnchor が null (keyboard focus / touch 等) のときは未指定 = bits-ui default
			  (trigger 要素 anchor) に fallback
			- flip / shift は floating-ui middleware に任せる (viewport 端で自動補正)
		-->
		<Tooltip.Content
			class="ui-bar-tooltip"
			side="top"
			align="start"
			sideOffset={12}
			alignOffset={12}
			customAnchor={cursorAnchor}
		>
			{assignment.label ?? ''}
			<Tooltip.Arrow class="ui-bar-tooltip-arrow" />
		</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>

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
		overflow: hidden;
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

	/* label は通常 inline (ellipsis 切れ)。 long bar の label 視認は hover tooltip (#39) で代替。
	   sticky にしない理由は #32 / #39 参照。 */
	.label {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		font-size: var(--ui-bar-font-size, 12px);
		font-weight: 500;
		flex: 1;
	}

	.handle {
		position: absolute;
		top: 0;
		bottom: 0;
		width: var(--ui-handle-width, 6px);
		cursor: ew-resize;
		background: transparent;
		touch-action: none;
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

	/* #28: Tooltip.Content / Tooltip.Arrow は Portal で document.body 配下に mount される。
	   scoped style では届かないので :global() で書く。テーマは ui-bar-bg / ui-bar-fg と一貫させる。 */
	:global(.ui-bar-tooltip) {
		background: var(--ui-bar-bg, #1a1a1a);
		color: var(--ui-bar-fg, #ffffff);
		padding: 6px 10px;
		border-radius: var(--ui-bar-radius, 4px);
		font-size: var(--ui-bar-font-size, 12px);
		font-family: var(--ui-font, system-ui, sans-serif);
		box-shadow: var(--ui-bar-shadow, 0 1px 2px rgb(0 0 0 / 0.12));
		max-width: 320px;
		z-index: 1000;
	}

	:global(.ui-bar-tooltip-arrow) {
		fill: var(--ui-bar-bg, #1a1a1a);
	}
</style>
