import { describe, expect, it, vi } from 'vitest';
import { createPointerDrag } from './pointer-drag.js';

/**
 * #67: pointer-drag helper の lifecycle / abort 挙動を担保。
 */

function mkEvent(over: Partial<PointerEvent> = {}): PointerEvent {
	const setPointerCapture = vi.fn();
	const target = { setPointerCapture } as unknown as HTMLElement;
	return {
		button: 0,
		pointerId: 1,
		clientX: 0,
		clientY: 0,
		currentTarget: target,
		...over
	} as unknown as PointerEvent;
}

describe('createPointerDrag', () => {
	it('onPointerDown が button !== 0 (右クリック等) を無視する', () => {
		const onStart = vi.fn();
		const handle = createPointerDrag({ onStart });
		handle.onPointerDown(mkEvent({ button: 2 }));
		expect(onStart).not.toHaveBeenCalled();
	});

	it('onStart が false を返すと start を abort (move/end が呼ばれない)', () => {
		const onMove = vi.fn();
		const onEnd = vi.fn();
		const handle = createPointerDrag({
			onStart: () => false,
			onMove,
			onEnd
		});
		handle.onPointerDown(mkEvent({ clientX: 10, clientY: 10 }));
		handle.onPointerMove(mkEvent({ clientX: 20, clientY: 20 }));
		handle.onPointerUp(mkEvent({ clientX: 30, clientY: 30 }));
		expect(onMove).not.toHaveBeenCalled();
		expect(onEnd).not.toHaveBeenCalled();
	});

	it('pointerdown → move → up の lifecycle で dx/dy を渡す', () => {
		const onMove = vi.fn();
		const onEnd = vi.fn();
		const handle = createPointerDrag({ onMove, onEnd });
		handle.onPointerDown(mkEvent({ clientX: 100, clientY: 50 }));
		handle.onPointerMove(mkEvent({ clientX: 130, clientY: 65 }));
		expect(onMove).toHaveBeenCalledWith(30, 15, expect.anything());
		handle.onPointerUp(mkEvent({ clientX: 140, clientY: 70 }));
		expect(onEnd).toHaveBeenCalledWith(40, 20, expect.anything());
	});

	it('pointerdown 抜きで move / up が来ても no-op (stale event 防御)', () => {
		const onMove = vi.fn();
		const onEnd = vi.fn();
		const handle = createPointerDrag({ onMove, onEnd });
		handle.onPointerMove(mkEvent({ clientX: 10, clientY: 10 }));
		handle.onPointerUp(mkEvent({ clientX: 10, clientY: 10 }));
		expect(onMove).not.toHaveBeenCalled();
		expect(onEnd).not.toHaveBeenCalled();
	});

	it('onPointerDown で setPointerCapture を呼ぶ', () => {
		const setPointerCapture = vi.fn();
		const target = { setPointerCapture } as unknown as HTMLElement;
		const e = {
			button: 0,
			pointerId: 7,
			clientX: 0,
			clientY: 0,
			currentTarget: target
		} as unknown as PointerEvent;
		const handle = createPointerDrag({});
		handle.onPointerDown(e);
		expect(setPointerCapture).toHaveBeenCalledWith(7);
	});

	it('end 後の move/up は no-op (重複発火 / stale event 防御)', () => {
		const onMove = vi.fn();
		const onEnd = vi.fn();
		const handle = createPointerDrag({ onMove, onEnd });
		handle.onPointerDown(mkEvent());
		handle.onPointerUp(mkEvent({ clientX: 10, clientY: 0 }));
		onMove.mockClear();
		onEnd.mockClear();
		handle.onPointerMove(mkEvent({ clientX: 20, clientY: 0 }));
		handle.onPointerUp(mkEvent({ clientX: 30, clientY: 0 }));
		expect(onMove).not.toHaveBeenCalled();
		expect(onEnd).not.toHaveBeenCalled();
	});
});
