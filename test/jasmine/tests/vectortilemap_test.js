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

// The mock tile holds five squares of 10 degrees, with their lower-left corners at
// A (-110, 30), B (-100, 30), C (-110, 40), D (-100, 40) and E (-90, 30).
// The mock colors A to D and leaves E out of `locations`.
var MOUSE_DELAY = 100;

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

    it('should set *visible:false* when source, sourcelayer, locations or z is missing', function () {
        ['source', 'sourcelayer', 'locations', 'z'].forEach(function (k) {
            var trace = Lib.extendFlat({}, base);
            delete trace[k];
            expect(_supply(trace).visible).toBe(false, k);
        });
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
        plotAndWaitForTiles(Lib.extendDeep({}, mock))
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

        plotAndWaitForTiles(Lib.extendDeep({}, mock))
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

        plotAndWaitForTiles(Lib.extendDeep({}, mock))
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

    it('@gl should restyle *z* without a new source or a tile request', function (done) {
        var source;
        var requests;

        plotAndWaitForTiles(Lib.extendDeep({}, mock))
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
        plotAndWaitForTiles(Lib.extendDeep({}, mock))
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

        plotAndWaitForTiles(Lib.extendDeep({}, mock))
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
});
