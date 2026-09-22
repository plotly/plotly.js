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

describe('placeLabels', function() {
    var W = 20;
    var H = 10;

    // a W x H box next to its point, like a text label with a 5px marker
    function rect(x, y) {
        return function(pos, gap) {
            var sx = pos.indexOf('right') !== -1 ? 1 : pos.indexOf('left') !== -1 ? -1 : 0;
            var sy = pos.indexOf('bottom') !== -1 ? 1 : pos.indexOf('top') !== -1 ? -1 : 0;
            var r = 6 + gap;
            var x0 = x + sx * r - (sx > 0 ? 0 : sx < 0 ? W : W / 2);
            var y0 = y + sy * r - (sy > 0 ? 0 : sy < 0 ? H : H / 2);
            return {
                x0: x0,
                y0: y0,
                x1: x0 + W,
                y1: y0 + H,
                leader: gap ? [x + sx * 5, y + sy * 5, x + sx * r, y + sy * r] : null
            };
        };
    }

    function label(x, y, opts) {
        return Object.assign({x: x, y: y, owner: {}, radius: 5, fontSize: 10, rect: rect(x, y)}, opts);
    }

    function marker(lab) {
        return {x0: lab.x - 5, y0: lab.y - 5, x1: lab.x + 5, y1: lab.y + 5, owner: lab.owner};
    }

    function place(labels, opts) {
        return geom2d.placeLabels(Object.assign({width: 200, height: 200, labels: labels}, opts));
    }

    it('places an isolated label at the first position', function() {
        var out = place([label(100, 100)]);
        expect(out[0].position).toBe('top center');
        expect(out[0].gap).toBe(0);
        expect(out[0].leader).toBe(null);
    });

    it('places labels in order of priority, then in the given order', function() {
        var a = label(100, 100, {onPoint: true});
        var b = label(100, 100, {onPoint: true, priority: 1});
        var out = place([a, b]);
        expect(out[1].position).toBe('middle center');
        expect(out[0].position).toBe('top center');
    });

    it('avoids fixed boxes and the markers of other points', function() {
        var a = label(100, 100);
        var fixed = {x0: 80, y0: 70, x1: 120, y1: 92, owner: {}};
        var out = place([a], {fixed: [fixed], markers: [marker(a)]});
        expect(out[0].position).toBe('bottom center');
        expect(out[0].gap).toBe(0);
    });

    it('moves a label out with a leader line when another marker is close', function() {
        var a = label(100, 100);
        var b = label(102, 102);
        var out = place([a, b], {markers: [marker(a), marker(b)]});
        expect(out[0].gap).toBeGreaterThan(0);
        expect(out[1].gap).toBeGreaterThan(0);
        expect(out[0].leader.length).toBe(4);
        expect(out[0].position).not.toBe(out[1].position);
    });

    it('keeps the preferred position of a label while it is free', function() {
        var out = place([label(100, 100, {prefer: 'bottom center'})]);
        expect(out[0].position).toBe('bottom center');

        var fixed = {x0: 80, y0: 108, x1: 120, y1: 130};
        out = place([label(100, 100, {prefer: 'bottom center'})], {fixed: [fixed]});
        expect(out[0].position).toBe('top center');
    });

    it('keeps the preferred gap of a label unless it can go next to its point', function() {
        var a = label(100, 100, {prefer: 'bottom center', preferGap: 25});
        var b = label(102, 102);
        var out = place([a, b], {markers: [marker(a), marker(b)]});
        expect(out[0].position).toBe('bottom center');
        expect(out[0].gap).toBe(25);

        out = place([label(100, 100, {prefer: 'bottom center', preferGap: 25})]);
        expect(out[0].gap).toBe(0);
    });

    it('hides a label outside the area', function() {
        var out = place([label(300, 100)]);
        expect(out[0]).toBe(null);
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
