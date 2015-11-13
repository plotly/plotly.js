var Plotly = require('@src/plotly');

describe('Test geolayout', function () {
    'use strict';

    var GeoLayout = Plotly.GeoLayout;

    describe('supplyLayoutDefaults', function() {
        var layoutIn, layoutOut;

        var fullData = [{
            type: 'scattergeo',
            geo: 'geo'
        }];

        beforeEach(function() {
            layoutOut = {};
        });

        it('should not coerce projection.rotation if type is albers usa', function() {
            layoutIn = {
                geo: {
                    projection: {
                        type: 'albers usa',
                        rotation: {
                            lon: 10,
                            lat: 10
                        }
                    }
                }
            };

            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.geo.projection.rotation).toBeUndefined();

            delete layoutIn.geo.projection.type;
            layoutOut = {};
            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.geo.projection.rotation).toBeDefined();
        });

        it('should not coerce coastlines and ocean if type is albers usa', function() {
            var fields = [
                'showcoastlines', 'coastlinecolor', 'coastlinewidth',
                'showocean', 'oceancolor'
            ];

            layoutIn = {
                geo: {
                    projection: {
                        type: 'albers usa'
                    },
                    showcoastlines: true,
                    showocean: true
                }
            };

            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            fields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });

            delete layoutIn.geo.projection.type;
            layoutOut = {};
            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            fields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should not coerce projection.parallels if type is conic', function() {
            var projTypes = GeoLayout.layoutAttributes.projection.type.values;

            function testOne(projType) {
                layoutIn = {
                    geo: {
                        projection: {
                            type: projType,
                            parallels: [10, 10]
                        }
                    }
                };
                layoutOut = {};
                GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            }

            projTypes.forEach(function(projType) {
                testOne(projType);
                if (projType.indexOf('conic') !== -1) {
                    expect(layoutOut.geo.projection.parallels).toBeDefined();
                } else {
                    expect(layoutOut.geo.projection.parallels).toBeUndefined();
                }
            });
        });

        it('should coerce subunits only when available ', function() {
            var fields = [
                'showsubunits', 'subunitcolor', 'subunitwidth'
            ];

            layoutIn = {
                geo: { scope: 'usa' }
            };
            layoutOut = {};
            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            fields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });

            delete layoutIn.geo.scope;
            layoutOut = {};
            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            fields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });

            layoutIn = {
                geo: {
                    scope: 'north america',
                    resolution: 50
                }
            };
            layoutOut = {};
            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            fields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });

            layoutIn = {
                geo: {
                    scope: 'north america',
                    resolution: '50'
                }
            };
            layoutOut = {};
            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            fields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });

            delete layoutIn.geo.resolution;
            layoutOut = {};
            GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            fields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });
        });

        it('should not coerce frame unless for world scope', function() {
            var fields = [
                'showframe', 'framecolor', 'framewidth'
            ],
            scopes = GeoLayout.layoutAttributes.scope.values;

            function testOne(scope) {
                layoutIn = {
                    geo: { scope: scope }
                };
                layoutOut = {};
                GeoLayout.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            }

            scopes.forEach(function(scope) {
                testOne(scope);
                if(scope === 'world') {
                    fields.forEach(function(field) {
                        expect(layoutOut.geo[field]).toBeDefined();
                    });
                } else {
                    fields.forEach(function(field) {
                        expect(layoutOut.geo[field]).toBeUndefined();
                    });
                }
            });
        });

    });

});
