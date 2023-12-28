var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var ScatterPolarGl = require('../../../src/traces/scatterpolargl');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');
var readPixel = require('../assets/read_pixel');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var checkTextTemplate = require('../assets/check_texttemplate');

function drag(gd, path) {
    var len = path.length;
    var el = d3Select(gd).select('rect.nsewdrag').node();
    var opts = {element: el};

    Lib.clearThrottle();
    mouseEvent('mousemove', path[0][0], path[0][1], opts);
    mouseEvent('mousedown', path[0][0], path[0][1], opts);

    path.slice(1, len).forEach(function(pt) {
        Lib.clearThrottle();
        mouseEvent('mousemove', pt[0], pt[1], opts);
    });

    mouseEvent('mouseup', path[len - 1][0], path[len - 1][1], opts);
}

function select(gd, path) {
    return new Promise(function(resolve, reject) {
        gd.once('plotly_selected', resolve);
        setTimeout(function() { reject('did not trigger *plotly_selected*');}, 200);
        drag(gd, path);
    });
}

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
            specs.mock || require('../../image/mocks/glpolar_scatter.json')
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
        desc: 'with hovertemplate',
        patch: function(fig) {
            fig.data[2].hovertemplate = 'template %{r} %{theta}';
            return fig;
        },
        nums: 'template 3.886013 125.2822°',
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
        mock: require('../../image/mocks/polar_categories.json'),
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
        it('@gl should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).then(done, done.fail);
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
        return d3SelectAll('canvas').size();
    }

    function totalPixels() {
        return readPixel(gd.querySelector('.gl-canvas-context'), 0, 0, 400, 400)
            .reduce(function(acc, v) { return acc + v; }, 0);
    }

    function assertEventData(actual, expected) {
        expect(actual.points.length).toBe(expected.points.length);

        expected.points.forEach(function(e, i) {
            var a = actual.points[i];
            if(a) {
                expect(a.r).toBe(e.r, 'r');
                expect(a.theta).toBe(e.theta, 'theta');
            }
        });
    }

    it('@gl should be able to toggle from svg to gl', function(done) {
        gd = createGraphDiv();

        var scene;

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            r: [1, 2, 1],
        }], {
            width: 400,
            height: 400
        })
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(1);

            return Plotly.restyle(gd, 'type', 'scatterpolargl');
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(0);

            scene = gd._fullLayout.polar._subplot._scene;
            spyOn(scene, 'destroy').and.callThrough();

            return Plotly.restyle(gd, 'type', 'scatterpolar');
        })
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(scene.destroy).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout.polar._subplot._scene).toBe(null);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(1);

            return Plotly.restyle(gd, 'type', 'scatterpolargl');
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            // this here was failing before
            // https://github.com/plotly/plotly.js/issues/3094
            // got fixed
            expect(totalPixels()).not.toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(0);
        })
        .then(done, done.fail);
    });

    it('@gl should be able to toggle from svg to gl (on graph with scattergl subplot)', function(done) {
        gd = createGraphDiv();

        var sceneXY, scenePolar;

        Plotly.newPlot(gd, [{
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
        }, {
            plotGlPixelRatio: 1
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(0);

            sceneXY = gd._fullLayout._plots.xy._scene;
            spyOn(sceneXY, 'destroy').and.callThrough();

            scenePolar = gd._fullLayout.polar._subplot._scene;
            spyOn(scenePolar, 'destroy').and.callThrough();

            return Plotly.restyle(gd, 'type', 'scatterpolar', [1]);
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(1);

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
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(0);

            return Plotly.restyle(gd, 'type', 'scatter', [0]);
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(totalPixels()).not.toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(1);

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
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(2);

            expect(sceneXY.destroy).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout._plots.xy._scene).toBe(null);
            expect(scenePolar.destroy).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout.polar._subplot._scene).toBe(null);
        })
        .then(done, done.fail);
    });

    ['r', 'theta'].forEach(function(ax) {
        [
          ['linear', [0, 180]],
          ['category', ['A', 'B']],
        ].forEach(function(test) {
            var axType = test[0];
            var axNames = {r: 'radialaxis', theta: 'angularaxis'};
            it('@gl should return the same eventData as scatter on ' + axType + ' ' + ax + ' axis', function(done) {
                var _mock = {
                    data: [{type: 'scatterpolar', r: [5, 10], theta: [0, 180]}],
                    layout: {dragmode: 'select', width: 400, height: 400}
                };
                _mock.data[0][ax] = test[1];
                gd = createGraphDiv();
                var scatterpolarEventData = {};
                var selectPath = [[185, 150], [400, 250]];

                Plotly.newPlot(gd, _mock)
                .then(delay(20))
                .then(function() {
                    expect(gd._fullLayout.polar[axNames[ax]].type).toEqual(test[0]);
                    return select(gd, selectPath);
                })
                .then(delay(20))
                .then(function(eventData) {
                    scatterpolarEventData = eventData;
                    // Make sure we selected a point
                    expect(eventData.points.length).toBe(1);
                    return Plotly.restyle(gd, 'type', 'scatterpolargl');
                })
                .then(delay(20))
                .then(function() {
                    expect(gd._fullLayout.polar[axNames[ax]].type).toEqual(test[0]);
                    return select(gd, selectPath);
                })
                .then(delay(20))
                .then(function(eventData) {
                    assertEventData(eventData, scatterpolarEventData);
                })
                .then(done, done.fail);
            });
        });
    });
});

