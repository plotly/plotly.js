var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var assertDims = require('../assets/assert_dims');
var assertStyle = require('../assets/assert_style');

Plotly.register([
    require('@src/transforms/groupby')
]);

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
                style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
            }]
        }];

        var mockData1 = [Lib.extendDeep({}, mockData0[0]), {
            mode: 'markers',
            x: [20, 11, 12, 0, 1, 2, 3],
            y: [1, 2, 3, 2, 5, 2, 0],
            transforms: [{
                type: 'groupby',
                groups: ['b', 'a', 'b', 'b', 'b', 'a', 'a'],
                style: { a: {marker: {color: 'green'}}, b: {marker: {color: 'black'}} }
            }]
        }];

        afterEach(destroyGraphDiv);

        it('Plotly.plot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData0);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(2);
                expect(gd._fullData[0].x).toEqual([1, -1, 0, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 1, 1]);
                expect(gd._fullData[1].x).toEqual([-2, 1, 2]);
                expect(gd._fullData[1].y).toEqual([3, 2, 3]);

                assertDims([4, 3]);

                done();
            });
        });

        it('Plotly.restyle should work', function(done) {
            var data = Lib.extendDeep([], mockData0);
            data[0].marker = { size: 20 };

            var gd = createGraphDiv();
            var dims = [4, 3];

            Plotly.plot(gd, data).then(function() {
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
                    'transforms[0].style': { a: {marker: {color: 'green'}}, b: {marker: {color: 'red'}} },
                    'marker.opacity': 0.4
                });
            }).then(function() {
                assertStyle(dims,
                    ['rgb(0, 128, 0)', 'rgb(255, 0, 0)'],
                    [0.4, 0.4]
                );

                done();
            });
        });

        it('Plotly.extendTraces should work', function(done) {
            var data = Lib.extendDeep([], mockData0);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
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

                done();
            });
        });

        it('Plotly.deleteTraces should work', function(done) {
            var data = Lib.extendDeep([], mockData1);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
                assertDims([4, 3, 4, 3]);

                return Plotly.deleteTraces(gd, [1]);
            }).then(function() {
                assertDims([4, 3]);

                return Plotly.deleteTraces(gd, [0]);
            }).then(function() {
                assertDims([]);

                done();
            });
        });

        it('toggling trace visibility should work', function(done) {
            var data = Lib.extendDeep([], mockData1);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
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

                done();
            });
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
                style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
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

        it('Plotly.plot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(2); // two groups
                expect(gd._fullData[0].x).toEqual([1, -1, 0, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 1, 1]);
                expect(gd._fullData[1].x).toEqual([-2, 1, 2]);
                expect(gd._fullData[1].y).toEqual([3, 2, 3]);

                assertDims([4, 3]);

                done();
            });
        });

        it('Plotly.plot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData0);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);
                assertDims([7]);

                done();
            });
        });

        it('Plotly.plot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData1);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);
                expect(gd._fullData[0].x).toEqual([ 1, -1, -2, 0, 1, 2, 3 ]);
                expect(gd._fullData[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                assertDims([7]);

                done();
            });
        });

        it('Plotly.plot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData2);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);

                expect(gd._fullData[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                assertDims([7]);

                done();
            });
        });

        it('Plotly.plot should plot the transform traces', function(done) {
            var data = Lib.extendDeep([], mockData3);

            var gd = createGraphDiv();

            Plotly.plot(gd, data).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                expect(gd._fullData.length).toEqual(1);

                expect(gd._fullData[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
                expect(gd._fullData[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

                assertDims([7]);

                done();
            });
        });
    });

    describe('grouping with basic, heterogenous and overridden attributes', function() {
        'use strict';

        afterEach(destroyGraphDiv);

        function test(mockData) {

            return function(done) {
                var data = Lib.extendDeep([], mockData);

                var gd = createGraphDiv();

                Plotly.plot(gd, data).then(function() {

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

                    done();
                });
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
                style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
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
                style: {
                    a: {
                        marker: {
                            color: 'orange',
                            size: 20,
                            line: {
                                color: 'red'
                            }
                        }
                    },
                    b: {
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
                }
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
                style: {
                    a: {marker: {size: 30}},
                    // override general color:
                    b: {marker: {size: 15, line: {color: 'yellow'}}, line: {color: 'purple'}}
                }
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
                style: {/* can be empty, or of partial group id coverage */}
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
            Plotly.plot(gd, data).then(function() {
                expect(gd._fullData[0].marker.line.color).toEqual(['orange', 'red', 'cyan', 'pink']);
                expect(gd._fullData[1].marker.line.color).toEqual('yellow');
                done();
            });
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

                Plotly.plot(gd, data).then(function() {

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

                    done();
                });
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
                style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
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
                style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
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
                style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
            }]
        }];

        it('passes with no groups', test(mockData0));
        it('passes with empty groups', test(mockData1));
        it('passes with falsey groups', test(mockData2));

    });
});
