var polygon = require('@src/lib/polygon'),
    polygonTester = polygon.tester,
    isBent = polygon.isSegmentBent,
    filter = polygon.filter;

describe('polygon.tester', function() {
    'use strict';

    var squareCW = [[0, 0], [0, 1], [1, 1], [1, 0]],
        squareCCW = [[0, 0], [1, 0], [1, 1], [0, 1]],
        bowtie = [[0, 0], [0, 1], [1, 0], [1, 1]],
        squareish = [
            [-0.123, -0.0456],
            [0.12345, 1.2345],
            [1.3456, 1.4567],
            [1.5678, 0.21345]],
        equilateralTriangle = [
            [0, Math.sqrt(3) / 3],
            [-0.5, -Math.sqrt(3) / 6],
            [0.5, -Math.sqrt(3) / 6]],

        zigzag = [          // 4     *
            [0, 0], [2, 1], //        \-.
            [0, 1], [2, 2], // 3       * *
            [1, 2], [3, 3], //      ,-'  |
            [2, 4], [4, 3], // 2   *-*   |
            [4, 0]],        //    ,-'    |
                            // 1 *---*   |
                            //    ,-'    |
                            // 0 *-------*
                            //   0 1 2 3 4
        inZigzag = [
            [0.5, 0.01], [1, 0.49], [1.5, 0.5], [2, 0.5], [2.5, 0.5], [3, 0.5],
            [3.5, 0.5], [0.5, 1.01], [1, 1.49], [1.5, 1.5], [2, 1.5], [2.5, 1.5],
            [3, 1.5], [3.5, 1.5], [1.5, 2.01], [2, 2.49], [2.5, 2.5], [3, 2.5],
            [3.5, 2.5], [2.5, 3.51], [3, 3.49]],
        notInZigzag = [
            [0, -0.01], [0, 0.01], [0, 0.99], [0, 1.01], [0.5, -0.01], [0.5, 0.26],
            [0.5, 0.99], [0.5, 1.26], [1, -0.01], [1, 0.51], [1, 0.99], [1, 1.51],
            [1, 1.99], [1, 2.01], [2, -0.01], [2, 2.51], [2, 3.99], [2, 4.01],
            [3, -0.01], [2.99, 3], [3, 3.51], [4, -0.01], [4, 3.01]],

        donut = [ // inner CCW, outer CW             // 3 *-----*
            [3, 0], [0, 0], [0, 1], [2, 1], [2, 2],  //   |     |
            [1, 2], [1, 1], [0, 1], [0, 3], [3, 3]], // 2 | *-* |
        donut2 = [ // inner CCW, outer CCW           //   | | | |
            [3, 3], [0, 3], [0, 1], [2, 1], [2, 2],  // 1 *-*-* |
            [1, 2], [1, 1], [0, 1], [0, 0], [3, 0]], //   |     |
                                                     // 0 *-----*
                                                     //   0 1 2 3
        inDonut = [[0.5, 0.5], [1, 0.5], [1.5, 0.5], [2, 0.5], [2.5, 0.5],
            [2.5, 1], [2.5, 1.5], [2.5, 2], [2.5, 2.5], [2, 2.5], [1.5, 2.5],
            [1, 2.5], [0.5, 2.5], [0.5, 2], [0.5, 1.5], [0.5, 1]],
        notInDonut = [[1.5, -0.5], [1.5, 1.5], [1.5, 3.5], [-0.5, 1.5], [3.5, 1.5]];

    it('should exclude points outside the bounding box', function() {
        var poly = polygonTester([[1,2], [3,4]]);
        var pts = [[0, 3], [4, 3], [2, 1], [2, 5]];
        pts.forEach(function(pt) {
            expect(poly.contains(pt)).toBe(false);
            expect(poly.contains(pt, true)).toBe(false);
            expect(poly.contains(pt, false)).toBe(false);
        });
    });

    it('should prepare a polygon object correctly', function() {
        var polyPts = [squareCW, squareCCW, bowtie, squareish, equilateralTriangle,
            zigzag, donut, donut2];

        polyPts.forEach(function(polyPt) {
            var poly = polygonTester(polyPt),
                xArray = polyPt.map(function(pt) { return pt[0]; }),
                yArray = polyPt.map(function(pt) { return pt[1]; });

            expect(poly.pts.length).toEqual(polyPt.length + 1);
            polyPt.forEach(function(pt, i) {
                expect(poly.pts[i]).toEqual(pt);
            });
            expect(poly.pts[poly.pts.length - 1]).toEqual(polyPt[0]);
            expect(poly.xmin).toEqual(Math.min.apply(null, xArray));
            expect(poly.xmax).toEqual(Math.max.apply(null, xArray));
            expect(poly.ymin).toEqual(Math.min.apply(null, yArray));
            expect(poly.ymax).toEqual(Math.max.apply(null, yArray));
        });
    });

    it('should include the whole boundary, except as per omitFirstEdge', function() {
        var polyPts = [squareCW, squareCCW, bowtie, squareish, equilateralTriangle,
            zigzag, donut, donut2];
        var np = 6; // number of intermediate points on each edge to test

        polyPts.forEach(function(polyPt) {
            var poly = polygonTester(polyPt);

            var isRect = polyPt === squareCW || polyPt === squareCCW;
            expect(poly.isRect).toBe(isRect);
            // to make sure we're only using the bounds and first pt, delete the rest
            if(isRect) poly.pts.splice(1, poly.pts.length);

            poly.pts.forEach(function(pt1, i) {
                if(!i) return;
                var pt0 = poly.pts[i - 1],
                    j;

                var testPts = [pt0, pt1];
                for(j = 1; j < np; j++) {
                    if(pt0[0] === pt1[0]) {
                        testPts.push([pt0[0], pt0[1] + (pt1[1] - pt0[1]) * j / np]);
                    }
                    else {
                        var x = pt0[0] + (pt1[0] - pt0[0]) * j / np;
                        // calculated the same way as in the pt_in_polygon source,
                        // so we know rounding errors will apply the same and this pt
                        // *really* appears on the boundary
                        testPts.push([x, pt0[1] + (x - pt0[0]) * (pt1[1] - pt0[1]) /
                                                  (pt1[0] - pt0[0])]);
                    }
                }
                testPts.forEach(function(pt, j) {
                    expect(poly.contains(pt))
                        .toBe(true, 'poly: ' + polyPt.join(';') + ', pt: ' + pt);
                    var isFirstEdge = (i === 1) || (i === 2 && j === 0) ||
                        (i === poly.pts.length - 1 && j === 1);
                    expect(poly.contains(pt, true))
                        .toBe(!isFirstEdge, 'omit: ' + !isFirstEdge + ', poly: ' +
                            polyPt.join(';') + ', pt: ' + pt);
                });
            });
        });
    });

    it('should find only the right interior points', function() {
        var zzpoly = polygonTester(zigzag);
        inZigzag.forEach(function(pt) {
            expect(zzpoly.contains(pt)).toBe(true);
        });
        notInZigzag.forEach(function(pt) {
            expect(zzpoly.contains(pt)).toBe(false);
        });

        var donutpoly = polygonTester(donut),
            donut2poly = polygonTester(donut2);
        inDonut.forEach(function(pt) {
            expect(donutpoly.contains(pt)).toBe(true);
            expect(donut2poly.contains(pt)).toBe(true);
        });
        notInDonut.forEach(function(pt) {
            expect(donutpoly.contains(pt)).toBe(false);
            expect(donut2poly.contains(pt)).toBe(false);
        });
    });
});

