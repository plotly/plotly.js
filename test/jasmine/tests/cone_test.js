var Plotly = require('@lib');
var Lib = require('@src/lib');

var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test cone defaults', function() {
    var gd;

    function makeGD() {
        return {
            data: [{
                type: 'cone',
                x: [1, 2],
                y: [1, 2],
                z: [1, 2],
                u: [1, 2],
                v: [1, 2],
                w: [1, 2]
            }],
            layout: {}
        };
    }

    it('should not set `visible: false` for traces with x,y,z,u,v,w arrays', function() {
        gd = makeGD();
        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(true);
    });

    it('should set `visible: false` for traces missing x,y,z,u,v,w arrays', function() {
        var keysToDelete = ['x', 'y', 'z', 'u', 'v', 'w'];

        keysToDelete.forEach(function(k) {
            gd = makeGD();
            delete gd.data[0][k];

            supplyAllDefaults(gd);
            expect(gd._fullData[0].visible).toBe(!k, 'missing array ' + k);
        });
    });

    it('should set `visible: false` for traces empty x,y,z,u,v,w arrays', function() {
        var keysToEmpty = ['x', 'y', 'z', 'u', 'v', 'w'];

        keysToEmpty.forEach(function(k) {
            gd = makeGD();
            gd.data[0][k] = [];

            supplyAllDefaults(gd);
            expect(gd._fullData[0].visible).toBe(!k, 'empty array ' + k);
        });
    });
});

