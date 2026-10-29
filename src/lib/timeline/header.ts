import { format, type Locale } from 'date-fns';
import type { HeaderTier } from './types.js';

export type HeaderGroup = { value: string; span: number; startIdx: number };

/**
 * 見出しの列を文字列化し、 連続する同一値を span でまとめる (年表示の繰り返し回避)。
 * string の fmt は date-fns `format` に locale 付きで渡す。 locale 未指定は英語。
 * 関数の fmt は locale を受け取らないので consumer 側で表記を決める。
 */
export function groupHeaderCells(cells: Date[], tier: HeaderTier, locale?: Locale): HeaderGroup[] {
	// #74: tier.fmt は string | ((Date) => string) の union (旧 fmt / format 2 field を統合)
	const { fmt } = tier;
	const fn = typeof fmt === 'function' ? fmt : (d: Date) => format(d, fmt, { locale });
	return cells.reduce<HeaderGroup[]>((acc, col, i) => {
		const value = fn(col);
		const last = acc[acc.length - 1];
		if (last && last.value === value) {
			last.span += 1;
		} else {
			acc.push({ value, span: 1, startIdx: i });
		}
		return acc;
	}, []);
}
