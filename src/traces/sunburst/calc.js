/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3Hierarchy = require('d3-hierarchy');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var makeColorScaleFn = require('../../components/colorscale').makeColorScaleFuncFromTrace;
var makePullColorFn = require('../pie/calc').makePullColorFn;
var generateExtendedColors = require('../pie/calc').generateExtendedColors;
var colorscaleCalc = require('../../components/colorscale').calc;

var ALMOST_EQUAL = require('../../constants/numerical').ALMOST_EQUAL;

var sunburstExtendedColorWays = {};
var treemapExtendedColorWays = {};

exports.calc = function(gd, trace) {
    var fullLayout = gd._fullLayout;
    var ids = trace.ids;
    var hasIds = Lib.isArrayOrTypedArray(ids);
    var labels = trace.labels;
    var parents = trace.parents;
    var values = trace.values;
    var hasValues = Lib.isArrayOrTypedArray(values);
    var cd = [];

    var parent2children = {};
    var refs = {};
    var addToLookup = function(parent, v) {
        if(parent2children[parent]) parent2children[parent].push(v);
        else parent2children[parent] = [v];
        refs[v] = 1;
    };

    // treat number `0` as valid
    var isValidKey = function(k) {
        return k || typeof k === 'number';
    };

    var isValidVal = function(i) {
        return !hasValues || (isNumeric(values[i]) && values[i] >= 0);
    };

    var len;
    var isValid;
    var getId;

    if(hasIds) {
        len = Math.min(ids.length, parents.length);
        isValid = function(i) { return isValidKey(ids[i]) && isValidVal(i); };
        getId = function(i) { return String(ids[i]); };
    } else {
        len = Math.min(labels.length, parents.length);
        isValid = function(i) { return isValidKey(labels[i]) && isValidVal(i); };
        // TODO We could allow some label / parent duplication
        //
        // From AJ:
        //  It would work OK for one level
        //  (multiple rows with the same name and different parents -
        //  or even the same parent) but if that name is then used as a parent
        //  which one is it?
        getId = function(i) { return String(labels[i]); };
    }

    if(hasValues) len = Math.min(len, values.length);

    for(var i = 0; i < len; i++) {
        if(isValid(i)) {
            var id = getId(i);
            var pid = isValidKey(parents[i]) ? String(parents[i]) : '';

            var cdi = {
                i: i,
                id: id,
                pid: pid,
                label: isValidKey(labels[i]) ? String(labels[i]) : ''
            };

            if(hasValues) cdi.v = +values[i];
            cd.push(cdi);
            addToLookup(pid, id);
        }
    }

    if(!parent2children['']) {
        var impliedRoots = [];
        var k;
        for(k in parent2children) {
            if(!refs[k]) {
                impliedRoots.push(k);
            }
        }

        // if an `id` has no ref in the `parents` array,
        // take it as being the root node

        if(impliedRoots.length === 1) {
            k = impliedRoots[0];
            cd.unshift({
                hasImpliedRoot: true,
                id: k,
                pid: '',
                label: k
            });
        } else {
            return Lib.warn([
                'Multiple implied roots, cannot build', trace.type, 'hierarchy of', trace.name + '.',
                'These roots include:', impliedRoots.join(', ')
            ].join(' '));
        }
    } else if(parent2children[''].length > 1) {
        var dummyId = Lib.randstr();

        // if multiple rows linked to the root node,
        // add dummy "root of roots" node to make d3 build the hierarchy successfully

        for(var j = 0; j < cd.length; j++) {
            if(cd[j].pid === '') {
                cd[j].pid = dummyId;
            }
        }

        cd.unshift({
            hasMultipleRoots: true,
            id: dummyId,
            pid: '',
            label: ''
        });
    }

    // TODO might be better to replace stratify() with our own algorithm
    var root;
    try {
        root = d3Hierarchy.stratify()
            .id(function(d) { return d.id; })
            .parentId(function(d) { return d.pid; })(cd);
    } catch(e) {
        return Lib.warn([
            'Failed to build', trace.type, 'hierarchy of', trace.name + '.',
            'Error:', e.message
        ].join(' '));
    }

    var hierarchy = d3Hierarchy.hierarchy(root);
    var failed = false;

    if(hasValues) {
        switch(trace.branchvalues) {
            case 'remainder':
                hierarchy.sum(function(d) { return d.data.v; });
                break;
            case 'total':
                hierarchy.each(function(d) {
                    var cdi = d.data.data;
                    var v = cdi.v;

                    if(d.children) {
                        var partialSum = d.children.reduce(function(a, c) {
                            return a + c.data.data.v;
                        }, 0);

                        // N.B. we must fill in `value` for generated sectors
                        // with the partialSum to compute the correct partition
                        if(cdi.hasImpliedRoot || cdi.hasMultipleRoots) {
                            v = partialSum;
                        }

                        if(v < partialSum * ALMOST_EQUAL) {
                            failed = true;
                            return Lib.warn([
                                'Total value for node', d.data.data.id, 'of', trace.name,
                                'is smaller than the sum of its children.',
                                '\nparent value =', v,
                                '\nchildren sum =', partialSum
                            ].join(' '));
                        }
                    }

                    d.value = v;
                });
                break;
        }
    } else {
        countDescendants(hierarchy, trace, {
            branches: trace.count.indexOf('branches') !== -1,
            leaves: trace.count.indexOf('leaves') !== -1
        });
    }

    if(failed) return;

    // TODO add way to sort by height also?
    if(trace.sort) {
        hierarchy.sort(function(a, b) { return b.value - a.value; });
    }

    var pullColor;
    var scaleColor;
    var colors = trace.marker.colors || [];
    var hasColors = !!colors.length;

    if(trace._hasColorscale) {
        if(!hasColors) {
            colors = hasValues ? trace.values : trace._values;
        }

        colorscaleCalc(gd, trace, {
            vals: colors,
            containerStr: 'marker',
            cLetter: 'c'
        });

        scaleColor = makeColorScaleFn(trace.marker);
    } else {
        pullColor = makePullColorFn(fullLayout['_' + trace.type + 'colormap']);
    }

    // TODO keep track of 'root-children' (i.e. branch) for hover info etc.

    hierarchy.each(function(d) {
        var cdi = d.data.data;
        // N.B. this mutates items in `cd`
        cdi.color = trace._hasColorscale ?
            scaleColor(colors[cdi.i]) :
            pullColor(colors[cdi.i], cdi.id);
    });

    cd[0].hierarchy = hierarchy;

    return cd;
};

