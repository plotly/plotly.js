var Plotly = require('@lib/core');

Plotly.register([
    require('@lib/bar'),
    require('@lib/box'),
    require('@lib/heatmap'),
    require('@lib/histogram'),
    require('@lib/histogram2d'),
    require('@lib/histogram2dcontour'),
    require('@lib/pie'),
    require('@lib/contour'),
    require('@lib/scatterternary'),
    require('@lib/ohlc'),
    require('@lib/candlestick')
]);

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Bundle with IE9 supported trace types:', function() {

    afterEach(destroyGraphDiv);

    it(' check that ie9_mock.js did its job', function() {
        expect(function() { return ArrayBuffer; })
            .toThrow(new ReferenceError('ArrayBuffer is not defined'));
        expect(function() { return Uint8Array; })
            .toThrow(new ReferenceError('Uint8Array is not defined'));
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
