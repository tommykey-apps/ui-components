---
'@tommykey-apps/ui-components': patch
---

fix(Bar): tooltip が hover 解除時に画面左へ一瞬飛んで消える bug を解消 (#60、 #42 関連)

`pointerleave` で `cursorAnchor = null` に戻していたが、 bits-ui (floating-ui) は `customAnchor` が null になると trigger 要素 (bar) を anchor として再計算し、 wide bar では shift middleware で viewport 端にクランプされて 1 RAF だけ「左に飛んだ」 位置で描画されていた。

`handlePointerLeave` を削除し、 cursor 位置の virtual anchor を unmount まで保持する。 bits-ui が `data-state="closed"` で unmount すると virtual element ごと GC され、 次回 pointerenter で `createCursorAnchor` が新 instance を作るので stale 参照問題なし。

Playwright で再現 (frame1 で left=595→37 へ jump) → 修正後 (frame1 で left=595 保持、 frame2 で unmount) を確認。 #42 の virtual anchor 実装 (`customAnchor={cursorAnchor}`) も regression test で恒久化。
