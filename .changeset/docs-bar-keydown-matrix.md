---
'@tommykey-apps/ui-components': patch
---

docs(Bar): `handleKeydown` の modifier matrix を JSDoc に明記 (#72)

Bar body focus 時の Arrow + modifier 組合せ (none / Alt / Shift / Shift+Alt) と各操作 (move / resize / no-op) を JSDoc 内表で明記。

`Alt+ArrowUp/Down` は「縦方向 resize」 が概念的に存在しないため意図的に no-op + native default 通過 (WAI-ARIA APG の「desktop convention に従う」 方針)。 動作変更なし、 documentation only。
