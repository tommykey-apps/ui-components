import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
	fileURLToPath(new URL('./ResourceTimeline.svelte', import.meta.url)),
	'utf8'
);

describe('ResourceTimeline statusId (regression: #56)', () => {
	it('does not use Math.random() — SSR/client hydration mismatch を防ぐ', () => {
		expect(source).not.toMatch(/Math\.random\(\)/);
	});

	it('uses $props.id() for SSR-stable id generation', () => {
		expect(source).toMatch(/\$props\.id\(\)/);
	});
});

/**
 * #57: `document.fonts.ready.then(remeasure)` の Promise は cancel 不可。
 * unmount 後に resolve すると `measuredRailWidth = ...` ($state への write) や
 * `timelineEl.querySelector(...)` を行うことで orphan DOM を引く。
 * Svelte 公式の teardown function 内で cancel flag を立てる pattern。
 */
describe('ResourceTimeline font-ready effect teardown (regression: #57)', () => {
	it('$effect は cancel flag を立てる teardown を return する', () => {
		expect(source).toMatch(/return\s*\(\)\s*=>\s*\{[\s\S]*?cancelled\s*=\s*true/);
	});

	it('font ready callback は cancelled を確認してから remeasure する', () => {
		expect(source).toMatch(/document\.fonts\.ready\.then\(/);
		expect(source).toMatch(/if\s*\(\s*!?cancelled\b/);
	});
});

/**
 * #85 / #68: consumer-facing event API 拡張
 * - #85: onActivate prop を expose + Bar に forward
 * - #68: onResize の callback signature に edge ('start' | 'end') を追加 (optional で backward-compat)
 */
describe('ResourceTimeline consumer API (regression: #85 / #68)', () => {
	it('onActivate prop を Props に持つ (#85)', () => {
		expect(source).toMatch(/onActivate\?\s*:\s*\(assignment:\s*Assignment\)\s*=>\s*void/);
	});

	it('onResize signature が edge を optional positional argument に持つ (#68)', () => {
		expect(source).toMatch(
			/onResize\?\s*:\s*\(assignment:\s*Assignment,\s*edge\?\s*:\s*['"]start['"]\s*\|\s*['"]end['"]\)\s*=>\s*void/
		);
	});

	it('onResize の呼び出しで edge を渡す (#68)', () => {
		expect(source).toMatch(/onResize\?\.\(updated,\s*(['"](?:start|end)['"]|edge)\)/);
	});

	it('Bar に onActivate を forward する (#85)', () => {
		expect(source).toMatch(/onActivate=\{/);
	});
});

/**
 * #70: aria-live region に aria-atomic="true" を付与し、 連続更新時に SR が
 * 中間値を skip して最終値だけ announce する挙動を担保 (WAI-ARIA APG 推奨)。
 */
describe('ResourceTimeline aria-live (regression: #70)', () => {
	it('status region に aria-atomic="true" がある', () => {
		expect(source).toMatch(
			/role="status"[^>]*aria-atomic="true"|aria-atomic="true"[^>]*role="status"/
		);
	});
});

/**
 * #84: bits-ui Tooltip / Tooltip.Provider は廃止し、 Bar.svelte の sticky label で代替。
 * consumer に Tooltip.Provider を強要しない self-contained 設計は維持しつつ、 そもそも Provider 不要。
 */
describe('ResourceTimeline tooltip removal (regression: #84)', () => {
	it('bits-ui Tooltip を import しない', () => {
		expect(source).not.toMatch(/from\s+['"]bits-ui['"]/);
	});

	it('Tooltip.Provider wrapper を持たない', () => {
		expect(source).not.toMatch(/<\/?Tooltip\.Provider/);
	});
});

/**
 * origin より前に終わる bar が lane を占有し、 見えないのに行が高くなっていた。
 * canvas 外の bar は lane 割り当てと描画の両方から除外する。
 */
describe('ResourceTimeline canvas 外 bar の除外', () => {
	it('canvas 内の assignment を isOnCanvas で絞る', () => {
		expect(source).toMatch(/assignments\.filter\(\(a\)\s*=>\s*isOnCanvas\(a,\s*origin,\s*zoom\.unit\)\)/);
	});

	it('lane 割り当てと描画は全件ではなく onCanvas を使う', () => {
		expect(source).toMatch(/onCanvas\.filter\(\(a\)\s*=>\s*a\.resourceId\s*===\s*r\.id\)/);
		expect(source).toMatch(/onCanvas\s*\n?\s*\.map\(/);
	});
});

/**
 * 見出しの月・曜日表記を consumer の locale に合わせる (date-fns Locale)。
 * 未指定なら従来どおり英語。
 */
describe('ResourceTimeline locale prop', () => {
	it('Props に date-fns の Locale 型の locale を持つ', () => {
		expect(source).toMatch(/locale\?:\s*Locale;/);
	});

	it('見出しのグループ化に locale を渡す', () => {
		expect(source).toMatch(/groupHeaderCells\(columns,\s*tier,\s*locale\)/);
	});
});
