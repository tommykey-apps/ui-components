---
'@tommykey-apps/ui-components': patch
---

Storybook に light/dark テーマトグルを追加(toolbar から切替可能)。

- `@storybook/addon-themes` を `withThemeByClassName` で導入
- `.storybook/preview.css` に `:root` と `.dark` の `--ui-*` 変数定義を追加(ライブラリ自身は色を持たない方針のため、Storybook 側で demo 値を提供)
- ライブラリのコードは無変更(scoped CSS の var fallback 機構がそのまま動作)

公開 Storybook (https://tommykey-apps.github.io/ui-components/) からも切替可能。
