/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var m4FromQuat = require('gl-mat4/fromQuat');

var Registry = require('../registry');
var Lib = require('../lib');
var Plots = require('../plots/plots');
var Axes = require('../plots/cartesian/axes');
var Color = require('../components/color');


// Get the container div: we store all variables for this plot as
// properties of this div
// some callers send this in by DOM element, others by id (string)
exports.getGraphDiv = function(gd) {
    var gdElement;

    if(typeof gd === 'string') {
        gdElement = document.getElementById(gd);

        if(gdElement === null) {
            throw new Error('No DOM element with id \'' + gd + '\' exists on the page.');
        }

        return gdElement;
    }
    else if(gd === null || gd === undefined) {
        throw new Error('DOM element provided is null or undefined');
    }

    return gd;  // otherwise assume that gd is a DOM element
};

// clear the promise queue if one of them got rejected
exports.clearPromiseQueue = function(gd) {
    if(Array.isArray(gd._promises) && gd._promises.length > 0) {
        Lib.log('Clearing previous rejected promises from queue.');
    }

    gd._promises = [];
};

// make a few changes to the layout right away
// before it gets used for anything
// backward compatibility and cleanup of nonstandard options
exports.cleanLayout = function(layout) {
    var i, j;

    if(!layout) layout = {};

    // cannot have (x|y)axis1, numbering goes axis, axis2, axis3...
    if(layout.xaxis1) {
        if(!layout.xaxis) layout.xaxis = layout.xaxis1;
        delete layout.xaxis1;
    }
    if(layout.yaxis1) {
        if(!layout.yaxis) layout.yaxis = layout.yaxis1;
        delete layout.yaxis1;
    }

    var axList = Axes.list({_fullLayout: layout});
    for(i = 0; i < axList.length; i++) {
        var ax = axList[i];
        if(ax.anchor && ax.anchor !== 'free') {
            ax.anchor = Axes.cleanId(ax.anchor);
        }
        if(ax.overlaying) ax.overlaying = Axes.cleanId(ax.overlaying);

        // old method of axis type - isdate and islog (before category existed)
        if(!ax.type) {
            if(ax.isdate) ax.type = 'date';
            else if(ax.islog) ax.type = 'log';
            else if(ax.isdate === false && ax.islog === false) ax.type = 'linear';
        }
        if(ax.autorange === 'withzero' || ax.autorange === 'tozero') {
            ax.autorange = true;
            ax.rangemode = 'tozero';
        }
        delete ax.islog;
        delete ax.isdate;
        delete ax.categories; // replaced by _categories

        // prune empty domain arrays made before the new nestedProperty
        if(emptyContainer(ax, 'domain')) delete ax.domain;

        // autotick -> tickmode
        if(ax.autotick !== undefined) {
            if(ax.tickmode === undefined) {
                ax.tickmode = ax.autotick ? 'auto' : 'linear';
            }
            delete ax.autotick;
        }
    }

    var annotationsLen = Array.isArray(layout.annotations) ? layout.annotations.length : 0;
    for(i = 0; i < annotationsLen; i++) {
        var ann = layout.annotations[i];

        if(!Lib.isPlainObject(ann)) continue;

        if(ann.ref) {
            if(ann.ref === 'paper') {
                ann.xref = 'paper';
                ann.yref = 'paper';
            }
            else if(ann.ref === 'data') {
                ann.xref = 'x';
                ann.yref = 'y';
            }
            delete ann.ref;
        }

        cleanAxRef(ann, 'xref');
        cleanAxRef(ann, 'yref');
    }

    var shapesLen = Array.isArray(layout.shapes) ? layout.shapes.length : 0;
    for(i = 0; i < shapesLen; i++) {
        var shape = layout.shapes[i];

        if(!Lib.isPlainObject(shape)) continue;

        cleanAxRef(shape, 'xref');
        cleanAxRef(shape, 'yref');
    }

    var legend = layout.legend;
    if(legend) {
        // check for old-style legend positioning (x or y is +/- 100)
        if(legend.x > 3) {
            legend.x = 1.02;
            legend.xanchor = 'left';
        }
        else if(legend.x < -2) {
            legend.x = -0.02;
            legend.xanchor = 'right';
        }

        if(legend.y > 3) {
            legend.y = 1.02;
            legend.yanchor = 'bottom';
        }
        else if(legend.y < -2) {
            legend.y = -0.02;
            legend.yanchor = 'top';
        }
    }

    /*
     * Moved from rotate -> orbit for dragmode
     */
    if(layout.dragmode === 'rotate') layout.dragmode = 'orbit';

    // cannot have scene1, numbering goes scene, scene2, scene3...
    if(layout.scene1) {
        if(!layout.scene) layout.scene = layout.scene1;
        delete layout.scene1;
    }

    /*
     * Clean up Scene layouts
     */
    var sceneIds = Plots.getSubplotIds(layout, 'gl3d');
    for(i = 0; i < sceneIds.length; i++) {
        var scene = layout[sceneIds[i]];

        // clean old Camera coords
        var cameraposition = scene.cameraposition;
        if(Array.isArray(cameraposition) && cameraposition[0].length === 4) {
            var rotation = cameraposition[0],
                center = cameraposition[1],
                radius = cameraposition[2],
                mat = m4FromQuat([], rotation),
                eye = [];

            for(j = 0; j < 3; ++j) {
                eye[j] = center[i] + radius * mat[2 + 4 * j];
            }

            scene.camera = {
                eye: {x: eye[0], y: eye[1], z: eye[2]},
                center: {x: center[0], y: center[1], z: center[2]},
                up: {x: mat[1], y: mat[5], z: mat[9]}
            };

            delete scene.cameraposition;
        }
    }

    // sanitize rgb(fractions) and rgba(fractions) that old tinycolor
    // supported, but new tinycolor does not because they're not valid css
    Color.clean(layout);

    return layout;
};

