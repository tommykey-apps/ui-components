---
'@tommykey-apps/ui-components': patch
---

`Assignment` の `startDate` / `endDate` に「ローカル深夜 Date 推奨」JSDoc を追加。Storybook fixtures を local-midnight 形式 (`new Date(yyyy, m-1, d)`) に変換。

UTC 文字列 (`new Date('2026-05-04T00:00:00Z')`) を渡すと非 UTC 環境(JST 等)で `barRect` の aligned 判定が外れて末端列が +1 col 余計に太く描画される挙動の補足ドキュメント。
