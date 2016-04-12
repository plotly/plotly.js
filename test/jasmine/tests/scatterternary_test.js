var Plotly = require('@lib');
var Lib = require('@src/lib');
var ScatterTernary = require('@src/traces/scatterternary');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');


describe('scatterternary defaults', function() {
    'use strict';

    var supplyDefaults = ScatterTernary.supplyDefaults;

    var traceIn, traceOut;

    var defaultColor = '#444',
        layout = {};

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

    it('should truncate data arrays to the same length (\'c\' is shortest case)', function() {
        traceIn = {
            a: [1, 2, 3],
            b: [1, 2],
            c: [1]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.a).toEqual([1]);
        expect(traceOut.b).toEqual([1]);
        expect(traceOut.c).toEqual([1]);
    });

    it('should truncate data arrays to the same length (\'a\' is shortest case)', function() {
        traceIn = {
            a: [1],
            b: [1, 2, 3],
            c: [1, 2]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.a).toEqual([1]);
        expect(traceOut.b).toEqual([1]);
        expect(traceOut.c).toEqual([1]);
    });

    it('should truncate data arrays to the same length (\'a\' is shortest case)', function() {
        traceIn = {
            a: [1, 2],
            b: [1],
            c: [1, 2, 3]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.a).toEqual([1]);
        expect(traceOut.b).toEqual([1]);
        expect(traceOut.c).toEqual([1]);
    });
    it('should include \'name\' in \'hoverinfo\' default if multi trace graph', function() {
        traceIn = {
            a: [1, 2, 3],
            b: [1, 2, 3],
            c: [1, 2, 3]
        };
        layout._dataLength = 2;

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.hoverinfo).toBe('all');
    });

    it('should not include \'name\' in \'hoverinfo\' default if single trace graph', function() {
        traceIn = {
            a: [1, 2, 3],
            b: [1, 2, 3],
            c: [1, 2, 3]
        };
        layout._dataLength = 1;

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.hoverinfo).toBe('a+b+c+text');
    });
});

describe('scatterternary calc', function() {
    'use strict';

    var calc = ScatterTernary.calc;

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    var gd, trace, cd;

    beforeEach(function() {
        gd = {
            _fullLayout: {
                ternary: { sum: 1 }
            }
        };

        trace = {
            subplot: 'ternary',
            sum: 1
        };
    });

    it('should fill in missing component (case \'c\')', function() {
        trace.a = [0.1, 0.3, 0.6];
        trace.b = [0.3, 0.6, 0.1];

        calc(gd, trace);
        expect(trace.c).toBeCloseToArray([0.6, 0.1, 0.3]);
    });

    it('should fill in missing component (case \'b\')', function() {
        trace.a = [0.1, 0.3, 0.6];
        trace.c = [0.1, 0.3, 0.2];

        calc(gd, trace);
        expect(trace.b).toBeCloseToArray([0.8, 0.4, 0.2]);
    });

    it('should fill in missing component (case \'a\')', function() {
        trace.b = [0.1, 0.3, 0.6];
        trace.c = [0.8, 0.4, 0.1];

        calc(gd, trace);
        expect(trace.a).toBeCloseToArray([0.1, 0.3, 0.3]);
    });

    it('should skip over non-numeric values', function() {
        trace.a = [0.1, 'a', 0.6];
        trace.b = [0.1, 0.3, null];
        trace.c = [8, 0.4, 0.1];

        cd = calc(gd, trace);

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

    var hoverPoints = ScatterTernary.hoverPoints;

    var gd, pointData;

    beforeAll(function(done) {
        gd = createGraphDiv();

        var data = [{
            type: 'scatterternary',
            a: [0.1, 0.2, 0.3],
            b: [0.3, 0.2, 0.1],
            c: [0.1, 0.4, 0.5]
        }];

        Plotly.plot(gd, data).then(done);
    });

    beforeEach(function() {
        var cd = gd.calcdata,
            ternary = gd._fullLayout.ternary._ternary;

        pointData = {
            index: false,
            distance: 20,
            cd: cd[0],
            trace: cd[0][0].trace,
            xa: ternary.xaxis,
            ya: ternary.yaxis
        };

    });

    afterAll(destroyGraphDiv);

    it('should generate extra text field on hover', function() {
        var xval = 0.42,
            yval = 0.37,
            hovermode = 'closest';

        var scatterPointData = hoverPoints(pointData, xval, yval, hovermode);

        expect(scatterPointData[0].extraText).toEqual(
            'Component A: 0.3333333<br>Component B: 0.1111111<br>Component C: 0.5555556'
        );

        expect(scatterPointData[0].xLabelVal).toBeUndefined();
        expect(scatterPointData[0].yLabelVal).toBeUndefined();
    });

});
