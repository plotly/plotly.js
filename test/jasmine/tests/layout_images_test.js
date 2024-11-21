var Plotly = require('../../../lib/index');
var Plots = require('../../../src/plots/plots');
var Images = require('../../../src/components/images');
var Lib = require('../../../src/lib');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');

var jsLogo = 'https://images.plot.ly/language-icons/api-home/js-logo.png';
var pythonLogo = 'https://images.plot.ly/language-icons/api-home/python-logo.png';

// Single red pixel png generated with http://png-pixel.com/
var dataUriImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfF' +
    'cSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

describe('Layout images', function() {
    describe('supplyLayoutDefaults', function() {
        var layoutIn,
            layoutOut;

        beforeEach(function() {
            layoutIn = { images: [] };
            layoutOut = {
                _has: Plots._hasPlotType,
                _subplots: {xaxis: [], yaxis: []}
            };
        });

        it('should reject when there is no `source`', function() {
            layoutIn.images[0] = { opacity: 0.5, sizex: 0.2, sizey: 0.2 };

            Images.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut.images).toEqual([jasmine.objectContaining({
                visible: false,
                _index: 0,
                _input: layoutIn.images[0]
            })]);
        });

        it('should reject when not an array', function() {
            layoutIn.images = {
                source: jsLogo,
                opacity: 0.5,
                sizex: 0.2,
                sizey: 0.2
            };

            Images.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut.images).toEqual([]);
        });

        it('should coerce the correct defaults', function() {
            var image = { source: jsLogo };

            layoutIn.images[0] = image;

            var expected = {
                source: jsLogo,
                visible: true,
                layer: 'above',
                x: 0,
                y: 0,
                xanchor: 'left',
                yanchor: 'top',
                sizex: 0,
                sizey: 0,
                sizing: 'contain',
                opacity: 1,
                xref: 'paper',
                yref: 'paper',
                _input: image,
                _index: 0
            };

            Images.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut.images[0]).toEqual(jasmine.objectContaining(expected));
        });
    });

    describe('drawing', function() {
        var gd;
        var data = [{ x: [1, 2, 3], y: [1, 2, 3] }];

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function checkLayers(upper, lower, subplot) {
            var upperLayer = gd._fullLayout._imageUpperLayer;
            expect(upperLayer.size()).toBe(1);
            expect(upperLayer.selectAll('image').size()).toBe(upper);

            var lowerLayer = gd._fullLayout._imageLowerLayer;
            expect(lowerLayer.size()).toBe(1);
            expect(lowerLayer.selectAll('image').size()).toBe(lower);

            var subplotLayer = gd._fullLayout._plots.xy.imagelayer;
            expect(subplotLayer.size()).toBe(1);
            expect(subplotLayer.selectAll('image').size()).toBe(subplot);
        }

        it('should draw images on the right layers', function(done) {
            Plotly.newPlot(gd, data, { images: [{
                source: jsLogo,
                layer: 'above'
            }]})
            .then(function() {
                checkLayers(1, 0, 0);
            })
            .then(function() {
                return Plotly.newPlot(gd, data, { images: [{
                    source: jsLogo,
                    layer: 'below'
                }]});
            })
            .then(function() {
                checkLayers(0, 1, 0);
            })
            .then(function() {
                return Plotly.newPlot(gd, data, { images: [{
                    source: jsLogo,
                    layer: 'below',
                    xref: 'x',
                    yref: 'y'
                }]});
            })
            .then(function() {
                checkLayers(0, 0, 1);
            })
            .then(done, done.fail);
        });

        it('should fall back on imageLowerLayer for below missing subplots', function(done) {
            Plotly.newPlot(gd, [
                {x: [1, 3], y: [1, 3]},
                {x: [1, 3], y: [1, 3], xaxis: 'x2', yaxis: 'y2'}
            ], {
                xaxis: {domain: [0, 0.5]},
                yaxis: {domain: [0, 0.5]},
                xaxis2: {domain: [0.5, 1], anchor: 'y2'},
                yaxis2: {domain: [0.5, 1], anchor: 'x2'},
                images: [{
                    source: jsLogo,
                    layer: 'below',
                    xref: 'x',
                    yref: 'y2'
                }, {
                    source: jsLogo,
                    layer: 'below',
                    xref: 'x2',
                    yref: 'y'
                }]
            })
            .then(function() {
                checkLayers(0, 2, 0);
            })
            .then(done, done.fail);
        });

        describe('with anchors and sizing', function() {
            function testAspectRatio(expected) {
                var image = d3Select('image');
                var parValue = image.attr('preserveAspectRatio');

                expect(parValue).toBe(expected);
            }

            it('should work for center middle', function(done) {
                Plotly.newPlot(gd, data, { images: [{
                    source: jsLogo,
                    xanchor: 'center',
                    yanchor: 'middle'
                }]})
                .then(function() {
                    expect(d3Select('image').attr('preserveAspectRatio')).toBe('xMidYMid');
                })
                .then(done, done.fail);
            });

            it('should work for left top', function(done) {
                Plotly.newPlot(gd, data, { images: [{
                    source: jsLogo,
                    xanchor: 'left',
                    yanchor: 'top'
                }]})
                .then(function() {
                    testAspectRatio('xMinYMin');
                })
                .then(done, done.fail);
            });

            it('should work for right bottom', function(done) {
                Plotly.newPlot(gd, data, { images: [{
                    source: jsLogo,
                    xanchor: 'right',
                    yanchor: 'bottom'
                }]})
                .then(function() {
                    testAspectRatio('xMaxYMax');
                })
                .then(done, done.fail);
            });

            it('should work for stretch sizing', function(done) {
                Plotly.newPlot(gd, data, { images: [{
                    source: jsLogo,
                    xanchor: 'middle',
                    yanchor: 'center',
                    sizing: 'stretch'
                }]})
                .then(function() {
                    testAspectRatio('none');
                })
                .then(done, done.fail);
            });

            it('should work for fill sizing', function(done) {
                Plotly.newPlot(gd, data, { images: [{
                    source: jsLogo,
                    xanchor: 'invalid',
                    yanchor: 'invalid',
                    sizing: 'fill'
                }]})
                .then(function() {
                    testAspectRatio('xMinYMin slice');
                })
                .then(done, done.fail);
            });
        });
    });

    describe('when the plot is dragged', function() {
        var gd;
        var data = [{ x: [1, 2, 3], y: [1, 2, 3] }];

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should not move when referencing the paper', function(done) {
            var image = {
                source: jsLogo,
                xref: 'paper',
                yref: 'paper',
                x: 0,
                y: 0,
                sizex: 0.1,
                sizey: 0.1
            };

            Plotly.newPlot(gd, data, {
                images: [image],
                dragmode: 'pan',
                width: 600,
                height: 400
            }).then(function() {
                var img = d3Select('image').node();
                var oldPos = img.getBoundingClientRect();

                mouseEvent('mousedown', 250, 200);
                mouseEvent('mousemove', 300, 250);

                var newPos = img.getBoundingClientRect();

                expect(newPos.left).toBe(oldPos.left);
                expect(newPos.top).toBe(oldPos.top);

                mouseEvent('mouseup', 300, 250);
            })
            .then(done, done.fail);
        });

        it('should move when referencing axes', function(done) {
            var image = {
                source: jsLogo,
                xref: 'x',
                yref: 'y',
                x: 2,
                y: 2,
                sizex: 1,
                sizey: 1
            };

            Plotly.newPlot(gd, data, {
                images: [image],
                dragmode: 'pan',
                width: 600,
                height: 400
            }).then(function() {
                var img = d3Select('image').node();
                var oldPos = img.getBoundingClientRect();

                mouseEvent('mousedown', 250, 200);
                mouseEvent('mousemove', 300, 250);

                var newPos = img.getBoundingClientRect();

                expect(newPos.left).toBe(oldPos.left + 50);
                expect(newPos.top).toBe(oldPos.top + 50);

                mouseEvent('mouseup', 300, 250);
            })
            .then(done, done.fail);
        });
    });

    describe('when relayout', function() {
        var gd;
        var data = [{ x: [1, 2, 3], y: [1, 2, 3] }];

        var layoutFn = function() {
            return {
                images: [{
                    source: jsLogo,
                    x: 2,
                    y: 2,
                    sizex: 1,
                    sizey: 1
                }],
                width: 500,
                height: 400
            };
        }

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.newPlot(gd, data, layoutFn()).then(done);
        });

        afterEach(destroyGraphDiv);

        it('should only create canvas if url image and staticPlot', function(done) {
            var originalCreateElement = document.createElement;
            var newCanvasElement;
            spyOn(document, 'createElement').and.callFake(function(elementType) {
                var element = originalCreateElement.call(document, elementType);
                if(elementType === 'canvas') {
                    newCanvasElement = element;
                    spyOn(newCanvasElement, 'toDataURL');
                }
                return element;
            });

            Plotly.relayout(gd, 'images[0].source', dataUriImage)
            .then(function() {
                expect(newCanvasElement).withContext('non-static data uri').toBeUndefined();

                return Plotly.relayout(gd, 'images[0].source', jsLogo);
            })
            .then(function() {
                expect(newCanvasElement).withContext('non-static url').toBeUndefined();

                return Plotly.newPlot(gd, data, layoutFn(), {staticPlot: true});
            })
            .then(function() {
                newCanvasElement = undefined;
                return Plotly.relayout(gd, 'images[0].source', dataUriImage);
            })
            .then(function() {
                expect(newCanvasElement).withContext('static data uri').toBeUndefined();

                return Plotly.relayout(gd, 'images[0].source', jsLogo);
            })
            .then(function() {
                expect(newCanvasElement).toBeDefined();
                expect(newCanvasElement.toDataURL).toHaveBeenCalledTimes(1);
            })
            .then(done, done.fail);
        });

        it('should update the image if changed', function(done) {
            var img = d3Select('image');
            var url = img.attr('xlink:href');

            Plotly.relayout(gd, 'images[0].source', pythonLogo)
            .then(function() {
                var newImg = d3Select('image');
                var newUrl = newImg.attr('xlink:href');
                expect(url).not.toBe(newUrl);
            })
            .then(done, done.fail);
        });

        it('should update the image position if changed', function(done) {
            var update = {
                'images[0].x': 0,
                'images[0].y': 1
            };

            var img = d3Select('image');

            expect([+img.attr('x'), +img.attr('y')]).toEqual([760, -120]);

            Plotly.relayout(gd, update)
            .then(function() {
                var newImg = d3Select('image');
                expect([+newImg.attr('x'), +newImg.attr('y')]).toEqual([80, 100]);
            })
            .then(done, done.fail);
        });

        it('should remove the image tag if an invalid source and staticPlot', function(done) {
            var selection = d3Select('image');
            expect(selection.size()).toBe(1);

            Plotly.relayout(gd, 'images[0].source', 'invalidUrl')
            .then(function() {
                var newSelection = d3Select('image');
                expect(newSelection.size()).toBe(1);
            })
            .then(function() {
                return Plotly.newPlot(gd, data, layoutFn(), {staticPlot: true});
            })
            .then(function() {
                return Plotly.relayout(gd, 'images[0].source', 'invalidUrl');
            })
            .then(function() {
                var newSelection = d3Select('image');
                expect(newSelection.size()).toBe(0);
            })
            .then(done, done.fail);
        });
    });

    describe('when adding/removing images', function() {
        afterEach(destroyGraphDiv);

        it('should properly add and remove image', function(done) {
            var gd = createGraphDiv();
            var data = [{ x: [1, 2, 3], y: [1, 2, 3] }];
            var layout = { width: 500, height: 400 };

            var imgEls;

            function makeImage(source, x, y) {
                return {
                    source: source,
                    x: x,
                    y: y,
                    sizex: 1,
                    sizey: 1
                };
            }

            function getImageEls() {
                return Array.from(gd.querySelectorAll('image'));
            }

            function assertImages(cnt, expectedEls, msg) {
                expect(d3SelectAll('image').size()).toEqual(cnt);

                if (expectedEls) {
                    var foundImageEls = getImageEls();
                    expectedEls.forEach(function(expi, i) {
                        if (expi) {
                            expect(foundImageEls[i]).toBe(expi, msg + ': ' + i);
                        }
                    });
                }
            }

            Plotly.newPlot(gd, data, layout).then(function() {
                assertImages(0);
                expect(gd.layout.images).toBeUndefined();

                return Plotly.relayout(gd, 'images[0]', makeImage(jsLogo, 0.1, 0.1));
            })
            .then(function() {
                assertImages(1);
                imgEls = getImageEls();

                return Plotly.relayout(gd, 'images[1]', makeImage(pythonLogo, 0.9, 0.9));
            })
            .then(function() {
                assertImages(2, [imgEls[0], null], 'add second image');
                imgEls = getImageEls();

                // insert an image not at the end of the array
                return Plotly.relayout(gd, 'images[0]', makeImage(pythonLogo, 0.2, 0.5));
            })
            .then(function() {
                assertImages(3, [null, imgEls[0], imgEls[1]], 'add third at the start');
                expect(gd.layout.images.length).toEqual(3);
                imgEls = getImageEls();

                return Plotly.relayout(gd, 'images[1].visible', false);
            })
            .then(function() {
                assertImages(2, [imgEls[0], imgEls[2]], 'hide second');

                return Plotly.relayout(gd, 'images[1].visible', true);
            })
            .then(function() {
                assertImages(3, [imgEls[0], null, imgEls[2]], 'reshow second');
                expect(gd.layout.images.length).toEqual(3);
                imgEls = getImageEls();

                // delete not from the end of the array
                return Plotly.relayout(gd, 'images[0]', null);
            })
            .then(function() {
                assertImages(2, [imgEls[1], imgEls[2]], 'delete first');
                expect(gd.layout.images.length).toEqual(2);

                return Plotly.relayout(gd, 'images[1]', null);
            })
            .then(function() {
                assertImages(1, [imgEls[1]], 'delete last');
                expect(gd.layout.images.length).toEqual(1);

                return Plotly.relayout(gd, 'images[0]', null);
            })
            .then(function() {
                assertImages(0);
                expect(gd.layout.images).toBeUndefined();
            })
            .then(done, done.fail);
        });
    });
});

