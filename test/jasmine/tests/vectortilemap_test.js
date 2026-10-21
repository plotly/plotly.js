var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var click = require('../assets/click');
var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');
var assertHoverLabelContent = require('../assets/custom_assertions').assertHoverLabelContent;

var mock = require('../../image/mocks/map_vectortile-choropleth.json');

// The mock tile holds three layers:
// - squares: five squares of 10 degrees, with their lower-left corners at
//   A (-110, 30), B (-100, 30), C (-110, 40), D (-100, 40) and E (-90, 30).
//   The mock colors A to D and leaves E out of `locations`.
// - wells: points W1 (-80, 35), W2 (-75, 35), W3 (-80, 25), W4 (-75, 25) and W5 (-70, 30),
//   with integer feature ids 1 to 5 and an `oil` property. W5 has no `oil` value.
// - pipes: lines P1, P2 and P3 from lon -60 to -20, at lat 10, 0 and -10.
var MOUSE_DELAY = 100;

var WELLS = {
    W1: [-80, 35],
    W2: [-75, 35],
    W3: [-80, 25],
    W5: [-70, 30]
};

function squaresFig() {
    var fig = Lib.extendDeep({}, mock);
    fig.data = [fig.data[0]];
    return fig;
}

var CENTER = {
    A: [-105, 35],
    B: [-95, 35],
    C: [-105, 45],
    D: [-95, 45],
    E: [-85, 35]
};

describe('Test vectortilemap defaults:', function () {
    function _supply(trace) {
        var gd = { data: [Lib.extendFlat({ type: 'vectortilemap' }, trace)], layout: {} };
        supplyAllDefaults(gd);
        return gd._fullData[0];
    }

    var base = { source: 'https://example.com/tiles.json', sourcelayer: 'counties', locations: ['a'], z: [1] };

    it('should set *visible:false* when source or sourcelayer is missing', function () {
        ['source', 'sourcelayer'].forEach(function (k) {
            var trace = Lib.extendFlat({}, base);
            delete trace[k];
            expect(_supply(trace).visible).toBe(false, k);
        });
    });

    it('should draw one color, the trace color, without *locations* and *z* or *zkey*', function () {
        var fill = _supply({ source: base.source, sourcelayer: 'counties' });
        expect(fill.visible).toBe(true);
        expect(fill._length).toBe(null);
        expect(fill._hasColorscale).toBe(false);
        expect(fill.marker.color).toBe('#1f77b4');
        expect(fill.colorscale).toBe(undefined);

        var line = _supply({ source: base.source, sourcelayer: 'pipes', layertype: 'line' });
        expect(line.line.color).toBe('#1f77b4');
        expect(line.line.width).toBe(1.5);
        expect(line.marker.color).toBe(undefined);
    });

    it('should need *zmin* and *zmax* with *zkey*', function () {
        var trace = { source: base.source, sourcelayer: 'wells', layertype: 'circle', zkey: 'oil' };
        expect(_supply(trace).visible).toBe(false);

        trace.zmin = 0;
        trace.zmax = 100;
        var out = _supply(trace);
        expect(out.visible).toBe(true);
        expect(out._hasColorscale).toBe(true);
        expect(out.marker.size).toBe(4);
        expect(out.marker.line.width).toBe(0);
    });

    it('should accept an array of tile URLs as *source*', function () {
        var trace = Lib.extendFlat({}, base, { source: ['https://example.com/{z}/{x}/{y}.pbf'] });
        expect(_supply(trace).visible).toBe(true);
        trace.source = ['https://example.com/{z}/{x}/{y}.pbf', ''];
        expect(_supply(trace).visible).toBe(false);
    });

    it('should default *featureidkey* to the feature id', function () {
        expect(_supply(base).featureidkey).toBe('id');
    });
});

