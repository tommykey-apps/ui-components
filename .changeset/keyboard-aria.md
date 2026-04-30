---
'@tommykey-apps/ui-components': minor
---

キーボード操作と aria-live ステータス対応。

**Bar 操作:**
- `Tab` で Bar 間 focus(既存)
- `←/→` で 1 unit 平行移動(`Shift+←/→` で 5 unit)
- `Alt+←` で開始日リサイズ(縮小)、`Alt+→` で終了日リサイズ(拡大)
- `Shift+↑/↓` で resource 行移動(行跨ぎ)

**スクリーンリーダー対応:**
- ResourceTimeline に `role="status"` + `aria-live="polite"` の sr-only 領域を追加
- onMove / onResize / onKeyMove / onKeyResize 完了時に「移動 / 開始日変更 / 終了日変更 田中 太郎: A社案件 2026-05-04 〜 2026-05-15」のようなメッセージで状態通知
- Bar に `aria-describedby={statusId}` を付与して紐付け

新規 props (Bar):
- `ariaDescribedBy` — 親が status region の id を渡す
- `onKeyMove(units, rows)` — 矢印キーでの移動
- `onKeyResize(edge, units)` — Alt+矢印での edge resize
