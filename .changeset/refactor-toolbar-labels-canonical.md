---
'@tommykey-apps/ui-components': patch
---

refactor(TimelineToolbar): `ToolbarLabels` / `DEFAULT_TOOLBAR_LABELS` を `labels.ts` に集約 (#66)

inline 定義から `labels.ts` の canonical 型に移動し、 `index.ts` から `ToolbarLabels` / `DEFAULT_TOOLBAR_LABELS` を export。 consumer が覚える type は 1 つだけ (#66 の DX 問題を解決)。

API surface (`labels` / `ariaLabels` 2 prop) は維持 (WAI-ARIA APG: icon-only button は aria-label 必須、 text button は visible text が name 兼任 — 完全統合せず両者を complementary に扱う)。 backward-compatible。
