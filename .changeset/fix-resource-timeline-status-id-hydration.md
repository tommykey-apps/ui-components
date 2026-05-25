---
'@tommykey-apps/ui-components': patch
---

fix(ResourceTimeline): `statusId` を `$props.id()` で SSR-stable な生成に変更 (#56)

従来 `Math.random()` 由来の id を script 評価時に生成しており、SSR と client hydration で別 id になることで `aria-describedby` の参照が成立しなくなる hydration mismatch があった。 Svelte 5 公式の `$props.id()` (component instance 単位で SSR-stable) に置き換え。
