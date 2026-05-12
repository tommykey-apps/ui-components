---
'@tommykey-apps/ui-components': patch
---

fix(Bar): hover tooltip がカーソルではなく bar 中央 anchor になり、 wide bar (例 6 ヶ月案件) で
画面端に貼りつく問題を修正 (#42)。

- 新規 helper `createCursorAnchor(clientX, clientY)` で floating-ui virtual element を生成
- `Bar.svelte` の `pointerenter / pointermove / pointerleave` で cursor 座標を追跡し、
  bits-ui `Tooltip.Content` の `customAnchor` prop に渡す
- `side="top" align="start" sideOffset={12} alignOffset={12}` でカーソル右上に追従
- keyboard focus / touch では `cursorAnchor` が null のまま、 bits-ui default
  (trigger 要素 anchor) に fallback
- viewport 端では floating-ui の `shift` middleware が自動で位置補正
