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
        values: ['=', '<', '>', 'within', 'notwithin', 'in', 'notin'],
        dflt: '=',
        description: [
            'Sets the filter operation.'
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
    },
    strictinterval: {
        valType: 'boolean',
        dflt: true,
        arrayOk: true,
        description: [
            'Determines whether or not the filter operation includes data item value,',
            'equal to *value*.',
            'Has only an effect for `operation` *>*, *<*, *within* and *notwithin*',
            'When `operation` is set to  *within* and *notwithin*,',
            '`strictinterval` is expected to be a 2-item array where the first (second)',
            'item determines strictness for the lower (second) bound.'
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
        var operation = coerce('operation');

        coerce('value');
        coerce('filtersrc');

        if(['=', 'in', 'notin'].indexOf(operation) === -1) {
            coerce('strictinterval');
        }
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
        hasArrayValue = Array.isArray(value),
        strict = opts.strictinterval,
        hasArrayStrict = Array.isArray(strict);

    function isOperationIn(array) {
        return array.indexOf(operation) !== -1;
    }

    var coercedValue, coercedStrict;

    if(isOperationIn(['=', '<', '>'])) {
        coercedValue = hasArrayValue ? d2c(value[0]) : d2c(value);

        if(isOperationIn(['<', '>'])) {
            coercedStrict = hasArrayStrict ? strict[0] : strict;
        }
    }
    else if(isOperationIn(['within', 'notwithin'])) {
        coercedValue = hasArrayValue ?
            [d2c(value[0]), d2c(value[1])] :
            [d2c(value), d2c(value)];

        coercedStrict = hasArrayStrict ?
            [strict[0], strict[1]] :
            [strict, strict];
    }
    else if(isOperationIn(['in', 'notin'])) {
        coercedValue = hasArrayValue ? value.map(d2c) : [d2c(value)];
    }

    switch(operation) {

        case '=':
            return function(v) { return d2c(v) === coercedValue; };

        case '<':
            if(coercedStrict) {
                return function(v) { return d2c(v) < coercedValue; };
            }
            else {
                return function(v) { return d2c(v) <= coercedValue; };
            }

        case '>':
            if(coercedStrict) {
                return function(v) { return d2c(v) > coercedValue; };
            }
            else {
                return function(v) { return d2c(v) >= coercedValue; };
            }

        case 'within':

            if(coercedStrict[0] && coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv > coercedValue[0] && cv < coercedValue[1];
                };
            }
            else if(coercedStrict[0] && !coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv > coercedValue[0] && cv <= coercedValue[1];
                };
            }
            else if(!coercedStrict[0] && coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv >= coercedValue[0] && cv < coercedValue[1];
                };
            }
            else if(!coercedStrict[0] && !coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv >= coercedValue[0] && cv <= coercedValue[1];
                };
            }

            break;

        case 'notwithin':

            if(coercedStrict[0] && coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv < coercedValue[0] || cv > coercedValue[1];
                };
            }
            else if(coercedStrict[0] && !coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv < coercedValue[0] || cv >= coercedValue[1];
                };
            }
            else if(!coercedStrict[0] && coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv <= coercedValue[0] || cv > coercedValue[1];
                };
            }
            else if(!coercedStrict[0] && !coercedStrict[1]) {
                return function(v) {
                    var cv = d2c(v);
                    return cv <= coercedValue[0] || cv >= coercedValue[1];
                };
            }

            break;

        case 'in':
            return function(v) {
                return coercedValue.indexOf(d2c(v)) !== -1;
            };

        case 'notin':
            return function(v) {
                return coercedValue.indexOf(d2c(v)) === -1;
            };
    }
}
