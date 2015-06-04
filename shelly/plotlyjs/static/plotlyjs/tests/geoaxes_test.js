var Plotly = require('../src/plotly'),
    params = require('../src/geo/lib/params');

describe('Test geoaxes', function () {
    'use strict';

    var GeoAxes = Plotly.GeoAxes;

    describe('supplyLayoutDefaults', function() {
        var geoLayoutIn,
            geoLayoutOut;

        beforeEach(function() {
            geoLayoutOut = {};
        });

        it('should default to lon(lat)range to params non-world scopes', function() {
            var scopeDefaults = params.scopeDefaults,
                scopes = Object.keys(scopeDefaults),
                customLonaxisRange = [-42.21313312, 40.321321],
                customLataxisRange = [-42.21313312, 40.321321];

            var dfltLonaxisRange, dfltLataxisRange;

            scopes.forEach(function(scope) {
                if(scope === 'world') return;

                dfltLonaxisRange = scopeDefaults[scope].lonaxisRange;
                dfltLataxisRange = scopeDefaults[scope].lataxisRange;

                geoLayoutIn = {};
                geoLayoutOut = {scope: scope};

                GeoAxes.supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);
                expect(geoLayoutOut.lonaxis.range).toEqual(dfltLonaxisRange);
                expect(geoLayoutOut.lataxis.range).toEqual(dfltLataxisRange);
                expect(geoLayoutOut.lonaxis.tick0).toEqual(dfltLonaxisRange[0]);
                expect(geoLayoutOut.lataxis.tick0).toEqual(dfltLataxisRange[0]);

                geoLayoutIn = {
                    lonaxis: {range: customLonaxisRange},
                    lataxis: {range: customLataxisRange}
                };
                geoLayoutOut = {scope: scope};

                GeoAxes.supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);
                expect(geoLayoutOut.lonaxis.range).toEqual(customLonaxisRange);
                expect(geoLayoutOut.lataxis.range).toEqual(customLataxisRange);
                expect(geoLayoutOut.lonaxis.tick0).toEqual(customLonaxisRange[0]);
                expect(geoLayoutOut.lataxis.tick0).toEqual(customLataxisRange[0]);
            });
        });

        it('should adjust default lon(lat)range to projection.rotate in world scopes', function() {
            var expectedLonaxisRange, expectedLataxisRange;

            function testOne() {
                GeoAxes.supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);
                expect(geoLayoutOut.lonaxis.range).toEqual(expectedLonaxisRange);
                expect(geoLayoutOut.lataxis.range).toEqual(expectedLataxisRange);
            }

            geoLayoutIn = {};
            geoLayoutOut = {
                scope: 'world',
                projection: {
                    type: 'equirectangular',
                    rotate: [-75, 45]
                }
            };
            expectedLonaxisRange = [-255, 105];  // => -75 +/- 180
            expectedLataxisRange = [-45, 135];   // => 45 +/- 90
            testOne();

            geoLayoutIn = {};
            geoLayoutOut = {
                scope: 'world',
                projection: {
                    type: 'orthographic',
                    rotate: [-75, 45]
                }
            };
            expectedLonaxisRange = [-165, 15];  // => -75 +/- 90
            expectedLataxisRange = [-45, 135];  // => 45 +/- 90
            testOne();

            geoLayoutIn = {
                lonaxis: {range: [-42.21313312, 40.321321]},
                lataxis: {range: [-42.21313312, 40.321321]}
            };
            expectedLonaxisRange = [-42.21313312, 40.321321];
            expectedLataxisRange = [-42.21313312, 40.321321];
            testOne();

        });


    });

});
