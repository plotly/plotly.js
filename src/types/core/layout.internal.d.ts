/**
 * Internal layout types (not in public API)
 *
 * These are runtime-resolved versions of layout with internal state
 * properties. For public layout types, see layout.d.ts and
 * generated/schema.d.ts.
 */

import type { Locale, Selection } from 'd3';
import type { Layout } from '../generated/schema';
import type { Color } from '../lib/common';

/**
 * Fully processed layout with all defaults applied (internal use).
 *
 * Extends the public `Layout` with the `_`-prefixed bookkeeping fields the
 * defaults/supply/plot pipeline attaches. Trace and component modules read
 * and write these fields; users should not touch them directly.
 */
export interface FullLayout extends Layout {
    // Core internal state
    /** Resolved list of base-plot modules in use (cartesian, polar, …). */
    _basePlotModules?: any[];
    /** Recomputes inverse-transform caches after a transform change. */
    _calcInverseTransform?: (gd: any) => void;
    /** True once initial autosize has completed at least once. */
    _initialAutoSizeIsDone?: boolean;
    /** Cached inverse CSS transform for hit-testing. */
    _invTransform?: any;
    /** Names of legend containers present in the layout. */
    _legends?: string[];
    /** Captured `meta` references for template binding. */
    _meta?: { meta?: any; layout?: { meta?: any } };
    /** Resolved list of trace modules in use. */
    _modules?: any[];
    /** Map of subplot id → subplot object (cartesian/3D/geo/…). */
    _plots?: { [key: string]: any };
    /** Accumulated margin pushes from components like colorbars. */
    _pushmargin?: { [key: string]: any };
    /** Resolved plot area dimensions and margins. */
    _size?: LayoutSize;
    /** Grouping of subplot ids by family (cartesian, polar, …). */
    _subplots?: SubplotInfo;
    /** Resolved template applied to this layout. */
    _template?: any;
    /** Unique identifier for this layout instance. */
    _uid?: string;

    // SVG layers
    /** Background-layer selection. */
    _bgLayer?: Selection<any>;
    /** Cartesian subplot layer selection. */
    _cartesianlayer?: Selection<any>;
    /** Clip-path defs selection. */
    _clips?: Selection<any>;
    /** Top-level container selection (the graph div's inner wrapper). */
    _container?: Selection<any>;
    /** SVG `<defs>` selection. */
    _defs?: Selection<any>;
    /** Drag-cover overlay used during interactions. */
    _dragCover?: Selection<any>;
    /** Drag handle layer selection. */
    _draggers?: Selection<any>;
    /** Funnel-area subplot layer selection. */
    _funnelarealayer?: Selection<any>;
    /** Geo subplot layer selection. */
    _geolayer?: Selection<any>;
    /** WebGL canvas selection. */
    _glcanvas?: Selection<any>;
    /** WebGL container selection. */
    _glcontainer?: Selection<any>;
    /** WebGL image overlay selection. */
    _glimages?: Selection<any>;
    /** Icicle subplot layer selection. */
    _iciclelayer?: Selection<any>;
    /** Lower-layer images selection. */
    _imageLowerLayer?: Selection<any>;
    /** Upper-layer images selection. */
    _imageUpperLayer?: Selection<any>;
    /** Indicator subplot layer selection. */
    _indicatorlayer?: Selection<any>;
    /** Info layer (annotations, titles, etc.) selection. */
    _infolayer?: Selection<any>;
    /** Menu (updatemenu) layer selection. */
    _menulayer?: Selection<any>;
    /** Mode-bar container div selection. */
    _modebardiv?: Selection<any>;
    /** Root SVG paper selection. */
    _paper?: Selection<any>;
    /** Paper-div selection (the container holding `_paper`). */
    _paperdiv?: Selection<any>;
    /** Pie subplot layer selection. */
    _pielayer?: Selection<any>;
    /** Polar subplot layer selection. */
    _polarlayer?: Selection<any>;
    /** Selection-overlay layer. */
    _selectionLayer?: Selection<any>;
    /** Lower shapes layer selection. */
    _shapeLowerLayer?: Selection<any>;
    /** Upper shapes layer selection. */
    _shapeUpperLayer?: Selection<any>;
    /** Smith subplot layer selection. */
    _smithlayer?: Selection<any>;
    /** Sunburst subplot layer selection. */
    _sunburstlayer?: Selection<any>;
    /** Ternary subplot layer selection. */
    _ternarylayer?: Selection<any>;
    /** Top-level defs selection (rendered on top of `_paper`). */
    _topdefs?: Selection<any>;
    /** Top-level clip-path defs selection. */
    _topclips?: Selection<any>;
    /** Top-paper SVG selection (overlay layer). */
    _toppaper?: Selection<any>;
    /** Treemap subplot layer selection. */
    _treemaplayer?: Selection<any>;
    /** Zoom-box overlay selection. */
    _zoomlayer?: Selection<any>;

