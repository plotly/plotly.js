var Plotly = require('../../../lib/index');
var Plots = require('../../../src/plots/plots');
var Lib = require('../../../src/lib');

var Image = require('../../../src/traces/image');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var supplyAllDefaults = require('../assets/supply_defaults');
var Fx = require('../../../src/components/fx');

describe('image supplyDefaults', function() {
    'use strict';

    var traceIn;
    var traceOut;

    var layout = {
        _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']}
    };

    var supplyDefaults = Image.supplyDefaults;

    beforeEach(function() {
        traceOut = {};
    });

    it('should set visible to false when z is empty', function() {
        traceIn = {
            z: []
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            z: [[]]
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            z: [[], [], []]
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            type: 'image',
            z: [[[255, 0, 0]]]
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'image'}, 0, layout);
        expect(traceOut.visible).toBe(true);
    });

    it('should set visible to false when source is empty', function() {
        traceIn = {
            source: null
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            type: 'image',
            source: 'data:image/png;base64,somedata'
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'image'}, 0, layout);
        expect(traceOut.visible).toBe(true);
    });

    it('should set visible to false when source is a URL', function() {
        traceIn = {
            source: 'https://antrg.com/assets/img/portrait_2013_circle_200px.png'
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.visible).toBe(false);
        expect(traceOut.source).toBe(undefined);

        traceIn = {
            type: 'image',
            source: 'data:image/png;base64,somedata'
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'image'}, 0, layout);
        expect(traceOut.visible).toBe(true);
    });

    it('should not accept source attribute that is not a data URI of an image', function() {
        traceIn = {
            source: 'javascript:alert(\'attack\')'
        };

        supplyDefaults(traceIn, traceOut);
        expect(traceOut.source).toBe(undefined);
    });

    it('should set proper zmin/zmax depending on colormodel', function() {
        var tests = [
          ['rgb', [0, 0, 0], [255, 255, 255]],
          ['rgba', [0, 0, 0, 0], [255, 255, 255, 1]],
          ['rgba256', [0, 0, 0, 0], [255, 255, 255, 255]],
          ['hsl', [0, 0, 0], [360, 100, 100]],
          ['hsla', [0, 0, 0, 0], [360, 100, 100, 1]]
        ];

        expect(tests.map(function(t) {return t[0];})).toEqual(Image.attributes.colormodel.values, 'zmin/zmax test coverage');

        tests.forEach(function(test) {
            traceIn = {
                z: [[[1, 1, 1, 1]]],
                colormodel: test[0]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.zmin).toEqual(test[1], 'default zmin for ' + test[0]);
            expect(traceOut.zmax).toEqual(test[2], 'default zmax for ' + test[0]);
            supplyDefaults(traceIn, traceOut);
        });
    });

    it('should handle incomplete zmin/zmax', function() {
        traceIn = {
            z: [[[1, 1, 1, 1]]],
            zmin: [10, 10],
            zmax: [null, 20]
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.zmin).toEqual([10, 10, 0], 'zmin default');
        expect(traceOut.zmax).toEqual([255, 20, 255], 'zmax default');

        traceIn = {
            z: [[[1, 1, 1, 1]]],
            colormodel: 'hsla',
            zmin: [null, 10, null, null, 100],
            zmax: [20]
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.zmin).toEqual([0, 10, 0, 0], 'zmin default');
        expect(traceOut.zmax).toEqual([20, 100, 100, 1], 'zmax default');
    });

    it('should set colormodel to rgba256 when source is defined', function() {
        traceIn = {
            type: 'image',
            source: 'data:image/png;base64,asdf'
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.colormodel).toBe('rgba256');
    });

    it('should override zmin/zmax when source is defined', function() {
        traceIn = {
            type: 'image',
            source: 'data:image/png;base64,asdf',
            zmin: 100,
            zmax: 50
        };
        supplyDefaults(traceIn, traceOut);
        expect(traceOut.colormodel).toBe('rgba256');
        expect(traceOut.zmin).toEqual([0, 0, 0, 0]);
        expect(traceOut.zmax).toEqual([255, 255, 255, 255]);
    });
});

