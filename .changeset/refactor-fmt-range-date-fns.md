---
'@tommykey-apps/ui-components': patch
---

refactor(ResourceTimeline): `fmtRange` の手書き zero-pad を `date-fns format` に置換 (#64)

`fmt = (d) => \`${getFullYear()}-${padStart(getMonth()+1)}...\`` の自前 zero-pad を `format(d, 'yyyy-MM-dd')` に置換。 既に `import { format } from 'date-fns'` 済、 CLAUDE.md の `date-fns v4` 規約と整合。 3 行 → 1 行。 出力フォーマット同一。
