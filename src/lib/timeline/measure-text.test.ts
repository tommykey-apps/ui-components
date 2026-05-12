import { describe, expect, it } from 'vitest';
import { createCanvasMeasurer, pickRenderedWidth } from './measure-text.js';

/**
 * #43 follow-up: rail 幅測定を **Canvas \`measureText\`** に切り替える。
 *
 * 旧 (PR #46) の off-flow DOM probe は valid だが、 resource × 1 余分な span を生成し
 * ResizeObserver も attach する。 Canvas measureText なら DOM 0 nodes、 reflow 不要、
 * font load 後 O(N) 同期測定。 MDN / Erik Onarheim の推奨 pattern。
 *
 * \`createCanvasMeasurer\` は factory: font 文字列を受け取って measurer 関数を返す。
 * SSR / non-DOM 環境では \`null\` を返して呼び出し側が fallback できる。
 */

describe('createCanvasMeasurer (#43 canvas refactor)', () => {
	it('node 環境 (document undefined) では null を返す (SSR safe)', () => {
		// vitest unit project は environment: 'node' なので document が無い
		expect(typeof document).toBe('undefined');
		expect(createCanvasMeasurer('13px system-ui')).toBeNull();
	});
});

/**
 * #43 follow-up: \`metrics.width\` (advance width = 字送り) では一部 glyph で実描画 bbox を
 * 過小評価し、 ellipsis 切れの境界で 1px 不足が出る (CI でこの問題発生)。 MDN / Erik Onarheim
 * 推奨は \`abs(actualBoundingBoxLeft) + abs(actualBoundingBoxRight)\` だが、 italic / overhang
 * を含まないフォントでは advance の方が大きい場合もあるため \`Math.max(bbox, advance)\` を取り、
 * subpixel 安定化のため \`Math.ceil\` する。
 *
 * Refs:
 * - https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
 * - https://erikonarheim.com/posts/canvas-text-metrics/
 */
describe('pickRenderedWidth (#43 follow-up: bbox + ceil)', () => {
	function makeMetrics(
		width: number,
		left: number,
		right: number
	): TextMetrics {
		return {
			width,
			actualBoundingBoxLeft: left,
			actualBoundingBoxRight: right,
			// 残りの TextMetrics field はこの関数では参照しないが、 type 充足のため stub
			fontBoundingBoxAscent: 0,
			fontBoundingBoxDescent: 0,
			actualBoundingBoxAscent: 0,
			actualBoundingBoxDescent: 0,
			emHeightAscent: 0,
			emHeightDescent: 0,
			hangingBaseline: 0,
			alphabeticBaseline: 0,
			ideographicBaseline: 0
		} as TextMetrics;
	}

	it('bbox (left + right) と advance の最大値を返す', () => {
		// italic 等で bbox > advance のケース
		expect(pickRenderedWidth(makeMetrics(100, 2, 99))).toBe(101);
		// CJK 等で advance > bbox のケース
		expect(pickRenderedWidth(makeMetrics(150, 70, 79))).toBe(150);
	});

	it('subpixel 結果を Math.ceil で整数化する (CI clientWidth 比較で 1px 不足を防ぐ)', () => {
		// CI で 273.34 → ceil 274 で scrollWidth=274 と一致
		expect(pickRenderedWidth(makeMetrics(273.34, 0, 273.34))).toBe(274);
		expect(pickRenderedWidth(makeMetrics(100.01, 0, 100.01))).toBe(101);
		// 整数入力はそのまま
		expect(pickRenderedWidth(makeMetrics(100, 0, 100))).toBe(100);
	});

	it('actualBoundingBoxLeft が負値でも abs で吸収する (Firefox 過去 bug 含む defensive)', () => {
		// MDN: left は alignment point から左方向に伸びる距離、 align="left" なら 0 ± 数 px、
		// align="center"/"right" や Firefox 過去 bug で sign が逆になり得る
		expect(pickRenderedWidth(makeMetrics(100, -5, 95))).toBe(100);
		expect(pickRenderedWidth(makeMetrics(50, 5, 100))).toBe(105);
	});

	it('全ての値が 0 でも 0 を返す (空文字列 ケース)', () => {
		expect(pickRenderedWidth(makeMetrics(0, 0, 0))).toBe(0);
	});
});