describe('Test cone autorange:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function _assertAxisRanges(msg, xrng, yrng, zrng) {
        var sceneLayout = gd._fullLayout.scene;
        expect(sceneLayout.xaxis.range).toBeCloseToArray(xrng, 2, 'xaxis range - ' + msg);
        expect(sceneLayout.yaxis.range).toBeCloseToArray(yrng, 2, 'yaxis range - ' + msg);
        expect(sceneLayout.zaxis.range).toBeCloseToArray(zrng, 2, 'zaxis range - ' + msg);
    }

    it('@gl should add pad around cone position to make sure they fit on the scene', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_cone-autorange.json'));
        var rng0 = [0.103, 3.897];

        function makeScaleFn(s) {
            return function(v) { return v * s; };
        }

        Plotly.plot(gd, fig).then(function() {
            _assertAxisRanges('base', rng0, rng0, rng0);

            // the resulting image should be independent of what I multiply by here
            var trace = fig.data[0];
            var m = makeScaleFn(10);
            var u = trace.u.map(m);
            var v = trace.v.map(m);
            var w = trace.w.map(m);

            return Plotly.restyle(gd, {u: [u], v: [v], w: [w]});
        })
        .then(function() {
            _assertAxisRanges('scaled up', rng0, rng0, rng0);

            // the resulting image should be independent of what I multiply by here
            var trace = fig.data[0];
            var m = makeScaleFn(0.2);
            var u = trace.u.map(m);
            var v = trace.v.map(m);
            var w = trace.w.map(m);

            return Plotly.restyle(gd, {u: [u], v: [v], w: [w]});
        })
        .then(function() {
            _assertAxisRanges('scaled down', rng0, rng0, rng0);

            var trace = fig.data[0];
            var x = trace.x.slice();
            x.push(5);
            var y = trace.y.slice();
            y.push(5);
            var z = trace.z.slice();
            z.push(5);
            var u = trace.u.slice();
            u.push(0);
            var v = trace.v.slice();
            v.push(0);
            var w = trace.w.slice();
            w.push(0);

            return Plotly.restyle(gd, {
                x: [x], y: [y], z: [z],
                u: [u], v: [v], w: [w]
            });
        })
        .then(function() {
            var rng = [0.041, 5.959];
            _assertAxisRanges('after adding one cone outside range but with norm-0', rng, rng, rng);

            return Plotly.restyle(gd, 'sizeref', 10);
        })
        .then(function() {
            var rng = [-15.808, 21.808];
            _assertAxisRanges('after increasing sizeref', rng, rng, rng);

            return Plotly.restyle(gd, 'sizeref', 0.1);
        })
        .then(function() {
            var rng = [0.708, 5.292];
            _assertAxisRanges('after decreasing sizeref', rng, rng, rng);

            return Plotly.restyle(gd, {
                sizemode: 'absolute',
                sizeref: 2
            });
        })
        .then(function() {
            var rng = [0.614, 5.386];
            _assertAxisRanges('with sizemode absolute', rng, rng, rng);

            var trace = fig.data[0];
            var m = makeScaleFn(2);
            var x = trace.x.map(m);
            var y = trace.y.map(m);
            var z = trace.z.map(m);

            return Plotly.restyle(gd, {
                x: [x], y: [y], z: [z]
            });
        })
        .then(function() {
            var rng = [1.229, 10.771];
            _assertAxisRanges('after spacing out the x/y/z coordinates', rng, rng, rng);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test cone interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should add/clear gl objects correctly', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_cone-simple.json'));
        // put traces on same subplot
        delete fig.data[1].scene;

        Plotly.plot(gd, fig).then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(2);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(1);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout.scene;

            expect(scene).toBeUndefined();
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should not pass zero or infinite `coneSize` to gl-cone3d', function(done) {
        var base = {
            type: 'cone',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 3],
            u: [1, 0, 0],
            v: [0, 1, 0],
            w: [0, 0, 1]
        };

        Plotly.newPlot(gd, [
            Lib.extendDeep({}, base),
            Lib.extendDeep({}, base, {
                sizemode: 'absolute'
            }),
            Lib.extendDeep({}, base, {
                sizemode: 'absolute',
                u: [0, 0, 0],
                v: [0, 0, 0],
                w: [0, 0, 0]
            }),
        ])
        .then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs[0].coneScale).toBe(0.5, 'base case');
            expect(objs[1].coneScale).toBe(0.5, 'absolute case');
            expect(objs[2].coneScale).toBe(0.5, 'absolute + 0-norm case');
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should display hover labels', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_cone-simple.json'));
        // only one trace on one scene
        fig.data = [fig.data[0]];
        fig.data[0].showscale = false;
        delete fig.layout.scene.domain;
        fig.layout.margin = {l: 0, t: 0, r: 0, b: 0};
        fig.layout.width = 400;
        fig.layout.height = 400;

        function _hover() {
            mouseEvent('mouseover', 200, 200);
            return delay(20)();
        }

        Plotly.plot(gd, fig)
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                nums: ['x: 2', 'y: 2', 'z: 2', 'norm: 3.00'].join('\n')
            });

            return Plotly.restyle(gd, 'hoverinfo', 'u+v+w');
        })
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                nums: ['u: 0', 'v: 3', 'w: 0'].join('\n')
            });

            return Plotly.restyle(gd, 'hoverinfo', 'all');
        })
        .then(function() {
            assertHoverLabelContent({
                name: 'trace 0',
                nums: [
                    'x: 2', 'y: 2', 'z: 2',
                    'u: 0', 'v: 3', 'w: 0',
                    'norm: 3.00'
                ].join('\n')
            });

            return Plotly.restyle(gd, 'hovertemplate', 'NORM : %{norm}<br>at %{x},%{y},%{z}<extra>LOOKOUT</extra>');
        })
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                name: 'LOOKOUT',
                nums: 'NORM : 3.00\nat 2,2,2'
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should display hover labels (multi-trace case)', function(done) {
        function _hover() {
            mouseEvent('mouseover', 282, 240);
            return delay(20)();
        }

        Plotly.plot(gd, [{
            type: 'cone',
            name: 'blue cone',
            x: [1], y: [1], z: [1],
            u: [1], v: [1], w: [0],
            colorscale: 'Blues',
            showscale: false
        }, {
            type: 'cone',
            name: 'green cone',
            x: [3], y: [3], z: [3],
            u: [0], v: [0], w: [2],
            colorscale: 'Greens',
            showscale: false
        }], {
            scene: {
                camera: {
                    eye: {x: -0.76, y: 1.8, z: 0.92}
                }
            },
            margin: {l: 0, t: 0, r: 0, b: 0},
            width: 400,
            height: 400
        })
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                nums: ['x: 1', 'y: 1', 'z: 1', 'norm: 1.41'].join('\n'),
                name: 'blue cone'
            });
        })
        .catch(failTest)
        .then(done);
    });
});
