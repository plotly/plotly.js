var Plotly = require('../../../lib/index');
var Fx = require('../../../src/components/fx');
var Lib = require('../../../src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var click = require('../assets/click');
var mouseEvent = require('../assets/mouse_event');

function makePlot(gd, traceExtras = {}, layoutExtras = {}, configExtras) {
    return Plotly.newPlot(
        gd,
        [
            Lib.extendFlat(
                {
                    x: [1, 2, 3],
                    y: [1, 3, 2],
                    type: 'scatter',
                    mode: 'markers'
                },
                traceExtras
            )
        ],
        Lib.extendFlat(
            {
                width: 400,
                height: 400,
                margin: { l: 50, t: 50, r: 50, b: 50 },
                xaxis: { range: [0, 10] },
                yaxis: { range: [0, 10] },
                hovermode: 'closest'
            },
            layoutExtras
        ),
        configExtras
    );
}

// local midnight, as in https://github.com/plotly/plotly.js/issues/7816
var dayStart = new Date(2026, 4, 31);
var dayNoon = new Date(2026, 4, 31, 12);
var dayEnd = new Date(2026, 5, 1);

// the 300px-wide plot area spans exactly one day, so 0px is local midnight
// and 150px is local noon, in any timezone
function makeDatePlot(gd, traceExtras, layoutExtras) {
    return makePlot(
        gd,
        Lib.extendFlat({ x: [dayStart, dayNoon], y: [1, 3] }, traceExtras),
        Lib.extendFlat({ xaxis: { type: 'date', range: [dayStart, dayEnd] } }, layoutExtras)
    );
}

describe('hoveranywhere', () => {
    'use strict';

    var gd;

    beforeEach(() => (gd = createGraphDiv()));
    afterEach(destroyGraphDiv);

    function _hover(xPixel, yPixel) {
        var bb = gd.getBoundingClientRect();
        var s = gd._fullLayout._size;
        Fx.hover(
            gd,
            {
                clientX: xPixel + bb.left + s.l,
                clientY: yPixel + bb.top + s.t,
                target: gd.querySelector('.nsewdrag')
            },
            'xy'
        );
        Lib.clearThrottle();
    }

    // leave the plot area, as the maindrag sees it
    function _leavePlotArea() {
        var bb = gd.getBoundingClientRect();
        mouseEvent('mouseout', bb.left - 50, bb.top - 50, {
            element: gd.querySelector('.nsewdrag')
        });
        Lib.clearThrottle();
    }

    it('emits plotly_hover with coordinate data on empty space', (done) => {
        var hoverData;

        makePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));

                // hover over empty area (no data points nearby)
                _hover(250, 50);

                expect(hoverData).toBeDefined();
                expect(hoverData.points).toEqual([]);
                expect(hoverData.xaxes.length).toBe(1);
                expect(hoverData.yaxes.length).toBe(1);
                expect(hoverData.xaxes[0]._id).toBe('x');
                expect(hoverData.yaxes[0]._id).toBe('y');
                expect(hoverData.xvals.length).toBe(1);
                expect(hoverData.yvals.length).toBe(1);
                expect(hoverData.xvals[0]).toBeCloseTo(250 / 30, 2);
                expect(hoverData.yvals[0]).toBeCloseTo(10 - 50 / 30, 2);
                expect(hoverData.xPixel).toBeCloseTo(300, 1);  // hover x-position (250) + left margin (50)
                expect(hoverData.yPixel).toBeCloseTo(100, 1);  // hover y-position (50) + top margin (50)
            })
            .then(done, done.fail);
    });

    it('does not emit plotly_hover event on empty space when hoveranywhere is false', (done) => {
        var hoverData;

        makePlot(gd)
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));
                _hover(250, 50);
                expect(hoverData).toBeUndefined();
            })
            .then(done, done.fail);
    });

    it('still returns normal point data on traces', (done) => {
        var hoverData;

        makePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));

                // hover near (2, 3)
                _hover(60, 210);

                expect(hoverData.points.length).toBe(1);
                var pt = hoverData.points[0];
                expect(pt.x).toBe(2);
                expect(pt.y).toBe(3);
                expect(pt.curveNumber).toBe(0);
                expect(pt.pointNumber).toBe(1);
                // xPixel/yPixel: plot-area px + margin (60+50=110, 210+50=260)
                expect(pt.xPixel).toBeCloseTo(110, 1);
                expect(pt.yPixel).toBeCloseTo(260, 1);
                // bbox is page-relative (xPixel/yPixel + graph div page offset);
                // center of bbox should equal xPixel/yPixel + page offset
                var gLeft = gd.offsetLeft + gd.clientLeft;
                var gTop = gd.offsetTop + gd.clientTop;
                expect(pt.bbox).toBeDefined();
                expect((pt.bbox.x0 + pt.bbox.x1) / 2).toBeCloseTo(110 + gLeft, 1);
                expect((pt.bbox.y0 + pt.bbox.y1) / 2).toBeCloseTo(260 + gTop, 1);
                expect(pt.bbox.x0).toBeLessThan(pt.bbox.x1);
                expect(pt.bbox.y0).toBeLessThan(pt.bbox.y1);
                expect(hoverData.xaxes.length).toBe(1);
                expect(hoverData.yaxes.length).toBe(1);
                expect(hoverData.xvals.length).toBe(1);
                expect(hoverData.yvals.length).toBe(1);
                expect(hoverData.xvals[0]).toBeCloseTo(2, 2);
                expect(hoverData.yvals[0]).toBeCloseTo(3, 2);
            })
            .then(done, done.fail);
    });

    it('reports cursor position in top-level xPixel/yPixel, and point position in point-level xPixel/yPixel', (done) => {
        var hoverData;

        makePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));

                // hover near, but not exactly on, the point (2, 3), which is at px (60, 210)
                _hover(65, 205);

                expect(hoverData.points.length).toBe(1);
                // top-level: cursor position
                expect(hoverData.xPixel).toBeCloseTo(115, 1);  // hover x-position (65) + left margin (50)
                expect(hoverData.yPixel).toBeCloseTo(255, 1);  // hover y-position (205) + top margin (50)
                // point-level: position of the point itself
                expect(hoverData.points[0].xPixel).toBeCloseTo(110, 1);  // point x-position in plot area (60) + left margin (50)
                expect(hoverData.points[0].yPixel).toBeCloseTo(260, 1);  // point y-position in plot area (210) + top margin (50)
            })
            .then(done, done.fail);
    });

    it('respects hovermode:false', (done) => {
        var events = [];
        var hoverData, unhoverData;

        makePlot(gd, {}, { hoveranywhere: true, hovermode: false })
            .then(() => {
                gd.on('plotly_hover', (d) => {
                    events.push('hover');
                    hoverData = d;
                });
                gd.on('plotly_unhover', (d) => {
                    events.push('unhover');
                    unhoverData = d;
                });
                _hover(250, 50);
                _leavePlotArea();
                expect(hoverData).toBeUndefined();
                expect(unhoverData).toBeUndefined();
                expect(events).toEqual([]);
            })
            .then(done, done.fail);
    });

    it('emits plotly_unhover when the cursor leaves the plot area after hovering empty space', (done) => {
        var events = [];
        var unhoverData;

        makePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_hover', () => events.push('hover'));
                gd.on('plotly_unhover', (d) => {
                    events.push('unhover');
                    unhoverData = d;
                });

                _hover(250, 50);
                expect(events).toEqual(['hover']);

                _leavePlotArea();

                expect(events).toEqual(['hover', 'unhover']);
                expect(unhoverData.points).toEqual([]);
            })
            .then(done, done.fail);
    });

    it('emits only one unhover per departure from the plot area', (done) => {
        var events = [];

        makePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_unhover', () => events.push('unhover'));

                _hover(250, 50);
                _leavePlotArea();
                _leavePlotArea();

                expect(events).toEqual(['unhover']);
            })
            .then(done, done.fail);
    });

    it('does not emit unhover while moving within empty space', (done) => {
        var events = [];

        makePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_hover', () => events.push('hover'));
                gd.on('plotly_unhover', () => events.push('unhover'));

                _hover(250, 50);
                _hover(255, 55);
                _hover(260, 60);

                expect(events).toEqual(['hover', 'hover', 'hover']);
            })
            .then(done, done.fail);
    });

    it('emits unhover with point data, not empty points, when leaving from a point', (done) => {
        var events = [];
        var unhoverData;

        makePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_unhover', (d) => {
                    events.push('unhover');
                    unhoverData = d;
                });

                // hover empty space, then the point (2, 3), then leave
                _hover(250, 50);
                _hover(60, 210);
                _leavePlotArea();

                expect(events).toEqual(['unhover']);
                expect(unhoverData.points.length).toBe(1);
                expect(unhoverData.points[0].x).toBe(2);
                expect(unhoverData.points[0].y).toBe(3);
            })
            .then(done, done.fail);
    });

    it('does not emit unhover on leaving empty space when hoveranywhere is false', (done) => {
        var events = [];

        makePlot(gd)
            .then(() => {
                gd.on('plotly_hover', () => events.push('hover'));
                gd.on('plotly_unhover', () => events.push('unhover'));

                _hover(250, 50);
                _leavePlotArea();

                expect(events).toEqual([]);
            })
            .then(done, done.fail);
    });

    it('emits plotly_hover over an editable shape', (done) => {
        let hoverData;

        makePlot(gd, {}, {
            hoveranywhere: true,
            shapes: [
                {
                    type: 'rect',
                    x0: 6,
                    x1: 9,
                    y0: 6,
                    y1: 9,
                    fillcolor: 'rgba(0, 128, 255, 0.8)',
                    editable: true
                }
            ]
        })
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));

                // Dispatch mousemove directly on the shape path element,
                // which has pointer-events that intercept events from the
                // underlying maindrag.
                const shapePath = gd.querySelector('.shape-group path');
                expect(shapePath).toBeDefined();

                const bb = gd.getBoundingClientRect();
                const s = gd._fullLayout._size;
                // center of shape at data (7.5, 7.5) = plot-area px (225, 75)
                const mouseX = bb.left + s.l + 225;
                const mouseY = bb.top + s.t + 75;
                shapePath.dispatchEvent(
                    new MouseEvent('mousemove', {
                        bubbles: true,
                        clientX: mouseX,
                        clientY: mouseY
                    })
                );
                Lib.clearThrottle();

                expect(hoverData).toBeDefined();
                expect(hoverData.points).toEqual([]);
                expect(hoverData.xvals[0]).toBeCloseTo(7.5, 1);
                expect(hoverData.yvals[0]).toBeCloseTo(7.5, 1);
                // mouseX and mouseY are relative to the full page, so subtract the bounding box
                // to get pixel coordinates relative to the graph div, which should match hoverData.xPixel/yPixel
                expect(hoverData.xPixel).toBeCloseTo(mouseX - bb.left, 1);
                expect(hoverData.yPixel).toBeCloseTo(mouseY - bb.top, 1);
            })
            .then(done, done.fail);
    });

    it('emits plotly_hover over a shape with edits.shapePosition', (done) => {
        let hoverData;

        makePlot(
            gd,
            {},
            {
                hoveranywhere: true,
                shapes: [
                    {
                        type: 'rect',
                        x0: 6,
                        x1: 9,
                        y0: 6,
                        y1: 9,
                        fillcolor: 'rgba(0, 128, 255, 0.8)'
                    }
                ]
            },
            { edits: { shapePosition: true } }
        )
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));

                const shapePath = gd.querySelector('.shape-group path');
                expect(shapePath).toBeDefined();

                const bb = gd.getBoundingClientRect();
                const s = gd._fullLayout._size;
                shapePath.dispatchEvent(
                    new MouseEvent('mousemove', {
                        bubbles: true,
                        clientX: bb.left + s.l + 225,
                        clientY: bb.top + s.t + 75
                    })
                );
                Lib.clearThrottle();

                expect(hoverData).toBeDefined();
                expect(hoverData.points).toEqual([]);
                expect(hoverData.xvals[0]).toBeCloseTo(7.5, 1);
                expect(hoverData.yvals[0]).toBeCloseTo(7.5, 1);
            })
            .then(done, done.fail);
    });

    it('reports date axis positions as date strings', (done) => {
        var hoverData;

        makeDatePlot(gd, {}, { hoveranywhere: true })
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));

                _hover(0, 60);
                expect(hoverData.points).toEqual([]);
                expect(hoverData.xvals[0]).toBe('2026-05-31');
                expect(hoverData.yvals[0]).toBeCloseTo(10 - 60 / 30, 2);

                _hover(150, 60);
                expect(hoverData.xvals[0]).toBe('2026-05-31 12:00');

                // the point at (dayStart, 1) reports that same value
                _hover(0, gd._fullLayout.yaxis.c2p(1));
                expect(hoverData.points[0].x).toBe('2026-05-31');
                expect(hoverData.xvals[0]).toBe('2026-05-31');
            })
            .then(done, done.fail);
    });

    it('reports category names and log axis data values', (done) => {
        var hoverData;

        makePlot(
            gd,
            { x: ['a', 'b', 'c'], y: [10, 20, 30] },
            { xaxis: { type: 'category' }, yaxis: { type: 'log', range: [1, 3] }, hoveranywhere: true }
        )
            .then(() => {
                gd.on('plotly_hover', (d) => (hoverData = d));

                var xa = gd._fullLayout.xaxis;

                // empty space above the middle category, halfway up 10 -> 1000
                _hover(xa.c2p(1), 150);
                expect(hoverData.points).toEqual([]);
                expect(hoverData.xvals[0]).toBe('b');
                expect(hoverData.yvals[0]).toBeCloseTo(100, 6);

                _hover(xa.c2p(1), gd._fullLayout.yaxis.c2p(20));
                expect(hoverData.points[0].x).toBe('b');
                expect(hoverData.xvals[0]).toBe('b');
            })
            .then(done, done.fail);
    });
});

