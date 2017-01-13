/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var radians = Math.PI / 180,
    degrees = 180 / Math.PI,
    zoomstartStyle = { cursor: 'pointer' },
    zoomendStyle = { cursor: 'auto' };


function createGeoZoom(geo, geoLayout) {
    var zoomConstructor;

    if(geoLayout._isScoped) zoomConstructor = zoomScoped;
    else if(geoLayout._clipAngle) zoomConstructor = zoomClipped;
    else zoomConstructor = zoomNonClipped;

    // TODO add a conic-specific zoom

    return zoomConstructor(geo, geoLayout.projection);
}

module.exports = createGeoZoom;

// common to all zoom types
function initZoom(projection, projLayout) {
    var fullScale = projLayout._fullScale;

    return d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .scaleExtent([0.5 * fullScale, 100 * fullScale]);
}

// zoom for scoped projections
function zoomScoped(geo, projLayout) {
    var projection = geo.projection,
        zoom = initZoom(projection, projLayout);

    function handleZoomstart() {
        d3.select(this).style(zoomstartStyle);
    }

    function handleZoom() {
        projection
            .scale(d3.event.scale)
            .translate(d3.event.translate);

        geo.render();
    }

    function handleZoomend() {
        d3.select(this).style(zoomendStyle);
    }

    zoom
        .on('zoomstart', handleZoomstart)
        .on('zoom', handleZoom)
        .on('zoomend', handleZoomend);

    return zoom;
}

// zoom for non-clipped projections
function zoomNonClipped(geo, projLayout) {
    var projection = geo.projection,
        zoom = initZoom(projection, projLayout);

    var INSIDETOLORANCEPXS = 2;

    var mouse0, rotate0, translate0, lastRotate, zoomPoint,
        mouse1, rotate1, point1;

    function position(x) { return projection.invert(x); }

    function outside(x) {
        var pt = projection(position(x));
        return (Math.abs(pt[0] - x[0]) > INSIDETOLORANCEPXS ||
                Math.abs(pt[1] - x[1]) > INSIDETOLORANCEPXS);
    }

    function handleZoomstart() {
        d3.select(this).style(zoomstartStyle);

        mouse0 = d3.mouse(this);
        rotate0 = projection.rotate();
        translate0 = projection.translate();
        lastRotate = rotate0;
        zoomPoint = position(mouse0);
    }

    function handleZoom() {
        mouse1 = d3.mouse(this);

        if(outside(mouse0)) {
            zoom.scale(projection.scale());
            zoom.translate(projection.translate());
            return;
        }

        projection.scale(d3.event.scale);

        projection.translate([translate0[0], d3.event.translate[1]]);

        if(!zoomPoint) {
            mouse0 = mouse1;
            zoomPoint = position(mouse0);
        }
        else if(position(mouse1)) {
            point1 = position(mouse1);
            rotate1 = [lastRotate[0] + (point1[0] - zoomPoint[0]), rotate0[1], rotate0[2]];
            projection.rotate(rotate1);
            lastRotate = rotate1;
        }

        geo.render();
    }

    function handleZoomend() {
        d3.select(this).style(zoomendStyle);

        // or something like
        // http://www.jasondavies.com/maps/gilbert/
        // ... a little harder with multiple base layers
    }

    zoom
        .on('zoomstart', handleZoomstart)
        .on('zoom', handleZoom)
        .on('zoomend', handleZoomend);

    return zoom;
}