describe('image smart layout defaults', function() {
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should reverse yaxis if images are present', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}];
        supplyAllDefaults(gd);
        expect(gd._fullLayout.yaxis.autorange).toBe('reversed');
    });

    it('should reverse yaxis even if another trace is present', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}, {type: 'scatter', y: [5, 3, 2]}];
        supplyAllDefaults(gd);
        expect(gd._fullLayout.yaxis.autorange).toBe('reversed');
    });

    it('should NOT reverse yaxis if it\'s already defined', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}];
        gd.layout = {yaxis: {autorange: false}};
        supplyAllDefaults(gd);
        expect(gd._fullLayout.yaxis.autorange).toBe(false);
    });

    it('should set scaleanchor to make square pixels if images are present', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}];
        supplyAllDefaults(gd);
        expect(gd._fullLayout.yaxis.scaleanchor).toBe('x');
    });

    it('should set scaleanchor even if another trace is present', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}, {type: 'scatter', y: [5, 3, 2]}];
        supplyAllDefaults(gd);
        expect(gd._fullLayout.yaxis.scaleanchor).toBe('x');
    });

    it('should NOT set scaleanchor if asked not to', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}];
        gd.layout = {yaxis: {scaleanchor: false}};
        supplyAllDefaults(gd);
        expect(gd._fullLayout.yaxis.scaleanchor).toBe(false);
    });

    it('should NOT reset scaleanchor if it\'s already defined', function() {
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}, {y: [5, 3, 2], xaxis: 'x3'}];
        gd.layout = {yaxis: {scaleanchor: 'x3'}};
        supplyAllDefaults(gd);
        expect(gd._fullLayout.yaxis.scaleanchor).toBe('x3');
    });

    it('should constrain axes to domain if images are present', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}];
        supplyAllDefaults(gd);
        expect(gd._fullLayout.xaxis.constrain).toBe('domain');
        expect(gd._fullLayout.yaxis.constrain).toBe('domain');
    });

    it('should constrain axes to domain even if another trace is present', function() {
        gd = {};
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}, {type: 'scatter', y: [5, 3, 2]}];
        supplyAllDefaults(gd);
        expect(gd._fullLayout.xaxis.constrain).toBe('domain');
        expect(gd._fullLayout.yaxis.constrain).toBe('domain');
    });

    it('should NOT constrain axes to domain if it\'s already defined', function() {
        gd.data = [{type: 'image', z: [[[255, 0, 0]]]}];
        gd.layout = {yaxis: {constrain: 'range'}, xaxis: {constrain: 'range'}};
        supplyAllDefaults(gd);
        expect(gd._fullLayout.xaxis.constrain).toBe('range');
        expect(gd._fullLayout.yaxis.constrain).toBe('range');
    });
});

