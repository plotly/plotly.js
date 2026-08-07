const {
    boundsOfCoords,
    computeBbox,
    coordsOf,
    fitGeojsonBbox,
    fitGeojsonCoords,
    unwrapLonRange,
    doesCrossAntiMeridian
} = require('../../../src/lib/geo_location_utils');

describe('Test geo_location_utils.coordsOf', () => {
    it('returns every coordinate in the object', () => {
        expect(coordsOf({ type: 'Point', coordinates: [10, 0] })).toEqual([[10, 0]]);
        expect(coordsOf({ type: 'MultiPoint', coordinates: [[20, 1], [30, 2]] })).toEqual([[20, 1], [30, 2]]);
    });

    it('returns an empty array for input with no extractable coordinates', () => {
        expect(coordsOf({ type: 'Sphere' })).toEqual([]);
        expect(coordsOf({ type: 'FeatureCollection', features: [] })).toEqual([]);
        expect(coordsOf(null)).toEqual([]);
        expect(coordsOf(undefined)).toEqual([]);
        expect(coordsOf({})).toEqual([]);
    });
});

describe('Test geo_location_utils.boundsOfCoords', () => {
    it('bounds several objects together, finding the compact crossing range', () => {
        // separately these bbox to [172.6, 173.3] and [-141, -52.6]; min/maxing those
        // endpoints spans 314deg, while bounding the coordinates together spans 135deg
        const coords = [
            coordsOf({ type: 'MultiPoint', coordinates: [[172.6, 52], [173.3, 53]] }),
            coordsOf({ type: 'MultiPoint', coordinates: [[-141, 60], [-52.6, 47]] })
        ].flat();

        const [west, , east] = boundsOfCoords(coords);
        expect(west).toBeCloseTo(172.6, 6);
        expect(east).toBeCloseTo(307.4, 6);
    });

    it('agrees with computeBbox, which is defined in terms of it', () => {
        const fc = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [172.6, 52] } },
                { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [-52.6, 47] } }
            ]
        };

        expect(boundsOfCoords(coordsOf(fc))).toEqual(computeBbox(fc));
    });

    it('returns null when there are no coordinates', () => {
        expect(boundsOfCoords([])).toBe(null);
    });
});

describe('Test geo_location_utils.fitGeojsonCoords / fitGeojsonBbox', () => {
    // straddles the antimeridian: bounding both points together spans 135deg
    const crossing = { type: 'MultiPoint', coordinates: [[172.6, 52], [-52.6, 47]] };
    const trace = (geojson, locationmode = 'geojson-id') => ({ geojson, locationmode });
    const geojsonFit = { fitbounds: 'geojson' };

    it('returns the whole geojson coordinates in geojson fitbounds mode', () => {
        expect(fitGeojsonCoords(trace(crossing), geojsonFit)).toEqual([[172.6, 52], [-52.6, 47]]);
    });

    it('bounds them across the antimeridian, east past 180', () => {
        const [west, , east] = fitGeojsonBbox(trace(crossing), geojsonFit);

        expect(west).toBeCloseTo(172.6, 6);
        expect(east).toBeCloseTo(307.4, 6);
    });

    it('declines for any other fitbounds mode or locationmode', () => {
        expect(fitGeojsonCoords(trace(crossing), { fitbounds: 'locations' })).toEqual([]);
        expect(fitGeojsonCoords(trace(crossing), { fitbounds: false })).toEqual([]);
        expect(fitGeojsonCoords(trace(crossing, 'ISO-3'), geojsonFit)).toEqual([]);

        expect(fitGeojsonBbox(trace(crossing), { fitbounds: 'locations' })).toBe(null);
        expect(fitGeojsonBbox(trace(crossing, 'ISO-3'), geojsonFit)).toBe(null);
    });

    it('declines when the geojson has nothing extractable, so callers fall back', () => {
        for (const geojson of [{ type: 'Sphere' }, { type: 'FeatureCollection', features: [] }]) {
            expect(fitGeojsonCoords(trace(geojson), geojsonFit)).toEqual([]);
            expect(fitGeojsonBbox(trace(geojson), geojsonFit)).toBe(null);
        }
    });

    it('keeps the two in step — the bbox is the bounds of the coords', () => {
        for (const geojson of [crossing, { type: 'Sphere' }]) {
            const t = trace(geojson);
            expect(fitGeojsonBbox(t, geojsonFit)).toEqual(boundsOfCoords(fitGeojsonCoords(t, geojsonFit)));
        }
    });
});

