---
'@tommykey-apps/ui-components': patch
---

fix(TimelineToolbar): aria-pressed=true button の fg fallback に `--ui-bar-fg` を挟む

bg 側は既に 3 段 fallback (`--ui-toolbar-button-bg-active → --ui-bar-bg → #4f46e5`) だが、fg 側だけ semantic primitive 段 (`--ui-bar-fg`) が抜けて `#ffffff` 直結だったため、`--ui-bar-bg` を白系にするテーマで bg と衝突して文字が読めなくなっていた。bg と対称な 3 段 chain に揃える。