describe('image plot', function() {
    'use strict';

    var gd;
    var sel = '.im > image';

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should not draw traces that are off-screen', function(done) {
        var mock = require('../../image/mocks/image_adventurer.json');
        var mockCopy = Lib.extendDeep({}, mock);

        function assertImageCnt(cnt) {
            var images = d3SelectAll(sel);

            expect(images.size()).toEqual(cnt);
        }

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
            assertImageCnt(1);

            return Plotly.relayout(gd, 'xaxis.range', [-100, -50]);
        }).then(function() {
            assertImageCnt(0);

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {
            assertImageCnt(1);
        })
        .then(done, done.fail);
    });

    function getImageURL() {
        return d3Select(sel).attr('href');
    }

    [
      ['colormodel', 'rgb', 'hsla'],
      ['zmin', [[50, 50, 50, 0]], [[100, 100, 100, 0]]],
      ['zmax', [[50, 50, 50, 1]], [[100, 100, 100, 1]]],
      ['dx', 2, 4],
      ['dy', 2, 4],
      ['z[5][5]', [[0, 0, 0, 1]], [[255, 0, 0, 1]]]
    ].forEach(function(test) {
        var attr = test[0];
        it('should be able to restyle ' + attr, function(done) {
            var mock = require('../../image/mocks/image_adventurer.json');
            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.layout = {
                width: 400,
                height: 400,
                margin: {l: 50, b: 50, t: 0, r: 0},
                xaxis: {range: [0, 50]},
                yaxis: {range: [0, 40]}
            };
            var imageURLs = [];

            Plotly.newPlot(gd, mockCopy).then(function() {
                imageURLs.push(getImageURL());

                return Plotly.restyle(gd, attr, test[1]);
            }).then(function() {
                imageURLs.push(getImageURL());

                expect(imageURLs[0]).not.toEqual(imageURLs[1], 'image should restyle to step 1');

                return Plotly.restyle(gd, attr, test[2]);
            }).then(function() {
                imageURLs.push(getImageURL());

                expect(imageURLs[1]).not.toEqual(imageURLs[2], 'image should restyle to step 2');

                return Plotly.restyle(gd, attr, test[1]);
            }).then(function() {
                imageURLs.push(getImageURL());

                expect(imageURLs[1]).toEqual(imageURLs[3], 'image should restyle step 1');
            })
            .then(done, done.fail);
        });
    });

    it('should be able to restyle x0/y0', function(done) {
        var mock = require('../../image/mocks/image_cat.json');
        var mockCopy = Lib.extendDeep({}, mock);

        var x = []; var y = [];
        Plotly.newPlot(gd, mockCopy).then(function() {
            x.push(d3Select(sel).attr('x'));
            y.push(d3Select(sel).attr('y'));

            return Plotly.restyle(gd, {x0: 50, y0: 50});
        }).then(function() {
            x.push(d3Select(sel).attr('x'));
            y.push(d3Select(sel).attr('y'));
            expect(x[1]).not.toEqual(x[0], 'image element should have a different x position');
            expect(y[1]).not.toEqual(y[0], 'image element should have a different y position');

            return Plotly.restyle(gd, {x0: 0, y0: 0});
        }).then(function() {
            x.push(d3Select(sel).attr('x'));
            y.push(d3Select(sel).attr('y'));
            expect(x[2]).not.toEqual(x[1], 'image element should have a different x position (step 2)');
            expect(y[2]).not.toEqual(y[1], 'image element should have a different y position (step 2)');

            expect(x[2]).toEqual(x[0]);
            expect(y[2]).toEqual(y[0]);
        })
        .then(done, done.fail);
    });

    it('should handle restyling x0/y0 to category', function(done) {
        var mock = require('../../image/mocks/image_opacity.json');
        var mockCopy = Lib.extendDeep({}, mock);

        var x = []; var y = [];
        Plotly.newPlot(gd, mockCopy).then(function() {
            return Plotly.restyle(gd, {x0: 50, y0: 50});
        }).then(function() {
            x.push(d3Select(sel).attr('x'));
            y.push(d3Select(sel).attr('y'));

            return Plotly.restyle(gd, {x0: 'A', y0: 'F'});
        }).then(function() {
            x.push(d3Select(sel).attr('x'));
            y.push(d3Select(sel).attr('y'));
            expect(x[1]).toEqual(x[0], 'image element should have same x position');
            expect(y[1]).toEqual(y[0], 'image element should have same y position');
        })
        .then(done, done.fail);
    });

    it('keeps the correct ordering after hide and show', function(done) {
        function getIndices() {
            var out = [];
            d3SelectAll('.im image').each(function(d) { if(d[0].trace) out.push(d[0].trace.index); });
            return out;
        }

        Plotly.newPlot(gd, [{
            type: 'image',
            z: [[[1, 2], [3, 4]]]
        }, {
            type: 'image',
            z: [[[2, 1], [4, 3]]],
            contours: {coloring: 'lines'}
        }])
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([1]);
            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
        })
        .then(done, done.fail);
    });

    it('renders pixelated image when source is defined', function(done) {
        var mock = require('../../image/mocks/image_astronaut_source.json');
        var mockCopy = Lib.extendDeep({}, mock);
        Plotly.newPlot(gd, mockCopy)
        .then(function(gd) {
            expect(gd.calcdata[0][0].trace._realImage).toBeTruthy();
        })
        .then(done, done.fail);
    });

    [
      ['yaxis.type', 'log'],
      ['xaxis.type', 'log']
    ].forEach(function(attr) {
        it('does not renders pixelated image when the axes are not compatible', function(done) {
            var mock = require('../../image/mocks/image_astronaut_source.json');
            var mockCopy = Lib.extendDeep({}, mock);
            Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                expect(gd.calcdata[0][0].trace._realImage).toBe(true);
                return Plotly.relayout(gd, attr[0], attr[1]);
            })
            .then(function(gd) {
                expect(gd.calcdata[0][0].trace._realImage).toBe(false, 'when ' + attr[0] + ' is ' + attr[1]);
            })
            .then(done, done.fail);
        });
    });
});