describe('Test vectortilemap interactions:', function () {
    var gd;

    beforeEach(function () {
        gd = createGraphDiv();
    });

    afterEach(function (done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 200);
    });

    function getMap() {
        return gd._fullLayout.map._subplot.map;
    }

    function getSourceId() {
        return gd._fullData[0]._glTrace.sourceId;
    }

    function getZState(id) {
        return getMap().getFeatureState({ source: getSourceId(), sourceLayer: 'squares', id: id }).z;
    }

    // Plotly.newPlot resolves on the first render, before every tile is ready for hover
    function plotAndWaitForTiles(fig) {
        return Plotly.newPlot(gd, fig).then(function () {
            var map = getMap();
            if (map.loaded()) return;
            return new Promise(function (resolve) {
                map.once('idle', resolve);
            });
        });
    }

    function lonlatToPage(lonlat) {
        var subplot = gd._fullLayout.map._subplot;
        var pt = subplot.project(lonlat);
        var bb = subplot.div.getBoundingClientRect();
        return [bb.left + pt.x, bb.top + pt.y];
    }

    function countTileRequests() {
        var counter = { n: 0 };
        getMap().on('dataloading', function (e) {
            if (e.tile) counter.n++;
        });
        return counter;
    }

    it('@gl should color the features in *locations* through feature state', function (done) {
        plotAndWaitForTiles(squaresFig())
            .then(function () {
                expect(getZState('A')).toBe(1);
                expect(getZState('D')).toBe(4);
                expect(getZState('E')).toBe(undefined);
            })
            .then(done, done.fail);
    });

    it('@gl should hover with *hovertemplate* and tile feature *properties*, and click', function (done) {
        var hoverPts;
        var clickPts;

        plotAndWaitForTiles(squaresFig())
            .then(function () {
                gd.on('plotly_hover', function (d) {
                    hoverPts = d.points;
                });
                gd.on('plotly_click', function (d) {
                    clickPts = d.points;
                });

                mouseEvent('mousemove', ...lonlatToPage(CENTER.D));
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                assertHoverLabelContent({ nums: 'Delta: 4' });
                expect(hoverPts.length).toBe(1);
                expect(hoverPts[0].curveNumber).toBe(0);
                expect(hoverPts[0].pointNumber).toBe(3);
                expect(hoverPts[0].location).toBe('D');
                expect(hoverPts[0].z).toBe(4);
                expect(hoverPts[0].properties).toEqual({ code: 'D', name: 'Delta' });

                click(...lonlatToPage(CENTER.D));
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                expect(clickPts.length).toBe(1);
                expect(clickPts[0].location).toBe('D');
                expect(clickPts[0].pointNumber).toBe(3);
            })
            .then(done, done.fail);
    });

    it('@gl should not hover features that are not in *locations*', function (done) {
        var hoverPts;

        plotAndWaitForTiles(squaresFig())
            .then(function () {
                gd.on('plotly_hover', function (d) {
                    hoverPts = d.points;
                });
                mouseEvent('mousemove', ...lonlatToPage(CENTER.E));
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                expect(hoverPts).toBe(undefined);
                assertHoverLabelContent({});
            })
            .then(done, done.fail);
    });

    it('@gl should hide the line layer when *marker.line.width* is 0', function (done) {
        var fig = squaresFig();
        fig.data[0].marker.line.width = 0;

        function lineVisibility() {
            return getMap().getLayoutProperty(gd._fullData[0]._glTrace.layers[1].id, 'visibility');
        }

        plotAndWaitForTiles(fig)
            .then(function () {
                expect(lineVisibility()).toBe('none');
                return Plotly.restyle(gd, 'marker.line.width', 2);
            })
            .then(function () {
                expect(lineVisibility()).toBe('visible');
            })
            .then(done, done.fail);
    });

    it('@gl should restyle *z* without a new source or a tile request', function (done) {
        var source;
        var requests;

        plotAndWaitForTiles(squaresFig())
            .then(function () {
                source = getMap().getSource(getSourceId());
                requests = countTileRequests();
                return Plotly.restyle(gd, 'z', [[40, 30, 20, 10]]);
            })
            .then(function () {
                expect(getMap().getSource(getSourceId())).toBe(source, 'same source object');
                expect(requests.n).toBe(0, 'tile requests');
                expect(getZState('A')).toBe(40);
                expect(getZState('D')).toBe(10);
                expect(gd._fullData[0].zmin).toBe(10);
                expect(gd._fullData[0].zmax).toBe(40);

                mouseEvent('mousemove', ...lonlatToPage(CENTER.D));
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                assertHoverLabelContent({ nums: 'Delta: 10' });
            })
            .then(done, done.fail);
    });

    it('@gl should clear the feature state of a location that leaves *locations*', function (done) {
        plotAndWaitForTiles(squaresFig())
            .then(function () {
                return Plotly.restyle(gd, { locations: [['A', 'B', 'C']], z: [[1, 2, 3]] });
            })
            .then(function () {
                expect(getZState('C')).toBe(3);
                expect(getZState('D')).toBe(undefined);
            })
            .then(done, done.fail);
    });

    it('@gl should make a new source when *featureidkey* changes, and match the new key', function (done) {
        var source;
        var hoverPts;

        plotAndWaitForTiles(squaresFig())
            .then(function () {
                source = getMap().getSource(getSourceId());
                return Plotly.restyle(gd, {
                    featureidkey: 'properties.name',
                    locations: [['Alpha', 'Bravo', 'Charlie', 'Delta']]
                });
            })
            .then(function () {
                var map = getMap();
                if (map.loaded()) return;
                return new Promise(function (resolve) {
                    map.once('idle', resolve);
                });
            })
            .then(function () {
                var newSource = getMap().getSource(getSourceId());
                expect(newSource).not.toBe(source, 'new source object');
                expect(newSource.promoteId).toEqual({ squares: 'name' });
                expect(getZState('Delta')).toBe(4);

                gd.on('plotly_hover', function (d) {
                    hoverPts = d.points;
                });
                mouseEvent('mousemove', ...lonlatToPage(CENTER.D));
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                expect(hoverPts[0].location).toBe('Delta');
                expect(hoverPts[0].pointNumber).toBe(3);
            })
            .then(done, done.fail);
    });

    it('@gl should share sources between traces on the same tile URL, by id mode', function (done) {
        plotAndWaitForTiles(Lib.extendDeep({}, mock))
            .then(function () {
                var ids = gd._fullData.map(function (t) {
                    return t._glTrace.sourceId;
                });
                // squares promote *code*, wells and pipes use the native feature ids
                expect(ids[2]).toBe(ids[1], 'wells and pipes share a source');
                expect(ids[0]).not.toBe(ids[1], 'squares need a promoteId source');

                var sources = Object.keys(getMap().getStyle().sources).filter(function (k) {
                    return k.indexOf('source-') === 0;
                });
                expect(sources.length).toBe(2, 'two sources on the map');
                expect(getMap().getSource(ids[0]).promoteId).toEqual({ squares: 'code' });
                expect(getMap().getSource(ids[1]).promoteId).toBe(undefined);
            })
            .then(done, done.fail);
    });

    it('@gl should hide a trace from the legend without a new source or a tile request', function (done) {
        var source;
        var requests;

        plotAndWaitForTiles(Lib.extendDeep({}, mock))
            .then(function () {
                source = getMap().getSource(getSourceId());
                requests = countTileRequests();
                return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
            })
            .then(function () {
                expect(getMap().getSource(getSourceId())).toBe(source, 'same source object');
                expect(requests.n).toBe(0, 'tile requests');
                var circleId = gd._fullData[1]._glTrace.layers[0].id;
                expect(getMap().getLayoutProperty(circleId, 'visibility')).toBe('none');
                return Plotly.restyle(gd, 'visible', true, [1]);
            })
            .then(function () {
                var circleId = gd._fullData[1]._glTrace.layers[0].id;
                expect(getMap().getLayoutProperty(circleId, 'visibility')).toBe('visible');
                expect(requests.n).toBe(0, 'tile requests');
            })
            .then(done, done.fail);
    });

    it('@gl should hover circles colored by *zkey*, with the feature id in the event data', function (done) {
        var hoverPts;

        plotAndWaitForTiles(Lib.extendDeep({}, mock))
            .then(function () {
                gd.on('plotly_hover', function (d) {
                    hoverPts = d.points;
                });
                // 4 px off the center still hits a 14 px circle
                var pos = lonlatToPage(WELLS.W1);
                mouseEvent('mousemove', pos[0] + 4, pos[1]);
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                assertHoverLabelContent({ nums: 'W1: 120 bbl' });
                expect(hoverPts.length).toBe(1);
                expect(hoverPts[0].curveNumber).toBe(1);
                expect(hoverPts[0].pointNumber).toBe(null);
                expect(hoverPts[0].id).toBe(1);
                expect(hoverPts[0].z).toBe(120);
                expect(hoverPts[0].properties.status).toBe('Producing');
                // tile coordinates are quantized: one unit of a zoom 0 tile is about 0.09 degrees
                expect(hoverPts[0].lon).toBeCloseTo(-80, 0);
                expect(hoverPts[0].lat).toBeCloseTo(35, 0);

                hoverPts = undefined;
                mouseEvent('mousemove', ...lonlatToPage(WELLS.W5));
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                expect(hoverPts).toBe(undefined, 'W5 has no *oil* value, so it is hidden');
            })
            .then(done, done.fail);
    });

    it('@gl should hover lines within a few pixels', function (done) {
        var hoverPts;

        plotAndWaitForTiles(Lib.extendDeep({}, mock))
            .then(function () {
                gd.on('plotly_hover', function (d) {
                    hoverPts = d.points;
                });
                var pos = lonlatToPage([-40, 0]);
                mouseEvent('mousemove', pos[0], pos[1] + 4);
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                assertHoverLabelContent({ nums: 'P2 oil' });
                expect(hoverPts[0].curveNumber).toBe(2);
                expect(hoverPts[0].properties.diameter).toBe(12);
            })
            .then(done, done.fail);
    });

    it('@gl should box-select rendered features, and report the box in longitude and latitude', function (done) {
        var selected;

        var fig = Lib.extendDeep({}, mock);
        fig.layout.dragmode = 'select';

        plotAndWaitForTiles(fig)
            .then(function () {
                gd.on('plotly_selected', function (d) {
                    selected = d;
                });
                // a box around W1 and W2, and the centers of squares B (-95, 35) and D (-95, 45)
                var p0 = lonlatToPage([-97, 50]);
                var p1 = lonlatToPage([-72, 33]);
                mouseEvent('mousemove', p0[0], p0[1]);
                mouseEvent('mousedown', p0[0], p0[1]);
                mouseEvent('mousemove', (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
                mouseEvent('mousemove', p1[0], p1[1]);
                mouseEvent('mouseup', p1[0], p1[1]);
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                var pts = selected.points;
                var byTrace = function (n) {
                    return pts
                        .filter(function (p) {
                            return p.curveNumber === n;
                        })
                        .map(function (p) {
                            return p.id;
                        })
                        .sort();
                };
                expect(byTrace(0)).toEqual(['B', 'D'], 'squares, by center of extent');
                expect(byTrace(1)).toEqual([1, 2], 'wells');
                expect(byTrace(2)).toEqual([], 'pipes');
                var d = pts.find(function (p) {
                    return p.id === 'D';
                });
                expect(d.pointNumber).toBe(3, 'D is item 3 of *locations*');

                var range = selected.range.map;
                expect(range[0][0]).toBeCloseTo(-97, 0);
                expect(range[1][0]).toBeCloseTo(-72, 0);

                var map = getMap();
                var source = gd._fullData[1]._glTrace.sourceId;
                expect(map.getFeatureState({ source: source, sourceLayer: 'wells', id: 1 }).selected).toBe(true);
                expect(map.getFeatureState({ source: source, sourceLayer: 'wells', id: 3 }).selected).toBe(undefined);
            })
            .then(done, done.fail);
    });

    it('@gl should match *locations* to feature ids with the MapLibre rule, so *001* matches id 1', function (done) {
        var hoverPts;
        var fig = Lib.extendDeep({}, mock);
        fig.data = [fig.data[1]];
        delete fig.data[0].zkey;
        fig.data[0].locations = ['001', '002'];
        fig.data[0].z = [10, 20];

        plotAndWaitForTiles(fig)
            .then(function () {
                var map = getMap();
                var source = gd._fullData[0]._glTrace.sourceId;
                expect(map.getFeatureState({ source: source, sourceLayer: 'wells', id: '001' }).z).toBe(10);

                gd.on('plotly_hover', function (d) {
                    hoverPts = d.points;
                });
                mouseEvent('mousemove', ...lonlatToPage(WELLS.W1));
            })
            .then(delay(MOUSE_DELAY))
            .then(function () {
                expect(hoverPts[0].location).toBe('001');
                expect(hoverPts[0].pointNumber).toBe(0);
                expect(hoverPts[0].z).toBe(10);
            })
            .then(done, done.fail);
    });

    it('@gl should warn, and draw the other traces, when a tile server cannot be reached', function (done) {
        spyOn(Lib, 'warn');
        var fig = squaresFig();
        fig.data.unshift({
            type: 'vectortilemap',
            source: ['http://127.0.0.1:9/{z}/{x}/{y}.pbf'],
            sourcelayer: 'nothing',
            layertype: 'line'
        });

        plotAndWaitForTiles(fig)
            .then(function () {
                return delay(500)();
            })
            .then(function () {
                expect(Lib.warn).toHaveBeenCalled();
                var squares = getMap().queryRenderedFeatures({ layers: [gd._fullData[1]._glTrace.mainLayerId] });
                expect(squares.length).toBeGreaterThan(0, 'the squares trace draws');
            })
            .then(done, done.fail);
    });
});