describe('Test scatterpolargl autorange:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    describe('should return the same value as SVG scatter for ~small~ data', function() {
        var specs = [
            {name: 'markers', fig: require('../../image/mocks/polar_scatter.json')},
            {name: 'lines', fig: require('../../image/mocks/polar_line.json')},
        ];

        specs.forEach(function(s) {
            it('@gl - case ' + s.name, function(done) {
                var svgRange;

                // ensure the mocks have auto-range turned on
                var svgFig = Lib.extendDeep({}, s.fig);
                Lib.extendDeep(svgFig.layout.polar, {radialaxis: {autorange: true}});

                var glFig = Lib.extendDeep({}, svgFig);
                glFig.data.forEach(function(t) { t.type = 'scatterpolargl'; });

                Plotly.newPlot(gd, svgFig).then(function() {
                    svgRange = gd._fullLayout.polar.radialaxis.range;
                })
                .then(function() {
                    return Plotly.newPlot(gd, glFig);
                })
                .then(function() {
                    expect(gd._fullLayout.polar.radialaxis.range)
                        .toBeCloseToArray(svgRange, 'gl radial range');
                })
                .then(done, done.fail);
            });
        });
    });

    describe('should return the approximative values for ~big~ data', function() {
        var cnt;

        beforeEach(function() {
            // to avoid expansive draw calls (which could be problematic on CI)
            cnt = 0;
            spyOn(ScatterPolarGl, 'plot').and.callFake(function() {
                cnt++;
            });
        });

        // threshold for 'fast' axis expansion routine
        var N = 1e5;
        var r = new Array(N);
        var ms = new Array(N);

        Lib.seedPseudoRandom();

        for(var i = 0; i < N; i++) {
            r[i] = Lib.pseudoRandom();
            ms[i] = 20 * Lib.pseudoRandom() + 20;
        }

        it('@gl - case scalar marker.size', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatterpolargl',
                mode: 'markers',
                r: r,
                marker: {size: 5}
            }])
            .then(function() {
                expect(gd._fullLayout.polar.radialaxis.range)
                    .toBeCloseToArray([0, 1.0799], 2, 'radial range');
                expect(cnt).toBe(1, '# of plot call');
            })
            .then(done, done.fail);
        });

        it('@gl - case array marker.size', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatterpolargl',
                mode: 'markers',
                r: r,
                marker: ms
            }])
            .then(function() {
                expect(gd._fullLayout.polar.radialaxis.range)
                    .toBeCloseToArray([0, 1.0975], 2, 'radial range');
                expect(cnt).toBe(1, '# of plot call');
            })
            .then(done, done.fail);
        });

        it('@gl - case mode:lines', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scatterpolargl',
                mode: 'lines',
                r: r,
            }])
            .then(function() {
                expect(gd._fullLayout.polar.radialaxis.range)
                    .toBeCloseToArray([0, 0.9999], 2, 'radial range');
                expect(cnt).toBe(1, '# of plot call');
            })
            .then(done, done.fail);
        });
    });
});

describe('Test scatterpolargl texttemplate:', function() {
    checkTextTemplate([{
        type: 'scatterpolargl',
        mode: 'markers+text',
        text: ['A', 'B', 'C'],
        textposition: 'top center',
        r: [1, 0.5, 1],
        theta: [0, 90, 180],
    }], 'g.textpoint', [
        ['%{text}: (%{r:0.2f}, %{theta:0.1f})', ['A: (1.00, 0.0)', 'B: (0.50, 90.0)', 'C: (1.00, 180.0)']],
        [['', 'b%{theta:0.2f}', '%{theta:0.2f}'], ['', 'b90.00', '180.00']]
    ]);

    checkTextTemplate({
        data: [{
            type: 'scatterpolargl',
            mode: 'text',
            theta: ['a', 'b'],
            r: ['1000', '1200']
        }],
        layout: {
            polar: {
                radialaxis: { tickprefix: '$', ticksuffix: ' !', tickformat: '.2f'},
                angularaxis: { tickprefix: '*', ticksuffix: '*' }
            }
        }
    }, '.textpoint', [
        ['%{theta} is %{r}', ['*a* is $1000.00 !', '*b* is $1200.00 !']]
    ]);
});
