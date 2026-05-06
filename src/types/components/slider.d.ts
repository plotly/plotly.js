/**
 * Slider types
 *
 * Defines the structure of Slider configuration.
 */

import type { Transition } from '../core/animation';
import type { Font, Padding } from '../core/layout';
import type { Color, XAnchor, YAnchor } from '../lib/common';
import type { LengthMode } from './colorbar';

/**
 * Slider step configuration
 */
export interface SliderStep {
    visible?: boolean;
    method?: 'restyle' | 'relayout' | 'animate' | 'update' | 'skip';
    args?: any[];
    label?: string;
    value?: string;
    execute?: boolean;
    name?: string;
    templateitemname?: string;
}

/**
 * Slider current value configuration
 */
export interface CurrentValue {
    visible?: boolean;
    xanchor?: XAnchor;
    offset?: number;
    prefix?: string;
    suffix?: string;
    font?: Partial<Font>;
}

/**
 * Slider configuration
 */
export interface Slider {
    visible?: boolean;
    active?: number;
    steps?: Array<Partial<SliderStep>>;
    lenmode?: LengthMode;
    len?: number;
    x?: number;
    y?: number;
    pad?: Partial<Padding>;
    xanchor?: XAnchor;
    yanchor?: YAnchor;
    transition?: Partial<Transition>;
    currentvalue?: Partial<CurrentValue>;
    font?: Partial<Font>;
    activebgcolor?: Color;
    bgcolor?: Color;
    bordercolor?: Color;
    borderwidth?: number;
    ticklen?: number;
    tickcolor?: Color;
    tickwidth?: number;
    minorticklen?: number;
    name?: string;
    templateitemname?: string;
}
