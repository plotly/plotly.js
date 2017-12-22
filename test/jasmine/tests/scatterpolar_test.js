var Plotly = require('@lib');
var Lib = require('@src/lib');
var ScatterPolar = require('@src/traces/scatterpolar');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test scatterpolar trace defaults:', function() {
    var traceOut;

    function _supply(traceIn, layout) {
        traceOut = {};
        ScatterPolar.supplyDefaults(traceIn, traceOut, '#444', layout || {});
    }

    it('should truncate *r* when longer than *theta*', function() {
        _supply({
            r: [1, 2, 3, 4, 5],
            theta: [1, 2, 3]
        });

        expect(traceOut.r).toEqual([1, 2, 3]);
        expect(traceOut.theta).toEqual([1, 2, 3]);
    });

    it('should truncate *theta* when longer than *r*', function() {
        _supply({
            r: [1, 2, 3],
            theta: [1, 2, 3, 4, 5]
        });

        expect(traceOut.r).toEqual([1, 2, 3]);
        expect(traceOut.theta).toEqual([1, 2, 3]);
    });
});

describe('Test scatterpolar hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(
            {width: 700, height: 500},
            specs.mock || require('@mocks/polar_scatter.json')
        );

        if(specs.patch) {
            fig = specs.patch(fig);
        }

        var pos = specs.pos || [200, 200];

        return Plotly.plot(gd, fig).then(function() {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent(specs);
        });
    }

    [{
        desc: 'base',
        nums: 'r: 4.022892\nθ: 128.342°',
        name: 'Trial 3'
    }, {
        desc: '(no labels - out of sector)',
        patch: function(fig) {
            fig.layout.polar.sector = [15, 75];
            return fig;
        },
        pos: [144, 350],
        nums: '',
        name: ''
    }, {
        desc: 'on a `thetaunit: radians` polar subplot',
        patch: function(fig) {
            fig.layout.polar.angularaxis.thetaunit = 'radians';
            return fig;
        },
        nums: 'r: 4.022892\nθ: 2.239991',
        name: 'Trial 3'
    }, {
        desc: 'on work on log radial axis',
        patch: function(fig) {
            fig.layout.polar.radialaxis.type = 'log';
            return fig;
        },
        nums: 'r: 1.108937\nθ: 115.4969°',
        name: 'Trial 3'
    }, {
        desc: 'on fills',
        mock: require('@mocks/polar_fills.json'),
        pos: [300, 230],
        nums: 'trace 2',
        name: ''
    }, {
        desc: 'on category axes',
        mock: require('@mocks/polar_categories.json'),
        patch: function(fig) {
            fig.data.forEach(function(t) { t.fill = 'none'; });
            return fig;
        },
        pos: [465, 90],
        nums: 'r: 4\nθ: d',
        name: 'angular cate...'
    }]
    .forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).catch(fail).then(done);
        });
    });
});
