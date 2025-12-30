/**
 * Config types
 *
 * Defines the structure of Plotly config options.
 */

/**
 * User-provided configuration for Plotly
 */
export interface Config {
    /**
     * Whether the plot should resize on window resize
     */
    autosizable?: boolean;

    /**
     * Display Plotly logo on mode bar
     */
    displaylogo?: boolean;

    /**
     * Display the mode bar
     */
    displayModeBar?: boolean | 'hover';

    /**
     * What happens on double click
     */
    doubleClick?: 'reset' | 'autosize' | 'reset+autosize' | false;

    /**
     * Allow plot to be edited
     */
    editable?: boolean;

    /**
     * What can be edited
     */
    edits?: Partial<ConfigEdits>;

    /**
     * Whether to fill the parent container
     */
    fillFrame?: boolean;

    /**
     * Margin around the plot when fillFrame is true
     */
    frameMargins?: number;

    /**
     * Text for the "Edit in Chart Studio" link
     */
    linkText?: string;

    /**
     * Locale for formatting
     */
    locale?: string;

    /**
     * Custom locale definitions
     */
    locales?: { [locale: string]: any };

    /**
     * Mapbox access token
     */
    mapboxAccessToken?: string;

    /**
     * Custom mode bar buttons configuration
     */
    modeBarButtons?: any;

    /**
     * Mode bar buttons to add
     */
    modeBarButtonsToAdd?: any[];

    /**
     * Mode bar buttons to remove
     */
    modeBarButtonsToRemove?: string[];

    /**
     * Pixel ratio for WebGL plots
     */
    plotGlPixelRatio?: number;

    /**
     * Base URL for plotly server
     */
    plotlyServerURL?: string;

    /**
     * Number of operations that can be queued
     */
    queueLength?: number;

    /**
     * Whether to resize on window resize (alternative)
     */
    responsive?: boolean;

    /**
     * Enable scroll zoom
     */
    scrollZoom?: boolean;

    /**
     * Send data to Chart Studio
     */
    sendData?: boolean;

    /**
     * Background color setting function
     */
    setBackground?: string | ((gd: any) => void);

    /**
     * Show "Edit in Chart Studio" link
     */
    showLink?: boolean;

    /**
     * Show tips on first hover
     */
    showTips?: boolean;

    /**
     * Make the chart static - no interactivity
     */
    staticPlot?: boolean;

    /**
     * Options for the "Download plot as PNG" button
     */
    toImageButtonOptions?: Partial<ToImageButtonOptions>;

    /**
     * URL for topojson files
     */
    topojsonURL?: string;

    /**
     * Add watermark to images
     */
    watermark?: boolean;
}

/**
 * Configuration for what can be edited
 */
export interface ConfigEdits {
    annotationPosition?: boolean;
    annotationTail?: boolean;
    annotationText?: boolean;
    axisTitleText?: boolean;
    colorbarPosition?: boolean;
    colorbarTitleText?: boolean;
    legendPosition?: boolean;
    legendText?: boolean;
    shapePosition?: boolean;
    titleText?: boolean;
}

/**
 * Options for the "Download plot" button
 */
export interface ToImageButtonOptions {
    format?: 'png' | 'svg' | 'jpeg' | 'webp';
    filename?: string;
    height?: number;
    width?: number;
    scale?: number;
}
