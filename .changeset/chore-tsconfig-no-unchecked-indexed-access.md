---
'@tommykey-apps/ui-components': patch
---

chore(tsconfig): enable `noUncheckedIndexedAccess` (#73)

publish library として safety-first。 grep 調査で実 read site は 3 件 (`resources[newRowIndex]` 1 件、 `laneEnds[i]` / `laneEndCols[i]` の write 2 件 — write は対象外) で、 一括対応で済むため段階導入せず即時 enable。

`ResourceTimeline.svelte` の `onKeyMove` で `resources[newRowIndex]` を `Resource | undefined` として扱い、 早期 return guard を追加。 実用上 `resources` が空配列なら Bar 自体 render されない (rowLayouts が空) ので副作用なし、 静的解析を満たすための補強。
