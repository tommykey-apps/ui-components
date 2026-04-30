import type { Assignment, Resource } from '$lib/timeline/types.js';

export const RESOURCES: Resource[] = [
	{ id: 'tanaka', name: '田中 太郎' },
	{ id: 'suzuki', name: '鈴木 花子' },
	{ id: 'sato', name: '佐藤 一郎' },
	{ id: 'takahashi', name: '高橋 二郎' },
	{ id: 'ito', name: '伊藤 三郎' }
];

const d = (s: string) => new Date(`${s}T00:00:00Z`);

export const ASSIGNMENTS: Assignment[] = [
	{
		id: 'a1',
		resourceId: 'tanaka',
		startDate: d('2026-05-04'),
		endDate: d('2026-05-15'),
		label: 'A社 案件',
		color: '#4f46e5'
	},
	{
		id: 'a2',
		resourceId: 'tanaka',
		startDate: d('2026-05-18'),
		endDate: d('2026-06-01'),
		label: 'B社 改修',
		color: '#0ea5e9'
	},
	{
		id: 'a3',
		resourceId: 'suzuki',
		startDate: d('2026-05-04'),
		endDate: d('2026-05-22'),
		label: 'C社 PoC',
		color: '#10b981'
	},
	{
		id: 'a4',
		resourceId: 'sato',
		startDate: d('2026-05-11'),
		endDate: d('2026-05-25'),
		label: '社内ツール',
		color: '#f59e0b'
	},
	{
		id: 'a5',
		resourceId: 'takahashi',
		startDate: d('2026-05-04'),
		endDate: d('2026-06-08'),
		label: 'D社 長期',
		color: '#ef4444'
	},
	{
		id: 'a6',
		resourceId: 'ito',
		startDate: d('2026-05-25'),
		endDate: d('2026-06-15'),
		label: 'E社 設計',
		color: '#8b5cf6'
	}
];

export const VIEWPORT_START = d('2026-05-04');