    // Hover state
    /** Hover-label SVG layer selection. */
    _hoverlayer?: Selection<any>;
    /** Hover paper selection (separate from the main paper for overlays). */
    _hoverpaper?: Selection<any>;
    /** Subplot id currently showing hover labels. */
    _hoversubplot?: string | null;
    /** Selection of the last-rendered hover label group. */
    _lasthover?: Selection<any> | null;
    /** Callback to redo the most recent hover (used after resize/relayout). */
    _rehover?: (() => void) | null;

    // Modebar
    /** Active mode-bar instance. */
    _modeBar?: any;

    // Cross-trace computation state
    /** Bar/box alignment options keyed by axis pair. */
    _alignmentOpts?: Record<string, any>;
    /** Groups of axes joined by `constrain` settings. */
    _axisConstraintGroups?: any[];
    /** Groups of axes joined by `matches` settings. */
    _axisMatchGroups?: any[];
    /** Resolved coloraxis containers keyed by id. */
    _colorAxes?: Record<string, any>;
    /** Trace-defaults derived from the active template. */
    _dataTemplate?: Record<string, any>;
    /** Extra d3-format specifiers from layout/trace settings. */
    _extraFormat?: Record<string, any>;
    /** First scatter trace per subplot (used for hover styling). */
    _firstScatter?: Record<string, any>;
    /** Funnelarea color map keyed by label. */
    _funnelareacolormap?: Record<string, Color>;
    /** Shared histogram-binning options across stacked traces. */
    _histogramBinOpts?: Record<string, any>;
    /** Icicle color map keyed by id. */
    _iciclecolormap?: Record<string, Color>;
    /** Number of box traces currently visible. */
    _numBoxes?: number;
    /** Number of violin traces currently visible. */
    _numViolins?: number;
    /** Pie color map keyed by label. */
    _piecolormap?: Record<string, Color>;
    /** Resolved range-slider trace data. */
    _rangeSliderData?: any[];
    /** Axis ids that have requested a range slider. */
    _requestRangeslider?: Record<string, boolean>;
    /** Numeric-rounding options keyed by axis. */
    _roundFnOpts?: Record<string, any>;
    /** Scatter stacking groups keyed by stackgroup id. */
    _scatterStackOpts?: Record<string, any>;
    /** Splom axes resolved by direction. */
    _splomAxes?: { x: Record<string, any>; y: Record<string, any> };
    /** Splom shared grid renderer. */
    _splomGrid?: any;
    /** Default splom grid options. */
    _splomGridDflt?: Record<string, any>;
    /** Splom WebGL scenes keyed by subplot. */
    _splomScenes?: Record<string, any>;
    /** Splom subplot lookup. */
    _splomSubplots?: Record<string, any>;
    /** Sunburst color map keyed by id. */
    _sunburstcolormap?: Record<string, Color>;
    /** Resolved list of transform modules in use. */
    _transformModules?: any[];
    /** Treemap color map keyed by id. */
    _treemapcolormap?: Record<string, Color>;
    /** Violin scale-group statistics keyed by group id. */
    _violinScaleGroupStats?: Record<string, any>;
    /** Trace modules that are visible after applying `visible`. */
    _visibleModules?: any[];

