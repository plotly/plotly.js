var Plotly = require('@lib/index');
var Gl3d = require('@src/plots/gl3d');

var tinycolor = require('tinycolor2');
var Color = require('@src/components/color');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test gl3d axes defaults', function() {
    'use strict';

    var supplyLayoutDefaults = require('@src/plots/gl3d/layout/axis_defaults');

    describe('supplyLayoutDefaults supplies defaults', function() {
        var layoutIn,
            layoutOut;

        var options = {
            font: 'Open Sans',
            scene: {id: 'scene'},
            data: [{x: [], y: []}],
            bgColor: '#fff',
            fullLayout: {_dfltTitle: {x: 'xxx', y: 'yyy', colorbar: 'cbbb'}}
        };

        beforeEach(function() {
            layoutOut = {
                autotypenumbers: 'convert types'
            };
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
                    'spikecolor': '#444',
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
                    'spikecolor': '#444',
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
                    'spikecolor': '#444',
                    'showbackground': false,
                    'showaxeslabels': true
                }
            };

            function checkKeys(validObject, testObject) {
                var keys = Object.keys(validObject);
                for(var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    expect(validObject[k]).toBe(testObject[k]);
                }
                return true;
            }

            supplyLayoutDefaults(layoutIn, layoutOut, options);
            ['xaxis', 'yaxis', 'zaxis'].forEach(function(axis) {
                checkKeys(expected[axis], layoutOut[axis]);
            });
        });

        it('should inherit layout.calendar', function() {
            layoutIn = {
                xaxis: {type: 'date'},
                yaxis: {type: 'date'},
                zaxis: {type: 'date'}
            };
            options.calendar = 'taiwan';

            supplyLayoutDefaults(layoutIn, layoutOut, options);

            expect(layoutOut.xaxis.calendar).toBe('taiwan');
            expect(layoutOut.yaxis.calendar).toBe('taiwan');
            expect(layoutOut.zaxis.calendar).toBe('taiwan');
        });

        it('should accept its own calendar', function() {
            layoutIn = {
                xaxis: {type: 'date', calendar: 'hebrew'},
                yaxis: {type: 'date', calendar: 'ummalqura'},
                zaxis: {type: 'date', calendar: 'discworld'}
            };
            options.calendar = 'taiwan';

            supplyLayoutDefaults(layoutIn, layoutOut, options);

            expect(layoutOut.xaxis.calendar).toBe('hebrew');
            expect(layoutOut.yaxis.calendar).toBe('ummalqura');
            expect(layoutOut.zaxis.calendar).toBe('discworld');
        });
    });
});

