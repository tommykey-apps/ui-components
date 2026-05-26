/**
 * #67: setPointerCapture-based drag lifecycle helper。
 *
 * window listener を使わず target element に pointer event を capture し、 続く
 * pointermove / pointerup / pointercancel を同 listener で拾う pattern を helper 化。
 *
 * 採用箇所:
 * - `ResourceTimeline` の canvas drag-to-pan
 *
 * 採用しない箇所 (AHA 原則: 不適切な abstraction より duplication):
 * - `Bar.svelte` の drag / resize → mode 切替 (move / resize-start / resize-end) と
 *   2D delta が closure 内 state と密結合しており、 共通化すると caller 側で mode 判定が
 *   増えて helper の汎用性メリットが消える
 */
export type PointerDragOptions = {
	/** pointerdown 時の前処理。 `false` を return すると drag を開始しない */
	onStart?: (e: PointerEvent) => boolean | void;
	onMove?: (dx: number, dy: number, e: PointerEvent) => void;
	onEnd?: (dx: number, dy: number, e: PointerEvent) => void;
};

export type PointerDragHandle = {
	onPointerDown: (e: PointerEvent) => void;
	onPointerMove: (e: PointerEvent) => void;
	onPointerUp: (e: PointerEvent) => void;
};

export function createPointerDrag(opts: PointerDragOptions): PointerDragHandle {
	let startX = 0;
	let startY = 0;
	let pointerId: number | null = null;

	return {
		onPointerDown(e: PointerEvent) {
			if (e.button !== 0) return;
			if (opts.onStart?.(e) === false) return;
			startX = e.clientX;
			startY = e.clientY;
			pointerId = e.pointerId;
			try {
				(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
			} catch {
				// synthetic event 等で setPointerCapture 未対応
			}
		},
		onPointerMove(e: PointerEvent) {
			if (pointerId === null) return;
			opts.onMove?.(e.clientX - startX, e.clientY - startY, e);
		},
		onPointerUp(e: PointerEvent) {
			if (pointerId === null) return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			pointerId = null;
			opts.onEnd?.(dx, dy, e);
		}
	};
}
