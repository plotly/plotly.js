'use strict';

/**
 * Sanitized modulus function that always returns in the range [0, d)
 * rather than (-d, 0] if v is negative.
 *
 * @param v - dividend
 * @param d - divisor (the modulus); assumed positive
 */
export function mod(v: number, d: number) {
    const out = v % d;
    return out < 0 ? out + d : out;
}

/**
 * Sanitized modulus function that always returns in the range [-d/2, d/2]
 * rather than (-d, 0] if v is negative.
 *
 * @param v - dividend
 * @param d - divisor (the modulus); assumed positive
 */
export function modHalf(v: number, d: number) {
    return Math.abs(v) > d / 2 ? v - Math.round(v / d) * d : v;
}
