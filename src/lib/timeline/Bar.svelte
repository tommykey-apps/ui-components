<script lang="ts">
	import { tick } from 'svelte';
	import { Tooltip } from 'bits-ui';
	import { isTruncated } from './truncation.js';
	import type { Assignment } from './types.js';

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
		onDragEnd?: (dx: number, dy: number) => void;
		onResizeEnd?: (edge: 'start' | 'end', dx: number) => void;
		/** キーボード矢印で move (units, rows)。Shift で 5 倍 */
		onKeyMove?: (units: number, rows: number) => void;
		/** Alt + 矢印で resize (start / end edge を ±1 unit) */
		onKeyResize?: (edge: 'start' | 'end', units: number) => void;
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
		onDragEnd,
		onResizeEnd,
		onKeyMove,
		onKeyResize
	}: Props = $props();

	let mode = $state<DragMode>('idle');
	let startX = 0;
	let startY = 0;
	let dx = $state(0);
	let dy = $state(0);

	// hover tooltip 表示制御 (#23)。label が ellipsis で切れている時だけ title 属性を出す。
	let labelEl = $state<HTMLSpanElement | undefined>();
	let labelTruncated = $state(false);

	async function measureTruncation(): Promise<void> {
		await tick();
		labelTruncated = isTruncated(labelEl);
	}

	$effect(() => {
		// 依存: label 文字列変更時にも再測定 (要素サイズ不変ケース)。
		void assignment.label;
		if (!labelEl) return;
		// font load 後の metrics 変化に追従。document.fonts は modern browser 全対応。
		if (typeof document !== 'undefined' && document.fonts?.ready) {
			document.fonts.ready.then(measureTruncation);
		} else {
			void measureTruncation();
		}
		// 以降の size 変更 (zoom / drag resize / 親 layout) を観測。
		const ro = new ResizeObserver(() => void measureTruncation());
		ro.observe(labelEl);
		return () => ro.disconnect();
	});

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
			onDragEnd?.(finalDx, finalDy);
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
		}
	}
</script>

<!--
	#28 / #23 を refactor: native `title` 属性を bits-ui Tooltip (floating-ui ベース) に置換。
	`disabled={!labelTruncated}` で truncate されてない時は完全に mount しない (perf + 余計な popup 防止)。
	Trigger は asChild snippet で既存 bar div に props をマージ、Portal で Gantt の overflow:hidden を回避。
-->
<Tooltip.Root disabled={!labelTruncated}>
	<Tooltip.Trigger>
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
				role="button"
				tabindex="0"
				aria-label={assignment.label ?? assignment.id}
				aria-describedby={ariaDescribedBy}
				onpointerdown={handlePointerDownBody}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
				onkeydown={handleKeydown}
			>
				<span class="label" bind:this={labelEl}>{assignment.label ?? ''}</span>

				{#if resizable}
					<div
						class="handle handle-start"
						role="separator"
						aria-label="開始日リサイズ"
						onpointerdown={handlePointerDownLeft}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
					></div>
					<div
						class="handle handle-end"
						role="separator"
						aria-label="終了日リサイズ"
						onpointerdown={handlePointerDownRight}
						onpointermove={handlePointerMove}
						onpointerup={handlePointerUp}
						onpointercancel={handlePointerUp}
					></div>
				{/if}
			</div>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content class="ui-bar-tooltip" side="top" sideOffset={4}>
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
