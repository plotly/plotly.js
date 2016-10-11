var Lib = require('@src/lib/index');
var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('updateBindings', function() {
    'use strict';

    var gd;
    var mock = require('@mocks/updatemenus.json');

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);
        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        destroyGraphDiv(gd);
    });

    it('updates bindings on plot', function(done) {
        Plotly.restyle(gd, 'marker.size', 10).catch(fail).then(done);
    });
});
