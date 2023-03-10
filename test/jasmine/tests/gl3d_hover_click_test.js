var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var delay = require('../assets/delay');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

var mock = require('../../image/mocks/gl3d_marker-arrays.json');
var mesh3dcoloringMock = require('../../image/mocks/gl3d_mesh3d_coloring.json');
var mesh3dcellIntensityMock = require('../../image/mocks/gl3d_mesh3d_cell-intensity.json');
var mesh3dbunnyMock = require('../../image/mocks/gl3d_bunny_cell-area.json');
var multipleScatter3dMock = require('../../image/mocks/gl3d_multiple-scatter3d-traces.json');

// lines, markers, text, error bars and surfaces each
// correspond to one glplot object
var mock2 = Lib.extendDeep({}, mock);
mock2.data[0].mode = 'lines+markers+text';
mock2.data[0].error_z = { value: 10 };
mock2.data[0].surfaceaxis = 2;
mock2.layout.showlegend = true;

var mock3 = require('../../image/mocks/gl3d_autocolorscale');
var mock4 = require('../../image/mocks/gl3d_transparent_same-depth.json');

describe('Test gl3d trace click/hover:', function() {
    var gd, ptData;

    beforeEach(function() {
        gd = createGraphDiv();
        ptData = {};
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 12000;
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function assertHoverText(xLabel, yLabel, zLabel, textLabel, traceName) {
        var content = [];
        if(xLabel) content.push(xLabel);
        if(yLabel) content.push(yLabel);
        if(zLabel) content.push(zLabel);
        if(textLabel) content.push(textLabel);
        assertHoverLabelContent({
            name: traceName,
            nums: content.join('\n')
        });
    }

    function assertEventData(x, y, z, curveNumber, pointNumber, extra) {
        expect(Object.keys(ptData)).toEqual(jasmine.arrayContaining([
            'x', 'y', 'z',
            'data', 'fullData', 'curveNumber', 'pointNumber',
            'bbox'
        ]), 'correct hover data fields');

        expect(ptData.x).toEqual(x, 'x val');
        expect(ptData.y).toEqual(y, 'y val');
        expect(ptData.z).toEqual(z, 'z val');
        expect(ptData.curveNumber).toEqual(curveNumber, 'curveNumber');
        expect(ptData.pointNumber).toEqual(pointNumber, 'pointNumber');

        expect(typeof ptData.bbox).toEqual('object');
        expect(typeof ptData.bbox.x0).toEqual('number');
        expect(typeof ptData.bbox.x1).toEqual('number');
        expect(typeof ptData.bbox.y0).toEqual('number');
        expect(typeof ptData.bbox.y1).toEqual('number');

        Object.keys(extra || {}).forEach(function(k) {
            expect(ptData[k]).toEqual(extra[k], k + ' val');
        });
    }

    it('@gl should display correct hover labels of the second point of the very first scatter3d trace', function(done) {
        var _mock = Lib.extendDeep({}, multipleScatter3dMock);

        function _hover() {
            mouseEvent('mouseover', 300, 200);
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverLabelContent(
                {
                    nums: ['x: 0', 'y: 0', 'z: 0'].join('\n'),
                    name: 'trace 0'
                }
            );
        })
        .then(done, done.fail);
    });

    it('@gl should honor *hoverlabel.namelength*', function(done) {
        var _mock = Lib.extendDeep({}, multipleScatter3dMock);

        function _hover() {
            mouseEvent('mouseover', 300, 200);
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() { return Plotly.restyle(gd, 'hoverlabel.namelength', 3); })
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverLabelContent(
                {
                    nums: ['x: 0', 'y: 0', 'z: 0'].join('\n'),
                    name: 'tra'
                }
            );
        })
        .then(done, done.fail);
    });

    it('@gl should display correct hover labels and emit correct event data (scatter3d case)', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        function _hover() {
            mouseEvent('mouseover', 0, 0);
            mouseEvent('mouseover', 655, 221);
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 100.75', 'y: −102.63', 'z: −102.63');
            assertEventData(100.75, -102.63, -102.63, 0, 0, {
                'marker.symbol': 'circle',
                'marker.size': 10,
                'marker.color': 'blue',
                'marker.line.color': 'black'
            });
            assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                bgcolor: 'rgb(0, 0, 255)',
                bordercolor: 'rgb(255, 255, 255)',
                fontSize: 13,
                fontFamily: 'Arial',
                fontColor: 'rgb(255, 255, 255)'
            }, 'initial');

            return Plotly.restyle(gd, {
                x: [['2016-01-11', '2016-01-12', '2017-01-01', '2017-02-01']]
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: Jan 11, 2016', 'y: −102.63', 'z: −102.63');

            return Plotly.restyle(gd, {
                x: [[new Date(2017, 2, 1), new Date(2017, 2, 2), new Date(2017, 2, 3), new Date(2017, 2, 4)]]
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: Mar 1, 2017', 'y: −102.63', 'z: −102.63');

            return Plotly.update(gd, {
                y: [['a', 'b', 'c', 'd']],
                z: [[10, 1e3, 1e5, 1e10]]
            }, {
                'scene.zaxis.type': 'log'
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: Mar 1, 2017', 'y: a', 'z: 10');

            return Plotly.relayout(gd, 'scene.xaxis.calendar', 'chinese');
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 二 4, 2017', 'y: a', 'z: 10');

            return Plotly.restyle(gd, 'text', [['A', 'B', 'C', 'D']]);
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 二 4, 2017', 'y: a', 'z: 10', 'A');

            return Plotly.restyle(gd, 'hovertext', [['Apple', 'Banana', 'Clementine', 'Dragon fruit']]);
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 二 4, 2017', 'y: a', 'z: 10', 'Apple');

            return Plotly.restyle(gd, {
                'hoverlabel.bgcolor': [['red', 'blue', 'green', 'yellow']],
                'hoverlabel.font.size': 20
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                bgcolor: 'rgb(255, 0, 0)',
                bordercolor: 'rgb(255, 255, 255)',
                fontSize: 20,
                fontFamily: 'Arial',
                fontColor: 'rgb(255, 255, 255)'
            }, 'restyled');

            return Plotly.relayout(gd, {
                'hoverlabel.bordercolor': 'yellow',
                'hoverlabel.font.color': 'cyan',
                'hoverlabel.font.family': 'Roboto'
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                bgcolor: 'rgb(255, 0, 0)',
                bordercolor: 'rgb(255, 255, 0)',
                fontSize: 20,
                fontFamily: 'Roboto',
                fontColor: 'rgb(0, 255, 255)'
            }, 'restyle #2');

            return Plotly.restyle(gd, 'hoverinfo', [[null, null, 'y', null]]);
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            var label = d3SelectAll('g.hovertext');

            expect(label.size()).toEqual(1);
            expect(label.select('text').text()).toEqual('x: 二 4, 2017y: az: 10Apple');

            return Plotly.restyle(gd, 'hoverinfo', [[null, null, 'dont+know', null]]);
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 二 4, 2017', 'y: a', 'z: 10', 'Apple');

            return Plotly.restyle(gd, 'hoverinfo', 'text');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'Apple');

            return Plotly.restyle(gd, 'hovertext', 'HEY');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'HEY');

            return Plotly.restyle(gd, 'hoverinfo', 'z');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, '10');

            return Plotly.restyle(gd, 'hovertemplate', 'THIS Y -- %{y}<extra></extra>');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'THIS Y -- a');
        })
        .then(done, done.fail);
    });

    it('@gl should display correct hover labels and emit correct event data (surface case with connectgaps enabled)', function(done) {
        var surfaceConnectgaps = require('../../image/mocks/gl3d_surface_connectgaps');
        var _mock = Lib.extendDeep({}, surfaceConnectgaps);

        function _hover() {
            mouseEvent('mouseover', 300, 200);
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 0.2', 'y: 2', 'z: 1,001.25');
            assertEventData(0.2, 2, 1001.25, 0, [1, 2]);
            assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                bgcolor: 'rgb(68, 68, 68)',
                bordercolor: 'rgb(255, 255, 255)',
                fontSize: 13,
                fontFamily: 'Arial',
                fontColor: 'rgb(255, 255, 255)'
            }, 'initial');
        })
        .then(done, done.fail);
    });

    it('@gl should display correct hover labels and emit correct event data (surface case)', function(done) {
        var _mock = Lib.extendDeep({}, mock3);

        function _hover() {
            mouseEvent('mouseover', 605, 271);
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 1', 'y: 2', 'z: 43', 'one two');
            assertEventData(1, 2, 43, 0, [1, 2]);
            assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                bgcolor: 'rgb(68, 68, 68)',
                bordercolor: 'rgb(255, 255, 255)',
                fontSize: 13,
                fontFamily: 'Arial',
                fontColor: 'rgb(255, 255, 255)'
            }, 'initial');

            return Plotly.restyle(gd, {
                hoverinfo: [[
                    ['all', 'all', 'all'],
                    ['all', 'all', 'y'],
                    ['all', 'all', 'all']
                ]],
                'hoverlabel.bgcolor': 'white',
                'hoverlabel.font.size': 9,
                'hoverlabel.font.color': [[
                    ['red', 'blue', 'green'],
                    ['pink', 'purple', 'cyan'],
                    ['black', 'orange', 'yellow']
                ]]
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertEventData(1, 2, 43, 0, [1, 2], {
                hoverinfo: 'y',
                'hoverlabel.font.color': 'cyan'
            });
            assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                bgcolor: 'rgb(255, 255, 255)',
                bordercolor: 'rgb(68, 68, 68)',
                fontSize: 9,
                fontFamily: 'Arial',
                fontColor: 'rgb(0, 255, 255)'
            }, 'restyle');

            var label = d3SelectAll('g.hovertext');

            expect(label.size()).toEqual(1);
            expect(label.select('text').text()).toEqual('2');

            return Plotly.restyle(gd, {
                'colorbar.tickvals': [[25]],
                'colorbar.ticktext': [['single tick!']]
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertEventData(1, 2, 43, 0, [1, 2], {
                hoverinfo: 'y',
                'hoverlabel.font.color': 'cyan',
                'colorbar.tickvals': undefined,
                'colorbar.ticktext': undefined
            });

            return Plotly.restyle(gd, 'hoverinfo', 'z');
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, '43');

            return Plotly.restyle(gd, 'hoverinfo', 'text');
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'one two');

            return Plotly.restyle(gd, 'text', 'yo!');
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'yo!');

            return Plotly.restyle(gd, 'hovertext', 'ONE TWO');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'ONE TWO');

            return Plotly.restyle(gd, 'hovertemplate', '!!! %{z} !!!<extra></extra>');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, '!!! 43 !!!');
        })
        .then(done, done.fail);
    });

    it('@gl should emit correct event data on click (scatter3d case)', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        // N.B. gl3d click events are 'mouseover' events
        // with button 1 pressed
        function _click() {
            mouseEvent('mouseover', 605, 271, {buttons: 1});
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_click', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(delay(20))
        .then(_click)
        .then(delay(20))
        .then(function() {
            assertEventData(140.72, -96.97, -96.97, 0, 2);
        })
        .then(done, done.fail);
    });

    it('@gl should display correct hover labels (mesh3d case)', function(done) {
        var x = [1, 1, 2, 3, 4, 2];
        var y = [2, 1, 3, 4, 5, 3];
        var z = [3, 7, 4, 5, 3.5, 2];
        var text = x.map(function(_, i) {
            return [
                'ts: ' + x[i],
                'hz: ' + y[i],
                'ftt:' + z[i]
            ].join('<br>');
        });

        function _hover() {
            mouseEvent('mouseover', 250, 250);
        }

        Plotly.newPlot(gd, [{
            type: 'mesh3d',
            x: x,
            y: y,
            z: z,
            text: text
        }], {
            width: 500,
            height: 500
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 3', 'y: 4', 'z: 5', 'ts: 3\nhz: 4\nftt:5');
        })
        .then(function() {
            return Plotly.restyle(gd, 'hoverinfo', 'x+y');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText('(3, 4)');
        })
        .then(function() {
            return Plotly.restyle(gd, 'hoverinfo', 'text');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText('ts: 3\nhz: 4\nftt:5');
        })
        .then(function() {
            return Plotly.restyle(gd, 'text', 'yo!');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'yo!');
        })
        .then(function() {
            return Plotly.restyle(gd, 'hovertext', [
                text.map(function(tx) { return tx + ' !!'; })
            ]);
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, 'ts: 3\nhz: 4\nftt:5 !!');
        })
        .then(function() {
            return Plotly.restyle(gd, 'hovertemplate', '%{x}-%{y}-%{z}<extra></extra>');
        })
        .then(delay(20))
        .then(function() {
            assertHoverText(null, null, null, '3-4-5');
        })
        .then(done, done.fail);
    });

    it('@gl should display correct face colors', function(done) {
        var fig = mesh3dcoloringMock;

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 200, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0.6666667',
                'y: 0.3333333',
                'z: 1',
                'face color: #00F',
                'face color'
            );
        })
        .then(function() { mouseEvent('mouseover', 300, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 1',
                'y: 0.3333333',
                'z: 0.6666667',
                'face color: #0FF',
                'face color'
            );
        })
        .then(function() { mouseEvent('mouseover', 300, 300); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 1',
                'y: 0.6666667',
                'z: 0.3333333',
                'face color: #0FF',
                'face color'
            );
        })
        .then(function() { mouseEvent('mouseover', 200, 300); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0.6666667',
                'y: 0',
                'z: 0.3333333',
                'face color: #F00',
                'face color'
            );
        })
        .then(done, done.fail);
    });

    it('@gl should display correct face intensities (uniform grid)', function(done) {
        var fig = mesh3dcellIntensityMock;

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 200, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0.4666667',
                'y: 0.4333333',
                'z: 0.01583333',
                'cell intensity: 0.16',
                'trace 0'
            );
        })
        .then(function() { mouseEvent('mouseover', 200, 300); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0.7666667',
                'y: 0.1333333',
                'z: −0.3305',
                'cell intensity: 3.04',
                'trace 0'
            );
        })
        .then(done, done.fail);
    });

    it('@gl should display correct face intensities (non-uniform grid)', function(done) {
        var fig = Lib.extendDeep({}, mesh3dbunnyMock);

        fig.layout.scene.camera.eye = {
            x: 0,
            y: 0.2,
            z: 0.05
        };

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 100); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0.0112223',
                'y: −0.05352963',
                'z: 0.5941605',
                'cell intensity: 12',
                'trace 0'
            );
        })
        .then(done, done.fail);
    });

    it('@gl should display correct face intensities *alpha-hull* case', function(done) {
        var fig = {
            data: [{
                type: 'mesh3d',
                hovertemplate: 'x: %{x}<br>y: %{y}<br>z: %{z}<br>cell intensity: %{intensity}',
                intensitymode: 'cell',
                intensity: [1, 2, 3, 4, 5, 6],
                x: [0, 0.5, 1, 1, 1, 0.5, 0, 0],
                y: [0, 0, 0, 0.5, 1, 1, 1, 0.5],
                z: [0, 0, 0, 0, 0, 0, 0, 0],
                alphahull: true
            }],
            layout: {
                width: 600,
                height: 400,
                scene: {
                    camera: {
                        eye: {
                            x: 0.5,
                            y: 0.5,
                            z: 1
                        }
                    }
                }
            }
        };

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 450, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0.1666667',
                'y: 0.8333333',
                'z: 0',
                'cell intensity: 5',
                'trace 0'
            );
        })
        .then(done, done.fail);
    });

    it('@gl should display correct face intensities *delaunay* case', function(done) {
        var fig = {
            data: [{
                type: 'mesh3d',
                hovertemplate: 'x: %{x}<br>y: %{y}<br>z: %{z}<br>cell intensity: %{intensity}',
                intensitymode: 'cell',
                intensity: [1, 2, 3, 4, 5, 6],
                x: [0, 0.5, 1, 1, 1, 0.5, 0, 0],
                y: [0, 0, 0, 0.5, 1, 1, 1, 0.5],
                z: [0, 0, 0, 0, 0, 0, 0, 0],
                delaunayaxis: 'z'
            }],
            layout: {
                width: 600,
                height: 400,
                scene: {
                    camera: {
                        eye: {
                            x: 0.5,
                            y: 0.5,
                            z: 1
                        }
                    }
                }
            }
        };

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 450, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0.1666667',
                'y: 0.8333333',
                'z: 0',
                'cell intensity: 5',
                'trace 0'
            );
        })
        .then(done, done.fail);
    });

    function scroll(target, amt) {
        return new Promise(function(resolve) {
            target.dispatchEvent(new WheelEvent('wheel', {deltaY: amt || 1, cancelable: true}));
            setTimeout(resolve, 0);
        });
    }

    var _scroll = function() {
        var sceneTarget = gd.querySelector('.svg-container .gl-container #scene canvas');
        return scroll(sceneTarget, -1);
    };

    it('@gl should pick correct points after orthographic scroll zoom - mesh3d case', function(done) {
        var fig = {
            data: [{
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                i: [0, 3, 4, 7, 0, 6, 1, 7, 0, 5, 2, 7],
                j: [1, 2, 5, 6, 2, 4, 3, 5, 4, 1, 6, 3],
                k: [3, 0, 7, 4, 6, 0, 7, 1, 5, 0, 7, 2],
                vertexcolor: ['#000', '#00F', '#0F0', '#0FF', '#F00', '#F0F', '#FF0', '#FFF'],
                hovertemplate: 'x: %{x}<br>y: %{y}<br>z: %{z}<br>vertex color: %{vertexcolor}',
                flatshading: true,
                type: 'mesh3d',
                name: 'vertex color'
            }],
            layout: {
                width: 600,
                height: 400,
                scene: {
                    camera: {
                        projection: { type: 'orthographic' },
                        eye: { x: 1, y: 1, z: 1 }
                    }
                }
            },
            config: {
                scrollZoom: 'gl3d'
            }
        };

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 1',
                'y: 1',
                'z: 1',
                'vertex color: #FFF',
                'vertex color'
            );
        })
        .then(_scroll)
        .then(_scroll)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 100); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0',
                'y: 0',
                'z: 1',
                'vertex color: #F00',
                'vertex color'
            );
        })
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 300); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 1',
                'y: 1',
                'z: 0',
                'vertex color: #0FF',
                'vertex color'
            );
        })
        .then(done, done.fail);
    });

    it('@gl should pick correct points after orthographic scroll zoom - scatter3d case', function(done) {
        var fig = {
            data: [{
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                marker: { color: ['#000', '#00F', '#0F0', '#0FF', '#F00', '#F0F', '#FF0', '#FFF'] },
                hovertemplate: 'x: %{x}<br>y: %{y}<br>z: %{z}<br>marker color: %{marker.color}',
                type: 'scatter3d',
                mode: 'marker',
                name: 'marker color'
            }],
            layout: {
                width: 600,
                height: 400,
                scene: {
                    camera: {
                        projection: { type: 'orthographic' },
                        eye: { x: 1, y: 1, z: 1 }
                    }
                }
            },
            config: {
                scrollZoom: 'gl3d'
            }
        };

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 1',
                'y: 1',
                'z: 1',
                'marker color: #FFF',
                'marker color'
            );
        })
        .then(_scroll)
        .then(_scroll)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 100); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 0',
                'y: 0',
                'z: 1',
                'marker color: #F00',
                'marker color'
            );
        })
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 300); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: 1',
                'y: 1',
                'z: 0',
                'marker color: #0FF',
                'marker color'
            );
        })
        .then(done, done.fail);
    });

    it('@gl should pick latest & closest points on hover if two points overlap', function(done) {
        var _mock = Lib.extendDeep({}, mock4);

        function _hover() {
            mouseEvent('mouseover', 0, 0);
            mouseEvent('mouseover', 200, 200);
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 1', 'y: 1', 'z: 1', 'third above', 'trace 1');
        })
        .then(done, done.fail);
    });

    describe('propagate colors to hover labels', function() {
        ['marker', 'line'].forEach(function(t) {
            it('@gl scatter3d ' + t + ' colors', function(done) {
                var orange = new Uint8Array(3);
                orange[0] = 255;
                orange[1] = 127;
                orange[2] = 0;

                var color = [
                    'red',
                    [0, 255, 0],
                    'rgba(0,0,255,0.5)',
                    orange,
                    'yellow',
                    // left undefined
                ];

                var _mock = {
                    data: [{
                        type: 'scatter3d',
                        x: [-1, -2, -3, -4, -5, -6],
                        y: [1, 2, 3, 4, 5, 6],
                        z: [0, 0, 0, 0, 0, 0]
                    }],
                    layout: {
                        margin: { t: 50, b: 50, l: 50, r: 50 },
                        width: 600,
                        height: 400,
                        scene: { aspectratio: { x: 2, y: 2, z: 0.5} }
                    }
                };

                if(t === 'marker') {
                    _mock.data[0].mode = 'markers';
                    _mock.data[0].marker = {
                        color: color,
                        size: 20
                    };
                } else {
                    _mock.data[0].mode = 'lines';
                    _mock.data[0].line = {
                        color: color,
                        width: 40
                    };
                }

                Plotly.newPlot(gd, _mock)
                .then(delay(100))
                .then(function() {
                    gd.on('plotly_hover', function(eventData) {
                        ptData = eventData.points[0];
                    });
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 80, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −1', 'y: 1', 'z: 0');
                    assertEventData(-1, 1, 0, 0, 0, t === 'marker' ? {
                        'marker.color': 'red'
                    } : {
                        'line.color': 'red'
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(255, 0, 0)',
                        bordercolor: 'rgb(255, 255, 255)',
                        fontColor: 'rgb(255, 255, 255)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, 'red');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 169, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −2', 'y: 2', 'z: 0');
                    assertEventData(-2, 2, 0, 0, 1, t === 'marker' ? {
                        'marker.color': [0, 255, 0]
                    } : {
                        'line.color': [0, 255, 0]
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(0, 255, 0)',
                        bordercolor: 'rgb(68, 68, 68)',
                        fontColor: 'rgb(68, 68, 68)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, 'green');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 258, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −3', 'y: 3', 'z: 0');
                    assertEventData(-3, 3, 0, 0, 2, t === 'marker' ? {
                        'marker.color': 'rgba(0,0,255,0.5)'
                    } : {
                        'line.color': 'rgba(0,0,255,0.5)'
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(0, 0, 255)',
                        bordercolor: 'rgb(255, 255, 255)',
                        fontColor: 'rgb(255, 255, 255)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, 'blue');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 347, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −4', 'y: 4', 'z: 0');
                    assertEventData(-4, 4, 0, 0, 3, t === 'marker' ? {
                        'marker.color': orange
                    } : {
                        'line.color': orange
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(255, 127, 0)',
                        bordercolor: 'rgb(68, 68, 68)',
                        fontColor: 'rgb(68, 68, 68)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, 'orange');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 436, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −5', 'y: 5', 'z: 0');
                    assertEventData(-5, 5, 0, 0, 4, t === 'marker' ? {
                        'marker.color': 'yellow'
                    } : {
                        'line.color': 'yellow'
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(255, 255, 0)',
                        bordercolor: 'rgb(68, 68, 68)',
                        fontColor: 'rgb(68, 68, 68)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, 'yellow');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 525, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −6', 'y: 6', 'z: 0');
                    assertEventData(-6, 6, 0, 0, 5, t === 'marker' ? {
                        'marker.color': undefined
                    } : {
                        'line.color': undefined
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(68, 68, 68)',
                        bordercolor: 'rgb(255, 255, 255)',
                        fontColor: 'rgb(255, 255, 255)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, 'undefined');
                })
                .then(done, done.fail);
            });

            it('@gl scatter3d ' + t + ' colorscale', function(done) {
                var color = [
                    2,
                    1,
                    0,
                    -1,
                    -2,
                    // left undefined
                ];

                var _mock = {
                    data: [{
                        type: 'scatter3d',
                        x: [-1, -2, -3, -4, -5, -6],
                        y: [1, 2, 3, 4, 5, 6],
                        z: [0, 0, 0, 0, 0, 0]
                    }],
                    layout: {
                        margin: { t: 50, b: 50, l: 50, r: 50 },
                        width: 600,
                        height: 400,
                        scene: { aspectratio: { x: 2, y: 2, z: 0.5} }
                    }
                };

                if(t === 'marker') {
                    _mock.data[0].mode = 'markers';
                    _mock.data[0].marker = {
                        colorscale: 'Portland',
                        color: color,
                        size: 20
                    };
                } else {
                    _mock.data[0].mode = 'lines';
                    _mock.data[0].line = {
                        colorscale: 'Portland',
                        color: color,
                        width: 40
                    };
                }

                Plotly.newPlot(gd, _mock)
                .then(delay(100))
                .then(function() {
                    gd.on('plotly_hover', function(eventData) {
                        ptData = eventData.points[0];
                    });
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 80, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −1', 'y: 1', 'z: 0');
                    assertEventData(-1, 1, 0, 0, 0, t === 'marker' ? {
                        'marker.color': 2
                    } : {
                        'line.color': 2
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(217, 30, 30)',
                        bordercolor: 'rgb(255, 255, 255)',
                        fontColor: 'rgb(255, 255, 255)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, '1st point');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 169, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −2', 'y: 2', 'z: 0');
                    assertEventData(-2, 2, 0, 0, 1, t === 'marker' ? {
                        'marker.color': 1
                    } : {
                        'line.color': 1
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(242, 143, 56)',
                        bordercolor: 'rgb(68, 68, 68)',
                        fontColor: 'rgb(68, 68, 68)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, '2nd point');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 258, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −3', 'y: 3', 'z: 0');
                    assertEventData(-3, 3, 0, 0, 2, t === 'marker' ? {
                        'marker.color': 0
                    } : {
                        'line.color': 0
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(242, 211, 56)',
                        bordercolor: 'rgb(68, 68, 68)',
                        fontColor: 'rgb(68, 68, 68)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, '3rd point');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 347, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −4', 'y: 4', 'z: 0');
                    assertEventData(-4, 4, 0, 0, 3, t === 'marker' ? {
                        'marker.color': -1
                    } : {
                        'line.color': -1
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(10, 136, 186)',
                        bordercolor: 'rgb(255, 255, 255)',
                        fontColor: 'rgb(255, 255, 255)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, '4th point');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 436, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −5', 'y: 5', 'z: 0');
                    assertEventData(-5, 5, 0, 0, 4, t === 'marker' ? {
                        'marker.color': -2
                    } : {
                        'line.color': -2
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(12, 51, 131)',
                        bordercolor: 'rgb(255, 255, 255)',
                        fontColor: 'rgb(255, 255, 255)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, '5th point');
                })
                .then(delay(100))
                .then(function() {
                    mouseEvent('mouseover', 525, 200);
                })
                .then(delay(100))
                .then(function() {
                    assertHoverText('x: −6', 'y: 6', 'z: 0');
                    assertEventData(-6, 6, 0, 0, 5, t === 'marker' ? {
                        'marker.color': undefined
                    } : {
                        'line.color': undefined
                    });
                    assertHoverLabelStyle(d3SelectAll('g.hovertext'), {
                        bgcolor: 'rgb(68, 68, 68)',
                        bordercolor: 'rgb(255, 255, 255)',
                        fontColor: 'rgb(255, 255, 255)',
                        fontSize: 13,
                        fontFamily: 'Arial'
                    }, '6th point');
                })
                .then(done, done.fail);
            });
        });
    });

    it('@gl should emit correct event data on unhover', function(done) {
        var _mock = Lib.extendDeep({}, mock2);
        var x = 655;
        var y = 221;

        function _hover() {
            mouseEvent('mouseover', x, y);
        }

        function _unhover() {
            return new Promise(function(resolve) {
                var x0 = x;
                var y0 = y;
                var initialElement = document.elementFromPoint(x0, y0);
                var canceler = setInterval(function() {
                    x0 -= 2;
                    y0 -= 2;
                    mouseEvent('mouseover', x0, y0);

                    var nowElement = document.elementFromPoint(x0, y0);
                    if(nowElement !== initialElement) {
                        mouseEvent('mouseout', x0, y0, {element: initialElement});
                    }
                }, 10);

                gd.on('plotly_unhover', function(eventData) {
                    clearInterval(canceler);
                    resolve(eventData);
                });

                setTimeout(function() {
                    clearInterval(canceler);
                    resolve(null);
                }, 350);
            });
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
            gd.on('plotly_unhover', function(eventData) {
                if(eventData) {
                    ptData = eventData.points[0];
                } else {
                    ptData = {};
                }
            });
        })
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertEventData(100.75, -102.63, -102.63, 0, 0, {
                'marker.symbol': 'circle',
                'marker.size': 10,
                'marker.color': 'blue',
                'marker.line.color': 'black'
            });
        })
        .then(_unhover)
        .then(delay(20))
        .then(function() {
            assertEventData(100.75, -102.63, -102.63, 0, 0, {
                'marker.symbol': 'circle',
                'marker.size': 10,
                'marker.color': 'blue',
                'marker.line.color': 'black'
            });
        })
        .then(done, done.fail);
    });
});

describe('hover on traces with (x|y|z|u|v|w)hoverformat and valuehoverformat', function() {
    'use strict';

    var gd, fig;

    beforeEach(function() {
        gd = createGraphDiv();

        fig = {
            layout: {
                hovermode: 'closest',
                width: 400,
                height: 400,
                margin: {
                    t: 0,
                    b: 0,
                    l: 0,
                    r: 0
                }
            }
        };
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function _hover() {
        mouseEvent('mouseover', 190, 210);
    }

    [
        {type: 'scatter3d', nums: 'x: 0.0\ny: 1.0\nz: 2.0'},
        {type: 'cone', nums: 'x: 0.0\ny: 1.0\nz: 2.0\nu: 0.0030\nv: 0.00400\nw: 0.005000'},
        {type: 'streamtube', nums: 'x: 0.0\ny: 1.0\nz: 2.0\nu: 0.0030\nv: 0.00400\nw: 0.005000'},
    ].forEach(function(t) {
        it('@gl ' + t.type + ' trace', function(done) {
            fig.data = [{
                showscale: false,
                hoverinfo: 'x+y+z+u+v+w',
                xhoverformat: '.1f',
                yhoverformat: '.1f',
                zhoverformat: '.1f',
                uhoverformat: '.4f',
                vhoverformat: '.5f',
                whoverformat: '.6f',
                x: [0],
                y: [1],
                z: [2],
                u: [0.003],
                v: [0.004],
                w: [0.005]
            }];

            fig.data[0].type = t.type;

            Plotly.newPlot(gd, fig)
            .then(delay(20))
            .then(_hover)
            .then(delay(20))
            .then(function() {
                assertHoverLabelContent({
                    name: '',
                    nums: t.nums
                });
            })
            .then(done, done.fail);
        });
    });

    it('@gl surface trace', function(done) {
        fig.data = [{
            showscale: false,
            xhoverformat: '.1f',
            yhoverformat: '.2f',
            zhoverformat: '.3f',
            x: [0, 1],
            y: [0, 1],
            z: [[1, 0], [0, 1]],
            type: 'surface'
        }];

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverLabelContent({
                name: '',
                nums: 'x: 1.0\ny: 1.00\nz: 1.000'
            });
        })
        .then(done, done.fail);
    });

    it('@gl mesh3d trace', function(done) {
        fig.data = [{
            showscale: false,
            xhoverformat: '.1f',
            yhoverformat: '.2f',
            zhoverformat: '.3f',
            x: [0, 1, 2],
            y: [1, 2, 0],
            z: [2, 0, 1],
            i: [0],
            j: [1],
            k: [2],
            type: 'mesh3d'
        }];

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverLabelContent({
                name: '',
                nums: 'x: 2.0\ny: 0.00\nz: 1.000'
            });
        })
        .then(done, done.fail);
    });

    [
        {type: 'isosurface', nums: 'x: 1.0\ny: 1.00\nz: 1.000\nvalue: 8.0000'},
        {type: 'volume', nums: 'x: 1.0\ny: 1.00\nz: 1.000\nvalue: 8.0000'},
    ].forEach(function(t) {
        it('@gl ' + t.type + ' trace', function(done) {
            fig.data = [{
                showscale: false,
                hoverinfo: 'x+y+z+u+v+w+value',
                xhoverformat: '.1f',
                yhoverformat: '.2f',
                zhoverformat: '.3f',
                valuehoverformat: '.4f',
                x: [0, 1, 0, 1, 0, 1, 0, 1],
                y: [0, 0, 1, 1, 0, 0, 1, 1],
                z: [0, 0, 0, 0, 1, 1, 1, 1],
                value: [1, 2, 3, 4, 5, 6, 7, 8]
            }];

            fig.data[0].type = t.type;

            Plotly.newPlot(gd, fig)
            .then(delay(20))
            .then(_hover)
            .then(delay(20))
            .then(function() {
                assertHoverLabelContent({
                    name: '',
                    nums: t.nums
                });
            })
            .then(done, done.fail);
        });
    });
});
