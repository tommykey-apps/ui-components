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
