/**
 * Core GraphDiv types
 *
 * The `gd` parameter appears throughout the codebase and represents
 * the graph div element with plotly-specific properties attached.
 */

import type { Config } from './config';
import type { FullData, PlotData } from './data';
import type { FullLayout, Layout } from './layout';

/**
 * The main graph div element that Plotly operates on.
 * This is an HTMLDivElement with additional Plotly-specific properties.
 *
 * Commonly referred to as `gd` in the codebase.
 */
export interface GraphDiv extends HTMLDivElement {
    /**
     * Graph dimensions and margins
     */
    _context?: GraphContext;

    /**
     * Is the plot currently being edited?
     */
    _editing?: boolean;

    /**
     * Fully processed data traces (internal use)
     */
    _fullData?: FullData[];

    /**
     * Fully processed layout (internal use)
     */
    _fullLayout?: FullLayout;

    /**
     * Has the plot been initialized?
     */
    _initialized?: boolean;

    /**
     * Plotly framework metadata
     */
    _promises?: Promise<any>[];

    /**
     * Current transaction ID for queuing operations
     */
    _transitionData?: any;

    /**
     * Is the plot transitioning?
     */
    _transitioning?: boolean;

    /**
     * Calculated data (internal use)
     */
    calcdata?: any[];

    /**
     * User-provided configuration options
     */
    config?: Partial<Config>;

    /**
     * User-provided data traces
     */
    data?: PlotData[];

    /**
     * Plotly-specific event emitter
     */
    emit?: (event: string, ...args: any[]) => void;

    /**
     * User-provided layout configuration
     */
    layout?: Partial<Layout>;

    // Add more as you discover them during migration
    [key: string]: any;
}

/**
 * Graph context containing environment info
 */
export interface GraphContext {
    autosizable?: boolean;
    displaylogo?: boolean;
    displayModeBar?: boolean | 'hover';
    doubleClick?: string | false;
    editable?: boolean;
    edits?: any;
    fillFrame?: boolean;
    frameMargins?: number;
    linkText?: string;
    locale?: string;
    locales?: any;
    mapboxAccessToken?: string;
    modeBarButtons?: any;
    modeBarButtonsToAdd?: any[];
    modeBarButtonsToRemove?: string[];
    plotGlPixelRatio?: number;
    plotlyServerURL?: string;
    queueLength?: number;
    responsive?: boolean;
    scrollZoom?: boolean;
    sendData?: boolean;
    setBackground?: string | Function;
    showLink?: boolean;
    showTips?: boolean;
    staticPlot?: boolean;
    toImageButtonOptions?: any;
    topojsonURL?: string;
    watermark?: boolean;
}
