/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createLinePlot = require('gl-line3d');
var createScatterPlot = require('gl-scatter3d');
var createMesh = require('gl-mesh3d');

var Lib = require('../../lib');
var formatColor = require('../../lib/gl_format_color');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');

function LineWithMarkers(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.linePlot = null;
    this.scatterPlot = null;
    this.textMarkers = null;
    this.color = null;
    this.mode = '';
    this.textLabels = null;
    this.data = null;
}

var proto = LineWithMarkers.prototype;

proto.handlePick = function(selection) {
    if(selection.object &&
        (selection.object === this.linePlot ||
         selection.object === this.textMarkers ||
         selection.object === this.scatterPlot)) {
        if(selection.object.highlight) {
            selection.object.highlight(null);
        }
        if(this.scatterPlot) {
            selection.object = this.scatterPlot;
            this.scatterPlot.highlight(selection.data);
        }
        if(this.textLabels && this.textLabels[selection.data.index] !== undefined) {
            selection.textLabel = this.textLabels[selection.data.index];
        }
        else selection.textLabel = '';

        var selectIndex = selection.data.index;
        selection.traceCoordinate = [
            this.data.x[selectIndex],
            this.data.y[selectIndex],
            this.data.z[selectIndex]
        ];

        return true;
    }
};

function calculateTextOffset(tp, offsetValue) {
    //Read out text properties
    var textOffset = [0, 0];
    if(Array.isArray(tp)) return [0, -1];
    if(tp.indexOf('bottom') >= 0) textOffset[1] += offsetValue;
    if(tp.indexOf('top') >= 0) textOffset[1] -= offsetValue;
    if(tp.indexOf('left') >= 0) textOffset[0] -= offsetValue;
    if(tp.indexOf('right') >= 0) textOffset[0] += offsetValue;
    return textOffset;
}


function calculateSize(sizeIn, sizeFn) {
    // parity with scatter3d markers
    return sizeFn(sizeIn * 4);
}

function formatParam(paramIn, len, calculate, dflt, extraFn) {
    var paramOut = null;

    if(Array.isArray(paramIn)) {
        paramOut = [];

        for(var i = 0; i < len; i++) {
            if(paramIn[i] === undefined) paramOut[i] = dflt;
            else paramOut[i] = calculate(paramIn[i], extraFn);
        }

    }
    else paramOut = calculate(paramIn, Lib.identity);

    return paramOut;
}


function convertPlotlyOptions(scene, data) {
    var params, i,
        points = [],
        sceneLayout = scene.fullSceneLayout,
        scaleFactor = scene.dataScale,
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        marker = data.marker,
        line = data.line,
        xc, x = data.x || [],
        yc, y = data.y || [],
        zc, z = data.z || [],
        len = x.length,
        text;

    //Convert points
    for(i = 0; i < len; i++) {
        // sanitize numbers and apply transforms based on axes.type
        xc = xaxis.d2l(x[i]) * scaleFactor[0];
        yc = yaxis.d2l(y[i]) * scaleFactor[1];
        zc = zaxis.d2l(z[i]) * scaleFactor[2];

        points[i] = [xc, yc, zc];
    }

    // convert text
    if(Array.isArray(data.text)) text = data.text;
    else if(data.text !== undefined) {
        text = new Array(len);
        for(i = 0; i < len; i++) text[i] = data.text;
    }

    //Build object parameters
    params = {
        position: points,
        mode: data.mode,
        text: text
    };

    if('line' in data) {
        params.lineColor = formatColor(line, 1, len);
        params.lineWidth = line.width;
        params.connectionradius = line.connectionradius;
    }

    if('marker' in data) {
        var sizeFn = makeBubbleSizeFn(data);

        params.scatterColor = formatColor(marker, 1, len);
        params.scatterSize = formatParam(marker.size, len, calculateSize, 20, sizeFn);
        params.scatterAngle = 0;
    }

    if('textposition' in data) {
        params.textOffset = calculateTextOffset(data.textposition, 1.5 * Math.pow(scene.dataScale[0] * scene.dataScale[1] * scene.dataScale[2], 0.5) * Math.max.apply(Math, data.marker.size));  // arrayOk === false
        params.textColor = formatColor(data.textfont, 1, len);
        params.textSize = formatParam(data.textfont.size, len, Lib.identity, 12);
        params.textFont = data.textfont.family;  // arrayOk === false
        params.textAngle = 0;
    }

    var dims = ['x', 'y', 'z'];
    params.project = [false, false, false];
    params.projectScale = [1, 1, 1];
    params.projectOpacity = [1, 1, 1];
    for(i = 0; i < 3; ++i) {
        var projection = data.projection[dims[i]];
        if((params.project[i] = projection.show)) {
            params.projectOpacity[i] = projection.opacity;
            params.projectScale[i] = projection.scale;
        }
    }

    return params;
}

