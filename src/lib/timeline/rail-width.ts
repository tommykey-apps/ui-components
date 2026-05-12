/**
 * resource rail の幅を最長名に合わせて clamp する pure helper。
 * 測定 (canvas / DOM) は呼び出し側に委譲、 ここは「widths → clamped px」 計算のみ。
 *
 * sticky 子要素と CSS Grid track sizing が両立しないため track sizing には依存せず
 * JS 実測 + CSS 変数注入で実現する設計 (詳細は #43)。
 */

export type RailWidthOptions = {
	min: number;
	max: number;
	padding: number;
};

export function computeRailWidth(widths: number[], { min, max, padding }: RailWidthOptions): number {
	// 設定ミス (min > max) でも 1px collapse させない: min を優先する
	const ceiling = Math.max(min, max);

	// NaN / 負値は無視、 空 / 全 NaN なら min を返す (resources 未登録 / measure 前を吸収)
	const valid = widths.filter((w) => Number.isFinite(w) && w >= 0);
	if (valid.length === 0) return min;

	const longest = Math.max(...valid);
	const target = longest + padding;
	return Math.min(ceiling, Math.max(min, target));
}
