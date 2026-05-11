/**
 * 要素の `scrollWidth` (描画したい総幅) が `clientWidth` (見えている container 幅) を超えていれば
 * `text-overflow: ellipsis` が発動して内容が切られている、と判定する純粋関数 (#23)。
 *
 * 純粋に数値比較なので unit test で完結。実 DOM 状態は呼び出し側 (Bar.svelte) が
 * `ResizeObserver` + `document.fonts.ready` 等で監視し、本関数に渡す。
 */
export function isTruncated(el: HTMLElement | null | undefined): boolean {
	if (!el) return false;
	return el.scrollWidth > el.clientWidth;
}
