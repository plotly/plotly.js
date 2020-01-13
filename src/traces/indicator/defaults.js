/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var handleDomainDefaults = require('../../plots/domain').defaults;
var Template = require('../../plot_api/plot_template');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');
var cn = require('./constants.js');

var handleTickValueDefaults = require('../../plots/cartesian/tick_value_defaults');
var handleTickMarkDefaults = require('../../plots/cartesian/tick_mark_defaults');
var handleTickLabelDefaults = require('../../plots/cartesian/tick_label_defaults');

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    handleDomainDefaults(traceOut, layout, coerce);

    // Mode
    coerce('mode');
    traceOut._hasNumber = traceOut.mode.indexOf('number') !== -1;
    traceOut._hasDelta = traceOut.mode.indexOf('delta') !== -1;
    traceOut._hasGauge = traceOut.mode.indexOf('gauge') !== -1;

    var value = coerce('value');
    traceOut._range = [0, (typeof value === 'number' ? 1.5 * value : 1)];

    // Number attributes
    var auto = new Array(2);
    var bignumberFontSize;
    if(traceOut._hasNumber) {
        coerce('number.valueformat');
        coerce('number.font.color', layout.font.color);
        coerce('number.font.family', layout.font.family);
        coerce('number.font.size');
        if(traceOut.number.font.size === undefined) {
            traceOut.number.font.size = cn.defaultNumberFontSize;
            auto[0] = true;
        }
        coerce('number.prefix');
        coerce('number.suffix');
        bignumberFontSize = traceOut.number.font.size;
    }

    // delta attributes
    var deltaFontSize;
    if(traceOut._hasDelta) {
        coerce('delta.font.color', layout.font.color);
        coerce('delta.font.family', layout.font.family);
        coerce('delta.font.size');
        if(traceOut.delta.font.size === undefined) {
            traceOut.delta.font.size = (traceOut._hasNumber ? 0.5 : 1) * (bignumberFontSize || cn.defaultNumberFontSize);
            auto[1] = true;
        }
        coerce('delta.reference', traceOut.value);
        coerce('delta.relative');
        coerce('delta.valueformat', traceOut.delta.relative ? '2%' : '');
        coerce('delta.increasing.symbol');
        coerce('delta.increasing.color');
        coerce('delta.decreasing.symbol');
        coerce('delta.decreasing.color');
        coerce('delta.position');
        deltaFontSize = traceOut.delta.font.size;
    }
    traceOut._scaleNumbers = (!traceOut._hasNumber || auto[0]) && (!traceOut._hasDelta || auto[1]) || false;

    // Title attributes
    coerce('title.font.color', layout.font.color);
    coerce('title.font.family', layout.font.family);
    coerce('title.font.size', 0.25 * (bignumberFontSize || deltaFontSize || cn.defaultNumberFontSize));
    coerce('title.text');

    // Gauge attributes
    var gaugeIn, gaugeOut, axisIn, axisOut;
    function coerceGauge(attr, dflt) {
        return Lib.coerce(gaugeIn, gaugeOut, attributes.gauge, attr, dflt);
    }
    function coerceGaugeAxis(attr, dflt) {
        return Lib.coerce(axisIn, axisOut, attributes.gauge.axis, attr, dflt);
    }

    if(traceOut._hasGauge) {
        gaugeIn = traceIn.gauge;
        if(!gaugeIn) gaugeIn = {};
        gaugeOut = Template.newContainer(traceOut, 'gauge');
        coerceGauge('shape');
        var isBullet = traceOut._isBullet = traceOut.gauge.shape === 'bullet';
        if(!isBullet) {
            coerce('title.align', 'center');
        }
        var isAngular = traceOut._isAngular = traceOut.gauge.shape === 'angular';
        if(!isAngular) {
            coerce('align', 'center');
        }

        // gauge background
        coerceGauge('bgcolor', layout.paper_bgcolor);
        coerceGauge('borderwidth');
        coerceGauge('bordercolor');

        // gauge bar indicator
        coerceGauge('bar.color');
        coerceGauge('bar.line.color');
        coerceGauge('bar.line.width');
        var defaultBarThickness = cn.valueThickness * (traceOut.gauge.shape === 'bullet' ? 0.5 : 1);
        coerceGauge('bar.thickness', defaultBarThickness);

        // Gauge steps
        handleArrayContainerDefaults(gaugeIn, gaugeOut, {
            name: 'steps',
            handleItemDefaults: stepDefaults
        });

        // Gauge threshold
        coerceGauge('threshold.value');
        coerceGauge('threshold.thickness');
        coerceGauge('threshold.line.width');
        coerceGauge('threshold.line.color');

        // Gauge axis
        axisIn = {};
        if(gaugeIn) axisIn = gaugeIn.axis || {};
        axisOut = Template.newContainer(gaugeOut, 'axis');
        coerceGaugeAxis('visible');
        traceOut._range = coerceGaugeAxis('range', traceOut._range);

        var opts = {outerTicks: true};
        handleTickValueDefaults(axisIn, axisOut, coerceGaugeAxis, 'linear');
        handleTickLabelDefaults(axisIn, axisOut, coerceGaugeAxis, 'linear', opts);
        handleTickMarkDefaults(axisIn, axisOut, coerceGaugeAxis, opts);
    } else {
        coerce('title.align', 'center');
        coerce('align', 'center');
        traceOut._isAngular = traceOut._isBullet = false;
    }

    // disable 1D transforms
    traceOut._length = null;
}

function stepDefaults(stepIn, stepOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(stepIn, stepOut, attributes.gauge.steps, attr, dflt);
    }

    coerce('color');
    coerce('line.color');
    coerce('line.width');
    coerce('range');
    coerce('thickness');
}

module.exports = {
    supplyDefaults: supplyDefaults
};
