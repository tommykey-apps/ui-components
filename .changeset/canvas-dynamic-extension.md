---
'@tommykey-apps/ui-components': patch
---

横スクロール時に grid (背景の罫線) が canvas 末端で途切れる問題を修正。

canvas 列数を `Math.max(visibleCols, 全 Assignment の最遠 endDate + bufferCols)` で動的拡張し、headers / grid-row / canvas が末端まで描画されるようになった。

新規 props:
- `bufferCols` (default 7): canvas 末端のスクロール余白(列数)

projection.ts に `endColExclusive` / `maxEndCol` ヘルパを追加。`barRect` を `endColExclusive` 経由でリファクタ(挙動は同じ、コード重複削減)。
