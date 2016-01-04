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
var nestedProperty = require('./nested_property');

var getColorscale = require('../components/colorscale/get_scale');
var colorscaleNames = Object.keys(require('../components/colorscale/scales'));


exports.valObjects = {
    data_array: {
        // You can use *dflt=[] to force said array to exist though.
        description: [
            'An {array} of data.',
            'The value MUST be an {array}, or we ignore it.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(Array.isArray(v)) propOut.set(v);
            else if(dflt!==undefined) propOut.set(dflt);
        }
    },
    enumerated: {
        description: [
            'Enumerated value type. The available values are listed',
            'in `values`.'
        ].join(' '),
        requiredOpts: ['values'],
        otherOpts: ['dflt', 'coerceNumber', 'arrayOk'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(opts.coerceNumber) v = +v;
            if(opts.values.indexOf(v)===-1) propOut.set(dflt);
            else propOut.set(v);
        }
    },
    'boolean': {
        description: 'A boolean (true/false) value.',
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(v===true || v===false) propOut.set(v);
            else propOut.set(dflt);
        }
    },
    number: {
        description: [
            'A number or a numeric value',
            '(e.g. a number inside a string).',
            'When applicable, values greater (less) than `max` (`min`)',
            'are coerced to the `dflt`.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt', 'min', 'max', 'arrayOk'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(!isNumeric(v) ||
                    (opts.min!==undefined && v<opts.min) ||
                    (opts.max!==undefined && v>opts.max)) {
                propOut.set(dflt);
            }
            else propOut.set(+v);
        }
    },
    integer: {
        description: [
            'An integer or an integer inside a string.',
            'When applicable, values greater (less) than `max` (`min`)',
            'are coerced to the `dflt`.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt', 'min', 'max'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(v%1 || !isNumeric(v) ||
                    (opts.min!==undefined && v<opts.min) ||
                    (opts.max!==undefined && v>opts.max)) {
                propOut.set(dflt);
            }
            else propOut.set(+v);
        }
    },
    string: {
        description: [
            'A string value.',
            'Numbers are converted to strings except for attributes with',
            '`strict` set to true.'
        ].join(' '),
        requiredOpts: [],
        // TODO 'values shouldn't be in there (edge case: 'dash' in Scatter)
        otherOpts: ['dflt', 'noBlank', 'strict', 'arrayOk', 'values'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(opts.strict===true && typeof v !== 'string') {
                propOut.set(dflt);
                return;
            }

            var s = String(v);
            if(v===undefined || (opts.noBlank===true && !s)) {
                propOut.set(dflt);
            }
            else propOut.set(s);
        }
    },
    color: {
        description: [
            'A string describing color.',
            'Supported formats:',
            '- hex (e.g. \'#d3d3d3\')',
            '- rgb (e.g. \'rgb(255, 0, 0)\')',
            '- rgba (e.g. \'rgb(255, 0, 0, 0.5)\')',
            '- hsl (e.g. \'hsl(0, 100%, 50%)\')',
            '- hsv (e.g. \'hsv(0, 100%, 100%)\')',
            '- named colors (full list: http://www.w3.org/TR/css3-color/#svg-color)'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt', 'arrayOk'],
        coerceFunction: function(v, propOut, dflt) {
            if(tinycolor(v).isValid()) propOut.set(v);
            else propOut.set(dflt);
        }
    },
    colorscale: {
        description: [
            'A Plotly colorscale either picked by a name:',
            '(any of', colorscaleNames.join(', '), ')',
            'customized as an {array} of 2-element {arrays} where',
            'the first element is the normalized color level value',
            '(starting at *0* and ending at *1*),',
            'and the second item is a valid color string.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            propOut.set(getColorscale(v, dflt));
        }
    },
    angle: {
        description: [
            'A number (in degree) between -180 and 180.'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(v==='auto') propOut.set('auto');
            else if(!isNumeric(v)) propOut.set(dflt);
            else {
                if(Math.abs(v)>180) v -= Math.round(v/360)*360;
                propOut.set(+v);
            }
        }
    },
    axisid: {
        description: [
            'An axis id string (e.g. \'x\', \'x2\', \'x3\', ...).'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(typeof v === 'string' && v.charAt(0)===dflt) {
                var axnum = Number(v.substr(1));
                if(axnum%1 === 0 && axnum>1) {
                    propOut.set(v);
                    return;
                }
            }
            propOut.set(dflt);
        }
    },
    sceneid: {
        description: [
            'A scene id string (e.g. \'scene\', \'scene2\', \'scene3\', ...).'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(typeof v === 'string' && v.substr(0,5)===dflt) {
                var scenenum = Number(v.substr(5));
                if(scenenum%1 === 0 && scenenum>1) {
                    propOut.set(v);
                    return;
                }
            }
            propOut.set(dflt);
        }
    },
    geoid: {
        description: [
            'A geo id string (e.g. \'geo\', \'geo2\', \'geo3\', ...).'
        ].join(' '),
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(typeof v === 'string' && v.substr(0,3)===dflt) {
                var geonum = Number(v.substr(3));
                if(geonum%1 === 0 && geonum>1) {
                    propOut.set(v);
                    return;
                }
            }
            propOut.set(dflt);
        }
    },
    flaglist: {
        description: [
            'A string representing a combination of flags',
            '(order does not matter here).',
            'Combine any of the available `flags` with *+*.',
            '(e.g. (\'lines+markers\')).',
            'Values in `extras` cannot be combined.'
        ].join(' '),
        requiredOpts: ['flags'],
        otherOpts: ['dflt', 'extras'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(typeof v !== 'string') {
                propOut.set(dflt);
                return;
            }
            if(opts.extras.indexOf(v)!==-1) {
                propOut.set(v);
                return;
            }
            var vParts = v.split('+'),
                i = 0;
            while(i<vParts.length) {
                var vi = vParts[i];
                if(opts.flags.indexOf(vi)===-1 || vParts.indexOf(vi)<i) {
                    vParts.splice(i,1);
                }
                else i++;
            }
            if(!vParts.length) propOut.set(dflt);
            else propOut.set(vParts.join('+'));
        }
    },
    any: {
        description: 'Any type.',
        requiredOpts: [],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt) {
            if(v===undefined) propOut.set(dflt);
            else propOut.set(v);
        }
    },
    info_array: {
        description: [
            'An {array} of plot information.'
        ].join(' '),
        requiredOpts: ['items'],
        otherOpts: ['dflt'],
        coerceFunction: function(v, propOut, dflt, opts) {
            if(!Array.isArray(v)) {
                propOut.set(dflt);
                return;
            }

            var items = opts.items,
                vOut = [];
            dflt = Array.isArray(dflt) ? dflt : [];

            for(var i = 0; i < items.length; i++) {
                exports.coerce(v, vOut, items, '[' + i + ']', dflt[i]);
            }

            propOut.set(vOut);
        }
    }
};

