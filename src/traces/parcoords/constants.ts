export const maxDimensionCount = 60; // This cannot be increased without WebGL code refactoring
export const overdrag = 45;
export const verticalPadding = 2; // Otherwise, horizontal lines on top or bottom are of lower width
export const tickDistance = 50;
export const canvasPixelRatio = 1;
export const blockLineCount = 5000;
export const layers = ['contextLineLayer', 'focusLineLayer', 'pickLineLayer'] as const;
export const axisTitleOffset = 28;
export const axisExtentOffset = 10;

export const bar = {
    width: 4, // Visible width of the filter bar
    captureWidth: 10, // Mouse-sensitive width for interaction (Fitts law)
    fillColor: 'magenta', // Color of the filter bar fill
    fillOpacity: 1, // Filter bar fill opacity
    snapDuration: 150, // Tween duration in ms for brush snap for ordinal axes
    snapRatio: 0.25, // Ratio of bar extension relative to the distance between two adjacent ordinal values
    snapClose: 0.01, // Fraction of inter-value distance to snap to the closer one, even if you're not over it
    strokeOpacity: 1, // Filter bar side stroke opacity
    strokeWidth: 1, // Filter bar side stroke width in pixels
    handleHeight: 8, // Height of the filter bar vertical resize areas on top and bottom
    handleOpacity: 1, // Opacity of the filter bar vertical resize areas on top and bottom
    handleOverlap: 0 // A larger than 0 value causes overlaps with the filter bar, represented as pixels
} as const;

export const cn = {
    axisExtentText: 'axis-extent-text',
    parcoordsLineLayers: 'parcoords-line-layers',
    parcoordsLineLayer: 'parcoords-lines',
    parcoords: 'parcoords',
    parcoordsControlView: 'parcoords-control-view',
    yAxis: 'y-axis',
    axisOverlays: 'axis-overlays',
    axis: 'axis',
    axisHeading: 'axis-heading',
    axisTitle: 'axis-title',
    axisExtent: 'axis-extent',
    axisExtentTop: 'axis-extent-top',
    axisExtentTopText: 'axis-extent-top-text',
    axisExtentBottom: 'axis-extent-bottom',
    axisExtentBottomText: 'axis-extent-bottom-text',
    axisBrush: 'axis-brush'
} as const;

export const id = {
    filterBarPattern: 'filter-bar-pattern'
} as const;
