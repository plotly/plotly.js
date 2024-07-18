/* global Plotly:false */


var mockLists = require('../assets/mock_lists');

// only needed for mapnew subplots
var LONG_TIMEOUT_INTERVAL = 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL;

describe('Test plotly.min.js', function() {
    'use strict';

    var gd = document.createElement('div');
    document.body.appendChild(gd);

    it('should expose Plotly global', function() {
        expect(window.Plotly).toBeDefined();
    });

    Plotly.setPlotConfig({

    });

    mockLists.all.forEach(function(mockSpec) {
        it('can plot "' + mockSpec[0] + '"', function(done) {
            Plotly.newPlot(gd, mockSpec[1]).catch(fail).then(done);
        }, LONG_TIMEOUT_INTERVAL);
    });

    it('should not expose d3', function() {
        expect(window.d3).not.toBeDefined();
    });
});
