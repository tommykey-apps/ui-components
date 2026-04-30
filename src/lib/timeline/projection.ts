import {
	differenceInDays,
	differenceInCalendarWeeks,
	differenceInCalendarMonths,
	differenceInCalendarYears,
	addDays,
	addWeeks,
	addMonths,
	addYears,
	startOfDay,
	startOfWeek,
	startOfMonth,
	startOfYear
} from 'date-fns';
import type { Assignment, SnapUnit, ZoomLevel, ZoomUnit } from './types.js';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export function startOfUnit(date: Date, unit: ZoomUnit): Date {
	switch (unit) {
		case 'day':
			return startOfDay(date);
		case 'week':
			return startOfWeek(date, WEEK_OPTIONS);
		case 'month':
			return startOfMonth(date);
		case 'year':
			return startOfYear(date);
	}
}

export function addUnits(date: Date, n: number, unit: ZoomUnit): Date {
	switch (unit) {
		case 'day':
			return addDays(date, n);
		case 'week':
			return addWeeks(date, n);
		case 'month':
			return addMonths(date, n);
		case 'year':
			return addYears(date, n);
	}
}

export function unitsBetween(start: Date, end: Date, unit: ZoomUnit): number {
	switch (unit) {
		case 'day':
			return differenceInDays(end, start);
		case 'week':
			return differenceInCalendarWeeks(end, start, WEEK_OPTIONS);
		case 'month':
			return differenceInCalendarMonths(end, start);
		case 'year':
			return differenceInCalendarYears(end, start);
	}
}

export function dateToX(date: Date, origin: Date, zoom: ZoomLevel): number {
	return unitsBetween(origin, date, zoom.unit) * zoom.colWidth;
}

export function xToDate(x: number, origin: Date, zoom: ZoomLevel): Date {
	const cols = Math.round(x / zoom.colWidth);
	return addUnits(origin, cols, zoom.unit);
}

export function snapDate(date: Date, snap: SnapUnit): Date {
	switch (snap) {
		case 'day':
			return startOfDay(date);
		case 'week':
			return startOfWeek(date, WEEK_OPTIONS);
		case 'month':
			return startOfMonth(date);
	}
}

export type BarRect = { x: number; width: number };

/**
 * Assignment 終端の列 index (exclusive)。
 * unit 境界に揃っていれば endCol、揃っていなければ endCol + 1(部分カラムを含めて描画)。
 * `barRect` の span 計算と `maxEndCol` の canvas 幅計算で共通利用。
 */
export function endColExclusive(date: Date, origin: Date, unit: ZoomUnit): number {
	const endCol = unitsBetween(origin, date, unit);
	const aligned = startOfUnit(date, unit).getTime() === date.getTime();
	return aligned ? endCol : endCol + 1;
}

/**
 * Assignment 配列のうち最も先まで延びる終端の列 index を返す。
 * 空配列および全 origin より前の場合は 0(canvas を縮めない)。
 */
export function maxEndCol(assignments: Assignment[], origin: Date, unit: ZoomUnit): number {
	let max = 0;
	for (const a of assignments) {
		const c = endColExclusive(a.endDate, origin, unit);
		if (c > max) max = c;
	}
	return max;
}

export function barRect(assignment: Assignment, origin: Date, zoom: ZoomLevel): BarRect {
	const startCol = unitsBetween(origin, assignment.startDate, zoom.unit);
	const endCol = endColExclusive(assignment.endDate, origin, zoom.unit);
	const span = Math.max(endCol - startCol, 1);
	return { x: startCol * zoom.colWidth, width: span * zoom.colWidth };
}

export function viewportColumns(viewportStart: Date, count: number, unit: ZoomUnit): Date[] {
	const start = startOfUnit(viewportStart, unit);
	return Array.from({ length: count }, (_, i) => addUnits(start, i, unit));
}

/**
 * 週の月曜日が属する月の何週目か(1-origin)。
 *
 * 慣例 A: 月境界をまたぐ週は「月曜日のある月」に帰属する。
 *   例: 2026-05-04 (Mon) → May W1
 *       2026-04-27 (Mon, 翌週は May 3 まで) → April W4
 *       2026-06-01 (Mon, 月初が月曜) → June W1
 *
 * date-fns の `format(date, 'W')` は weekStartsOn:1 で第1週が W2 を返すバグがあるため自前実装。
 * 参考: https://github.com/date-fns/date-fns/issues/1566
 */
export function weekOfMonth(date: Date): number {
	const monday = startOfWeek(date, WEEK_OPTIONS);
	const monthStart = startOfMonth(monday);
	// monthStart の曜日 (0=Sun, 1=Mon, ..., 6=Sat) → 最初の月曜までのオフセット
	const dow = monthStart.getDay();
	const offsetToFirstMonday = dow === 1 ? 0 : (8 - dow) % 7;
	const firstMonday = addDays(monthStart, offsetToFirstMonday);
	return differenceInCalendarWeeks(monday, firstMonday, WEEK_OPTIONS) + 1;
}

/**
 * 同一行内 Assignment の lane index を計算する(Greedy First-Fit / interval graph coloring)。
 * 時刻順 sort → 各 lane の最終 endDate を track → 空いている最小 index lane に割り当て。
 *
 * 戻り値:
 * - lanes: assignment.id → lane index (0-origin)
 * - laneCount: そのリソースで使われた lane 総数(行高さ計算用)
 */
export function allocateLanes(assignments: Assignment[]): {
	lanes: Map<string, number>;
	laneCount: number;
} {
	const sorted = [...assignments].sort((a, b) => +a.startDate - +b.startDate);
	const laneEnds: Date[] = [];
	const lanes = new Map<string, number>();
	for (const a of sorted) {
		let i = laneEnds.findIndex((e) => e <= a.startDate);
		if (i === -1) {
			i = laneEnds.length;
			laneEnds.push(a.endDate);
		} else {
			laneEnds[i] = a.endDate;
		}
		lanes.set(a.id, i);
	}
	return { lanes, laneCount: laneEnds.length };
}
