---
'@tommykey-apps/ui-components': minor
---

fix(Bar): revert sticky label (spec violation) and always-enable the hover tooltip

The `position: sticky` label introduced in `#32` does not work as designed. CSS
sticky positioning is constrained to the element's nearest containing block, and
`.label` sits inside `.bar` which is `position: absolute; overflow: hidden;`.
That means when a long bar scrolls partially off-screen, the label is pinned to
the bar's left edge — not the viewport's left edge — and disappears with the bar.
Verified in the consumer (`tommykey-apps/resource-planner#162`).

To compensate, the existing hover tooltip (`#23` / `#28`) — which previously only
appeared when the label was ellipsis-truncated — now always opens on hover.
Long bars whose label runs off-screen can still be identified by hovering.

### Removed

- `.label { position: sticky; left: 8px; right: 8px; }`
- `Tooltip.Root disabled={!labelTruncated}` guard (now always enabled)
- `labelTruncated` state, `measureTruncation`, `labelEl` binding, `document.fonts.ready`
  hook, `ResizeObserver` lifecycle inside `Bar.svelte`
- `src/lib/timeline/truncation.ts` and its test (`isTruncated` was only used for
  the truncation guard, no other consumers)

### Consumer impact

Behavior change visible to consumers — `minor` rather than `patch`:
- Hover anywhere on a bar now opens a tooltip (previously only when text was
  ellipsis-truncated). Linear / Asana / Microsoft Project Web all use a similar
  always-on pattern.
- `#32`'s sticky positioning was never actually working in production; no
  consumer should have relied on its (non-existent) behavior.
