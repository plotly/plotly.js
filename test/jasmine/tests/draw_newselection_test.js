var parseSvgPath = require('parse-svg-path');

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var touchEvent = require('../assets/touch_event');
var click = require('../assets/click');

function drag(path, options) {
    var len = path.length;

    if(!options) options = { type: 'mouse' };

    if(options.type === 'touch') {
        touchEvent('touchstart', path[0][0], path[0][1], options);

        path.slice(1, len).forEach(function(pt) {
            touchEvent('touchmove', pt[0], pt[1], options);
        });

        touchEvent('touchend', path[len - 1][0], path[len - 1][1], options);
        return;
    }

    mouseEvent('mousemove', path[0][0], path[0][1], options);
    mouseEvent('mousedown', path[0][0], path[0][1], options);

    path.slice(1, len).forEach(function(pt) {
        mouseEvent('mousemove', pt[0], pt[1], options);
    });

    mouseEvent('mouseup', path[len - 1][0], path[len - 1][1], options);
}

function print(obj) {
    // console.log(JSON.stringify(obj, null, 4).replace(/"/g, '\''));
    return obj;
}

function assertPos(actual, expected, tolerance) {
    if(tolerance === undefined) tolerance = 2;

    expect(typeof actual).toEqual(typeof expected);

    if(typeof actual === 'string') {
        if(expected.indexOf('_') !== -1) {
            actual = fixDates(actual);
            expected = fixDates(expected);
        }

        var cmd1 = parseSvgPath(actual);
        var cmd2 = parseSvgPath(expected);

        expect(cmd1.length).toEqual(cmd2.length);
        for(var i = 0; i < cmd1.length; i++) {
            var A = cmd1[i];
            var B = cmd2[i];
            expect(A.length).toEqual(B.length); // svg letters should be identical
            expect(A[0]).toEqual(B[0]);
            for(var k = 1; k < A.length; k++) {
                expect(A[k]).toBeCloseTo(B[k], tolerance);
            }
        }
    } else {
        var o1 = Object.keys(actual);
        var o2 = Object.keys(expected);
        expect(o1.length === o2.length);
        for(var j = 0; j < o1.length; j++) {
            var key = o1[j];

            var posA = actual[key];
            var posB = expected[key];

            if(typeof posA === 'string') {
                posA = fixDates(posA);
                posB = fixDates(posB);
            }

            expect(posA).toBeCloseTo(posB, tolerance);
        }
    }
}

function fixDates(str) {
    // hack to conver date axes to some numbers to parse with parse-svg-path
    return str.replace(/[ _\-:]/g, '');
}

