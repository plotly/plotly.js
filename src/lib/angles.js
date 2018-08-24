/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var PI = Math.PI;

function deg2rad(deg) {
    return deg / 180 * PI;
}

function rad2deg(rad) {
    return rad / PI * 180;
}

function wrap360(deg) {
    var out = deg % 360;
    return out < 0 ? out + 360 : out;
}

function wrap180(deg) {
    if(Math.abs(deg) > 180) deg -= Math.round(deg / 360) * 360;
    return deg;
}

/* is sector a full circle?
 * ... this comes up a lot in SVG path-drawing routines
 *
 * @param {2-item array} sector sector angles in *degrees*
 * @return {boolean}
 */
function isFullCircle(sector) {
    var arc = Math.abs(sector[1] - sector[0]);
    return arc === 360;
}

/* angular delta between angle 'a' and 'b'
 *
 * solution taken from: https://stackoverflow.com/a/2007279
 *
 * @param {number} a : first angle in *radians*
 * @param {number} b : second angle in *radians*
 * @return {number} angular delta in *radians*
 */
function angleDelta(a, b) {
    var d = b - a;
    return Math.atan2(Math.sin(d), Math.cos(d));
}

/* angular distance between angle 'a' and 'b'
 *
 * @param {number} a : first angle in *radians*
 * @param {number} b : second angle in *radians*
 * @return {number} angular distance in *radians*
 */
function angleDist(a, b) {
    return Math.abs(angleDelta(a, b));
}

/* is angle inside sector?
 *
 * @param {number} a : angle to test in *radians*
 * @param {2-item array} sector : sector angles in *degrees*
 * @param {boolean}
 */
function isAngleInsideSector(a, sector) {
    if(isFullCircle(sector)) return true;

    var s0, s1;

    if(sector[0] < sector[1]) {
        s0 = sector[0];
        s1 = sector[1];
    } else {
        s0 = sector[1];
        s1 = sector[0];
    }

    s0 = wrap360(s0);
    s1 = wrap360(s1);
    if(s0 > s1) s1 += 360;

    var a0 = wrap360(rad2deg(a));
    var a1 = a0 + 360;

    return (a0 >= s0 && a0 <= s1) || (a1 >= s0 && a1 <= s1);
}

/* is pt (r,a) inside sector?
 *
 * @param {number} r : pt's radial coordinate
 * @param {number} a : pt's angular coordinate in *radians*
 * @param {2-item array} rRng : sector's radial range
 * @param {2-item array} sector : sector angles in *degrees*
 * @return {boolean}
 */
function isPtInsideSector(r, a, rRng, sector) {
    if(!isAngleInsideSector(a, sector)) return false;

    var r0, r1;

    if(rRng[0] < rRng[1]) {
        r0 = rRng[0];
        r1 = rRng[1];
    } else {
        r0 = rRng[1];
        r1 = rRng[0];
    }

    return r >= r0 && r <= r1;
}

module.exports = {
    deg2rad: deg2rad,
    rad2deg: rad2deg,
    wrap360: wrap360,
    wrap180: wrap180,
    angleDelta: angleDelta,
    angleDist: angleDist,
    isFullCircle: isFullCircle,
    isAngleInsideSector: isAngleInsideSector,
    isPtInsideSector: isPtInsideSector
};