describe('Test Gl3d layout defaults', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        var layoutIn, layoutOut, fullData;

        var supplyLayoutDefaults = Gl3d.supplyLayoutDefaults;

        beforeEach(function() {
            layoutOut = {
                autotypenumbers: 'convert types',
                _basePlotModules: ['gl3d'],
                _dfltTitle: {x: 'xxx', y: 'yyy', colorbar: 'cbbb'},
                _subplots: {gl3d: ['scene']}
            };

            // needs a scene-ref in a trace in order to be detected
            fullData = [ { type: 'scatter3d', scene: 'scene' }];
        });

        it('should coerce aspectmode=ratio when ratio data is valid', function() {
            var aspectratio = {
                x: 1,
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: aspectratio,
                    bgcolor: 'rgba(0,0,0,0)'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
            expect(layoutOut.scene.bgcolor).toBe(expected.scene.bgcolor);
        });


        it('should coerce aspectmode=auto when aspect ratio data is invalid', function() {
            var aspectratio = {
                x: 'g',
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'auto',
                    aspectratio: {x: 1, y: 1, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });


        it('should coerce manual when valid ratio data but invalid aspectmode', function() {
            var aspectratio = {
                x: 1,
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: {},
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: {x: 1, y: 2, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });


        it('should not coerce manual when invalid ratio data but invalid aspectmode', function() {
            var aspectratio = {
                x: 'g',
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: {},
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'auto',
                    aspectratio: {x: 1, y: 1, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });


        it('should not coerce manual when valid ratio data and valid non-manual aspectmode', function() {
            var aspectratio = {
                x: 1,
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: 'cube',
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'cube',
                    aspectratio: {x: 1, y: 2, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });

        it('should coerce dragmode', function() {
            layoutIn = { scene: {} };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to turntable by default');

            layoutIn = { scene: { dragmode: 'orbit' } };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to user val if valid');

            layoutIn = { scene: {}, dragmode: 'orbit' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to user layout val if valid and 3d only');

            layoutIn = { scene: {}, dragmode: 'invalid' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to turntable if invalid and 3d only');

            layoutIn = { scene: {}, dragmode: 'orbit' };
            layoutOut._basePlotModules.push({ name: 'cartesian' });
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to default if not 3d only');

            layoutIn = { scene: {}, dragmode: 'not gonna work' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to default if not valid');
        });

        it('should coerce hovermode', function() {
            layoutIn = { scene: {} };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to closest by default');

            layoutIn = { scene: { hovermode: false } };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe(false, 'to user val if valid');

            layoutIn = { scene: {}, hovermode: false };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe(false, 'to user layout val if valid and 3d only');

            layoutIn = { scene: {}, hovermode: 'invalid' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to closest if invalid and 3d only');

            layoutIn = { scene: {}, hovermode: false };
            layoutOut._basePlotModules.push({ name: 'cartesian' });
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to default if not 3d only');

            layoutIn = { scene: {}, hovermode: 'not gonna work' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to default if not valid');
        });

        it('should add data-only scenes into layoutIn', function() {
            layoutIn = {};
            fullData = [{ type: 'scatter3d', scene: 'scene' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.scene).toEqual({
                aspectratio: { x: 1, y: 1, z: 1 },
                aspectmode: 'auto'
            });
        });

        it('should add scene data-only scenes into layoutIn (converse)', function() {
            layoutIn = {};
            layoutOut._subplots.gl3d = [];
            fullData = [{ type: 'scatter' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.scene).toBe(undefined);
        });

        it('should use combo of \'axis.color\', bgcolor and lightFraction as default for \'axis.gridcolor\'', function() {
            layoutIn = {
                paper_bgcolor: 'green',
                scene: {
                    bgcolor: 'yellow',
                    xaxis: { showgrid: true, color: 'red' },
                    yaxis: { gridcolor: 'blue' },
                    zaxis: { showgrid: true }
                }
            };

            var bgColor = Color.combine('yellow', 'green');
            var frac = 100 * (204 - 0x44) / (255 - 0x44);

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.xaxis.gridcolor)
                .toEqual(tinycolor.mix('red', bgColor, frac).toRgbString());
            expect(layoutOut.scene.yaxis.gridcolor).toEqual('blue');
            expect(layoutOut.scene.zaxis.gridcolor)
                .toEqual(tinycolor.mix('#444', bgColor, frac).toRgbString());
        });

        it('should disable converting numeric strings using axis.autotypenumbers', function() {
            supplyLayoutDefaults({
                scene: {
                    xaxis: { autotypenumbers: 'strict' },
                    yaxis: {},
                    zaxis: { autotypenumbers: 'strict' }
                }
            }, layoutOut, [{
                type: 'scatter3d',
                x: ['1970', '2000', '0', '1'],
                y: ['1970', '2000', '0', '1'],
                z: ['1970', '2000', '0', '1'],
                scene: 'scene'
            }]);

            var xaxis = layoutOut.scene.xaxis;
            var yaxis = layoutOut.scene.yaxis;
            var zaxis = layoutOut.scene.zaxis;
            expect(xaxis.autotypenumbers).toBe('strict');
            expect(yaxis.autotypenumbers).toBe('convert types');
            expect(zaxis.autotypenumbers).toBe('strict');
            expect(xaxis.type).toBe('category');
            expect(yaxis.type).toBe('linear');
            expect(zaxis.type).toBe('category');
        });

        it('should enable converting numeric strings using axis.autotypenumbers and inherit defaults from layout.autotypenumbers', function() {
            layoutOut.autotypenumbers = 'strict';

            supplyLayoutDefaults({
                scene: {
                    xaxis: { autotypenumbers: 'convert types' },
                    yaxis: {},
                    zaxis: { autotypenumbers: 'convert types' }
                }
            }, layoutOut, [{
                type: 'scatter3d',
                x: ['1970', '2000', '0', '1'],
                y: ['1970', '2000', '0', '1'],
                z: ['1970', '2000', '0', '1'],
                scene: 'scene'
            }]);

            var xaxis = layoutOut.scene.xaxis;
            var yaxis = layoutOut.scene.yaxis;
            var zaxis = layoutOut.scene.zaxis;
            expect(xaxis.autotypenumbers).toBe('convert types');
            expect(yaxis.autotypenumbers).toBe('strict');
            expect(zaxis.autotypenumbers).toBe('convert types');
            expect(xaxis.type).toBe('linear');
            expect(yaxis.type).toBe('category');
            expect(zaxis.type).toBe('linear');
        });

        ['convert types', 'strict'].forEach(function(autotypenumbers) {
            it('with autotypenumbers: *' + autotypenumbers + '* should autotype *linear* case of 2d array', function() {
                var typedArray = new Float32Array(2);
                typedArray[0] = 0;
                typedArray[1] = 1;

                supplyLayoutDefaults({
                    scene: {
                        xaxis: { autotypenumbers: autotypenumbers },
                        yaxis: { autotypenumbers: autotypenumbers },
                        zaxis: { autotypenumbers: autotypenumbers }
                    }
                }, layoutOut, [{
                    scene: 'scene',
                    type: 'surface',
                    x: [0, 1],
                    y: typedArray,
                    z: [
                        typedArray,
                        [1, 0]
                    ]
                }]);

                var xaxis = layoutOut.scene.xaxis;
                var yaxis = layoutOut.scene.yaxis;
                var zaxis = layoutOut.scene.zaxis;
                expect(xaxis.autotypenumbers).toBe(autotypenumbers);
                expect(yaxis.autotypenumbers).toBe(autotypenumbers);
                expect(zaxis.autotypenumbers).toBe(autotypenumbers);
                expect(xaxis.type).toBe('linear');
                expect(yaxis.type).toBe('linear');
                expect(zaxis.type).toBe('linear');
            });
        });

        ['convert types', 'strict'].forEach(function(autotypenumbers) {
            it('with autotypenumbers: *' + autotypenumbers + '* should autotype *category* case of 2d array', function() {
                supplyLayoutDefaults({
                    scene: {
                        xaxis: { autotypenumbers: autotypenumbers },
                        yaxis: { autotypenumbers: autotypenumbers },
                        zaxis: { autotypenumbers: autotypenumbers }
                    }
                }, layoutOut, [{
                    scene: 'scene',
                    type: 'surface',
                    x: ['A', 'B'],
                    y: ['C', 'D'],
                    z: [
                        ['E', 'F'],
                        ['F', 'E']
                    ]
                }]);

                var xaxis = layoutOut.scene.xaxis;
                var yaxis = layoutOut.scene.yaxis;
                var zaxis = layoutOut.scene.zaxis;
                expect(xaxis.autotypenumbers).toBe(autotypenumbers);
                expect(yaxis.autotypenumbers).toBe(autotypenumbers);
                expect(zaxis.autotypenumbers).toBe(autotypenumbers);
                expect(xaxis.type).toBe('category');
                expect(yaxis.type).toBe('category');
                expect(zaxis.type).toBe('category');
            });
        });

        ['convert types', 'strict'].forEach(function(autotypenumbers) {
            it('with autotypenumbers: *' + autotypenumbers + '* should autotype *date* case of 2d array', function() {
                supplyLayoutDefaults({
                    scene: {
                        xaxis: { autotypenumbers: autotypenumbers },
                        yaxis: { autotypenumbers: autotypenumbers },
                        zaxis: { autotypenumbers: autotypenumbers }
                    }
                }, layoutOut, [{
                    scene: 'scene',
                    type: 'surface',
                    x: ['00-01', '00-02'],
                    y: ['00-01', '00-02'],
                    z: [
                        ['00-01', '00-02'],
                        ['00-02', '00-01']
                    ]
                }]);

                var xaxis = layoutOut.scene.xaxis;
                var yaxis = layoutOut.scene.yaxis;
                var zaxis = layoutOut.scene.zaxis;
                expect(xaxis.autotypenumbers).toBe(autotypenumbers);
                expect(yaxis.autotypenumbers).toBe(autotypenumbers);
                expect(zaxis.autotypenumbers).toBe(autotypenumbers);
                expect(xaxis.type).toBe('date');
                expect(yaxis.type).toBe('date');
                expect(zaxis.type).toBe('date');
            });
        });
    });
});

describe('Gl3d layout edge cases', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });
    afterEach(destroyGraphDiv);

    it('@gl should handle auto aspect ratio correctly on data changes', function(done) {
        Plotly.newPlot(gd, [{x: [1, 2], y: [1, 3], z: [1, 4], type: 'scatter3d'}])
        .then(function() {
            var aspect = gd.layout.scene.aspectratio;
            expect(aspect.x).toBeCloseTo(0.5503);
            expect(aspect.y).toBeCloseTo(1.1006);
            expect(aspect.z).toBeCloseTo(1.6510);

            return Plotly.restyle(gd, 'x', [[1, 6]]);
        })
        .then(function() {
            /*
             * Check that now it's the same as if you had just made the plot with
             * x: [1, 6] in the first place
             */
            var aspect = gd.layout.scene.aspectratio;
            expect(aspect.x).toBeCloseTo(1.6091);
            expect(aspect.y).toBeCloseTo(0.6437);
            expect(aspect.z).toBeCloseTo(0.9655);
        })
        .then(done, done.fail);
    });
});
