---
'@tommykey-apps/ui-components': patch
---

fix(Bar): resize ハンドルに必須 ARIA 属性と keyboard アクセス手段を追加 (#81)

`Bar.svelte` の resize ハンドル (`role="separator"`) は WAI-ARIA 上 focusable splitter として `aria-valuenow` / `aria-orientation` が必須、 かつキーボードユーザーが到達するための `tabindex` が必要だった。 従来は属性も `tabindex` も欠落しており、 a11y Critical。

- `tabindex={0}` 追加 (handle にキーボードフォーカス可能に)
- `aria-orientation="vertical"` 明示 (default は horizontal)
- `aria-valuenow={0}` (start handle) / `aria-valuenow={100}` (end handle) 付与
- handle focus 中の矢印キーで該当 edge を resize する handler (`handleHandleKeydown`) を新設 (Alt キー不要、 edge が自明なので)
