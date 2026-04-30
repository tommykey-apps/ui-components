# @tommykey-apps/ui-components

## 0.2.3

### Patch Changes

- aaf74c1: Storybook に light/dark テーマトグルを追加(toolbar から切替可能)。

  - `@storybook/addon-themes` を `withThemeByClassName` で導入
  - `.storybook/preview.css` に `:root` と `.dark` の `--ui-*` 変数定義を追加(ライブラリ自身は色を持たない方針のため、Storybook 側で demo 値を提供)
  - ライブラリのコードは無変更(scoped CSS の var fallback 機構がそのまま動作)

  公開 Storybook (https://tommykey-apps.github.io/ui-components/) からも切替可能。

## 0.2.2

### Patch Changes

- f65e43c: 横スクロール時に grid (背景の罫線) が canvas 末端で途切れる問題を修正。

  canvas 列数を `Math.max(visibleCols, 全 Assignment の最遠 endDate + bufferCols)` で動的拡張し、headers / grid-row / canvas が末端まで描画されるようになった。

  新規 props:

  - `bufferCols` (default 7): canvas 末端のスクロール余白(列数)

  projection.ts に `endColExclusive` / `maxEndCol` ヘルパを追加。`barRect` を `endColExclusive` 経由でリファクタ(挙動は同じ、コード重複削減)。

## 0.2.1

### Patch Changes

- d8685c6: 横スクロール時に日付ヘッダーが canvas と一緒に動かないバグを修正。

  `ResourceTimeline.svelte` を「単一スクロール容器 + position: sticky」パターンに変更:

  - `.timeline` 自身が `overflow: auto` の唯一のスクロール容器に
  - `.corner` (z-index:3) / `.headers` (z-index:2) / `.resources` (z-index:2) を `position: sticky` で固定
  - 中間ラッパだった `.canvas-wrap` を削除
  - 縦スクロール時にも resource 列が左端固定で追従(親に max-height があれば)
  - iOS Safari の momentum scroll 対応(`-webkit-overflow-scrolling: touch`)

  `Bar` の絶対座標配置と座標計算ロジック、props はすべて無変更で API 互換。

## 0.2.0

### Minor Changes

- a524955: 二段ヘッダで連続する同一値を col-span でグルーピング。

  DayZoom の上段で "2026/05" が 14 回繰り返されていた状態を 1 セル(14col span)に統合。
  WeekZoom 上段は月ごと、MonthZoom 上段は年ごとにグループ化される。

  実装: `groupHeaderCells()` でランレングス計算 → `$derived` で `headerTiers` に展開 → `.header-cell` に `width = span * colWidth` を流す。CSS には変更なし。

- 64c38b4: キーボード操作と aria-live ステータス対応。

  **Bar 操作:**

  - `Tab` で Bar 間 focus(既存)
  - `←/→` で 1 unit 平行移動(`Shift+←/→` で 5 unit)
  - `Alt+←` で開始日リサイズ(縮小)、`Alt+→` で終了日リサイズ(拡大)
  - `Shift+↑/↓` で resource 行移動(行跨ぎ)

  **スクリーンリーダー対応:**

  - ResourceTimeline に `role="status"` + `aria-live="polite"` の sr-only 領域を追加
  - onMove / onResize / onKeyMove / onKeyResize 完了時に「移動 / 開始日変更 / 終了日変更 田中 太郎: A 社案件 2026-05-04 〜 2026-05-15」のようなメッセージで状態通知
  - Bar に `aria-describedby={statusId}` を付与して紐付け

  新規 props (Bar):

  - `ariaDescribedBy` — 親が status region の id を渡す
  - `onKeyMove(units, rows)` — 矢印キーでの移動
  - `onKeyResize(edge, units)` — Alt+矢印での edge resize

- 2613063: 同一リソース内で時間が重複する Assignment を **縦に積む(vertical stacking)** ようになった。

  実装:

  - `projection.ts` に **`allocateLanes`** 関数を追加(Greedy First-Fit / interval graph coloring)
  - `ResourceTimeline.svelte` の各行高さが lane 数に応じて動的に拡張
  - Bar の y 座標が `row.rowTop + laneIndex * (barHeight + laneGap)` に
  - 行跨ぎ drag 判定を等高ロジックから `rowLayouts` 検索に変更(動的高さで正しく判定)

  新規 props:

  - `barHeight` (default 32): 各バーの高さ
  - `laneGap` (default 4): lane 間 gap

  既存の `rowHeight` は「単一 lane 行の最低高さ」として継続利用。

### Patch Changes

- dc51afc: `Assignment` の `startDate` / `endDate` に「ローカル深夜 Date 推奨」JSDoc を追加。Storybook fixtures を local-midnight 形式 (`new Date(yyyy, m-1, d)`) に変換。

  UTC 文字列 (`new Date('2026-05-04T00:00:00Z')`) を渡すと非 UTC 環境(JST 等)で `barRect` の aligned 判定が外れて末端列が +1 col 余計に太く描画される挙動の補足ドキュメント。

- 4f66f46: projection.ts の単体テストを追加(19 ケース、Vitest 4.1)。

  - `vite.config.ts` の `test.projects` を `unit`(node 環境) + `storybook`(browser) に分離
  - coverage 対象を `src/lib/**/*.ts` に絞る(stories / .svelte / dist 除外)
  - scripts: `pnpm test` (unit のみ) / `pnpm test:all` (全 project) / `pnpm test:coverage`
  - CI workflow に `pnpm test` を `pnpm check` の直後に追加

  テストカバー範囲:

  - `startOfUnit` / `addUnits` / `unitsBetween` / `dateToX` / `xToDate` / `snapDate` / `viewportColumns`
  - `barRect` の境界条件(aligned / not aligned / zero-length)
  - `allocateLanes` の lane 割当(non-overlap / 2-lane / 3-lane / lane reuse / empty)

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
