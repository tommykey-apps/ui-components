---
'@tommykey-apps/ui-components': patch
---

fix(Bar): #42 で追加した cursor follow ハンドラが bits-ui Tooltip の hover 検出を壊していた問題を修正。

`Tooltip.Trigger` の child snippet props には bits-ui の `onpointerenter / pointermove /
pointerleave` が含まれる。 これを上書きすると bits-ui の hover 検出が起動せず、 **real hover
で tooltip 自体が開かなくなる** バグになっていた (#42 PR で StoryBook 確認時に `.focus()`
迂回していたため見逃した)。

`composePointerHandler` で bits-ui ハンドラを先に呼んでから自前の cursor 追跡を実行する形に
修正。 keyboard focus 経路も影響なし。