/**
 * Ensures that container[attribute] has a valid value.
 *
 * attributes[attribute] is an object with possible keys:
 * - valType: data_array, enumerated, boolean, ... as in valObjects
 * - values: (enumerated only) array of allowed vals
 * - min, max: (number, integer only) inclusive bounds on allowed vals
 *      either or both may be omitted
 * - dflt: if attribute is invalid or missing, use this default
 *      if dflt is provided as an argument to lib.coerce it takes precedence
 *      as a convenience, returns the value it finally set
 */
exports.coerce = function(containerIn, containerOut, attributes, attribute, dflt) {
    var opts = nestedProperty(attributes, attribute).get(),
        propIn = nestedProperty(containerIn, attribute),
        propOut = nestedProperty(containerOut, attribute),
        v = propIn.get();

    if(dflt===undefined) dflt = opts.dflt;

    /**
     * arrayOk: value MAY be an array, then we do no value checking
     * at this point, because it can be more complicated than the
     * individual form (eg. some array vals can be numbers, even if the
     * single values must be color strings)
     */
    if(opts.arrayOk && Array.isArray(v)) {
        propOut.set(v);
        return v;
    }

    exports.valObjects[opts.valType].coerceFunction(v, propOut, dflt, opts);

    return propOut.get();
};

/**
 * Variation on coerce
 *
 * Uses coerce to get attribute value if user input is valid,
 * returns attribute default if user input it not valid or
 * returns false if there is no user input.
 */
exports.coerce2 = function(containerIn, containerOut, attributes, attribute, dflt) {
    var propIn = nestedProperty(containerIn, attribute),
        propOut = exports.coerce(containerIn, containerOut, attributes, attribute, dflt);

    return propIn.get() ? propOut : false;
};

/*
 * Shortcut to coerce the three font attributes
 *
 * 'coerce' is a lib.coerce wrapper with implied first three arguments
 */
exports.coerceFont = function(coerce, attr, dfltObj) {
    var out = {};

    dfltObj = dfltObj || {};

    out.family = coerce(attr + '.family', dfltObj.family);
    out.size = coerce(attr + '.size', dfltObj.size);
    out.color = coerce(attr + '.color', dfltObj.color);

    return out;
};
