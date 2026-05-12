import { describe, expect, it } from 'vitest';
import { createCanvasMeasurer } from './measure-text.js';

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
