---
'@tommykey-apps/ui-components': patch
---

`.timeline` のスクロールバーを **常時薄表示 + ホバーで強調** に変更。macOS の overlay scrollbar 仕様で「右にもっと続いていることが分からない」UX 問題を解消(`overflow-x: scroll` でも見えなかった問題)。

- 標準 `scrollbar-color` / `scrollbar-width: thin` を主、`::-webkit-scrollbar` を fallback
- `@supports selector(::-webkit-scrollbar) and (not (scrollbar-color: auto))` で出し分け(両方適用すると webkit-pseudo が無効化される仕様への対策)
- 新 CSS 変数: `--ui-scrollbar-thumb` / `--ui-scrollbar-thumb-hover` / `--ui-scrollbar-size`
- `@media (any-hover: none)` で pure-touch デバイスは透明化(マウス付き iPad は通常表示)
- `scrollbar-gutter: stable` で classic モード時のレイアウト揺れを防止
