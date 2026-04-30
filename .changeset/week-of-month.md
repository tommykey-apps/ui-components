---
'@tommykey-apps/ui-components': minor
---

WeekZoom の下段ヘッダを「月毎に W1 から始まる週番号」に変更(慣例 A: 週の月曜日が属する月で帰属)。

- `projection.ts` に `weekOfMonth(date)` を追加(date-fns の `getWeekOfMonth` は `weekStartsOn:1` で第1週が W2 を返すバグがあるため自前実装)
- `HeaderTier` 型に `format?: (date: Date) => string` を任意追加。既存の `fmt: string` は optional 化(バックワードコンパチ:従来の `{ unit, fmt }` 形式はそのまま動く)
- `ZOOMS.week.headers[1]` を `format: (d) => 'W' + weekOfMonth(d)` に変更
- DayZoom / MonthZoom / YearZoom は変更なし

例(viewport 2026-04-27〜):
- 旧: W18, W19, W20, W21, W22, W23, ...(年内 ISO 週)
- 新: W4, W1, W2, W3, W4, W1, ...(月内リセット)
