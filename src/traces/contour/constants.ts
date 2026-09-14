// Some constants to help with marching squares algorithm
// where does the path start for each index?
export const BOTTOMSTART = [1, 9, 13, 104, 713] as const;
export const TOPSTART = [4, 6, 7, 104, 713] as const;
export const LEFTSTART = [8, 12, 14, 208, 1114] as const;
export const RIGHTSTART = [2, 3, 11, 208, 1114] as const;

// Which way [dx,dy] do we leave a given index?
// saddles are already disambiguated
export const NEWDELTA = [
    null, [-1, 0], [0, -1], [-1, 0],
    [1, 0], null, [0, -1], [-1, 0],
    [0, 1], [0, 1], null, [0, 1],
    [1, 0], [1, 0], [0, -1]
] as const satisfies (number[] | null)[];

// For each saddle, the first index here is used
// for dx||dy<0, the second for dx||dy>0
export const CHOOSESADDLE = {
    104: [4, 1],
    208: [2, 8],
    713: [7, 13],
    1114: [11, 14]
} as const satisfies Record<number, [number, number]>;

// After one index has been used for a saddle, which do we
// substitute to be used up later?
export const SADDLEREMAINDER = { 1: 4, 2: 8, 4: 1, 7: 13, 8: 2, 11: 14, 13: 7, 14: 11 } as const satisfies Record<number, number>;

// Length of a contour, as a multiple of the plot area diagonal, per label
export const LABELDISTANCE = 2;

// Number of contour levels after which we start increasing the number of
// labels we draw. Many contours means they will generally be close
// together, so it will be harder to follow a long way to find a label
export const LABELINCREASE = 10;

// Minimum length of a contour line, as a multiple of the label length,
// at which we draw *any* labels
export const LABELMIN = 3;

// Max number of labels to draw on a single contour path, no matter how long
export const LABELMAX = 10;

// Constants for the label position cost function
export const LABELOPTIMIZER = {
    // Weight given to edge proximity
    EDGECOST: 1,
    // Weight given to the angle off horizontal
    ANGLECOST: 1,
    // Weight given to distance from already-placed labels
    NEIGHBORCOST: 5,
    // Cost multiplier for labels on the same level
    SAMELEVELFACTOR: 10,
    // Minimum distance (as a multiple of the label length)
    // for labels on the same level
    SAMELEVELDISTANCE: 5,
    // Maximum cost before we won't even place the label
    MAXCOST: 100,
    // Number of evenly spaced points to look at in the first
    // iteration of the search
    INITIALSEARCHPOINTS: 10,
    // Number of binary search iterations after the initial wide search
    ITERATIONS: 5
} as const;
