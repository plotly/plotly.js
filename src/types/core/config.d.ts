/**
 * Config types
 *
 * Plotly configuration options and edit settings.
 */

import type { PlotlyHTMLElement } from './events';
import type { ModeBarButtonAny, ModeBarDefaultButtons } from './layout';

// ---------------------------------------------------------------------------
// Edits
// ---------------------------------------------------------------------------

export interface Edits {
    /**
     * Determines if the main anchor of the annotation is editable.
     * @default false
     */
    annotationPosition: boolean;
    /**
     * Has only an effect for annotations with arrows.
     * @default false
     */
    annotationTail: boolean;
    /**
     * Enables editing annotation text.
     * @default false
     */
    annotationText: boolean;
    /**
     * Enables editing axis title text.
     * @default false
     */
    axisTitleText: boolean;
    /**
     * Enables moving colorbars.
     * @default false
     */
    colorbarPosition: boolean;
    /**
     * Enables editing colorbar title text.
     * @default false
     */
    colorbarTitleText: boolean;
    /**
     * Enables moving the legend.
     * @default false
     */
    legendPosition: boolean;
    /**
     * Enables editing trace name fields from the legend.
     * @default false
     */
    legendText: boolean;
    /**
     * Enables moving shapes.
     * @default false
     */
    shapePosition: boolean;
    /**
     * Enables editing the global layout title.
     * @default false
     */
    titleText: boolean;
}

// ---------------------------------------------------------------------------
// Image export options
// ---------------------------------------------------------------------------

export interface ToImgopts {
    format: 'jpeg' | 'png' | 'webp' | 'svg';
    /** If null, uses current graph width */
    width: number | null;
    /** If null, uses current graph height */
    height: number | null;
    scale?: number | undefined;
}

export interface DownloadImgopts {
    format: 'jpeg' | 'png' | 'webp' | 'svg';
    width: number | null;
    height: number | null;
    filename: string;
}

export interface ToImageButtonOptions {
    format?: 'png' | 'svg' | 'jpeg' | 'webp';
    filename?: string;
    height?: number;
    width?: number;
    scale?: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface Config {
    /**
     * No interactivity, for export or image generation.
     * @default false
     */
    staticPlot: boolean;
    /**
     * Determines whether math should be typeset when MathJax is present.
     * @default true
     */
    typesetMath: boolean;
    /**
     * Base URL for the 'Edit in Chart Studio' button.
     * @default ''
     */
    plotlyServerURL: string;
    /**
     * Sets all pieces of `edits` unless overridden.
     * @default false
     */
    editable: boolean;
    edits: Partial<Edits>;
    /**
     * Enables moving selections.
     * @default true
     */
    editSelection: boolean;
    /**
     * Plot with respect to layout.autosize:true and infer container size.
     * @default false
     */
    autosizable: boolean;
    /**
     * Change the layout size when window is resized.
     * @default false
     */
    responsive: boolean;
    /**
     * Whether the graph fills the container or the screen.
     * @default false
     */
    fillFrame: boolean;
    /**
     * Frame margins in fraction of the graph size.
     * @default 0
     */
    frameMargins: number;
    /**
     * Mouse wheel / two-finger scroll zoom.
     * @default 'gl3d+geo+map'
     */
    scrollZoom: string | boolean;
    /**
     * Double click interaction mode.
     * @default 'reset+autosize'
     */
    doubleClick: 'reset+autosize' | 'reset' | 'autosize' | false;
    /**
     * Delay for registering a double-click in ms.
     * @default 300
     */
    doubleClickDelay: number;
    /**
     * Show cartesian axis pan/zoom drag handles.
     * @default true
     */
    showAxisDragHandles: boolean;
    /**
     * Show direct range entry at the pan/zoom drag points.
     * @default true
     */
    showAxisRangeEntryBoxes: boolean;
    /**
     * Show tips while interacting with the resulting graphs.
     * @default true
     */
    showTips: boolean;
    /**
     * Display a link to Chart Studio Cloud at the bottom right.
     * @default false
     */
    showLink: boolean;
    /**
     * Sets the text appearing in the `showLink` link.
     * @default 'Edit chart'
     */
    linkText: string;
    /**
     * If `showLink` is true, send data when linking to Chart Studio Cloud.
     * @default true
     */
    sendData: boolean;
    /**
     * Adds a source-displaying function to show sources on the resulting graphs.
     * @default false
     */
    showSources: false | ((gd: PlotlyHTMLElement) => void | Promise<void>);
    /**
     * Mode bar display mode.
     * @default 'hover'
     */
    displayModeBar: 'hover' | boolean;
    /**
     * Show "Edit in Chart Studio" mode bar button.
     * @default false
     */
    showSendToCloud: boolean;
    /**
     * Same as `showSendToCloud`, but use a pencil icon instead of a floppy-disk.
     * @default false
     */
    showEditInChartStudio: boolean;
    /**
     * Remove mode bar buttons by name.
     * @default []
     */
    modeBarButtonsToRemove: ModeBarDefaultButtons[];
    /**
     * Add mode bar button using config objects or default button strings.
     * @default []
     */
    modeBarButtonsToAdd: ModeBarButtonAny[];
    /**
     * Define fully custom mode bar buttons as nested array of button groups.
     * @default false
     */
    modeBarButtons: ModeBarButtonAny[][] | false;
    /**
     * Statically override options for toImage modebar button.
     * @default {}
     */
    toImageButtonOptions: Partial<{
        filename: string;
        scale: number;
        format: 'png' | 'svg' | 'jpeg' | 'webp';
        height: number;
        width: number;
    }>;
    /**
     * Display the plotly logo on the mode bar.
     * @default true
     */
    displaylogo: boolean;
    /**
     * Watermark images with the company's logo.
     * @default false
     */
    watermark: boolean;
    /**
     * Pixel ratio during WebGL image export.
     * @default 2
     */
    plotGlPixelRatio: number;
    /**
     * Set background color function or behavior.
     * @default 'transparent'
     */
    setBackground: ((gd: PlotlyHTMLElement, bgColor: string) => void) | 'opaque' | 'transparent';
    /**
     * URL to topojson used in geo charts.
     * @default 'https://cdn.plot.ly/'
     */
    topojsonURL: string;
    /**
     * Mapbox access token (required for mapbox trace types).
     * @default null
     */
    mapboxAccessToken: string | null;
    /**
     * Console logging level (0-2). Set via Plotly.setPlotConfig.
     * @default 1
     */
    logging: 0 | 1 | 2;
    /**
     * On-graph logging (notifier) level (0-2). Set via Plotly.setPlotConfig.
     * @default 0
     */
    notifyOnLogging: 0 | 1 | 2;
    /**
     * Length of the undo/redo queue.
     * @default 0
     */
    queueLength: number;
    /**
     * Localization to use (e.g. 'en' or 'en-US').
     * @default 'en-US'
     */
    locale: string;
    /**
     * Localization definitions.
     * @default {}
     */
    locales: Record<string, { dictionary?: Record<string, string>; format?: Record<string, any> }>;
}
