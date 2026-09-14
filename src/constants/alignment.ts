import type { LayoutAxis } from '../types/generated/schema';
import type { XAnchor, YAnchor } from '../types/lib/common';

// Fraction of some size to get to a named position

/** Fraction of the full size for each named position along both axes */
export type PositionFractions = Record<Exclude<XAnchor | YAnchor, 'auto'>, number>;

// From bottom left: this is the origin of our paper-reference
// positioning system
export const FROM_BL = {
    left: 0,
    center: 0.5,
    right: 1,
    bottom: 0,
    middle: 0.5,
    top: 1
} as const satisfies PositionFractions;

// From top left: this is the screen pixel positioning origin
export const FROM_TL = {
    left: 0,
    center: 0.5,
    right: 1,
    bottom: 1,
    middle: 0.5,
    top: 0
} as const satisfies PositionFractions;

// From bottom right: sometimes you just need the opposite of ^^
export const FROM_BR = {
    left: 1,
    center: 0.5,
    right: 0,
    bottom: 0,
    middle: 0.5,
    top: 1
} as const satisfies PositionFractions;

// Multiple of fontSize to get the vertical offset between lines
export const LINE_SPACING = 1.3;

// Multiple of fontSize to shift from the baseline
// to the cap (captical letter) line
// (to use when we don't calculate this shift from Drawing.bBox)
// This is an approximation since in reality cap height can differ
// from font to font. However, according to Wikipedia
//   an "average" font might have a cap height of 70% of the em
// https://en.wikipedia.org/wiki/Em_(typography)#History
export const CAP_SHIFT = 0.70;

// Half the cap height (distance between baseline and cap line)
// of an "average" font (for more info see above).
export const MID_SHIFT = 0.35;

type AxisSide = NonNullable<LayoutAxis['side']>;

/** The side facing the opposite direction, for each side name */
export const OPPOSITE_SIDE = {
    left: 'right',
    right: 'left',
    top: 'bottom',
    bottom: 'top'
} as const satisfies Record<AxisSide, AxisSide>;
