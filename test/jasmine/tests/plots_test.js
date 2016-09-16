var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test Plots', function() {
    'use strict';

    describe('Plots.supplyDefaults', function() {

        var gd;

        it('should relink private keys', function() {
            var oldFullData = [{
                type: 'scatter3d',
                z: [1, 2, 3]
            }, {
                type: 'contour',
                _empties: [1, 2, 3]
            }];

            var oldFullLayout = {
                _plots: { xy: { plot: {} } },
                xaxis: { c2p: function() {} },
                yaxis: { _m: 20 },
                scene: { _scene: {} },
                annotations: [{ _min: 10, }, { _max: 20 }],
                someFunc: function() {}
            };

            var newData = [{
                type: 'scatter3d',
                z: [1, 2, 3, 4]
            }, {
                type: 'contour',
                z: [[1, 2, 3], [2, 3, 4]]
            }];

            var newLayout = {
                annotations: [{}, {}, {}]
            };

            gd = {
                _fullData: oldFullData,
                _fullLayout: oldFullLayout,
                data: newData,
                layout: newLayout
            };

            Plots.supplyDefaults(gd);

            expect(gd._fullData[0].z).toBe(newData[0].z);
            expect(gd._fullData[1].z).toBe(newData[1].z);
            expect(gd._fullData[1]._empties).toBe(oldFullData[1]._empties);
            expect(gd._fullLayout.scene._scene).toBe(oldFullLayout.scene._scene);
            expect(gd._fullLayout._plots.plot).toBe(oldFullLayout._plots.plot);
            expect(gd._fullLayout.annotations[0]._min).toBe(oldFullLayout.annotations[0]._min);
            expect(gd._fullLayout.annotations[1]._max).toBe(oldFullLayout.annotations[1]._max);
            expect(gd._fullLayout.someFunc).toBe(oldFullLayout.someFunc);

            expect(gd._fullLayout.xaxis.c2p)
                .not.toBe(oldFullLayout.xaxis.c2p, '(set during ax.setScale');
            expect(gd._fullLayout.yaxis._m)
                .not.toBe(oldFullLayout.yaxis._m, '(set during ax.setScale');
        });
    });

    describe('Plots.supplyLayoutGlobalDefaults should', function() {
        var layoutIn,
            layoutOut,
            expected;

        var supplyLayoutDefaults = Plots.supplyLayoutGlobalDefaults;

        beforeEach(function() {
            layoutOut = {};
        });

        it('should sanitize margins when they are wider than the plot', function() {
            layoutIn = {
                width: 500,
                height: 500,
                margin: {
                    l: 400,
                    r: 200
                }
            };
            expected = {
                l: 332,
                r: 166,
                t: 100,
                b: 80,
                pad: 0,
                autoexpand: true
            };

            supplyLayoutDefaults(layoutIn, layoutOut);
            expect(layoutOut.margin).toEqual(expected);
        });

        it('should sanitize margins when they are taller than the plot', function() {
            layoutIn = {
                width: 500,
                height: 500,
                margin: {
                    l: 400,
                    r: 200,
                    t: 300,
                    b: 500
                }
            };
            expected = {
                l: 332,
                r: 166,
                t: 187,
                b: 311,
                pad: 0,
                autoexpand: true
            };

            supplyLayoutDefaults(layoutIn, layoutOut);
            expect(layoutOut.margin).toEqual(expected);
        });

    });

    describe('Plots.supplyTraceDefaults', function() {
        var supplyTraceDefaults = Plots.supplyTraceDefaults,
            layout = {};

        var traceIn, traceOut;

        describe('should coerce hoverinfo', function() {
            it('without *name* for single-trace graphs by default', function() {
                layout._dataLength = 1;

                traceIn = {};
                traceOut = supplyTraceDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('x+y+z+text');

                traceIn = { hoverinfo: 'name' };
                traceOut = supplyTraceDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('name');
            });

            it('without *name* for single-trace graphs by default', function() {
                layout._dataLength = 2;

                traceIn = {};
                traceOut = supplyTraceDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('all');

                traceIn = { hoverinfo: 'name' };
                traceOut = supplyTraceDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('name');
            });
        });
    });

    describe('Plots.getSubplotIds', function() {
        var getSubplotIds = Plots.getSubplotIds;

        it('returns scene ids in order', function() {
            var layout = {
                scene2: {},
                scene: {},
                scene3: {}
            };

            expect(getSubplotIds(layout, 'gl3d'))
                .toEqual(['scene', 'scene2', 'scene3']);

            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'geo'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'no-valid-subplot-type'))
                .toEqual([]);
        });

        it('returns geo ids in order', function() {
            var layout = {
                geo2: {},
                geo: {},
                geo3: {}
            };

            expect(getSubplotIds(layout, 'geo'))
                .toEqual(['geo', 'geo2', 'geo3']);

            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'gl3d'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'no-valid-subplot-type'))
                .toEqual([]);
        });

        it('returns cartesian ids', function() {
            var layout = {
                _has: Plots._hasPlotType,
                _plots: { xy: {}, x2y2: {} }
            };

            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);

            layout._basePlotModules = [{ name: 'cartesian' }];
            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual(['xy', 'x2y2']);
            expect(getSubplotIds(layout, 'gl2d'))
                .toEqual([]);

            layout._basePlotModules = [{ name: 'gl2d' }];
            expect(getSubplotIds(layout, 'gl2d'))
                .toEqual(['xy', 'x2y2']);
            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);

        });
    });

    describe('Plots.findSubplotIds', function() {
        var findSubplotIds = Plots.findSubplotIds;
        var ids;

        it('should return subplots ids found in the data', function() {
            var data = [{
                type: 'scatter3d',
                scene: 'scene'
            }, {
                type: 'surface',
                scene: 'scene2'
            }, {
                type: 'choropleth',
                geo: 'geo'
            }];

            ids = findSubplotIds(data, 'geo');
            expect(ids).toEqual(['geo']);

            ids = findSubplotIds(data, 'gl3d');
            expect(ids).toEqual(['scene', 'scene2']);
        });
    });

    describe('Plots.resize', function() {
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], {})
                .then(function() {
                    gd.style.width = '400px';
                    gd.style.height = '400px';

                    return Plotly.Plots.resize(gd);
                })
                .then(done);
        });

        afterEach(destroyGraphDiv);

        it('should resize the plot clip', function() {
            var uid = gd._fullLayout._uid;

            var plotClip = document.getElementById('clip' + uid + 'xyplot'),
                clipRect = plotClip.children[0],
                clipWidth = +clipRect.getAttribute('width'),
                clipHeight = +clipRect.getAttribute('height');

            expect(clipWidth).toBe(240);
            expect(clipHeight).toBe(220);
        });

        it('should resize the main svgs', function() {
            var mainSvgs = document.getElementsByClassName('main-svg');

            for(var i = 0; i < mainSvgs.length; i++) {
                var svg = mainSvgs[i],
                    svgWidth = +svg.getAttribute('width'),
                    svgHeight = +svg.getAttribute('height');

                expect(svgWidth).toBe(400);
                expect(svgHeight).toBe(400);
            }
        });
    });

    describe('Plots.purge', function() {
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], {}).then(done);
        });

        afterEach(destroyGraphDiv);

        it('should unset everything in the gd except _context', function() {
            var expectedKeys = [
                '_ev', '_internalEv', 'on', 'once', 'removeListener', 'removeAllListeners',
                '_internalOn', '_internalOnce', '_removeInternalListener',
                '_removeAllInternalListeners', 'emit', '_context', '_replotPending',
                '_hmpixcount', '_hmlumcount', '_mouseDownTime'
            ];

            Plots.purge(gd);
            expect(Object.keys(gd)).toEqual(expectedKeys);
            expect(gd.data).toBeUndefined();
            expect(gd.layout).toBeUndefined();
            expect(gd._fullData).toBeUndefined();
            expect(gd._fullLayout).toBeUndefined();
            expect(gd.calcdata).toBeUndefined();
            expect(gd.framework).toBeUndefined();
            expect(gd.empty).toBeUndefined();
            expect(gd.fid).toBeUndefined();
            expect(gd.undoqueue).toBeUndefined();
            expect(gd.undonum).toBeUndefined();
            expect(gd.autoplay).toBeUndefined();
            expect(gd.changed).toBeUndefined();
            expect(gd._tester).toBeUndefined();
            expect(gd._testref).toBeUndefined();
            expect(gd._promises).toBeUndefined();
            expect(gd._redrawTimer).toBeUndefined();
            expect(gd._replotting).toBeUndefined();
            expect(gd.firstscatter).toBeUndefined();
            expect(gd.hmlumcount).toBeUndefined();
            expect(gd.hmpixcount).toBeUndefined();
            expect(gd.numboxes).toBeUndefined();
            expect(gd._hoverTimer).toBeUndefined();
            expect(gd._lastHoverTime).toBeUndefined();
            expect(gd._transitionData).toBeUndefined();
            expect(gd._transitioning).toBeUndefined();
        });
    });
});
