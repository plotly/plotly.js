const {
    computeBbox,
    getFitboundsLonRange,
    unwrapLonRange,
    doesCrossAntiMeridian
} = require('../../../src/lib/geo_location_utils');

describe('Test geo_location_utils.getFitboundsLonRange', () => {
    it('returns the compact crossing range when point data straddles the antimeridian', () => {
        expect(getFitboundsLonRange([131.8855, -179])).toEqual([131.8855, 181]);
        expect(getFitboundsLonRange([170, 175, -170])).toEqual([170, 190]);
    });

    it('keeps the naive range (null) when the data does not straddle the antimeridian', () => {
        expect(getFitboundsLonRange([131.8855, 179])).toBe(null);
        expect(getFitboundsLonRange([-10, 0, 20])).toBe(null);
    });

    it('keeps the naive range (null) when the data spans the whole globe', () => {
        const lons = [];
        for (let lon = 0; lon <= 360; lon += 2.5) lons.push(lon);
        expect(getFitboundsLonRange(lons)).toBe(null);
    });

    it('returns null when fewer than two finite longitudes are available', () => {
        expect(getFitboundsLonRange([10])).toBe(null);
        expect(getFitboundsLonRange([NaN, 5])).toBe(null);
        expect(getFitboundsLonRange([])).toBe(null);
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
