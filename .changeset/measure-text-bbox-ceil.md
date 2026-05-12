---
'@tommykey-apps/ui-components': patch
---

fix(measure-text): `metrics.width` (advance) ではなく `actualBoundingBoxLeft + actualBoundingBoxRight` (実描画 bbox) を採用、 subpixel 安定化のため `Math.ceil` で整数化。

CI で `scrollWidth=274 > clientWidth=273` の 1px overflow による ellipsis 切れが発生していた。 原因は Canvas `measureText().width` が **advance width** (字送り) で実描画 bbox とは異なるため。 MDN / Erik Onarheim 推奨の `abs(actualBoundingBoxLeft) + abs(actualBoundingBoxRight)` を採用し、 一部 script (CJK 等) で advance > bbox になりうるので両者の `max` を取る形に修正。

- 新規 `pickRenderedWidth(metrics)` pure helper (unit test 5 ケース緑)
- `createCanvasMeasurer` の戻り値を `metrics.width` → `pickRenderedWidth(metrics)` に置換
- 公開 API 不変

Refs:
- https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
- https://erikonarheim.com/posts/canvas-text-metrics/
