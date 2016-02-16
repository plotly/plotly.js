var Geo = require('@src/plots/geo');


describe('Test Geo layout defaults', function() {
    'use strict';

    var layoutAttributes = Geo.layoutAttributes;
    var supplyLayoutDefaults = Geo.supplyLayoutDefaults;

    describe('supplyLayoutDefaults', function() {
        var layoutIn, layoutOut, fullData;

        beforeEach(function() {
            // if hasGeo is not at this stage, the default step is skipped
            layoutOut = { _hasGeo: true };

            // needs a geo-ref in a trace in order to be detected
            fullData = [{ type: 'scattergeo', geo: 'geo' }];
        });

        var seaFields = [
            'showcoastlines', 'coastlinecolor', 'coastlinewidth',
            'showocean', 'oceancolor'
        ];

        var subunitFields = [
            'showsubunits', 'subunitcolor', 'subunitwidth'
        ];

        var frameFields = [
            'showframe', 'framecolor', 'framewidth'
        ];

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

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.geo.projection.rotation).toBeUndefined();
        });

        it('should not coerce projection.rotation if type is albers usa (converse)', function() {
            layoutIn = {
                geo: {
                    projection: {
                        rotation: {
                            lon: 10,
                            lat: 10
                        }
                    }
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.geo.projection.rotation).toBeDefined();
        });

        it('should not coerce coastlines and ocean if type is albers usa', function() {
            layoutIn = {
                geo: {
                    projection: {
                        type: 'albers usa'
                    },
                    showcoastlines: true,
                    showocean: true
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            seaFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });
        });

        it('should not coerce coastlines and ocean if type is albers usa (converse)', function() {
            layoutIn = {
                geo: {
                    showcoastlines: true,
                    showocean: true
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            seaFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should not coerce projection.parallels if type is conic', function() {
            var projTypes = layoutAttributes.projection.type.values;

            function testOne(projType) {
                layoutIn = {
                    geo: {
                        projection: {
                            type: projType,
                            parallels: [10, 10]
                        }
                    }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            }

            projTypes.forEach(function(projType) {
                testOne(projType);
                if(projType.indexOf('conic') !== -1) {
                    expect(layoutOut.geo.projection.parallels).toBeDefined();
                }
                else {
                    expect(layoutOut.geo.projection.parallels).toBeUndefined();
                }
            });
        });

        it('should coerce subunits only when available (usa case)', function() {
            layoutIn = {
                geo: { scope: 'usa' }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should coerce subunits only when available (default case)', function() {
            layoutIn = { geo: {} };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });
        });

        it('should coerce subunits only when available (NA case)', function() {
            layoutIn = {
                geo: {
                    scope: 'north america',
                    resolution: 50
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should coerce subunits only when available (NA case 2)', function() {
            layoutIn = {
                geo: {
                    scope: 'north america',
                    resolution: '50'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should coerce subunits only when available (NA case 2)', function() {
            layoutIn = {
                geo: {
                    scope: 'north america'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });
        });

        it('should not coerce frame unless for world scope', function() {
            var scopes = layoutAttributes.scope.values;

            function testOne(scope) {
                layoutIn = {
                    geo: { scope: scope }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            }

            scopes.forEach(function(scope) {
                testOne(scope);
                if(scope === 'world') {
                    frameFields.forEach(function(field) {
                        expect(layoutOut.geo[field]).toBeDefined();
                    });
                }
                else {
                    frameFields.forEach(function(field) {
                        expect(layoutOut.geo[field]).toBeUndefined();
                    });
                }
            });
        });

        it('should add geo data-only geos into layoutIn', function() {
            layoutIn = {};
            fullData = [{ type: 'scattergeo', geo: 'geo' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.geo).toEqual({});
        });

        it('should add geo data-only geos into layoutIn (converse)', function() {
            layoutIn = {};
            fullData = [{ type: 'scatter' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.geo).toBe(undefined);
        });

    });

});
