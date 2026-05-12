# ui-components

`@tommykey-apps/ui-components` — Svelte 5 コンポーネントライブラリ、GitHub Packages 配布。

## プロジェクト構成

```
ui-components/
├── src/
│   ├── lib/              # 公開コード (svelte-package が dist/ に変換)
│   │   └── index.ts      # export 集約
│   ├── stories/          # Storybook ストーリー (publish 対象外)
│   ├── routes/           # SvelteKit ローカル sandbox (publish 対象外)
│   └── app.html
├── .storybook/           # Storybook 設定
├── .changeset/           # Changesets 設定 + バンプ予定
├── .flox/                # flox 環境 (nodejs_22 + pnpm)
└── .github/workflows/    # CI (PR検証) + Release (changesets/action)
```

## 開発環境

**flox を使う。** 手動でツールをインストールしない。

```bash
flox activate   # nodejs 22 + pnpm 10
```

## コマンド

```bash
pnpm install               # 依存インストール
pnpm dev                   # SvelteKit dev server
pnpm storybook             # Storybook (port 6006)
pnpm build                 # ライブラリビルド (dist/ + publint)
pnpm build-storybook       # Storybook 静的サイトビルド
pnpm check                 # svelte-check
pnpm changeset             # 変更を記録
```

## Publish フロー

1. 変更を実装し、`pnpm changeset` でバンプ種別 (patch/minor/major) + 説明を記録
2. `.changeset/*.md` も含めて PR を main に merge
3. `.github/workflows/release.yaml` が「Version Packages」PR を自動作成 (バージョン bump + CHANGELOG 更新)
4. その PR を merge すると GitHub Packages に自動 publish される
5. PAT 不要 (`secrets.GITHUB_TOKEN` で完結)

## 消費アプリ側の `.npmrc` 設定

```
@tommykey-apps:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

ローカル: `~/.zshrc` に `read:packages` スコープの PAT を export。
CI: `secrets.GITHUB_TOKEN` をそのまま使う。

## 設計方針

- **スタイル: scoped `<style>` + CSS変数 (`--ui-*` プレフィクス)**
  消費アプリの Tailwind バージョンに依存させない。テーマは CSS変数で消費側が上書き。
- **state: Svelte 5 runes (`$state` / `$derived` / `$bindable`) + Reactive Class パターン**
  ストアは使わない。
- **drag/resize: `setPointerCapture` パターン**
  window listener は使わない。
- **時間処理: date-fns v4** (Temporal は Node ネイティブ未対応のため見送り)
- **コンポーネント API: URL/routing 非依存**
  filterStart や zoom は props (`$bindable`) として受け取る。URL同期は消費アプリ側の責務。
- **日付の渡し方**: 必ず **local-midnight Date** で渡す。`new Date(2026, 4, 4)` のように数値引数で。
  `new Date('YYYY-MM-DDT00:00:00Z')` 形式は UTC 固定 = 非UTC環境(JST等)で時刻ズレし、`barRect` の aligned 判定が外れて末端列に +1 col 余計な太さが出る。
- **TimelineToolbar 用 CSS 変数**(消費アプリで上書き可):
  - `--ui-toolbar-bg / -fg / -gap / -padding`
  - `--ui-toolbar-button-bg / -fg / -border / -bg-hover / -bg-active / -fg-active`
  - `--ui-toolbar-button-radius / -height / -padding-x / -font-size`
  - `--ui-toolbar-focus-ring / -focus-ring-offset / -icon-size`
- **icons.ts**: phosphor-icons (MIT) の SVG path を文字列定数化(attribution は本ファイル冒頭コメント)
- **drag-to-pan**: `ResourceTimeline` の canvas 空白領域マウスドラッグで横スクロール。`setPointerCapture` パターン、threshold 5px、Bar 上は除外。`viewportStart` 変更時に scrollLeft 自動 0 リセット

## Phase 2 進行中の改善 (post-0.1.x)

- 二段ヘッダで連続する同一値を col-span でグルーピング(年表示の繰り返し回避)
- 同行内 Assignment の vertical stacking(時間重複時に縦に積む、行高さ動的)
- Vitest による projection 単体テスト
- キーボード(矢印キーで move/resize)+ aria-live status 対応

## TDD 運用 (#16)

Claude Code session 内で本 repo を編集する際は **必ず先にテストを書く**。

- `/tdd <task>` skill で workflow ガイド (`.claude/skills/tdd/SKILL.md`)
- `src/lib/**.{ts,svelte}` の Edit / Write 前に、対応 `*.test.ts` が `git diff --cached` に出るか **PreToolUse hook** が確認 (`.claude/hooks/warn-untested.sh`)
- staged されていなければ `permissionDecision: "ask"` で確認 prompt (deny ではなく ask、iterative work を阻害しない)
- AI / 人間共通の discipline。RED → GREEN → REFACTOR で進める
- `src/stories/` / `src/routes/` (publish 対象外) は対象外
- consumer 側の同 setup: [resource-planner #92 / PR #93](https://github.com/tommykey-apps/resource-planner/pull/93)

## コード品質 audit 自動化 (#76)

コーディング後に静的解析 + code review が自動推奨される仕組みを Claude Code hooks + CI で組んでいる。

- **PostToolUse hook** (`Edit|Write`): 編集ファイルを `.claude/state/dirty-files.log` に記録 + `dirty.flag` touch (`.claude/hooks/post-edit-touch.sh`)
- **Stop hook**: dirty なら次ターンの additionalContext に「`/audit` 推奨」を soft 通知 (強制 block ではない)。 `.claude/state/dirty.flag` を `rm` で skip 可能
- **`/audit` skill** (user-level): `pnpm check` / `pnpm test` / `knip` (unused) / `jscpd` (重複) / `madge` (循環) → 大規模変更時は `code-reviewer` agent spawn → dirty クリア
- **`code-reviewer` agent** (user-level): Svelte 5 / SvelteKit / TS / bits-ui / floating-ui の公式 docs 準拠を厳しく見る、 「`unknown` キャスト / マジック数値 / 公式 docs 省略」 等の手癖を重点検出
- **CI audit workflow** (`.github/workflows/audit.yaml`): ローカルバイパスされても PR で同 audit を実行 (`continue-on-error` で main CI と分離)

audit 系コマンドは未 install でも `pnpm dlx` で動的取得。 速度重視なら devDeps 化。
