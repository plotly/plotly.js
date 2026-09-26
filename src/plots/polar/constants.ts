export const attr = 'subplot';
export const name = 'polar';

export const axisNames = ['angularaxis', 'radialaxis'] as const;

/** The data array each axis of this subplot reads, keyed by axis name */
type AxisDataArrays = Record<(typeof axisNames)[number], string>;

export const axisName2dataArray = { angularaxis: 'theta', radialaxis: 'r' } as const satisfies AxisDataArrays;

export const layerNames = [
    'draglayer',
    'plotbg',
    'backplot',
    'angular-grid',
    'radial-grid',
    'frontplot',
    'angular-line',
    'radial-line',
    'angular-axis',
    'radial-axis'
] as const;

export const radialDragBoxSize = 50;
export const angularDragBoxSize = 30;
export const cornerLen = 25;
export const cornerHalfWidth = 2;

// Pixels to move mouse before you stop clamping to starting point
export const MINDRAG = 8;
// Smallest radial distance [px] allowed for a zoombox
export const MINZOOM = 20;
// Distance [px] off (r=0) or (r=radius) where we transition
// from single-sided to two-sided radial zoom
export const OFFEDGE = 20;
