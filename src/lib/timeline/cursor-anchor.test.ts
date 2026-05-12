import { describe, expect, it } from 'vitest';
import { createCursorAnchor, type VirtualAnchor } from './cursor-anchor.js';

/**
 * #42: bits-ui Tooltip の \`customAnchor\` prop に渡す virtual element を、
 * カーソル位置 (clientX/clientY) から生成する pure factory。
 * floating-ui の canonical follow-cursor pattern (zero-size rect at pointer).
 *
 * https://floating-ui.com/docs/virtual-elements
 */

describe('createCursorAnchor (#42)', () => {
	it('getBoundingClientRect() がカーソル位置を 0x0 rect で返す', () => {
		const anchor = createCursorAnchor(123, 456);
		const rect = anchor.getBoundingClientRect();
		expect(rect.x).toBe(123);
		expect(rect.y).toBe(456);
		expect(rect.left).toBe(123);
		expect(rect.top).toBe(456);
		expect(rect.right).toBe(123);
		expect(rect.bottom).toBe(456);
		expect(rect.width).toBe(0);
		expect(rect.height).toBe(0);
	});

	it('原点 (0, 0) でも壊れない', () => {
		const rect = createCursorAnchor(0, 0).getBoundingClientRect();
		expect(rect.x).toBe(0);
		expect(rect.y).toBe(0);
		expect(rect.width).toBe(0);
	});

	it('負の座標 (viewport 外) もそのまま透過する', () => {
		// floating-ui の shift middleware が clamp する責務、 anchor は生座標を渡す
		const rect = createCursorAnchor(-50, -100).getBoundingClientRect();
		expect(rect.x).toBe(-50);
		expect(rect.y).toBe(-100);
	});

	it('toJSON() が plain object を返す (DOMRect 互換性)', () => {
		// bits-ui 内部 / floating-ui で JSON.stringify されるケースに備える
		const anchor = createCursorAnchor(10, 20);
		const json = anchor.getBoundingClientRect().toJSON();
		expect(json).toEqual({
			x: 10,
			y: 20,
			left: 10,
			top: 20,
			right: 10,
			bottom: 20,
			width: 0,
			height: 0
		});
	});

	it('VirtualAnchor 型は { getBoundingClientRect } のみ要求 (floating-ui 仕様)', () => {
		// 型レベル: 余計な field なしで anchor として通る
		const anchor: VirtualAnchor = createCursorAnchor(1, 2);
		expect(typeof anchor.getBoundingClientRect).toBe('function');
	});

	it('呼び出すたびに同じ座標を返す (immutable snapshot)', () => {
		// 各 pointermove で新規 anchor を作る前提なので、 1 つの anchor は座標を持ち続ける
		const anchor = createCursorAnchor(100, 200);
		const r1 = anchor.getBoundingClientRect();
		const r2 = anchor.getBoundingClientRect();
		expect(r1.x).toBe(r2.x);
		expect(r1.y).toBe(r2.y);
	});
});
