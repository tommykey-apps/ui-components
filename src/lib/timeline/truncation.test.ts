import { describe, it, expect } from 'vitest';
import { isTruncated } from './truncation.js';

/**
 * Bar.svelte の hover tooltip 制御 (#23) で使う truncate 判定 helper。
 * 要素の scrollWidth (描画したい総幅) > clientWidth (見えている container 幅) で
 * ellipsis (text-overflow) が発動しているかを判定する。
 */
describe('isTruncated', () => {
	it('returns false when element is null or undefined', () => {
		expect(isTruncated(null)).toBe(false);
		expect(isTruncated(undefined)).toBe(false);
	});

	it('returns true when scrollWidth > clientWidth (content is clipped)', () => {
		const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
		expect(isTruncated(el)).toBe(true);
	});

	it('returns false when scrollWidth equals clientWidth (just fits)', () => {
		const el = { scrollWidth: 100, clientWidth: 100 } as HTMLElement;
		expect(isTruncated(el)).toBe(false);
	});

	it('returns false when scrollWidth < clientWidth (room to spare)', () => {
		const el = { scrollWidth: 80, clientWidth: 100 } as HTMLElement;
		expect(isTruncated(el)).toBe(false);
	});
});
