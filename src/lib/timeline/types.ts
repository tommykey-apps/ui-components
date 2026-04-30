export type Resource = {
	id: string;
	name: string;
};

export type Assignment = {
	id: string;
	resourceId: string;
	/**
	 * 開始日時。**ローカル深夜の Date を推奨**: `new Date(2026, 4, 4)`。
	 * UTC 表現 (`new Date('2026-05-04T00:00:00Z')`) は非 UTC 環境(JST 等)で末端列が +1 col 太く描画されるため非推奨。
	 */
	startDate: Date;
	/**
	 * 終了日時(排他的, end-exclusive)。`startDate` と同じく**ローカル深夜の Date 推奨**。
	 * unit boundary に揃っている場合は span = endCol - startCol、揃っていない場合は +1 col(部分カラムを含めて描画)。
	 */
	endDate: Date;
	label?: string;
	color?: string;
};

export type ZoomUnit = 'day' | 'week' | 'month' | 'year';

export type SnapUnit = 'day' | 'week' | 'month';

export type HeaderTier = {
	unit: ZoomUnit;
	/** date-fns format string。`format` が指定されていない場合に使用 */
	fmt?: string;
	/** カスタムフォーマッタ。指定されていれば `fmt` より優先 */
	format?: (date: Date) => string;
};

export type ZoomLevel = {
	id: 'day' | 'week' | 'month' | 'year';
	unit: ZoomUnit;
	colWidth: number;
	visibleCols: number;
	snapUnit: SnapUnit;
	headers: HeaderTier[];
};
