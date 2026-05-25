---
'@tommykey-apps/ui-components': minor
---

feat(ResourceTimeline): `onResize` callback に `edge` 情報を渡す (#68)

`onResize?: (assignment: Assignment) => void` → `(assignment: Assignment, edge?: 'start' | 'end') => void` に signature 拡張。 旧 consumer `(updated) => ...` は edge を無視するので **backward-compatible**。

従来は `Bar.onResizeEnd(edge, dx)` から `edge` 情報が `ResourceTimeline.onResize` に伝達されず、 consumer が「どっち側の handle で resize されたか」 を判断したい時に updated と前回値を diff する必要があった。 transparently に edge を 2nd 引数で expose。

`onKeyResize` 経由の resize でも同様に edge を渡す。
