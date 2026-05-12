---
'@tommykey-apps/ui-components': patch
---

refactor(ResourceTimeline): rail 幅測定を Canvas `measureText` に切り替え (#43 follow-up)。

PR #46 で導入した off-flow DOM probe (resource × 1 余分な span + ResizeObserver) を撤去し、
MDN / Erik Onarheim 推奨の Canvas `measureText` pattern に置き換える。

- 新規 `createCanvasMeasurer(font)` helper: module-scope canvas を再利用、 SSR safe (null fallback)
- DOM 重複ゼロ、 reflow 不要、 ResizeObserver 不要、 O(N) 同期測定
- font は `.resource-row` の computedStyle から shorthand を構築して canvas に流す
- `computeRailWidth()` clamp 純関数は再利用 (signature 不変)
- 公開 API 不変 (`resourceColWidth: number | 'auto'`)

Refs:
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText
- https://erikonarheim.com/posts/canvas-text-metrics/
