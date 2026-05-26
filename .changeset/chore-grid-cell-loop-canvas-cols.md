---
'@tommykey-apps/ui-components': patch
---

chore(ResourceTimeline): grid-cell loop を `canvasCols` (number) で iterate (#75)

`columns` (Date[]) は header 描画用、 grid-cell loop では index しか使わないため `{ length: canvasCols }` で iterate に変更。 Date 配列の reactive dep を踏まずマイクロ最適化 + 意図が明確に。
