---
'@tommykey-apps/ui-components': minor
---

feat(ResourceTimeline): auto-fit resource rail width to the longest name

`resourceColWidth` now accepts `'auto'` (opt-in) in addition to a number. When
'auto', the rail column shrinks/expands to the content with `minmax(min,
fit-content(max))`. Two new props control the bounds:

```svelte
<ResourceTimeline resourceColWidth="auto" /> <!-- default min=100, max=400 -->
<ResourceTimeline resourceColWidth="auto" resourceColMinWidth={120} resourceColMaxWidth={300} />
```

CSS-only via CSS Grid `fit-content()` — no `ResizeObserver`, no `measureText`,
no `$effect`. `position: sticky` on the rail continues to work because it is
independent of column sizing. Names that exceed the max still ellipsis-truncate
as before.

Backward compatible: `resourceColWidth` default is still `200` (fixed px).
Consumers opt in by passing `'auto'`.