describe('Draw new selections to layout', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    var allMocks = [
        {
            name: 'heatmap',
            json: require('../../image/mocks/13'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M1.3181818181818181,17.931372549019606L4.348484848484849,17.931372549019606L4.348484848484849,14.009803921568627L1.3181818181818181,14.009803921568627Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 3.590909090909091,
                        y0: 14.990196078431373,
                        x1: 6.621212121212121,
                        y1: 11.068627450980392
                    });
                },
            ]
        },
        {
            name: 'log axis',
            json: require('../../image/mocks/12'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M474.1892200342635,83.52485031975893L9573.560725885585,83.52485031975893L9573.560725885585,73.56897936428534L474.1892200342635,73.56897936428534Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 7298.717849422755,
                        y0: 76.05794710315374,
                        x1: 16398.089355274074,
                        y1: 66.10207614768017
                    });
                }
            ]
        },
        {
            name: 'date axis',
            json: require('../../image/mocks/29'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M2014-04-12_20:51:22.675,108.7654248366013L2014-04-13_06:01:05.4665,108.7654248366013L2014-04-13_06:01:05.4665,95.8373202614379L2014-04-12_20:51:22.675,95.8373202614379Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2014-04-13 03:43:39.7686',
                        y0: 99.06934640522876,
                        x1: '2014-04-13 12:53:22.5602',
                        y1: 86.14124183006535
                    });
                }
            ]
        },
        {
            name: 'date and log axes together',
            json: require('../../image/mocks/cliponaxis_false-dates-log'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M4815.547649034425,2017-11-20_01:27:07.0463L5457.655121746432,2017-11-20_01:27:07.0463L5457.655121746432,2017-11-18_15:17:17.7224L4815.547649034425,2017-11-18_15:17:17.7224Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 5297.12825356843,
                        y0: '2017-11-18 23:49:45.0534',
                        x1: 5939.235726280437,
                        y1: '2017-11-17 13:39:55.7295'
                    });
                }
            ]
        },
        {
            name: 'axes with rangebreaks',
            json: require('../../image/mocks/axes_breaks-gridlines'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M2015-03-10_08:09:50.4328,135.20809909523808L2015-06-29_04:45:22.5512,135.20809909523808L2015-06-29_04:45:22.5512,125.32991393466223L2015-03-10_08:09:50.4328,125.32991393466223Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: '2015-06-01 11:36:29.5216',
                        y0: 127.7994602248062,
                        x1: '2015-09-20 08:12:01.6401',
                        y1: 117.92127506423034
                    });
                }
            ]
        },
        {
            name: 'subplot',
            json: require('../../image/mocks/18'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M4.455815188528943,7.814285714285716L5.093096123207648,7.814285714285716L5.093096123207648,7.016943521594685L4.455815188528943,7.016943521594685Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 4.933775889537972,
                        y0: 7.216279069767443,
                        x1: 5.571056824216676,
                        y1: 6.418936877076413
                    });
                }
            ]
        },
        {
            name: 'cheater',
            json: require('../../image/mocks/cheater'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M-0.08743735959910146,10.431808278867104L0.13720407810609983,10.431808278867104L0.13720407810609983,8.789106753812636L-0.08743735959910146,8.789106753812636Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 0.08104371867979952,
                        y0: 9.199782135076253,
                        x1: 0.3056851563850008,
                        y1: 7.557080610021787
                    });
                }
            ]
        },
        {
            name: 'box plot',
            json: require('../../image/mocks/1'),
            testPos: [
                function(pos) {
                    return assertPos(pos,
                        'M466.8587443946189,8.017420524945898L500.7899850523169,8.017420524945898L500.7899850523169,5.477581260846837L466.8587443946189,5.477581260846837Z'
                    );
                },
                function(pos) {
                    return assertPos(pos, {
                        x0: 492.3071748878924,
                        y0: 6.112541076871603,
                        x1: 526.2384155455904,
                        y1: 3.572701812772542
                    });
                }
            ]
        }
    ];

    allMocks.forEach(function(mockItem) {
        ['mouse', 'touch'].forEach(function(device) {
            var _drag = function(path) {
                return drag(path, {type: device});
            };

            it('@flaky draw various selection types over mock ' + mockItem.name + ' using ' + device, function(done) {
                var fig = Lib.extendDeep({}, mockItem.json);
                fig.layout = {
                    width: 800,
                    height: 600,
                    margin: {
                        t: 60,
                        l: 40,
                        r: 20,
                        b: 30
                    }
                };

                var n;
                Plotly.newPlot(gd, {
                    data: fig.data,
                    layout: fig.layout,
                    config: {}
                })
                .then(function() {
                    n = gd._fullLayout.selections.length; // initial number of selections on _fullLayout
                })

                .then(function() {
                    var newFig = Lib.extendFlat({}, fig);

                    newFig.layout.dragmode = 'lasso';

                    return Plotly.react(gd, newFig);
                })
                .then(function() {
                    return _drag([[100, 100], [200, 100], [200, 200], [100, 200]]);
                })
                .then(function() {
                    return _drag([[100, 100], [200, 100], [200, 200], [100, 200]]);
                })
                .then(function() {
                    var selections = gd._fullLayout.selections;
                    expect(selections.length).toEqual(++n);
                    var obj = selections[n - 1]._input;
                    expect(obj.type).toEqual('path');
                    print(obj);
                    mockItem.testPos[n - 1](obj.path);
                })

                .then(function() {
                    var newFig = Lib.extendFlat({}, fig);

                    newFig.layout.dragmode = 'select';

                    return Plotly.react(gd, newFig);
                })
                .then(function() {
                    return _drag([[175, 175], [275, 275]]);
                })
                .then(function() { click(150, 150); }) // finalize new selection
                .then(function() {
                    var selections = gd._fullLayout.selections;
                    expect(selections.length).toEqual(++n);
                    var obj = selections[n - 1]._input;
                    print(obj);
                    mockItem.testPos[n - 1]({
                        x0: obj.x0,
                        y0: obj.y0,
                        x1: obj.x1,
                        y1: obj.y1
                    });
                })

                .then(done, done.fail);
            });
        });
    });
});