describe('images log/linear axis changes', function() {
    'use strict';

    var mock = {
        data: [
            {x: [1, 2, 3], y: [1, 2, 3]},
            {x: [1, 2, 3], y: [3, 2, 1], yaxis: 'y2'}
        ],
        layout: {
            images: [{
                source: pythonLogo,
                x: 1,
                y: 1,
                xref: 'x',
                yref: 'y',
                sizex: 2,
                sizey: 2
            }],
            yaxis: {range: [1, 3]},
            yaxis2: {range: [0, 1], overlaying: 'y', type: 'log'}
        }
    };
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockData = Lib.extendDeep([], mock.data);
        var mockLayout = Lib.extendDeep({}, mock.layout);

        Plotly.newPlot(gd, mockData, mockLayout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('doesnt try to update position automatically with ref changes', function(done) {
        // we don't try to figure out the position on a new axis / canvas
        // automatically when you change xref / yref, we leave it to the caller.

        // initial clip path should end in 'xy' to match xref/yref
        expect(d3Select('image').attr('clip-path') || '').toMatch(/xy\)$/);

        // linear to log
        Plotly.relayout(gd, {'images[0].yref': 'y2'})
        .then(function() {
            expect(gd.layout.images[0].y).toBe(1);

            expect(d3Select('image').attr('clip-path') || '').toMatch(/xy2\)$/);

            // log to paper
            return Plotly.relayout(gd, {'images[0].yref': 'paper'});
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(1);

            expect(d3Select('image').attr('clip-path') || '').toMatch(/x\)$/);

            // change to full paper-referenced, to make sure the clip path disappears
            return Plotly.relayout(gd, {'images[0].xref': 'paper'});
        })
        .then(function() {
            expect(d3Select('image').attr('clip-path')).toBe(null);

            // paper to log
            return Plotly.relayout(gd, {'images[0].yref': 'y2'});
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(1);

            expect(d3Select('image').attr('clip-path') || '').toMatch(/^[^x]+y2\)$/);

            // log to linear
            return Plotly.relayout(gd, {'images[0].yref': 'y'});
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(1);

            // y and yref together
            return Plotly.relayout(gd, {'images[0].y': 0.2, 'images[0].yref': 'y2'});
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(0.2);

            // yref first, then y
            return Plotly.relayout(gd, {'images[0].yref': 'y', 'images[0].y': 2});
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(2);
        })
        .then(done, done.fail);
    });

    it('keeps the same data value if the axis type is changed without position', function(done) {
        // because images (and images) use linearized positions on log axes,
        // we have `relayout` update the positions so the data value the annotation
        // points to is unchanged by the axis type change.

        Plotly.relayout(gd, {'yaxis.type': 'log'})
        .then(function() {
            expect(gd.layout.images[0].y).toBe(0);
            expect(gd.layout.images[0].sizey).toBeCloseTo(0.765551370675726, 6);

            return Plotly.relayout(gd, {'yaxis.type': 'linear'});
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(1);
            expect(gd.layout.images[0].sizey).toBeCloseTo(2, 6);

            return Plotly.relayout(gd, {
                'yaxis.type': 'log',
                'images[0].y': 0.2,
                'images[0].sizey': 0.3
            });
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(0.2);
            expect(gd.layout.images[0].sizey).toBe(0.3);

            return Plotly.relayout(gd, {
                'images[0].y': 2,
                'images[0].sizey': 2.5,
                'yaxis.type': 'linear'
            });
        })
        .then(function() {
            expect(gd.layout.images[0].y).toBe(2);
            expect(gd.layout.images[0].sizey).toBe(2.5);
        })
        .then(done, done.fail);
    });
});