function cleanAxRef(container, attr) {
    var valIn = container[attr],
        axLetter = attr.charAt(0);
    if(valIn && valIn !== 'paper') {
        container[attr] = Axes.cleanId(valIn, axLetter);
    }
}

// Make a few changes to the data right away
// before it gets used for anything
exports.cleanData = function(data, existingData) {
    // Enforce unique IDs
    var suids = [], // seen uids --- so we can weed out incoming repeats
        uids = data.concat(Array.isArray(existingData) ? existingData : [])
               .filter(function(trace) { return 'uid' in trace; })
               .map(function(trace) { return trace.uid; });

    for(var tracei = 0; tracei < data.length; tracei++) {
        var trace = data[tracei];
        var i;

        // assign uids to each trace and detect collisions.
        if(!('uid' in trace) || suids.indexOf(trace.uid) !== -1) {
            var newUid;

            for(i = 0; i < 100; i++) {
                newUid = Lib.randstr(uids);
                if(suids.indexOf(newUid) === -1) break;
            }
            trace.uid = Lib.randstr(uids);
            uids.push(trace.uid);
        }
        // keep track of already seen uids, so that if there are
        // doubles we force the trace with a repeat uid to
        // acquire a new one
        suids.push(trace.uid);

        // BACKWARD COMPATIBILITY FIXES

        // use xbins to bin data in x, and ybins to bin data in y
        if(trace.type === 'histogramy' && 'xbins' in trace && !('ybins' in trace)) {
            trace.ybins = trace.xbins;
            delete trace.xbins;
        }

        // error_y.opacity is obsolete - merge into color
        if(trace.error_y && 'opacity' in trace.error_y) {
            var dc = Color.defaults,
                yeColor = trace.error_y.color ||
                (Registry.traceIs(trace, 'bar') ? Color.defaultLine : dc[tracei % dc.length]);
            trace.error_y.color = Color.addOpacity(
                Color.rgb(yeColor),
                Color.opacity(yeColor) * trace.error_y.opacity);
            delete trace.error_y.opacity;
        }

        // convert bardir to orientation, and put the data into
        // the axes it's eventually going to be used with
        if('bardir' in trace) {
            if(trace.bardir === 'h' && (Registry.traceIs(trace, 'bar') ||
                     trace.type.substr(0, 9) === 'histogram')) {
                trace.orientation = 'h';
                exports.swapXYData(trace);
            }
            delete trace.bardir;
        }

        // now we have only one 1D histogram type, and whether
        // it uses x or y data depends on trace.orientation
        if(trace.type === 'histogramy') exports.swapXYData(trace);
        if(trace.type === 'histogramx' || trace.type === 'histogramy') {
            trace.type = 'histogram';
        }

        // scl->scale, reversescl->reversescale
        if('scl' in trace) {
            trace.colorscale = trace.scl;
            delete trace.scl;
        }
        if('reversescl' in trace) {
            trace.reversescale = trace.reversescl;
            delete trace.reversescl;
        }

        // axis ids x1 -> x, y1-> y
        if(trace.xaxis) trace.xaxis = Axes.cleanId(trace.xaxis, 'x');
        if(trace.yaxis) trace.yaxis = Axes.cleanId(trace.yaxis, 'y');

        // scene ids scene1 -> scene
        if(Registry.traceIs(trace, 'gl3d') && trace.scene) {
            trace.scene = Plots.subplotsRegistry.gl3d.cleanId(trace.scene);
        }

        if(!Registry.traceIs(trace, 'pie') && !Registry.traceIs(trace, 'bar')) {
            if(Array.isArray(trace.textposition)) {
                trace.textposition = trace.textposition.map(cleanTextPosition);
            }
            else if(trace.textposition) {
                trace.textposition = cleanTextPosition(trace.textposition);
            }
        }

        // fix typo in colorscale definition
        if(Registry.traceIs(trace, '2dMap')) {
            if(trace.colorscale === 'YIGnBu') trace.colorscale = 'YlGnBu';
            if(trace.colorscale === 'YIOrRd') trace.colorscale = 'YlOrRd';
        }
        if(Registry.traceIs(trace, 'markerColorscale') && trace.marker) {
            var cont = trace.marker;
            if(cont.colorscale === 'YIGnBu') cont.colorscale = 'YlGnBu';
            if(cont.colorscale === 'YIOrRd') cont.colorscale = 'YlOrRd';
        }

        // fix typo in surface 'highlight*' definitions
        if(trace.type === 'surface' && Lib.isPlainObject(trace.contours)) {
            var dims = ['x', 'y', 'z'];

            for(i = 0; i < dims.length; i++) {
                var opts = trace.contours[dims[i]];

                if(!Lib.isPlainObject(opts)) continue;

                if(opts.highlightColor) {
                    opts.highlightcolor = opts.highlightColor;
                    delete opts.highlightColor;
                }

                if(opts.highlightWidth) {
                    opts.highlightwidth = opts.highlightWidth;
                    delete opts.highlightWidth;
                }
            }
        }

        // transforms backward compatibility fixes
        if(Array.isArray(trace.transforms)) {
            var transforms = trace.transforms;

            for(i = 0; i < transforms.length; i++) {
                var transform = transforms[i];

                if(!Lib.isPlainObject(transform)) continue;

                switch(transform.type) {
                    case 'filter':
                        if(transform.filtersrc) {
                            transform.target = transform.filtersrc;
                            delete transform.filtersrc;
                        }

                        if(transform.calendar) {
                            if(!transform.valuecalendar) {
                                transform.valuecalendar = transform.calendar;
                            }
                            delete transform.calendar;
                        }
                        break;

                    case 'groupby':
                        // Name has changed from `style` to `styles`, so use `style` but prefer `styles`:
                        transform.styles = transform.styles || transform.style;

                        if(transform.styles && !Array.isArray(transform.styles)) {
                            var prevStyles = transform.styles;
                            var styleKeys = Object.keys(prevStyles);

                            transform.styles = [];
                            for(var j = 0; j < styleKeys.length; j++) {
                                transform.styles.push({
                                    target: styleKeys[j],
                                    value: prevStyles[styleKeys[j]]
                                });
                            }
                        }
                        break;
                }
            }
        }

        // prune empty containers made before the new nestedProperty
        if(emptyContainer(trace, 'line')) delete trace.line;
        if('marker' in trace) {
            if(emptyContainer(trace.marker, 'line')) delete trace.marker.line;
            if(emptyContainer(trace, 'marker')) delete trace.marker;
        }

        // sanitize rgb(fractions) and rgba(fractions) that old tinycolor
        // supported, but new tinycolor does not because they're not valid css
        Color.clean(trace);
    }
};

