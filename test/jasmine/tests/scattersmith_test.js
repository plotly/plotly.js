var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var ScatterSmith = require('../../../src/traces/scattersmith');

var basicMock = require('../../image/mocks/smith_basic.json');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var checkTextTemplate = require('../assets/check_texttemplate');

describe('Test scattersmith trace defaults:', function() {
    var traceOut;

    function _supply(traceIn, layout) {
        traceOut = {};
        ScatterSmith.supplyDefaults(traceIn, traceOut, '#444', layout || {});
    }

    it('should not truncate *real* when longer than *imag*', function() {
        // this is handled at the calc step now via _length.
        _supply({
            real: [1, 2, 3, 4, 5],
            imag: [1, 2, 3]
        });

        expect(traceOut.real).toEqual([1, 2, 3, 4, 5]);
        expect(traceOut.imag).toEqual([1, 2, 3]);
        expect(traceOut._length).toBe(3);
    });

    it('should not truncate *imag* when longer than *real*', function() {
        // this is handled at the calc step now via _length.
        _supply({
            real: [1, 2, 3],
            imag: [1, 2, 3, 4, 5]
        });

        expect(traceOut.real).toEqual([1, 2, 3]);
        expect(traceOut.imag).toEqual([1, 2, 3, 4, 5]);
        expect(traceOut._length).toBe(3);
    });
});

describe('Test scattersmith hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(basicMock);

        if(specs.patch) {
            fig = specs.patch(fig);
        }

        return Plotly.newPlot(gd, fig).then(function() {
            mouseEvent('mousemove', 400, 70);
            assertHoverLabelContent(specs);
        });
    }

    [{
        desc: 'base',
        nums: 'real: 0\nimag: 1'
    }, {
        desc: 'with tickformat',
        patch: function(fig) {
            fig.layout.smith = {
                realaxis: { tickformat: '.1f' },
                imaginaryaxis: { tickformat: '.2f' }
            };
            return fig;
        },
        nums: 'real: 0.0\nimag: 1.00'
    }, {
        desc: 'with prefix and suffix',
        patch: function(fig) {
            fig.layout.smith = {
                realaxis: {
                    tickprefix: '(',
                    ticksuffix: ')'
                },
                imaginaryaxis: {
                    tickprefix: '[',
                    ticksuffix: ']'
                }
            };
            return fig;
        },
        nums: 'real: (0)\nimag: [1]'
    }, {
        desc: 'with prefix and suffix on invisible axes',
        patch: function(fig) {
            fig.layout.smith = {
                realaxis: {
                    visible: false,
                    tickprefix: '(',
                    ticksuffix: ')'
                },
                imaginaryaxis: {
                    visible: false,
                    tickprefix: '[',
                    ticksuffix: ']'
                }
            };
            return fig;
        },
        nums: 'real: (0)\nimag: [1]'
    }].forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).then(done, done.fail);
        });
    });
});

describe('Test scattersmith texttemplate:', function() {
    checkTextTemplate([{
        type: 'scattersmith',
        mode: 'markers+text',
        text: ['A', 'B', 'C'],
        textposition: 'top center',
        real: [1, 0.5, 1],
        imag: [0, 90, 180],
    }], 'g.textpoint', [
        ['%{text}: (%{real:0.2f}, %{imag:0.1f})', ['A: (1.00, 0.0)', 'B: (0.50, 90.0)', 'C: (1.00, 180.0)']],
        [['', 'b%{imag:0.2f}', '%{imag:0.2f}'], ['', 'b90.00', '180.00']]
    ]);

    checkTextTemplate({
        data: [{
            type: 'scattersmith',
            mode: 'text',
            real: ['0.125', '0.625'],
            imag: ['0.5', '1']
        }],
        layout: {
            smith: {
                realaxis: { tickprefix: 'R', ticksuffix: 'r', tickformat: '.1f'},
                imaginaryaxis: { tickprefix: 'I', ticksuffix: 'i' }
            }
        }
    }, '.textpoint', [
        ['%{real} X %{imag}', ['R0.1r X I0.5i', 'R0.6r X I1i']]
    ]);
});
