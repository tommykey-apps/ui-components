export type Resource = {
	id: string;
	name: string;
};

export type Assignment = {
	id: string;
	resourceId: string;
	startDate: Date;
	endDate: Date;
	label?: string;
	color?: string;
};

export type ZoomUnit = 'day' | 'week' | 'month' | 'year';

export type SnapUnit = 'day' | 'week' | 'month';

export type HeaderTier = {
	unit: ZoomUnit;
	fmt: string;
};

export type ZoomLevel = {
	id: 'day' | 'week' | 'month' | 'year';
	unit: ZoomUnit;
	colWidth: number;
	visibleCols: number;
	snapUnit: SnapUnit;
	headers: HeaderTier[];
};