describe('Activate and edit selections', function() {
    var fig = {
        data: [
            {
                mode: 'markers',
                x: [
                    0, 50, 100, 150, 200, 250, 300, 350,
                    0, 50, 100, 150, 200, 250, 300, 350,
                    0, 50, 100, 150, 200, 250, 300, 350,
                    0, 50, 100, 150, 200, 250, 300, 350,
                    0, 50, 100, 150, 200, 250, 300, 350,
                    0, 50, 100, 150, 200, 250, 300, 350
                ],
                y: [
                    0, 0, 0, 0, 0, 0, 0, 0,
                    50, 50, 50, 50, 50, 50, 50, 50,
                    100, 100, 100, 100, 100, 100, 100, 100,
                    150, 150, 150, 150, 150, 150, 150, 150,
                    200, 200, 200, 200, 200, 200, 200, 200,
                    250, 250, 250, 250, 250, 250, 250, 250
                ]
            }
        ],
        layout: {
            width: 800,
            height: 600,
            margin: {
                t: 100,
                b: 50,
                l: 100,
                r: 50
            },
            xaxis: {
                range: [-22.48062015503876, 380.62015503875966]
            },
            yaxis: {
                range: [301.78041543026706, -18.694362017804156]
            },
            template: {
                layout: {
                    selections: [
                        {
                            name: 'myPath',
                            line: {
                                width: 0
                            },
                            opacity: 0.5,
                            path: 'M0.5,0.3C0.5,0.9 0.9,0.9 0.9,0.3C0.9,0.1 0.5,0.1 0.5,0.3ZM0.6,0.4C0.6,0.5 0.66,0.5 0.66,0.4ZM0.74,0.4C0.74,0.5 0.8,0.5 0.8,0.4ZM0.6,0.3C0.63,0.2 0.77,0.2 0.8,0.3Z'
                        }
                    ]
                }
            },
            selections: [
                {
                    type: 'rect',
                    line: {
                        width: 5
                    },
                    opacity: 0.5,
                    xref: 'xaxis',
                    yref: 'yaxis',
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                },
                {
                    line: {
                        width: 5
                    },
                    path: 'M250,25L225,75L275,75Z'
                }
            ]
        },
        config: {}
    };

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    ['mouse'].forEach(function(device) {
        it('reactangle using ' + device, function(done) {
            var range;
            var lassoPoints;
            var points;
            var _selections;
            var selectedCnt = 0;

            var i = 0; // selection index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })
            .then(function() {
                gd.on('plotly_selected', function(d) {
                    range = d.range;
                    lassoPoints = d.lassoPoints;
                    points = d.points;
                    _selections = d.selections;
                    selectedCnt++;
                });
            })

            // selection between 175, 160 and 255, 230
            .then(function() { click(210, 160); }) // activate selection
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'activate selection by clicking border');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                });

                expect(selectedCnt).toEqual(0);
            })
            .then(function() { drag([[255, 230], [300, 200]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'keep selection active after drag corner');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 52.905426356589146,
                    y0: 3.6320474777448033,
                    x1: 102.90852713178295,
                    y1: 53.63323442136499
                });

                expect(selectedCnt).toEqual(1);
                expect(points).not.toBeUndefined();
                expect(_selections).not.toBeUndefined();
                expect(range).not.toBeUndefined();
                expect(lassoPoints).toBeUndefined();
            })
            .then(function() { drag([[300, 200], [255, 230]]); }) // move vertex back
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'keep selection active after drag corner');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                });

                expect(selectedCnt).toEqual(2);
                expect(points).not.toBeUndefined();
                expect(_selections).not.toBeUndefined();
                expect(range).not.toBeUndefined();
                expect(lassoPoints).toBeUndefined();
            })
            .then(function() { drag([[215, 195], [300, 200]]); }) // move selection
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'keep selection active after drag corner');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 77.71162790697674,
                    y0: 24.997032640949552,
                    x1: 127.71472868217053,
                    y1: 74.99821958456974
                });

                expect(selectedCnt).toEqual(3);
                expect(points).not.toBeUndefined();
                expect(_selections).not.toBeUndefined();
                expect(range).not.toBeUndefined();
                expect(lassoPoints).toBeUndefined();
            })
            .then(function() { drag([[300, 200], [215, 195]]); }) // move selection back
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'keep selection active after drag corner');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                expect(obj.type).toEqual('rect');
                print(obj);
                assertPos({
                    x0: obj.x0,
                    y0: obj.y0,
                    x1: obj.x1,
                    y1: obj.y1
                }, {
                    x0: 25,
                    y0: 25,
                    x1: 75,
                    y1: 75
                });

                expect(selectedCnt).toEqual(4);
                expect(points).not.toBeUndefined();
                expect(_selections).not.toBeUndefined();
                expect(range).not.toBeUndefined();
                expect(lassoPoints).toBeUndefined();
            })

            .then(done, done.fail);
        });

        it('closed-path using ' + device, function(done) {
            var range;
            var lassoPoints;
            var points;
            var _selections;
            var selectedCnt = 0;

            var i = 1; // selection index

            Plotly.newPlot(gd, {
                data: fig.data,
                layout: fig.layout,
                config: fig.config
            })

            .then(function() {
                gd.on('plotly_selected', function(d) {
                    range = d.range;
                    lassoPoints = d.lassoPoints;
                    points = d.points;
                    _selections = d.selections;
                    selectedCnt++;
                });
            })

            // next selection
            .then(function() { click(500, 225); }) // activate selection
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'activate selection by clicking border');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                print(obj);
                assertPos(obj.path, 'M250,25L225,75L275,75Z');

                expect(selectedCnt).toEqual(0);
            })
            .then(function() { drag([[540, 160], [500, 120]]); }) // move vertex
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'keep selection active after drag corner');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                print(obj);
                assertPos(obj.path, 'M225.1968992248062,-3.4896142433234463L225,75L275,75Z');

                expect(selectedCnt).toEqual(1);
                expect(points).not.toBeUndefined();
                expect(_selections).not.toBeUndefined();
                expect(lassoPoints).not.toBeUndefined();
                expect(range).toBeUndefined();
            })
            .then(function() { drag([[500, 120], [540, 160]]); }) // move vertex back
            .then(function() {
                var id = gd._fullLayout._activeSelectionIndex;
                expect(id).toEqual(i, 'keep selection active after drag corner');

                var selections = gd._fullLayout.selections;
                var obj = selections[id]._input;
                print(obj);
                assertPos(obj.path, 'M250,25L225,75L275,75Z');

                expect(selectedCnt).toEqual(2);
                expect(points).not.toBeUndefined();
                expect(_selections).not.toBeUndefined();
                expect(lassoPoints).not.toBeUndefined();
                expect(range).toBeUndefined();
            })

            .then(done, done.fail);
        });
    });
});


