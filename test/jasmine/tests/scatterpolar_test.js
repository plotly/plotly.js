var Plotly = require('@lib');
var Lib = require('@src/lib');
var ScatterPolar = require('@src/traces/scatterpolar');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var checkTextTemplate = require('../assets/check_texttemplate');

describe('Test scatterpolar trace defaults:', function() {
    var traceOut;

    function _supply(traceIn, layout) {
        traceOut = {};
        ScatterPolar.supplyDefaults(traceIn, traceOut, '#444', layout || {});
    }

    it('should not truncate *r* when longer than *theta*', function() {
        // this is handled at the calc step now via _length.
        _supply({
            r: [1, 2, 3, 4, 5],
            theta: [1, 2, 3]
        });

        expect(traceOut.r).toEqual([1, 2, 3, 4, 5]);
        expect(traceOut.theta).toEqual([1, 2, 3]);
        expect(traceOut._length).toBe(3);
        expect(traceOut.r0).toBeUndefined();
        expect(traceOut.dr).toBeUndefined();
        expect(traceOut.theta0).toBeUndefined();
        expect(traceOut.dtheta).toBeUndefined();
    });

    it('should not truncate *theta* when longer than *r*', function() {
        // this is handled at the calc step now via _length.
        _supply({
            r: [1, 2, 3],
            theta: [1, 2, 3, 4, 5]
        });

        expect(traceOut.r).toEqual([1, 2, 3]);
        expect(traceOut.theta).toEqual([1, 2, 3, 4, 5]);
        expect(traceOut._length).toBe(3);
        expect(traceOut.r0).toBeUndefined();
        expect(traceOut.dr).toBeUndefined();
        expect(traceOut.theta0).toBeUndefined();
        expect(traceOut.dtheta).toBeUndefined();
    });

    it('should coerce *theta0* and *dtheta* when *theta* is not set', function() {
        _supply({
            r: [1, 2, 3]
        });

        expect(traceOut.r).toEqual([1, 2, 3]);
        expect(traceOut.theta).toBeUndefined();
        expect(traceOut._length).toBe(3);
        expect(traceOut.r0).toBeUndefined();
        expect(traceOut.dr).toBeUndefined();
        expect(traceOut.theta0).toBe(0);
        // its default value is computed later
        expect(traceOut.dtheta).toBeUndefined();
    });

    it('should coerce *r0* and *dr* when *r* is not set', function() {
        _supply({
            theta: [1, 2, 3, 4, 5]
        });

        expect(traceOut.r).toBeUndefined();
        expect(traceOut.theta).toEqual([1, 2, 3, 4, 5]);
        expect(traceOut._length).toBe(5);
        expect(traceOut.r0).toBe(0);
        expect(traceOut.dr).toBe(1);
        expect(traceOut.theta0).toBeUndefined();
        expect(traceOut.dtheta).toBeUndefined();
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

        return Plotly.newPlot(gd, fig).then(function() {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent(specs);
        });
    }

    [{
        desc: 'base',
        nums: 'r: 4.022892\nθ: 128.342°',
        name: 'Trial 3'
    }, {
        desc: 'with hovertemplate',
        patch: function(fig) {
            fig.data[2].hovertemplate = 'template %{r} %{theta}';
            return fig;
        },
        nums: 'template 4.022892 128.342°',
        name: 'Trial 3'
    }, {
        desc: 'with hovertemplate and empty trace name',
        patch: function(fig) {
            fig.data[2].hovertemplate = 'template %{r} %{theta}';
            fig.data[2].name = '';
            return fig;
        },
        nums: 'template 4.022892 128.342°',
        name: ''
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
        desc: 'on log radial axis',
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
    }, {
        desc: 'on a subplot with hole>0',
        patch: function(fig) {
            fig.layout.polar.hole = 0.2;
            return fig;
        },
        nums: 'r: 1.108937\nθ: 115.4969°',
        name: 'Trial 3'
    }, {
        desc: 'with custom text scalar',
        patch: function(fig) {
            fig.data.forEach(function(t) { t.text = 'a'; });
            return fig;
        },
        nums: 'r: 4.022892\nθ: 128.342°\na',
        name: 'Trial 3'
    }, {
        desc: 'with custom text array',
        patch: function(fig) {
            fig.data.forEach(function(t) { t.text = t.r.map(String); });
            return fig;
        },
        nums: 'r: 4.022892\nθ: 128.342°\n4.02289202968',
        name: 'Trial 3'
    }]
    .forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).then(done, done.fail);
        });
    });
});

describe('Test scatterpolar texttemplate:', function() {
    checkTextTemplate([{
        'type': 'scatterpolar',
        'mode': 'markers+text',
        'text': ['A', 'B', 'C'],
        'textposition': 'top center',
        'r': [1, 0.5, 1],
        'theta': [0, 90, 180],
    }], 'g.textpoint', [
        ['%{text}: (%{r:0.2f}, %{theta:0.1f})', ['A: (1.00, 0.0)', 'B: (0.50, 90.0)', 'C: (1.00, 180.0)']],
        [['', 'b%{theta:0.2f}', '%{theta:0.2f}'], ['', 'b90.00', '180.00']]
    ]);

    checkTextTemplate({
        data: [{
            type: 'scatterpolar',
            mode: 'text',
            theta: ['a', 'b'],
            r: ['1000', '1200']
        }],
        layout: {
            polar: {
                radialaxis: { tickprefix: '$', ticksuffix: ' !', tickformat: '.2f'},
                angularaxis: { tickprefix: '*', ticksuffix: '*' }
            }
        }
    }, '.textpoint', [
        ['%{theta} is %{r}', ['*a* is $1000.00 !', '*b* is $1200.00 !']]
    ]);
});
