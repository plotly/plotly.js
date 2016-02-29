var supplyLayoutDefaults = require('@src/plots/gl3d/layout/axis_defaults');


describe('Test Gl3dAxes', function() {
    'use strict';

    describe('supplyLayoutDefaults supplies defaults', function() {
        var layoutIn,
            layoutOut;

        var options = {
            font: 'Open Sans',
            scene: {id: 'scene'},
            data: [{x: [], y: []}]
        };

        beforeEach(function() {
            layoutOut = {};
        });

        it('should define specific default set with empty initial layout', function() {
            layoutIn = {};

            var expected = {
                'xaxis': {
                    'showline': false,
                    'showgrid': true,
                    'gridcolor': 'rgb(204, 204, 204)',
                    'gridwidth': 1,
                    'showspikes': true,
                    'spikesides': true,
                    'spikethickness': 2,
                    'spikecolor': 'rgb(0,0,0)',
                    'showbackground': false,
                    'showaxeslabels': true
                },
                'yaxis': {
                    'showline': false,
                    'showgrid': true,
                    'gridcolor': 'rgb(204, 204, 204)',
                    'gridwidth': 1,
                    'showspikes': true,
                    'spikesides': true,
                    'spikethickness': 2,
                    'spikecolor': 'rgb(0,0,0)',
                    'showbackground': false,
                    'showaxeslabels': true
                },
                'zaxis': {
                    'showline': false,
                    'showgrid': true,
                    'gridcolor': 'rgb(204, 204, 204)',
                    'gridwidth': 1,
                    'showspikes': true,
                    'spikesides': true,
                    'spikethickness': 2,
                    'spikecolor': 'rgb(0,0,0)',
                    'showbackground': false,
                    'showaxeslabels': true
                }
            };

            function checkKeys(validObject, testObject) {
                var keys = Object.keys(validObject);
                for(var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    if(validObject[k] !== testObject[k]) return false;
                }
                return true;
            }

            supplyLayoutDefaults(layoutIn, layoutOut, options);
            ['xaxis', 'yaxis', 'zaxis'].forEach(function(axis) {
                expect(checkKeys(expected[axis], layoutOut[axis])).toBe(true);
            });
        });
    });
});
