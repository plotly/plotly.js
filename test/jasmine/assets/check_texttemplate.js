var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var failTest = require('../assets/fail_test');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');

'use strict';

module.exports = function checkTextTemplate(mock, selector, tests) {
    it('should not coerce textinfo when texttemplate', function() {
        var gd = {};
        gd.data = Lib.extendDeep(mock, {});
        gd.data[0].textinfo = 'text';
        gd.data[0].texttemplate = tests[0][0];
        supplyAllDefaults(gd);
        expect(gd._fullData[0].textinfo).toBe(undefined);
    });

    tests.forEach(function(test) {
        it('should support textemplate', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep(mock, {});
            mockCopy[0].texttemplate = test[0];
            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    var pts = Plotly.d3.selectAll(selector);
                    expect(pts.size()).toBe(test[1].length);
                    pts.each(function() {
                        expect(test[1]).toContain(Plotly.d3.select(this).text());
                    });
                })
                .catch(failTest)
                .finally(destroyGraphDiv)
                .then(done);
        });
    });
};
