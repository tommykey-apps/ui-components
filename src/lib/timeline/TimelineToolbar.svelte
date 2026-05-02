<script lang="ts">
	import { addUnits, startOfUnit } from './projection.js';
	import { ZOOMS } from './zoom.js';
	import type { ZoomLevel } from './types.js';
	import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from './icons.js';

	type ToolbarLabels = {
		today?: string;
		prev?: string;
		next?: string;
		zoom?: string;
		zoomDay?: string;
		zoomWeek?: string;
		zoomMonth?: string;
		zoomYear?: string;
	};

	type Props = {
		viewportStart: Date;
		zoom: ZoomLevel;
		zooms?: Record<string, ZoomLevel>;
		step?: number;
		today?: Date;
		showZoom?: boolean;
		showToday?: boolean;
		showNav?: boolean;
		labels?: ToolbarLabels;
		ariaLabels?: ToolbarLabels;
		onTodayClick?: (today: Date) => void;
		onNavigate?: (newStart: Date, dir: 'prev' | 'next') => void;
		onZoomChange?: (zoom: ZoomLevel) => void;
	};

	let {
		viewportStart = $bindable(),
		zoom = $bindable(),
		zooms = ZOOMS,
		step,
		today,
		showZoom = true,
		showToday = true,
		showNav = true,
		labels,
		ariaLabels,
		onTodayClick,
		onNavigate,
		onZoomChange
	}: Props = $props();

	const DEFAULT_LABELS: Required<ToolbarLabels> = {
		today: 'Today',
		prev: 'Previous',
		next: 'Next',
		zoom: 'Zoom',
		zoomDay: 'Day',
		zoomWeek: 'Week',
		zoomMonth: 'Month',
		zoomYear: 'Year'
	};

	let L = $derived({ ...DEFAULT_LABELS, ...(labels ?? {}) });
	let A = $derived({ ...L, ...(ariaLabels ?? {}) });
	let resolvedStep = $derived(step ?? zoom.visibleCols);

	function zoomLabelFor(id: ZoomLevel['id']): string {
		switch (id) {
			case 'day':
				return L.zoomDay;
			case 'week':
				return L.zoomWeek;
			case 'month':
				return L.zoomMonth;
			case 'year':
				return L.zoomYear;
		}
	}

	function goToday() {
		viewportStart = startOfUnit(today ?? new Date(), zoom.unit);
		onTodayClick?.(viewportStart);
	}

	function goPrev() {
		viewportStart = addUnits(viewportStart, -resolvedStep, zoom.unit);
		onNavigate?.(viewportStart, 'prev');
	}

	function goNext() {
		viewportStart = addUnits(viewportStart, resolvedStep, zoom.unit);
		onNavigate?.(viewportStart, 'next');
	}

	function setZoom(z: ZoomLevel) {
		zoom = z;
		onZoomChange?.(z);
	}
</script>

<div class="toolbar">
	{#if showNav}
		<button type="button" class="btn icon" onclick={goPrev} aria-label={A.prev}>
			<svg viewBox="0 0 256 256" aria-hidden="true">
				<path d={ICON_CHEVRON_LEFT} fill="currentColor" />
			</svg>
		</button>
	{/if}
	{#if showToday}
		<button type="button" class="btn" onclick={goToday}>{L.today}</button>
	{/if}
	{#if showNav}
		<button type="button" class="btn icon" onclick={goNext} aria-label={A.next}>
			<svg viewBox="0 0 256 256" aria-hidden="true">
				<path d={ICON_CHEVRON_RIGHT} fill="currentColor" />
			</svg>
		</button>
	{/if}
	{#if showZoom}
		<div class="group">
			{#each Object.values(zooms) as z (z.id)}
				<button
					type="button"
					class="btn"
					class:active={zoom.id === z.id}
					aria-pressed={zoom.id === z.id}
					onclick={() => setZoom(z)}
				>
					{zoomLabelFor(z.id)}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.toolbar {
		display: flex;
		gap: var(--ui-toolbar-gap, 8px);
		padding: var(--ui-toolbar-padding, 0);
		background: var(--ui-toolbar-bg, transparent);
		color: var(--ui-toolbar-fg, var(--ui-fg, #1a1a1a));
		font-family: var(--ui-font, system-ui, sans-serif);
		align-items: center;
		flex-wrap: wrap;
	}

	.group {
		display: flex;
		gap: 0;
		margin-left: auto;
	}

	.group .btn {
		border-radius: 0;
	}
	.group .btn:first-child {
		border-top-left-radius: var(--ui-toolbar-button-radius, 6px);
		border-bottom-left-radius: var(--ui-toolbar-button-radius, 6px);
	}
	.group .btn:last-child {
		border-top-right-radius: var(--ui-toolbar-button-radius, 6px);
		border-bottom-right-radius: var(--ui-toolbar-button-radius, 6px);
	}
	.group .btn + .btn {
		border-left-width: 0;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		height: var(--ui-toolbar-button-height, 32px);
		padding: 0 var(--ui-toolbar-button-padding-x, 12px);
		font: inherit;
		font-size: var(--ui-toolbar-button-font-size, 13px);
		background: var(--ui-toolbar-button-bg, transparent);
		color: var(--ui-toolbar-button-fg, currentColor);
		border: 1px solid var(--ui-toolbar-button-border, var(--ui-border, #e5e5e5));
		border-radius: var(--ui-toolbar-button-radius, 6px);
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.btn:hover {
		background: var(--ui-toolbar-button-bg-hover, rgb(0 0 0 / 0.04));
	}

	.btn.active {
		background: var(--ui-toolbar-button-bg-active, var(--ui-bar-bg, #4f46e5));
		color: var(--ui-toolbar-button-fg-active, #ffffff);
		border-color: transparent;
	}

	.btn:focus-visible {
		outline: var(--ui-toolbar-focus-ring, 2px solid currentColor);
		outline-offset: var(--ui-toolbar-focus-ring-offset, 2px);
	}

	.btn.icon {
		padding: 0;
		width: var(--ui-toolbar-button-height, 32px);
	}

	.btn.icon svg {
		width: var(--ui-toolbar-icon-size, 16px);
		height: var(--ui-toolbar-icon-size, 16px);
	}
</style>
