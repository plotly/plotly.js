/**
 * Core GraphDiv types
 *
 * The `gd` parameter appears throughout the codebase and represents
 * the graph div element with plotly-specific properties attached.
 * Commonly referred to as `gd` in the codebase.
 */

import type { Config } from './config';
import type { CalcData, FullData, PlotData } from './data';
import type { FullLayout, Layout } from './layout';

/**
 * Graph context containing environment info (mirrors Config for internal storage)
 */
export interface GraphContext extends Partial<Config> {
    [key: string]: any;
}

/**
 * The main graph div element that Plotly operates on.
 * This is an HTMLDivElement with additional Plotly-specific properties.
 */
export interface GraphDiv extends HTMLDivElement {
    _context?: GraphContext;
    _editing?: boolean;
    _fullData?: FullData[];
    _fullLayout?: FullLayout;
    _hoverdata?: any[];
    _initialized?: boolean;
    _promises?: Promise<any>[];
    _transitionData?: any;
    _transitioning?: boolean;
    calcdata?: CalcData[][];
    config?: Partial<Config>;
    data?: Array<Partial<PlotData>>;
    emit?: (event: string, ...args: any[]) => void;
    layout?: Partial<Layout>;
    [key: string]: any;
}
