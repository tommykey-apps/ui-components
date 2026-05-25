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
