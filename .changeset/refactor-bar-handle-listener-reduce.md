---
'@tommykey-apps/ui-components': patch
---

refactor(Bar): resize handle の listener を削減 (#63)

`startDrag` 内の `setPointerCapture(handle)` で handle が capture 元になると、 続く `pointermove` / `pointerup` / `pointercancel` は capture 経由で bubble path の親 `bar` listener に届く。 handle 側の 3 listener (`onpointermove` / `onpointerup` / `onpointercancel`) は redundant のため削除。

残るのは `onpointerdown` (mode 確定 + capture 取得) と `onkeydown` (handle focus 中の keyboard resize) のみ。 handle あたり 2 listener、 計 4 listener 削減。 動作不変。
