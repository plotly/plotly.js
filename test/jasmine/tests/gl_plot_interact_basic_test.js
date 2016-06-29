'use strict';

var Plotly = require('@lib/index');
var mouseEvent = require('../assets/mouse_event');

// Test utilities
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

// Expected shape of projection-related data
var cameraStructure = {
    up: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
    center: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)},
    eye: {x: jasmine.any(Number), y: jasmine.any(Number), z: jasmine.any(Number)}
};

function makePlot(gd, mock) {
    return Plotly.plot(gd, mock.data, mock.layout);
}

function addEventCallback(graphDiv) {
    var relayoutCallback = jasmine.createSpy('relayoutCallback');
    graphDiv.on('plotly_relayout', relayoutCallback);
    return {graphDiv: graphDiv, relayoutCallback: relayoutCallback};
}

function verifyInteractionEffects(tuple) {

    // One 'drag': simulating fairly thoroughly as the mouseup event is also needed here
    mouseEvent('mousemove', 400, 200);
    mouseEvent('mousedown', 400, 200);
    mouseEvent('mousemove', 320, 320, {buttons: 1});
    mouseEvent('mouseup', 320, 320);

    // Check event emission count
    expect(tuple.relayoutCallback).toHaveBeenCalledTimes(1);

    // Check structure of event callback value contents
    expect(tuple.relayoutCallback).toHaveBeenCalledWith(jasmine.objectContaining({scene: cameraStructure}));

    // Check camera contents on the DIV layout
    var divCamera = tuple.graphDiv.layout.scene.camera;

    expect(divCamera).toEqual(cameraStructure);

    return tuple.graphDiv;
}

function testEvents(plot) {
    return plot
        .then(function(graphDiv) {
            var tuple = addEventCallback(graphDiv); // TODO disuse tuple with ES6
            verifyInteractionEffects(tuple);
        });
}

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

