/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var axisIds = require('../plots/cartesian/axis_ids');

var INEQUALITY_OPS = ['=', '<', '>=', '>', '<='];
var INTERVAL_OPS = ['[]', '()', '[)', '(]', '][', ')(', '](', ')['];
var SET_OPS = ['{}', '}{'];

exports.moduleType = 'transform';

exports.name = 'filter';

exports.attributes = {
    enabled: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether this filter transform is enabled or disabled.'
        ].join(' ')
    },
    filtersrc: {
        valType: 'enumerated',
        values: ['x', 'y', 'z', 'ids'],
        dflt: 'x',
        description: [
            'Sets the variable which the filter will be applied.'
        ].join(' ')
    },
    operation: {
        valType: 'enumerated',
        values: [].concat(INEQUALITY_OPS).concat(INTERVAL_OPS).concat(SET_OPS),
        dflt: '=',
        description: [
            'Sets the filter operation.',

            '*=* filters items equal to `value`',

            '*<* filters items less than `value`',
            '*<=* filters items less than or equal to `value`',

            '*>* filters items greater than `value`',
            '*>=* filters items greater than or equal to `value`',

            '*[]* filters items inside `value[0]` to value[1]` including both bounds`',
            '*()* filters items inside `value[0]` to value[1]` excluding both bounds`',
            '*[)* filters items inside `value[0]` to value[1]` including `value[0]` but excluding `value[1]',
            '*(]* filters items inside `value[0]` to value[1]` including both bounds`',

            '*][* filters items outside `value[0]` to value[1]` and not equal to both bounds`',
            '*)(* filters items outside `value[0]` to value[1]`',
            '*](* filters items outside `value[0]` to value[1]` and not equal to `value[0]`',
            '*)[* filters items outside `value[0]` to value[1]` and not equal to `value[1]`',

            '*{}* filters items present in a set of values',
            '*}{* filters items not present in a set of values'
        ].join(' ')
    },
    value: {
        valType: 'any',
        dflt: 0,
        description: [
            'Sets the value or values by which to filter by.',
            'Values are expected to be in the same type as the data linked',
            'to *filtersrc*.',
            'When `operation` is set to *within* and *notwithin*',
            '*value* is expected to be 2-item array where the first item',
            'is the lower bound and the second item is the upper bound.',
            'When `operation`, is set to *in*, *notin* '
        ].join(' ')
    }
};

exports.supplyDefaults = function(transformIn) {
    var transformOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, exports.attributes, attr, dflt);
    }

    var enabled = coerce('enabled');

    if(enabled) {
        coerce('operation');
        coerce('value');
        coerce('filtersrc');
    }

    return transformOut;
};

exports.transform = function(data) {
    return data;
};

exports.calcTransform = function(gd, trace, opts) {
    var filtersrc = opts.filtersrc;

    if(!opts.enabled || !trace[filtersrc]) return;

    var dataToCoord = getDataToCoordFunc(gd, filtersrc),
        filterFunc = getFilterFunc(opts, dataToCoord);

    var filterArr = trace[filtersrc],
        len = filterArr.length;

    var arrayAttrs = Lib.findArrayAttributes(trace),
        originalArrays = {};

    // copy all original array attribute values,
    // and clear arrays in trace
    for(var k = 0; k < arrayAttrs.length; k++) {
        var attr = arrayAttrs[k],
            np = Lib.nestedProperty(trace, attr);

        originalArrays[attr] = Lib.extendDeep([], np.get());
        np.set([]);
    }

    function fill(attr, i) {
        var oldArr = originalArrays[attr],
            newArr = Lib.nestedProperty(trace, attr).get();

        newArr.push(oldArr[i]);
    }

    for(var i = 0; i < len; i++) {
        var v = filterArr[i];

        if(!filterFunc(v)) continue;

        for(var j = 0; j < arrayAttrs.length; j++) {
            fill(arrayAttrs[j], i);
        }
    }
};

function getDataToCoordFunc(gd, filtersrc) {
    var ax = axisIds.getFromId(gd, filtersrc);

    // if 'filtersrc' has corresponding axis
    // -> use setConvert method
    if(ax) return ax.d2c;

    // special case for 'ids'
    // -> cast to String
    if(filtersrc === 'ids') return function(v) { return String(v); };

    // otherwise -> case to number
    return function(v) { return +(v); };
}

function getFilterFunc(opts, d2c) {
    var operation = opts.operation,
        value = opts.value,
        hasArrayValue = Array.isArray(value);

    function isOperationIn(array) {
        return array.indexOf(operation) !== -1;
    }

    var coercedValue;

    if(isOperationIn(INEQUALITY_OPS)) {
        coercedValue = hasArrayValue ? d2c(value[0]) : d2c(value);
    }
    else if(isOperationIn(INTERVAL_OPS)) {
        coercedValue = hasArrayValue ?
            [d2c(value[0]), d2c(value[1])] :
            [d2c(value), d2c(value)];
    }
    else if(isOperationIn(SET_OPS)) {
        coercedValue = hasArrayValue ? value.map(d2c) : [d2c(value)];
    }

    switch(operation) {

        case '=':
            return function(v) { return d2c(v) === coercedValue; };

        case '<':
            return function(v) { return d2c(v) < coercedValue; };

        case '<=':
            return function(v) { return d2c(v) <= coercedValue; };

        case '>':
            return function(v) { return d2c(v) > coercedValue; };

        case '>=':
            return function(v) { return d2c(v) >= coercedValue; };

        case '[]':
            return function(v) {
                var cv = d2c(v);
                return cv >= coercedValue[0] && cv <= coercedValue[1];
            };

        case '()':
            return function(v) {
                var cv = d2c(v);
                return cv > coercedValue[0] && cv < coercedValue[1];
            };

        case '[)':
            return function(v) {
                var cv = d2c(v);
                return cv >= coercedValue[0] && cv < coercedValue[1];
            };

        case '(]':
            return function(v) {
                var cv = d2c(v);
                return cv > coercedValue[0] && cv <= coercedValue[1];
            };

        case '][':
            return function(v) {
                var cv = d2c(v);
                return cv < coercedValue[0] || cv > coercedValue[1];
            };

        case ')(':
            return function(v) {
                var cv = d2c(v);
                return cv <= coercedValue[0] || cv >= coercedValue[1];
            };

        case '](':
            return function(v) {
                var cv = d2c(v);
                return cv < coercedValue[0] || cv >= coercedValue[1];
            };

        case ')[':
            return function(v) {
                var cv = d2c(v);
                return cv <= coercedValue[0] || cv > coercedValue[1];
            };

        case '{}':
            return function(v) {
                return coercedValue.indexOf(d2c(v)) !== -1;
            };

        case '}{':
            return function(v) {
                return coercedValue.indexOf(d2c(v)) === -1;
            };
    }
}
