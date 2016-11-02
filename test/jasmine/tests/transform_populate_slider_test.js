var Plotly = require('@lib/index');
var Filter = require('@lib/filter');

var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var assertDims = require('../assets/assert_dims');
var assertStyle = require('../assets/assert_style');

describe('filter transforms defaults:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('passes', function(done) {
        Plotly.plot(gd, [{
            x: [1, 2, 3]
        }]).then(done);
    });
});
