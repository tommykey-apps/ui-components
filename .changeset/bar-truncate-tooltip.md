---
'@tommykey-apps/ui-components': minor
---

feat(Bar): truncate されている時だけ hover tooltip (title 属性) で案件名を表示

bar が短い (zoom が広い / 期間が短い) と label が `text-overflow: ellipsis` で切られて何のアサインか視覚的に分からなかった。`ResizeObserver` + `document.fonts.ready` + `tick()` で label 要素の `scrollWidth > clientWidth` を監視し、truncate されている時のみ `title` 属性を渡すよう変更。
- truncate されてない時は title 属性自体を出さない (常時 hover popup を防ぐ)
- `aria-label` は引き続き常に提供 (screen reader 体験は変えない)
- zoom 変更 / drag resize / label 文字列変更 / font load 後 すべてに reactive
