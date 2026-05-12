import { describe, expect, it } from 'vitest';
import { computeRailWidth } from './rail-width.js';

/**
 * #43: resource rail を最長名に auto-fit する。 過去 (#34, PR #161) は CSS Grid
 * \`minmax(min, fit-content(max))\` + sticky 子要素の相互作用で column が 1px に潰れ、
 * production で本番事故になった。
 *
 * 今回は **JS で各 name の scrollWidth を測定 → clamp → CSS 変数注入** という Linear /
 * Notion 系の timeline で使われる標準 pattern を採用する。 \`computeRailWidth\` はその clamp
 * + padding 計算を pure function に切り出したもの。
 */

describe('computeRailWidth (#43)', () => {
	it('最長 width + padding を返す (min/max 内)', () => {
		expect(computeRailWidth([120, 180, 90], { min: 100, max: 400, padding: 24 })).toBe(204);
	});

	it('最長 width + padding が min を下回ったら min を返す', () => {
		expect(computeRailWidth([30, 40, 50], { min: 100, max: 400, padding: 24 })).toBe(100);
	});

	it('最長 width + padding が max を超えたら max を返す (ellipsis に任せる)', () => {
		expect(computeRailWidth([500, 600, 700], { min: 100, max: 400, padding: 24 })).toBe(400);
	});

	it('境界: 最長 + padding = max は max を返す', () => {
		expect(computeRailWidth([376], { min: 100, max: 400, padding: 24 })).toBe(400);
	});

	it('境界: 最長 + padding = min は min を返す', () => {
		expect(computeRailWidth([76], { min: 100, max: 400, padding: 24 })).toBe(100);
	});

	it('widths が空配列なら min を返す (resources 未登録時に collapse させない)', () => {
		expect(computeRailWidth([], { min: 100, max: 400, padding: 24 })).toBe(100);
	});

	it('padding=0 でも動く', () => {
		expect(computeRailWidth([150], { min: 100, max: 400, padding: 0 })).toBe(150);
	});

	it('NaN / 0 / 負値が混ざっても最大値計算で吸収する', () => {
		// ResizeObserver が発火する前の measure や、 display:none 子要素で 0 が混ざるケース
		expect(computeRailWidth([0, 120, 0], { min: 100, max: 400, padding: 24 })).toBe(144);
		expect(computeRailWidth([NaN, 120], { min: 100, max: 400, padding: 24 })).toBe(144);
		// 全部 NaN なら min (collapse 防止)
		expect(computeRailWidth([NaN, NaN], { min: 100, max: 400, padding: 24 })).toBe(100);
	});

	it('min > max のような設定ミスでも 1px 等の collapse は起こさず min を優先', () => {
		// 防御的: invalid 入力でも production で潰れない
		expect(computeRailWidth([150], { min: 300, max: 200, padding: 0 })).toBe(300);
	});
});
