---
'@tommykey-apps/ui-components': patch
---

refactor(types): `ZoomLevel.id` を `ZoomUnit` alias に統一 / `HeaderTier.fmt` と `format` を 1 field に統合 (#74)

`types.ts`:

- `ZoomLevel.id` の union `'day' | 'week' | 'month' | 'year'` を `ZoomUnit` alias に置き換え (完全一致の重複定義を削除)
- `HeaderTier` の `fmt?: string` + `format?: (Date) => string` 2 field を `fmt: string | ((Date) => string)` の 1 field に統合

caller 側 (`zoom.ts`, `ResourceTimeline.svelte`):

- zoom.ts の `format:` → `fmt:` に migration (week tier の関数 formatter)
- `ZOOMS` の Record key type も `ZoomUnit` alias を使う
- `groupHeaderCells` で `typeof tier.fmt === 'function'` で分岐

internal 型なので consumer impact なし、 backward-compatible (型の simplification のみ)。
