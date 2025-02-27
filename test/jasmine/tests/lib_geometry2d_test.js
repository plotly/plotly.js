var geom2d = require('../../../src/lib/geometry2d');
var Drawing = require('../../../src/components/drawing');

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
    function check(x1, y1, x2, y2, x3, y3, x4, y4, expected) {
        // test swapping x/y
        var result1 = geom2d.segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4);
        var result2 = geom2d.segmentsIntersect(y1, x1, y2, x2, y3, x3, y4, x4);
        if(Array.isArray(expected)) {
            expect(result1.x).toBeWithin(expected[0], 1e-6);
            expect(result2.y).toBeWithin(expected[0], 1e-6);
            expect(result1.y).toBeWithin(expected[1], 1e-6);
            expect(result2.x).toBeWithin(expected[1], 1e-6);
        } else {
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

describe('getVisibleSegment', function() {
    beforeAll(function() {
        Drawing.makeTester();
    });

    var path;

    beforeEach(function() {
        path = Drawing.tester.append('path').node();
    });

    afterEach(function() {
        path.parentNode.removeChild(path);
    });

    // always check against the same bounds
    var bounds = {
        left: 50,
        top: 100,
        right: 250,
        bottom: 200
    };

    function checkD(d, expected, msg) {
        path.setAttribute('d', d);
        [0.1, 0.3, 1, 3, 10, 30].forEach(function(buffer) {
            var msg2 = msg ? (msg + ' - ' + buffer) : buffer;
            var vis = geom2d.getVisibleSegment(path, bounds, buffer);

            if(!expected) {
                expect(vis).toBeUndefined(msg2);
            } else {
                expect(vis.min).toBeWithin(expected.min, buffer * 1.1, msg2);
                expect(vis.max).toBeWithin(expected.max, buffer * 1.1, msg2);
                expect(vis.len).toBeWithin(expected.len, buffer * 2.1, msg2);
                expect(vis.total).toBeWithin(expected.total, 0.1, msg2);
                expect(vis.isClosed).toBe(expected.isClosed, msg2);
            }
        });
    }

    it('returns undefined if the path is out of bounds', function() {
        checkD('M0,0V500');
        checkD('M0,0H500');
        checkD('M500,0H0');
        checkD('M0,200L99,0H201L300,200L150,201Z');
    });

    it('returns the whole path if it is not clipped', function() {
        var diag = 100 * Math.sqrt(5);
        checkD('M50,100L250,200', {
            min: 0, max: diag, total: diag, len: diag, isClosed: false
        });

        checkD('M100,110H200V185Z', {
            min: 0, max: 300, total: 300, len: 300, isClosed: true
        });
    });

    it('works with initial clipping', function() {
        checkD('M0,0H150V150H100', {
            min: 250, max: 350, total: 350, len: 100, isClosed: false
        });
    });

    it('works with both ends clipped', function() {
        checkD('M0,125H100V175H0', {
            min: 50, max: 200, total: 250, len: 150, isClosed: false
        });
    });

    it('works with final clipping', function() {
        checkD('M100,150H500', {
            min: 0, max: 150, total: 400, len: 150, isClosed: false
        });
    });

    it('is open if entry/exit points match but are not the start/end points', function() {
        checkD('M0,150H100Z', {
            min: 50, max: 150, total: 200, len: 100, isClosed: false
        });

        checkD('M0,150H100H50', {
            min: 50, max: 150, total: 150, len: 100, isClosed: false
        });

        checkD('M50,150H100H0', {
            min: 0, max: 100, total: 150, len: 100, isClosed: false
        });
    });

    it('can be closed even without Z', function() {
        checkD('M100,150H200H100', {
            min: 0, max: 200, total: 200, len: 200, isClosed: true
        });

        // notice that this one goes outside the bounds but then
        // comes back in. We don't catch that part.
        checkD('M100,150V650V150', {
            min: 0, max: 1000, total: 1000, len: 1000, isClosed: true
        });
    });
});
