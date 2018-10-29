var Plotly = require('@lib');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var readPixel = require('../assets/read_pixel');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test scatterpolargl hover:', function() {
    var gd;

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(
            {width: 700, height: 500},
            specs.mock || require('@mocks/glpolar_scatter.json')
        );

        if(specs.patch) {
            fig = specs.patch(fig);
        }

        var pos = specs.pos || [200, 200];

        return Plotly.newPlot(gd, fig).then(function() {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent(specs);
        });
    }

    [{
        desc: 'base',
        nums: 'r: 3.886013\nθ: 125.2822°',
        name: 'Trial 3'
    }, {
        desc: '(no labels - out of sector)',
        patch: function(fig) {
            fig.layout.polar.sector = [15, 75];
            return fig;
        },
        pos: [144, 350],
        nums: '',
        name: ''
    }, {
        desc: 'on a `thetaunit: radians` polar subplot',
        patch: function(fig) {
            fig.layout.polar.angularaxis.thetaunit = 'radians';
            return fig;
        },
        nums: 'r: 3.886013\nθ: 2.186586',
        name: 'Trial 3'
    }, {
        desc: 'on log radial axis',
        patch: function(fig) {
            fig.layout.polar.radialaxis.type = 'log';
            return fig;
        },
        nums: 'r: 1.108937\nθ: 115.4969°',
        name: 'Trial 3'
    }, {
        desc: 'on category axes',
        mock: require('@mocks/polar_categories.json'),
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.type = 'scatterpolargl';
                t.fill = 'none';
            });
            return fig;
        },
        pos: [470, 80],
        nums: 'r: 4\nθ: d',
        name: 'angular cate...'
    }, {
        desc: 'with custom text scalar',
        patch: function(fig) {
            fig.data.forEach(function(t) { t.text = 'a'; });
            return fig;
        },
        nums: 'r: 3.886013\nθ: 125.2822°\na',
        name: 'Trial 3'
    }, {
        desc: 'with custom text array',
        patch: function(fig) {
            fig.data.forEach(function(t) { t.text = t.r.map(String); });
            return fig;
        },
        nums: 'r: 3.886013\nθ: 125.2822°\n3.88601339194',
        name: 'Trial 3'
    }]
    .forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).catch(failTest).then(done);
        });
    });
});

describe('Test scatterpolargl interactions:', function() {
    var gd;

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function countCanvases() {
        return d3.selectAll('canvas').size();
    }

    function totalPixels() {
        return readPixel(gd.querySelector('.gl-canvas-context'), 0, 0, 400, 400)
            .reduce(function(acc, v) { return acc + v; }, 0);
    }

    it('@gl should be able to toggle from svg to gl', function(done) {
        gd = createGraphDiv();

        var scene;

        Plotly.plot(gd, [{
            type: 'scatterpolar',
            r: [1, 2, 1],
        }], {
            width: 400,
            height: 400
        })
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(1);

            return Plotly.restyle(gd, 'type', 'scatterpolargl');
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(0);

            scene = gd._fullLayout.polar._subplot._scene;
            spyOn(scene, 'destroy').and.callThrough();

            return Plotly.restyle(gd, 'type', 'scatterpolar');
        })
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(scene.destroy).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout.polar._subplot._scene).toBe(null);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(1);

            return Plotly.restyle(gd, 'type', 'scatterpolargl');
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            // this here was failing before
            // https://github.com/plotly/plotly.js/issues/3094
            // got fixed
            expect(totalPixels()).not.toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(0);
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should be able to toggle from svg to gl (on graph with scattergl subplot)', function(done) {
        gd = createGraphDiv();

        var sceneXY, scenePolar;

        Plotly.plot(gd, [{
            type: 'scattergl',
            y: [1, 2, 1]
        }, {
            type: 'scatterpolargl',
            r: [1, 2, 1]
        }], {
            grid: {rows: 1, columns: 2},
            yaxis: {domain: {column: 0}},
            polar: {domain: {column: 1}},
            width: 400,
            height: 400
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(0);

            sceneXY = gd._fullLayout._plots.xy._scene;
            spyOn(sceneXY, 'destroy').and.callThrough();

            scenePolar = gd._fullLayout.polar._subplot._scene;
            spyOn(scenePolar, 'destroy').and.callThrough();

            return Plotly.restyle(gd, 'type', 'scatterpolar', [1]);
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(1);

            expect(sceneXY.destroy).toHaveBeenCalledTimes(0);
            expect(gd._fullLayout._plots.xy._scene).not.toBe(null);

            // N.B. does not destroy scene in this case,
            // we don't need as the same gl canvases are still there
            expect(scenePolar.destroy).toHaveBeenCalledTimes(0);
            expect(gd._fullLayout.polar._subplot._scene).not.toBe(null);

            return Plotly.restyle(gd, 'type', 'scatterpolargl', [1]);
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(0);

            return Plotly.restyle(gd, 'type', 'scatter', [0]);
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(1);

            // Similarly, does not destroy scene in this case,
            // we don't need as the same gl canvases are still there
            expect(sceneXY.destroy).toHaveBeenCalledTimes(0);
            expect(gd._fullLayout._plots.xy._scene).not.toBe(null);

            expect(scenePolar.destroy).toHaveBeenCalledTimes(0);
            expect(gd._fullLayout.polar._subplot._scene).not.toBe(null);

            return Plotly.restyle(gd, 'type', 'scatterpolar', [1]);
        })
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(2);

            expect(sceneXY.destroy).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout._plots.xy._scene).toBe(null);
            expect(scenePolar.destroy).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout.polar._subplot._scene).toBe(null);
        })
        .catch(failTest)
        .then(done);
    });
});
