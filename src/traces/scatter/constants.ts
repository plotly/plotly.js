export const PTS_LINESONLY = 20;

// Fixed parameters of clustering and clipping algorithms

// Fraction of clustering tolerance "so close we don't even consider it a new point"
export const minTolerance = 0.2;
// How fast does clustering tolerance increase as you get away from the visible region
export const toleranceGrowth = 10;

// Number of viewport sizes away from the visible region
// at which we clip all lines to the perimeter
export const maxScreensAway = 20;

export const eventDataKeys = [] as const satisfies string[];
