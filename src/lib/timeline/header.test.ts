import { describe, expect, it } from 'vitest';
import { ja } from 'date-fns/locale';
import { groupHeaderCells } from './header.js';
import { viewportColumns } from './projection.js';

describe('groupHeaderCells', () => {
	const months = viewportColumns(new Date(2026, 9, 1), 3, 'month');

	it('locale 未指定は英語 (既存挙動)', () => {
		const groups = groupHeaderCells(months, { unit: 'month', fmt: 'MMM' });
		expect(groups.map((g) => g.value)).toEqual(['Oct', 'Nov', 'Dec']);
	});

	it('locale: ja で月が「10月」表記になる', () => {
		const groups = groupHeaderCells(months, { unit: 'month', fmt: 'MMM' }, ja);
		expect(groups.map((g) => g.value)).toEqual(['10月', '11月', '12月']);
	});

	it('locale: ja で曜日が日本語になる', () => {
		const days = viewportColumns(new Date(2026, 9, 16), 2, 'day');
		const groups = groupHeaderCells(days, { unit: 'day', fmt: 'd(EEE)' }, ja);
		expect(groups.map((g) => g.value)).toEqual(['16(金)', '17(土)']);
	});

	it('連続する同一値は span でまとめる', () => {
		const groups = groupHeaderCells(months, { unit: 'year', fmt: 'yyyy' }, ja);
		expect(groups).toEqual([{ value: '2026', span: 3, startIdx: 0 }]);
	});

	it('関数の fmt はそのまま呼ぶ', () => {
		const groups = groupHeaderCells(months, { unit: 'month', fmt: (d) => `M${d.getMonth() + 1}` }, ja);
		expect(groups.map((g) => g.value)).toEqual(['M10', 'M11', 'M12']);
	});
});
