import type { ZoomLevel } from './types.js';
import { weekOfMonth } from './projection.js';

export const ZOOMS: Record<'day' | 'week' | 'month' | 'year', ZoomLevel> = {
	day: {
		id: 'day',
		unit: 'day',
		colWidth: 64,
		visibleCols: 14,
		snapUnit: 'day',
		headers: [
			{ unit: 'month', fmt: 'yyyy/MM' },
			{ unit: 'day', fmt: 'd(EEE)' }
		]
	},
	week: {
		id: 'week',
		unit: 'week',
		colWidth: 80,
		visibleCols: 12,
		snapUnit: 'day',
		headers: [
			{ unit: 'month', fmt: 'yyyy/MM' },
			{ unit: 'week', format: (d) => `W${weekOfMonth(d)}` }
		]
	},
	month: {
		id: 'month',
		unit: 'month',
		colWidth: 96,
		visibleCols: 12,
		snapUnit: 'week',
		headers: [
			{ unit: 'year', fmt: 'yyyy' },
			{ unit: 'month', fmt: 'MMM' }
		]
	},
	year: {
		id: 'year',
		unit: 'year',
		colWidth: 120,
		visibleCols: 5,
		snapUnit: 'month',
		headers: [{ unit: 'year', fmt: 'yyyy' }]
	}
};
