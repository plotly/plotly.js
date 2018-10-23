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

describe('Test streamtube defaults', function() {
    var gd;

    function makeGD() {
        return {
            data: [{
                type: 'streamtube',
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
        // even when starts.x/starts.y/starts.z are missing
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
            expect(gd._fullData[0].visible).toBe(false, 'missing array ' + k);
        });
    });

    it('should set `visible: false` for traces empty x,y,z,u,v,w arrays', function() {
        var keysToEmpty = ['x', 'y', 'z', 'u', 'v', 'w'];

        keysToEmpty.forEach(function(k) {
            gd = makeGD();
            gd.data[0][k] = [];

            supplyAllDefaults(gd);
            expect(gd._fullData[0].visible).toBe(false, 'empty array ' + k);
        });
    });
});

describe('Test streamtube autorange', function() {
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

    it('@gl should add pad around tubes to make sure they fit on the scene', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_streamtube-first'));

        Plotly.plot(gd, fig).then(function() {
            _assertAxisRanges('base',
                [-5.36, 5.525], [-3.73, 5.44], [-3.55, 3.78]
            );
            return Plotly.restyle(gd, 'sizeref', 10);
        })
        .then(function() {
            _assertAxisRanges('with large sizeref',
                [-9.86, 10.02], [-8.23, 9.935], [-8.045, 8.28]
            );
            return Plotly.restyle(gd, 'sizeref', 0.1);
        })
        .then(function() {
            _assertAxisRanges('with small sizeref',
                [-5.32, 5.48], [-3.69, 5.39], [-3.50, 3.73]
            );
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test streamtube starting positions defaults:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function makeFigure(nx, ny, nz) {
        var trace = {
            type: 'streamtube',
            x: [], y: [], z: [],
            u: [], v: [], w: []
        };

        for(var i = 0; i < nx; i++) {
            for(var j = 0; j < ny; j++) {
                for(var k = 0; k < nz; k++) {
                    trace.x.push(i);
                    trace.y.push(j);
                    trace.z.push(k);
                    trace.u.push(1 + Math.sin(i));
                    trace.v.push(Math.cos(j));
                    trace.w.push(0.3 * Math.sin(k * 0.3));
                }
            }
        }

        return {data: [trace]};
    }

    function _assert(exp) {
        var scene = gd._fullLayout.scene._scene;
        var obj = scene.glplot.objects[0];
        expect(exp.positionsLength).toBe(obj.positions.length, 'positions length');
        expect(exp.cellsLength).toBe(obj.cells.length, 'cells length');
    }

    it('@gl should cut xz at min-y and take all x/y/z pts on that plane except those on the edges', function(done) {
        Plotly.plot(gd, makeFigure(3, 3, 3)).then(function() {
            _assert({
                positionsLength: 1536,
                cellsLength: 512
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should take middle pt if mesh vector has length 2', function(done) {
        Plotly.plot(gd, makeFigure(3, 3, 2)).then(function() {
            _assert({
                positionsLength: 1200,
                cellsLength: 400
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should take pt if mesh vector has length 1', function(done) {
        Plotly.plot(gd, makeFigure(1, 3, 2)).then(function() {
            _assert({
                positionsLength: 720,
                cellsLength: 240
            });
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test streamtube interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl overspecified meshgrid should return blank mesh grid', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_streamtube-simple.json'));
        var trace = fig.data[0];
        var x = trace.x.slice();
        var y = trace.y.slice();
        var z = trace.z.slice();
        trace.x = [1, 2, 3];
        trace.y = [1, 2, 3];
        trace.z = [1, 2, 3];

        function _assert(msg, exp) {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;
            expect(objs.length).toBe(1, 'one gl-vis object - ' + msg);
            expect(exp.positionsLength).toBe(objs[0].positions.length, 'positions length - ' + msg);
            expect(exp.cellsLength).toBe(objs[0].cells.length, 'cells length - ' + msg);
        }

        Plotly.plot(gd, fig).then(function() {
            _assert('base', {
                positionsLength: 0,
                cellsLength: 0
            });
            return Plotly.restyle(gd, {x: [x], y: [y], z: [z]});
        })
        .then(function() {
            _assert('overspecified meshgrid (i.e underspecified x/y/z)', {
                positionsLength: 1536,
                cellsLength: 512
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should add/clear gl objects correctly', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_streamtube-simple.json'));
        var trace = Lib.extendDeep({}, fig.data[0]);

        function _assert(msg, exp) {
            if(exp.glObjCnt) {
                var scene = gd._fullLayout.scene._scene;
                var objs = scene.glplot.objects;
                expect(objs.length).toBe(exp.glObjCnt, 'gl-vis object cnt - ' + msg);
            } else {
                expect(gd._fullLayout.scene).toBe(undefined, 'no scene -' + msg);
            }
        }

        Plotly.plot(gd, fig).then(function() {
            _assert('base', {glObjCnt: 1});
            return Plotly.addTraces(gd, [trace]);
        })
        .then(function() {
            _assert('after addTraces', {glObjCnt: 2});
            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            _assert('after deleteTraces', {glObjCnt: 1});
            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            _assert('after deleteTraces #2', {glObjCnt: 0});
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should be able to restyle to a cone trace and back', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_cone-autorange.json'));
        var trace1 = Lib.extendDeep({}, fig.data[0]);
        trace1.type = 'streamtube';

        function _assert(msg, exp) {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;
            var objTypes = objs.map(function(o) { return o._trace.data.type; });
            expect(objTypes).toEqual(exp.objTypes);
        }

        Plotly.plot(gd, fig).then(function() {
            _assert('base cone', {objTypes: ['cone']});
            return Plotly.restyle(gd, 'type', 'streamtube');
        })
        .then(function() {
            _assert('restyled to streamtube', {objTypes: ['streamtube']});
            return Plotly.restyle(gd, 'type', 'cone');
        })
        .then(function() {
            _assert('back to cone', {objTypes: ['cone']});
            return Plotly.addTraces(gd, [trace1]);
        })
        .then(function() {
            _assert('add streamtube on top of cone', {
                objTypes: ['cone', 'streamtube']
            });
        })
        .catch(failTest)
        .then(done);
    });
});

describe('@noCI Test streamtube hover', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should display hover labels', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_streamtube-simple.json'));
        fig.data[0].showscale = false;
        fig.layout.margin = {l: 0, t: 0, r: 0, b: 0};
        fig.layout.width = 400;
        fig.layout.height = 400;

        function _hover() {
            mouseEvent('mouseover', 188, 199);
            return delay(20)();
        }

        Plotly.plot(gd, fig)
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                nums: [
                    'x: 2.250878',
                    'y: 0.5866609',
                    'z: 1.091627',
                    'norm: 2.06'
                ].join('\n')
            });

            return Plotly.restyle(gd, 'hoverinfo', 'u+v+w');
        })
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                nums: [
                    'u: 1.847686',
                    'v: 0.7303133',
                    'w: 0.1693927'
                ].join('\n')
            });
            return Plotly.restyle(gd, 'hoverinfo', 'divergence');
        })
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({nums: 'divergence: 0.465'});
            return Plotly.restyle(gd, {
                hoverinfo: 'text',
                text: '!SCALAR TX!'
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({nums: '!SCALAR TX!'});
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should display hover labels (multi-trace case)', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_streamtube-simple.json'));
        var trace0 = fig.data[0];
        trace0.showscale = false;
        trace0.name = 'TUBE!';
        fig.layout.margin = {l: 0, t: 0, r: 0, b: 0};
        fig.layout.width = 400;
        fig.layout.height = 400;

        var trace1 = Lib.extendDeep({}, fig.data[0]);
        trace1.type = 'cone';
        fig.data.push(trace1);

        function _hover() {
            mouseEvent('mouseover', 193, 177);
            return delay(20)();
        }

        Plotly.plot(gd, fig)
        .then(delay(20))
        .then(_hover)
        .then(function() {
            assertHoverLabelContent({
                nums: [
                    'x: 2.059149',
                    'y: 0.5083682',
                    'z: 1.074042',
                    'norm: 2.07'
                ].join('\n'),
                name: 'TUBE!'
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should emit correct event data', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_streamtube-simple.json'));
        fig.data[0].showscale = false;
        fig.layout.margin = {l: 0, t: 0, r: 0, b: 0};
        fig.layout.width = 400;
        fig.layout.height = 400;

        var TOL = 2;
        var ptData;

        function _hover() {
            mouseEvent('mouseover', 188, 199);
            return delay(20)();
        }

        Plotly.plot(gd, fig)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(d) { ptData = d.points[0]; });
        })
        .then(_hover)
        .then(function() {
            if(ptData) {
                expect(Object.keys(ptData).length).toBe(12, 'key cnt');

                expect(ptData.tubex).toBeCloseTo(2.25, TOL, 'tubex');
                expect(ptData.tubey).toBeCloseTo(0.59, TOL, 'tubey');
                expect(ptData.tubez).toBeCloseTo(1.09, TOL, 'tubez');

                expect(ptData.tubeu).toBeCloseTo(1.85, TOL, 'tubeu');
                expect(ptData.tubev).toBeCloseTo(0.73, TOL, 'tubev');
                expect(ptData.tubew).toBeCloseTo(0.17, TOL, 'tubew');

                expect(ptData.norm).toBeCloseTo(2.06, TOL, 'norm');
                expect(ptData.divergence).toBeCloseTo(0.47, TOL, 'divergence');

                expect(ptData.curveNumber).toBe(0, 'curve number');
                expect(ptData.pointNumber).toBe(undefined, 'point number');

                expect(ptData.x).toBe(undefined, 'x');
                expect(ptData.y).toBe(undefined, 'y');
                expect(ptData.z).toBe(undefined, 'z');

                expect(ptData.data).not.toBe(undefined, 'trace data');
                expect(ptData.fullData).not.toBe(undefined, 'full trace data');
            } else {
                fail('did not trigger plotly_hover');
            }
        })
        .catch(failTest)
        .then(done);
    });
});
