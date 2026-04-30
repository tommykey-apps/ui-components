---
'@tommykey-apps/ui-components': minor
---

同一リソース内で時間が重複する Assignment を **縦に積む(vertical stacking)** ようになった。

実装:
- `projection.ts` に **`allocateLanes`** 関数を追加(Greedy First-Fit / interval graph coloring)
- `ResourceTimeline.svelte` の各行高さが lane 数に応じて動的に拡張
- Bar の y 座標が `row.rowTop + laneIndex * (barHeight + laneGap)` に
- 行跨ぎ drag 判定を等高ロジックから `rowLayouts` 検索に変更(動的高さで正しく判定)

新規 props:
- `barHeight` (default 32): 各バーの高さ
- `laneGap` (default 4): lane 間 gap

既存の `rowHeight` は「単一 lane 行の最低高さ」として継続利用。
