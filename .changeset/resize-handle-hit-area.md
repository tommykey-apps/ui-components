---
'@tommykey-apps/ui-components': patch
---

fix(Bar): resize handle に透明 `::before` pseudo の hit area を追加 (WCAG 2.5.8 AA 準拠)

resize handle の visible 幅 6px はそのまま、touch / pointer 判定領域だけを縦 44 (AAA) × 横 24 (AA) に拡張。狭い zoom (1-day = 64px) でも両端 handle が重ならない設計。
