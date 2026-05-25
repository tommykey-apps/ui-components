---
'@tommykey-apps/ui-components': patch
---

fix(projection): `allocateLanes` で重複 assignment.id を DEV mode で警告 (#58)

従来は同一 id を含む assignments を渡すと `lanes.set(a.id, i)` で silent 上書きされ、 1 行に複数 lane を持つはずの consumer が「最初の bar しか表示されない」 ような状況に気づけなかった (#61 と表面化症状が一致するケース)。

DEV mode 時のみ `console.warn('[ResourceTimeline] duplicate assignment id: ${id}')` を出力し、 production には影響を与えない。 併せて `Assignment.id` の jsdoc に「一意 id 必須」 を明記。
