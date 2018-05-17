/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('@src/lib');
var PlotSchema = require('@src/plot_api/plot_schema');
var Plots = require('@src/plots/plots');


exports.makeTemplate = function(figure) {
    var template = {};
    var data = figure.data || [];
    var layout = figure.layout || {};
    var graphDiv = {
        data: data,
        layout: layout,
        _context: {locales: {}, locale: 'en-US'}
    };

    Plots.supplyDefaults(graphDiv);

    data.forEach(function(trace, index) {
        if(!template.data) {
            template.data = [];
        }

        // TODO: What if no style info is extracted for this trace. We may
        // not want an empty object as the null value.
        var traceTemplate = template.data[index] = {};

        // TODO: you can't assume data[index] will match to fullData[index]
        // which this next index operation is assuming.
        walkStyleKeys(trace, getTraceInfo.bind(null, trace), function(attr, path) {

            // NOTE: we are extracting the value from fullData so templates
            // will be validated to some degree by a supplyDefaults step.
            // TODO: Keep this behaviour or copy over the user data?
            var value = Lib.nestedProperty(trace, path).get();
            var templateProp = Lib.nestedProperty(traceTemplate, path);
            templateProp.set(value);
        });
    });

    walkStyleKeys(layout, getLayoutInfo.bind(null, layout), function(attr, path) {
        var layoutTemplate = template.layout;
        if(!template.layout) {
            layoutTemplate = template.layout = {};
        }

        // NOTE: we are extracting the value from fullData so templates
        // will be validated to some degree by a supplyDefaults step.
        // TODO: Keep this behaviour or copy over the user data?
        var value = Lib.nestedProperty(layout, path).get();
        var templateProp = Lib.nestedProperty(layoutTemplate, path);
        templateProp.set(value);
    });

    return template;
};

exports.applyTemplate = function(figure, template) {
    var data = figure.data || [];
    var layout = figure.layout || {};
    var graphDiv = {
        data: data,
        layout: layout,
        _context: {locales: {}, locale: 'en-US'}
    };

    Plots.supplyDefaults(graphDiv);

    var fullData = graphDiv._fullData;
    var fullLayout = graphDiv._fullLayout;

    var results = {};
    results.figure = Lib.extendDeepNoArrays(figure);
    return results;
};

function walkStyleKeys(parent, getAttributeInfo, callback, path) {
    Object.keys(parent).forEach(function(key) {
        var child = parent[key];
        var nextPath = getNextPath(parent, key, path);
        var attr = getAttributeInfo(nextPath);

        if(!attr) {
            return;
        }

        if(attr.valType === 'data_array' ||
           (attr.arrayOk && Array.isArray(child))) {
            return;
        }

        if(Lib.isPlainObject(child) || Array.isArray(child)) {
            walkStyleKeys(child, getAttributeInfo, callback, nextPath);
            return;
        }

        if(attr.role !== 'style') {
            return;
        }

        callback(attr, nextPath);
    });
}

function getLayoutInfo(fullLayout, path) {
    return PlotSchema.getLayoutValObject(
        fullLayout, Lib.nestedProperty({}, path).parts
    );
}

function getTraceInfo(fullTrace, path) {
    return PlotSchema.getTraceValObject(
        fullTrace, Lib.nestedProperty({}, path).parts
    );
}

function getNextPath(parent, key, path) {
    var nextPath;
    if(!path || path.length === 0) {
        nextPath = key;
    } else if(Array.isArray(parent)) {
        nextPath = path + '[' + key + ']';
    } else {
        nextPath = path + '.' + key;
    }

    return nextPath;
}