describe('image hover:', function() {
    'use strict';

    var gd;

    describe('for `image_cat` defined by z', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            var mock = require('../../image/mocks/image_cat.json');
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        afterAll(destroyGraphDiv);

        function _hover(gd, xval, yval) {
            var fullLayout = gd._fullLayout;
            var calcData = gd.calcdata;
            var hoverData = [];

            for(var i = 0; i < calcData.length; i++) {
                var pointData = {
                    index: false,
                    distance: 20,
                    cd: calcData[i],
                    trace: calcData[i][0].trace,
                    xa: fullLayout.xaxis,
                    ya: fullLayout.yaxis
                };

                var hoverPoint = Image.hoverPoints(pointData, xval, yval);
                if(hoverPoint) hoverData.push(hoverPoint[0]);
            }

            return hoverData;
        }

        it('should find closest point (case 1) and should', function() {
            var pt = _hover(gd, 0, 0)[0];
            expect(pt.index).toEqual([0, 0], 'have correct index');
        });

        it('should find closest point (case 2) and should', function() {
            var pt = _hover(gd, 50, 0)[0];
            expect(pt.index).toEqual([0, 50], 'have correct index');
        });
    });

    describe('for `image_adventurer` defined by z', function() {
        var mock = require('../../image/mocks/image_adventurer.json');
        beforeAll(function() {
            gd = createGraphDiv();
        });

        afterAll(destroyGraphDiv);

        function _hover(x, y) {
            var evt = { xpx: x, ypx: y };
            return Fx.hover('graph', evt, 'xy');
        }

        it('should NOT display the color information when hoverinfo is the default value', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].colormodel = 'rgb';
            mockCopy.data[0].hoverinfo = null;
            Plotly.newPlot(gd, mockCopy)
            .then(function() {_hover(205, 125);})
            .then(function() {
                assertHoverLabelContent({
                    nums: 'x: 25.5\ny: 14.5\nz: [54, 136, 153]',
                    name: ''
                });
            })
            .then(done, done.fail);
        });

        it('should display RGB channel values', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].colormodel = 'rgb';
            Plotly.newPlot(gd, mockCopy)
            .then(function() {_hover(205, 125);})
            .then(function() {
                assertHoverLabelContent({
                    nums: 'x: 25.5\ny: 14.5\nz: [54, 136, 153]\nRGB: [54, 136, 153]',
                    name: ''
                });
            })
            .then(done, done.fail);
        });

        it('should display RGBA channel values', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            Plotly.newPlot(gd, mockCopy)
            .then(function() {_hover(255, 295);})
            .then(function() {
                assertHoverLabelContent({
                    nums: 'x: 31.5\ny: 35.5\nz: [128, 77, 54, 255]\nRGBA: [128, 77, 54, 1]',
                    name: ''
                });
            })
            .then(done, done.fail);
        });

        it('should display HSL channel values', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].colormodel = 'hsl';
            Plotly.newPlot(gd, mockCopy)
            .then(function() {_hover(255, 295);})
            .then(function() {
                assertHoverLabelContent({
                    nums: 'x: 31.5\ny: 35.5\nz: [128, 77, 54]\nHSL: [128°, 77%, 54%]',
                    name: ''
                });
            })
            .then(done, done.fail);
        });

        it('should display HSLA channel values', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].colormodel = 'hsla';
            Plotly.newPlot(gd, mockCopy)
            .then(function() {_hover(255, 295);})
            .then(function() {
                assertHoverLabelContent({
                    nums: 'x: 31.5\ny: 35.5\nz: [128, 77, 54, 255]\nHSLA: [128°, 77%, 54%, 1]',
                    name: ''
                });
            })
            .then(done, done.fail);
        });

        [
          ['x', '25.5'],
          ['y', '14.5'],
          ['z', '[54, 136, 153]'],
          ['color', '[54, 136, 153]'],
          ['color[0]', '54'],
          ['color[0]', '54°', 'hsl'],
          ['color[1]', '100%', 'hsl'],
          ['color[2]', '100%', 'hsl'],
          ['color[3]', '1', 'hsla'],
        ].forEach(function(test) {
            it('should support hovertemplate variable ' + test[0], function(done) {
                var mockCopy = Lib.extendDeep({}, mock);
                mockCopy.data[0].colormodel = test[2] || 'rgb';
                mockCopy.data[0].hovertemplate = '%{' + test[0] + '}<extra></extra>';
                Plotly.newPlot(gd, mockCopy)
                .then(function() {_hover(205, 125);})
                .then(function() {
                    assertHoverLabelContent({
                        nums: test[1],
                        name: ''
                    }, 'variable `' + test[0] + '` should be available!');
                })
                .then(done, done.fail);
            });
        });

        it('should support hovertemplate variable text', function(done) {
            var mockCopy = {data: [{
                type: 'image',
                z: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]]],
                zmax: [1, 1, 1],
                text: [['A', 'B', 'C'], ['D', 'E', 'F']],
                hovertemplate: '%{text}<extra></extra>'
            }], layout: {width: 400, height: 400, yaxis: {constrain: 'range'}}};

            Plotly.newPlot(gd, mockCopy)
            .then(function() {_hover(140, 180);})
            .then(function() {
                assertHoverLabelContent({
                    nums: 'E',
                    name: ''
                }, 'variable text should be available!');
            })
            .then(done, done.fail);
        });
    });

    describe('for `image_astronaut_source` defined by source', function() {
        var mock = require('../../image/mocks/image_astronaut_source.json');
        beforeAll(function() {
            gd = createGraphDiv();
        });

        afterAll(destroyGraphDiv);

        function _hover(x, y) {
            var evt = { xpx: x, ypx: y };
            return Fx.hover('graph', evt, 'xy');
        }

        [
          ['x', '205'],
          ['y', '125'],
          ['color', '[202, 148, 125, 1]'],
          ['color[0]', '202'],
          ['z', '[202, 148, 125, 255]'],
          ['z[0]', '202']
        ].forEach(function(test) {
            it('should support hovertemplate variable ' + test[0], function(done) {
                var mockCopy = Lib.extendDeep({}, mock);
                mockCopy.data[0].colormodel = 'rgba';
                mockCopy.data[0].hovertemplate = '%{' + test[0] + '}<extra></extra>';
                Plotly.newPlot(gd, mockCopy)
                .then(function() {_hover(205, 125);})
                .then(function() {
                    assertHoverLabelContent({
                        nums: test[1],
                        name: ''
                    }, 'variable `' + test[0] + '` should be available!');
                })
                .then(done, done.fail);
            });
        });

        [
            [true, true],
            [true, 'reversed'],  // the default image layout
            ['reversed', true],
            ['reversed', 'reversed']
        ].forEach(function(test) {
            it('should show correct hover info regardless of axis directions ' + test, function(done) {
                var mockCopy = Lib.extendDeep({}, mock);
                mockCopy.layout.xaxis.autorange = test[0];
                mockCopy.layout.yaxis.autorange = test[1];
                mockCopy.data[0].colormodel = 'rgba';
                mockCopy.data[0].hovertemplate = 'x:%{x}, y:%{y}, z:%{z}<extra></extra>';
                Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    var x = 205;
                    var y = 125;

                    // adjust considering css
                    if(test[0] === 'reversed') x = 512 - x;
                    if(test[1] !== 'reversed') y = 512 - y;
                    _hover(x, y);
                })
                .then(function() {
                    assertHoverLabelContent({
                        nums: 'x:205, y:125, z:[202, 148, 125, 255]',
                        name: ''
                    }, 'positions should be correct!');
                })
                .then(done, done.fail);
            });
        });
    });
});
