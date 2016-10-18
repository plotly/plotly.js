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
 * This function checks to see if an array of objects containing
 * method and args properties is compatible with automatic two-way
 * binding. The criteria right now are that
 *
 *   1. multiple traces may be affected
 *   2. only one property may be affected
 *   3. the same property must be affected by all commands
 */
exports.hasSimpleBindings = function(gd, commandList, bindingsByValue) {
    var n = commandList.length;

    var refBinding;

    for(var i = 0; i < n; i++) {
        var binding;
        var command = commandList[i];
        var method = command.method;
        var args = command.args;

        // If any command has no method, refuse to bind:
        if(!method) {
            return false;
        }
        var bindings = exports.computeAPICommandBindings(gd, method, args);

        // Right now, handle one and *only* one property being set:
        if(bindings.length !== 1) {
            return false;
        }

        if(!refBinding) {
            refBinding = bindings[0];
            if(Array.isArray(refBinding.traces)) {
                refBinding.traces.sort();
            }
        } else {
            binding = bindings[0];
            if(binding.type !== refBinding.type) {
                return false;
            }
            if(binding.prop !== refBinding.prop) {
                return false;
            }
            if(Array.isArray(refBinding.traces)) {
                if(Array.isArray(binding.traces)) {
                    binding.traces.sort();
                    for(var j = 0; j < refBinding.traces.length; j++) {
                        if(refBinding.traces[j] !== binding.traces[j]) {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            } else {
                if(binding.prop !== refBinding.prop) {
                    return false;
                }
            }
        }

        binding = bindings[0];
        var value = binding.value[0];
        if(Array.isArray(value)) {
            value = value[0];
        }
        bindingsByValue[value] = i;
    }

    return refBinding;
};

exports.createBindingObserver = function(gd, commandList, onchange) {
    var cache = {};
    var lookupTable = {};
    var check, remove;
    var enabled = true;

    // Determine whether there's anything to do for this binding:
    var binding;
    if((binding = exports.hasSimpleBindings(gd, commandList, lookupTable))) {
        exports.bindingValueHasChanged(gd, binding, cache);

        check = function check() {
            if(!enabled) return;

            var container, value, obj;
            var changed = false;

            if(binding.type === 'data') {
                // If it's data, we need to get a trace. Based on the limited scope
                // of what we cover, we can just take the first trace from the list,
                // or otherwise just the first trace:
                container = gd._fullData[binding.traces !== null ? binding.traces[0] : 0];
            } else if(binding.type === 'layout') {
                container = gd._fullLayout;
            } else {
                return false;
            }

            value = Lib.nestedProperty(container, binding.prop).get();

            obj = cache[binding.type] = cache[binding.type] || {};

            if(obj.hasOwnProperty(binding.prop)) {
                if(obj[binding.prop] !== value) {
                    changed = true;
                }
            }

            obj[binding.prop] = value;

            if(changed && onchange) {
                // Disable checks for the duration of this command in order to avoid
                // infinite loops:
                if(lookupTable[value] !== undefined) {
                    disable();
                    Promise.resolve(onchange({
                        value: value,
                        type: binding.type,
                        prop: binding.prop,
                        traces: binding.traces,
                        index: lookupTable[value]
                    })).then(enable, enable);
                }
            }

            return changed;
        };

        gd._internalOn('plotly_plotmodified', check);

        remove = function() {
            gd._removeInternalListener('plotly_plotmodified', check);
        };
    } else {
        lookupTable = {};
        remove = function() {};
    }

    function disable() {
        enabled = false;
    }

    function enable() {
        enabled = true;
    }

    return {
        disable: disable,
        enable: enable,
        remove: remove
    };
};

exports.bindingValueHasChanged = function(gd, binding, cache) {
    var container, value, obj;
    var changed = false;

    if(binding.type === 'data') {
        // If it's data, we need to get a trace. Based on the limited scope
        // of what we cover, we can just take the first trace from the list,
        // or otherwise just the first trace:
        container = gd._fullData[binding.traces !== null ? binding.traces[0] : 0];
    } else if(binding.type === 'layout') {
        container = gd._fullLayout;
    } else {
        return false;
    }

    value = Lib.nestedProperty(container, binding.prop).get();

    obj = cache[binding.type] = cache[binding.type] || {};

    if(obj.hasOwnProperty(binding.prop)) {
        if(obj[binding.prop] !== value) {
            changed = true;
        }
    }

    obj[binding.prop] = value;

    return changed;
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
            bindings = computeAnimateBindings(gd, args);
            break;
        default:
            // We'll elect to fail-non-fatal since this is a correct
            // answer and since this is not a validation method.
            bindings = [];
    }
    return bindings;
};

function computeAnimateBindings(gd, args) {
    // We'll assume that the only relevant modification an animation
    // makes that's meaningfully tracked is the frame:
    if(Array.isArray(args[0]) && args[0].length === 1 && typeof args[0][0] === 'string') {
        return [{type: 'layout', prop: '_currentFrame', value: args[0][0]}];
    } else {
        return [];
    }
}

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

    crawl(aobj, function(path, attrName, attr) {
        bindings.push({type: 'layout', prop: path, value: attr});
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

        // Convert [7] to just 7 when traces is null:
        if(thisTraces === null) {
            if(Array.isArray(attr)) {
                attr = attr[0];
            }
        } else if(Array.isArray(thisTraces)) {
            if(!Array.isArray(attr)) {
                var tmp = attr;
                attr = [];
                for(var i = 0; i < thisTraces.length; i++) {
                    attr[i] = tmp;
                }
            }
            attr.length = Math.min(thisTraces.length, attr.length);
        }

        bindings.push({
            type: 'data',
            prop: path,
            traces: thisTraces,
            value: attr
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