// textposition - support partial attributes (ie just 'top')
// and incorrect use of middle / center etc.
function cleanTextPosition(textposition) {
    var posY = 'middle',
        posX = 'center';
    if(textposition.indexOf('top') !== -1) posY = 'top';
    else if(textposition.indexOf('bottom') !== -1) posY = 'bottom';

    if(textposition.indexOf('left') !== -1) posX = 'left';
    else if(textposition.indexOf('right') !== -1) posX = 'right';

    return posY + ' ' + posX;
}

function emptyContainer(outer, innerStr) {
    return (innerStr in outer) &&
        (typeof outer[innerStr] === 'object') &&
        (Object.keys(outer[innerStr]).length === 0);
}


// swap all the data and data attributes associated with x and y
exports.swapXYData = function(trace) {
    var i;
    Lib.swapAttrs(trace, ['?', '?0', 'd?', '?bins', 'nbins?', 'autobin?', '?src', 'error_?']);
    if(Array.isArray(trace.z) && Array.isArray(trace.z[0])) {
        if(trace.transpose) delete trace.transpose;
        else trace.transpose = true;
    }
    if(trace.error_x && trace.error_y) {
        var errorY = trace.error_y,
            copyYstyle = ('copy_ystyle' in errorY) ? errorY.copy_ystyle :
                !(errorY.color || errorY.thickness || errorY.width);
        Lib.swapAttrs(trace, ['error_?.copy_ystyle']);
        if(copyYstyle) {
            Lib.swapAttrs(trace, ['error_?.color', 'error_?.thickness', 'error_?.width']);
        }
    }
    if(typeof trace.hoverinfo === 'string') {
        var hoverInfoParts = trace.hoverinfo.split('+');
        for(i = 0; i < hoverInfoParts.length; i++) {
            if(hoverInfoParts[i] === 'x') hoverInfoParts[i] = 'y';
            else if(hoverInfoParts[i] === 'y') hoverInfoParts[i] = 'x';
        }
        trace.hoverinfo = hoverInfoParts.join('+');
    }
};

