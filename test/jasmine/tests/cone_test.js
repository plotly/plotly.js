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

describe('@gl Test cone autorange:', function() {
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
        expect(sceneLayout.xaxis.range).toBeCloseToArray(xrng, 2, 'xaxis range -' + msg);
        expect(sceneLayout.yaxis.range).toBeCloseToArray(yrng, 2, 'yaxis range -' + msg);
        expect(sceneLayout.zaxis.range).toBeCloseToArray(zrng, 2, 'zaxis range -' + msg);
    }

    it('should add pad around cone position to make sure they fit on the scene', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_cone-autorange.json'));

        // the resulting image should be independent of what I multiply by here
        function makeScaleFn(s) {
            return function(v) { return v * s; };
        }

        Plotly.plot(gd, fig).then(function() {
            _assertAxisRanges('base',
                [-0.39, 4.39], [-0.39, 4.39], [-0.39, 4.39]
            );

            var trace = fig.data[0];
            var m = makeScaleFn(10);
            var u = trace.u.map(m);
            var v = trace.v.map(m);
            var w = trace.w.map(m);

            return Plotly.restyle(gd, {u: [u], v: [v], w: [w]});
        })
        .then(function() {
            _assertAxisRanges('scaled up',
                [-0.39, 4.39], [-0.39, 4.39], [-0.39, 4.39]
            );

            var trace = fig.data[0];
            var m = makeScaleFn(0.2);
            var u = trace.u.map(m);
            var v = trace.v.map(m);
            var w = trace.w.map(m);

            return Plotly.restyle(gd, {u: [u], v: [v], w: [w]});
        })
        .then(function() {
            _assertAxisRanges('scaled down',
                [-0.39, 4.39], [-0.39, 4.39], [-0.39, 4.39]
            );

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
            _assertAxisRanges('after adding one cone outside range but with norm-0',
                [-0.45, 6.45], [-0.45, 6.45], [-0.45, 6.45]
            );

            return Plotly.restyle(gd, 'sizeref', 10);
        })
        .then(function() {
            _assertAxisRanges('after increasing sizeref',
                [-12.4, 18.4], [-12.4, 18.4], [-12.4, 18.4]
            );

            return Plotly.restyle(gd, 'sizeref', 0.1);
        })
        .then(function() {
            _assertAxisRanges('after decreasing sizeref',
                [0.74, 5.26], [0.74, 5.26], [0.74, 5.26]
            );

            return Plotly.restyle(gd, {
                sizemode: 'absolute',
                sizeref: 2
            });
        })
        .then(function() {
            _assertAxisRanges('with sizemode absolute',
                [-1.25, 7.25], [-1.25, 7.25], [-1.25, 7.25]
            );
        })
        .catch(failTest)
        .then(done);
    });
});

describe('@gl Test cone interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should add/clear gl objects correctly', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_cone-simple.json'));
        // put traces on same subplot
        delete fig.data[1].scene;

        Plotly.plot(gd, fig).then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(4);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(2);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout.scene;

            expect(scene).toBeUndefined();
        })
        .catch(failTest)
        .then(done);
    });

    it('should display hover labels', function(done) {
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
                nums: ['x: 3', 'y: 3', 'z: 3', 'norm: 2.00'].join('\n')
            });

            return Plotly.restyle(gd, 'hoverinfo', 'u+v+w');
        })
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                nums: ['u: 0', 'v: 0', 'w: 2'].join('\n')
            });
        })
        .catch(failTest)
        .then(done);
    });
});