function catmullRom(x, y, z, r, f, Tratio) {

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
    var A1x = c1*x[0] + c2*x[1];
    var A1y = c1*y[0] + c2*y[1];
    var A1z = c1*z[0] + c2*z[1];
    var A1r = c1*r[0] + c2*r[1];
    var A1f = c1*f[0] + c2*f[1];

    d = t2 - t1;
    c1 = (t2 - T) / d;
    c2 = (T - t1) / d;
    var A2x = c1*x[1] + c2*x[2];
    var A2y = c1*y[1] + c2*y[2];
    var A2z = c1*z[1] + c2*z[2];
    var A2r = c1*r[1] + c2*r[2];
    var A2f = c1*f[1] + c2*f[2];

    d = t3 - t2;
    c1 = (t3 - T) / d;
    c2 = (T - t2) / d;
    var A3x = c1*x[2] + c2*x[3];
    var A3y = c1*y[2] + c2*y[3];
    var A3z = c1*z[2] + c2*z[3];
    var A3r = c1*r[2] + c2*r[3];
    var A3f = c1*f[2] + c2*f[3];

    d = t2 - t0;
    c1 = (t2 - T) / d;
    c2 = (T - t0) / d;
    var B1x = c1*A1x + c2*A2x;
    var B1y = c1*A1y + c2*A2y;
    var B1z = c1*A1z + c2*A2z;
    var B1r = c1*A1r + c2*A2r;
    var B1f = c1*A1f + c2*A2f;

    d = t3 - t1;
    c1 = (t3 - T) / d;
    c2 = (T - t1) / d;
    var B2x = c1*A2x + c2*A3x;
    var B2y = c1*A2y + c2*A3y;
    var B2z = c1*A2z + c2*A3z;
    var B2r = c1*A2r + c2*A3r;
    var B2f = c1*A2f + c2*A3f;

    d = t2 - t1;
    c1 = (t2 - T) / d;
    c2 = (T - t1) / d;
    var Cx = c1*B1x + c2*B2x;
    var Cy = c1*B1y + c2*B2y;
    var Cz = c1*B1z + c2*B2z;
    var Cr = c1*B1r + c2*B2r;
    var Cf = c1*B1f + c2*B2f;

    return [Cx, Cy, Cz, Cr, Cf];
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

    xxb = u*(u*x+v*y+w*z);
    yyb = v*(u*x+v*y+w*z);
    zzb = w*(u*x+v*y+w*z);

    xxc = x*(v*v+w*w)-u*(v*y+w*z);
    yyc = y*(u*u+w*w)-v*(u*x+w*z);
    zzc = z*(u*u+v*v)-w*(u*x+v*y);

    xxs = v*z-w*y;
    yys = w*x-u*z;
    zzs = u*y-v*x;

    var o = cont ? -quadCount : 0; // offset for possible welding (cont == true)

    if(!cont)
        for(q = 0; q < quadCount; q++) {

            sa = sinVector[q];
            ca = cosVector[q];

            xx = xxb+xxc*ca+xxs*sa;
            yy = yyb+yyc*ca+yys*sa;
            zz = zzb+zzc*ca+zzs*sa;

            av(xx + x1, yy + y1, zz + z1); // with translation
        }

    length = Math.sqrt(x * x + y * y + z * z) / r2; // renormalize it for the other circle
    x /= length;
    y /= length;
    z /= length;

    xxb = u*(u*x+v*y+w*z);
    yyb = v*(u*x+v*y+w*z);
    zzb = w*(u*x+v*y+w*z);

    xxc = x*(v*v+w*w)-u*(v*y+w*z);
    yyc = y*(u*u+w*w)-v*(u*x+w*z);
    zzc = z*(u*u+v*v)-w*(u*x+v*y);

    xxs = v*z-w*y;
    yys = w*x-u*z;
    zzs = u*y-v*x;

    for(q = 0; q < quadCount; q++) {

        sa = sinVector[q];
        ca = cosVector[q];

        xx = xxb+xxc*ca+xxs*sa;
        yy = yyb+yyc*ca+yys*sa;
        zz = zzb+zzc*ca+zzs*sa;

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

    av(-s,  t,  0);
    av( s,  t,  0);
    av(-s, -t,  0);
    av( s, -t,  0);

    av( 0, -s,  t);
    av( 0,  s,  t);
    av( 0, -s, -t);
    av( 0,  s, -t);

    av( t,  0, -s);
    av( t,  0,  s);
    av(-t,  0, -s);
    av(-t,  0,  s);

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

function colorer(d) {
    return [Math.round(255 * d), 0, Math.round(255 * (1 - d))];
}

function makeCircularSampleModel() {

    var pointCount = 10;
    var n;

    var p = {
        x: [],
        y: [],
        z: [],
        r: [],
        c: []
    }

    for (n = 0; n < pointCount; n++) {

        p.x.push(Math.cos(10 * n / pointCount) * 100);
        p.y.push(Math.sin(10 * n / pointCount) * 100);
        p.z.push(1000 * n / pointCount * 0.2 - 100);
        p.r.push(5 + 2 * Math.sin(1000 * n / pointCount / 20));
        p.c.push(0.5 + Math.sin(n * 2) / 2);
    }

    return p;
}

describe('gl3d plots', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {return
        Plotly.purge(gd);
        destroyGraphDiv();
    });


    fit('streamtubes', function(done) {

        //var mock = require('@mocks/gl3d_errorbars_sqrt.json')
        //var mock = require('@mocks/gl3d_scatter3d-with-delaunay.json')
         var mock = require('@mocks/gl3d_streamtubes_basic.json')
        //var mock = require('@mocks/gl3d_projection-traces.json')


        var data = mock.data
        var s = data[0]

        var layout = mock.layout

        window.gd = gd
        window.data = data
        window.s = s
        window.Plotly = Plotly

        Plotly.plot(gd, data, layout)
            .then(done);
    });

    it('should respond to drag interactions with mock of partially set camera', function(done) {

        var mock = require('@mocks/gl3d_moonshot.json')

        var data = mock.data
        var s = data[0]

        var layout = mock.layout

        var x, y, z;

        var index = 0;

        var n, r, r2, c, c1, c2;

        var p = makeCircularSampleModel();

        var rp = {
            x: [],
            y: [],
            z: [],
            r: [],
            c: []
        };

        var upsamplingFactor = 100; // convert every original point to as many upsampled points
        for(n = 0; n < p.x.length - 3; n++) {

            for(var m = 0; m < upsamplingFactor; m++) {

                c1 = m / upsamplingFactor;
                c2 = (upsamplingFactor - m) / upsamplingFactor;

                var xyzrf = catmullRom(
                    [p.x[n], p.x[n + 1], p.x[n + 2], p.x[n + 3]],
                    [p.y[n], p.y[n + 1], p.y[n + 2], p.y[n + 3]],
                    [p.z[n], p.z[n + 1], p.z[n + 2], p.z[n + 3]],
                    [p.r[n], p.r[n + 1], p.r[n + 2], p.r[n + 3]],
                    [p.c[n], p.c[n + 1], p.c[n + 2], p.c[n + 3]],
                    c1);

                rp.x.push(xyzrf[0]);
                rp.y.push(xyzrf[1]);
                rp.z.push(xyzrf[2]);
                rp.r.push(xyzrf[3]);
                rp.c.push(colorer(xyzrf[4]));
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
            c = 'rgb(' + rp.c[point1].join() + ')';

            var x2 = rp.x[point2];
            var y2 = rp.y[point2];
            var z2 = rp.z[point2];
            r2 = rp.r[point2];
            c2 = 'rgb(' + rp.c[point2].join() + ')';

            cylinderModels.push(cylinderMaker(r, r2, x, x2, y, y2, z, z2, c, c2, n > 0));
        }

        var X = []
        var Y = []
        var Z = []
        var I = []
        var J = []
        var K = []
        var F = []

        for(n = 0; n < rp.x.length - 1; n++) {
            index = addLine(cylinderModels[n], index, X, Y, Z, I, J, K, F);
        }

        for(n = 0; n < p.x.length; n++) {
            index = addPointMarker(unitSphere, p.x[n], p.y[n], p.z[n], 'rgb(64,64,255)', 10, index, X, Y, Z, I, J, K, F);
        }


        // Extend the place to ensure correct aspect ratio
        X.push(-100)
        X.push(100)
        Y.push(-100)
        Y.push(100)
        Z.push(-100)
        Z.push(100)

        s.x = X;
        s.y = Y;
        s.z = Z;
        s.i = I;
        s.j = J;
        s.k = K;
        s.facecolor = F;

        window.gd = gd
        window.data = data
        window.s = s
        window.Plotly = Plotly

        Plotly.plot(gd, data, layout)
            .then(done);
    });

});
