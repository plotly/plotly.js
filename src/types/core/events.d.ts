/**
 * Event types
 *
 * Defines the structure of Plotly events and event data.
 */

/**
 * Common point data structure returned in events
 */
export interface PlotlyEventPoint {
    /**
     * Curve number (trace index)
     */
    curveNumber: number;

    /**
     * Point number within the trace
     */
    pointNumber: number;

    /**
     * Point index (for calculated data)
     */
    pointIndex?: number;

    /**
     * X value
     */
    x?: any;

    /**
     * Y value
     */
    y?: any;

    /**
     * Z value (for 3D plots)
     */
    z?: any;

    /**
     * Custom data
     */
    customdata?: any;

    /**
     * Full data for this trace
     */
    data?: any;

    /**
     * Full data for all traces
     */
    fullData?: any;

    /**
     * Additional properties
     */
    [key: string]: any;
}

/**
 * Hover event data
 */
export interface PlotlyHoverEvent {
    points: PlotlyEventPoint[];
    event: MouseEvent;
}

/**
 * Click event data
 */
export interface PlotlyClickEvent {
    points: PlotlyEventPoint[];
    event: MouseEvent;
}

/**
 * Selection event data
 */
export interface PlotlySelectionEvent {
    points: PlotlyEventPoint[];
    range?: any;
    lassoPoints?: any;
}

/**
 * Relayout event data (when layout changes)
 */
export interface PlotlyRelayoutEvent {
    [key: string]: any;
}

/**
 * Restyle event data (when trace style changes)
 */
export interface PlotlyRestyleEvent {
    data: any[];
    traces: number[];
}

/**
 * All Plotly event names
 */
export type PlotlyEventName =
    | 'plotly_afterexport'
    | 'plotly_afterplot'
    | 'plotly_animated'
    | 'plotly_animatingframe'
    | 'plotly_animationinterrupted'
    | 'plotly_autosize'
    | 'plotly_beforeexport'
    | 'plotly_beforehover'
    | 'plotly_buttonclicked'
    | 'plotly_click'
    | 'plotly_clickannotation'
    | 'plotly_deselect'
    | 'plotly_doubleclick'
    | 'plotly_framework'
    | 'plotly_hover'
    | 'plotly_legendclick'
    | 'plotly_legenddoubleclick'
    | 'plotly_redraw'
    | 'plotly_relayout'
    | 'plotly_restyle'
    | 'plotly_selected'
    | 'plotly_selecting'
    | 'plotly_sliderchange'
    | 'plotly_sliderend'
    | 'plotly_sliderstart'
    | 'plotly_sunburstclick'
    | 'plotly_transitioning'
    | 'plotly_transitioninterrupted'
    | 'plotly_treemapclick'
    | 'plotly_unhover'
    | 'plotly_webglcontextlost';
