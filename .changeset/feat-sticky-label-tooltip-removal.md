---
'@tommykey-apps/ui-components': major
---

feat(Bar): label を sticky 化 (#84) + hover tooltip 全廃 (BREAKING)

`Bar.svelte` の label を CSS `position: sticky` で常時 viewport 内に貼り付ける挙動に変更し、 従来の bits-ui Tooltip + floating-ui virtual anchor (cursorAnchor) ベースの hover tooltip を完全廃止 (#42 / #60 の旧 tooltip bug も本実装で吸収)。

## なぜ再挑戦?

#32 で sticky 導入 → #39 で「CSS spec 上不可」 と判断して revert、 tooltip 常時 enabled で UX 補償していた。 しかし consumer (resource-planner) の実機運用で **tooltip ベースの UX は離散的で発見しづらく、 常時可視のラベル位置追従が望ましい** と再評価。

#39 の判断 ("CSS spec 上不可") は誤りで、 業界実装 ([DHTMLX Gantt の `sticky: true`](https://docs.dhtmlx.com/gantt/desktop__layout_config.html) や [Ben Nadel の Angular Gantt](https://www.bennadel.com/blog/3961-having-fun-with-the-horizontal-usage-of-position-sticky-in-angular-11-0-5.htm)) と同様に、 親の `overflow: hidden` を外して label 側に `max-width` を設定すれば CSS only で実現可能。 JS scroll listener も不要。

## 主な実装

### CSS-only sticky (Ben Nadel pattern)

\`\`\`css
.bar {
  position: absolute;
  /* overflow: hidden は付けない (sticky 親条件) */
}
.label {
  position: sticky;
  left: var(--ui-resource-col-width, 200px);  /* rail 右端に貼り付く */
  flex: 0 1 auto;                              /* intrinsic width — flex:1 だと sticky shift 余地 0 */
  max-width: 100%;                             /* bar 幅まで (overflow 廃止の補償) */
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

| 削除 / 変更 | 影響 |
|---|---|
| Bar の hover tooltip (bits-ui 経由) | hover で project 名を出す UI は消失。 sticky label で常時可視に置換 |
| `bits-ui` peer dependency | consumer 側で他用途で bits-ui を使っていない場合、 単独で install 不要に |
| `Tooltip.Provider` の library 内 wrap | 廃止。 consumer は自前 Provider を持っている場合も影響なし |

## Refs

- closes #84
- 関連 (本 PR で吸収): #42 cursor 追従 / #60 close 時 left jump
- 設計判断の根拠: [CSS Position L3 sticky](https://www.w3.org/TR/css-position-3/#sticky-pos), [MDN position sticky overflow constraint](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky_positioning)
