---
'@tommykey-apps/ui-components': minor
---

業界標準の Gantt navigation UI を実装(scrollbar styling アプローチの代替、過去 2 回 revert を踏まえた設計)。

**新規**:
- **`<TimelineToolbar>`**: Today / Prev / Next / Zoom 切替を一括提供。`bind:viewportStart bind:zoom` で双方向束縛。inline SVG icons(phosphor MIT path 同梱)、CSS 変数で theme 可能、ライブラリ依存ゼロ
- **drag-to-pan**: `ResourceTimeline` の canvas 空白領域マウスドラッグで横スクロール(threshold 5px、1:1 感度、`setPointerCapture` 使用、Bar 上は除外)
- **`viewportStart` を `$bindable`**: Toolbar との連携 + 消費アプリからの制御を可能に
- `viewportStart` / `zoom` 変更時に scrollLeft 自動 0 リセット(drag-pan 残留を消す)

**新 props (TimelineToolbar)**: `zooms` / `step` / `today` / `showZoom` / `showToday` / `showNav` / `labels` / `ariaLabels` / `onTodayClick` / `onNavigate` / `onZoomChange`

**新 CSS 変数**: `--ui-toolbar-*` 系(theme 可)

**設計判断**: scrollbar の見た目には触らず、業界 92% の drag-to-pan + 67% の Today + 50% の Prev/Next で discoverability を担保。Chromium Fluent overlay の auto-fade は受容(全 Gantt 製品が受容、CSS で override 不能仕様)。
