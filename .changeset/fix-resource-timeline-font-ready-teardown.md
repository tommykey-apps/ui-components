---
'@tommykey-apps/ui-components': patch
---

fix(ResourceTimeline): `document.fonts.ready.then(remeasure)` に teardown を追加 (#57)

`$effect` 内で `document.fonts.ready.then(remeasure)` を呼んでいたが、 Promise は cancel 不可で unmount や effect 再 run 後にも resolve する。 resolve 後の `remeasure` が `measuredRailWidth` (`$state` への write) や `timelineEl.querySelector(...)` を実行し、 orphan DOM 参照を引く恐れがあった。

Svelte 公式の teardown function 内で `cancelled = true` を立て、 `remeasure` 冒頭で gate するパターンに変更。
