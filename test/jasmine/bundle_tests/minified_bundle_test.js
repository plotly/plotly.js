/* global Plotly:false */

var MAPBOX_ACCESS_TOKEN = require('@build/credentials.json').MAPBOX_ACCESS_TOKEN;
var mockLists = require('../assets/mock_lists');

describe('Test plotly.min.js', function() {
    'use strict';

    var gd = document.createElement('div');
    document.body.appendChild(gd);

    it('should expose Plotly global', function() {
        expect(window.Plotly).toBeDefined();
    });

    Plotly.setPlotConfig({
        mapboxAccessToken: MAPBOX_ACCESS_TOKEN
    });

    mockLists.all.forEach(function(mockSpec) {
        it('can plot "' + mockSpec[0] + '"', function(done) {
            Plotly.newPlot(gd, mockSpec[1]).catch(fail).then(done);
        });
    });
});
