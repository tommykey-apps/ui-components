---
'@tommykey-apps/ui-components': patch
---

fix(ResourceTimeline): rail auto-fit の chrome (padding + border) を `getComputedStyle` で動的計算、 マジック数値を撤去。

v0.9.2 (#51) で text width 計測自体は正しくなったが、 ResourceTimeline 側で text → grid track の間に挟まる chrome を `RAIL_PADDING_PX = 24` (row padding のみ) としていたため、 `.resources` aside の `border-right: 1px` を加算し忘れていた → CI で 1px ellipsis 切れ継続。

修正:
- `.resource-row` (padding + border) と `.resources` (border) の computed style から chrome を実測
- `RAIL_SAFETY_PX = 1` で sub-pixel font hinting buffer
- マジック数値撤去で将来 CSS 変更時の乖離を防止
