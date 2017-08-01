/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../plots/cartesian/axes');
var Lib = require('../lib');
var PlotSchema = require('../plot_api/plot_schema');
var BADNUM = require('../constants/numerical').BADNUM;

exports.moduleType = 'transform';

exports.name = 'aggregate';

var attrs = exports.attributes = {
    enabled: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether this aggregate transform is enabled or disabled.'
        ].join(' ')
    },
    groups: {
        // TODO: groupby should support string or array grouping this way too
        // currently groupby only allows a grouping array
        valType: 'string',
        strict: true,
        noBlank: true,
        arrayOk: true,
        dflt: 'x',
        description: [
            'Sets the grouping target to which the aggregation is applied.',
            'Data points with matching group values will be coalesced into',
            'one point, using the supplied aggregation functions to reduce data',
            'in other data arrays.',
            'If a string, *groups* is assumed to be a reference to a data array',
            'in the parent trace object.',
            'To aggregate by nested variables, use *.* to access them.',
            'For example, set `groups` to *marker.color* to aggregate',
            'about the marker color array.',
            'If an array, *groups* is itself the data array by which we aggregate.'
        ].join(' ')
    },
    aggregations: {
        _isLinkedToArray: 'style',
        array: {
            valType: 'string',
            role: 'info',
            description: [
                'A reference to the data array in the parent trace to aggregate.',
                'To aggregate by nested variables, use *.* to access them.',
                'For example, set `groups` to *marker.color* to aggregate',
                'about the marker color array.',
                'The referenced array must already exist, unless `func` is *count*,',
                'and each array may only be referenced once.'
            ].join(' ')
        },
        func: {
            valType: 'enumerated',
            values: ['count', 'sum', 'avg', 'min', 'max', 'first', 'last'],
            dflt: 'first',
            role: 'info',
            description: [
                'Sets the aggregation function.',
                'All values from the linked `array`, corresponding to the same value',
                'in the `groups` array, are collected and reduced by this function.',
                '*count* is simply the number of values in the `groups` array, so does',
                'not even require the linked array to exist. *first* (*last*) is just',
                'the first (last) linked value.'
            ].join(' ')
        },
    }
};

/**
 * Supply transform attributes defaults
 *
 * @param {object} transformIn
 *  object linked to trace.transforms[i] with 'func' set to exports.name
 * @param {object} traceOut
 *  the _fullData trace this transform applies to
 * @param {object} layout
 *  the plot's (not-so-full) layout
 * @param {object} traceIn
 *  the input data trace this transform applies to
 *
 * @return {object} transformOut
 *  copy of transformIn that contains attribute defaults
 */
exports.supplyDefaults = function(transformIn, traceOut) {
    var transformOut = {};
    var i;

    function coerce(attr, dflt) {
        return Lib.coerce(transformIn, transformOut, attrs, attr, dflt);
    }

    var enabled = coerce('enabled');

    if(!enabled) return transformOut;

    /*
     * Normally _arrayAttrs is calculated during doCalc, but that comes later.
     * Anyway this can change due to *count* aggregations (see below) so it's not
     * necessarily the same set.
     *
     * For performance we turn it into an object of truthy values
     * we'll use 1 for arrays we haven't aggregated yet, 0 for finished arrays,
     * as distinct from undefined which means this array isn't present in the input
     * missing arrays can still be aggregate outputs for *count* aggregations.
     */
    var arrayAttrArray = PlotSchema.findArrayAttributes(traceOut);
    var arrayAttrs = {};
    for(i = 0; i < arrayAttrArray.length; i++) arrayAttrs[arrayAttrArray[i]] = 1;

    var groups = coerce('groups');

    if(!Array.isArray(groups)) {
        if(!arrayAttrs[groups]) {
            transformOut.enabled = false;
            return;
        }
        arrayAttrs[groups] = 0;
    }

    var aggregationsIn = transformIn.aggregations;
    var aggregationsOut = transformOut.aggregations = [];

    if(aggregationsIn) {
        for(i = 0; i < aggregationsIn.length; i++) {
            var aggregationOut = {};
            var array = Lib.coerce(aggregationsIn[i], aggregationOut, attrs.aggregations, 'array');
            var func = Lib.coerce(aggregationsIn[i], aggregationOut, attrs.aggregations, 'func');

            // add this aggregation to the output only if it's the first instance
            // of a valid array attribute - or an unused array attribute with "count"
            if(array && (arrayAttrs[array] || (func === 'count' && arrayAttrs[array] === undefined))) {
                arrayAttrs[array] = 0;
                aggregationsOut.push(aggregationOut);
            }
        }
    }

    // any array attributes we haven't yet covered, fill them with the default aggregation
    for(i = 0; i < arrayAttrArray.length; i++) {
        if(arrayAttrs[arrayAttrArray[i]]) {
            aggregationsOut.push({
                array: arrayAttrArray[i],
                func: attrs.aggregations.func.dflt
            });
        }
    }

    return transformOut;
};


