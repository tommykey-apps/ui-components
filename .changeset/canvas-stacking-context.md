---
'@tommykey-apps/ui-components': patch
---

fix(ResourceTimeline): drag/resize 中の Bar が sticky な resource rail / header より手前に表示される問題を修正

`.canvas` に `isolation: isolate` を追加して自身の stacking context を分離。drag 中の bar の `z-index: 10` は canvas 内部だけで評価され、canvas 全体は親 grid 内で auto (= 0) のまま sticky 領域 (z-index: 2/3) より下に保たれる。
