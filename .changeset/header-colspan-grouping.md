---
'@tommykey-apps/ui-components': minor
---

二段ヘッダで連続する同一値を col-span でグルーピング。

DayZoom の上段で "2026/05" が 14 回繰り返されていた状態を 1 セル(14col span)に統合。
WeekZoom 上段は月ごと、MonthZoom 上段は年ごとにグループ化される。

実装: `groupHeaderCells()` でランレングス計算 → `$derived` で `headerTiers` に展開 → `.header-cell` に `width = span * colWidth` を流す。CSS には変更なし。
