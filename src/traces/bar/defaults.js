/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');

var Lib = require('../../lib');
var Color = require('../../components/color');

var handleXYDefaults = require('../scatter/xy_defaults');
var handleStyleDefaults = require('../bar/style_defaults');
var errorBarsSupplyDefaults = require('../../components/errorbars/defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    function coerceEnumerated(attributeDefinition, value, defaultValue) {
        if(attributeDefinition.coerceNumber) value = +value;

        if(attributeDefinition.values.indexOf(value) !== -1) return value;

        return (defaultValue !== undefined) ?
            defaultValue :
            attributeDefinition.dflt;
    }

    function coerceString(attributeDefinition, value, defaultValue) {
        if(typeof value === 'string') {
            if(value || !attributeDefinition.noBlank) return value;
        }
        else if(typeof value === 'number') {
            if(!attributeDefinition.strict) return String(value);
        }

        return (defaultValue !== undefined) ?
            defaultValue :
            attributeDefinition.dflt;
    }

    function coerceNumber(attributeDefinition, value, defaultValue) {
        if(isNumeric(value)) {
            value = +value;

            var min = attributeDefinition.min,
                max = attributeDefinition.max,
                isOutOfBounds = (min !== undefined && value < min) ||
                    (max !== undefined && value > max);

            if(!isOutOfBounds) return value;
        }

        return (defaultValue !== undefined) ?
            defaultValue :
            attributeDefinition.dflt;
    }

    function coerceColor(attributeDefinition, value, defaultValue) {
        if(tinycolor(value).isValid()) return value;

        return (defaultValue !== undefined) ?
            defaultValue :
            attributeDefinition.dflt;
    }

    function coerceFont(attributeDefinition, value, defaultValue) {
        value = value || {};
        defaultValue = defaultValue || {};

        return {
            family: coerceString(
                attributeDefinition.family, value.family, defaultValue.family),
            size: coerceNumber(
                attributeDefinition.size, value.size, defaultValue.size),
            color: coerceColor(
                attributeDefinition.color, value.color, defaultValue.color)
        };
    }

    function coerceArray(attribute, coerceFunction, defaultValue, defaultValue2) {
        var attributeDefinition = attributes[attribute],
            arrayOk = attributeDefinition.arrayOk,
            inValue = traceIn[attribute],
            inValueIsArray = Array.isArray(inValue),
            defaultValueIsArray = Array.isArray(defaultValue),
            outValue,
            i;

        // Case: inValue and defaultValue not treated as arrays
        if(!arrayOk || (!inValueIsArray && !defaultValueIsArray)) {
            outValue = coerceFunction(
                attributeDefinition, inValue, defaultValue);
            traceOut[attribute] = outValue;
            return outValue;
        }

        // Coerce into an array
        outValue = [];

        // Case: defaultValue is an array and inValue isn't
        if(!inValueIsArray) {
            for(i = 0; i < defaultValue.length; i++) {
                outValue.push(
                    coerceFunction(
                        attributeDefinition, inValue, defaultValue[i]));
            }
        }

        // Case: inValue is an array and defaultValue isn't
        else if(!defaultValueIsArray) {
            for(i = 0; i < inValue.length; i++) {
                outValue.push(
                    coerceFunction(
                        attributeDefinition, inValue[i], defaultValue));
            }
        }

        // Case: inValue and defaultValue are both arrays
        else {
            for(i = 0; i < defaultValue.length; i++) {
                outValue.push(
                    coerceFunction(
                        attributeDefinition, inValue[i], defaultValue[i]));
            }
            for(; i < inValue.length; i++) {
                outValue.push(
                    coerceFunction(
                        attributeDefinition, inValue[i], defaultValue2));
            }
        }

        traceOut[attribute] = outValue;

        return outValue;
    }

    var len = handleXYDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    coerce('base');
    coerce('offset');
    coerce('width');

    coerceArray('text', coerceString);

    var textPosition = coerceArray('textposition', coerceEnumerated);

    var hasBoth = Array.isArray(textPosition) || textPosition === 'auto',
        hasInside = hasBoth || textPosition === 'inside',
        hasOutside = hasBoth || textPosition === 'outside';
    if(hasInside || hasOutside) {
        var textFont = coerceArray('textfont', coerceFont, layout.font);
        if(hasInside) {
            coerceArray('insidetextfont', coerceFont, textFont, layout.font);
        }
        if(hasOutside) {
            coerceArray('outsidetextfont', coerceFont, textFont, layout.font);
        }
    }

    handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout);

    // override defaultColor for error bars with defaultLine
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'x', inherit: 'y'});
};
