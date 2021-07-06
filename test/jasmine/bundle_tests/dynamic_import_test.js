var Plotly = require('@lib/core');

var d3Select = require('../../strict-d3').select;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Dynamic @lib/ module imports', function() {
    var gd;

    afterEach(destroyGraphDiv);

    it('should work', function(done) {
        gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            y: [1, 2, 1]
        }])
        .then(function() {
            // N.B. from a different subplot type
            // more info in:
            // https://github.com/plotly/plotly.js/issues/3428
            var ScatterPolar = require('@lib/scatterpolar');
            Plotly.register(ScatterPolar);
        })
        .then(function() {
            return Plotly.newPlot(gd, [{
                type: 'scatterpolar',
                r: [1, 2, 1]
            }]);
        })
        .then(function() {
            var polarLayer = d3Select('.polarlayer');
            expect(polarLayer.size()).toBe(1, 'one polar layer');
            expect(polarLayer.selectAll('.trace').size()).toBe(1, 'one scatterpolar trace');
        })
        .then(done, done.fail);
    });
});
