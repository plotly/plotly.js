var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

var subplotMock = require('../../image/mocks/multiple_subplots.json');
var annotationMock = require('../../image/mocks/annotations.json');

describe('Plotly.Snapshot', function() {
    'use strict';

    describe('clone', function() {

        var data,
            layout,
            dummyTrace1, dummyTrace2,
            dummyGraphObj;

        dummyTrace1 = {
            x: ['0', '1', '2', '3', '4', '5'],
            y: ['2', '4', '6', '8', '6', '4'],
            mode: 'markers',
            name: 'Col2',
            type: 'scatter'
        };
        dummyTrace2 = {
            x: ['0', '1', '2', '3', '4', '5'],
            y: ['4', '6', '8', '10', '8', '6'],
            mode: 'markers',
            name: 'Col3',
            type: 'scatter'
        };

        data = [dummyTrace1, dummyTrace2];
        layout = {
            title: 'Chart Title',
            showlegend: true,
            autosize: true,
            width: 688,
            height: 460,
            xaxis: {
                title: 'xaxis title',
                range: [-0.323374917925, 5.32337491793],
                type: 'linear',
                autorange: true
            },
            yaxis: {
                title: 'yaxis title',
                range: [1.41922290389, 10.5807770961],
                type: 'linear',
                autorange: true
            }
        };

        dummyGraphObj = {
            data: data,
            layout: layout
        };

        it('should create a themeTile, with width certain things stripped out', function() {
            var themeOptions = {
                tileClass: 'themes__thumb'
            };

            // Defaults from clone()
            var THEMETILE_DEFAULT_LAYOUT = {
                autosize: true,
                width: 150,
                height: 150,
                title: '',
                showlegend: false,
                margin: {'l': 5, 'r': 5, 't': 5, 'b': 5, 'pad': 0},
                annotations: []
            };

            var config = {
                staticPlot: true,
                plotGlPixelRatio: 2,
                displaylogo: false,
                showLink: false,
                showTips: false,
                setBackground: 'opaque',
                mapboxAccessToken: undefined
            };

            var themeTile = Plotly.Snapshot.clone(dummyGraphObj, themeOptions);
            expect(themeTile.layout.height).toEqual(THEMETILE_DEFAULT_LAYOUT.height);
            expect(themeTile.layout.width).toEqual(THEMETILE_DEFAULT_LAYOUT.width);
            expect(themeTile.gd.defaultLayout).toEqual(THEMETILE_DEFAULT_LAYOUT);
            expect(themeTile.gd).toBe(themeTile.td); // image server compatibility
            expect(themeTile.config).toEqual(config);
        });

        it('should create a thumbnail for image export to the filewell', function() {
            var thumbnailOptions = {
                tileClass: 'thumbnail'
            };

            var THUMBNAIL_DEFAULT_LAYOUT = {
                'title': '',
                'hidesources': true,
                'showlegend': false,
                'hovermode': false,
                'dragmode': false,
                'zoom': false,
                'borderwidth': 0,
                'bordercolor': '',
                'margin': {'l': 1, 'r': 1, 't': 1, 'b': 1, 'pad': 0},
                'annotations': []
            };

            var thumbTile = Plotly.Snapshot.clone(dummyGraphObj, thumbnailOptions);
            expect(thumbTile.layout.hidesources).toEqual(THUMBNAIL_DEFAULT_LAYOUT.hidesources);
            expect(thumbTile.layout.showlegend).toEqual(THUMBNAIL_DEFAULT_LAYOUT.showlegend);
            expect(thumbTile.layout.borderwidth).toEqual(THUMBNAIL_DEFAULT_LAYOUT.borderwidth);
            expect(thumbTile.layout.annotations).toEqual(THUMBNAIL_DEFAULT_LAYOUT.annotations);
        });

        it('should create a 3D thumbnail with limited attributes', function() {

            var figure = {
                data: [{
                    type: 'scatter',
                    mode: 'markers',
                    y: [2, 4, 6, 5, 7, 4],
                    x: [1, 3, 4, 6, 3, 1],
                    name: 'C'
                }],
                layout: {
                    autosize: true,
                    scene: {
                        aspectratio: {y: 1, x: 1, z: 1}
                    }
                }};


            var thumbnailOptions = {
                tileClass: 'thumbnail'
            };

            var AXIS_OVERRIDE = {
                title: '',
                showaxeslabels: false,
                showticklabels: false,
                linetickenable: false
            };

            var thumbTile = Plotly.Snapshot.clone(figure, thumbnailOptions);
            expect(thumbTile.layout.scene.xaxis).toEqual(AXIS_OVERRIDE);
            expect(thumbTile.layout.scene.yaxis).toEqual(AXIS_OVERRIDE);
            expect(thumbTile.layout.scene.zaxis).toEqual(AXIS_OVERRIDE);
        });


        it('should create a custom sized Tile based on options', function() {
            var customOptions = {
                tileClass: 'notarealclass',
                height: 888,
                width: 888
            };

            var customTile = Plotly.Snapshot.clone(dummyGraphObj, customOptions);
            expect(customTile.layout.height).toEqual(customOptions.height);
            expect(customTile.layout.width).toEqual(customOptions.width);
        });

        it('should not touch the data or layout if you do not specify an existing tileClass', function() {
            var vanillaOptions = {
                tileClass: 'notarealclass'
            };

            var vanillaPlotTile = Plotly.Snapshot.clone(dummyGraphObj, vanillaOptions);
            expect(vanillaPlotTile.data[0].x).toEqual(data[0].x);
            expect(vanillaPlotTile.layout).toEqual(layout);
            expect(vanillaPlotTile.layout.height).toEqual(layout.height);
            expect(vanillaPlotTile.layout.width).toEqual(layout.width);
        });

        it('should set the background parameter appropriately', function() {
            var pt = Plotly.Snapshot.clone(dummyGraphObj, {
                setBackground: 'transparent'
            });
            expect(pt.config.setBackground).not.toBeDefined();

            pt = Plotly.Snapshot.clone(dummyGraphObj, {
                setBackground: 'blue'
            });
            expect(pt.config.setBackground).toEqual('blue');
        });
    });

    describe('toSVG', function() {
        var parser = new DOMParser();
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should not return any nested svg tags of plots', function(done) {
            Plotly.plot(gd, subplotMock.data, subplotMock.layout).then(function() {
                return Plotly.Snapshot.toSVG(gd);
            }).then(function(svg) {
                var svgDOM = parser.parseFromString(svg, 'image/svg+xml'),
                    svgElements = svgDOM.getElementsByTagName('svg');

                expect(svgElements.length).toBe(1);
            }).then(done);
        });

        it('should not return any nested svg tags of annotations', function(done) {
            Plotly.plot(gd, annotationMock.data, annotationMock.layout).then(function() {
                return Plotly.Snapshot.toSVG(gd);
            }).then(function(svg) {
                var svgDOM = parser.parseFromString(svg, 'image/svg+xml'),
                    svgElements = svgDOM.getElementsByTagName('svg');

                expect(svgElements.length).toBe(1);
            }).then(done);
        });

        it('should force *visibility: visible* for text elements with *visibility: inherit*', function(done) {
            // we've gotten rid of visibility almost entirely, using display instead
            d3.select(gd).style('visibility', 'inherit');

            Plotly.plot(gd, subplotMock.data, subplotMock.layout).then(function() {

                d3.select(gd).selectAll('text').each(function() {
                    var thisStyle = window.getComputedStyle(this);
                    expect(thisStyle.visibility).toEqual('visible');
                    expect(thisStyle.display).toEqual('block');
                });

                return Plotly.Snapshot.toSVG(gd);
            })
            .then(function(svg) {
                var svgDOM = parser.parseFromString(svg, 'image/svg+xml'),
                    textElements = svgDOM.getElementsByTagName('text');

                for(var i = 0; i < textElements.length; i++) {
                    expect(textElements[i].style.visibility).toEqual('');
                    expect(textElements[i].style.display).toEqual('');
                }

                done();
            });
        });

        describe('should handle quoted style properties', function() {
            function checkURL(actual, msg) {
                // which is enough tot check that toSVG did its job right
                expect((actual || '').substr(0, 6)).toBe('url(\"#', msg);
            }

            it('- marker-gradient case', function(done) {
                Plotly.plot(gd, [{
                    y: [1, 2, 1],
                    marker: {
                        gradient: {
                            type: 'radial',
                            color: '#fff'
                        },
                        color: ['red', 'blue', 'green']
                    }
                }], {
                    font: { family: 'Times New Roman' },
                    showlegend: true
                })
                .then(function() {
                    d3.selectAll('text').each(function() {
                        expect(this.style.fontFamily).toEqual('\"Times New Roman\"');
                    });

                    d3.selectAll('.point,.scatterpts').each(function() {
                        checkURL(this.style.fill);
                    });

                    return Plotly.Snapshot.toSVG(gd);
                })
                .then(function(svg) {
                    var svgDOM = parser.parseFromString(svg, 'image/svg+xml');
                    var i;

                    var textElements = svgDOM.getElementsByTagName('text');
                    expect(textElements.length).toEqual(12);

                    for(i = 0; i < textElements.length; i++) {
                        expect(textElements[i].style.fontFamily).toEqual('\"Times New Roman\"');
                    }

                    var pointElements = svgDOM.getElementsByClassName('point');
                    expect(pointElements.length).toEqual(3);

                    for(i = 0; i < pointElements.length; i++) {
                        checkURL(pointElements[i].style.fill);
                    }

                    var legendPointElements = svgDOM.getElementsByClassName('scatterpts');
                    expect(legendPointElements.length).toEqual(1);
                    checkURL(legendPointElements[0].style.fill);
                })
                .catch(failTest)
                .then(done);
            });

            it('- legend with contour items case', function(done) {
                var fig = Lib.extendDeep({}, require('@mocks/contour_legend.json'));
                var fillItemIndices = [0, 4, 5];

                Plotly.plot(gd, fig)
                .then(function() { return Plotly.Snapshot.toSVG(gd); })
                .then(function(svg) {
                    var svgDOM = parser.parseFromString(svg, 'image/svg+xml');

                    var fillItems = svgDOM.getElementsByClassName('legendfill');
                    for(var i = 0; i < fillItemIndices.length; i++) {
                        checkURL(fillItems[fillItemIndices[i]].firstChild.style.fill, 'fill gradient ' + i);
                    }

                    var lineItems = svgDOM.getElementsByClassName('legendlines');
                    checkURL(lineItems[1].firstChild.style.stroke, 'stroke gradient');
                })
                .catch(failTest)
                .then(done);
            });

            it('- colorbar case', function(done) {
                var fig = Lib.extendDeep({}, require('@mocks/16.json'));

                Plotly.plot(gd, fig)
                .then(function() { return Plotly.Snapshot.toSVG(gd); })
                .then(function(svg) {
                    var svgDOM = parser.parseFromString(svg, 'image/svg+xml');

                    var fillItems = svgDOM.getElementsByClassName('cbfill');
                    expect(fillItems.length).toBe(1, '# of colorbars');
                    for(var i = 0; i < fillItems.length; i++) {
                        checkURL(fillItems[i].style.fill, 'fill gradient ' + i);
                    }
                })
                .catch(failTest)
                .then(done);
            });
        });

        it('should adapt *viewBox* attribute under *scale* option', function(done) {
            Plotly.plot(gd, [{
                y: [1, 2, 1]
            }], {
                width: 300,
                height: 400
            })
            .then(function() {
                var str = Plotly.Snapshot.toSVG(gd, 'svg', 2.5);
                var dom = parser.parseFromString(str, 'image/svg+xml');
                var el = dom.getElementsByTagName('svg')[0];

                expect(el.getAttribute('width')).toBe('750', 'width');
                expect(el.getAttribute('height')).toBe('1000', 'height');
                expect(el.getAttribute('viewBox')).toBe('0 0 300 400', 'viewbox');
            })
            .catch(failTest)
            .then(done);
        });

        it('should work on pages with <base>', function(done) {
            var base = d3.select('body')
                .append('base')
                .attr('href', 'https://plot.ly');

            Plotly.plot(gd, [{ y: [1, 2, 1] }], {}, {exportedPlot: true})
            .then(function() { return Plotly.Snapshot.toSVG(gd); })
            .then(function(svg) {
                var svgDOM = parser.parseFromString(svg, 'image/svg+xml');
                var gSubplot = svgDOM.getElementsByClassName('plot')[0];
                var clipPath = gSubplot.getAttribute('clip-path');
                var len = clipPath.length;

                var head = clipPath.substr(0, 4);
                var tail = clipPath.substr(len - 7, len);
                expect(head).toBe('url(', 'subplot clipPath head');
                expect(tail).toBe('xyplot)', 'subplot clipPath tail');

                var middle = clipPath.substr(5, 10);
                expect(middle.length).toBe(10, 'subplot clipPath uid length');
                expect(middle.indexOf('http://')).toBe(-1, 'no <base> URL in subplot clipPath!');
                expect(middle.indexOf('https://')).toBe(-1, 'no <base> URL in subplot clipPath!');
            })
            .catch(failTest)
            .then(function() {
                base.remove();
                done();
            });
        });
    });
});
