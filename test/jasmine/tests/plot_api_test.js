var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Scatter = require('@src/traces/scatter');
var Bar = require('@src/traces/bar');
var Legend = require('@src/components/legend');
var pkg = require('../../../package.json');
var subroutines = require('@src/plot_api/subroutines');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test plot api', function() {
    'use strict';

    describe('Plotly.version', function() {
        it('should be the same as in the package.json', function() {
            expect(Plotly.version).toEqual(pkg.version);
        });
    });

    describe('Plotly.relayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should update the plot clipPath if the plot is resized', function(done) {

            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }], { width: 500, height: 500 })
                .then(function() {
                    return Plotly.relayout(gd, { width: 400, height: 400 });
                })
                .then(function() {
                    var uid = gd._fullLayout._uid;

                    var plotClip = document.getElementById('clip' + uid + 'xyplot'),
                        clipRect = plotClip.children[0],
                        clipWidth = +clipRect.getAttribute('width'),
                        clipHeight = +clipRect.getAttribute('height');

                    expect(clipWidth).toBe(240);
                    expect(clipHeight).toBe(220);
                })
                .then(done);
        });

        it('sets null values to their default', function(done) {
            var defaultWidth;
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
                .then(function() {
                    defaultWidth = gd._fullLayout.width;
                    return Plotly.relayout(gd, { width: defaultWidth - 25});
                })
                .then(function() {
                    expect(gd._fullLayout.width).toBe(defaultWidth - 25);
                    return Plotly.relayout(gd, { width: null });
                })
                .then(function() {
                    expect(gd._fullLayout.width).toBe(defaultWidth);
                })
                .then(done);
        });

        it('ignores undefined values', function(done) {
            var defaultWidth;
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
                .then(function() {
                    defaultWidth = gd._fullLayout.width;
                    return Plotly.relayout(gd, { width: defaultWidth - 25});
                })
                .then(function() {
                    expect(gd._fullLayout.width).toBe(defaultWidth - 25);
                    return Plotly.relayout(gd, { width: undefined });
                })
                .then(function() {
                    expect(gd._fullLayout.width).toBe(defaultWidth - 25);
                })
                .then(done);
        });
    });

    describe('Plotly.restyle', function() {
        beforeEach(function() {
            spyOn(PlotlyInternal, 'plot');
            spyOn(Plots, 'previousPromises');
            spyOn(Scatter, 'arraysToCalcdata');
            spyOn(Bar, 'arraysToCalcdata');
            spyOn(Plots, 'style');
            spyOn(Legend, 'draw');
        });

        function mockDefaultsAndCalc(gd) {
            Plots.supplyDefaults(gd);
            gd.calcdata = gd._fullData.map(function(trace) {
                return [{x: 1, y: 1, trace: trace}];
            });
        }

        it('calls Scatter.arraysToCalcdata and Plots.style on scatter styling', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };
            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'marker.color': 'red'});
            expect(Scatter.arraysToCalcdata).toHaveBeenCalled();
            expect(Bar.arraysToCalcdata).not.toHaveBeenCalled();
            expect(Plots.style).toHaveBeenCalled();
            expect(PlotlyInternal.plot).not.toHaveBeenCalled();
            // "docalc" deletes gd.calcdata - make sure this didn't happen
            expect(gd.calcdata).toBeDefined();
        });

        it('calls Bar.arraysToCalcdata and Plots.style on bar styling', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'bar'}],
                layout: {}
            };
            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'marker.color': 'red'});
            expect(Scatter.arraysToCalcdata).not.toHaveBeenCalled();
            expect(Bar.arraysToCalcdata).toHaveBeenCalled();
            expect(Plots.style).toHaveBeenCalled();
            expect(PlotlyInternal.plot).not.toHaveBeenCalled();
            expect(gd.calcdata).toBeDefined();
        });

        it('calls plot on xgap and ygap styling', function() {
            var gd = {
                data: [{z: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], showscale: false, type: 'heatmap'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'xgap': 2});
            expect(PlotlyInternal.plot).toHaveBeenCalled();

            Plotly.restyle(gd, {'ygap': 2});
            expect(PlotlyInternal.plot.calls.count()).toEqual(2);
        });

        it('ignores undefined values', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);

            // Check to see that the color is updated:
            Plotly.restyle(gd, {'marker.color': 'blue'});
            expect(gd._fullData[0].marker.color).toBe('blue');

            // Check to see that the color is unaffected:
            Plotly.restyle(gd, {'marker.color': undefined});
            expect(gd._fullData[0].marker.color).toBe('blue');
        });

        it('restores null values to defaults', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            var colorDflt = gd._fullData[0].marker.color;

            // Check to see that the color is updated:
            Plotly.restyle(gd, {'marker.color': 'blue'});
            expect(gd._fullData[0].marker.color).toBe('blue');

            // Check to see that the color is restored to the original default:
            Plotly.restyle(gd, {'marker.color': null});
            expect(gd._fullData[0].marker.color).toBe(colorDflt);
        });

        it('can target specific traces by leaving properties undefined', function() {
            var gd = {
                data: [
                    {x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'},
                    {x: [1, 2, 3], y: [3, 4, 5], type: 'scatter'}
                ],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            var colorDflt = [gd._fullData[0].marker.color, gd._fullData[1].marker.color];

            // Check only second trace's color has been changed:
            Plotly.restyle(gd, {'marker.color': [undefined, 'green']});
            expect(gd._fullData[0].marker.color).toBe(colorDflt[0]);
            expect(gd._fullData[1].marker.color).toBe('green');

            // Check both colors restored to the original default:
            Plotly.restyle(gd, {'marker.color': [null, null]});
            expect(gd._fullData[0].marker.color).toBe(colorDflt[0]);
            expect(gd._fullData[1].marker.color).toBe(colorDflt[1]);
        });

    });

    describe('Plotly.deleteTraces', function() {
        var gd;

        beforeEach(function() {
            gd = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };
            spyOn(PlotlyInternal, 'redraw');
        });

        it('should throw an error when indices are omitted', function() {

            expect(function() {
                Plotly.deleteTraces(gd);
            }).toThrow(new Error('indices must be an integer or array of integers.'));

        });

        it('should throw an error when indices are out of bounds', function() {

            expect(function() {
                Plotly.deleteTraces(gd, 10);
            }).toThrow(new Error('indices must be valid indices for gd.data.'));

        });

        it('should throw an error when indices are repeated', function() {

            expect(function() {
                Plotly.deleteTraces(gd, [0, 0]);
            }).toThrow(new Error('each index in indices must be unique.'));

        });

        it('should work when indices are negative', function() {
            var expectedData = [
                {'name': 'a'},
                {'name': 'b'},
                {'name': 'c'}
            ];

            Plotly.deleteTraces(gd, -1);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('should work when multiple traces are deleted', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'}
            ];

            Plotly.deleteTraces(gd, [0, 3]);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('should work when indices are not sorted', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'}
            ];

            Plotly.deleteTraces(gd, [3, 0]);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('should work with more than 10 indices', function() {
            gd.data = [];

            for(var i = 0; i < 20; i++) {
                gd.data.push({
                    name: 'trace #' + i
                });
            }

            var expectedData = [
                {name: 'trace #12'},
                {name: 'trace #13'},
                {name: 'trace #14'},
                {name: 'trace #15'},
                {name: 'trace #16'},
                {name: 'trace #17'},
                {name: 'trace #18'},
                {name: 'trace #19'}
            ];

            Plotly.deleteTraces(gd, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

    });

    describe('Plotly.addTraces', function() {
        var gd;

        beforeEach(function() {
            gd = { data: [{'name': 'a'}, {'name': 'b'}] };
            spyOn(PlotlyInternal, 'redraw');
            spyOn(PlotlyInternal, 'moveTraces');
        });

        it('should throw an error when traces is not an object or an array of objects', function() {
            var expected = JSON.parse(JSON.stringify(gd));
            expect(function() {
                Plotly.addTraces(gd, 1, 2);
            }).toThrowError(Error, 'all values in traces array must be non-array objects');

            expect(function() {
                Plotly.addTraces(gd, [{}, 4], 2);
            }).toThrowError(Error, 'all values in traces array must be non-array objects');

            expect(function() {
                Plotly.addTraces(gd, [{}, []], 2);
            }).toThrowError(Error, 'all values in traces array must be non-array objects');

            // make sure we didn't muck with gd.data if things failed!
            expect(gd).toEqual(expected);

        });

        it('should throw an error when traces and newIndices arrays are unequal', function() {

            expect(function() {
                Plotly.addTraces(gd, [{}, {}], 2);
            }).toThrowError(Error, 'if indices is specified, traces.length must equal indices.length');

        });

        it('should throw an error when newIndices are out of bounds', function() {
            var expected = JSON.parse(JSON.stringify(gd));

            expect(function() {
                Plotly.addTraces(gd, [{}, {}], [0, 10]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));

            // make sure we didn't muck with gd.data if things failed!
            expect(gd).toEqual(expected);
        });

        it('should work when newIndices is undefined', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(gd.data[3].uid).toBeDefined();
            expect(PlotlyInternal.redraw).toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).not.toHaveBeenCalled();
        });

        it('should work when newIndices is defined', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [1, 3]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(gd.data[3].uid).toBeDefined();
            expect(PlotlyInternal.redraw).not.toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [1, 3]);

        });

        it('should work when newIndices has negative indices', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [-3, -1]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(gd.data[3].uid).toBeDefined();
            expect(PlotlyInternal.redraw).not.toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [-3, -1]);

        });

        it('should work when newIndices is an integer', function() {
            Plotly.addTraces(gd, {'name': 'c'}, 0);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(PlotlyInternal.redraw).not.toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).toHaveBeenCalledWith(gd, [-1], [0]);

        });
    });

    describe('Plotly.moveTraces should', function() {
        var gd;
        beforeEach(function() {
            gd = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
                ]
            };
            spyOn(PlotlyInternal, 'redraw');
        });

        it('throw an error when index arrays are unequal', function() {
            expect(function() {
                Plotly.moveTraces(gd, [1], [2, 1]);
            }).toThrow(new Error('current and new indices must be of equal length.'));
        });

        it('throw an error when gd.data isn\'t an array.', function() {
            expect(function() {
                Plotly.moveTraces({}, [0], [0]);
            }).toThrow(new Error('gd.data must be an array.'));
            expect(function() {
                Plotly.moveTraces({data: 'meow'}, [0], [0]);
            }).toThrow(new Error('gd.data must be an array.'));
        });

        it('thow an error when a current index is out of bounds', function() {
            expect(function() {
                Plotly.moveTraces(gd, [-gd.data.length - 1], [0]);
            }).toThrow(new Error('currentIndices must be valid indices for gd.data.'));
            expect(function() {
                Plotly.moveTraces(gd, [gd.data.length], [0]);
            }).toThrow(new Error('currentIndices must be valid indices for gd.data.'));
        });

        it('thow an error when a new index is out of bounds', function() {
            expect(function() {
                Plotly.moveTraces(gd, [0], [-gd.data.length - 1]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));
            expect(function() {
                Plotly.moveTraces(gd, [0], [gd.data.length]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));
        });

        it('thow an error when current indices are repeated', function() {
            expect(function() {
                Plotly.moveTraces(gd, [0, 0], [0, 1]);
            }).toThrow(new Error('each index in currentIndices must be unique.'));

            // note that both positive and negative indices are accepted!
            expect(function() {
                Plotly.moveTraces(gd, [0, -gd.data.length], [0, 1]);
            }).toThrow(new Error('each index in currentIndices must be unique.'));
        });

        it('thow an error when new indices are repeated', function() {
            expect(function() {
                Plotly.moveTraces(gd, [0, 1], [0, 0]);
            }).toThrow(new Error('each index in newIndices must be unique.'));

            // note that both positive and negative indices are accepted!
            expect(function() {
                Plotly.moveTraces(gd, [0, 1], [-gd.data.length, 0]);
            }).toThrow(new Error('each index in newIndices must be unique.'));
        });

        it('accept integers in place of arrays', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'a'},
                {'name': 'c'},
                {'name': 'd'}
            ];

            Plotly.moveTraces(gd, 0, 1);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('handle unsorted currentIndices', function() {
            var expectedData = [
                {'name': 'd'},
                {'name': 'a'},
                {'name': 'c'},
                {'name': 'b'}
            ];

            Plotly.moveTraces(gd, [3, 1], [0, 3]);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('work when newIndices are undefined.', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'},
                {'name': 'd'},
                {'name': 'a'}
            ];

            Plotly.moveTraces(gd, [3, 0]);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('accept negative indices.', function() {
            var expectedData = [
                {'name': 'a'},
                {'name': 'c'},
                {'name': 'b'},
                {'name': 'd'}
            ];

            Plotly.moveTraces(gd, 1, -2);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });
    });


    describe('Plotly.ExtendTraces', function() {
        var gd;

        beforeEach(function() {
            gd = {
                data: [
                    {x: [0, 1, 2], marker: {size: [3, 2, 1]}},
                    {x: [1, 2, 3], marker: {size: [2, 3, 4]}}
                ]
            };

            if(!Plotly.Queue) {
                Plotly.Queue = {
                    add: function() {},
                    startSequence: function() {},
                    endSequence: function() {}
                };
            }

            spyOn(PlotlyInternal, 'redraw');
            spyOn(Plotly.Queue, 'add');
        });

        it('should throw an error when gd.data isn\'t an array.', function() {

            expect(function() {
                Plotly.extendTraces({}, {x: [[1]]}, [0]);
            }).toThrow(new Error('gd.data must be an array'));

            expect(function() {
                Plotly.extendTraces({data: 'meow'}, {x: [[1]]}, [0]);
            }).toThrow(new Error('gd.data must be an array'));

        });

        it('should throw an error when update is not an object', function() {

            expect(function() {
                Plotly.extendTraces(gd, undefined, [0], 8);
            }).toThrow(new Error('update must be a key:value object'));

            expect(function() {
                Plotly.extendTraces(gd, null, [0]);
            }).toThrow(new Error('update must be a key:value object'));

        });


        it('should throw an error when indices are omitted', function() {

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]});
            }).toThrow(new Error('indices must be an integer or array of integers'));

        });

        it('should throw an error when a current index is out of bounds', function() {

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [-gd.data.length - 1]);
            }).toThrow(new Error('indices must be valid indices for gd.data.'));

        });

        it('should not throw an error when negative index wraps to positive', function() {

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [-1]);
            }).not.toThrow();

        });

        it('should throw an error when number of Indices does not match Update arrays', function() {

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1, 2], [2, 3]] }, [0]);
            }).toThrow(new Error('attribute x must be an array of length equal to indices array length'));

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [0, 1]);
            }).toThrow(new Error('attribute x must be an array of length equal to indices array length'));

        });

        it('should throw an error when maxPoints is an Object but does not match Update', function() {

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [0], {y: [1]});
            }).toThrow(new Error('when maxPoints is set as a key:value object it must contain a 1:1 ' +
                                 'corrispondence with the keys and number of traces in the update object'));

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [0], {x: [1, 2]});
            }).toThrow(new Error('when maxPoints is set as a key:value object it must contain a 1:1 ' +
                                 'corrispondence with the keys and number of traces in the update object'));

        });

        it('should throw an error when update keys mismatch trace keys', function() {

            // lets update y on both traces, but only 1 trace has "y"
            gd.data[1].y = [1, 2, 3];

            expect(function() {
                Plotly.extendTraces(gd, {
                    y: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
                }, [0, 1]);
            }).toThrow(new Error('cannot extend missing or non-array attribute: y'));

        });

        it('should extend traces with update keys', function() {

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).toEqual([
                {x: [0, 1, 2, 3, 4], marker: {size: [3, 2, 1, 0, -1]}},
                {x: [1, 2, 3, 4, 5], marker: {size: [2, 3, 4, 5, 6]}}
            ]);

            expect(PlotlyInternal.redraw).toHaveBeenCalled();
        });

        it('should extend and window traces with update keys', function() {
            var maxPoints = 3;

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).toEqual([
                {x: [2, 3, 4], marker: {size: [1, 0, -1]}},
                {x: [3, 4, 5], marker: {size: [4, 5, 6]}}
            ]);
        });

        it('should extend and window traces with update keys', function() {
            var maxPoints = 3;

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).toEqual([
                {x: [2, 3, 4], marker: {size: [1, 0, -1]}},
                {x: [3, 4, 5], marker: {size: [4, 5, 6]}}
            ]);
        });

        it('should extend and window traces using full maxPoint object', function() {
            var maxPoints = {x: [2, 3], 'marker.size': [1, 2]};

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).toEqual([
                {x: [3, 4], marker: {size: [-1]}},
                {x: [3, 4, 5], marker: {size: [5, 6]}}
            ]);
        });

        it('should truncate arrays when maxPoints is zero', function() {

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], 0);

            expect(gd.data).toEqual([
                {x: [], marker: {size: []}},
                {x: [], marker: {size: []}}
            ]);

            expect(PlotlyInternal.redraw).toHaveBeenCalled();
        });

        it('prepend is the inverse of extend - no maxPoints', function() {
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).not.toEqual(cachedData);
            expect(Plotly.Queue.add).toHaveBeenCalled();

            var undoArgs = Plotly.Queue.add.calls.first().args[2];

            Plotly.prependTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
        });


        it('extend is the inverse of prepend - no maxPoints', function() {
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.prependTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).not.toEqual(cachedData);
            expect(Plotly.Queue.add).toHaveBeenCalled();

            var undoArgs = Plotly.Queue.add.calls.first().args[2];

            Plotly.extendTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
        });


        it('prepend is the inverse of extend - with maxPoints', function() {
            var maxPoints = 3;
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).not.toEqual(cachedData);
            expect(Plotly.Queue.add).toHaveBeenCalled();

            var undoArgs = Plotly.Queue.add.calls.first().args[2];

            Plotly.prependTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
        });
    });

    describe('Plotly.purge', function() {

        afterEach(destroyGraphDiv);

        it('should return the graph div in its original state', function(done) {
            var gd = createGraphDiv();
            var initialKeys = Object.keys(gd);
            var intialHTML = gd.innerHTML;
            var mockData = [{ x: [1, 2, 3], y: [2, 3, 4] }];

            Plotly.plot(gd, mockData).then(function() {
                Plotly.purge(gd);

                expect(Object.keys(gd)).toEqual(initialKeys);
                expect(gd.innerHTML).toEqual(intialHTML);

                done();
            });
        });
    });

    describe('Plotly.redraw', function() {

        afterEach(destroyGraphDiv);

        it('', function(done) {
            var gd = createGraphDiv(),
                initialData = [],
                layout = { title: 'Redraw' };

            Plotly.newPlot(gd, initialData, layout);

            var trace1 = {
                x: [1, 2, 3, 4],
                y: [4, 1, 5, 3],
                name: 'First Trace'
            };
            var trace2 = {
                x: [1, 2, 3, 4],
                y: [14, 11, 15, 13],
                name: 'Second Trace'
            };
            var trace3 = {
                x: [1, 2, 3, 4],
                y: [5, 3, 7, 1],
                name: 'Third Trace'
            };

            var newData = [trace1, trace2, trace3];
            gd.data = newData;

            Plotly.redraw(gd).then(function() {
                expect(d3.selectAll('g.trace.scatter').size()).toEqual(3);
            })
            .then(done);
        });
    });

    describe('cleanData', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should rename \'YIGnBu\' colorscales YlGnBu (2dMap case)', function() {
            var data = [{
                type: 'heatmap',
                colorscale: 'YIGnBu'
            }];

            Plotly.plot(gd, data);
            expect(gd.data[0].colorscale).toBe('YlGnBu');
        });

        it('should rename \'YIGnBu\' colorscales YlGnBu (markerColorscale case)', function() {
            var data = [{
                type: 'scattergeo',
                marker: { colorscale: 'YIGnBu' }
            }];

            Plotly.plot(gd, data);
            expect(gd.data[0].marker.colorscale).toBe('YlGnBu');
        });

        it('should rename \'YIOrRd\' colorscales YlOrRd (2dMap case)', function() {
            var data = [{
                type: 'contour',
                colorscale: 'YIOrRd'
            }];

            Plotly.plot(gd, data);
            expect(gd.data[0].colorscale).toBe('YlOrRd');
        });

        it('should rename \'YIOrRd\' colorscales YlOrRd (markerColorscale case)', function() {
            var data = [{
                type: 'scattergeo',
                marker: { colorscale: 'YIOrRd' }
            }];

            Plotly.plot(gd, data);
            expect(gd.data[0].marker.colorscale).toBe('YlOrRd');
        });

        it('should rename \'highlightColor\' to \'highlightcolor\')', function() {
            var data = [{
                type: 'surface',
                contours: {
                    x: { highlightColor: 'red' },
                    y: { highlightcolor: 'blue' }
                }
            }, {
                type: 'surface'
            }, {
                type: 'surface',
                contours: false
            }, {
                type: 'surface',
                contours: {
                    stuff: {},
                    x: false,
                    y: []
                }
            }];

            spyOn(Plots.subplotsRegistry.gl3d, 'plot');

            Plotly.plot(gd, data);

            expect(Plots.subplotsRegistry.gl3d.plot).toHaveBeenCalled();

            var contours = gd.data[0].contours;

            expect(contours.x.highlightColor).toBeUndefined();
            expect(contours.x.highlightcolor).toEqual('red');
            expect(contours.y.highlightcolor).toEqual('blue');
            expect(contours.z).toBeUndefined();

            expect(gd.data[1].contours).toBeUndefined();
            expect(gd.data[2].contours).toBe(false);
            expect(gd.data[3].contours).toEqual({ stuff: {}, x: false, y: [] });
        });

        it('should rename \'highlightWidth\' to \'highlightwidth\')', function() {
            var data = [{
                type: 'surface',
                contours: {
                    z: { highlightwidth: 'red' },
                    y: { highlightWidth: 'blue' }
                }
            }, {
                type: 'surface'
            }];

            spyOn(Plots.subplotsRegistry.gl3d, 'plot');

            Plotly.plot(gd, data);

            expect(Plots.subplotsRegistry.gl3d.plot).toHaveBeenCalled();

            var contours = gd.data[0].contours;

            expect(contours.x).toBeUndefined();
            expect(contours.y.highlightwidth).toEqual('blue');
            expect(contours.z.highlightWidth).toBeUndefined();
            expect(contours.z.highlightwidth).toEqual('red');

            expect(gd.data[1].contours).toBeUndefined();
        });
    });

    describe('Plotly.update should', function() {
        var gd, data, layout, calcdata;

        beforeAll(function() {
            Object.keys(subroutines).forEach(function(k) {
                spyOn(subroutines, k).and.callThrough();
            });
        });

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, [{ y: [2, 1, 2] }]).then(function() {
                data = gd.data;
                layout = gd.layout;
                calcdata = gd.calcdata;
                done();
            });
        });

        afterEach(destroyGraphDiv);

        it('call doTraceStyle on trace style updates', function(done) {
            expect(subroutines.doTraceStyle).not.toHaveBeenCalled();

            Plotly.update(gd, { 'marker.color': 'blue' }).then(function() {
                expect(subroutines.doTraceStyle).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
                done();
            });
        });

        it('clear calcdata on data updates', function(done) {
            Plotly.update(gd, { x: [[3, 1, 3]] }).then(function() {
                expect(data).toBe(gd.data);
                expect(layout).toBe(gd.layout);
                expect(calcdata).not.toBe(gd.calcdata);
                done();
            });
        });

        it('clear calcdata on data + axis updates w/o extending current gd.data', function(done) {
            var traceUpdate = {
                x: [[3, 1, 3]]
            };

            var layoutUpdate = {
                xaxis: {title: 'A', type: '-'}
            };

            Plotly.update(gd, traceUpdate, layoutUpdate).then(function() {
                expect(data).toBe(gd.data);
                expect(layout).toBe(gd.layout);
                expect(calcdata).not.toBe(gd.calcdata);

                expect(gd.data.length).toEqual(1);

                done();
            });
        });

        it('call doLegend on legend updates', function(done) {
            expect(subroutines.doLegend).not.toHaveBeenCalled();

            Plotly.update(gd, {}, { 'showlegend': true }).then(function() {
                expect(subroutines.doLegend).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
                done();
            });
        });

        it('call layoutReplot when adding update menu', function(done) {
            expect(subroutines.layoutReplot).not.toHaveBeenCalled();

            var layoutUpdate = {
                updatemenus: [{
                    buttons: [{
                        method: 'relayout',
                        args: ['title', 'Hello World']
                    }]
                }]
            };

            Plotly.update(gd, {}, layoutUpdate).then(function() {
                expect(subroutines.doLegend).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
                done();
            });
        });

        it('call doModeBar when updating \'dragmode\'', function(done) {
            expect(subroutines.doModeBar).not.toHaveBeenCalled();

            Plotly.update(gd, {}, { 'dragmode': 'pan' }).then(function() {
                expect(subroutines.doModeBar).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
                done();
            });
        });
    });
});
