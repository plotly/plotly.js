/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../plotly');
var Lib = require('../lib');

var attrPrefixRegex = /^(data|layout)(\[(-?[0-9]*)\])?\.(.*)$/;

/*
 * This function checks to see if a set of bindings is compatible
 * with automatic two-way binding. The criteria right now are that
 *
 *   1. multiple traces may be affected
 *   2. only one property may be affected
 */
exports.bindingsAreConsistent = function(currentBindings, newBindings) {
    // If they're not both arrays of equal length, return false:
    if(!newBindings || !currentBindings || currentBindings.length !== newBindings.length) {
        return false;
    }

    var n = currentBindings.length;

    for(var i = 0; i < n; i++) {
        // This is not the most efficient check, but the pathological case where there
        // are an excessive number of bindings should be rare, and at any rate we really
        // try to bail out early at every opportunity.
        if(currentBindings.indexOf(newBindings[i]) === -1) {
            return false;
        }
    }

    return true;
};

exports.evaluateAPICommandBinding = function(gd, attrName) {
    var match = attrName.match(attrPrefixRegex);

    if(!match) {
        return null;
    }

    var group = match[1];
    var propStr = match[4];
    var container;

    switch(group) {
        case 'data':
            container = gd._fullData[parseInt(match[3])];
            break;
        case 'layout':
            container = gd._fullLayout;
            break;
        default:
            return null;
    }

    return Lib.nestedProperty(container, propStr).get();
};

exports.executeAPICommand = function(gd, method, args) {
    var apiMethod = Plotly[method];

    var allArgs = [gd];
    for(var i = 0; i < args.length; i++) {
        allArgs.push(args[i]);
    }

    if(!apiMethod) {
        return Promise.reject();
    }

    return apiMethod.apply(null, allArgs);
};

exports.computeAPICommandBindings = function(gd, method, args) {
    var bindings;
    switch(method) {
        case 'restyle':
            bindings = computeDataBindings(gd, args);
            break;
        case 'relayout':
            bindings = computeLayoutBindings(gd, args);
            break;
        case 'update':
            bindings = computeDataBindings(gd, [args[0], args[2]])
                .concat(computeLayoutBindings(gd, [args[1]]));
            break;
        case 'animate':
            // This case could be analyzed more in-depth, but for a start,
            // we'll assume that the only relevant modification an animation
            // makes that's meaningfully tracked is the frame:
            bindings = [{type: 'layout', prop: '_currentFrame'}];
            break;
        default:
            // We'll elect to fail-non-fatal since this is a correct
            // answer and since this is not a validation method.
            bindings = [];
    }
    return bindings;
};

function computeLayoutBindings(gd, args) {
    var bindings = [];

    var astr = args[0];
    var aobj = {};
    if(typeof astr === 'string') {
        aobj[astr] = args[1];
    } else if(Lib.isPlainObject(astr)) {
        aobj = astr;
    } else {
        return bindings;
    }

    crawl(aobj, function(path) {
        bindings.push({type: 'layout', prop: path});
    }, '', 0);

    return bindings;
}

function computeDataBindings(gd, args) {
    var traces, astr, val, aobj;
    var bindings = [];

    // Logic copied from Plotly.restyle:
    astr = args[0];
    val = args[1];
    traces = args[2];
    aobj = {};
    if(typeof astr === 'string') {
        aobj[astr] = val;
    } else if(Lib.isPlainObject(astr)) {
        // the 3-arg form
        aobj = astr;

        if(traces === undefined) {
            traces = val;
        }
    } else {
        return bindings;
    }

    if(traces === undefined) {
        // Explicitly assign this to null instead of undefined:
        traces = null;
    }

    crawl(aobj, function(path, attrName, attr) {
        var thisTraces;
        if(Array.isArray(attr)) {
            var nAttr = Math.min(attr.length, gd.data.length);
            if(traces) {
                nAttr = Math.min(nAttr, traces.length);
            }
            thisTraces = [];
            for(var j = 0; j < nAttr; j++) {
                thisTraces[j] = traces ? traces[j] : j;
            }
        } else {
            thisTraces = traces ? traces.slice(0) : null;
        }

        bindings.push({
            type: 'data',
            prop: path,
            traces: thisTraces
        });
    }, '', 0);

    return bindings;
}

function crawl(attrs, callback, path, depth) {
    Object.keys(attrs).forEach(function(attrName) {
        var attr = attrs[attrName];

        if(attrName[0] === '_') return;

        var thisPath = path + (depth > 0 ? '.' : '') + attrName;

        if(Lib.isPlainObject(attr)) {
            crawl(attr, callback, thisPath, depth + 1);
        } else {
            // Only execute the callback on leaf nodes:
            callback(thisPath, attrName, attr);
        }
    });
}
