---
'@tommykey-apps/ui-components': minor
---

refactor(Bar): native `title` 属性を bits-ui Tooltip (floating-ui ベース) に置換

native `title` 属性の OS tooltip は環境によって表示されない問題があり、UX として不安定だった。shadcn-svelte と同じ pattern で bits-ui の Tooltip primitive を採用し、即時 (delayDuration: 200ms)・theme 連動 (`--ui-bar-bg` / `--ui-bar-fg`)・portal-based (Gantt の overflow:hidden を回避) で表示する。
- `bits-ui` を `peerDependency` に追加 (`^2.18.0`)。resource-planner 等の consumer が既に持っていれば dedupe。
- ResourceTimeline で `<Tooltip.Provider>` を 1 度だけ wrap (library 内 self-contained、consumer に強要しない)
- `Tooltip.Root disabled={!labelTruncated}` で truncate されてない bar は mount しない (perf + 余計な popup 防止)
- `truncation.ts` の `isTruncated()` helper は引き続き使用、display gate として機能
