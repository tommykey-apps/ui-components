---
'@tommykey-apps/ui-components': patch
---

横スクロール時に日付ヘッダーが canvas と一緒に動かないバグを修正。

`ResourceTimeline.svelte` を「単一スクロール容器 + position: sticky」パターンに変更:

- `.timeline` 自身が `overflow: auto` の唯一のスクロール容器に
- `.corner` (z-index:3) / `.headers` (z-index:2) / `.resources` (z-index:2) を `position: sticky` で固定
- 中間ラッパだった `.canvas-wrap` を削除
- 縦スクロール時にも resource 列が左端固定で追従(親に max-height があれば)
- iOS Safari の momentum scroll 対応(`-webkit-overflow-scrolling: touch`)

`Bar` の絶対座標配置と座標計算ロジック、props はすべて無変更で API 互換。
