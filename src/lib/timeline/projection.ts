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

export function barRect(assignment: Assignment, origin: Date, zoom: ZoomLevel): BarRect {
	const startCol = unitsBetween(origin, assignment.startDate, zoom.unit);
	const endCol = unitsBetween(origin, assignment.endDate, zoom.unit);
	const endAligned =
		startOfUnit(assignment.endDate, zoom.unit).getTime() === assignment.endDate.getTime();
	const span = Math.max(endAligned ? endCol - startCol : endCol - startCol + 1, 1);
	return { x: startCol * zoom.colWidth, width: span * zoom.colWidth };
}

export function viewportColumns(viewportStart: Date, count: number, unit: ZoomUnit): Date[] {
	const start = startOfUnit(viewportStart, unit);
	return Array.from({ length: count }, (_, i) => addUnits(start, i, unit));
}
