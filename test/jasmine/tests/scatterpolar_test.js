// var Plotly = require('@lib');
// var Lib = require('@src/lib');
var ScatterPolar = require('@src/traces/scatterpolar');

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

describe('Test scatterpolar calc:', function() {

});

describe('Test scatterpolar hover:', function() {
    // gd;

    it('', function() {

    });
});
