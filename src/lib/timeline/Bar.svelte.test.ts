import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
	fileURLToPath(new URL('./Bar.svelte', import.meta.url)),
	'utf8'
);

/**
 * #81: focusable role="separator" は WAI-ARIA で aria-valuenow / aria-orientation /
 * tabindex が必須 (https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role)。
 * default の orientation は horizontal なので、 vertical な splitter は明示が必要。
 * 「handle に到達するキーボード手段」 も必要 (tabindex + arrow-key handler)。
 */
describe('Bar resize handle ARIA (regression: #81)', () => {
	function extractHandleBlocks(): string[] {
		// <div class="handle handle-start" ...> から最初の `>` までを抜く
		const matches = source.match(/<div\b[^>]*class="handle handle-(?:start|end)"[\s\S]*?>/g);
		expect(matches, 'handle 要素が source から見つからない').toBeTruthy();
		expect(matches!.length, 'start / end の 2 handle 期待').toBe(2);
		return matches!;
	}

	it('handles are focusable via tabindex={0}', () => {
		for (const block of extractHandleBlocks()) {
			expect(block).toMatch(/tabindex=\{0\}/);
		}
	});

	it('handles declare vertical orientation (default は horizontal なので必須明示)', () => {
		for (const block of extractHandleBlocks()) {
			expect(block).toMatch(/aria-orientation="vertical"/);
		}
	});

	it('handles expose aria-valuenow (focusable separator は必須)', () => {
		for (const block of extractHandleBlocks()) {
			expect(block).toMatch(/aria-valuenow=/);
		}
	});

	it('handles wire onkeydown for keyboard resize (矢印キー到達手段)', () => {
		for (const block of extractHandleBlocks()) {
			expect(block).toMatch(/onkeydown=/);
		}
	});
});

/**
 * #59: Bar は src/lib/index.ts から公開されているので consumer が直接 import 可能。
 * しかし `labels?: Required<BarLabels>` だと部分上書きできず API として使いにくい。
 * bits-ui 流の primitive style に合わせ、 partial OK + 内部 fallback に緩和する。
 */
describe('Bar labels prop typing (regression: #59)', () => {
	it('labels prop は Required<BarLabels> を使わない (partial 許容)', () => {
		expect(source).not.toMatch(/labels\?:\s*Required<BarLabels>/);
	});

	it('labels prop は BarLabels (任意キー optional) を受け付ける', () => {
		expect(source).toMatch(/labels\?:\s*BarLabels/);
	});
});

/**
 * #42 / #60: tooltip は floating-ui の virtual element (cursorAnchor) で cursor 追従する。
 * - #42: customAnchor={cursorAnchor} で cursor 位置に anchor 固定、 wide bar でも viewport 端に
 *   貼りつかない。
 * - #60: pointerleave で cursorAnchor = null にすると bits-ui が trigger 要素 (bar) を anchor に
 *   fallback し、 close transition 中の 1 RAF で tooltip が「画面左に飛ぶ」 ように描画される。
 *   null にせず最後の cursor 位置で保持 → unmount で GC、 次回 pointerenter で上書きされる。
 */
describe('Bar tooltip cursor anchor (regression: #42 / #60)', () => {
	it('Tooltip.Content は customAnchor={cursorAnchor} を渡す (#42 cursor 追従)', () => {
		expect(source).toMatch(/customAnchor=\{cursorAnchor\}/);
	});

	it('pointerleave で cursorAnchor = null にしない (#60 close transition 中の飛び防止)', () => {
		// handlePointerLeave は削除済み、 もしくは cursorAnchor 代入が無い形であること
		expect(source).not.toMatch(/cursorAnchor\s*=\s*null/);
	});
});

/**
 * #85: consumer (resource-planner) が bar クリック → detail dialog を起動する API。
 * WAI-ARIA Button pattern に準じて pointer click + keyboard (Enter/Space) を unified に扱う。
 * 命名は React Aria の onPress と同思想の `onActivate` (input agnostic)。
 * - click threshold (Math.hypot < 4px) 以下は drag ではなく click とみなす (dnd-kit 等の慣例)
 * - resize handle (mode !== 'move') では発火しない
 */
describe('Bar onActivate (regression: #85)', () => {
	it('onActivate prop を Props に持つ', () => {
		expect(source).toMatch(/onActivate\?\s*:\s*\(assignment:\s*Assignment\)\s*=>\s*void/);
	});

	it('handlePointerUp で click threshold (Math.hypot) を判定', () => {
		// 数値リテラル or 定数識別子 (CLICK_THRESHOLD_PX 等) 両方を受け付ける
		expect(source).toMatch(/Math\.hypot\([^)]*\)\s*<\s*[\w\d]+/);
	});

	it('handleKeydown で Enter / Space に対応', () => {
		expect(source).toMatch(/case\s+['"]Enter['"]/);
		expect(source).toMatch(/case\s+['"]\s['"]/);
	});

	it('keyboard activation 時に onActivate(assignment) を呼ぶ', () => {
		expect(source).toMatch(/onActivate\?\.\(assignment\)/);
	});
});
