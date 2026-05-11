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
import type { BarLabels, TimelineLabels } from './types.js';

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
