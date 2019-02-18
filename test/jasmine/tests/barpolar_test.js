var Plotly = require('@lib');
var Lib = require('@src/lib');

var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('Test barpolar defaults:', function() {
    var gd;

    function _supply(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'barpolar'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
    }

    it('should not coerce polar.bar* attributes on subplot w/o visible barpolar', function() {
        _supply([
            {visible: false, subplot: 'polar'},
            {r: [1], subplot: 'polar2'},
            {type: 'scatterpolar', r: [1], subplot: 'polar3'}
        ]);

        var fullLayout = gd._fullLayout;
        expect(fullLayout.polar.barmode).toBeUndefined();
        expect(fullLayout.polar.bargap).toBeUndefined();
        expect(fullLayout.polar2.barmode).toBe('stack');
        expect(fullLayout.polar2.bargap).toBe(0.1);
        expect(fullLayout.polar3.barmode).toBeUndefined();
        expect(fullLayout.polar3.bargap).toBeUndefined();
    });
});

describe('Test barpolar hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function run(specs) {
        gd = createGraphDiv();

        var data = specs.traces.map(function(t) {
            t.type = 'barpolar';
            return t;
        });

        var layout = Lib.extendFlat({
            showlegend: false,
            width: 400,
            height: 400,
            margin: {t: 0, b: 0, l: 0, r: 0, pad: 0}
        }, specs.layout || {});

        return Plotly.plot(gd, data, layout).then(function() {
            var subplot = gd._fullLayout.polar._subplot;

            var results = gd.calcdata.map(function(cd) {
                var trace = cd[0].trace;
                var pointData = {
                    index: false,
                    distance: 20,
                    cd: cd,
                    trace: trace,
                    subplot: subplot,
                    maxHoverDistance: 20
                };
                var pts = trace._module.hoverPoints(pointData, specs.xval, specs.yval, 'closest');
                return pts ? pts[0] : {distance: Infinity};
            });

            // assert closest point (the one corresponding to the hover label)
            // if two points are equidistant, pick pt of 'above' trace
            results.sort(function(a, b) {
                return a.distance - b.distance || b.trace.index - a.trace.index;
            });
            var actual = results[0];
            var exp = specs.exp;

            for(var k in exp) {
                var msg = '- key ' + k;
                if(k === 'x') {
                    expect(actual.x0).toBe(exp.x, msg);
                    expect(actual.x1).toBe(exp.x, msg);
                } else if(k === 'y') {
                    expect(actual.y0).toBe(exp.y, msg);
                    expect(actual.y1).toBe(exp.y, msg);
                } else if(k === 'curveNumber') {
                    expect(actual.trace.index).toBe(exp.curveNumber, msg);
                } else {
                    expect(actual[k]).toBe(exp[k], msg);
                }
            }
        });
    }

    [{
        desc: 'base',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180]
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 263.33,
            y: 200,
            extraText: 'r: 1<br>θ: 0°',
            color: '#1f77b4'
        }
    }, {
        desc: 'hovertemplate',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            hovertemplate: 'tpl',
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 263.33,
            y: 200,
            hovertemplate: 'tpl',
            color: '#1f77b4'
        }
    }, {
        desc: 'with custom text scalar',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            text: 'TEXT'
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 263.33,
            y: 200,
            extraText: 'r: 1<br>θ: 0°<br>TEXT',
            color: '#1f77b4'
        }
    }, {
        desc: 'with custom text array',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            text: ['A', 'B', 'C']
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 263.33,
            y: 200,
            extraText: 'r: 1<br>θ: 0°<br>A',
            color: '#1f77b4'
        }
    }, {
        desc: 'with custom hovertext scalar',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            hovertext: 'TEXT',
            text: 'nop!'
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 263.33,
            y: 200,
            extraText: 'r: 1<br>θ: 0°<br>TEXT',
            color: '#1f77b4'
        }
    }, {
        desc: 'with custom hovertext array',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            hovertext: ['A', 'B', 'C'],
            text: ['n', 'o', 'p']
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 263.33,
            y: 200,
            extraText: 'r: 1<br>θ: 0°<br>A',
            color: '#1f77b4'
        }
    }, {
        desc: 'works with bars with offsets',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            offset: -90
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 1,
            x: 296.32,
            y: 117.74,
            extraText: 'r: 2<br>θ: 90°',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on clockwise angular axes',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            marker: {color: 'red'}
        }],
        layout: {
            polar: {
                angularaxis: {direction: 'clockwise'}
            }
        },
        xval: 0,
        yval: 1,
        exp: {
            index: 0,
            x: 200,
            y: 136.67,
            extraText: 'r: 1<br>θ: 0°',
            color: 'red'
        }
    }, {
        desc: 'works with radians theta coordinates',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 2, 4],
            thetaunit: 'radians'
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 263.33,
            y: 200,
            extraText: 'r: 1<br>θ: 0°',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on radians angular axes',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180],
            marker: {
                color: 'rgba(255,0,0,0)',
                line: {width: 2, color: 'green'}
            }
        }],
        layout: {
            polar: {
                angularaxis: {thetaunit: 'radians'}
            }
        },
        xval: -1,
        yval: 0,
        exp: {
            index: 2,
            x: 10,
            y: 200,
            extraText: 'r: 3<br>θ: 3.141593',
            color: 'green'
        }
    }, {
        desc: 'works on category angular axes',
        traces: [{
            theta: ['a', 'b', 'c', 'd', 'e'],
            r0: 1
        }],
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 238,
            y: 200,
            extraText: 'r: 1<br>θ: a',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on *gridshape:linear* subplots',
        traces: [{
            theta: ['a', 'b', 'c', 'd', 'e'],
            r0: 1
        }],
        layout: {
            polar: {gridshape: 'linear'}
        },
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 238,
            y: 200,
            extraText: 'r: 1<br>θ: a',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on log radial axes',
        traces: [{
            r: [100, 200, 50]
        }],
        layout: {
            polar: {
                radialaxis: {type: 'log'}
            }
        },
        xval: 0,
        yval: 0.3,
        exp: {
            index: 1,
            x: 105,
            y: 35.46,
            extraText: 'r: 200<br>θ: 120°',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on category radial axes',
        traces: [{
            r: ['a', 'b', 'd', 'f']
        }],
        xval: -2,
        yval: 0,
        exp: {
            index: 2,
            x: 70,
            y: 200,
            extraText: 'r: d<br>θ: 180°',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on date radial axes',
        traces: [{
            r: ['2018-08-1', '2018-09-5', '2018-10-8', '2018-09-20']
        }],
        xval: 0,
        yval: 3295437499,
        exp: {
            index: 1,
            x: 200,
            y: 97.35,
            extraText: 'r: Sep 5, 2018<br>θ: 90°',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on negative radial coordinates',
        traces: [{
            base: 10,
            r: [-1, -5, 10, -5]
        }],
        xval: 0,
        yval: -6,
        exp: {
            index: 3,
            x: 200,
            y: 247.5,
            extraText: 'r: −5<br>θ: 270°',
            color: '#1f77b4',
            idealAlign: 'left'
        }
    }, {
        desc: 'works on reversed radial axis ranges',
        traces: [{
            r: [10, 12, 15]
        }],
        layout: {
            polar: {
                radialaxis: {range: [20, 0]}
            }
        },
        xval: 8,
        yval: -8,
        exp: {
            index: 1,
            x: 160,
            y: 130.72,
            extraText: 'r: 12<br>θ: 120°',
            color: '#1f77b4'
        }
    }, {
        desc: 'works on a subplot with hole>0',
        traces: [{
            r: [1, 2, 3],
            theta: [0, 90, 180]
        }],
        layout: {
            polar: {hole: 0.2}
        },
        xval: 1,
        yval: 0,
        exp: {
            index: 0,
            x: 290.67,
            y: 200,
            extraText: 'r: 1<br>θ: 0°',
            color: '#1f77b4'
        }
    }, {
        desc: 'on overlapping bars of same size, the narrower wins',
        traces: [{
            r: [1, 2, 3],
            theta: [90, 180, 360],
            width: 70
        }, {
            r: [1, 2, 3],
            theta: [90, 180, 360],
            width: 90
        }],
        layout: {polar: {barmode: 'overlay'}},
        xval: 1,
        yval: 0,
        exp: {
            curveNumber: 0,
            index: 2,
            x: 390,
            y: 200,
            extraText: 'r: 3<br>θ: 360°',
            color: '#1f77b4'
        }
    }, {
        desc: 'on overlapping bars of same width, the one will tip closer to cursor wins',
        traces: [{
            r: [1, 2, 2],
            theta: [90, 180, 360],
            width: 70
        }, {
            r: [1, 2, 3],
            theta: [90, 180, 360],
            width: 70
        }],
        layout: {polar: {barmode: 'overlay'}},
        xval: 1.9,
        yval: 0,
        exp: {
            curveNumber: 0,
            index: 2,
            x: 326.67,
            y: 200,
            extraText: 'r: 2<br>θ: 360°',
            color: '#1f77b4'
        }
    }]
    .forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).catch(failTest).then(done);
        });
    });
});
