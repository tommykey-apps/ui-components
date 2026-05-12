---
'@tommykey-apps/ui-components': patch
---

refactor(Bar): #48 で導入した自作 `composePointerHandler` を撤去し、 bits-ui 公式 pattern (`Tooltip.Trigger` に直接ハンドラを渡し `mergeProps` に任せる) に置き換え。

#48 では `unknown` キャストで型の逃げを作っていた。 bits-ui の child snippet 公式 docs を読み直すと、 自前ハンドラは Trigger コンポーネント自体に渡すのが正解 (内部の `mergeProps` で自動合成される)。 動的 class / style だけ child div に残し、 role / aria / event handler は全部 `Tooltip.Trigger` 側に移動。

- `composePointerHandler` 削除
- `unknown` cast 削除
- public API 不変

Refs: https://next.bits-ui.com/docs/child-snippet