describe('Activate and edit selections', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should provide sensory background & set pointer-events i.e. to improve selection activation', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                mode: 'markers',
                x: [1, 3, 3],
                y: [2, 1, 3]
            }],
            layout: {
                selections: [
                    {
                        x0: 1.5,
                        x1: 2,
                        y0: 1.5,
                        y1: 2,
                        opacity: 0.5,
                        line: {
                            width: 0,
                            dash: 'dash',
                            color: 'black'
                        }
                    }, {
                        x0: 1.5,
                        x1: 2,
                        y0: 2,
                        y1: 2.5,
                        line: {
                            width: 3,
                            dash: 'dash',
                            color: 'green'
                        }
                    }
                ]
            }
        })

        .then(function() {
            var el = d3SelectAll('.selectionlayer path')[0][0]; // first background
            expect(el.style['pointer-events']).toBe('all');
            expect(el.style.stroke).toBe('rgb(0, 0, 0)'); // no color
            expect(el.style['stroke-opacity']).toBe('1'); // visible
            expect(el.style['stroke-width']).toBe('5px'); // extra pixels to help activate selection

            el = d3SelectAll('.selectionlayer path')[0][2]; // second background
            expect(el.style['pointer-events']).toBe('all');
            expect(el.style.stroke).toBe('rgb(0, 128, 0)'); // custom color
            expect(el.style['stroke-opacity']).toBe('1'); // visible
            expect(el.style['stroke-width']).toBe('7px'); // extra pixels to help activate selection
        })

        .then(done, done.fail);
    });
});


