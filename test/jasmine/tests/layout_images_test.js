var Plotly = require('@lib/index');
var Images = require('@src/components/images');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

describe('Layout images', function() {

    describe('supplyLayoutDefaults', function() {

        var layoutIn,
            layoutOut;

        beforeEach(function() {
            layoutIn = { images: [] };
            layoutOut = {};
        });

        it('should reject when there is no `source`', function() {
            layoutIn.images[0] = { opacity: 0.5, width: 0.2, height: 0.2 };

            Images.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut.images.length).toEqual(0);
        });

        it('should reject when not an array', function() {
            layoutIn.images = {
                source: 'http://www.someimagesource.com',
                opacity: 0.5,
                width: 0.2,
                height: 0.2
            };

            Images.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut.images).not.toBeDefined();
        });

        it('should coerce the correct defaults', function() {
            layoutIn.images[0] = { source: 'http://www.someimagesource.com' };

            var expected = {
                source: 'http://www.someimagesource.com',
                layer: 'above',
                x: 0,
                y: 0,
                xanchor: 'left',
                yanchor: 'top',
                width: 0,
                height: 0,
                sizing: 'contain',
                opacity: 1,
                xref: 'paper',
                yref: 'paper'
            };

            Images.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut.images[0]).toEqual(expected);
        });

    });

    describe('drawing', function() {

        var gd,
            data = [{ x: [1,2,3], y: [1,2,3] }];

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should draw images on the right layers', function() {

            var layer;

            Plotly.plot(gd, data, { images: [{
                source: 'imageabove',
                layer: 'above'
            }]});

            layer = gd._fullLayout._imageUpperLayer;
            expect(layer.length).toBe(1);

            destroyGraphDiv();
            gd = createGraphDiv();
            Plotly.plot(gd, data, { images: [{
                source: 'imagebelow',
                layer: 'below'
            }]});

            layer = gd._fullLayout._imageLowerLayer;
            expect(layer.length).toBe(1);

            destroyGraphDiv();
            gd = createGraphDiv();
            Plotly.plot(gd, data, { images: [{
                source: 'imagesubplot',
                layer: 'below',
                xref: 'x',
                yref: 'y'
            }]});

            layer = gd._fullLayout._imageSubplotLayer;
            expect(layer.length).toBe(1);
        });

        describe('with anchors and sizing', function() {

            function testAspectRatio(xAnchor, yAnchor, sizing, expected) {
                var anchorName = xAnchor + yAnchor;
                Plotly.plot(gd, data, { images: [{
                    source: anchorName,
                    xanchor: xAnchor,
                    yanchor: yAnchor,
                    sizing: sizing
                }]});

                var image = Plotly.d3.select('[href="' + anchorName + '"]'),
                    parValue = image.attr('preserveAspectRatio');

                expect(parValue).toBe(expected);
            }

            it('should work for center middle', function() {
                testAspectRatio('center', 'middle', undefined, 'xMidYMid');
            });

            it('should work for left top', function() {
                testAspectRatio('left', 'top', undefined, 'xMinYMin');
            });

            it('should work for right bottom', function() {
                testAspectRatio('right', 'bottom', undefined, 'xMaxYMax');
            });

            it('should work for stretch sizing', function() {
                testAspectRatio('middle', 'center', 'stretch', 'none');
            });

            it('should work for fill sizing', function() {
                testAspectRatio('invalid', 'invalid', 'fill', 'xMinYMin slice');
            });

        });

    });

    describe('when the plot is dragged', function() {
        var gd,
            data = [{ x: [1,2,3], y: [1,2,3] }];

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should not move when referencing the paper', function(done) {
            var source = 'http://www.placekitten.com/200',
                image = {
                    source: source,
                    xref: 'paper',
                    yref: 'paper',
                    x: 0,
                    y: 0,
                    width: 0.1,
                    height: 0.1
                };

            Plotly.plot(gd, data, {
                images: [image],
                dragmode: 'pan',
                width: 600,
                height: 400
            }).then(function() {
                var img = Plotly.d3.select('[href="' + source + '"]').node(),
                    oldPos = img.getBoundingClientRect();

                mouseEvent('mousedown', 250, 200);
                mouseEvent('mousemove', 300, 250);

                var newPos = img.getBoundingClientRect();

                expect(newPos.left).toBe(oldPos.left);
                expect(newPos.top).toBe(oldPos.top);

                mouseEvent('mouseup', 300, 250);
            }).then(done);
        });

        it('should move when referencing axes', function(done) {
            var source = 'http://www.placekitten.com/200',
                image = {
                    source: source,
                    xref: 'x',
                    yref: 'y',
                    x: 2,
                    y: 2,
                    width: 1,
                    height: 1
                };

            Plotly.plot(gd, data, {
                images: [image],
                dragmode: 'pan',
                width: 600,
                height: 400
            }).then(function() {
                var img = Plotly.d3.select('[href="' + source + '"]').node(),
                    oldPos = img.getBoundingClientRect();

                mouseEvent('mousedown', 250, 200);
                mouseEvent('mousemove', 300, 250);

                var newPos = img.getBoundingClientRect();

                expect(newPos.left).toBe(oldPos.left + 50);
                expect(newPos.top).toBe(oldPos.top + 50);

                mouseEvent('mouseup', 300, 250);
            }).then(done);
        });

    });

});
