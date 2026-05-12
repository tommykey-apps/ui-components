/**
 * #43: resource rail (左 sticky 列) の幅を最長名に合わせて自動計算する pure helper。
 *
 * 過去 (#34, PR #161) は CSS Grid \`minmax(min, fit-content(max))\` で実装したが、
 * 子要素の \`position: sticky\` と track sizing の相互作用で **column が 1px に潰れる** 本番
 * 事故になった。 今回は JS で実測 → clamp → CSS 変数注入の pattern に切り替える。
 *
 * この関数自体は ResizeObserver / fonts.ready / DOM measure を呼び出し側に委譲し、
 * 「測定済み width 配列 → clamped px」 の純粋計算だけを担当する。
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
