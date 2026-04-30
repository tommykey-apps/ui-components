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
