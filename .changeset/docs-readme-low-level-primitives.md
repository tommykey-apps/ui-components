---
'@tommykey-apps/ui-components': patch
---

docs(README): `Bar` / `snapDate` を low-level primitive として public export している意図を明記 (#71)

bits-ui 流の primitive 公開 pattern に従い、 `ResourceTimeline` の building block (`Bar`, `snapDate`) を意図的に export 維持していることを README に追記。 dead export ではなく advanced composition 用。 tree-shaking で未使用なら bundle に含まれないため defaults 利用者への悪影響なし。

API breaking なし、 documentation only。
