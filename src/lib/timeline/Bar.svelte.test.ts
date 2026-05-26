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
 * #84: bits-ui Tooltip + floating-ui virtual anchor (cursorAnchor) を全廃して
 * CSS `position: sticky` ベースの sticky label に切替。 業界実装 (DHTMLX Gantt の
 * sticky scale config、 Ben Nadel の Angular Gantt) と同 pattern。
 *
 * #42 / #60 (旧 tooltip 系 bug) は本実装で吸収して close。
 */
describe('Bar sticky label / tooltip removal (regression: #84, supersedes #42 / #60)', () => {
	it('bits-ui Tooltip import を持たない', () => {
		expect(source).not.toMatch(/from\s+['"]bits-ui['"]/);
	});

	it('cursor-anchor module を import しない (廃止済)', () => {
		expect(source).not.toMatch(/from\s+['"]\.\/cursor-anchor/);
	});

	it('Tooltip.Root / Tooltip.Content の markup を持たない', () => {
		expect(source).not.toMatch(/<Tooltip\.(Root|Trigger|Portal|Content)/);
	});

	it('.bar の CSS に overflow: hidden を含まない (sticky 親条件)', () => {
		// .bar { ... } の中の overflow: hidden 宣言を検出
		const barBlock = source.match(/\.bar\s*\{[^}]*\}/);
		expect(barBlock, '.bar style ブロックが見つからない').toBeTruthy();
		expect(barBlock![0]).not.toMatch(/overflow\s*:\s*hidden/);
	});

	it('.label の CSS に position: sticky を含む', () => {
		const labelBlock = source.match(/\.label\s*\{[^}]*\}/);
		expect(labelBlock, '.label style ブロックが見つからない').toBeTruthy();
		expect(labelBlock![0]).toMatch(/position\s*:\s*sticky/);
	});

	it('.label に sticky 用 left 値 (rail width offset) がある', () => {
		const labelBlock = source.match(/\.label\s*\{[^}]*\}/);
		expect(labelBlock![0]).toMatch(/left\s*:/);
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
