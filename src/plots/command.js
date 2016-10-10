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
var helpers = require('../plot_api/helpers');

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
        case 'animate':
            bindings = computeDataBindings(gd, [args[0], args[2]])
                .concat(computeLayoutBindings(gd, [args[1]]));
            break;
        default:
            // We'll elect to fail-non-fatal since this is a correct
            // answer and since this is not a validation method.
            bindings = [];
    }
    return bindings;
};

function computeLayoutBindings (gd, args) {
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

    crawl(aobj, function (path, attrName, attr) {
        bindings.push('layout' + path);
    });

    return bindings;
}

function computeDataBindings (gd, args) {
    var i, traces, astr, attr, val, traces, aobj;
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

    if (traces === undefined) {
        traces = [];
        for (i = 0; i < gd.data.length; i++) {
            traces.push(i);
        }
    }

    crawl(aobj, function (path, attrName, attr) {
        var nAttr;
        if (Array.isArray(attr)) {
            nAttr = Math.min(attr.length, traces.length);
        } else {
            nAttr = traces.length;
        }
        for (var j = 0; j < nAttr; j++) {
            bindings.push('data[' + traces[j] + ']' + path);
        }
    });

    return bindings;
}

function crawl(attrs, callback, path, depth) {
    if(depth === undefined) {
        depth = 0;
    }

    if(path === undefined) {
        path = '';
    }

    Object.keys(attrs).forEach(function(attrName) {
        var attr = attrs[attrName];

        if(attrName[0] === '_') return;

        var thisPath = path + '.' + attrName;

        if(Lib.isPlainObject(attr)) {
            crawl(attr, callback, thisPath, depth + 1);
        } else {
            // Only execute the callback on leaf nodes:
            callback(thisPath, attrName, attr);
        }
    });
}
