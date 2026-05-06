/**
 * UpdateMenu types
 *
 * Defines the structure of UpdateMenu configuration.
 */

import type { Color, XAnchor, YAnchor } from '../lib/common';
import type { Font, Padding } from '../core/layout';

/**
 * UpdateMenu button configuration
 */
export interface UpdateMenuButton {
    visible?: boolean;
    method?: 'restyle' | 'relayout' | 'animate' | 'update' | 'skip';
    args?: any[];
    args2?: any[];
    label?: string;
    execute?: boolean;
    name?: string;
    templateitemname?: string;
}

/**
 * UpdateMenu direction type
 */
export type UpdateMenuDirection = 'left' | 'up' | 'right' | 'down';

/**
 * UpdateMenu type
 */
export type UpdateMenuType = 'dropdown' | 'buttons';

/**
 * UpdateMenu configuration
 */
export interface UpdateMenu {
    active?: number;
    bgcolor?: Color;
    bordercolor?: Color;
    borderwidth?: number;
    buttons?: Array<Partial<UpdateMenuButton>>;
    direction?: UpdateMenuDirection;
    font?: Partial<Font>;
    name?: string;
    pad?: Partial<Padding>;
    showactive?: boolean;
    templateitemname?: string;
    type?: UpdateMenuType;
    visible?: boolean;
    x?: number;
    xanchor?: XAnchor;
    y?: number;
    yanchor?: YAnchor;
}
