/**
 * Default values for {@link TimelineLabels} (#33)。
 *
 * **English defaults** — library が world-wide consumer 向けなので。 consumer は
 * \`labels\` prop で locale 済に override する。
 *
 * `resolveLabels()` は partial override を default に merge して、 component が常に
 * 全 key を読めるよう保証する純粋関数。 deep merge せず 1 段ネストまで (本 API の
 * shape に合わせ)。
 */
import type { BarLabels } from './types.js';

/**
 * #65: ResolvedTimelineLabels が canonical な型。 `TimelineLabels` (consumer prop) は
 * DeepPartial で派生させ、 key 追加時の 2 重定義同期忘れを防ぐ。 function value は
 * partial 化せずそのまま (override は関数単位で置換する想定)。
 */
type DeepPartial<T> = T extends (...args: never[]) => unknown
	? T
	: { [K in keyof T]?: DeepPartial<T[K]> };

export type ResolvedTimelineLabels = {
	bar: Required<BarLabels>;
	canvas: { region: string };
	status: {
		move: (range: string) => string;
		resizeStart: (range: string) => string;
		resizeEnd: (range: string) => string;
		keyMove: (range: string) => string;
		keyResizeStart: (range: string) => string;
		keyResizeEnd: (range: string) => string;
	};
};

export type TimelineLabels = DeepPartial<ResolvedTimelineLabels>;

export const DEFAULT_TIMELINE_LABELS: ResolvedTimelineLabels = {
	bar: {
		resizeStart: 'Resize start',
		resizeEnd: 'Resize end'
	},
	canvas: {
		region: 'Timeline canvas'
	},
	status: {
		move: (range) => `Moved ${range}`,
		resizeStart: (range) => `Start date changed: ${range}`,
		resizeEnd: (range) => `End date changed: ${range}`,
		keyMove: (range) => `Moved by keyboard: ${range}`,
		keyResizeStart: (range) => `Start date changed by keyboard: ${range}`,
		keyResizeEnd: (range) => `End date changed by keyboard: ${range}`
	}
};

export function resolveLabels(overrides?: TimelineLabels): ResolvedTimelineLabels {
	return {
		bar: { ...DEFAULT_TIMELINE_LABELS.bar, ...overrides?.bar },
		canvas: { ...DEFAULT_TIMELINE_LABELS.canvas, ...overrides?.canvas },
		status: { ...DEFAULT_TIMELINE_LABELS.status, ...overrides?.status }
	};
}

/**
 * #66: TimelineToolbar 用 labels の canonical 型。 inline 定義から labels.ts に集約。
 *
 * `labels` (visible button text) と `ariaLabels` (icon-only button の aria-label) を
 * TimelineToolbar prop で 2 つ受けるが、 type は同一 → consumer が覚える型は 1 つだけ。
 *
 * a11y best practice (WAI-ARIA APG): icon-only button (prev/next) は aria-label 必須、
 * text button (today/zoom) は visible text が name 兼任。 1 type で両者を表現し、
 * consumer が用途に応じて該当 key だけ override する。
 */
export type ToolbarLabels = {
	today?: string;
	prev?: string;
	next?: string;
	zoom?: string;
	zoomDay?: string;
	zoomWeek?: string;
	zoomMonth?: string;
	zoomYear?: string;
};

export const DEFAULT_TOOLBAR_LABELS: Required<ToolbarLabels> = {
	today: 'Today',
	prev: 'Previous',
	next: 'Next',
	zoom: 'Zoom',
	zoomDay: 'Day',
	zoomWeek: 'Week',
	zoomMonth: 'Month',
	zoomYear: 'Year'
};
