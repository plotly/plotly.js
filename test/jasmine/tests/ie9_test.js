var Plotly = require('@lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('IE9 environment', function() {

    var uint8Array = window.Uint8Array;

    beforeAll(function() {
        window.Uint8Array = undefined;
    });

    afterAll(function() {
        window.Uint8Array = uint8Array;
    });

    afterEach(function() {
        destroyGraphDiv();
    });

    it('heatmaps with smoothing should work', function(done) {
        var gd = createGraphDiv();
        var data = [{
            type: 'heatmap',
            z: [[1, 2, 3], [2, 1, 2]],
            zsmooth: 'best'
        }];

        Plotly.plot(gd, data).then(done);
    });
});
