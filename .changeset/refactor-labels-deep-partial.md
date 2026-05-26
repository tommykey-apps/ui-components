---
'@tommykey-apps/ui-components': patch
---

refactor(labels): `TimelineLabels` を `ResolvedTimelineLabels` から `DeepPartial` 派生に統一 (#65)

従来は `types.ts` の `TimelineLabels` (全 optional) と `labels.ts` の `ResolvedTimelineLabels` (全必須) を 2 重に手書きしており、 status の key (move/resizeStart/resizeEnd/keyMove/keyResizeStart/keyResizeEnd) を 1 つ追加するたび両方同期する必要があった。

`labels.ts` で `type DeepPartial<T>` を定義し、 `TimelineLabels = DeepPartial<ResolvedTimelineLabels>` で派生。 `types.ts` からは `export type { ... } from './labels.js'` で re-export のみ。 function value (`status.move` 等) は partial 化対象外で関数単位置換のまま (`T extends (...args) => unknown ? T : { [K]?: ... }`)。

consumer から見た型 shape は同じ、 backward-compatible。 caller (`ResourceTimeline.svelte` 等) も変更なし。
