---
'@tommykey-apps/ui-components': minor
---

feat(i18n): accept `labels` prop on `ResourceTimeline` for a11y / aria-live overrides

Hard-coded Japanese a11y strings (resize handle `aria-label`, `aria-live` status
messages) used to bleed into every consumer regardless of locale. The library now
ships **English defaults** and exposes a `labels` prop on `ResourceTimeline` so
consumers can inject their own translations:

```svelte
<ResourceTimeline
  labels={{
    bar: { resizeStart: '開始日リサイズ', resizeEnd: '終了日リサイズ' },
    canvas: { region: 'タイムライン' },
    status: {
      move: (range) => `移動: ${range}`,
      resizeStart: (range) => `開始日変更: ${range}`,
      // ... rest
    }
  }}
  {...other}
/>
```

New public types: `BarLabels`, `TimelineLabels`, and a `DEFAULT_TIMELINE_LABELS`
constant for consumers that want to spread/override partial keys.

Backward compatible: defaults move from Japanese to English, but any consumer who
was already passing through these strings would override them anyway. Consumers
that relied on the implicit Japanese defaults need to either accept the English
defaults or pass a `labels` prop.
