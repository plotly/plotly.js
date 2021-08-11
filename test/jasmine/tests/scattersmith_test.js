var Plotly = require('@lib/index');
var ScatterSmith = require('@src/traces/scattersmith');
var Lib = require('@src/lib');
const { assertHoverLabelContent } = require('../assets/custom_assertions');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');

describe('Test scattersmith trace defaults:', function() {
    var traceOut;

    function _supply(traceIn, layout) {
        traceOut = {};
        ScatterSmith.supplyDefaults(traceIn, traceOut, '#444', layout || {});
    }

    it('should not truncate *re* when longer than *im*', function() {
        // this is handled at the calc step now via _length.
        _supply({
            re: [1, 2, 3, 4, 5],
            im: [1, 2, 3]
        });

        expect(traceOut.re).toEqual([1, 2, 3, 4, 5]);
        expect(traceOut.im).toEqual([1, 2, 3]);
        expect(traceOut._length).toBe(3);
    });

    it('should not truncate *im* when longer than *re*', function() {
        // this is handled at the calc step now via _length.
        _supply({
            re: [1, 2, 3],
            im: [1, 2, 3, 4, 5]
        });

        expect(traceOut.re).toEqual([1, 2, 3]);
        expect(traceOut.im).toEqual([1, 2, 3, 4, 5]);
        expect(traceOut._length).toBe(3);
    });
});

describe('Test scattersmith hover', function () {
    var gd;

    afterEach(destroyGraphDiv);

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(
            {width: 700, height: 500},
            specs.mock || require('@mocks/zzz_smith_basic.json')
        );

        if(specs.patch) {
            fig = specs.patch(fig);
        }

        var pos = specs.pos || [200, 200];

        return Plotly.newPlot(gd, fig).then(function () {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent(specs);
        });
    }

    [{
        desc: 'Smith chart hover labels',
        nums: '0.1 + 0.1j',
        pos: [80, 175],
        name: 'trace 0'
    }].forEach(function (specs) {
        it('should generate correct hover labels ' + specs.desc, function (done) {
            run(specs).then(done, done.fail);
        });
    })
});
