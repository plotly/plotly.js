import type { UpdateMenu } from '../../types/generated/schema';

// Layout attribute name
export const name = 'updatemenus';

// Class names
export const containerClassName = 'updatemenu-container';
export const headerGroupClassName = 'updatemenu-header-group';
export const headerClassName = 'updatemenu-header';
export const headerArrowClassName = 'updatemenu-header-arrow';
export const dropdownButtonGroupClassName = 'updatemenu-dropdown-button-group';
export const dropdownButtonClassName = 'updatemenu-dropdown-button';
export const buttonClassName = 'updatemenu-button';
export const itemRectClassName = 'updatemenu-item-rect';
export const itemTextClassName = 'updatemenu-item-text';

// DOM attribute name in button group keeping track
// of active update menu
export const menuIndexAttrName = 'updatemenu-active-index';

// ID root pass to Plots.autoMargin
export const autoMarginIdRoot = 'updatemenu-';

// Options when 'active: -1'
export const blankHeaderOpts = { label: '  ' } as const;

// Min item width / height
export const minWidth = 30;
export const minHeight = 30;

// Padding around item text
export const textPadX = 24;
export const arrowPadX = 16;

// Item rect radii
export const rx = 2;
export const ry = 2;

// Item  text x offset off left edge
export const textOffsetX = 12;

// Item  text y offset (w.r.t. middle)
export const textOffsetY = 3;

// Arrow offset off right edge
export const arrowOffsetX = 4;

// Gap between header and buttons
export const gapButtonHeader = 5;

// Gap between between buttons
export const gapButton = 2;

// Color given to active buttons
export const activeColor = '#F4FAFF';

// Color given to hovered buttons
export const hoverColor = '#F4FAFF';

// Symbol for menu open arrow
export const arrowSymbol = {
    left: '◄',
    right: '►',
    up: '▲',
    down: '▼'
} as const satisfies Record<NonNullable<UpdateMenu['direction']>, string>;
