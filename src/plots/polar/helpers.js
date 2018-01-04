/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

exports.setConvertAngular = function setConvertAngular(ax) {
    var dir = {clockwise: -1, counterclockwise: 1}[ax.direction];
    var rot = Lib.deg2rad(ax.rotation);
    var _c2rad;
    var _rad2c;

    if(ax.type === 'linear') {
        _c2rad = function(v, unit) {
            if(unit === 'degrees') return Lib.deg2rad(v);
            return v;
        };
        _rad2c = function(v, unit) {
            if(unit === 'degrees') return Lib.rad2deg(v);
            return v;
        };
    }
    else if(ax.type === 'category') {
        _c2rad = function(v) {
            return v * 2 * Math.PI / ax._categories.length;
        };
        _rad2c = function(v) {
            return v * ax._categories.length / Math.PI / 2;
        };
    }
    else if(ax.type === 'date') {
        var period = ax.period || 365 * 24 * 60 * 60 * 1000;

        _c2rad = function(v) {
            return (v % period) * 2 * Math.PI / period;
        };
        _rad2c = function(v) {
            return v * period / Math.PI / 2;
        };
    }

    function transformRad(v) { return dir * v + rot; }
    function unTransformRad(v) { return (v - rot) / dir; }

    // use the shift 'sector' to get right tick labels for non-default
    // angularaxis 'rotation' and/or 'direction'
    ax.unTransformRad = unTransformRad;

    // this version is used on hover
    ax._c2rad = _c2rad;

    ax.c2rad = function(v, unit) { return transformRad(_c2rad(v, unit)); };
    ax.rad2c = function(v, unit) { return _rad2c(unTransformRad(v), unit); };

    ax.c2deg = function(v, unit) { return Lib.rad2deg(ax.c2rad(v, unit)); };
    ax.deg2c = function(v, unit) { return ax.rad2c(Lib.deg2rad(v), unit); };
};
