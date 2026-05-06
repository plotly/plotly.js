/**
 * RangeSelector types
 *
 * Defines the structure of RangeSelector configuration.
 */

import type { Font } from '../core/layout';
import type { Color, XAnchor, YAnchor } from '../lib/common';

/**
 * RangeSelector step type
 */
export type RangeSelectorStep = 'month' | 'year' | 'day' | 'hour' | 'minute' | 'second' | 'all';

/**
 * RangeSelector button configuration
 */
export interface RangeSelectorButton {
    visible?: boolean;
    step?: RangeSelectorStep;
    stepmode?: 'backward' | 'todate';
    count?: number;
    label?: string;
    name?: string;
    templateitemname?: string;
}

/**
 * RangeSelector configuration
 */
export interface RangeSelector {
    buttons?: Array<Partial<RangeSelectorButton>>;
    visible?: boolean;
    x?: number;
    xanchor?: XAnchor;
    y?: number;
    yanchor?: YAnchor;
    activecolor?: Color;
    bgcolor?: Color;
    bordercolor?: Color;
    borderwidth?: number;
    font?: Partial<Font>;
}