// coerce traceIndices input to array of trace indices
exports.coerceTraceIndices = function(gd, traceIndices) {
    if(isNumeric(traceIndices)) {
        return [traceIndices];
    }
    else if(!Array.isArray(traceIndices) || !traceIndices.length) {
        return gd.data.map(function(_, i) { return i; });
    }

    return traceIndices;
};

/**
 * Manages logic around array container item creation / deletion / update
 * that nested property alone can't handle.
 *
 * @param {Object} np
 *  nested property of update attribute string about trace or layout object
 * @param {*} newVal
 *  update value passed to restyle / relayout / update
 * @param {Object} undoit
 *  undo hash (N.B. undoit may be mutated here).
 *
 */
exports.manageArrayContainers = function(np, newVal, undoit) {
    var obj = np.obj,
        parts = np.parts,
        pLength = parts.length,
        pLast = parts[pLength - 1];

    var pLastIsNumber = isNumeric(pLast);

    // delete item
    if(pLastIsNumber && newVal === null) {

        // Clear item in array container when new value is null
        var contPath = parts.slice(0, pLength - 1).join('.'),
            cont = Lib.nestedProperty(obj, contPath).get();
        cont.splice(pLast, 1);

        // Note that nested property clears null / undefined at end of
        // array container, but not within them.
    }
    // create item
    else if(pLastIsNumber && np.get() === undefined) {

        // When adding a new item, make sure undo command will remove it
        if(np.get() === undefined) undoit[np.astr] = null;

        np.set(newVal);
    }
    // update item
    else {

        // If the last part of attribute string isn't a number,
        // np.set is all we need.
        np.set(newVal);
    }
};

/*
 * Match the part to strip off to turn an attribute into its parent
 * really it should be either '.some_characters' or '[number]'
 * but we're a little more permissive here and match either
 * '.not_brackets_or_dot' or '[not_brackets_or_dot]'
 */
var ATTR_TAIL_RE = /(\.[^\[\]\.]+|\[[^\[\]\.]+\])$/;

function getParent(attr) {
    var tail = attr.search(ATTR_TAIL_RE);
    if(tail > 0) return attr.substr(0, tail);
}

/*
 * hasParent: does an attribute object contain a parent of the given attribute?
 * for example, given 'images[2].x' do we also have 'images' or 'images[2]'?
 *
 * @param {Object} aobj
 *  update object, whose keys are attribute strings and values are their new settings
 * @param {string} attr
 *  the attribute string to test against
 * @returns {Boolean}
 *  is a parent of attr present in aobj?
 */
exports.hasParent = function(aobj, attr) {
    var attrParent = getParent(attr);
    while(attrParent) {
        if(attrParent in aobj) return true;
        attrParent = getParent(attrParent);
    }
    return false;
};