// zoom for clipped projections
// inspired by https://www.jasondavies.com/maps/d3.geo.zoom.js
function zoomClipped(geo, projLayout) {
    var projection = geo.projection,
        view = {r: projection.rotate(), k: projection.scale()},
        zoom = initZoom(projection, projLayout),
        event = d3_eventDispatch(zoom, 'zoomstart', 'zoom', 'zoomend'),
        zooming = 0,
        zoomOn = zoom.on;

    var zoomPoint;

    zoom.on('zoomstart', function() {
        d3.select(this).style(zoomstartStyle);

        var mouse0 = d3.mouse(this),
            rotate0 = projection.rotate(),
            lastRotate = rotate0,
            translate0 = projection.translate(),
            q = quaternionFromEuler(rotate0);

        zoomPoint = position(projection, mouse0);

        zoomOn.call(zoom, 'zoom', function() {
            var mouse1 = d3.mouse(this);

            projection.scale(view.k = d3.event.scale);

            if(!zoomPoint) {
                // if no zoomPoint, the mouse wasn't over the actual geography yet
                // maybe this point is the start... we'll find out next time!
                mouse0 = mouse1;
                zoomPoint = position(projection, mouse0);
            }
            // check if the point is on the map
            // if not, don't do anything new but scale
            // if it is, then we can assume between will exist below
            // so we don't need the 'bank' function, whatever that is.
            // TODO: is this right?
            else if(position(projection, mouse1)) {
                // go back to original projection temporarily
                // except for scale... that's kind of independent?
                projection
                    .rotate(rotate0)
                    .translate(translate0);

                // calculate the new params
                var point1 = position(projection, mouse1),
                    between = rotateBetween(zoomPoint, point1),
                    newEuler = eulerFromQuaternion(multiply(q, between)),
                    rotateAngles = view.r = unRoll(newEuler, zoomPoint, lastRotate);

                if(!isFinite(rotateAngles[0]) || !isFinite(rotateAngles[1]) ||
                   !isFinite(rotateAngles[2])) {
                    rotateAngles = lastRotate;
                }

                // update the projection
                projection.rotate(rotateAngles);
                lastRotate = rotateAngles;
            }

            zoomed(event.of(this, arguments));
        });

        zoomstarted(event.of(this, arguments));
    })
    .on('zoomend', function() {
        d3.select(this).style(zoomendStyle);
        zoomOn.call(zoom, 'zoom', null);
        zoomended(event.of(this, arguments));
    })
    .on('zoom.redraw', function() {
        geo.render();
    });

    function zoomstarted(dispatch) {
        if(!zooming++) dispatch({type: 'zoomstart'});
    }

    function zoomed(dispatch) {
        dispatch({type: 'zoom'});
    }

    function zoomended(dispatch) {
        if(!--zooming) dispatch({type: 'zoomend'});
    }

    return d3.rebind(zoom, event, 'on');
}

// -- helper functions for zoomClipped

function position(projection, point) {
    var spherical = projection.invert(point);
    return spherical && isFinite(spherical[0]) && isFinite(spherical[1]) && cartesian(spherical);
}

function quaternionFromEuler(euler) {
    var lambda = 0.5 * euler[0] * radians,
        phi = 0.5 * euler[1] * radians,
        gamma = 0.5 * euler[2] * radians,
        sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda),
        sinPhi = Math.sin(phi), cosPhi = Math.cos(phi),
        sinGamma = Math.sin(gamma), cosGamma = Math.cos(gamma);
    return [
        cosLambda * cosPhi * cosGamma + sinLambda * sinPhi * sinGamma,
        sinLambda * cosPhi * cosGamma - cosLambda * sinPhi * sinGamma,
        cosLambda * sinPhi * cosGamma + sinLambda * cosPhi * sinGamma,
        cosLambda * cosPhi * sinGamma - sinLambda * sinPhi * cosGamma
    ];
}

function multiply(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return [
        a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3,
        a0 * b1 + a1 * b0 + a2 * b3 - a3 * b2,
        a0 * b2 - a1 * b3 + a2 * b0 + a3 * b1,
        a0 * b3 + a1 * b2 - a2 * b1 + a3 * b0
    ];
}

function rotateBetween(a, b) {
    if(!a || !b) return;
    var axis = cross(a, b),
        norm = Math.sqrt(dot(axis, axis)),
        halfgamma = 0.5 * Math.acos(Math.max(-1, Math.min(1, dot(a, b)))),
        k = Math.sin(halfgamma) / norm;
    return norm && [Math.cos(halfgamma), axis[2] * k, -axis[1] * k, axis[0] * k];
}

