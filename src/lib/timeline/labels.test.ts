import { describe, expect, it } from 'vitest';
import { DEFAULT_TIMELINE_LABELS, resolveLabels } from './labels.js';

/**
 * #33: ライブラリ default は **英語**、 consumer の partial override を deep merge する
 * (1 段ネストまで)。 default が完全に揃っていることで component 側で undefined チェックが不要。
 */

describe('DEFAULT_TIMELINE_LABELS (#33)', () => {
	it('aria-label default は英語 (library convention)', () => {
		expect(DEFAULT_TIMELINE_LABELS.bar.resizeStart).toBe('Resize start');
		expect(DEFAULT_TIMELINE_LABELS.bar.resizeEnd).toBe('Resize end');
		expect(DEFAULT_TIMELINE_LABELS.canvas.region).toBe('Timeline canvas');
	});

	it('status template は引数を含む英語文字列を返す', () => {
		expect(DEFAULT_TIMELINE_LABELS.status.move('2026-05-01 〜 2026-05-08')).toContain('Moved');
		expect(DEFAULT_TIMELINE_LABELS.status.resizeStart('2026-05-01 〜 2026-05-08')).toContain(
			'Start date changed'
		);
	});
});

describe('resolveLabels (#33)', () => {
	it('overrides 未指定 → default をそのまま返す', () => {
		expect(resolveLabels()).toEqual(DEFAULT_TIMELINE_LABELS);
		expect(resolveLabels(undefined)).toEqual(DEFAULT_TIMELINE_LABELS);
	});

	it('bar.resizeStart のみ override → 他 key は default 維持', () => {
		const r = resolveLabels({ bar: { resizeStart: '開始日リサイズ' } });
		expect(r.bar.resizeStart).toBe('開始日リサイズ');
		expect(r.bar.resizeEnd).toBe('Resize end'); // default 維持
	});

	it('canvas.region のみ override', () => {
		const r = resolveLabels({ canvas: { region: 'タイムライン' } });
		expect(r.canvas.region).toBe('タイムライン');
	});

	it('status template の差し替え', () => {
		const r = resolveLabels({
			status: {
				move: (range) => `移動: ${range}`
			}
		});
		expect(r.status.move('2026-05-01 〜 2026-05-08')).toBe('移動: 2026-05-01 〜 2026-05-08');
		// 上書きしてない他 status template は default 維持
		expect(r.status.resizeStart('x')).toBe('Start date changed: x');
	});

	it('複数 section の同時 override', () => {
		const r = resolveLabels({
			bar: { resizeStart: 'a', resizeEnd: 'b' },
			canvas: { region: 'c' },
			status: { move: () => 'd' }
		});
		expect(r.bar).toEqual({ resizeStart: 'a', resizeEnd: 'b' });
		expect(r.canvas.region).toBe('c');
		expect(r.status.move('any')).toBe('d');
	});
});
