import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	addUnits,
	allocateLanes,
	barRect,
	dateToX,
	endColExclusive,
	maxEndCol,
	snapDate,
	startOfUnit,
	unitsBetween,
	viewportColumns,
	weekOfMonth,
	xToDate
} from './projection.js';
import { ZOOMS } from './zoom.js';
import type { Assignment } from './types.js';

describe('startOfUnit', () => {
	it('day: 14:30 → 00:00 (local)', () => {
		const d = new Date(2026, 4, 4, 14, 30);
		expect(startOfUnit(d, 'day')).toEqual(new Date(2026, 4, 4));
	});

	it('week: Tue → Mon (weekStartsOn: 1)', () => {
		const tue = new Date(2026, 4, 5);
		expect(startOfUnit(tue, 'week')).toEqual(new Date(2026, 4, 4));
	});

	it('month: 5/15 → 5/01', () => {
		expect(startOfUnit(new Date(2026, 4, 15), 'month')).toEqual(new Date(2026, 4, 1));
	});

	it('year: 5/15 → 1/01', () => {
		expect(startOfUnit(new Date(2026, 4, 15), 'year')).toEqual(new Date(2026, 0, 1));
	});
});

describe('addUnits / unitsBetween', () => {
	it('day: +7 → 7 days', () => {
		const start = new Date(2026, 4, 4);
		const end = addUnits(start, 7, 'day');
		expect(unitsBetween(start, end, 'day')).toBe(7);
	});

	it('negative: 5/11 → 5/04 = -7', () => {
		expect(unitsBetween(new Date(2026, 4, 11), new Date(2026, 4, 4), 'day')).toBe(-7);
	});

	it('month: +12 → 1 year', () => {
		const start = new Date(2026, 0, 1);
		const end = addUnits(start, 12, 'month');
		expect(end).toEqual(new Date(2027, 0, 1));
	});
});

describe('barRect', () => {
	const zoom = ZOOMS.day;
	const origin = new Date(2026, 4, 4);

	it('aligned: span = endCol - startCol', () => {
		const a: Assignment = {
			id: '1',
			resourceId: 'r',
			startDate: new Date(2026, 4, 4),
			endDate: new Date(2026, 4, 11)
		};
		expect(barRect(a, origin, zoom)).toEqual({ x: 0, width: 7 * zoom.colWidth });
	});

	it('not aligned (mid-day end): span += 1', () => {
		const a: Assignment = {
			id: '1',
			resourceId: 'r',
			startDate: new Date(2026, 4, 4),
			endDate: new Date(2026, 4, 11, 12)
		};
		expect(barRect(a, origin, zoom)).toEqual({ x: 0, width: 8 * zoom.colWidth });
	});

	it('zero-length: minimum 1 col', () => {
		const a: Assignment = {
			id: '1',
			resourceId: 'r',
			startDate: new Date(2026, 4, 4),
			endDate: new Date(2026, 4, 4)
		};
		expect(barRect(a, origin, zoom).width).toBe(zoom.colWidth);
	});
});

describe('dateToX / xToDate', () => {
	it('day zoom round trip', () => {
		const zoom = ZOOMS.day;
		const origin = new Date(2026, 4, 4);
		const d = new Date(2026, 4, 6);
		expect(xToDate(dateToX(d, origin, zoom), origin, zoom)).toEqual(d);
	});
});

describe('viewportColumns', () => {
	it('day: 14 cols starting from origin', () => {
		const cols = viewportColumns(new Date(2026, 4, 4), 14, 'day');
		expect(cols).toHaveLength(14);
		expect(cols[0]).toEqual(new Date(2026, 4, 4));
		expect(cols[13]).toEqual(new Date(2026, 4, 17));
	});
});

describe('snapDate', () => {
	it('day: midday → midnight', () => {
		expect(snapDate(new Date(2026, 4, 4, 12), 'day')).toEqual(new Date(2026, 4, 4));
	});

	it('week: Wed → Mon', () => {
		expect(snapDate(new Date(2026, 4, 6), 'week')).toEqual(new Date(2026, 4, 4));
	});
});

const mkAssignment = (id: string, start: Date, end: Date): Assignment => ({
	id,
	resourceId: 'r',
	startDate: start,
	endDate: end
});

describe('endColExclusive', () => {
	it('aligned: returns endCol unchanged', () => {
		expect(endColExclusive(new Date(2026, 4, 11), new Date(2026, 4, 4), 'day')).toBe(7);
	});

	it('not aligned (mid-day): returns endCol + 1', () => {
		expect(endColExclusive(new Date(2026, 4, 11, 12), new Date(2026, 4, 4), 'day')).toBe(8);
	});

	it('week unit: aligned Monday', () => {
		// 2026-05-04 (Mon) + 2 weeks = 2026-05-18 (Mon)
		expect(endColExclusive(new Date(2026, 4, 18), new Date(2026, 4, 4), 'week')).toBe(2);
	});
});

