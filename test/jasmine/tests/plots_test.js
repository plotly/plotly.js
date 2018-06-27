var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');
var failTest = require('../assets/fail_test');

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

            supplyAllDefaults(gd);
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
            oldFullData.forEach(function(trace) { trace._fullInput = trace; });

            var oldFullLayout = {
                _plots: { xy: { plot: {} } },
                xaxis: { c2p: function() {}, layer: 'above traces' },
                yaxis: { _m: 20, layer: 'above traces' },
                scene: { _scene: {} },
                annotations: [{ _min: 10, }, { _max: 20 }],
                someFunc: function() {}
            };

            Lib.extendFlat(oldFullLayout._plots.xy, {
                xaxis: oldFullLayout.xaxis,
                yaxis: oldFullLayout.yaxis
            });

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

            supplyAllDefaults(gd);

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

            supplyAllDefaults(gd);

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
            supplyAllDefaults(gd);
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

        it('should sort base plot modules on fullLayout object', function() {
            var gd = Lib.extendDeep({}, require('@mocks/plot_types.json'));
            gd.data.unshift({type: 'scattergl'});
            gd.data.push({type: 'splom'});

            supplyAllDefaults(gd);
            var names = gd._fullLayout._basePlotModules.map(function(m) {
                return m.name;
            });

            expect(names).toEqual([
                'splom',
                'cartesian',
                'gl3d',
                'geo',
                'pie',
                'ternary'
            ]);
        });
    });

    describe('Plots.supplyLayoutGlobalDefaults should', function() {
        var layoutIn,
            layoutOut,
            expected;

        var formatObj = require('@src/locale-en').format;

        function supplyLayoutDefaults(layoutIn, layoutOut) {
            layoutOut._dfltTitle = {
                plot: 'ppplot'
            };
            return Plots.supplyLayoutGlobalDefaults(layoutIn, layoutOut, formatObj);
        }

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
            layout = {_subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']}};

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

    describe('Plots.supplyTransformDefaults', function() {
        it('should accept an empty layout when transforms present', function() {
            var traceOut = {y: [1], _length: 1};
            Plots.supplyTransformDefaults({}, traceOut, {
                _globalTransforms: [{ type: 'filter'}]
            });

            // This isn't particularly interesting. More relevant is that
            // the above supplyTransformDefaults call didn't fail due to
            // missing transformModules data.
            expect(traceOut.transforms.length).toEqual(1);
        });
    });

    describe('Plots.resize:', function() {
        var gd;

        describe('on graph div DOM style changes', function() {
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

            afterAll(destroyGraphDiv);

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
                expect(mainSvgs.length).toBe(2);

                for(var i = 0; i < mainSvgs.length; i++) {
                    var svg = mainSvgs[i],
                        svgWidth = +svg.getAttribute('width'),
                        svgHeight = +svg.getAttribute('height');

                    expect(svgWidth).toBe(400);
                    expect(svgHeight).toBe(400);
                }
            });

            it('should update the axis scales', function() {
                var mainSvgs = document.getElementsByClassName('main-svg');
                expect(mainSvgs.length).toBe(2);

                var fullLayout = gd._fullLayout,
                    plotinfo = fullLayout._plots.xy;

                expect(fullLayout.xaxis._length).toEqual(240);
                expect(fullLayout.yaxis._length).toEqual(220);

                expect(plotinfo.xaxis._length).toEqual(240);
                expect(plotinfo.yaxis._length).toEqual(220);
            });

            it('should allow resizing by plot ID', function(done) {
                var mainSvgs = document.getElementsByClassName('main-svg');
                expect(mainSvgs.length).toBe(2);

                expect(typeof gd.id).toBe('string');
                expect(gd.id).toBeTruthy();

                Plotly.Plots.resize(gd.id)
                .catch(failTest)
                .then(done);
            });
        });

        describe('on styled graph div', function() {
            afterEach(destroyGraphDiv);

            it('should sanitize margins', function(done) {
                gd = createGraphDiv();
                gd.style.width = '150px';
                gd.style.height = '150px';

                function _assert(exp) {
                    var margin = gd._fullLayout.margin || {};
                    for(var k in exp) {
                        expect(margin[k]).toBe(exp[k], ' - margin.' + k);
                    }
                }

                Plotly.plot(gd, [], {})
                    .then(function() { _assert({l: 74, r: 74, t: 82, b: 66}); })
                    .then(function() { return Plotly.Plots.resize(gd); })
                    .then(function() { _assert({l: 74, r: 74, t: 82, b: 66}); })
                    .catch(failTest)
                    .then(done);
            });
        });
    });

    describe('Plots.purge', function() {
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], {}).then(done);

            // hacky: simulate getting stuck with these flags due to an error
            // see #2055 and commit 6a44a9a - before fixing that error, we would
            // end up in an inconsistent state that prevented future Plotly.newPlot
            // because _dragging and _dragged were not cleared by purge.
            gd._dragging = true;
            gd._dragged = true;
            gd._hoverdata = true;
            gd._snapshotInProgress = true;
            gd._editing = true;
            gd._replotPending = true;
            gd._mouseDownTime = true;
            gd._legendMouseDownTime = true;
        });

        afterEach(destroyGraphDiv);

        it('should unset everything in the gd except _context', function() {
            var expectedKeys = [
                '_ev', '_internalEv', 'on', 'once', 'removeListener', 'removeAllListeners',
                '_internalOn', '_internalOnce', '_removeInternalListener',
                '_removeAllInternalListeners', 'emit', '_context'
            ];

            var expectedUndefined = [
                'data', 'layout', '_fullData', '_fullLayout', 'calcdata', 'framework',
                'empty', 'fid', 'undoqueue', 'undonum', 'autoplay', 'changed',
                '_promises', '_redrawTimer', 'firstscatter',
                '_transitionData', '_transitioning', '_hmpixcount', '_hmlumcount',
                '_dragging', '_dragged', '_hoverdata', '_snapshotInProgress', '_editing',
                '_replotPending', '_mouseDownTime', '_legendMouseDownTime'
            ];

            Plots.purge(gd);
            expect(Object.keys(gd).sort()).toEqual(expectedKeys.sort());
            expectedUndefined.forEach(function(key) {
                expect(gd[key]).toBeUndefined(key);
            });
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

    describe('getSubplotCalcData', function() {
        var getSubplotCalcData = require('@src/plots/get_data').getSubplotCalcData;

        var trace0 = { geo: 'geo2' };
        var trace1 = { subplot: 'ternary10' };
        var trace2 = { subplot: 'ternary10' };

        var cd = [
            [{ trace: trace0 }],
            [{ trace: trace1 }],
            [{ trace: trace2}]
        ];

        it('should extract calcdata traces associated with subplot (1)', function() {
            var out = getSubplotCalcData(cd, 'geo', 'geo2');
            expect(out).toEqual([[{ trace: trace0 }]]);
        });

        it('should extract calcdata traces associated with subplot (2)', function() {
            var out = getSubplotCalcData(cd, 'ternary', 'ternary10');
            expect(out).toEqual([[{ trace: trace1 }], [{ trace: trace2 }]]);
        });

        it('should return [] when no calcdata traces where found', function() {
            var out = getSubplotCalcData(cd, 'geo', 'geo');
            expect(out).toEqual([]);
        });

        it('should return [] when subplot type is invalid', function() {
            var out = getSubplotCalcData(cd, 'non-sense', 'geo2');
            expect(out).toEqual([]);
        });
    });

    describe('Plots.generalUpdatePerTraceModule', function() {

        function _update(subplotCalcData, traceHashOld) {
            var gd = {};
            var subplot = { traceHash: traceHashOld || {} };
            var calcDataPerModule = [];

            var plot = function(gd, subplot, moduleCalcData) {
                calcDataPerModule.push(moduleCalcData);
            };

            subplotCalcData.forEach(function(calcTrace) {
                calcTrace[0].trace._module = { plot: plot };
            });

            Plots.generalUpdatePerTraceModule(gd, subplot, subplotCalcData, {});

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

    describe('Plots.style', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should call reused style modules only once per graph', function(done) {
            var Drawing = require('@src/components/drawing');

            Plotly.plot(gd, [{
                mode: 'markers',
                y: [1, 2, 1]
            }, {
                type: 'scatterternary',
                mode: 'markers',
                a: [1, 2, 3],
                b: [2, 1, 3],
                c: [3, 2, 1]
            }, {
                type: 'scatterpolar',
                mode: 'markers',
                r: [1, 2, 3],
                theta: [0, 90, 120]
            }])
            .then(function() {
                expect(gd._fullLayout._modules.length).toBe(3);

                // A routine that gets called inside Scatter.style,
                // once per trace.
                //
                // Start spying on it here, so that calls outside of
                // Plots.style are ignored.
                spyOn(Drawing, 'pointStyle');

                return Plots.style(gd);
            })
            .then(function() {
                // N.B. Drawing.pointStyle would be called 9 times w/o
                // some special Plots.style logic.
                expect(Drawing.pointStyle).toHaveBeenCalledTimes(3);
            })
            .catch(fail)
            .then(done);
        });
    });

    describe('subplot cleaning logic', function() {
        var gd;

        beforeEach(function() { gd = createGraphDiv(); });

        afterEach(destroyGraphDiv);

        function assertCartesian(subplotsSVG, subplotsGL2D, msg) {
            var subplotsAll = subplotsSVG.concat(subplotsGL2D);
            var subplots3 = d3.select(gd).selectAll('.cartesianlayer .subplot');
            expect(subplots3.size()).toBe(subplotsAll.length, msg);

            subplotsAll.forEach(function(subplot) {
                expect(d3.select(gd).selectAll('.cartesianlayer .subplot.' + subplot).size())
                    .toBe(1, msg + ' - ' + subplot);
            });

            subplotsSVG.forEach(function(subplot) {
                expect((gd._fullLayout._plots[subplot] || {})._scene2d)
                    .toBeUndefined(msg + ' - cartesian ' + subplot);
            });

            subplotsGL2D.forEach(function(subplot) {
                expect((gd._fullLayout._plots[subplot] || {})._scene2d)
                    .toBeDefined(msg + ' - gl2d ' + subplot);
            });
        }

        var subplotSelectors = {
            gl3d: '.gl-container>div[id^="scene"]',
            geo: '.geolayer>g',
            mapbox: '.mapboxgl-map',
            parcoords: '.parcoords-line-layers',
            pie: '.pielayer .trace',
            sankey: '.sankey',
            ternary: '.ternarylayer>g'
        };

        function assertSubplot(type, n, msg) {
            expect(d3.select(gd).selectAll(subplotSelectors[type]).size())
                .toBe(n, msg + ' - ' + type);
        }

        // opts.cartesian and opts.gl2d should be arrays of subplot ids ('xy', 'x2y2' etc)
        // others should be counts: gl3d, geo, mapbox, parcoords, pie, ternary
        // if omitted, that subplot type is assumed to not exist
        function assertSubplots(opts, msg) {
            msg = msg || '';
            assertCartesian(opts.cartesian || [], opts.gl2d || [], msg);
            Object.keys(subplotSelectors).forEach(function(type) {
                assertSubplot(type, opts[type] || 0, msg);
            });
        }

        var jsLogo = 'https://images.plot.ly/language-icons/api-home/js-logo.png';

        it('makes at least a blank cartesian subplot', function(done) {
            Plotly.newPlot(gd, [], {})
            .then(function() {
                assertSubplots({cartesian: ['xy']}, 'totally blank');
            })
            .catch(fail)
            .then(done);
        });

        it('uses the first x & y axes it finds in making a blank cartesian subplot', function(done) {
            Plotly.newPlot(gd, [], {xaxis3: {}, yaxis4: {}})
            .then(function() {
                assertSubplots({cartesian: ['x3y4']}, 'blank with axis objects');
            })
            .catch(fail)
            .then(done);
        });

        it('shows expected cartesian subplots from visible traces and components', function(done) {
            Plotly.newPlot(gd, [
                {y: [1, 2]}
            ], {
                // strange case: x2 is anchored to y2, so we show y2
                // even though no trace or component references it, only x2
                annotations: [{xref: 'x2', yref: 'paper'}],
                xaxis2: {anchor: 'y2'},
                images: [{xref: 'x3', yref: 'y3', source: jsLogo}],
                shapes: [{xref: 'x5', yref: 'y5'}]
            })
            .then(function() {
                assertSubplots({cartesian: ['xy', 'x2y2', 'x3y3', 'x5y5']}, 'visible components');
            })
            .catch(fail)
            .then(done);
        });

        it('shows expected cartesian subplots from invisible traces and components', function(done) {
            Plotly.newPlot(gd, [
                {y: [1, 2], visible: false}
            ], {
                // strange case: x2 is anchored to y2, so we show y2
                // even though no trace or component references it, only x2
                annotations: [{xref: 'x2', yref: 'paper', visible: false}],
                xaxis2: {anchor: 'y2'},
                images: [{xref: 'x3', yref: 'y3', source: jsLogo, visible: false}],
                shapes: [{xref: 'x5', yref: 'y5', visible: false}]
            })
            .then(function() {
                assertSubplots({cartesian: ['xy', 'x2y2', 'x3y3', 'x5y5']}, 'invisible components');
            })
            .catch(fail)
            .then(done);
        });

        it('ignores unused axis and subplot objects', function(done) {
            Plotly.plot('graph', [{
                type: 'pie',
                values: [1]
            }], {
                xaxis: {},
                yaxis: {},
                scene: {},
                geo: {},
                ternary: {},
                mapbox: {}
            })
            .then(function() {
                assertSubplots({pie: 1}, 'just pie');
            })
            .catch(fail)
            .then(done);
        });
    });
});

