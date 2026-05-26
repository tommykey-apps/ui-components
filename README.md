# ui-components

`@tommykey-apps/ui-components` — 個人用 Svelte 5 コンポーネントライブラリ。GitHub Packages で配布。

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Runtime | Node.js | 22 |
| Package Manager | pnpm | 10 |
| Framework | Svelte | 5.55+ |
| Builder | SvelteKit + svelte-package | 2.57 / 2.5 |
| Bundler | Vite | 8 |
| Type Checking | TypeScript / svelte-check | 6 / 4 |
| Component Workshop | Storybook | 10.3 |
| Versioning | Changesets | 2.31 |
| Date Library | date-fns | 4 |
| Dev Env | flox | 1.11 |

## 開発環境

**flox を使う。** 手動で Node や pnpm をインストールしない。

```bash
flox activate   # nodejs_22 + pnpm が利用可能になる
```

## コマンド

```bash
pnpm install               # 依存インストール
pnpm dev                   # SvelteKit dev server (src/routes プレビュー用)
pnpm storybook             # Storybook 起動 (http://localhost:6006)
pnpm build                 # ライブラリビルド (dist/ に出力)
pnpm build-storybook       # Storybook 静的サイトビルド (storybook-static/)
pnpm check                 # 型チェック (svelte-check)
pnpm changeset             # 変更を記録 (バージョン bump 種別 + 説明)
```

### コード品質 audit

Claude Code セッションで `src/lib/` を編集すると、 ターン終了時に `/audit` skill 実行が自動推奨される (`.claude/hooks/stop-audit-gate.sh` 経由)。 audit は `pnpm check` / `pnpm test` / `knip` (unused exports) / `jscpd` (重複コード) / `madge` (循環依存) を順次実行し、 大規模変更時は `code-reviewer` subagent も spawn する。 ローカルバイパス防止のため PR 時に CI でも同 audit を走らせる (`.github/workflows/audit.yaml`、 `continue-on-error` で warning レベル)。 詳細は [CLAUDE.md](CLAUDE.md#コード品質-audit-自動化-76) 参照。

## バージョニング & Publish

[Changesets](https://github.com/changesets/changesets) で管理。

1. ローカルで変更後 `pnpm changeset` → patch/minor/major と説明を入力 → `.changeset/*.md` がコミットされる
2. PR を main に merge
3. GitHub Actions が「Version Packages」PR を自動作成
4. その PR を merge すると GitHub Packages へ自動 publish される

## 消費アプリ側の設定

別アプリでこのライブラリを使うには:

`.npmrc` を消費アプリに追加:

```
@tommykey-apps:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

ローカルでは `~/.zshrc` に `read:packages` スコープの PAT を設定:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

CI では `secrets.GITHUB_TOKEN` がそのまま使える。

```bash
pnpm add @tommykey-apps/ui-components
```

```svelte
<script>
  import { ResourceTimeline } from '@tommykey-apps/ui-components';
</script>
```

## Available Components

### `ResourceTimeline`

Resource × 時間軸の Gantt-style timeline。 drag/resize / cursor follow tooltip / 左 sticky rail auto-fit に対応。

```svelte
<script lang="ts">
  import { ResourceTimeline, ZOOMS, type Assignment } from '@tommykey-apps/ui-components';

  const resources = [{ id: 'r1', name: '田中 太郎' }];
  const assignments: Assignment[] = [
    { id: 'a1', resourceId: 'r1', startDate: new Date(2026, 4, 1), endDate: new Date(2026, 4, 15), label: 'A社 案件', color: '#4f46e5' },
  ];

  let viewportStart = $state(new Date());
</script>

<ResourceTimeline
  {resources}
  {assignments}
  bind:viewportStart
  zoom={ZOOMS.day}
  resourceColWidth="auto"
  onMove={(updated) => console.log('moved', updated)}
  onResize={(updated) => console.log('resized', updated)}
/>
```

主要 props (詳細は `src/lib/timeline/types.ts` 参照):

| prop | type | default | 用途 |
|---|---|---|---|
| `resources` | `Resource[]` | (required) | 行 (Resource = 人 / リソース) |
| `assignments` | `Assignment[]` | (required) | 帯 (期間 + 行への紐付け) |
| `viewportStart` | `Date` (`$bindable`) | 今日 | 表示開始日、 toolbar と双方向 binding |
| `zoom` | `ZoomLevel` | `ZOOMS.day` | `ZOOMS.day` / `week` / `month` / `year` |
| `resourceColWidth` | `number \| 'auto'` | `200` | 左 rail の幅。 `'auto'` で最長名に fit (Canvas measureText で実測) |
| `resourceColMinWidth` / `resourceColMaxWidth` | `number` | `100` / `400` | `'auto'` 時の clamp 上下限 |
| `labels` | `TimelineLabels` | 英語 default | i18n / aria 文字列の override |
| `onMove` / `onResize` | `(a: Assignment) => void` | — | drag / resize 確定時 |

### `TimelineToolbar`

ResourceTimeline と組み合わせる zoom / navigation コントロール。

```svelte
<script lang="ts">
  import { TimelineToolbar, ZOOMS } from '@tommykey-apps/ui-components';
  let viewportStart = $state(new Date());
  let zoom = $state(ZOOMS.day);
</script>

<TimelineToolbar bind:viewportStart bind:zoom />
```

主要 props (詳細は `src/lib/timeline/TimelineToolbar.svelte` 参照):

| prop | type | 用途 |
|---|---|---|
| `viewportStart` | `Date` (`$bindable`) | ResourceTimeline と同期 |
| `zoom` | `ZoomLevel` (`$bindable`) | 同上 |
| `labels` / `ariaLabels` | `Partial<...>` | 「今日」「前へ」「次へ」「日 / 週 / 月 / 年」 等の文字列 |
| `zooms` | `Record<string, ZoomLevel>` | カスタム zoom セット |

### Low-level primitives (advanced)

`ResourceTimeline` の内部 building block も bits-ui pattern に倣って **public export** している。 通常 consumer は `ResourceTimeline` 経由で十分だが、 独自のレイアウトに組み込みたい advanced ケース向け:

| export | 用途 |
|---|---|
| `Bar` | 1 本の bar (drag / resize / activate / cursor follow tooltip 内蔵)。 `ResourceTimeline` を使わず独自の grid に bar だけ載せたい場合に |
| `snapDate` | 任意の `Date` を zoom 単位の境界に snap する pure function。 consumer 側で「toolbar の day picker を週頭に丸める」 等に |

これらを **使わない** 場合は \`ResourceTimeline\` / `TimelineToolbar` だけ import すれば tree-shaking で bundle に含まれない。 dead export ではなく composition 用 building block として意図的に維持 (#71)。

### Tips

- consumer 側の **`<Tooltip.Provider>` は不要** (library 内で self-contained)
- CSS 変数で配色を上書き可: `--ui-bar-bg`, `--ui-bar-fg`, `--ui-header-bg` 等 (詳細は各 component の `<style>` 参照)

## ライブラリの構造

- `src/lib/` — 公開コード(`@sveltejs/package` が `dist/` に変換)
- `src/lib/index.ts` — export 集約
- `src/routes/` — ローカル sandbox(npm publish には含まれない)
- `src/stories/` — Storybook 用ストーリー(同上)
- `.storybook/` — Storybook 設定