function arrayToColor(color) {
    if(Array.isArray(color)) {
        var c = color[0];

        if(Array.isArray(c)) color = c;

        return 'rgb(' + color.slice(0, 3).map(function(x) {
            return Math.round(x * 255);
        }) + ')';
    }

    return null;
}

proto.update = function(data) {
    var gl = this.scene.glplot.gl,
        lineOptions,
        scatterOptions,
        textOptions;

    //Save data
    this.data = data;

    //Run data conversion
    var options = convertPlotlyOptions(this.scene, data);

    if('mode' in options) {
        this.mode = options.mode;
    }

    this.color = arrayToColor(options.scatterColor) ||
                 arrayToColor(options.lineColor);

    lineOptions = {
        gl: gl,
        position: options.position,
        color: options.lineColor,
        lineWidth: options.lineWidth || 1,
        opacity: data.opacity,
        connectGaps: data.connectgaps
    };

    if(this.mode.indexOf('lines-FIXME') !== -1) {
        if(this.linePlot) this.linePlot.update(lineOptions);
        else {
            this.linePlot = createLinePlot(lineOptions);
            this.scene.glplot.add(this.linePlot);
        }
    } else if(this.linePlot) {
        this.scene.glplot.remove(this.linePlot);
        this.linePlot.dispose();
        this.linePlot = null;
    }

    // N.B. marker.opacity must be a scalar for performance
    var scatterOpacity = data.opacity;
    if(data.marker && data.marker.opacity) scatterOpacity *= data.marker.opacity;

    scatterOptions = {
        gl: gl,
        position: options.position,
        color: options.scatterColor,
        size: options.scatterSize,
        glyph: options.scatterMarker,
        opacity: scatterOpacity,
        orthographic: true,
        project: options.project,
        projectScale: options.projectScale,
        projectOpacity: options.projectOpacity
    };

    if(this.mode.indexOf('markers-FIXME') !== -1) {
        if(this.scatterPlot) this.scatterPlot.update(scatterOptions);
        else {
            this.scatterPlot = createScatterPlot(scatterOptions);
            this.scatterPlot.highlightScale = 1;
            this.scene.glplot.add(this.scatterPlot);
        }
    } else if(this.scatterPlot) {
        this.scene.glplot.remove(this.scatterPlot);
        this.scatterPlot.dispose();
        this.scatterPlot = null;
    }

    textOptions = {
        gl: gl,
        position: options.position,
        glyph: options.text,
        color: options.textColor,
        size: options.textSize,
        angle: options.textAngle,
        alignment: options.textOffset,
        font: options.textFont,
        orthographic: true,
        lineWidth: 0,
        project: false,
        opacity: data.opacity
    };

    this.textLabels = options.text;

    if(this.mode.indexOf('text') !== -1) {
        if(this.textMarkers) this.textMarkers.update(textOptions);
        else {
            this.textMarkers = createScatterPlot(textOptions);
            this.textMarkers.highlightScale = 1;
            this.scene.glplot.add(this.textMarkers);
        }
    } else if(this.textMarkers) {
        this.scene.glplot.remove(this.textMarkers);
        this.textMarkers.dispose();
        this.textMarkers = null;
    }

    var meshOptions = calculateMesh(this.data.x, this.data.y, this.data.z, options.connectionradius, options.lineColor, options.scatterSize, options.scatterColor, this.scene.dataScale);
    if(this.delaunayMesh) {
        this.delaunayMesh.update(meshOptions);
    } else {
        meshOptions.gl = gl;
        this.delaunayMesh = createMesh(meshOptions);
        this.scene.glplot.add(this.delaunayMesh);
    }

};

