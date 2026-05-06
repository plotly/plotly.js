/**
 * Template types
 *
 * Defines the structure of Plotly templates.
 */

import type { PlotData, PlotType } from './data';
import type { Layout } from './layout';

/**
 * Template configuration
 */
export interface Template {
    /**
     * Default trace configurations by type
     */
    data?: {
        [K in PlotType]?: Array<Partial<PlotData>>;
    };

    /**
     * Default layout configuration
     */
    layout?: Partial<Layout>;
}

/**
 * Template figure type
 */
export interface TemplateFigure {
    data?: PlotData[];
    layout?: Partial<Layout>;
}

/**
 * Template validation result
 */
export interface ValidateTemplateResult {
    code: string;
    index?: number;
    traceType?: string;
    templateCount?: number;
    dataCount?: number;
    path?: string;
    templateitemname?: string;
    msg: string;
}
