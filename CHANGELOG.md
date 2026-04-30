# @tommykey-apps/ui-components

## 0.1.1

### Patch Changes

- 8fea479: Repository と GitHub Packages を public 化(Free org の Pages 制約を回避するため)。消費アプリ側は `@tommykey-apps:registry=https://npm.pkg.github.com` だけで認証なしで取得可能になる。

## 0.1.0

### Minor Changes

- 8c56084: ResourceTimeline コンポーネントを追加。

  - 行=リソース(人員)、帯=Assignment の Gantt 風レイアウト
  - 4 段ズーム (day / week / month / year)、二段ヘッダ (year でのみ単段)
  - `setPointerCapture` ベースのドラッグ移動 (行内/行跨ぎ) と左右ハンドルでのリサイズ
  - 全スタイルは scoped CSS + `--ui-*` 系の CSS 変数で消費アプリ側がテーマ可能
  - `Resource` / `Assignment` / `ZoomLevel` / `ZOOMS` を export
  - 投影関数 `dateToX` / `xToDate` / `barRect` / `viewportColumns` / `snapDate` も export

  破壊的変更: 旧 `VERSION` 定数の export を削除。
