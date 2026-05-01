---
'@tommykey-apps/ui-components': patch
---

0.3.1 で追加した scrollbar styling(`scrollbar-color`/`scrollbar-width` + `::-webkit-scrollbar` + `@media (any-hover: none)`)を **revert**。

理由:
- iPhone Safari で `@media (any-hover: none)` が発動して完全透明化、touch でも横スクロール affordance が欲しいケースに不対応
- Windows / macOS / Linux で OS-native scrollbar 仕様に準拠する `scrollbar-color`/`scrollbar-width` を使った結果、PC 機種ごとに見え方が大きく違って統一感がない
- 「discoverability 改善」というゴール自体は維持しつつ、別アプローチで再設計予定(JS製カスタムscrollbar / edge fade gradient / ナビボタン などを検討)
