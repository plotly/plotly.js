var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test Plots', function() {
    'use strict';

    describe('Plots.supplyDefaults', function() {

        it('should not throw an error when gd is a plain object', function() {
            var height = 100,
                gd = {
                    layout: {
                        height: height
                    }
                };

            Plots.supplyDefaults(gd);
            expect(gd.layout.height).toBe(height);
            expect(gd._fullLayout).toBeDefined();
            expect(gd._fullLayout.height).toBe(height);
            expect(gd._fullLayout.width).toBe(Plots.layoutAttributes.width.dflt);
            expect(gd._fullData).toBeDefined();
        });

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

            var gd = {
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

        it('should include the correct reference to user data', function() {
            var trace0 = { y: [1, 2, 3] };
            var trace1 = { y: [5, 2, 3] };

            var data = [trace0, trace1];
            var gd = { data: data };

            Plots.supplyDefaults(gd);

            expect(gd.data).toBe(data);

            expect(gd._fullData[0].index).toEqual(0);
            expect(gd._fullData[1].index).toEqual(1);

            expect(gd._fullData[0]._expandedIndex).toEqual(0);
            expect(gd._fullData[1]._expandedIndex).toEqual(1);

            expect(gd._fullData[0]._input).toBe(trace0);
            expect(gd._fullData[1]._input).toBe(trace1);

            expect(gd._fullData[0]._fullInput).toBe(gd._fullData[0]);
            expect(gd._fullData[1]._fullInput).toBe(gd._fullData[1]);

            expect(gd._fullData[0]._expandedInput).toBe(gd._fullData[0]);
            expect(gd._fullData[1]._expandedInput).toBe(gd._fullData[1]);
        });

        function testSanitizeMarginsHasBeenCalledOnlyOnce(gd) {
            spyOn(Plots, 'sanitizeMargins').and.callThrough();
            Plots.supplyDefaults(gd);
            expect(Plots.sanitizeMargins).toHaveBeenCalledTimes(1);
        }

        it('should call sanitizeMargins only once when both width and height are defined', function() {
            var gd = {
                layout: {
                    width: 100,
                    height: 100
                }
            };

            testSanitizeMarginsHasBeenCalledOnlyOnce(gd);
        });

        it('should call sanitizeMargins only once when autosize is false', function() {
            var gd = {
                layout: {
                    autosize: false,
                    height: 100
                }
            };

            testSanitizeMarginsHasBeenCalledOnlyOnce(gd);
        });

        it('should call sanitizeMargins only once when autosize is true', function() {
            var gd = {
                layout: {
                    autosize: true,
                    height: 100
                }
            };

            testSanitizeMarginsHasBeenCalledOnlyOnce(gd);
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

        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }])
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

        it('should update the axis scales', function() {
            var fullLayout = gd._fullLayout,
                plotinfo = fullLayout._plots.xy;

            expect(fullLayout.xaxis._length).toEqual(240);
            expect(fullLayout.yaxis._length).toEqual(220);

            expect(plotinfo.xaxis._length).toEqual(240);
            expect(plotinfo.yaxis._length).toEqual(220);
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
                '_hmpixcount', '_hmlumcount', '_mouseDownTime', '_legendMouseDownTime',
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

    describe('extendObjectWithContainers', function() {

        function assert(dest, src, expected) {
            Plots.extendObjectWithContainers(dest, src, ['container']);
            expect(dest).toEqual(expected);
        }

        it('extend each container items', function() {
            var dest = {
                container: [
                    { text: '1', x: 1, y: 1 },
                    { text: '2', x: 2, y: 2 }
                ]
            };

            var src = {
                container: [
                    { text: '1-new' },
                    { text: '2-new' }
                ]
            };

            var expected = {
                container: [
                    { text: '1-new', x: 1, y: 1 },
                    { text: '2-new', x: 2, y: 2 }
                ]
            };

            assert(dest, src, expected);
        });

        it('clears container items when applying null src items', function() {
            var dest = {
                container: [
                    { text: '1', x: 1, y: 1 },
                    { text: '2', x: 2, y: 2 }
                ]
            };

            var src = {
                container: [null, null]
            };

            var expected = {
                container: [null, null]
            };

            assert(dest, src, expected);
        });

        it('clears container applying null src', function() {
            var dest = {
                container: [
                    { text: '1', x: 1, y: 1 },
                    { text: '2', x: 2, y: 2 }
                ]
            };

            var src = { container: null };

            var expected = { container: null };

            assert(dest, src, expected);
        });
    });

    describe('Plots.graphJson', function() {

        it('should serialize data, layout and frames', function(done) {
            var mock = {
                data: [{
                    x: [1, 2, 3],
                    y: [2, 1, 2]
                }],
                layout: {
                    title: 'base'
                },
                frames: [{
                    data: [{
                        y: [1, 2, 1],
                    }],
                    layout: {
                        title: 'frame A'
                    },
                    name: 'A'
                }, null, {
                    data: [{
                        y: [1, 2, 3],
                    }],
                    layout: {
                        title: 'frame B'
                    },
                    name: 'B'
                }, {
                    data: [null, false, undefined],
                    layout: 'garbage',
                    name: 'garbage'
                }]
            };

            Plotly.plot(createGraphDiv(), mock).then(function(gd) {
                var str = Plots.graphJson(gd, false, 'keepdata');
                var obj = JSON.parse(str);

                expect(obj.data).toEqual(mock.data);
                expect(obj.layout).toEqual(mock.layout);
                expect(obj.frames[0]).toEqual(mock.frames[0]);
                expect(obj.frames[1]).toEqual(mock.frames[2]);
                expect(obj.frames[2]).toEqual({
                    data: [null, false, null],
                    layout: 'garbage',
                    name: 'garbage'
                });
            })
            .then(function() {
                destroyGraphDiv();
                done();
            });
        });
    });

    describe('Plots.getSubplotCalcData', function() {
        var trace0 = { geo: 'geo2' };
        var trace1 = { subplot: 'ternary10' };
        var trace2 = { subplot: 'ternary10' };

        var cd = [
            [{ trace: trace0 }],
            [{ trace: trace1 }],
            [{ trace: trace2}]
        ];

        it('should extract calcdata traces associated with subplot (1)', function() {
            var out = Plots.getSubplotCalcData(cd, 'geo', 'geo2');
            expect(out).toEqual([[{ trace: trace0 }]]);
        });

        it('should extract calcdata traces associated with subplot (2)', function() {
            var out = Plots.getSubplotCalcData(cd, 'ternary', 'ternary10');
            expect(out).toEqual([[{ trace: trace1 }], [{ trace: trace2 }]]);
        });

        it('should return [] when no calcdata traces where found', function() {
            var out = Plots.getSubplotCalcData(cd, 'geo', 'geo');
            expect(out).toEqual([]);
        });

        it('should return [] when subplot type is invalid', function() {
            var out = Plots.getSubplotCalcData(cd, 'non-sense', 'geo2');
            expect(out).toEqual([]);
        });
    });

    describe('Plots.generalUpdatePerTraceModule', function() {

        function _update(subplotCalcData, traceHashOld) {
            var subplot = { traceHash: traceHashOld || {} };
            var calcDataPerModule = [];

            var plot = function(_, moduleCalcData) {
                calcDataPerModule.push(moduleCalcData);
            };

            subplotCalcData.forEach(function(calcTrace) {
                calcTrace[0].trace._module = { plot: plot };
            });

            Plots.generalUpdatePerTraceModule(subplot, subplotCalcData, {});

            return {
                traceHash: subplot.traceHash,
                calcDataPerModule: calcDataPerModule
            };
        }

        it('should update subplot trace hash and call module plot method with correct calcdata traces', function() {
            var out = _update([
                [ { trace: { type: 'A', visible: false } } ],
                [ { trace: { type: 'A', visible: true } } ],
                [ { trace: { type: 'B', visible: false } } ],
                [ { trace: { type: 'C', visible: true } } ]
            ]);

            expect(Object.keys(out.traceHash)).toEqual(['A', 'C']);
            expect(out.traceHash.A.length).toEqual(1);
            expect(out.traceHash.C.length).toEqual(1);

            expect(out.calcDataPerModule.length).toEqual(2);
            expect(out.calcDataPerModule[0].length).toEqual(1);
            expect(out.calcDataPerModule[1].length).toEqual(1);

            var out2 = _update([
                [ { trace: { type: 'A', visible: false } } ],
                [ { trace: { type: 'A', visible: false } } ],
                [ { trace: { type: 'B', visible: true } } ],
                [ { trace: { type: 'C', visible: false } } ]
            ], out.traceHash);

            expect(Object.keys(out2.traceHash)).toEqual(['B', 'A', 'C']);
            expect(out2.traceHash.B.length).toEqual(1);
            expect(out2.traceHash.A.length).toEqual(1);
            expect(out2.traceHash.A[0][0].trace.visible).toBe(false);
            expect(out2.traceHash.C.length).toEqual(1);
            expect(out2.traceHash.C[0][0].trace.visible).toBe(false);

            expect(out2.calcDataPerModule.length).toEqual(1);
            expect(out2.calcDataPerModule[0].length).toEqual(1);

            var out3 = _update([
                [ { trace: { type: 'A', visible: false } } ],
                [ { trace: { type: 'A', visible: false } } ],
                [ { trace: { type: 'B', visible: false } } ],
                [ { trace: { type: 'C', visible: false } } ]
            ], out2.traceHash);

            expect(Object.keys(out3.traceHash)).toEqual(['B', 'A', 'C']);
            expect(out3.traceHash.B.length).toEqual(1);
            expect(out3.traceHash.B[0][0].trace.visible).toBe(false);
            expect(out3.traceHash.A.length).toEqual(1);
            expect(out3.traceHash.A[0][0].trace.visible).toBe(false);
            expect(out3.traceHash.C.length).toEqual(1);
            expect(out3.traceHash.C[0][0].trace.visible).toBe(false);

            expect(out3.calcDataPerModule.length).toEqual(0);

            var out4 = _update([
                [ { trace: { type: 'A', visible: true } } ],
                [ { trace: { type: 'A', visible: true } } ],
                [ { trace: { type: 'B', visible: true } } ],
                [ { trace: { type: 'C', visible: true } } ]
            ], out3.traceHash);

            expect(Object.keys(out4.traceHash)).toEqual(['A', 'B', 'C']);
            expect(out4.traceHash.A.length).toEqual(2);
            expect(out4.traceHash.B.length).toEqual(1);
            expect(out4.traceHash.C.length).toEqual(1);

            expect(out4.calcDataPerModule.length).toEqual(3);
            expect(out4.calcDataPerModule[0].length).toEqual(2);
            expect(out4.calcDataPerModule[1].length).toEqual(1);
            expect(out4.calcDataPerModule[2].length).toEqual(1);
        });

        it('should handle cases when module plot is not set (geo case)', function(done) {
            Plotly.plot(createGraphDiv(), [{
                type: 'scattergeo',
                visible: false,
                lon: [10, 20],
                lat: [20, 10]
            }, {
                type: 'scattergeo',
                lon: [10, 20],
                lat: [20, 10]
            }])
            .then(function() {
                expect(d3.selectAll('g.trace.scattergeo').size()).toEqual(1);

                destroyGraphDiv();
                done();
            });
        });

        it('should handle cases when module plot is not set (ternary case)', function(done) {
            Plotly.plot(createGraphDiv(), [{
                type: 'scatterternary',
                visible: false,
                a: [0.1, 0.2],
                b: [0.2, 0.1]
            }, {
                type: 'scatterternary',
                a: [0.1, 0.2],
                b: [0.2, 0.1]
            }])
            .then(function() {
                expect(d3.selectAll('g.trace.scatter').size()).toEqual(1);

                destroyGraphDiv();
                done();
            });
        });
    });
});
