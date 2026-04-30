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

## ライブラリの構造

- `src/lib/` — 公開コード(`@sveltejs/package` が `dist/` に変換)
- `src/lib/index.ts` — export 集約
- `src/routes/` — ローカル sandbox(npm publish には含まれない)
- `src/stories/` — Storybook 用ストーリー(同上)
- `.storybook/` — Storybook 設定
