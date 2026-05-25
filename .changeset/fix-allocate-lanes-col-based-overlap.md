---
'@tommykey-apps/ui-components': patch
---

fix(projection): `allocateLanes` を col 単位の重複判定にも対応 (#61)

year/month zoom で同一 resource の複数 assignment が時間軸では非重複でも描画 col 上で同位置に詰まり、 後勝ち 1 件しか見えない問題を修正。

`allocateLanes(assignments, { origin, unit })` のように optional 引数を追加し、 col 単位 (`endColExclusive`) で重複判定するパスを追加。 ResourceTimeline は zoom.unit / origin を渡し、 vis-timeline / Bryntum 等で標準の vertical stacking 戦略に合わせて lane 数を増やす。 行高さは既存 `rowLayouts` が `laneCount` ベースで動的計算しているので自動的に伸びる。

day zoom 等 fine-grained では時間軸ベースと結果一致するため backward-compatible。 引数なし call (公開 API として直接使う想定があれば) は従来の時間軸判定で動作。
