---
"@tommykey-apps/ui-components": patch
---

ResourceTimeline: 長い resource 名が left rail を canvas 領域に侵食する問題を修正。

- `.resources` aside に `width: var(--ui-resource-col-width, 200px)` を追加 (default 200px、消費アプリで上書き可能)
- `.resource-row` の text に `overflow: hidden; white-space: nowrap; text-overflow: ellipsis` を追加
- マークアップに `title={row.resource.name}` を追加して full name を hover で確認可能に

Workaround を伴わずに resource-planner #95 の Timeline 左 rail overflow が解消する。
