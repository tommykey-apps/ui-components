---
'@tommykey-apps/ui-components': patch
---

fix(ResourceTimeline): aria-live region に `aria-atomic="true"` 追加 (#70)

`role="status" aria-live="polite"` だけだと、 keyboard 連打 (ArrowRight 連続 move) で status が高速更新された際に NVDA 等のスクリーンリーダーが中間値を skip して最終値だけアナウンスする保証がない。 WAI-ARIA APG 推奨の `aria-atomic="true"` を追加し、 region 全体を atomic に再 announce する挙動を明示。
