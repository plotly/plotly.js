const { getFitboundsLonRange, unwrapLonRange, doesCrossAntiMeridian } = require('../../../src/lib/geo_location_utils');

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
});

describe('Test geo_location_utils.doesCrossAntiMeridian', () => {
    it('returns the index of the first positive-to-negative longitude transition', () => {
        expect(doesCrossAntiMeridian([[170, 0], [179, 0], [-179, 0], [-170, 0]])).toBe(1);
        expect(doesCrossAntiMeridian([[1, 0], [-1, 0]])).toBe(0);
    });

    it('returns null when no segment crosses the antimeridian', () => {
        expect(doesCrossAntiMeridian([[-179, 0], [-170, 0], [170, 0]])).toBe(null);
        expect(doesCrossAntiMeridian([[10, 0], [20, 0], [30, 0]])).toBe(null);
        expect(doesCrossAntiMeridian([])).toBe(null);
        expect(doesCrossAntiMeridian([[10, 0]])).toBe(null);
    });
});
