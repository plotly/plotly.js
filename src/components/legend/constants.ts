export const scrollBarWidth = 6;
export const scrollBarMinHeight = 20;
export const scrollBarColor = '#808BA4';
export const scrollBarMargin = 4;
export const scrollBarEnterAttrs = { rx: 20, ry: 3, width: 0, height: 0 } as const;

/** Number of px between legend title and (left) side of legend (always in x direction and from inner border) */
export const titlePad = 2;
/** Number of px between each legend item (x and/or y direction) */
export const itemGap = 5;
/** Height (in px) of the legend fill swatch at the default `itemheight` */
export const dfltFillHeight = 6;
/** Minimum height (in px) of a legend item, so that the largest legend marker (16px across) fits */
export const itemMinHeight = 16;
/**
 * Number of px added to the height of each legend item.
 * Items stack with no other gap, so this value is the vertical space between them.
 */
export const itemHeightPad = 3;
