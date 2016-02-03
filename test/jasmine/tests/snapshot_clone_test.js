var Snapshot = require('@src/snapshot');

describe('Test Snapshot.clone', function() {
    'use strict';

    describe('Test clone', function() {

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
                setBackground: 'opaque'
            };

            var themeTile = Snapshot.clone(dummyGraphObj, themeOptions);
            expect(themeTile.layout.height).toEqual(THEMETILE_DEFAULT_LAYOUT.height);
            expect(themeTile.layout.width).toEqual(THEMETILE_DEFAULT_LAYOUT.width);
            expect(themeTile.td.defaultLayout).toEqual(THEMETILE_DEFAULT_LAYOUT);
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

            var thumbTile = Snapshot.clone(dummyGraphObj, thumbnailOptions);
            expect(thumbTile.layout.hidesources).toEqual(THUMBNAIL_DEFAULT_LAYOUT.hidesources);
            expect(thumbTile.layout.showlegend).toEqual(THUMBNAIL_DEFAULT_LAYOUT.showlegend);
            expect(thumbTile.layout.borderwidth).toEqual(THUMBNAIL_DEFAULT_LAYOUT.borderwidth);
            expect(thumbTile.layout.annotations).toEqual(THUMBNAIL_DEFAULT_LAYOUT.annotations);
        });

        it('should create a custom sized Tile based on options', function() {
            var customOptions = {
                tileClass: 'notarealclass',
                height: 888,
                width: 888
            };

            var customTile = Snapshot.clone(dummyGraphObj, customOptions);
            expect(customTile.layout.height).toEqual(customOptions.height);
            expect(customTile.layout.width).toEqual(customOptions.width);
        });

        it('should not touch the data or layout if you do not specify an existing tileClass', function() {
            var vanillaOptions = {
                tileClass: 'notarealclass'
            };

            var vanillaPlotTile = Snapshot.clone(dummyGraphObj, vanillaOptions);
            expect(vanillaPlotTile.data[0].x).toEqual(data[0].x);
            expect(vanillaPlotTile.layout).toEqual(layout);
            expect(vanillaPlotTile.layout.height).toEqual(layout.height);
            expect(vanillaPlotTile.layout.width).toEqual(layout.width);
        });

        it('should set the background parameter appropriately', function() {
            var pt = Snapshot.clone(dummyGraphObj, {
                setBackground: 'transparent'
            });
            expect(pt.config.setBackground).not.toBeDefined();

            pt = Snapshot.clone(dummyGraphObj, {
                setBackground: 'blue'
            });
            expect(pt.config.setBackground).toEqual('blue');
        });
    });
});