describe('grids', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function makeData(subplots) {
        var data = [];
        for(var i = 0; i < subplots.length; i++) {
            var subplot = subplots[i];
            var yPos = subplot.indexOf('y');
            data.push({
                y: [1, 2],
                xaxis: subplot.slice(0, yPos),
                yaxis: subplot.slice(yPos)
            });
        }
        return data;
    }

    function _assertDomains(domains) {
        for(var axName in domains) {
            expect(gd._fullLayout[axName].domain)
                .toBeCloseToArray(domains[axName], 3, axName);
        }
    }

    function _assertMissing(axList) {
        axList.forEach(function(axName) {
            expect(gd._fullLayout[axName]).toBeUndefined(axName);
        });
    }

    it('does not barf on invalid grid objects', function(done) {
        Plotly.newPlot(gd, makeData(['xy']), {grid: true})
        .then(function() {
            expect(gd._fullLayout.grid).toBeUndefined();

            return Plotly.newPlot(gd, makeData(['xy']), {grid: {}});
        })
        .then(function() {
            expect(gd._fullLayout.grid).toBeUndefined();

            return Plotly.newPlot(gd, makeData(['xy']), {grid: {rows: 1, columns: 1}});
        })
        .then(function() {
            expect(gd._fullLayout.grid).toBeUndefined();

            // check Plotly.validate on the same grids too
            [true, {}, {rows: 1, columns: 1}].forEach(function(gridVal) {
                var validation = Plotly.validate([], {grid: gridVal});
                expect(validation.length).toBe(1);
                expect(validation[0]).toEqual(jasmine.objectContaining({
                    astr: 'grid',
                    code: 'unused'
                }));
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('defaults to a coupled layout', function(done) {
        Plotly.newPlot(gd,
            // leave some empty rows/columns
            makeData(['x2y2', 'x3y3']),
            {grid: {rows: 4, columns: 4}}
        )
        .then(function() {
            _assertDomains({
                xaxis2: [1 / 3.9, 1.9 / 3.9],
                yaxis2: [2 / 3.9, 2.9 / 3.9],
                xaxis3: [2 / 3.9, 2.9 / 3.9],
                yaxis3: [1 / 3.9, 1.9 / 3.9]
            });
            _assertMissing(['xaxis', 'yaxis', 'xaxis4', 'yaxis4']);

            return Plotly.relayout(gd, {
                'grid.xaxes': ['x2', 'x', '', 'x3'],
                'grid.yaxes': ['y3', '', 'y', 'y2']
            });
        })
        .then(function() {
            _assertDomains({
                xaxis2: [0, 0.9 / 3.9],
                yaxis2: [0, 0.9 / 3.9],
                xaxis3: [3 / 3.9, 1],
                yaxis3: [3 / 3.9, 1]
            });
            _assertMissing(['xaxis', 'yaxis', 'xaxis4', 'yaxis4']);

            return Plotly.relayout(gd, {'grid.roworder': 'bottom to top'});
        })
        .then(function() {
            _assertDomains({
                xaxis2: [0, 0.9 / 3.9],
                yaxis2: [3 / 3.9, 1],
                xaxis3: [3 / 3.9, 1],
                yaxis3: [0, 0.9 / 3.9]
            });
            _assertMissing(['xaxis', 'yaxis', 'xaxis4', 'yaxis4']);
        })
        .catch(failTest)
        .then(done);
    });

    it('has a bigger default gap with independent layout', function(done) {
        Plotly.newPlot(gd,
            makeData(['x2y2', 'x3y3', 'x4y4']),
            {grid: {rows: 3, columns: 3, pattern: 'independent'}}
        )
        .then(function() {
            _assertDomains({
                xaxis2: [1 / 2.8, 1.8 / 2.8],
                yaxis2: [2 / 2.7, 1],
                xaxis3: [2 / 2.8, 1],
                yaxis3: [2 / 2.7, 1],
                xaxis4: [0, 0.8 / 2.8],
                yaxis4: [1 / 2.7, 1.7 / 2.7]
            });
            _assertMissing(['xaxis', 'yaxis']);

            return Plotly.relayout(gd, {
                'grid.subplots': [['x4y4', '', 'x3y3'], [], ['', 'x2y2']]
            });
        })
        .then(function() {
            _assertDomains({
                xaxis2: [1 / 2.8, 1.8 / 2.8],
                yaxis2: [0, 0.7 / 2.7],
                xaxis3: [2 / 2.8, 1],
                yaxis3: [2 / 2.7, 1],
                xaxis4: [0, 0.8 / 2.8],
                yaxis4: [2 / 2.7, 1]
            });
            _assertMissing(['xaxis', 'yaxis']);

            return Plotly.relayout(gd, {'grid.roworder': 'bottom to top'});
        })
        .then(function() {
            _assertDomains({
                xaxis2: [1 / 2.8, 1.8 / 2.8],
                yaxis2: [2 / 2.7, 1],
                xaxis3: [2 / 2.8, 1],
                yaxis3: [0, 0.7 / 2.7],
                xaxis4: [0, 0.8 / 2.8],
                yaxis4: [0, 0.7 / 2.7]
            });
            _assertMissing(['xaxis', 'yaxis']);
        })
        .catch(failTest)
        .then(done);
    });

    it('can set x and y gaps and change domain', function(done) {
        Plotly.newPlot(gd,
            // leave some empty rows/columns
            makeData(['xy', 'x2y2']),
            {grid: {rows: 2, columns: 2}}
        )
        .then(function() {
            _assertDomains({
                xaxis: [0, 0.9 / 1.9],
                yaxis: [1 / 1.9, 1],
                xaxis2: [1 / 1.9, 1],
                yaxis2: [0, 0.9 / 1.9]
            });

            return Plotly.relayout(gd, {'grid.xgap': 0.2});
        })
        .then(function() {
            _assertDomains({
                xaxis: [0, 0.8 / 1.8],
                yaxis: [1 / 1.9, 1],
                xaxis2: [1 / 1.8, 1],
                yaxis2: [0, 0.9 / 1.9]
            });

            return Plotly.relayout(gd, {'grid.ygap': 0.3});
        })
        .then(function() {
            _assertDomains({
                xaxis: [0, 0.8 / 1.8],
                yaxis: [1 / 1.7, 1],
                xaxis2: [1 / 1.8, 1],
                yaxis2: [0, 0.7 / 1.7]
            });

            return Plotly.relayout(gd, {'grid.domain': {x: [0.2, 0.7], y: [0, 0.5]}});
        })
        .then(function() {
            _assertDomains({
                xaxis: [0.2, 0.2 + 0.4 / 1.8],
                yaxis: [0.5 / 1.7, 0.5],
                xaxis2: [0.2 + 0.5 / 1.8, 0.7],
                yaxis2: [0, 0.35 / 1.7]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('responds to xside and yside', function(done) {
        function checkAxis(axName, anchor, side, position) {
            var ax = gd._fullLayout[axName];
            expect(ax.anchor).toBe(anchor, axName);
            expect(ax.side).toBe(side, axName);
            expect(ax.position).toBe(position, axName);
        }

        Plotly.newPlot(gd,
            // leave some empty rows/columns
            makeData(['xy', 'x2y2']),
            {grid: {rows: 2, columns: 2}}
        )
        .then(function() {
            checkAxis('xaxis', 'y', 'bottom');
            checkAxis('yaxis', 'x', 'left');
            checkAxis('xaxis2', 'y2', 'bottom');
            checkAxis('yaxis2', 'x2', 'left');

            return Plotly.relayout(gd, {'grid.xside': 'top plot', 'grid.yside': 'right plot'});
        })
        .then(function() {
            checkAxis('xaxis', 'y', 'top');
            checkAxis('yaxis', 'x', 'right');
            checkAxis('xaxis2', 'y2', 'top');
            checkAxis('yaxis2', 'x2', 'right');

            return Plotly.relayout(gd, {'grid.xside': 'top', 'grid.yside': 'right'});
        })
        .then(function() {
            checkAxis('xaxis', 'free', 'top', 1);
            checkAxis('yaxis', 'free', 'right', 1);
            checkAxis('xaxis2', 'free', 'top', 1);
            checkAxis('yaxis2', 'free', 'right', 1);

            return Plotly.relayout(gd, {'grid.xside': 'bottom', 'grid.yside': 'left'});
        })
        .then(function() {
            checkAxis('xaxis', 'free', 'bottom', 0);
            checkAxis('yaxis', 'free', 'left', 0);
            checkAxis('xaxis2', 'free', 'bottom', 0);
            checkAxis('yaxis2', 'free', 'left', 0);
        })
        .catch(failTest)
        .then(done);
    });

    it('places other subplots in the grid by default', function(done) {
        function checkDomain(container, column, row, x, y) {
            var domain = container.domain;
            expect(domain.row).toBe(row);
            expect(domain.column).toBe(column);
            expect(domain.x).toBeCloseToArray(x, 3);
            expect(domain.y).toBeCloseToArray(y, 3);
        }
        Plotly.newPlot(gd, [{
            type: 'pie', labels: ['a', 'b'], values: [1, 2]
        }, {
            type: 'scattergeo', lon: [10, 20], lat: [20, 10]
        }], {
            grid: {rows: 2, columns: 2, xgap: 1 / 3, ygap: 1 / 3}
        })
        .then(function() {
            // defaults to cell (0, 0)
            // we're not smart enough to keep them from overlapping each other... should we try?
            checkDomain(gd._fullData[0], 0, 0, [0, 0.4], [0.6, 1]);
            checkDomain(gd._fullLayout.geo, 0, 0, [0, 0.4], [0.6, 1]);

            return Plotly.update(gd, {'domain.column': 1}, {'geo.domain.row': 1}, [0]);
        })
        .then(function() {
            // change row OR column, the other keeps its previous default
            checkDomain(gd._fullData[0], 1, 0, [0.6, 1], [0.6, 1]);
            checkDomain(gd._fullLayout.geo, 0, 1, [0, 0.4], [0, 0.4]);
        })
        .catch(failTest)
        .then(done);
    });
});