// input:
//   rotateAngles: a calculated set of Euler angles
//   pt: a point (cartesian in 3-space) to keep fixed
//   roll0: an initial roll, to be preserved
// output:
//   a set of Euler angles that preserve the projection of pt
//     but set roll (output[2]) equal to roll0
//     note that this doesn't depend on the particular projection,
//     just on the rotation angles
function unRoll(rotateAngles, pt, lastRotate) {
    // calculate the fixed point transformed by these Euler angles
    // but with the desired roll undone
    var ptRotated = rotateCartesian(pt, 2, rotateAngles[0]);
    ptRotated = rotateCartesian(ptRotated, 1, rotateAngles[1]);
    ptRotated = rotateCartesian(ptRotated, 0, rotateAngles[2] - lastRotate[2]);

    var x = pt[0],
        y = pt[1],
        z = pt[2],
        f = ptRotated[0],
        g = ptRotated[1],
        h = ptRotated[2],

        // the following essentially solves:
        // ptRotated = rotateCartesian(rotateCartesian(pt, 2, newYaw), 1, newPitch)
        // for newYaw and newPitch, as best it can
        theta = Math.atan2(y, x) * degrees,
        a = Math.sqrt(x * x + y * y),
        b,
        newYaw1;

    if(Math.abs(g) > a) {
        newYaw1 = (g > 0 ? 90 : -90) - theta;
        b = 0;
    } else {
        newYaw1 = Math.asin(g / a) * degrees - theta;
        b = Math.sqrt(a * a - g * g);
    }

    var newYaw2 = 180 - newYaw1 - 2 * theta,
        newPitch1 = (Math.atan2(h, f) - Math.atan2(z, b)) * degrees,
        newPitch2 = (Math.atan2(h, f) - Math.atan2(z, -b)) * degrees;

    // which is closest to lastRotate[0,1]: newYaw/Pitch or newYaw2/Pitch2?
    var dist1 = angleDistance(lastRotate[0], lastRotate[1], newYaw1, newPitch1),
        dist2 = angleDistance(lastRotate[0], lastRotate[1], newYaw2, newPitch2);

    if(dist1 <= dist2) return [newYaw1, newPitch1, lastRotate[2]];
    else return [newYaw2, newPitch2, lastRotate[2]];
}

function angleDistance(yaw0, pitch0, yaw1, pitch1) {
    var dYaw = angleMod(yaw1 - yaw0),
        dPitch = angleMod(pitch1 - pitch0);
    return Math.sqrt(dYaw * dYaw + dPitch * dPitch);
}

// reduce an angle in degrees to [-180,180]
function angleMod(angle) {
    return (angle % 360 + 540) % 360 - 180;
}

// rotate a cartesian vector
// axis is 0 (x), 1 (y), or 2 (z)
// angle is in degrees
function rotateCartesian(vector, axis, angle) {
    var angleRads = angle * radians,
        vectorOut = vector.slice(),
        ax1 = (axis === 0) ? 1 : 0,
        ax2 = (axis === 2) ? 1 : 2,
        cosa = Math.cos(angleRads),
        sina = Math.sin(angleRads);

    vectorOut[ax1] = vector[ax1] * cosa - vector[ax2] * sina;
    vectorOut[ax2] = vector[ax2] * cosa + vector[ax1] * sina;

    return vectorOut;
}
function eulerFromQuaternion(q) {
    return [
        Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * degrees,
        Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees,
        Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * degrees
    ];
}

function cartesian(spherical) {
    var lambda = spherical[0] * radians,
        phi = spherical[1] * radians,
        cosPhi = Math.cos(phi);
    return [
        cosPhi * Math.cos(lambda),
        cosPhi * Math.sin(lambda),
        Math.sin(phi)
    ];
}

function dot(a, b) {
    var s = 0;
    for(var i = 0, n = a.length; i < n; ++i) s += a[i] * b[i];
    return s;
}

function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
    var i = 0,
        n = arguments.length,
        argumentz = [];

    while(++i < n) argumentz.push(arguments[i]);

    var dispatch = d3.dispatch.apply(null, argumentz);

    // Creates a dispatch context for the specified `thiz` (typically, the target
    // DOM element that received the source event) and `argumentz` (typically, the
    // data `d` and index `i` of the target element). The returned function can be
    // used to dispatch an event to any registered listeners; the function takes a
    // single argument as input, being the event to dispatch. The event must have
    // a "type" attribute which corresponds to a type registered in the
    // constructor. This context will automatically populate the "sourceEvent" and
    // "target" attributes of the event, as well as setting the `d3.event` global
    // for the duration of the notification.
    dispatch.of = function(thiz, argumentz) {
        return function(e1) {
            var e0;
            try {
                e0 = e1.sourceEvent = d3.event;
                e1.target = target;
                d3.event = e1;
                dispatch[e1.type].apply(thiz, argumentz);
            } finally {
                d3.event = e0;
            }
        };
    };

    return dispatch;
}
