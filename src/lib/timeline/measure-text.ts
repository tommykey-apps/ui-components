/**
 * #43 follow-up: text width 測定の Canvas `measureText` 実装。
 *
 * DOM probe より:
 * - DOM 0 nodes (canvas 1 個を module-scope で再利用)
 * - reflow 不要 (offscreen canvas)
 * - O(N) 同期測定
 *
 * `font` 引数は CSS `font` shorthand (例: `500 13px system-ui, sans-serif`)。
 * 呼び出し側は `timelineEl` の computedStyle から構築する想定。
 *
 * Refs:
 * - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText
 * - https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
 * - https://erikonarheim.com/posts/canvas-text-metrics/
 */

export type TextMeasurer = (text: string) => number;

let cachedCanvas: HTMLCanvasElement | null = null;

function getCtx(): CanvasRenderingContext2D | null {
	if (typeof document === 'undefined') return null;
	if (!cachedCanvas) {
		cachedCanvas = document.createElement('canvas');
	}
	return cachedCanvas.getContext('2d');
}

/**
 * `TextMetrics` から **実描画 bbox 幅** を取り出す pure function。
 *
 * MDN / Erik Onarheim 推奨:
 * - `width` (= advance / 字送り) は overhang glyph (italic 等) を含まないため過小評価しうる
 * - `actualBoundingBoxLeft + actualBoundingBoxRight` が rendering bbox 幅
 * - 一方 CJK 等の overhang ない script では advance > bbox になりうるので **両者の max** を取る
 * - browser によっては subpixel float を返すので `Math.ceil` で整数化 (CSS Grid track や
 *   container clientWidth と一致させ ellipsis 切れ判定を安定化)
 */
export function pickRenderedWidth(metrics: TextMetrics): number {
	const bbox =
		Math.abs(metrics.actualBoundingBoxLeft) + Math.abs(metrics.actualBoundingBoxRight);
	const advance = metrics.width;
	return Math.ceil(Math.max(bbox, advance));
}

/**
 * font 文字列を受け取って measurer 関数を返す。 SSR / non-DOM 環境では `null`。
 * 呼び出し側は `null` の場合に measure をスキップ (= 既存の min width が維持される)。
 */
export function createCanvasMeasurer(font: string): TextMeasurer | null {
	const ctx = getCtx();
	if (!ctx) return null;
	ctx.font = font;
	return (text: string) => pickRenderedWidth(ctx.measureText(text));
}