    // Scalar flags and values
    /** Whether cartesian spikelines are currently active. */
    _cartesianSpikesEnabled?: 'on' | 'off';
    /** Name of the currently-active animation frame. */
    _currentFrame?: string;
    /** Active d3 locale for number/date formatting. */
    _d3locale?: Locale;
    /** Total number of data points across traces. */
    _dataLength?: number;
    /** Whether scroll-zoom is enabled by config. */
    _enablescrollzoom?: boolean;
    /** Default titles keyed by container (axis title fallback, etc.). */
    _dfltTitle?: Record<string, string>;
    /** True while a GUI-driven edit (chart-studio) is happening. */
    _guiEditing?: boolean;
    /** Predicate checking whether a category (`'cartesian'`, `'gl3d'`, …) is active. */
    _has?: (category: string) => boolean;
    /** Optimization flag: only large splom traces present. */
    _hasOnlyLargeSploms?: boolean;
    /** Inside-tick-label range overrides keyed by axis. */
    _insideTickLabelsUpdaterange?: Record<string, any>;
    /** Inverse horizontal scale factor for CSS transforms. */
    _invScaleX?: number;
    /** Inverse vertical scale factor for CSS transforms. */
    _invScaleY?: number;
    /** Most recent bounding box of the graph div. */
    _lastBBox?: DOMRect;
    /** Mapbox access token captured from config. */
    _mapboxAccessToken?: string;
    /** Push-margin ids keyed by component path. */
    _pushmarginIds?: Record<string, number>;
    /** Counter to prevent infinite auto-margin redraw loops. */
    _redrawFromAutoMarginCount?: number;
    /** True while a relayout/replot is in progress. */
    _replotting?: boolean;
    /** Reserved margin pixels per side. */
    _reservedMargin?: Record<string, number>;
    /** Whether the background layer needs to be (re)created. */
    _shouldCreateBgLayer?: boolean;
    /** Skip the defaults step (used by certain test/edit paths). */
    _skipDefaults?: boolean;
    /** Stable unique ids for each trace. */
    _traceUids?: string[];
    /** Localized noun for "trace" (used in default titles). */
    _traceWord?: string;
    /** Z-index ordering of subplot layers. */
    _zindices?: number[];

    // Interaction state
    /** Index of the active selection in `layout.selections`. */
    _activeSelectionIndex?: number;
    /** Index of the active shape in `layout.shapes`. */
    _activeShapeIndex?: number;
    /** Callback to deactivate the active selection. */
    _deactivateSelection?: (gd: any) => void;
    /** Callback to deactivate the active shape. */
    _deactivateShape?: (gd: any) => void;
    /** Cached deselect callback. */
    _deselect?: any;
    /** Vertical offset for colorbar title repositioning. */
    _hColorbarMoveCBTitle?: number;
    /** Vertical offset for colorbar move title. */
    _hColorbarMoveTitle?: number;
    /** Subplot id of the last selection interaction. */
    _lastSelectedSubplot?: string;
    /** Suppress emitting `plotly_selected` at the start of selection. */
    _noEmitSelectedAtStart?: boolean;
    /** True while a draw outline is being rendered (lasso/select). */
    _outlining?: boolean;
    /** Pre-GUI state snapshot for undo support. */
    _preGUI?: Record<string, any>;
    /** Previous selection snapshots for restoration. */
    _previousSelections?: any[];
    /** Callback to redo the most recent drag. */
    _redrag?: (() => void) | null;
    /** Callback to redo the most recent selection. */
    _reselect?: (() => void) | null;
    /** Per-trace pre-GUI state snapshot. */
    _tracePreGUI?: Record<string, Record<string, any>>;

    /** Other internal fields written by trace modules. */
    [key: string]: any;
}

/**
 * Layout size information (internal).
 *
 * Pixel dimensions of the plot area and its margins. Single-letter field
 * names match the historical Plotly internal convention.
 */
export interface LayoutSize {
    /** Bottom margin (px). */
    b: number;
    /** Plot-area height (px). */
    h: number;
    /** Left margin (px). */
    l: number;
    /** Pad (px) — additional inside-edge spacing. */
    p: number;
    /** Right margin (px). */
    r: number;
    /** Top margin (px). */
    t: number;
    /** Plot-area width (px). */
    w: number;
}

/**
 * Subplot information (internal).
 *
 * Lists subplot identifiers per subplot family. The catch-all index
 * signature accommodates additional families added by trace modules.
 */
export interface SubplotInfo {
    /** Additional subplot families keyed by name. */
    [key: string]: string[] | undefined;
    /** Cartesian subplot ids (e.g. `'xy'`, `'x2y2'`). */
    cartesian?: string[];
    /** Geo subplot ids. */
    geo?: string[];
    /** GL2D subplot ids. */
    gl2d?: string[];
    /** Map subplot ids. */
    map?: string[];
    /** Mapbox subplot ids (deprecated alias of `map`). */
    mapbox?: string[];
    /** Pie subplot ids. */
    pie?: string[];
    /** Polar subplot ids. */
    polar?: string[];
    /** Sankey subplot ids. */
    sankey?: string[];
    /** Ternary subplot ids. */
    ternary?: string[];
}
