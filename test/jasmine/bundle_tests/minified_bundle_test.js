/* global Plotly:false */

describe('Test plotly.min.js', function() {
    'use strict';

    // Note: this test doesn't have access to custom_matchers.js
    // so you can only use standard jasmine matchers here.

    it('should expose Plotly global', function() {
        expect(window.Plotly).toBeDefined();
    });

    it('should be able to plot a mapbox plot', function(done) {
        var gd = document.createElement('div');
        document.body.appendChild(gd);

        Plotly.plot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 30, 20]
        }], {}, {
            mapboxAccessToken: 'pk.eyJ1IjoiZXRwaW5hcmQiLCJhIjoiY2luMHIzdHE0MGFxNXVubTRxczZ2YmUxaCJ9.hwWZful0U2CQxit4ItNsiQ'
        })
        .catch(function() {
            fail('mapbox plot failed');
        })
        .then(function() {
            document.body.removeChild(gd);
            done();
        });
    });
});
