---
'@tommykey-apps/ui-components': patch
---

refactor: `createPointerDrag` helper を抽出して canvas drag-to-pan を集約 (#67)

`setPointerCapture` パターン (pointerdown で capture → 続く pointermove / pointerup / pointercancel を同 listener で拾う) を `pointer-drag.ts` の `createPointerDrag(opts)` factory に集約。 closure 内に start coords / pointerId を閉じ込めることで、 caller は `onPointerDown` / `onPointerMove` / `onPointerUp` の 3 関数を template に bind するだけ。 unit test 可能 (vitest で 6 ケース追加)。

採用箇所: `ResourceTimeline` の canvas drag-to-pan。

採用しない箇所 (**AHA 原則**「不適切な abstraction より duplication」): `Bar.svelte` の drag / resize は mode 切替 (move / resize-start / resize-end) と 2D delta + threshold check が closure 内 state と密結合しており、 共通化すると caller 側で mode 判定が増え helper の汎用性メリットが消えるため維持。
