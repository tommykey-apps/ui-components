---
'@tommykey-apps/ui-components': patch
---

横スクロール discoverability を OS 非依存に改善。

- 右端 edge mask(linear-gradient で `--ui-bg` に向けて fade)で「もっと右にあるよ」を全ブラウザで affordance 表示
- scroll-driven animation 対応ブラウザ(Chrome 115+/Safari 26+)では末尾到達時に edge mask の opacity が 0 へ
- Native scrollbar を `scrollbar-color`(モダン標準) + `::-webkit-scrollbar`(legacy fallback)で常時薄表示+hover で強調
- WCAG 3:1 contrast を満たす thumb 色をデフォルトに(`oklch(0.7 0 0)` → hover `oklch(0.45 0 0)`)
- タッチ専用端末(`@media not (any-hover: hover)`)では scrollbar 透明、edge mask のみで affordance

新規 CSS 変数:
- `--ui-scrollbar-thumb`
- `--ui-scrollbar-thumb-hover`
- `--ui-scrollbar-size`
- `--ui-edge-fade-width`(0 で edge mask 無効化可)

macOS の "Show Scroll Bars: When Scrolling"(システムデフォルト)では `scrollbar-color` 仕様で無視されるが、edge mask によって全環境で affordance を担保。
