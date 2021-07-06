var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customAssertions = require('../assets/custom_assertions');


var assertDims = customAssertions.assertDims;
var assertStyle = customAssertions.assertStyle;


function supplyDataDefaults(dataIn, dataOut) {
    return Plots.supplyDataDefaults(dataIn, dataOut, {}, {
        _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']},
        _modules: [],
        _visibleModules: [],
        _basePlotModules: [],
        _traceUids: dataIn.map(function() { return Lib.randstr(); })
    });
}

describe('groupby', function() {
    describe('one-to-many transforms:', function() {
        'use strict';

        var mockData0 = [{
            mode: 'markers',
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [{
                type: 'groupby',
                groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                styles: [
                    {target: 'a', value: {marker: {color: 'red'}}},
                    {target: 'b', value: {marker: {color: 'blue'}}}
                ]
            }]
        }];

        var mockData1 = [Lib.extendDeep({}, mockData0[0]), {
            mode: 'markers',
            x: [20, 11, 12, 0, 1, 2, 3],
            y: [1, 2, 3, 2, 5, 2, 0],
            transforms: [{
                type: 'groupby',
                groups: ['b', 'a', 'b', 'b', 'b', 'a', 'a'],
                styles: [
                    {target: 'a', value: {marker: {color: 'green'}}},
                    {target: 'b', value: {marker: {color: 'black'}}}
                ]
            }]
        }];

        var mockDataWithTypedArrayGroups = [{
            mode: 'markers',
            x: [20, 11, 12, 0, 1, 2, 3],
            y: [1, 2, 3, 2, 5, 2, 0],
            transforms: [{
                type: 'groupby',
                groups: new Uint8Array([2, 1, 2, 2, 2, 1, 1]),
                styles: [
                    {target: 1, value: {marker: {color: 'green'}}},
                    {target: 2, value: {marker: {color: 'black'}}}
                ]
            }]
        }];

        afterEach(destroyGraphDiv);

        it('Plotly.newPlot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData0);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(2);
                expect(gd._fullData[0].x).toEqual([1, -1, 0, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 1, 1]);
                expect(gd._fullData[0].transforms[0]._indexToPoints).toEqual({0: [0], 1: [1], 2: [3], 3: [6]});
                expect(gd._fullData[1].x).toEqual([-2, 1, 2]);
                expect(gd._fullData[1].y).toEqual([3, 2, 3]);
                expect(gd._fullData[1].transforms[0]._indexToPoints).toEqual({0: [2], 1: [4], 2: [5]});

                assertDims([4, 3]);
            })
            .then(done, done.fail);
        });

        it('Accepts deprecated object notation for styles', function(done) {
            var oldStyleMockData = [{
                mode: 'markers',
                x: [1, -1, -2, 0, 1, 2, 3],
                y: [1, 2, 3, 1, 2, 3, 1],
                transforms: [{
                    type: 'groupby',
                    groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                    styles: {
                        a: {marker: {color: 'red'}},
                        b: {marker: {color: 'blue'}}
                    }
                }]
            }];
            var data = Lib.extendDeep([], oldStyleMockData);
            data[0].marker = { size: 20 };

            var gd = createGraphDiv();
            var dims = [4, 3];

            Plotly.newPlot(gd, data).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [1, 1]
                );

                return Plotly.restyle(gd, 'marker.opacity', 0.4);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [0.4, 0.4]
                );

                expect(gd._fullData[0].marker.opacity).toEqual(0.4);
                expect(gd._fullData[1].marker.opacity).toEqual(0.4);

                return Plotly.restyle(gd, 'marker.opacity', 1);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [1, 1]
                );

                expect(gd._fullData[0].marker.opacity).toEqual(1);
                expect(gd._fullData[1].marker.opacity).toEqual(1);
            })
            .then(done, done.fail);

            // The final test for restyle updates using deprecated syntax
            // is omitted since old style syntax is *only* sanitized on
            // initial plot, *not* on restyle.
        });

        it('Plotly.restyle should work', function(done) {
            var data = Lib.extendDeep([], mockData0);
            data[0].marker = { size: 20 };

            var gd = createGraphDiv();
            var dims = [4, 3];

            Plotly.newPlot(gd, data).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [1, 1]
                );

                return Plotly.restyle(gd, 'marker.opacity', 0.4);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [0.4, 0.4]
                );

                expect(gd._fullData[0].marker.opacity).toEqual(0.4);
                expect(gd._fullData[1].marker.opacity).toEqual(0.4);

                return Plotly.restyle(gd, 'marker.opacity', 1);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [1, 1]
                );

                expect(gd._fullData[0].marker.opacity).toEqual(1);
                expect(gd._fullData[1].marker.opacity).toEqual(1);

                return Plotly.restyle(gd, {
                    'transforms[0].styles': [[
                        {target: 'a', value: {marker: {color: 'green'}}},
                        {target: 'b', value: {marker: {color: 'red'}}}
                    ]],
                    'marker.opacity': 0.4
                });
            }).then(function() {
                assertStyle(dims,
                    ['rgb(0, 128, 0)', 'rgb(255, 0, 0)'],
                    [0.4, 0.4]
                );
            })
            .then(done, done.fail);
        });

        it('Plotly.react should work', function(done) {
            var data = Lib.extendDeep([], mockData0);
            data[0].marker = { size: 20 };

            var gd = createGraphDiv();
            var dims = [4, 3];

            Plotly.newPlot(gd, data).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [1, 1]
                );

                gd.data[0].marker.opacity = 0.4;
                // contrived test of relinkPrivateKeys
                // we'll have to do better if we refactor it to opt-in instead of catchall
                gd._fullData[0].marker._boo = 'here I am';
                return Plotly.react(gd, gd.data, gd.layout);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [0.4, 0.4]
                );

                expect(gd._fullData[0].marker.opacity).toEqual(0.4);
                expect(gd._fullData[1].marker.opacity).toEqual(0.4);
                expect(gd._fullData[0].marker._boo).toBe('here I am');

                gd.data[0].marker.opacity = 1;
                return Plotly.react(gd, gd.data, gd.layout);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                    [1, 1]
                );

                expect(gd._fullData[0].marker.opacity).toEqual(1);
                expect(gd._fullData[1].marker.opacity).toEqual(1);

                // edit just affects the first group
                gd.data[0].transforms[0].styles[0].value.marker.color = 'green';
                return Plotly.react(gd, gd.data, gd.layout);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(0, 128, 0)', 'rgb(0, 0, 255)'],
                    [1, 1]
                );

                expect(gd._fullData[0].marker.opacity).toEqual(1);
                expect(gd._fullData[1].marker.opacity).toEqual(1);

                // edit just affects the second group
                gd.data[0].transforms[0].styles[1].value.marker.color = 'red';
                return Plotly.react(gd, gd.data, gd.layout);
            }).then(function() {
                assertStyle(dims,
                    ['rgb(0, 128, 0)', 'rgb(255, 0, 0)'],
                    [1, 1]
                );
            })
            .then(done, done.fail);
        });

        it('Plotly.extendTraces should work', function(done) {
            var data = Lib.extendDeep([], mockData0);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd.data[0].x.length).toEqual(7);
                expect(gd._fullData[0].x.length).toEqual(4);
                expect(gd._fullData[1].x.length).toEqual(3);

                assertDims([4, 3]);

                return Plotly.extendTraces(gd, {
                    x: [ [-3, 4, 5] ],
                    y: [ [1, -2, 3] ],
                    'transforms[0].groups': [ ['b', 'a', 'b'] ]
                }, [0]);
            }).then(function() {
                expect(gd.data[0].x.length).toEqual(10);
                expect(gd._fullData[0].x.length).toEqual(5);
                expect(gd._fullData[1].x.length).toEqual(5);

                assertDims([5, 5]);
            })
            .then(done, done.fail);
        });

        it('Plotly.deleteTraces should work', function(done) {
            var data = Lib.extendDeep([], mockData1);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                assertDims([4, 3, 4, 3]);

                return Plotly.deleteTraces(gd, [1]);
            }).then(function() {
                assertDims([4, 3]);

                return Plotly.deleteTraces(gd, [0]);
            }).then(function() {
                assertDims([]);
            })
            .then(done, done.fail);
        });

        it('toggling trace visibility should work', function(done) {
            var data = Lib.extendDeep([], mockData1);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                assertDims([4, 3, 4, 3]);

                return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
            }).then(function() {
                assertDims([4, 3]);

                return Plotly.restyle(gd, 'visible', false, [0]);
            }).then(function() {
                assertDims([]);

                return Plotly.restyle(gd, 'visible', [true, true], [0, 1]);
            }).then(function() {
                assertDims([4, 3, 4, 3]);
            })
            .then(done, done.fail);
        });

        it('Plotly.newPlot should group points properly using typed array', function(done) {
            var data = Lib.extendDeep([], mockDataWithTypedArrayGroups);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd._fullData.length).toEqual(2);
                expect(gd._fullData[0].x).toEqual([20, 12, 0, 1]);
                expect(gd._fullData[0].y).toEqual([1, 3, 2, 5]);
                expect(gd._fullData[1].x).toEqual([11, 2, 3]);
                expect(gd._fullData[1].y).toEqual([2, 2, 0]);
            })
            .then(done, done.fail);
        });
    });

    describe('many-to-many transforms', function() {
        it('varies the color for each expanded trace', function() {
            var uniqueColors = {};
            var dataOut = [];
            var dataIn = [{
                y: [1, 2, 3],
                transforms: [
                    {type: 'filter', operation: '<', value: 4},
                    {type: 'groupby', groups: ['a', 'b', 'c']}
                ]
            }, {
                y: [4, 5, 6],
                transforms: [
                    {type: 'filter', operation: '<', value: 4},
                    {type: 'groupby', groups: ['a', 'b', 'b']}
                ]
            }];

            supplyDataDefaults(dataIn, dataOut);

            for(var i = 0; i < dataOut.length; i++) {
                uniqueColors[dataOut[i].marker.color] = true;
            }

            // Confirm that five total colors exist:
            expect(Object.keys(uniqueColors).length).toEqual(5);
        });
    });


    // these tests can be shortened, once the meaning of edge cases gets clarified
    describe('symmetry/degeneracy testing of one-to-many transforms on arbitrary arrays where there is no grouping (implicit 1):', function() {
        'use strict';

        var mockData = [{
            mode: 'markers',
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],

            // everything is present:
            transforms: [{
                type: 'groupby',
                groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                styles: [
                    {target: 'a', value: {marker: {color: 'red'}}},
                    {target: 'b', value: {marker: {color: 'blue'}}}
                ]
            }]
        }];

        var mockData0 = [{
            mode: 'markers',
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],

            // groups, styles not present
            transforms: [{
                type: 'groupby'
                // groups not present
                // styles not present
            }]
        }];

        // transform attribute with empty list
        var mockData1 = [{
            mode: 'markers',
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],

            // transforms is present but there are no items in it
            transforms: [ /* list is empty */ ]
        }];

        // transform attribute with null value
        var mockData2 = [{
            mode: 'markers',
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: null
        }];

        // no transform is present at all
        var mockData3 = [{
            mode: 'markers',
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1]
        }];

        afterEach(destroyGraphDiv);

        it('Plotly.newPlot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(2); // two groups
                expect(gd._fullData[0].x).toEqual([1, -1, 0, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 1, 1]);
                expect(gd._fullData[1].x).toEqual([-2, 1, 2]);
                expect(gd._fullData[1].y).toEqual([3, 2, 3]);

                assertDims([4, 3]);
            })
            .then(done, done.fail);
        });

        it('Plotly.newPlot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData0);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);
                assertDims([7]);
            })
            .then(done, done.fail);
        });

        it('Plotly.newPlot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData1);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);
                expect(gd._fullData[0].x).toEqual([ 1, -1, -2, 0, 1, 2, 3 ]);
                expect(gd._fullData[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                assertDims([7]);
            })
            .then(done, done.fail);
        });

        it('Plotly.newPlot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData2);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);

                expect(gd._fullData[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                assertDims([7]);
            })
            .then(done, done.fail);
        });

        it('Plotly.newPlot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData3);

            var gd = createGraphDiv();

            Plotly.newPlot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);

                expect(gd._fullData[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                assertDims([7]);
            })
            .then(done, done.fail);
        });
    });

    describe('grouping with basic, heterogenous and overridden attributes', function() {
        'use strict';

        afterEach(destroyGraphDiv);

        function test(mockData) {
            return function(done) {
                var data = Lib.extendDeep([], mockData);

                var gd = createGraphDiv();

                Plotly.newPlot(gd, data).then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(gd.data[0].ids).toEqual(['q', 'w', 'r', 't', 'y', 'u', 'i']);
                    expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                    expect(gd.data[0].y).toEqual([0, 1, 2, 3, 5, 4, 6]);
                    expect(gd.data[0].marker.line.width).toEqual([4, 2, 4, 2, 2, 3, 3]);

                    expect(gd._fullData.length).toEqual(2);

                    expect(gd._fullData[0].ids).toEqual(['q', 'w', 't', 'i']);
                    expect(gd._fullData[0].x).toEqual([1, -1, 0, 3]);
                    expect(gd._fullData[0].y).toEqual([0, 1, 3, 6]);
                    expect(gd._fullData[0].marker.line.width).toEqual([4, 2, 2, 3]);


                    expect(gd._fullData[1].ids).toEqual(['r', 'y', 'u']);
                    expect(gd._fullData[1].x).toEqual([-2, 1, 2]);
                    expect(gd._fullData[1].y).toEqual([2, 5, 4]);
                    expect(gd._fullData[1].marker.line.width).toEqual([4, 2, 3]);

                    assertDims([4, 3]);
                })
                .then(done, done.fail);
            };
        }

        // basic test
        var mockData1 = [{
            mode: 'markers',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {line: {width: [4, 2, 4, 2, 2, 3, 3]}},
            transforms: [{
                type: 'groupby',
                groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                styles: [
                    {target: 'a', value: {marker: {color: 'red'}}},
                    {target: 'b', value: {marker: {color: 'blue'}}}
                ]
            }]
        }];

        // heterogenously present attributes
        var mockData2 = [{
            mode: 'markers',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {line: {width: [4, 2, 4, 2, 2, 3, 3]}},
            transforms: [{
                type: 'groupby',
                groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                styles: [{
                    target: 'a',
                    value: {
                        marker: {
                            color: 'orange',
                            size: 20,
                            line: {
                                color: 'red'
                            }
                        }
                    }
                }, {
                    target: 'b',
                    value: {
                        mode: 'markers+lines', // heterogeonos attributes are OK: group 'a' doesn't need to define this
                        marker: {
                            color: 'cyan',
                            size: 15,
                            line: {
                                color: 'purple'
                            },
                            opacity: 0.5,
                            symbol: 'triangle-up'
                        },
                        line: {
                            color: 'purple'
                        }
                    }
                }]
            }]
        }];

        // attributes set at top level and partially overridden in the group item level
        var mockData3 = [{
            mode: 'markers+lines',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {
                color: 'darkred', // general 'default' color
                line: {
                    width: [4, 2, 4, 2, 2, 3, 3],
                    color: ['orange', 'red', 'green', 'cyan', 'magenta', 'blue', 'pink']
                }
            },
            line: {color: 'red'},
            transforms: [{
                type: 'groupby',
                groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                styles: [{
                    target: 'a',
                    value: {marker: {size: 30}}
                }, {
                    // override general color:
                    target: 'b',
                    value: {marker: {size: 15, line: {color: 'yellow'}}, line: {color: 'purple'}}
                }]
            }]
        }];

        var mockData4 = [{
            mode: 'markers+lines',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {line: {width: [4, 2, 4, 2, 2, 3, 3]}},
            transforms: [{
                type: 'groupby',
                groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                styles: [/* can be empty, or of partial group id coverage */]
            }]
        }];

        var mockData5 = [{
            mode: 'markers+lines',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {
                line: {width: [4, 2, 4, 2, 2, 3, 3]},
                size: 10,
                color: ['red', '#eee', 'lightgreen', 'blue', 'red', '#eee', 'lightgreen']
            },
            transforms: [{
                type: 'groupby',
                groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a']
            }]
        }];

        it('`data` preserves user supplied input but `gd._fullData` reflects the grouping', test(mockData1));

        it('passes with lots of attributes and heterogenous attrib presence', test(mockData2));

        it('passes with group styles partially overriding top level aesthetics', test(mockData3));
        it('passes extended tests with group styles partially overriding top level aesthetics', function(done) {
            var data = Lib.extendDeep([], mockData3);
            var gd = createGraphDiv();
            Plotly.newPlot(gd, data).then(function() {
                expect(gd._fullData[0].marker.line.color).toEqual(['orange', 'red', 'cyan', 'pink']);
                expect(gd._fullData[1].marker.line.color).toEqual('yellow');
            })
            .then(done, done.fail);
        });

        it('passes with no explicit styling for the individual group', test(mockData4));

        it('passes with no explicit styling in the group transform at all', test(mockData5));
    });

    describe('passes with no `groups`', function() {
        'use strict';

        afterEach(destroyGraphDiv);

        function test(mockData) {
            return function(done) {
                var data = Lib.extendDeep([], mockData);

                var gd = createGraphDiv();

                Plotly.newPlot(gd, data).then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(gd.data[0].ids).toEqual(['q', 'w', 'r', 't', 'y', 'u', 'i']);
                    expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                    expect(gd.data[0].y).toEqual([0, 1, 2, 3, 5, 4, 6]);
                    expect(gd.data[0].marker.line.width).toEqual([4, 2, 4, 2, 2, 3, 3]);

                    expect(gd._fullData.length).toEqual(1);

                    expect(gd._fullData[0].ids).toEqual(['q', 'w', 'r', 't', 'y', 'u', 'i']);
                    expect(gd._fullData[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                    expect(gd._fullData[0].y).toEqual([0, 1, 2, 3, 5, 4, 6]);
                    expect(gd._fullData[0].marker.line.width).toEqual([4, 2, 4, 2, 2, 3, 3]);

                    assertDims([7]);
                })
                .then(done, done.fail);
            };
        }

        var mockData0 = [{
            mode: 'markers+lines',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {size: 20, line: {width: [4, 2, 4, 2, 2, 3, 3]}},
            transforms: [{
                type: 'groupby',
                // groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
                styles: [
                    {target: 'a', value: {marker: {color: 'red'}}},
                    {target: 'b', value: {marker: {color: 'blue'}}}
                ]
            }]
        }];

        var mockData1 = [{
            mode: 'markers+lines',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {size: 20, line: {width: [4, 2, 4, 2, 2, 3, 3]}},
            transforms: [{
                type: 'groupby',
                groups: [],
                styles: [
                    {target: 'a', value: {marker: {color: 'red'}}},
                    {target: 'b', value: {marker: {color: 'blue'}}}
                ]
            }]
        }];

        var mockData2 = [{
            mode: 'markers+lines',
            ids: ['q', 'w', 'r', 't', 'y', 'u', 'i'],
            x: [1, -1, -2, 0, 1, 2, 3],
            y: [0, 1, 2, 3, 5, 4, 6],
            marker: {size: 20, line: {width: [4, 2, 4, 2, 2, 3, 3]}},
            transforms: [{
                type: 'groupby',
                groups: null,
                styles: [
                    {target: 'a', value: {marker: {color: 'red'}}},
                    {target: 'b', value: {marker: {color: 'blue'}}}
                ]
            }]
        }];

        it('passes with no groups', test(mockData0));
        it('passes with empty groups', test(mockData1));
        it('passes with falsey groups', test(mockData2));
    });

    describe('expanded trace coloring', function() {
        it('assigns unique colors to each group', function() {
            var colors = [];
            var dataOut = [];
            var dataIn = [{
                y: [1, 2, 3],
                transforms: [
                    {type: 'filter', operation: '<', value: 4},
                    {type: 'groupby', groups: ['a', 'b', 'c']}
                ]
            }, {
                y: [4, 5, 6],
                transforms: [
                    {type: 'filter', operation: '<', value: 4},
                    {type: 'groupby', groups: ['a', 'b', 'b']}
                ]
            }];

            supplyDataDefaults(dataIn, dataOut);

            for(var i = 0; i < dataOut.length; i++) {
                colors.push(dataOut[i].marker.color);
            }

            expect(colors).toEqual([
                '#1f77b4',
                '#ff7f0e',
                '#2ca02c',
                '#d62728',
                '#9467bd'
            ]);
        });
    });
});
