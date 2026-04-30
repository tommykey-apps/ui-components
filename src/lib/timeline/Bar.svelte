<script lang="ts">
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

<div
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
	<span class="label">{assignment.label ?? ''}</span>

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
