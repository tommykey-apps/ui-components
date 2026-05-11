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

/**
 * Bar 内の各 part の aria-label。 ライブラリ default は英語、 consumer が locale 済を渡せる。
 * #33: アクセシビリティのため hidden text として常時付与される文字列。
 */
export type BarLabels = {
	/** 開始日リサイズ handle */
	resizeStart?: string;
	/** 終了日リサイズ handle */
	resizeEnd?: string;
};

/**
 * ResourceTimeline 全体に渡る i18n 文字列。 consumer の locale に追従させる場合は
 * \`<ResourceTimeline labels={...}>\` で override する。 default は **英語**。
 */
export type TimelineLabels = {
	bar?: BarLabels;
	canvas?: {
		/** \`<div role="region" aria-label="...">\` */
		region?: string;
	};
	/**
	 * 操作後に aria-live="polite" な status 要素に流れる文言。 receive する引数は
	 * 「YYYY-MM-DD 〜 YYYY-MM-DD」 形式の range 文字列。 consumer 側で template を組む。
	 */
	status?: {
		move?: (range: string) => string;
		resizeStart?: (range: string) => string;
		resizeEnd?: (range: string) => string;
		keyMove?: (range: string) => string;
		keyResizeStart?: (range: string) => string;
		keyResizeEnd?: (range: string) => string;
	};
};