describe('Test geo_location_utils.unwrapLonRange', () => {
    it('shifts lon1 by +360 when the range crosses the antimeridian', () => {
        expect(unwrapLonRange([170, -170])).toEqual([170, 190]);
        expect(unwrapLonRange([1, -1])).toEqual([1, 359]);
    });

    it('leaves the pair unchanged when the range does not cross the antimeridian', () => {
        expect(unwrapLonRange([-170, 170])).toEqual([-170, 170]);
        expect(unwrapLonRange([-10, 10])).toEqual([-10, 10]);
        expect(unwrapLonRange([-170, -10])).toEqual([-170, -10]);
        expect(unwrapLonRange([10, 170])).toEqual([10, 170]);
    });

    it('unwraps same-sign descending pairs', () => {
        expect(unwrapLonRange([-5, -170])).toEqual([-5, 190]);
        expect(unwrapLonRange([170, 5])).toEqual([170, 365]);
    });
});

describe('Test geo_location_utils.computeBbox', () => {
    const franceCCW = {
        type: 'Polygon',
        coordinates: [
            [
                [-5, 41],
                [10, 41],
                [10, 51],
                [-5, 51],
                [-5, 41]
            ]
        ]
    };
    const franceCW = {
        type: 'Polygon',
        coordinates: [
            [
                [-5, 41],
                [-5, 51],
                [10, 51],
                [10, 41],
                [-5, 41]
            ]
        ]
    };
    // Fiji-ish narrow band crossing the antimeridian.
    const fiji = {
        type: 'Polygon',
        coordinates: [
            [
                [176, -19],
                [180, -19],
                [-178, -19],
                [-178, -16],
                [180, -16],
                [176, -16],
                [176, -19]
            ]
        ]
    };
    // Russia-ish MultiPolygon with parts on both sides of ±180.
    const russia = {
        type: 'MultiPolygon',
        coordinates: [
            [
                [
                    [30, 55],
                    [170, 55],
                    [170, 75],
                    [30, 75],
                    [30, 55]
                ]
            ],
            [
                [
                    [-180, 65],
                    [-170, 65],
                    [-170, 72],
                    [-180, 72],
                    [-180, 65]
                ]
            ]
        ]
    };

    it('returns a degenerate bbox for a single Point', () => {
        expect(computeBbox({ type: 'Point', coordinates: [10, 45] })).toEqual([10, 45, 10, 45]);
    });

    it('returns a normal bbox for a non-antimeridian polygon', () => {
        expect(computeBbox(franceCCW)).toEqual([-5, 41, 10, 51]);
    });

    it('is winding-agnostic (CCW and CW polygons yield the same bbox)', () => {
        expect(computeBbox(franceCW)).toEqual(computeBbox(franceCCW));
    });

    it('unwraps east past 180° for a polygon that crosses the antimeridian', () => {
        expect(computeBbox(fiji)).toEqual([176, -19, 182, -16]);
    });

    it('unwraps east past 180° for a MultiPolygon that crosses the antimeridian', () => {
        expect(computeBbox(russia)).toEqual([30, 55, 190, 75]);
    });

    it('handles a FeatureCollection mixing antimeridian and non-antimeridian features', () => {
        const fc = {
            type: 'FeatureCollection',
            features: [
                { type: 'Feature', geometry: russia, properties: {} },
                { type: 'Feature', geometry: franceCCW, properties: {} }
            ]
        };
        expect(computeBbox(fc)).toEqual([-5, 41, 190, 75]);
    });

    it('unwraps identically whether the input is a raw Geometry or wrapped in a Feature', () => {
        const raw = computeBbox(russia);
        const wrapped = computeBbox({ type: 'Feature', geometry: russia, properties: {} });
        expect(wrapped).toEqual(raw);
    });

    it('returns null for inputs with no extractable coordinates', () => {
        expect(computeBbox({ type: 'Sphere' })).toBe(null);
        expect(computeBbox({ type: 'FeatureCollection', features: [] })).toBe(null);
    });

    it('returns null for nullish or malformed inputs instead of throwing', () => {
        expect(computeBbox(null)).toBe(null);
        expect(computeBbox(undefined)).toBe(null);
        expect(computeBbox({})).toBe(null);
    });
});

describe('Test geo_location_utils.doesCrossAntiMeridian', () => {
    it('returns the index of the first positive-to-negative longitude transition', () => {
        expect(
            doesCrossAntiMeridian([
                [170, 0],
                [179, 0],
                [-179, 0],
                [-170, 0]
            ])
        ).toBe(1);
        expect(
            doesCrossAntiMeridian([
                [1, 0],
                [-1, 0]
            ])
        ).toBe(0);
    });

    it('returns null when no segment crosses the antimeridian', () => {
        expect(
            doesCrossAntiMeridian([
                [-179, 0],
                [-170, 0],
                [170, 0]
            ])
        ).toBe(null);
        expect(
            doesCrossAntiMeridian([
                [10, 0],
                [20, 0],
                [30, 0]
            ])
        ).toBe(null);
        expect(doesCrossAntiMeridian([])).toBe(null);
        expect(doesCrossAntiMeridian([[10, 0]])).toBe(null);
    });
});
