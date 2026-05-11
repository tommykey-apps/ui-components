---
'@tommykey-apps/ui-components': patch
---

fix(Bar): keep the project label visible by sticking it to the viewport edge

Long-duration bars (e.g. 6+ months) that extend beyond the viewport used to render
their label at the bar's leading edge — which could be hundreds of pixels off-screen,
making it impossible to tell which project a bar belonged to without scrolling.

The `.label` span now uses `position: sticky; left: 8px; right: 8px;` so it tracks
the viewport's left edge while the bar is partially scrolled out, then snaps back
to its normal position once the bar is fully in view. CSS-only; no JS observers.
Matches the Gantt UX of Google Sheets / Linear / Microsoft Project Web.

The existing hover-tooltip (`#23` / `#28`) still triggers when the label is
ellipsis-truncated on narrow bars — the two mechanisms address different cases
(viewport-out vs. truncation) and don't interfere.
