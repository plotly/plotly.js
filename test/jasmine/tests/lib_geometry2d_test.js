var geom2d = require('@src/lib/geometry2d');
var customMatchers = require('../assets/custom_matchers');

// various reversals of segments and endpoints that should all give identical results
function permute(_inner, x1, y1, x2, y2, x3, y3, x4, y4, expected) {
    _inner(x1, y1, x2, y2, x3, y3, x4, y4, expected);
    _inner(x2, y2, x1, y1, x3, y3, x4, y4, expected);
    _inner(x1, y1, x2, y2, x4, y4, x3, y3, expected);
    _inner(x2, y2, x1, y1, x4, y4, x3, y3, expected);
    _inner(x3, y3, x4, y4, x1, y1, x2, y2, expected);
    _inner(x4, y4, x3, y3, x1, y1, x2, y2, expected);
    _inner(x3, y3, x4, y4, x2, y2, x1, y1, expected);
    _inner(x4, y4, x3, y3, x2, y2, x1, y1, expected);
}

describe('segmentsIntersect', function() {
    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function check(x1, y1, x2, y2, x3, y3, x4, y4, expected) {
        // test swapping x/y
        var result1 = geom2d.segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4);
        var result2 = geom2d.segmentsIntersect(y1, x1, y2, x2, y3, x3, y4, x4);
        if(Array.isArray(expected)) {
            expect(result1.x).toBeWithin(expected[0], 1e-6);
            expect(result2.y).toBeWithin(expected[0], 1e-6);
            expect(result1.y).toBeWithin(expected[1], 1e-6);
            expect(result2.x).toBeWithin(expected[1], 1e-6);
        }
        else {
            expect(result1).toBe(expected);
            expect(result2).toBe(expected);
        }
    }

    it('catches normal intersections', function() {
        permute(check, -1, -1, 1, 1, -1, 1, 1, -1, [0, 0]);
        permute(check, -1, 0, 1, 0, 0, -1, 0, 1, [0, 0]);
        permute(check, 0, 0, 100, 100, 0, 1, 100, 99, [50, 50]);
    });

    it('catches non-intersections', function() {
        permute(check, -1, 0, 1, 0, 0, 0.1, 0, 2, null);
        permute(check, -1, -1, 1, 1, -1, 1, 1, 2, null);
        permute(check, -1, 0, 1, 0, -1, 0.0001, 1, 0.0001, null);
        permute(check, -1, 0, 1, 0.0001, -1, 0.0001, 1, 0.00011, null);
        permute(check, -1, -1, 1, 1, -1, 0, 1, 2, null);
    });

    it('does not consider colinear lines intersecting', function() {
        permute(check, -1, 0, 1, 0, -1, 0, 1, 0, null);
        permute(check, -1, 0, 1, 0, -2, 0, 2, 0, null);
        permute(check, -2, -1, 2, 1, -2, -1, 2, 1, null);
        permute(check, -4, -2, 0, 0, -2, -1, 2, 1, null);
    });
});

describe('segmentDistance', function() {
    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function check(x1, y1, x2, y2, x3, y3, x4, y4, expected) {
        var result1 = geom2d.segmentDistance(x1, y1, x2, y2, x3, y3, x4, y4);
        var result2 = geom2d.segmentDistance(y1, x1, y2, x2, y3, x3, y4, x4);
        expect(result1).toBeWithin(expected, 1e-6);
        expect(result2).toBeWithin(expected, 1e-6);
    }

    it('returns 0 if segments intersect or share endpoints', function() {
        permute(check, -1, -1, 1, 1, -1, 1, 1, -1, 0);
        permute(check, -1, 0, 1, 0, 0, -1, 0, 1, 0);
        permute(check, 0, 0, 100, 100, 0, 1, 100, 99, 0);
        permute(check, 0, 0, 1.23, 2.34, 12.99, 14.55, 1.23, 2.34, 0);
    });

    it('works in the endpoint-to-endpoint case', function() {
        permute(check, 0, 0, 1, 0, 5, 0, 6, 0, 4);
        permute(check, 0, 0, 1, 0, 5, 0, 6, 50, 4);
        permute(check, 0, -50, 1, 0, 5, 0, 6, 0, 4);
        permute(check, 0, -50, 1, 0, 5, 0, 6, 50, 4);
        permute(check, 1, -50, 1, 0, 5, 0, 5, 50, 4);

        permute(check, 0, 0, 1, 0, 2, 2, 3, 2, Math.sqrt(5));
        permute(check, 0, 0, 1, 0, 2, 2, 2, 3, Math.sqrt(5));
    });

    it('works in the endpoint-to-perpendicular case', function() {
        permute(check, -5, 0, 5, 0, 0, 1, 0, 2, 1);
        permute(check, -5, 0, 5, 0, 3.23, 1.55, -7.13, 1.65, 1.55);
        permute(check, 100, 0, 0, 100, 0, 5, 15, 0, 85 / Math.sqrt(2));
    });
});