describe('polygon.isSegmentBent', function() {
    'use strict';

    var pts = [[0, 0], [1, 1], [2, 0], [1, 0], [100, -37]];

    it('should treat any two points as straight', function() {
        for(var i = 0; i < pts.length - 1; i++) {
            expect(isBent(pts, i, i + 1, 0)).toBe(false);
        }
    });

    function rotatePt(theta) {
        return function(pt) {
            return [
                pt[0] * Math.cos(theta) - pt[1] * Math.sin(theta),
                pt[0] * Math.sin(theta) + pt[1] * Math.cos(theta)];
        };
    }

    it('should find a bent line at the right tolerance', function() {
        for(var theta = 0; theta < 6; theta += 0.3) {
            var pts2 = pts.map(rotatePt(theta));
            expect(isBent(pts2, 0, 2, 0.99)).toBe(true);
            expect(isBent(pts2, 0, 2, 1.01)).toBe(false);
        }
    });

    it('should treat any backward motion as bent', function() {
        expect(isBent([[0, 0], [2, 0], [1, 0]], 0, 2, 10)).toBe(true);
    });
});

describe('polygon.filter', function() {
    'use strict';

    var pts = [
        [0, 0], [1, 0], [2, 0], [3, 0],
        [3, 1], [3, 2], [3, 3],
        [2, 3], [1, 3], [0, 3],
        [0, 2], [0, 1], [0, 0]];

    var ptsOut = [[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]];

    it('should give the right result if points are provided upfront', function() {
        expect(filter(pts, 0.5).filtered).toEqual(ptsOut);
    });

    it('should give the right result if points are added one-by-one', function() {
        var p = filter([pts[0]], 0.5),
            i;

        // intermediate result (the last point isn't in the final)
        for(i = 1; i < 6; i++) p.addPt(pts[i]);
        expect(p.filtered).toEqual([[0, 0], [3, 0], [3, 2]]);

        // final result
        for(i = 6; i < pts.length; i++) p.addPt(pts[i]);
        expect(p.filtered).toEqual(ptsOut);
    });

});
