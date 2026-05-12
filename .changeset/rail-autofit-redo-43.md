---
'@tommykey-apps/ui-components': minor
---

feat(ResourceTimeline): resource rail (左 sticky 列) を最長名に auto-fit する機能を **JS 測定
+ CSS 変数 pattern** で再実装 (#43)。

過去 (#34, PR #161) の `minmax(min, fit-content(max))` 実装は子要素 `position: sticky` との
相互作用で column 1 が 1px に collapse する本番事故を起こした。 今回は CSS Grid の track sizing
に依存せず、 off-flow probe span でテキスト本来の幅を測定 → `computeRailWidth()` で clamp →
CSS 変数 `--ui-resource-col-width` に流し込む方式に切り替える。

- 新規 helper `computeRailWidth(widths, { min, max, padding })`: 純粋関数、 9 ケース緑
- `ResourceTimeline.svelte` に `nameEls` ref 配列 + ResizeObserver + `document.fonts.ready`
  追従の `$effect` を追加
- `.resource-row-probe` (\`position: absolute; visibility: hidden;\`) を各行に並べてテキスト
  本来の幅を測定 (grid track の幅を継承しない)
- `resourceColWidth='auto'` 利用時のみ JS 測定経路。 数値指定 (default 200) は静的 CSS 変数で
  従来と完全同等
- 公開 API は不変、 `resourceColWidth: number | 'auto'` の signature 維持
