// Layout attribute name
export const name = 'sliders';

// Class names
export const containerClassName = 'slider-container';
export const groupClassName = 'slider-group';
export const inputAreaClass = 'slider-input-area';
export const railRectClass = 'slider-rail-rect';
export const railTouchRectClass = 'slider-rail-touch-rect';
export const gripRectClass = 'slider-grip-rect';
export const tickRectClass = 'slider-tick-rect';
export const inputProxyClass = 'slider-input-proxy';
export const labelsClass = 'slider-labels';
export const labelGroupClass = 'slider-label-group';
export const labelClass = 'slider-label';
export const currentValueClass = 'slider-current-value';

export const railHeight = 5;

// DOM attribute name in button group keeping track
// of active update menu
export const menuIndexAttrName = 'slider-active-index';

// ID root pass to Plots.autoMargin
export const autoMarginIdRoot = 'slider-';

// Min item width / height
export const minWidth = 30;
export const minHeight = 30;

// Padding around item text
export const textPadX = 40;

// Arrow offset off right edge
export const arrowOffsetX = 4;

export const railRadius = 2;
export const railWidth = 5;
export const railBorder = 4;
export const railBorderWidth = 1;
export const railBorderColor = '#bec8d9';
export const railBgColor = '#f8fafc';

// The distance of the rail from the edge of the touchable area
// Slightly less than the step inset because of the curved edges
// of the rail
export const railInset = 8;

// The distance from the extremal tick marks to the edge of the
// touchable area. This is basically the same as the grip radius,
// but for other styles it wouldn't really need to be.
export const stepInset = 10;

export const gripRadius = 10;
export const gripWidth = 20;
export const gripHeight = 20;
export const gripBorder = 20;
export const gripBorderWidth = 1;
export const gripBorderColor = '#bec8d9';
export const gripBgColor = '#f6f8fa';
export const gripBgActiveColor = '#dbdde0';

export const labelPadding = 8;
export const labelOffset = 0;

export const tickWidth = 1;
export const tickColor = '#333';
export const tickOffset = 25;
export const tickLength = 7;

export const minorTickOffset = 25;
export const minorTickColor = '#333';
export const minorTickLength = 4;

// Extra space below the current value label:
export const currentValuePadding = 8;
export const currentValueInset = 0;
