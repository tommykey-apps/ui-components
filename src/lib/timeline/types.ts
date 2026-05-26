export type Resource = {
	id: string;
	name: string;
};

export type Assignment = {
	/** 一意 id。 同一 array 内で重複すると lane allocation が silent 上書きされる (DEV mode で console.warn)。 */
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
	/**
	 * セル文字列を返す。 string なら date-fns `format(date, fmt)` で評価、
	 * 関数なら直接 call。 #74: 旧 `fmt` / `format` 2 field を統合。
	 */
	fmt: string | ((date: Date) => string);
};

export type ZoomLevel = {
	/** #74: `ZoomUnit` と完全一致するため alias で統一 */
	id: ZoomUnit;
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
 *
 * #65: canonical 型は `labels.ts` の `ResolvedTimelineLabels` で、 これは DeepPartial 派生。
 * 2 重定義を避けるため re-export のみ。
 */
export type { TimelineLabels, ResolvedTimelineLabels } from './labels.js';
