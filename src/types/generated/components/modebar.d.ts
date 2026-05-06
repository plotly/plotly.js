/**
 * Generated from src/components/modebar/attributes.ts.
 * Do not edit by hand — run `npm run gen:types`.
 */

import type { Color } from '../../lib/common';

export interface ModeBar {
    orientation?: 'v' | 'h';
    bgcolor?: Color;
    color?: Color;
    activecolor?: Color;
    uirevision?: any;
    add?: string | string[];
    remove?: string | string[];
}