describe('clickanywhere', () => {
    'use strict';

    var gd;

    beforeEach(() => (gd = createGraphDiv()));
    afterEach(destroyGraphDiv);

    it('emits plotly_click with empty points on empty space', (done) => {
        var clickData;

        makePlot(gd, {}, { clickanywhere: true })
            .then(() => {
                gd.on('plotly_click', (d) => (clickData = d));

                const bb = gd.getBoundingClientRect();
                const s = gd._fullLayout._size;
                const clickX = bb.left + s.l + 250;
                const clickY = bb.top + s.t + 50;

                click(clickX, clickY);

                expect(clickData).toBeDefined();
                expect(clickData.points).toEqual([]);
                expect(clickData.xaxes.length).toBe(1);
                expect(clickData.yaxes.length).toBe(1);
                expect(clickData.xvals.length).toBe(1);
                expect(clickData.yvals.length).toBe(1);
                // click at 250px into 300px plot area, xrange [0,10]: 250/300*10 = 8.33
                expect(clickData.xvals[0]).toBeCloseTo(250 / 30, 2);
                // click at 50px into 300px plot area, yrange [0,10]: 10 - 50/300*10 = 8.33
                expect(clickData.yvals[0]).toBeCloseTo(10 - 50 / 30, 2);
                // click pixels: clickX and clickY are relative to full page, so subtract the graph div bounding box
                // to get pixel coordinates relative to the graph div, which should match clickData.xPixel/yPixel
                expect(clickData.xPixel).toBeCloseTo(clickX - bb.left, 1);
                expect(clickData.yPixel).toBeCloseTo(clickY - bb.top, 1);
            })
            .then(done, done.fail);
    });

    it('does not emit plotly_click event on empty space when clickanywhere is false', (done) => {
        var clickData;

        makePlot(gd)
            .then(() => {
                gd.on('plotly_click', (d) => (clickData = d));

                var bb = gd.getBoundingClientRect();
                var s = gd._fullLayout._size;
                click(bb.left + s.l + 250, bb.top + s.t + 50);

                expect(clickData).toBeUndefined();
            })
            .then(done, done.fail);
    });

    it('emits plotly_click over an editable shape', (done) => {
        let clickData;

        makePlot(gd, {}, {
            clickanywhere: true,
            shapes: [
                {
                    type: 'rect',
                    x0: 6,
                    x1: 9,
                    y0: 6,
                    y1: 9,
                    fillcolor: 'rgba(0, 128, 255, 0.8)',
                    editable: true
                }
            ]
        })
            .then(() => {
                gd.on('plotly_click', (d) => (clickData = d));

                const shapePath = gd.querySelector('.shape-group path');
                expect(shapePath).toBeDefined();

                const bb = gd.getBoundingClientRect();
                const s = gd._fullLayout._size;
                // center of shape at data (7.5, 7.5) = plot-area px (225, 75)
                shapePath.dispatchEvent(
                    new MouseEvent('click', {
                        bubbles: true,
                        clientX: bb.left + s.l + 225,
                        clientY: bb.top + s.t + 75
                    })
                );

                expect(clickData).toBeDefined();
                expect(clickData.points).toEqual([]);
                expect(clickData.xvals[0]).toBeCloseTo(7.5, 1);
                expect(clickData.yvals[0]).toBeCloseTo(7.5, 1);
            })
            .then(done, done.fail);
    });

    it('emits plotly_click over a shape with edits.shapePosition', (done) => {
        let clickData;

        makePlot(
            gd,
            {},
            {
                clickanywhere: true,
                shapes: [
                    {
                        type: 'rect',
                        x0: 6,
                        x1: 9,
                        y0: 6,
                        y1: 9,
                        fillcolor: 'rgba(0, 128, 255, 0.8)'
                    }
                ]
            },
            { edits: { shapePosition: true } }
        )
            .then(() => {
                gd.on('plotly_click', (d) => (clickData = d));

                const shapePath = gd.querySelector('.shape-group path');
                expect(shapePath).toBeDefined();

                const bb = gd.getBoundingClientRect();
                const s = gd._fullLayout._size;
                shapePath.dispatchEvent(
                    new MouseEvent('click', {
                        bubbles: true,
                        clientX: bb.left + s.l + 225,
                        clientY: bb.top + s.t + 75
                    })
                );

                expect(clickData).toBeDefined();
                expect(clickData.points).toEqual([]);
                expect(clickData.xvals[0]).toBeCloseTo(7.5, 1);
                expect(clickData.yvals[0]).toBeCloseTo(7.5, 1);
            })
            .then(done, done.fail);
    });
    it('reports date axis positions as date strings', (done) => {
        var clickData;

        makeDatePlot(gd, {}, { clickanywhere: true })
            .then(() => {
                gd.on('plotly_click', (d) => (clickData = d));

                var bb = gd.getBoundingClientRect();
                var s = gd._fullLayout._size;
                click(bb.left + s.l, bb.top + s.t + 60);

                expect(clickData.points).toEqual([]);
                expect(clickData.xvals[0]).toBe('2026-05-31');
                expect(clickData.yvals[0]).toBeCloseTo(10 - 60 / 30, 2);
            })
            .then(done, done.fail);
    });
});
