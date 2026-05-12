/**
 * #43 follow-up: text width 測定の Canvas \`measureText\` 実装。
 *
 * DOM probe より:
 * - DOM 0 nodes (canvas 1 個を module-scope で再利用)
 * - reflow 不要 (offscreen canvas)
 * - O(N) 同期測定
 *
 * \`font\` 引数は CSS \`font\` shorthand (例: \`500 13px system-ui, sans-serif\`)。
 * 呼び出し側は \`timelineEl\` の computedStyle から構築する想定。
 *
 * Refs:
 * - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText
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
 * font 文字列を受け取って measurer 関数を返す。 SSR / non-DOM 環境では \`null\`。
 * 呼び出し側は \`null\` の場合に measure をスキップ (= 既存の min width が維持される)。
 */
export function createCanvasMeasurer(font: string): TextMeasurer | null {
	const ctx = getCtx();
	if (!ctx) return null;
	ctx.font = font;
	return (text: string) => ctx.measureText(text).width;
}