describe('maxEndCol', () => {
	it('empty: returns 0', () => {
		expect(maxEndCol([], new Date(2026, 4, 4), 'day')).toBe(0);
	});

	it('multiple assignments: returns furthest end col', () => {
		const items = [
			mkAssignment('a', new Date(2026, 4, 4), new Date(2026, 4, 8)),
			mkAssignment('b', new Date(2026, 4, 5), new Date(2026, 4, 20)),
			mkAssignment('c', new Date(2026, 4, 6), new Date(2026, 4, 11))
		];
		expect(maxEndCol(items, new Date(2026, 4, 4), 'day')).toBe(16);
	});

	it('all in past: clamped to 0', () => {
		const items = [mkAssignment('a', new Date(2026, 3, 1), new Date(2026, 3, 8))];
		expect(maxEndCol(items, new Date(2026, 4, 4), 'day')).toBe(0);
	});
});

describe('allocateLanes', () => {
	const mk = mkAssignment;

	it('non-overlapping: all in lane 0', () => {
		const a = mk('a', new Date(2026, 4, 4), new Date(2026, 4, 6));
		const b = mk('b', new Date(2026, 4, 6), new Date(2026, 4, 8));
		const result = allocateLanes([a, b]);
		expect(result.laneCount).toBe(1);
		expect(result.lanes.get('a')).toBe(0);
		expect(result.lanes.get('b')).toBe(0);
	});

	it('two overlapping: 2 lanes', () => {
		const a = mk('a', new Date(2026, 4, 4), new Date(2026, 4, 10));
		const b = mk('b', new Date(2026, 4, 6), new Date(2026, 4, 8));
		const result = allocateLanes([a, b]);
		expect(result.laneCount).toBe(2);
		expect(result.lanes.get('a')).toBe(0);
		expect(result.lanes.get('b')).toBe(1);
	});

	it('three overlapping: 3 lanes', () => {
		const items = [
			mk('a', new Date(2026, 4, 4), new Date(2026, 4, 10)),
			mk('b', new Date(2026, 4, 5), new Date(2026, 4, 11)),
			mk('c', new Date(2026, 4, 6), new Date(2026, 4, 12))
		];
		const result = allocateLanes(items);
		expect(result.laneCount).toBe(3);
	});

	it('reuse: lane 0 freed after first ends', () => {
		const a = mk('a', new Date(2026, 4, 4), new Date(2026, 4, 6));
		const b = mk('b', new Date(2026, 4, 5), new Date(2026, 4, 8));
		const c = mk('c', new Date(2026, 4, 7), new Date(2026, 4, 10));
		const result = allocateLanes([a, b, c]);
		// a: lane 0 (5/04-5/06)
		// b: lane 1 (5/05-5/08, overlaps a)
		// c: lane 0 (5/07-5/10, a is finished by 5/06)
		expect(result.laneCount).toBe(2);
		expect(result.lanes.get('a')).toBe(0);
		expect(result.lanes.get('b')).toBe(1);
		expect(result.lanes.get('c')).toBe(0);
	});

	it('empty: laneCount 0', () => {
		const result = allocateLanes([]);
		expect(result.laneCount).toBe(0);
		expect(result.lanes.size).toBe(0);
	});
});

describe('weekOfMonth', () => {
	it('first Monday of May 2026 → W1', () => {
		expect(weekOfMonth(new Date(2026, 4, 4))).toBe(1);
	});

	it('mid May → W2/W3/W4', () => {
		expect(weekOfMonth(new Date(2026, 4, 11))).toBe(2);
		expect(weekOfMonth(new Date(2026, 4, 18))).toBe(3);
		expect(weekOfMonth(new Date(2026, 4, 25))).toBe(4);
	});

	it('boundary week (Apr 27 - May 3) belongs to April → April W4', () => {
		expect(weekOfMonth(new Date(2026, 3, 27))).toBe(4);
	});

	it('week start on month-1st-Monday → W1 (Jun 1 2026 is Monday)', () => {
		expect(weekOfMonth(new Date(2026, 5, 1))).toBe(1);
	});

	it('5-week month last week → W5 (Mon Jun 29 2026)', () => {
		expect(weekOfMonth(new Date(2026, 5, 29))).toBe(5);
	});

	it('mid-week date returns same as its Monday (Wed May 6 → W1)', () => {
		expect(weekOfMonth(new Date(2026, 4, 6))).toBe(1);
	});
});

describe('allocateLanes (#58: duplicate id dev warn)', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	function mkAssignment(id: string, startMonth: number, endMonth: number): Assignment {
		return {
			id,
			resourceId: 'r1',
			startDate: new Date(2026, startMonth, 1),
			endDate: new Date(2026, endMonth, 1)
		};
	}

	it('unique ids: console.warn を呼ばない', () => {
		allocateLanes([mkAssignment('a1', 0, 1), mkAssignment('a2', 2, 3)]);
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('duplicate id: 重複 id を含む warning を出す', () => {
		allocateLanes([mkAssignment('dup', 0, 1), mkAssignment('dup', 2, 3)]);
		expect(warnSpy).toHaveBeenCalled();
		const message = warnSpy.mock.calls[0]?.join(' ') ?? '';
		expect(message).toContain('dup');
	});
});
