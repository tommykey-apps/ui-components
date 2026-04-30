import { describe, it, expect } from 'vitest';
import {
	addUnits,
	allocateLanes,
	barRect,
	dateToX,
	snapDate,
	startOfUnit,
	unitsBetween,
	viewportColumns,
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

describe('allocateLanes', () => {
	const mk = (id: string, start: Date, end: Date): Assignment => ({
		id,
		resourceId: 'r',
		startDate: start,
		endDate: end
	});

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
