---
'@tommykey-apps/ui-components': patch
---

refactor(ResourceTimeline): 4 callback の重複 pattern を `buildMovedAssignment` / `buildResizedAssignment` の 2 helper に集約 (#62)

`onDragEnd` / `onResizeEnd` / `onKeyMove` / `onKeyResize` で 4 重複していた「Assignment patch + bounds check」 を **move 軸と resize 軸の 2 helper** に分離して集約。 issue 案 (1 関数 + tagged union) は型が複雑化するため AHA 原則に従い「変化する軸」 (move vs resize) で分割。

- `buildMovedAssignment(base, { colDelta, newResourceId })`: 移動 + 行跨ぎを 1 関数で。 no-op 時は `null` を return
- `buildResizedAssignment(base, edge, colDelta)`: edge ('start' | 'end') 別の bounds check + patch。 反転 (start ≥ end / end ≤ start) 時は `null` を return

各 callback は 「特殊前処理 (dx → colDelta、 dy → newRow 等) → helper → status + dispatch」 の 3 段に整理、 4 callback 合計で約 60 行 → 約 35 行に圧縮。 動作不変。
