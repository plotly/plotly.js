var Plotly = require('@lib');
var Lib = require('@src/lib');
var ScatterTernary = require('@src/traces/scatterternary');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var customAssertions = require('../assets/custom_assertions');
var supplyAllDefaults = require('../assets/supply_defaults');

var mouseEvent = require('../assets/mouse_event');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

var assertClip = customAssertions.assertClip;
var assertNodeDisplay = customAssertions.assertNodeDisplay;

describe('scatterternary defaults', function() {
    'use strict';

    var supplyDefaults = ScatterTernary.supplyDefaults;

    var traceIn, traceOut;

    var defaultColor = '#444';
    var layout = {};

    beforeEach(function() {
        traceOut = {};
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (base case)', function() {
        traceIn = {
            a: [1, 2, 3],
            b: [1, 2, 3],
            c: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).not.toBe(true);
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (\'c\' is missing case)', function() {
        traceIn = {
            a: [1, 2, 3],
            b: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).not.toBe(true);
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (\'b\' is missing case)', function() {
        traceIn = {
            a: [1, 2, 3],
            c: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).not.toBe(true);
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (\'a\' is missing case)', function() {
        traceIn = {
            b: [1, 2, 3],
            c: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).not.toBe(true);
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (\'b\ and \'c\' are missing case)', function() {
        traceIn = {
            a: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (\'a\ and \'c\' are missing case)', function() {
        traceIn = {
            b: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (\'a\ and \'b\' are missing case)', function() {
        traceIn = {
            c: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('should allow one of \'a\', \'b\' or \'c\' to be missing (all are missing case)', function() {
        traceIn = {};

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('should not truncate data arrays to the same length (\'c\' is shortest case)', function() {
        // this is handled at the calc step now via _length.
        traceIn = {
            a: [1, 2, 3],
            b: [1, 2],
            c: [1]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.a).toEqual([1, 2, 3]);
        expect(traceOut.b).toEqual([1, 2]);
        expect(traceOut.c).toEqual([1]);
        expect(traceOut._length).toBe(1);
    });

    it('should not truncate data arrays to the same length (\'a\' is shortest case)', function() {
        // this is handled at the calc step now via _length.
        traceIn = {
            a: [1],
            b: [1, 2, 3],
            c: [1, 2]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.a).toEqual([1]);
        expect(traceOut.b).toEqual([1, 2, 3]);
        expect(traceOut.c).toEqual([1, 2]);
        expect(traceOut._length).toBe(1);
    });

    it('should not truncate data arrays to the same length (\'a\' is shortest case)', function() {
        // this is handled at the calc step now via _length.
        traceIn = {
            a: [1, 2],
            b: [1],
            c: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.a).toEqual([1, 2]);
        expect(traceOut.b).toEqual([1]);
        expect(traceOut.c).toEqual([1, 2, 3]);
        expect(traceOut._length).toBe(1);
    });

    it('is set visible: false if a, b, or c is empty', function() {
        var trace0 = {
            a: [1, 2],
            b: [2, 1],
            c: [2, 2]
        };

        ['a', 'b', 'c'].forEach(function(letter) {
            traceIn = Lib.extendDeep({}, trace0);
            traceIn[letter] = [];
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false, letter);
        });
    });

    it('should include \'name\' in \'hoverinfo\' default if multi trace graph', function() {
        traceIn = {
            type: 'scatterternary',
            a: [1, 2, 3],
            b: [1, 2, 3],
            c: [1, 2, 3]
        };

        var gd = {data: [traceIn, {}]};
        supplyAllDefaults(gd);

        expect(gd._fullData[0].hoverinfo).toBe('all');
    });

    it('should not include \'name\' in \'hoverinfo\' default if single trace graph', function() {
        traceIn = {
            type: 'scatterternary',
            a: [1, 2, 3],
            b: [1, 2, 3],
            c: [1, 2, 3]
        };

        var gd = {data: [traceIn]};
        supplyAllDefaults(gd);

        expect(gd._fullData[0].hoverinfo).toBe('a+b+c+text');
    });

    it('should correctly assign \'hoveron\' default', function() {
        traceIn = {
            a: [1, 2, 3],
            b: [1, 2, 3],
            c: [1, 2, 3],
            mode: 'lines+markers',
            fill: 'tonext'
        };

        // fills and markers, you get both hover types
        // you need visible: true here, as that normally gets set
        // outside of the module supplyDefaults
        traceOut = {visible: true};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.hoveron).toBe('points+fills');

        // but with only lines (or just fill) and fill tonext or toself
        // you get fills
        traceIn.mode = 'lines';
        traceOut = {visible: true};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.hoveron).toBe('fills');

        // without a fill you always get points. For scatterternary, unlike
        // scatter, every allowed fill but 'none' is an area fill (rather than
        // a vertical / horizontal fill) so they all should default to
        // hoveron points.
        traceIn.fill = 'none';
        traceOut = {visible: true};
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.hoveron).toBe('points');
    });
});

describe('scatterternary calc', function() {
    'use strict';

    var calc = ScatterTernary.calc;

    var gd, trace, cd;

    beforeEach(function() {
        gd = {
            _fullLayout: {
                ternary: { sum: 1 }
            }
        };

        trace = {
            subplot: 'ternary',
            sum: 1,
            _length: 3
        };
    });

    function get(cd, component) {
        return cd.map(function(v) {
            return v[component];
        });
    }

    it('should fill in missing component (case \'c\')', function() {
        trace.a = [0.1, 0.3, 0.6];
        trace.b = [0.3, 0.6, 0.1];

        cd = calc(gd, trace);
        expect(get(cd, 'c')).toBeCloseToArray([0.6, 0.1, 0.3]);
    });

    it('should fill in missing component (case \'b\')', function() {
        trace.a = [0.1, 0.3, 0.6];
        trace.c = [0.1, 0.3, 0.2];

        cd = calc(gd, trace);
        expect(get(cd, 'b')).toBeCloseToArray([0.8, 0.4, 0.2]);
    });

    it('should fill in missing component (case \'a\')', function() {
        trace.b = [0.1, 0.3, 0.6];
        trace.c = [0.8, 0.4, 0.1];

        cd = calc(gd, trace);
        expect(get(cd, 'a')).toBeCloseToArray([0.1, 0.3, 0.3]);
    });

    it('should skip over non-numeric values', function() {
        trace.a = [0.1, 'a', 0.6];
        trace.b = [0.1, 0.3, null];
        trace.c = [8, 0.4, 0.1];

        cd = calc(gd, trace).map(function(obj) { delete obj.i; return obj; });

        expect(objectToArray(cd[0])).toBeCloseToArray([
            0.963414634, 0.012195121, 0.012195121, 0.012195121, 0.975609756
        ]);
        expect(cd[1]).toEqual({ x: false, y: false });
        expect(cd[2]).toEqual({ x: false, y: false });
    });

    function objectToArray(obj) {
        return Object.keys(obj).map(function(k) {
            return obj[k];
        });
    }

});

describe('scatterternary plot and hover', function() {
    'use strict';

    var mock = require('@mocks/ternary_simple.json');

    afterAll(destroyGraphDiv);

    beforeAll(function(done) {
        var gd = createGraphDiv();
        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    it('should put scatterternary trace in \'frontplot\' node', function() {
        var nodes = d3.select('.frontplot').selectAll('.scatter');

        expect(nodes.size()).toEqual(1);
    });

    it('should generate one line path per trace', function() {
        var nodes = d3.selectAll('path.js-line');

        expect(nodes.size()).toEqual(mock.data.length);
    });

    it('should generate as many points as there are data points', function() {
        var nodes = d3.selectAll('path.point');

        expect(nodes.size()).toEqual(mock.data[0].a.length);
    });
});

describe('scatterternary hover', function() {
    'use strict';

    var gd;

    function check(pos, content) {
        mouseEvent('mousemove', pos[0], pos[1]);

        assertHoverLabelContent({
            nums: content[0],
            name: content[1]
        });
    }

    beforeAll(function(done) {
        gd = createGraphDiv();
        var data = [{
            type: 'scatterternary',
            a: [0.1, 0.2, 0.3],
            b: [0.3, 0.2, 0.1],
            c: [0.1, 0.4, 0.5],
            text: ['A', 'B', 'C']
        }];
        Plotly.plot(gd, data).then(done);
    });

    afterAll(destroyGraphDiv);

    function _hover(gd, xval, yval, hovermode) {
        var cd = gd.calcdata;
        var ternary = gd._fullLayout.ternary._subplot;

        var pointData = {
            index: false,
            distance: 20,
            cd: cd[0],
            trace: cd[0][0].trace,
            xa: ternary.xaxis,
            ya: ternary.yaxis,
            subplot: ternary
        };

        return ScatterTernary.hoverPoints(pointData, xval, yval, hovermode);
    }

    it('should generate extra text field on hover', function(done) {
        var xval = 0.42;
        var yval = 0.37;
        var hovermode = 'closest';
        var scatterPointData;

        scatterPointData = _hover(gd, xval, yval, hovermode);

        expect(scatterPointData[0].extraText).toEqual(
            'Component A: 0.3333333<br>Component B: 0.1111111<br>Component C: 0.5555556'
        );

        expect(scatterPointData[0].xLabelVal).toBeUndefined();
        expect(scatterPointData[0].yLabelVal).toBeUndefined();
        expect(scatterPointData[0].text).toEqual('C');

        Plotly.restyle(gd, {
            text: null,
            hovertext: [['apple', 'banana', 'orange']]
        })
        .then(function() {
            scatterPointData = _hover(gd, xval, yval, hovermode);

            expect(scatterPointData[0].extraText).toEqual(
                'Component A: 0.3333333<br>Component B: 0.1111111<br>Component C: 0.5555556'
            );

            expect(scatterPointData[0].xLabelVal).toBeUndefined();
            expect(scatterPointData[0].yLabelVal).toBeUndefined();
            expect(scatterPointData[0].text).toEqual('orange');
        })
        .catch(failTest)
        .then(done);
    });

    it('should pass along hovertemplate on hover', function(done) {
        var xval = 0.42;
        var yval = 0.37;
        var hovermode = 'closest';
        var scatterPointData;
        Plotly.restyle(gd, {
            hovertemplate: 'tpl'
        })
        .then(function() {
            scatterPointData = _hover(gd, xval, yval, hovermode);
            expect(scatterPointData[0].hovertemplate).toEqual('tpl');
        })
        .catch(failTest)
        .then(done);
    });

    it('should always display hoverlabel when hovertemplate is defined', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/ternary_simple.json'));

        Plotly.newPlot(gd, fig)
        .then(function() {
            return Plotly.restyle(gd, {
                hovertemplate: '%{a}, %{b}, %{c}',
                name: '',
                text: null,
                hovertext: null
            });
        })
        .then(function() {
            check([380, 210], ['0.5, 0.25, 0.25']);
        })
        .catch(failTest)
        .then(done);
    });

});

describe('Test scatterternary *cliponaxis*', function() {
    afterEach(destroyGraphDiv);

    it('should show/hide point/text/errorbars in clipped and non-clipped layers', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/ternary_markers.json'));

        function _assert(layerClips, nodeDisplays, lineClips) {
            var frontLayer = d3.select('.frontplot');
            var scatterLayer = d3.select('.scatterlayer');

            assertClip(frontLayer, layerClips[0], 1, 'front layer');
            assertClip(scatterLayer, layerClips[1], 1, 'scatter layer');

            assertNodeDisplay(
                scatterLayer.selectAll('.point'),
                nodeDisplays,
                'scatter points'
            );
            assertNodeDisplay(
                scatterLayer.selectAll('.textpoint'),
                nodeDisplays,
                'scatter text points'
            );

            assertClip(
                scatterLayer.selectAll('.js-line'),
                lineClips[0], lineClips[1],
                'line clips'
            );
        }

        Plotly.plot(gd, fig)
        .then(function() {
            _assert(
                [false, false],
                [null, 'none', null, null, null, null, null, null, 'none', 'none', 'none'],
                [true, 1]
           );
            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            _assert(
                [false, false],
                [],
                [false, 0]
           );
            return Plotly.restyle(gd, {visible: true, cliponaxis: null});
        })
        .then(function() {
            _assert(
                [true, false],
                [null, null, null, null, null, null, null, null, null, null, null],
                [false, 1]
           );
            return Plotly.restyle(gd, 'cliponaxis', false);
        })
        .then(function() {
            _assert(
                [false, false],
                [null, 'none', null, null, null, null, null, null, 'none', 'none', 'none'],
                [true, 1]
           );
            return Plotly.relayout(gd, 'ternary.aaxis.min', 20);
        })
        .then(function() {
            _assert(
                [false, false],
                [null, 'none', null, 'none', 'none', 'none', null, 'none', 'none', 'none', 'none'],
                [true, 1]
           );
            return Plotly.relayout(gd, 'ternary.baxis.min', 40);
        })
        .then(function() {
            _assert(
                [false, false],
                ['none', 'none', 'none', 'none', 'none', 'none', null, 'none', 'none', 'none', 'none'],
                [true, 1]
           );
            return Plotly.relayout(gd, 'ternary.caxis.min', 30);
        })
        .then(function() {
            _assert(
                [false, false],
                ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
                [true, 1]
           );
            return Plotly.relayout(gd, {
                'ternary.aaxis.min': null,
                'ternary.baxis.min': null,
                'ternary.caxis.min': null
            });
        })
        .then(function() {
            _assert(
                [false, false],
                [null, null, null, null, null, null, null, null, null, null, null],
                [true, 1]
           );
        })
        .catch(failTest)
        .then(done);
    });
});
