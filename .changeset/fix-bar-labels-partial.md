---
'@tommykey-apps/ui-components': patch
---

fix(Bar): `labels` prop を partial 許容に緩和 (#59)

従来 `labels?: Required<BarLabels>` は「渡さなくて良い、 でも渡すなら全 key 必須」 という二択で、 `Bar` を直接 import する consumer が一部 key だけ override したい場合に型エラーになっていた。 bits-ui 流の primitive 設計に揃え、 `labels?: BarLabels` (任意 key optional) + 内部 fallback (`resolvedLabels` $derived) に変更。

`ResourceTimeline` 経由で渡される labels は従来通り `resolveLabels()` でフルセット化されており、 既存の behavior は変わらない (backward-compatible)。