/*
 * `calc` filled in (and collated) explicit colors.
 * Now we need to propagate these explicit colors to other traces,
 * and fill in default colors.
 * This is done after sorting, so we pick defaults
 * in the order slices will be displayed
 */
exports._runCrossTraceCalc = function(desiredType, gd) {
    var fullLayout = gd._fullLayout;
    var calcdata = gd.calcdata;
    var colorWay = fullLayout[desiredType + 'colorway'];
    var colorMap = fullLayout['_' + desiredType + 'colormap'];

    if(fullLayout['extend' + desiredType + 'colors']) {
        colorWay = generateExtendedColors(colorWay,
            desiredType === 'treemap' ? treemapExtendedColorWays : sunburstExtendedColorWays
        );
    }
    var dfltColorCount = 0;

    var rootColor;
    function pickColor(d) {
        var cdi = d.data.data;
        var id = cdi.id;

        if(cdi.color === false) {
            if(colorMap[id]) {
                // have we seen this label and assigned a color to it in a previous trace?
                cdi.color = colorMap[id];
            } else if(d.parent) {
                if(d.parent.parent) {
                    // from third-level on, inherit from parent
                    cdi.color = d.parent.data.data.color;
                } else {
                    // pick new color for second level
                    colorMap[id] = cdi.color = colorWay[dfltColorCount % colorWay.length];
                    dfltColorCount++;
                }
            } else {
                // set root color. no coloring by default.
                cdi.color = rootColor;
            }
        }
    }

    for(var i = 0; i < calcdata.length; i++) {
        var cd = calcdata[i];
        var cd0 = cd[0];
        if(cd0.trace.type === desiredType && cd0.hierarchy) {
            rootColor = cd0.trace.root.color;
            cd0.hierarchy.each(pickColor);
        }
    }
};

exports.crossTraceCalc = function(gd) {
    return exports._runCrossTraceCalc('sunburst', gd);
};

function countDescendants(node, trace, opts) {
    var nChild = 0;

    var children = node.children;
    if(children) {
        var len = children.length;

        for(var i = 0; i < len; i++) {
            nChild += countDescendants(children[i], trace, opts);
        }

        if(opts.branches) nChild++; // count this branch
    } else {
        if(opts.leaves) nChild++; // count this leaf
    }

    // save to the node
    node.value = node.data.data.value = nChild;

    // save to the trace
    if(!trace._values) trace._values = [];
    trace._values[node.data.data.i] = nChild;

    return nChild;
}
