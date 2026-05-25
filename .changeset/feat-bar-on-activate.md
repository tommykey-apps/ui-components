---
'@tommykey-apps/ui-components': minor
---

feat(Bar): `onActivate` prop を追加 — pointer click + keyboard (Enter/Space) を unified に通知 (#85)

`Bar` / `ResourceTimeline` に `onActivate?: (assignment: Assignment) => void` prop を追加。 consumer (例: resource-planner) が bar クリックで detail dialog を起動する用途を想定。

WAI-ARIA Button pattern に準拠し、 React Aria の `usePress` 同思想で **input agnostic** な命名 (`onActivate`) を採用:

- pointer: `pointerup` 時に `Math.hypot(dx, dy) < 4px` (dnd-kit 系の慣例) なら drag ではなく click として `onActivate`
- keyboard: `Enter` / `Space` で `preventDefault` + `onActivate`
- resize handle 上の click では発火しない (`mode === 'move'` の時のみ)

既存 API (`onDragEnd` / `onResizeEnd` / `onKeyMove` / `onKeyResize` / `onMove` / `onResize`) は無変更。 additive な API 追加。