describe('emit plotly_selected event on editing selections in various dragmodes', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    ['zoom', 'pan', 'drawrect', 'drawclosedpath', 'drawcircle'].forEach(function(dragmode) {
        it('get eventData for editing selections using ' + dragmode + ' dragmode', function(done) {
            var fig = {
                data: [
                    {
                        x: [0, 1, 2],
                        y: [1, 2, 3]
                    }
                ],
                layout: {
                    width: 800,
                    height: 600,
                    margin: {
                        t: 100,
                        b: 50,
                        l: 100,
                        r: 50
                    },
                    selections: [{ x0: 0.5, x1: 1.5, y0: 1.5, y1: 2.5}],
                    dragmode: dragmode
                }
            };

            var range;
            var points;
            var lassoPoints;
            var selections;

            Plotly.newPlot(gd, fig)

            .then(function() {
                gd.on('plotly_selected', function(d) {
                    lassoPoints = d.lassoPoints;
                    range = d.range;
                    points = d.points;
                    selections = d.selections;
                });
            })

            .then(function() { click(400, 300); }) // activate selection
            .then(function() { drag([[400, 300], [600, 100]]); }) // move selection
            .then(function() {
                expect(range).not.toBeUndefined();
                expect(range.x).toBeCloseToArray([1.1926580086580088, 2.1926580086580088], 3);
                expect(range.y).toBeCloseToArray([2.5062641509433967, 3.5062641509433967], 3);

                expect(lassoPoints).toBeUndefined();

                expect(points).not.toBeUndefined();
                expect(points.length).toEqual(1);
                expect(points[0].fullData).not.toBeUndefined();
                expect(points[0].data).not.toBeUndefined();
                expect(points[0].data.selectedpoints).toEqual([2]);

                expect(selections).not.toBeUndefined();
                expect(selections.length).toEqual(1);
                expect(selections[0]).not.toBeUndefined();
                expect(selections[0].x0).toBeCloseTo(1.1926580086580088, 3);
                expect(selections[0].x1).toBeCloseTo(2.1926580086580088, 3);
                expect(selections[0].y0).toBeCloseTo(2.5062641509433967, 3);
                expect(selections[0].y1).toBeCloseTo(3.5062641509433967, 3);
            })
            .then(done, done.fail);
        });
    });
});
