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