proto.dispose = function() {
    if(this.linePlot) {
        this.scene.glplot.remove(this.linePlot);
        this.linePlot.dispose();
    }
    if(this.scatterPlot) {
        this.scene.glplot.remove(this.scatterPlot);
        this.scatterPlot.dispose();
    }
    if(this.textMarkers) {
        this.scene.glplot.remove(this.textMarkers);
        this.textMarkers.dispose();
    }
};

function createLineWithMarkers(scene, data) {
    var plot = new LineWithMarkers(scene, data.uid);
    plot.update(data);
    return plot;
}

function calculateMesh(inputX, inputY, inputZ, inputW, inputC, inputMW, inputMC, scalingFactor) {

    function addVertex(X, Y, Z, x, y, z) {
        X.push(x);
        Y.push(y);
        Z.push(z);
    }

    function addFace(I, J, K, F, i, j, k, f) {
        I.push(i);
        J.push(j);
        K.push(k);
        F.push(f);
    }

    function catmullRom(x, y, z, r, R, G, B, Tratio) {

        var t0 = 0;
        var d, c1, c2;
        var alpha = 0.5;
        var pow = alpha / 2;
        var t1 = Math.pow(Math.pow(x[1] - x[0], 2) + Math.pow(y[1] - y[0], 2) + Math.pow(z[1] - z[0], 2), pow) + t0;
        var t2 = Math.pow(Math.pow(x[2] - x[1], 2) + Math.pow(y[2] - y[1], 2) + Math.pow(z[2] - z[1], 2), pow) + t1;
        var t3 = Math.pow(Math.pow(x[3] - x[2], 2) + Math.pow(y[3] - y[2], 2) + Math.pow(z[3] - z[2], 2), pow) + t2;

        var T = t1 + Tratio * (t2 - t1);

        d = t1 - t0;
        c1 = (t1 - T) / d;
        c2 = (T - t0) / d;
        var A1x = c1 * x[0] + c2 * x[1];
        var A1y = c1 * y[0] + c2 * y[1];
        var A1z = c1 * z[0] + c2 * z[1];
        var A1r = c1 * r[0] + c2 * r[1];
        var A1R = c1 * R[0] + c2 * R[1];
        var A1G = c1 * G[0] + c2 * G[1];
        var A1B = c1 * B[0] + c2 * B[1];

        d = t2 - t1;
        c1 = (t2 - T) / d;
        c2 = (T - t1) / d;
        var A2x = c1 * x[1] + c2 * x[2];
        var A2y = c1 * y[1] + c2 * y[2];
        var A2z = c1 * z[1] + c2 * z[2];
        var A2r = c1 * r[1] + c2 * r[2];
        var A2R = c1 * R[1] + c2 * R[2];
        var A2G = c1 * G[1] + c2 * G[2];
        var A2B = c1 * B[1] + c2 * B[2];

        d = t3 - t2;
        c1 = (t3 - T) / d;
        c2 = (T - t2) / d;
        var A3x = c1 * x[2] + c2 * x[3];
        var A3y = c1 * y[2] + c2 * y[3];
        var A3z = c1 * z[2] + c2 * z[3];
        var A3r = c1 * r[2] + c2 * r[3];
        var A3R = c1 * R[2] + c2 * R[3];
        var A3G = c1 * G[2] + c2 * G[3];
        var A3B = c1 * B[2] + c2 * B[3];

        d = t2 - t0;
        c1 = (t2 - T) / d;
        c2 = (T - t0) / d;
        var B1x = c1 * A1x + c2 * A2x;
        var B1y = c1 * A1y + c2 * A2y;
        var B1z = c1 * A1z + c2 * A2z;
        var B1r = c1 * A1r + c2 * A2r;
        var B1R = c1 * A1R + c2 * A2R;
        var B1G = c1 * A1G + c2 * A2G;
        var B1B = c1 * A1B + c2 * A2B;

        d = t3 - t1;
        c1 = (t3 - T) / d;
        c2 = (T - t1) / d;
        var B2x = c1 * A2x + c2 * A3x;
        var B2y = c1 * A2y + c2 * A3y;
        var B2z = c1 * A2z + c2 * A3z;
        var B2r = c1 * A2r + c2 * A3r;
        var B2R = c1 * A2R + c2 * A3R;
        var B2G = c1 * A2G + c2 * A3G;
        var B2B = c1 * A2B + c2 * A3B;

        d = t2 - t1;
        c1 = (t2 - T) / d;
        c2 = (T - t1) / d;
        var Cx = c1 * B1x + c2 * B2x;
        var Cy = c1 * B1y + c2 * B2y;
        var Cz = c1 * B1z + c2 * B2z;
        var Cr = c1 * B1r + c2 * B2r;
        var CR = c1 * B1R + c2 * B2R;
        var CG = c1 * B1G + c2 * B2G;
        var CB = c1 * B1B + c2 * B2B;

        return [Cx, Cy, Cz, Cr, CR, CG, CB];
    }

    var quadCount = 36;

    var sinVector = [];
    var cosVector = [];
    for(var q = 0; q < quadCount; q++) {
        var a = q * Math.PI * 2 / quadCount;
        sinVector.push(Math.sin(a));
        cosVector.push(Math.cos(a));
    }

    var lastGymbal = null;

    function cylinderMaker(r1, r2, x1, x2, y1, y2, z1, z2, f1, f2, continuable) {

        var uu = x2 - x1;
        var vv = y2 - y1;
        var ww = z2 - z1;

        var X = [];
        var Y = [];
        var Z = [];

        var I = [];
        var J = [];
        var K = [];
        var F = [];

        var av = addVertex.bind(null, X, Y, Z);
        var af = addFace.bind(null, I, J, K, F);

        var q, vert, sa, ca;

        var x, y, z, xx, yy, zz;

        var length = Math.sqrt(uu * uu + vv * vv + ww * ww);

        var u = uu / length;
        var v = vv / length;
        var w = ww / length;

        // Gymbaling (switch to quaternion based solution when time permits)
        var sameGymbal;
        var epsilon = 1e-9;
        if(Math.abs(w) > epsilon) {
            x = -1; y = -1; z = (u + v) / w;
            sameGymbal = lastGymbal === 1;
            lastGymbal = 1;
        } else if(Math.abs(v) > epsilon) {
            x = -1; y = (u + w) / v; z = -1;
            sameGymbal = lastGymbal === 2;
            lastGymbal = 2;
        } else if(Math.abs(u) > epsilon) {
            x = (v + w) / u; y = -1; z = -1;
            sameGymbal = lastGymbal === 3;
            lastGymbal = 3;
        } else {
            x = 1; y = 0; z = 0;
            sameGymbal = lastGymbal === 3;
            lastGymbal = 3;
        }
        var cont = continuable && sameGymbal;

        var xxb, yyb, zzb, xxc, yyc, zzc, xxs, yys, zzs;

        length = Math.sqrt(x * x + y * y + z * z) / r1;
        x /= length;
        y /= length;
        z /= length;

        xxb = u * (u * x + v * y + w * z);
        yyb = v * (u * x + v * y + w * z);
        zzb = w * (u * x + v * y + w * z);

        xxc = x * (v * v + w * w) - u * (v * y + w * z);
        yyc = y * (u * u + w * w) - v * (u * x + w * z);
        zzc = z * (u * u + v * v) - w * (u * x + v * y);

        xxs = v * z - w * y;
        yys = w * x - u * z;
        zzs = u * y - v * x;

        var o = cont ? -quadCount : 0; // offset for possible welding (cont == true)

        if(!cont)
            for(q = 0; q < quadCount; q++) {

                sa = sinVector[q];
                ca = cosVector[q];

                xx = xxb + xxc * ca + xxs * sa;
                yy = yyb + yyc * ca + yys * sa;
                zz = zzb + zzc * ca + zzs * sa;

                av(xx + x1, yy + y1, zz + z1); // with translation
            }

        length = Math.sqrt(x * x + y * y + z * z) / r2; // renormalize it for the other circle
        x /= length;
        y /= length;
        z /= length;

        xxb = u * (u * x + v * y + w * z);
        yyb = v * (u * x + v * y + w * z);
        zzb = w * (u * x + v * y + w * z);

        xxc = x * (v * v + w * w) - u * (v * y + w * z);
        yyc = y * (u * u + w * w) - v * (u * x + w * z);
        zzc = z * (u * u + v * v) - w * (u * x + v * y);

        xxs = v * z - w * y;
        yys = w * x - u * z;
        zzs = u * y - v * x;

        for(q = 0; q < quadCount; q++) {

            sa = sinVector[q];
            ca = cosVector[q];

            xx = xxb + xxc * ca + xxs * sa;
            yy = yyb + yyc * ca + yys * sa;
            zz = zzb + zzc * ca + zzs * sa;

            av(xx + uu + x1, yy + vv + y1, zz + ww + z1); // with translation
        }

        for(q = 0; q < quadCount; q++) {

            vert = q;

            af(vert + o, vert + quadCount + o, (vert + 1) % quadCount + o, f1);
            af((vert + 1) % quadCount + o, vert + quadCount + o, (vert + 1) % quadCount + quadCount + o, f2);
        }

        var model = {
            x: X,
            y: Y,
            z: Z,
            i: I,
            j: J,
            k: K,
            f: F
        };

        return model;
    }

    function unitIcosahedron() {

        var X = [];
        var Y = [];
        var Z = [];

        var I = [];
        var J = [];
        var K = [];
        var F = [];

        var s = Math.sqrt((5 - Math.sqrt(5)) / 10);
        var t = Math.sqrt((5 + Math.sqrt(5)) / 10);

        var av = addVertex.bind(null, X, Y, Z);
        var af = addFace.bind(null, I, J, K, F);

        av(-s, t, 0);
        av(s, t, 0);
        av(-s, -t, 0);
        av(s, -t, 0);

        av(0, -s, t);
        av(0, s, t);
        av(0, -s, -t);
        av(0, s, -t);

        av(t, 0, -s);
        av(t, 0, s);
        av(-t, 0, -s);
        av(-t, 0, s);

        af(0, 5, 11);
        af(0, 1, 5);
        af(0, 7, 1);
        af(0, 10, 7);
        af(0, 11, 10);

        af(1, 9, 5);
        af(5, 4, 11);
        af(11, 2, 10);
        af(10, 6, 7);
        af(7, 8, 1);

        af(3, 4, 9);
        af(3, 2, 4);
        af(3, 6, 2);
        af(3, 8, 6);
        af(3, 9, 8);

        af(4, 5, 9);
        af(2, 11, 4);
        af(6, 10, 2);
        af(8, 7, 6);
        af(9, 1, 8);

        var model = {
            x: X,
            y: Y,
            z: Z,
            i: I,
            j: J,
            k: K,
            f: F
        };

        return model;
    }

    function increaseLoD(m) {

        var I = [];
        var J = [];
        var K = [];
        var F = [];

        var p;

        var mx = m.x.slice();
        var my = m.y.slice();
        var mz = m.z.slice();
        var mi = m.i;
        var mj = m.j;
        var mk = m.k;
        var mf = m.f;

        var midx1, midy1, midz1, midx2, midy2, midz2, midx3, midy3, midz3, v1, v2, v3, midi1, midi2, midi3, k, length;

        var vCache = {};

        for(p = 0; p < mi.length; p++) {

            v1 = mi[p];
            v2 = mj[p];
            v3 = mk[p];

            k = [v1, v2];
            if(vCache[k.join()]) {
                midi1 = vCache[k.join()];
            } else {
                midx1 = (mx[v1] + mx[v2]) / 2;
                midy1 = (my[v1] + my[v2]) / 2;
                midz1 = (mz[v1] + mz[v2]) / 2;
                length = Math.sqrt(midx1 * midx1 + midy1 * midy1 + midz1 * midz1);
                mx.push(midx1 / length);
                my.push(midy1 / length);
                mz.push(midz1 / length);
                midi1 = mx.length - 1; // vertex index to the newly created midpoint
                vCache[k.join()] = midi1;
            }

            k = [v2, v3];
            if(vCache[k.join()]) {
                midi2 = vCache[k.join()];
            } else {
                midx2 = (mx[v2] + mx[v3]) / 2;
                midy2 = (my[v2] + my[v3]) / 2;
                midz2 = (mz[v2] + mz[v3]) / 2;
                length = Math.sqrt(midx2 * midx2 + midy2 * midy2 + midz2 * midz2);
                mx.push(midx2 / length);
                my.push(midy2 / length);
                mz.push(midz2 / length);
                midi2 = mx.length - 1; // vertex index to the newly created midpoint
                vCache[k.join()] = midi2;
            }

            k = [v3, v1];
            if(vCache[k.join()]) {
                midi2 = vCache[k.join()];
            } else {
                midx3 = (mx[v3] + mx[v1]) / 2;
                midy3 = (my[v3] + my[v1]) / 2;
                midz3 = (mz[v3] + mz[v1]) / 2;
                length = Math.sqrt(midx3 * midx3 + midy3 * midy3 + midz3 * midz3);
                mx.push(midx3 / length);
                my.push(midy3 / length);
                mz.push(midz3 / length);
                midi3 = mx.length - 1; // vertex index to the newly created midpoint
                vCache[k.join()] = midi3;
            }

            I.push(mi[p]);
            J.push(midi1);
            K.push(midi3);
            F.push(mf[p]);

            I.push(mj[p]);
            J.push(midi2);
            K.push(midi1);
            F.push(mf[p]);

            I.push(mk[p]);
            J.push(midi3);
            K.push(midi2);
            F.push(mf[p]);

            I.push(midi1);
            J.push(midi2);
            K.push(midi3);
            F.push(mf[p]);
        }

        var model = {
            x: mx,
            y: my,
            z: mz,
            i: I,
            j: J,
            k: K,
            f: F
        };

        return model;
    }

    var unitSphere = increaseLoD(increaseLoD(increaseLoD(increaseLoD(unitIcosahedron()))));

    function addPointMarker(geom, x, y, z, f, r, vOffset, X, Y, Z, I, J, K, F) {

        var v, p;

        var mx = geom.x;
        var my = geom.y;
        var mz = geom.z;
        var mi = geom.i;
        var mj = geom.j;
        var mk = geom.k;

        for(v = 0; v < mx.length; v++) {
            X.push(x + mx[v] * r);
            Y.push(y + my[v] * r);
            Z.push(z + mz[v] * r);
        }

        for(p = 0; p < mi.length; p++) {
            I.push(vOffset + mi[p]);
            J.push(vOffset + mj[p]);
            K.push(vOffset + mk[p]);
            F.push(f);
        }

        return vOffset + mx.length;
    }

    function addLine(geom, vOffset, X, Y, Z, I, J, K, F) {

        var v, p;

        var mx = geom.x;
        var my = geom.y;
        var mz = geom.z;
        var mi = geom.i;
        var mj = geom.j;
        var mk = geom.k;
        var mf = geom.f;

        for(v = 0; v < mx.length; v++) {

            X.push(mx[v]);
            Y.push(my[v]);
            Z.push(mz[v]);
        }

        for(p = 0; p < mi.length; p++) {
            I.push(vOffset + mi[p]);
            J.push(vOffset + mj[p]);
            K.push(vOffset + mk[p]);
            F.push(mf[p]);
        }

        return vOffset + mx.length;
    }

    var x, y, z;

    var index = 0;

    var n, r, r2, c, c1, c2;

    var scaler = 0.01; // fixme figure out something for sensibly calculating dimensions

    var p = {
        x: inputX,
        y: inputY,
        z: inputZ,
        r: Array.isArray(inputW) ? inputW : inputX.map(function() {return inputW;}),
        c: inputC
    };

    var rp = {
        x: [],
        y: [],
        z: [],
        r: [],
        c: []
    };

    var upsamplingFactor = 100; // convert every original point to as many upsampled points
    var n0, n1, n2, n3;
    for(n = 0; n < p.x.length - 1; n++) {

        for(var m = 0; m < upsamplingFactor; m++) {

            c1 = m / upsamplingFactor;
            c2 = (upsamplingFactor - m) / upsamplingFactor;

            n0 = (n - 1 + p.x.length) % p.x.length;
            n1 = n;
            n2 = (n + 1) % p.x.length;
            n3 = (n + 2) % p.x.length;

            var xyzrf = catmullRom(
                [p.x[n0], p.x[n1], p.x[n2], p.x[n3]],
                [p.y[n0], p.y[n1], p.y[n2], p.y[n3]],
                [p.z[n0], p.z[n1], p.z[n2], p.z[n3]],
                [p.r[n0], p.r[n1], p.r[n2], p.r[n3]],
                [p.c[n0][0], p.c[n1][0], p.c[n2][0], p.c[n3][0]],
                [p.c[n0][1], p.c[n1][1], p.c[n2][1], p.c[n3][1]],
                [p.c[n0][2], p.c[n1][2], p.c[n2][2], p.c[n3][2]],
                c1);

            rp.x.push(xyzrf[0]);
            rp.y.push(xyzrf[1]);
            rp.z.push(xyzrf[2]);
            rp.r.push(xyzrf[3]);
            rp.c.push([xyzrf[4], xyzrf[5], xyzrf[6], 1]); // fixme transfer opacity too
        }
    }

    var cylinderModels = [];

    for(n = 0; n < rp.x.length - 1; n++) {

        var point1 = n;
        var point2 = n + 1;

        x = rp.x[point1];
        y = rp.y[point1];
        z = rp.z[point1];
        r = rp.r[point1];
        c = rp.c[point1];

        var x2 = rp.x[point2];
        var y2 = rp.y[point2];
        var z2 = rp.z[point2];
        r2 = rp.r[point2];
        c2 = rp.c[point2];

        cylinderModels.push(cylinderMaker(r, r2, x, x2, y, y2, z, z2, c, c2, n > 0));
    }

    var X = [];
    var Y = [];
    var Z = [];
    var I = [];
    var J = [];
    var K = [];
    var F = [];

    for(n = 0; n < rp.x.length - 1; n++) {
        index = addLine(cylinderModels[n], index, X, Y, Z, I, J, K, F);
    }

    for(n = 0; n < p.x.length; n++) {
        index = addPointMarker(unitSphere, p.x[n], p.y[n], p.z[n], inputMC[n], scaler / 2 * (Array.isArray(inputMW) ? inputMW[n] : inputMW), index, X, Y, Z, I, J, K, F);
    }

    return {
        positions: X.map(function(d, i) {return [
            X[i] * scalingFactor[0],
            Y[i] * scalingFactor[1],
            Z[i] * scalingFactor[2]
        ];}),
        cells: I.map(function(d, i) {return [I[i], J[i], K[i]];}),
        cellColors: F,
 //       meshColor: [0.12156862745098039,0.4666666666666667,0.9058823529411765,1],
        opacity: 1,
        lightPosition: [1e6 * scalingFactor[0], 1e6 * scalingFactor[1], 1e6 * scalingFactor[2]],
        ambient: 0.2,
        diffuse: 1,
        specular: 0.3,
        roughness: 0.2,
        fresnel: 0,
        vertexNormalsEpsilon: 0,
        contourEnable: true, // fixme check what it is; doesn't seem to matter
        contourCount: 100, // fixme check what it is; doesn't seem to matter
        contourLineWidth: 10, // fixme check what it is; doesn't seem to matter
        contourColor: [1, 0, 0] // fixme check what it is; doesn't seem to matter
    };
}

module.exports = createLineWithMarkers;