exports.calcTransform = function(gd, trace, opts) {
    if(!opts.enabled) return;

    var groups = opts.groups;

    var groupArray = Lib.getTargetArray(trace, {target: groups});
    if(!groupArray) return;

    var i, vi, groupIndex;

    var groupIndices = {};
    var groupings = [];
    for(i = 0; i < groupArray.length; i++) {
        vi = groupArray[i];
        groupIndex = groupIndices[vi];
        if(groupIndex === undefined) {
            groupIndices[vi] = groupings.length;
            groupings.push([i]);
        }
        else groupings[groupIndex].push(i);
    }

    var aggregations = opts.aggregations;

    for(i = 0; i < aggregations.length; i++) {
        aggregateOneArray(gd, trace, groupings, aggregations[i]);
    }

    if(typeof groups === 'string') {
        aggregateOneArray(gd, trace, groupings, {array: groups, func: 'first'});
    }
};

function aggregateOneArray(gd, trace, groupings, aggregation) {
    var attr = aggregation.array;
    var targetNP = Lib.nestedProperty(trace, attr);
    var arrayIn = targetNP.get();
    var conversions = Axes.getDataConversions(gd, trace, attr, arrayIn);
    var func = getAggregateFunction(aggregation.func, conversions);

    var arrayOut = new Array(groupings.length);
    for(var i = 0; i < groupings.length; i++) {
        arrayOut[i] = func(arrayIn, groupings[i]);
    }
    targetNP.set(arrayOut);
}

function getAggregateFunction(func, conversions) {
    var d2c = conversions.d2c;
    var c2d = conversions.c2d;

    switch(func) {
        // count, first, and last don't depend on anything about the data
        // point back to pure functions for performance
        case 'count':
            return count;
        case 'first':
            return first;
        case 'last':
            return last;

        case 'sum':
            // This will produce output in all cases even though it's nonsensical
            // for date or category data.
            return function(array, indices) {
                var total = 0;
                for(var i = 0; i < indices.length; i++) {
                    var vi = d2c(array[indices[i]]);
                    if(vi !== BADNUM) total += +vi;
                }
                return c2d(total);
            };

        case 'avg':
            // Generally meaningless for category data but it still does something.
            return function(array, indices) {
                var total = 0;
                var cnt = 0;
                for(var i = 0; i < indices.length; i++) {
                    var vi = d2c(array[indices[i]]);
                    if(vi !== BADNUM) {
                        total += +vi;
                        cnt++;
                    }
                }
                return cnt ? c2d(total / cnt) : BADNUM;
            };

        case 'min':
            return function(array, indices) {
                var out = Infinity;
                for(var i = 0; i < indices.length; i++) {
                    var vi = d2c(array[indices[i]]);
                    if(vi !== BADNUM) out = Math.min(out, +vi);
                }
                return (out === Infinity) ? BADNUM : c2d(out);
            };

        case 'max':
            return function(array, indices) {
                var out = -Infinity;
                for(var i = 0; i < indices.length; i++) {
                    var vi = d2c(array[indices[i]]);
                    if(vi !== BADNUM) out = Math.max(out, +vi);
                }
                return (out === -Infinity) ? BADNUM : c2d(out);
            };
    }
}

function count(array, indices) {
    return indices.length;
}

function first(array, indices) {
    return array[indices[0]];
}

function last(array, indices) {
    return array[indices[indices.length - 1]];
}
