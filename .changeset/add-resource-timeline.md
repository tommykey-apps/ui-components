---
'@tommykey-apps/ui-components': minor
---

ResourceTimeline コンポーネントを追加。

- 行=リソース(人員)、帯=Assignment の Gantt 風レイアウト
- 4段ズーム (day / week / month / year)、二段ヘッダ (year でのみ単段)
- `setPointerCapture` ベースのドラッグ移動 (行内/行跨ぎ) と左右ハンドルでのリサイズ
- 全スタイルは scoped CSS + `--ui-*` 系の CSS 変数で消費アプリ側がテーマ可能
- `Resource` / `Assignment` / `ZoomLevel` / `ZOOMS` を export
- 投影関数 `dateToX` / `xToDate` / `barRect` / `viewportColumns` / `snapDate` も export

破壊的変更: 旧 `VERSION` 定数の export を削除。
