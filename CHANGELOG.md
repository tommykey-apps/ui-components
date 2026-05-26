# @tommykey-apps/ui-components

## 1.0.0

### Major Changes

- 183dff7: feat(Bar): label を sticky 化 (#84) + hover tooltip 全廃 (BREAKING)

  `Bar.svelte` の label を CSS `position: sticky` で常時 viewport 内に貼り付ける挙動に変更し、 従来の bits-ui Tooltip + floating-ui virtual anchor (cursorAnchor) ベースの hover tooltip を完全廃止 (#42 / #60 の旧 tooltip bug も本実装で吸収)。

  ## なぜ再挑戦?

  #32 で sticky 導入 → #39 で「CSS spec 上不可」 と判断して revert、 tooltip 常時 enabled で UX 補償していた。 しかし consumer (resource-planner) の実機運用で **tooltip ベースの UX は離散的で発見しづらく、 常時可視のラベル位置追従が望ましい** と再評価。

  #39 の判断 ("CSS spec 上不可") は誤りで、 業界実装 ([DHTMLX Gantt の `sticky: true`](https://docs.dhtmlx.com/gantt/desktop__layout_config.html) や [Ben Nadel の Angular Gantt](https://www.bennadel.com/blog/3961-having-fun-with-the-horizontal-usage-of-position-sticky-in-angular-11-0-5.htm)) と同様に、 親の `overflow: hidden` を外して label 側に `max-width` を設定すれば CSS only で実現可能。 JS scroll listener も不要。

  ## 主な実装

  ### CSS-only sticky (Ben Nadel pattern)

  \`\`\`css
  .bar {
  position: absolute;
  /_ overflow: hidden は付けない (sticky 親条件) _/
  }
  .label {
  position: sticky;
  left: var(--ui-resource-col-width, 200px); /_ rail 右端に貼り付く _/
  flex: 0 1 auto; /_ intrinsic width — flex:1 だと sticky shift 余地 0 _/
  max-width: 100%; /_ bar 幅まで (overflow 廃止の補償) _/
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  }
  \`\`\`

  ### tooltip 関連削除

  - `bits-ui` の `Tooltip.Root` / `Trigger` / `Portal` / `Content` を Bar / ResourceTimeline から削除
  - `cursorAnchor` / `handlePointerEnter` / floating-ui virtual element 周辺を削除
  - `cursor-anchor.ts` / `cursor-anchor.test.ts` モジュール削除
  - `:global(.ui-bar-tooltip)` / `:global(.ui-bar-tooltip-arrow)` style 削除
  - `bits-ui` peerDependency / devDependency 削除

  ## Breaking changes (consumer 影響)

  | 削除 / 変更                           | 影響                                                                     |
  | ------------------------------------- | ------------------------------------------------------------------------ |
  | Bar の hover tooltip (bits-ui 経由)   | hover で project 名を出す UI は消失。 sticky label で常時可視に置換      |
  | `bits-ui` peer dependency             | consumer 側で他用途で bits-ui を使っていない場合、 単独で install 不要に |
  | `Tooltip.Provider` の library 内 wrap | 廃止。 consumer は自前 Provider を持っている場合も影響なし               |

  ## Refs

  - closes #84
  - 関連 (本 PR で吸収): #42 cursor 追従 / #60 close 時 left jump
  - 設計判断の根拠: [CSS Position L3 sticky](https://www.w3.org/TR/css-position-3/#sticky-pos), [MDN position sticky overflow constraint](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky_positioning)

## 0.10.0

### Minor Changes

- 39581d0: feat(Bar): `onActivate` prop を追加 — pointer click + keyboard (Enter/Space) を unified に通知 (#85)

  `Bar` / `ResourceTimeline` に `onActivate?: (assignment: Assignment) => void` prop を追加。 consumer (例: resource-planner) が bar クリックで detail dialog を起動する用途を想定。

  WAI-ARIA Button pattern に準拠し、 React Aria の `usePress` 同思想で **input agnostic** な命名 (`onActivate`) を採用:

  - pointer: `pointerup` 時に `Math.hypot(dx, dy) < 4px` (dnd-kit 系の慣例) なら drag ではなく click として `onActivate`
  - keyboard: `Enter` / `Space` で `preventDefault` + `onActivate`
  - resize handle 上の click では発火しない (`mode === 'move'` の時のみ)

  既存 API (`onDragEnd` / `onResizeEnd` / `onKeyMove` / `onKeyResize` / `onMove` / `onResize`) は無変更。 additive な API 追加。

- 39581d0: feat(ResourceTimeline): `onResize` callback に `edge` 情報を渡す (#68)

  `onResize?: (assignment: Assignment) => void` → `(assignment: Assignment, edge?: 'start' | 'end') => void` に signature 拡張。 旧 consumer `(updated) => ...` は edge を無視するので **backward-compatible**。

  従来は `Bar.onResizeEnd(edge, dx)` から `edge` 情報が `ResourceTimeline.onResize` に伝達されず、 consumer が「どっち側の handle で resize されたか」 を判断したい時に updated と前回値を diff する必要があった。 transparently に edge を 2nd 引数で expose。

  `onKeyResize` 経由の resize でも同様に edge を渡す。

### Patch Changes

- db7b700: chore(ResourceTimeline): grid-cell loop を `canvasCols` (number) で iterate (#75)

  `columns` (Date[]) は header 描画用、 grid-cell loop では index しか使わないため `{ length: canvasCols }` で iterate に変更。 Date 配列の reactive dep を踏まずマイクロ最適化 + 意図が明確に。

- db7b700: chore(tsconfig): enable `noUncheckedIndexedAccess` (#73)

  publish library として safety-first。 grep 調査で実 read site は 3 件 (`resources[newRowIndex]` 1 件、 `laneEnds[i]` / `laneEndCols[i]` の write 2 件 — write は対象外) で、 一括対応で済むため段階導入せず即時 enable。

  `ResourceTimeline.svelte` の `onKeyMove` で `resources[newRowIndex]` を `Resource | undefined` として扱い、 早期 return guard を追加。 実用上 `resources` が空配列なら Bar 自体 render されない (rowLayouts が空) ので副作用なし、 静的解析を満たすための補強。

- db7b700: docs(Bar): `handleKeydown` の modifier matrix を JSDoc に明記 (#72)

  Bar body focus 時の Arrow + modifier 組合せ (none / Alt / Shift / Shift+Alt) と各操作 (move / resize / no-op) を JSDoc 内表で明記。

  `Alt+ArrowUp/Down` は「縦方向 resize」 が概念的に存在しないため意図的に no-op + native default 通過 (WAI-ARIA APG の「desktop convention に従う」 方針)。 動作変更なし、 documentation only。

- db7b700: docs(README): `Bar` / `snapDate` を low-level primitive として public export している意図を明記 (#71)

  bits-ui 流の primitive 公開 pattern に従い、 `ResourceTimeline` の building block (`Bar`, `snapDate`) を意図的に export 維持していることを README に追記。 dead export ではなく advanced composition 用。 tree-shaking で未使用なら bundle に含まれないため defaults 利用者への悪影響なし。

  API breaking なし、 documentation only。

- e337d14: fix(projection): `allocateLanes` を col 単位の重複判定にも対応 (#61)

  year/month zoom で同一 resource の複数 assignment が時間軸では非重複でも描画 col 上で同位置に詰まり、 後勝ち 1 件しか見えない問題を修正。

  `allocateLanes(assignments, { origin, unit })` のように optional 引数を追加し、 col 単位 (`endColExclusive`) で重複判定するパスを追加。 ResourceTimeline は zoom.unit / origin を渡し、 vis-timeline / Bryntum 等で標準の vertical stacking 戦略に合わせて lane 数を増やす。 行高さは既存 `rowLayouts` が `laneCount` ベースで動的計算しているので自動的に伸びる。

  day zoom 等 fine-grained では時間軸ベースと結果一致するため backward-compatible。 引数なし call (公開 API として直接使う想定があれば) は従来の時間軸判定で動作。

- fcbbe39: fix(projection): `allocateLanes` で重複 assignment.id を DEV mode で警告 (#58)

  従来は同一 id を含む assignments を渡すと `lanes.set(a.id, i)` で silent 上書きされ、 1 行に複数 lane を持つはずの consumer が「最初の bar しか表示されない」 ような状況に気づけなかった (#61 と表面化症状が一致するケース)。

  DEV mode 時のみ `console.warn('[ResourceTimeline] duplicate assignment id: ${id}')` を出力し、 production には影響を与えない。 併せて `Assignment.id` の jsdoc に「一意 id 必須」 を明記。

- db7b700: fix(ResourceTimeline): aria-live region に `aria-atomic="true"` 追加 (#70)

  `role="status" aria-live="polite"` だけだと、 keyboard 連打 (ArrowRight 連続 move) で status が高速更新された際に NVDA 等のスクリーンリーダーが中間値を skip して最終値だけアナウンスする保証がない。 WAI-ARIA APG 推奨の `aria-atomic="true"` を追加し、 region 全体を atomic に再 announce する挙動を明示。

- fcbbe39: fix(Bar): `labels` prop を partial 許容に緩和 (#59)

  従来 `labels?: Required<BarLabels>` は「渡さなくて良い、 でも渡すなら全 key 必須」 という二択で、 `Bar` を直接 import する consumer が一部 key だけ override したい場合に型エラーになっていた。 bits-ui 流の primitive 設計に揃え、 `labels?: BarLabels` (任意 key optional) + 内部 fallback (`resolvedLabels` $derived) に変更。

  `ResourceTimeline` 経由で渡される labels は従来通り `resolveLabels()` でフルセット化されており、 既存の behavior は変わらない (backward-compatible)。

- 3306eb0: fix(Bar): resize ハンドルに必須 ARIA 属性と keyboard アクセス手段を追加 (#81)

  `Bar.svelte` の resize ハンドル (`role="separator"`) は WAI-ARIA 上 focusable splitter として `aria-valuenow` / `aria-orientation` が必須、 かつキーボードユーザーが到達するための `tabindex` が必要だった。 従来は属性も `tabindex` も欠落しており、 a11y Critical。

  - `tabindex={0}` 追加 (handle にキーボードフォーカス可能に)
  - `aria-orientation="vertical"` 明示 (default は horizontal)
  - `aria-valuenow={0}` (start handle) / `aria-valuenow={100}` (end handle) 付与
  - handle focus 中の矢印キーで該当 edge を resize する handler (`handleHandleKeydown`) を新設 (Alt キー不要、 edge が自明なので)

- fcbbe39: fix(ResourceTimeline): `document.fonts.ready.then(remeasure)` に teardown を追加 (#57)

  `$effect` 内で `document.fonts.ready.then(remeasure)` を呼んでいたが、 Promise は cancel 不可で unmount や effect 再 run 後にも resolve する。 resolve 後の `remeasure` が `measuredRailWidth` (`$state` への write) や `timelineEl.querySelector(...)` を実行し、 orphan DOM 参照を引く恐れがあった。

  Svelte 公式の teardown function 内で `cancelled = true` を立て、 `remeasure` 冒頭で gate するパターンに変更。

- cc22d91: fix(ResourceTimeline): `statusId` を `$props.id()` で SSR-stable な生成に変更 (#56)

  従来 `Math.random()` 由来の id を script 評価時に生成しており、SSR と client hydration で別 id になることで `aria-describedby` の参照が成立しなくなる hydration mismatch があった。 Svelte 5 公式の `$props.id()` (component instance 単位で SSR-stable) に置き換え。

- 6022519: fix(Bar): tooltip が hover 解除時に画面左へ一瞬飛んで消える bug を解消 (#60、 #42 関連)

  `pointerleave` で `cursorAnchor = null` に戻していたが、 bits-ui (floating-ui) は `customAnchor` が null になると trigger 要素 (bar) を anchor として再計算し、 wide bar では shift middleware で viewport 端にクランプされて 1 RAF だけ「左に飛んだ」 位置で描画されていた。

  `handlePointerLeave` を削除し、 cursor 位置の virtual anchor を unmount まで保持する。 bits-ui が `data-state="closed"` で unmount すると virtual element ごと GC され、 次回 pointerenter で `createCursorAnchor` が新 instance を作るので stale 参照問題なし。

  Playwright で再現 (frame1 で left=595→37 へ jump) → 修正後 (frame1 で left=595 保持、 frame2 で unmount) を確認。 #42 の virtual anchor 実装 (`customAnchor={cursorAnchor}`) も regression test で恒久化。

- 53bb1e4: refactor(Bar): resize handle の listener を削減 (#63)

  `startDrag` 内の `setPointerCapture(handle)` で handle が capture 元になると、 続く `pointermove` / `pointerup` / `pointercancel` は capture 経由で bubble path の親 `bar` listener に届く。 handle 側の 3 listener (`onpointermove` / `onpointerup` / `onpointercancel`) は redundant のため削除。

  残るのは `onpointerdown` (mode 確定 + capture 取得) と `onkeydown` (handle focus 中の keyboard resize) のみ。 handle あたり 2 listener、 計 4 listener 削減。 動作不変。

- 53bb1e4: refactor(ResourceTimeline): 4 callback の重複 pattern を `buildMovedAssignment` / `buildResizedAssignment` の 2 helper に集約 (#62)

  `onDragEnd` / `onResizeEnd` / `onKeyMove` / `onKeyResize` で 4 重複していた「Assignment patch + bounds check」 を **move 軸と resize 軸の 2 helper** に分離して集約。 issue 案 (1 関数 + tagged union) は型が複雑化するため AHA 原則に従い「変化する軸」 (move vs resize) で分割。

  - `buildMovedAssignment(base, { colDelta, newResourceId })`: 移動 + 行跨ぎを 1 関数で。 no-op 時は `null` を return
  - `buildResizedAssignment(base, edge, colDelta)`: edge ('start' | 'end') 別の bounds check + patch。 反転 (start ≥ end / end ≤ start) 時は `null` を return

  各 callback は 「特殊前処理 (dx → colDelta、 dy → newRow 等) → helper → status + dispatch」 の 3 段に整理、 4 callback 合計で約 60 行 → 約 35 行に圧縮。 動作不変。

- 53bb1e4: refactor(ResourceTimeline): `fmtRange` の手書き zero-pad を `date-fns format` に置換 (#64)

  `fmt = (d) => \`${getFullYear()}-${padStart(getMonth()+1)}...\``の自前 zero-pad を`format(d, 'yyyy-MM-dd')`に置換。 既に`import { format } from 'date-fns'`済、 CLAUDE.md の`date-fns v4` 規約と整合。 3 行 → 1 行。 出力フォーマット同一。

- 53bb1e4: refactor(labels): `TimelineLabels` を `ResolvedTimelineLabels` から `DeepPartial` 派生に統一 (#65)

  従来は `types.ts` の `TimelineLabels` (全 optional) と `labels.ts` の `ResolvedTimelineLabels` (全必須) を 2 重に手書きしており、 status の key (move/resizeStart/resizeEnd/keyMove/keyResizeStart/keyResizeEnd) を 1 つ追加するたび両方同期する必要があった。

  `labels.ts` で `type DeepPartial<T>` を定義し、 `TimelineLabels = DeepPartial<ResolvedTimelineLabels>` で派生。 `types.ts` からは `export type { ... } from './labels.js'` で re-export のみ。 function value (`status.move` 等) は partial 化対象外で関数単位置換のまま (`T extends (...args) => unknown ? T : { [K]?: ... }`)。

  consumer から見た型 shape は同じ、 backward-compatible。 caller (`ResourceTimeline.svelte` 等) も変更なし。

- 53bb1e4: refactor: `createPointerDrag` helper を抽出して canvas drag-to-pan を集約 (#67)

  `setPointerCapture` パターン (pointerdown で capture → 続く pointermove / pointerup / pointercancel を同 listener で拾う) を `pointer-drag.ts` の `createPointerDrag(opts)` factory に集約。 closure 内に start coords / pointerId を閉じ込めることで、 caller は `onPointerDown` / `onPointerMove` / `onPointerUp` の 3 関数を template に bind するだけ。 unit test 可能 (vitest で 6 ケース追加)。

  採用箇所: `ResourceTimeline` の canvas drag-to-pan。

  採用しない箇所 (**AHA 原則**「不適切な abstraction より duplication」): `Bar.svelte` の drag / resize は mode 切替 (move / resize-start / resize-end) と 2D delta + threshold check が closure 内 state と密結合しており、 共通化すると caller 側で mode 判定が増え helper の汎用性メリットが消えるため維持。

- 53bb1e4: refactor(TimelineToolbar): `ToolbarLabels` / `DEFAULT_TOOLBAR_LABELS` を `labels.ts` に集約 (#66)

  inline 定義から `labels.ts` の canonical 型に移動し、 `index.ts` から `ToolbarLabels` / `DEFAULT_TOOLBAR_LABELS` を export。 consumer が覚える type は 1 つだけ (#66 の DX 問題を解決)。

  API surface (`labels` / `ariaLabels` 2 prop) は維持 (WAI-ARIA APG: icon-only button は aria-label 必須、 text button は visible text が name 兼任 — 完全統合せず両者を complementary に扱う)。 backward-compatible。

- db7b700: refactor(types): `ZoomLevel.id` を `ZoomUnit` alias に統一 / `HeaderTier.fmt` と `format` を 1 field に統合 (#74)

  `types.ts`:

  - `ZoomLevel.id` の union `'day' | 'week' | 'month' | 'year'` を `ZoomUnit` alias に置き換え (完全一致の重複定義を削除)
  - `HeaderTier` の `fmt?: string` + `format?: (Date) => string` 2 field を `fmt: string | ((Date) => string)` の 1 field に統合

  caller 側 (`zoom.ts`, `ResourceTimeline.svelte`):

  - zoom.ts の `format:` → `fmt:` に migration (week tier の関数 formatter)
  - `ZOOMS` の Record key type も `ZoomUnit` alias を使う
  - `groupHeaderCells` で `typeof tier.fmt === 'function'` で分岐

  internal 型なので consumer impact なし、 backward-compatible (型の simplification のみ)。

## 0.9.3

### Patch Changes

- 5f0e915: fix(ResourceTimeline): rail auto-fit の chrome (padding + border) を `getComputedStyle` で動的計算、 マジック数値を撤去。

  v0.9.2 (#51) で text width 計測自体は正しくなったが、 ResourceTimeline 側で text → grid track の間に挟まる chrome を `RAIL_PADDING_PX = 24` (row padding のみ) としていたため、 `.resources` aside の `border-right: 1px` を加算し忘れていた → CI で 1px ellipsis 切れ継続。

  修正:

  - `.resource-row` (padding + border) と `.resources` (border) の computed style から chrome を実測
  - `RAIL_SAFETY_PX = 1` で sub-pixel font hinting buffer
  - マジック数値撤去で将来 CSS 変更時の乖離を防止

## 0.9.2

### Patch Changes

- 733f633: fix(measure-text): `metrics.width` (advance) ではなく `actualBoundingBoxLeft + actualBoundingBoxRight` (実描画 bbox) を採用、 subpixel 安定化のため `Math.ceil` で整数化。

  CI で `scrollWidth=274 > clientWidth=273` の 1px overflow による ellipsis 切れが発生していた。 原因は Canvas `measureText().width` が **advance width** (字送り) で実描画 bbox とは異なるため。 MDN / Erik Onarheim 推奨の `abs(actualBoundingBoxLeft) + abs(actualBoundingBoxRight)` を採用し、 一部 script (CJK 等) で advance > bbox になりうるので両者の `max` を取る形に修正。

  - 新規 `pickRenderedWidth(metrics)` pure helper (unit test 5 ケース緑)
  - `createCanvasMeasurer` の戻り値を `metrics.width` → `pickRenderedWidth(metrics)` に置換
  - 公開 API 不変

  Refs:

  - https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
  - https://erikonarheim.com/posts/canvas-text-metrics/

## 0.9.1

### Patch Changes

- ab9488f: fix(Bar): #42 で追加した cursor follow ハンドラが bits-ui Tooltip の hover 検出を壊していた問題を修正。

  `Tooltip.Trigger` の child snippet props には bits-ui の `onpointerenter / pointermove /
pointerleave` が含まれる。 これを上書きすると bits-ui の hover 検出が起動せず、 **real hover
  で tooltip 自体が開かなくなる** バグになっていた (#42 PR で StoryBook 確認時に `.focus()`
  迂回していたため見逃した)。

  `composePointerHandler` で bits-ui ハンドラを先に呼んでから自前の cursor 追跡を実行する形に
  修正。 keyboard focus 経路も影響なし。

- 6d7ec1f: refactor(Bar): #48 で導入した自作 `composePointerHandler` を撤去し、 bits-ui 公式 pattern (`Tooltip.Trigger` に直接ハンドラを渡し `mergeProps` に任せる) に置き換え。

  #48 では `unknown` キャストで型の逃げを作っていた。 bits-ui の child snippet 公式 docs を読み直すと、 自前ハンドラは Trigger コンポーネント自体に渡すのが正解 (内部の `mergeProps` で自動合成される)。 動的 class / style だけ child div に残し、 role / aria / event handler は全部 `Tooltip.Trigger` 側に移動。

  - `composePointerHandler` 削除
  - `unknown` cast 削除
  - public API 不変

  Refs: https://next.bits-ui.com/docs/child-snippet

## 0.9.0

### Minor Changes

- 3937f6e: feat(ResourceTimeline): resource rail (左 sticky 列) を最長名に auto-fit する機能を \*\*JS 測定

  - CSS 変数 pattern\*\* で再実装 (#43)。

  過去 (#34, PR #161) の `minmax(min, fit-content(max))` 実装は子要素 `position: sticky` との
  相互作用で column 1 が 1px に collapse する本番事故を起こした。 今回は CSS Grid の track sizing
  に依存せず、 off-flow probe span でテキスト本来の幅を測定 → `computeRailWidth()` で clamp →
  CSS 変数 `--ui-resource-col-width` に流し込む方式に切り替える。

  - 新規 helper `computeRailWidth(widths, { min, max, padding })`: 純粋関数、 9 ケース緑
  - `ResourceTimeline.svelte` に `nameEls` ref 配列 + ResizeObserver + `document.fonts.ready`
    追従の `$effect` を追加
  - `.resource-row-probe` (\`position: absolute; visibility: hidden;\`) を各行に並べてテキスト
    本来の幅を測定 (grid track の幅を継承しない)
  - `resourceColWidth='auto'` 利用時のみ JS 測定経路。 数値指定 (default 200) は静的 CSS 変数で
    従来と完全同等
  - 公開 API は不変、 `resourceColWidth: number | 'auto'` の signature 維持

### Patch Changes

- 7064389: refactor(ResourceTimeline): rail 幅測定を Canvas `measureText` に切り替え (#43 follow-up)。

  PR #46 で導入した off-flow DOM probe (resource × 1 余分な span + ResizeObserver) を撤去し、
  MDN / Erik Onarheim 推奨の Canvas `measureText` pattern に置き換える。

  - 新規 `createCanvasMeasurer(font)` helper: module-scope canvas を再利用、 SSR safe (null fallback)
  - DOM 重複ゼロ、 reflow 不要、 ResizeObserver 不要、 O(N) 同期測定
  - font は `.resource-row` の computedStyle から shorthand を構築して canvas に流す
  - `computeRailWidth()` clamp 純関数は再利用 (signature 不変)
  - 公開 API 不変 (`resourceColWidth: number | 'auto'`)

  Refs:

  - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText
  - https://erikonarheim.com/posts/canvas-text-metrics/

- 460b4a7: fix(Bar): hover tooltip がカーソルではなく bar 中央 anchor になり、 wide bar (例 6 ヶ月案件) で
  画面端に貼りつく問題を修正 (#42)。

  - 新規 helper `createCursorAnchor(clientX, clientY)` で floating-ui virtual element を生成
  - `Bar.svelte` の `pointerenter / pointermove / pointerleave` で cursor 座標を追跡し、
    bits-ui `Tooltip.Content` の `customAnchor` prop に渡す
  - `side="top" align="start" sideOffset={12} alignOffset={12}` でカーソル右上に追従
  - keyboard focus / touch では `cursorAnchor` が null のまま、 bits-ui default
    (trigger 要素 anchor) に fallback
  - viewport 端では floating-ui の `shift` middleware が自動で位置補正

## 0.8.0

### Minor Changes

- 039e6b9: fix(Bar): revert sticky label (spec violation) and always-enable the hover tooltip

  The `position: sticky` label introduced in `#32` does not work as designed. CSS
  sticky positioning is constrained to the element's nearest containing block, and
  `.label` sits inside `.bar` which is `position: absolute; overflow: hidden;`.
  That means when a long bar scrolls partially off-screen, the label is pinned to
  the bar's left edge — not the viewport's left edge — and disappears with the bar.
  Verified in the consumer (`tommykey-apps/resource-planner#162`).

  To compensate, the existing hover tooltip (`#23` / `#28`) — which previously only
  appeared when the label was ellipsis-truncated — now always opens on hover.
  Long bars whose label runs off-screen can still be identified by hovering.

  ### Removed

  - `.label { position: sticky; left: 8px; right: 8px; }`
  - `Tooltip.Root disabled={!labelTruncated}` guard (now always enabled)
  - `labelTruncated` state, `measureTruncation`, `labelEl` binding, `document.fonts.ready`
    hook, `ResizeObserver` lifecycle inside `Bar.svelte`
  - `src/lib/timeline/truncation.ts` and its test (`isTruncated` was only used for
    the truncation guard, no other consumers)

  ### Consumer impact

  Behavior change visible to consumers — `minor` rather than `patch`:

  - Hover anywhere on a bar now opens a tooltip (previously only when text was
    ellipsis-truncated). Linear / Asana / Microsoft Project Web all use a similar
    always-on pattern.
  - `#32`'s sticky positioning was never actually working in production; no
    consumer should have relied on its (non-existent) behavior.

## 0.7.0

### Minor Changes

- fec304c: feat(ResourceTimeline): auto-fit resource rail width to the longest name

  `resourceColWidth` now accepts `'auto'` (opt-in) in addition to a number. When
  'auto', the rail column shrinks/expands to the content with `minmax(min,
fit-content(max))`. Two new props control the bounds:

  ```svelte
  <ResourceTimeline resourceColWidth="auto" /> <!-- default min=100, max=400 -->
  <ResourceTimeline resourceColWidth="auto" resourceColMinWidth={120} resourceColMaxWidth={300} />
  ```

  CSS-only via CSS Grid `fit-content()` — no `ResizeObserver`, no `measureText`,
  no `$effect`. `position: sticky` on the rail continues to work because it is
  independent of column sizing. Names that exceed the max still ellipsis-truncate
  as before.

  Backward compatible: `resourceColWidth` default is still `200` (fixed px).
  Consumers opt in by passing `'auto'`.

- 545e2d7: feat(i18n): accept `labels` prop on `ResourceTimeline` for a11y / aria-live overrides

  Hard-coded Japanese a11y strings (resize handle `aria-label`, `aria-live` status
  messages) used to bleed into every consumer regardless of locale. The library now
  ships **English defaults** and exposes a `labels` prop on `ResourceTimeline` so
  consumers can inject their own translations:

  ```svelte
  <ResourceTimeline
    labels={{
      bar: { resizeStart: '開始日リサイズ', resizeEnd: '終了日リサイズ' },
      canvas: { region: 'タイムライン' },
      status: {
        move: (range) => `移動: ${range}`,
        resizeStart: (range) => `開始日変更: ${range}`,
        // ... rest
      }
    }}
    {...other}
  />
  ```

  New public types: `BarLabels`, `TimelineLabels`, and a `DEFAULT_TIMELINE_LABELS`
  constant for consumers that want to spread/override partial keys.

  Backward compatible: defaults move from Japanese to English, but any consumer who
  was already passing through these strings would override them anyway. Consumers
  that relied on the implicit Japanese defaults need to either accept the English
  defaults or pass a `labels` prop.

### Patch Changes

- 533a1cb: fix(Bar): keep the project label visible by sticking it to the viewport edge

  Long-duration bars (e.g. 6+ months) that extend beyond the viewport used to render
  their label at the bar's leading edge — which could be hundreds of pixels off-screen,
  making it impossible to tell which project a bar belonged to without scrolling.

  The `.label` span now uses `position: sticky; left: 8px; right: 8px;` so it tracks
  the viewport's left edge while the bar is partially scrolled out, then snaps back
  to its normal position once the bar is fully in view. CSS-only; no JS observers.
  Matches the Gantt UX of Google Sheets / Linear / Microsoft Project Web.

  The existing hover-tooltip (`#23` / `#28`) still triggers when the label is
  ellipsis-truncated on narrow bars — the two mechanisms address different cases
  (viewport-out vs. truncation) and don't interfere.

## 0.6.0

### Minor Changes

- fa62928: refactor(Bar): native `title` 属性を bits-ui Tooltip (floating-ui ベース) に置換

  native `title` 属性の OS tooltip は環境によって表示されない問題があり、UX として不安定だった。shadcn-svelte と同じ pattern で bits-ui の Tooltip primitive を採用し、即時 (delayDuration: 200ms)・theme 連動 (`--ui-bar-bg` / `--ui-bar-fg`)・portal-based (Gantt の overflow:hidden を回避) で表示する。

  - `bits-ui` を `peerDependency` に追加 (`^2.18.0`)。resource-planner 等の consumer が既に持っていれば dedupe。
  - ResourceTimeline で `<Tooltip.Provider>` を 1 度だけ wrap (library 内 self-contained、consumer に強要しない)
  - `Tooltip.Root disabled={!labelTruncated}` で truncate されてない bar は mount しない (perf + 余計な popup 防止)
  - `truncation.ts` の `isTruncated()` helper は引き続き使用、display gate として機能

### Patch Changes

- df41633: fix(Bar): resize handle に透明 `::before` pseudo の hit area を追加 (WCAG 2.5.8 AA 準拠)

  resize handle の visible 幅 6px はそのまま、touch / pointer 判定領域だけを縦 44 (AAA) × 横 24 (AA) に拡張。狭い zoom (1-day = 64px) でも両端 handle が重ならない設計。

## 0.5.0

### Minor Changes

- c23ac40: feat(Bar): truncate されている時だけ hover tooltip (title 属性) で案件名を表示

  bar が短い (zoom が広い / 期間が短い) と label が `text-overflow: ellipsis` で切られて何のアサインか視覚的に分からなかった。`ResizeObserver` + `document.fonts.ready` + `tick()` で label 要素の `scrollWidth > clientWidth` を監視し、truncate されている時のみ `title` 属性を渡すよう変更。

  - truncate されてない時は title 属性自体を出さない (常時 hover popup を防ぐ)
  - `aria-label` は引き続き常に提供 (screen reader 体験は変えない)
  - zoom 変更 / drag resize / label 文字列変更 / font load 後 すべてに reactive

### Patch Changes

- 1346071: fix(ResourceTimeline): drag/resize 中の Bar が sticky な resource rail / header より手前に表示される問題を修正

  `.canvas` に `isolation: isolate` を追加して自身の stacking context を分離。drag 中の bar の `z-index: 10` は canvas 内部だけで評価され、canvas 全体は親 grid 内で auto (= 0) のまま sticky 領域 (z-index: 2/3) より下に保たれる。

- cf08f26: fix(TimelineToolbar): aria-pressed=true button の fg fallback に `--ui-bar-fg` を挟む

  bg 側は既に 3 段 fallback (`--ui-toolbar-button-bg-active → --ui-bar-bg → #4f46e5`) だが、fg 側だけ semantic primitive 段 (`--ui-bar-fg`) が抜けて `#ffffff` 直結だったため、`--ui-bar-bg` を白系にするテーマで bg と衝突して文字が読めなくなっていた。bg と対称な 3 段 chain に揃える。

## 0.4.1

### Patch Changes

- ce80abf: ResourceTimeline: 長い resource 名が left rail を canvas 領域に侵食する問題を修正。

  - `.resources` aside に `width: var(--ui-resource-col-width, 200px)` を追加 (default 200px、消費アプリで上書き可能)
  - `.resource-row` の text に `overflow: hidden; white-space: nowrap; text-overflow: ellipsis` を追加
  - マークアップに `title={row.resource.name}` を追加して full name を hover で確認可能に

  Workaround を伴わずに resource-planner #95 の Timeline 左 rail overflow が解消する。

## 0.4.0

### Minor Changes

- a4d70fd: 業界標準の Gantt navigation UI を実装(scrollbar styling アプローチの代替、過去 2 回 revert を踏まえた設計)。

  **新規**:

  - **`<TimelineToolbar>`**: Today / Prev / Next / Zoom 切替を一括提供。`bind:viewportStart bind:zoom` で双方向束縛。inline SVG icons(phosphor MIT path 同梱)、CSS 変数で theme 可能、ライブラリ依存ゼロ
  - **drag-to-pan**: `ResourceTimeline` の canvas 空白領域マウスドラッグで横スクロール(threshold 5px、1:1 感度、`setPointerCapture` 使用、Bar 上は除外)
  - **`viewportStart` を `$bindable`**: Toolbar との連携 + 消費アプリからの制御を可能に
  - `viewportStart` / `zoom` 変更時に scrollLeft 自動 0 リセット(drag-pan 残留を消す)

  **新 props (TimelineToolbar)**: `zooms` / `step` / `today` / `showZoom` / `showToday` / `showNav` / `labels` / `ariaLabels` / `onTodayClick` / `onNavigate` / `onZoomChange`

  **新 CSS 変数**: `--ui-toolbar-*` 系(theme 可)

  **設計判断**: scrollbar の見た目には触らず、業界 92% の drag-to-pan + 67% の Today + 50% の Prev/Next で discoverability を担保。Chromium Fluent overlay の auto-fade は受容(全 Gantt 製品が受容、CSS で override 不能仕様)。

## 0.3.3

### Patch Changes

- 724e867: 横スクロール discoverability を OS 非依存に改善。

  - 右端 edge mask(linear-gradient で `--ui-bg` に向けて fade)で「もっと右にあるよ」を全ブラウザで affordance 表示
  - scroll-driven animation 対応ブラウザ(Chrome 115+/Safari 26+)では末尾到達時に edge mask の opacity が 0 へ
  - Native scrollbar を `scrollbar-color`(モダン標準) + `::-webkit-scrollbar`(legacy fallback)で常時薄表示+hover で強調
  - WCAG 3:1 contrast を満たす thumb 色をデフォルトに(`oklch(0.7 0 0)` → hover `oklch(0.45 0 0)`)
  - タッチ専用端末(`@media not (any-hover: hover)`)では scrollbar 透明、edge mask のみで affordance

  新規 CSS 変数:

  - `--ui-scrollbar-thumb`
  - `--ui-scrollbar-thumb-hover`
  - `--ui-scrollbar-size`
  - `--ui-edge-fade-width`(0 で edge mask 無効化可)

  macOS の "Show Scroll Bars: When Scrolling"(システムデフォルト)では `scrollbar-color` 仕様で無視されるが、edge mask によって全環境で affordance を担保。

## 0.3.2

### Patch Changes

- 000a234: 0.3.1 で追加した scrollbar styling(`scrollbar-color`/`scrollbar-width` + `::-webkit-scrollbar` + `@media (any-hover: none)`)を **revert**。

  理由:

  - iPhone Safari で `@media (any-hover: none)` が発動して完全透明化、touch でも横スクロール affordance が欲しいケースに不対応
  - Windows / macOS / Linux で OS-native scrollbar 仕様に準拠する `scrollbar-color`/`scrollbar-width` を使った結果、PC 機種ごとに見え方が大きく違って統一感がない
  - 「discoverability 改善」というゴール自体は維持しつつ、別アプローチで再設計予定(JS 製カスタム scrollbar / edge fade gradient / ナビボタン などを検討)

## 0.3.1

### Patch Changes

- 8f7f150: `.timeline` のスクロールバーを **常時薄表示 + ホバーで強調** に変更。macOS の overlay scrollbar 仕様で「右にもっと続いていることが分からない」UX 問題を解消(`overflow-x: scroll` でも見えなかった問題)。

  - 標準 `scrollbar-color` / `scrollbar-width: thin` を主、`::-webkit-scrollbar` を fallback
  - `@supports selector(::-webkit-scrollbar) and (not (scrollbar-color: auto))` で出し分け(両方適用すると webkit-pseudo が無効化される仕様への対策)
  - 新 CSS 変数: `--ui-scrollbar-thumb` / `--ui-scrollbar-thumb-hover` / `--ui-scrollbar-size`
  - `@media (any-hover: none)` で pure-touch デバイスは透明化(マウス付き iPad は通常表示)
  - `scrollbar-gutter: stable` で classic モード時のレイアウト揺れを防止

## 0.3.0

### Minor Changes

- 7652b79: WeekZoom の下段ヘッダを「月毎に W1 から始まる週番号」に変更(慣例 A: 週の月曜日が属する月で帰属)。

  - `projection.ts` に `weekOfMonth(date)` を追加(date-fns の `getWeekOfMonth` は `weekStartsOn:1` で第 1 週が W2 を返すバグがあるため自前実装)
  - `HeaderTier` 型に `format?: (date: Date) => string` を任意追加。既存の `fmt: string` は optional 化(バックワードコンパチ:従来の `{ unit, fmt }` 形式はそのまま動く)
  - `ZOOMS.week.headers[1]` を `format: (d) => 'W' + weekOfMonth(d)` に変更
  - DayZoom / MonthZoom / YearZoom は変更なし

  例(viewport 2026-04-27〜):

  - 旧: W18, W19, W20, W21, W22, W23, ...(年内 ISO 週)
  - 新: W4, W1, W2, W3, W4, W1, ...(月内リセット)

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
