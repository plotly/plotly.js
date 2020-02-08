var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var delay = require('../assets/delay');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

var mock = require('@mocks/gl3d_marker-arrays.json');
var mesh3dcoloringMock = require('@mocks/gl3d_mesh3d_coloring.json');
var mesh3dcellIntensityMock = require('@mocks/gl3d_mesh3d_cell-intensity.json');
var mesh3dbunnyMock = require('@mocks/gl3d_bunny_cell-area.json');
var multipleScatter3dMock = require('@mocks/gl3d_multiple-scatter3d-traces.json');

// lines, markers, text, error bars and surfaces each
// correspond to one glplot object
var mock2 = Lib.extendDeep({}, mock);
mock2.data[0].mode = 'lines+markers+text';
mock2.data[0].error_z = { value: 10 };
mock2.data[0].surfaceaxis = 2;
mock2.layout.showlegend = true;

var mock3 = require('@mocks/gl3d_autocolorscale');
var mock4 = require('@mocks/gl3d_transparent_same-depth.json');

describe('Test gl3d trace click/hover:', function() {
    var gd, ptData;

    beforeEach(function() {
        gd = createGraphDiv();
        ptData = {};
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 6000;
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
            'data', 'fullData', 'curveNumber', 'pointNumber'
        ]), 'correct hover data fields');

        expect(ptData.x).toEqual(x, 'x val');
        expect(ptData.y).toEqual(y, 'y val');
        expect(ptData.z).toEqual(z, 'z val');
        expect(ptData.curveNumber).toEqual(curveNumber, 'curveNumber');
        expect(ptData.pointNumber).toEqual(pointNumber, 'pointNumber');

        Object.keys(extra || {}).forEach(function(k) {
            expect(ptData[k]).toBe(extra[k], k + ' val');
        });
    }

    it('@gl should display correct hover labels of the second point of the very first scatter3d trace', function(done) {
        var _mock = Lib.extendDeep({}, multipleScatter3dMock);

        function _hover() {
            mouseEvent('mouseover', 300, 200);
        }

        Plotly.plot(gd, _mock)
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
        .catch(failTest)
        .then(done);
    });

    it('@gl should honor *hoverlabel.namelength*', function(done) {
        var _mock = Lib.extendDeep({}, multipleScatter3dMock);

        function _hover() {
            mouseEvent('mouseover', 300, 200);
        }

        Plotly.plot(gd, _mock)
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
        .catch(failTest)
        .then(done);
    });

    it('@gl should display correct hover labels and emit correct event data (scatter3d case)', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        function _hover() {
            mouseEvent('mouseover', 0, 0);
            mouseEvent('mouseover', 655, 221);
        }

        Plotly.plot(gd, _mock)
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
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
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
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
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
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
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
            var label = d3.selectAll('g.hovertext');

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
        .catch(failTest)
        .then(done);
    });

    it('@gl should display correct hover labels and emit correct event data (surface case with connectgaps enabled)', function(done) {
        var surfaceConnectgaps = require('@mocks/gl3d_surface_connectgaps');
        var _mock = Lib.extendDeep({}, surfaceConnectgaps);

        function _hover() {
            mouseEvent('mouseover', 300, 200);
        }

        Plotly.plot(gd, _mock)
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
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
                bgcolor: 'rgb(68, 68, 68)',
                bordercolor: 'rgb(255, 255, 255)',
                fontSize: 13,
                fontFamily: 'Arial',
                fontColor: 'rgb(255, 255, 255)'
            }, 'initial');
        })
        .then(done);
    });

    it('@gl should display correct hover labels and emit correct event data (surface case)', function(done) {
        var _mock = Lib.extendDeep({}, mock3);

        function _hover() {
            mouseEvent('mouseover', 605, 271);
        }

        Plotly.plot(gd, _mock)
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
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
                bgcolor: 'rgb(68, 68, 68)',
                bordercolor: 'rgb(255, 255, 255)',
                fontSize: 13,
                fontFamily: 'Arial',
                fontColor: 'rgb(255, 255, 255)'
            }, 'initial');

            return Plotly.restyle(gd, {
                'hoverinfo': [[
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
                'hoverinfo': 'y',
                'hoverlabel.font.color': 'cyan'
            });
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
                bgcolor: 'rgb(255, 255, 255)',
                bordercolor: 'rgb(68, 68, 68)',
                fontSize: 9,
                fontFamily: 'Arial',
                fontColor: 'rgb(0, 255, 255)'
            }, 'restyle');

            var label = d3.selectAll('g.hovertext');

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
                'hoverinfo': 'y',
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
        .then(done);
    });

    it('@gl should emit correct event data on click (scatter3d case)', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        // N.B. gl3d click events are 'mouseover' events
        // with button 1 pressed
        function _click() {
            mouseEvent('mouseover', 605, 271, {buttons: 1});
        }

        Plotly.plot(gd, _mock)
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
        .then(done);
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
        .catch(failTest)
        .then(done);
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
        .catch(failTest)
        .then(done);
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
        .catch(failTest)
        .then(done);
    });

    it('@gl should display correct face intensities (non-uniform grid)', function(done) {
        var fig = mesh3dbunnyMock;

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { mouseEvent('mouseover', 300, 200); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: −0.02154988',
                'y: −0.1181136',
                'z: 0.9471037',
                'cell intensity: 8',
                'trace 0'
            );
        })
        .then(function() { mouseEvent('mouseover', 400, 300); })
        .then(delay(20))
        .then(function() {
            assertHoverText(
                'x: −0.3543044',
                'y: 0.4389607',
                'z: 0.6468034',
                'cell intensity: 8',
                'trace 0'
            );
        })
        .catch(failTest)
        .then(done);
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
        .catch(failTest)
        .then(done);
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
        .catch(failTest)
        .then(done);
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
        .catch(failTest)
        .then(done);
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
        .catch(failTest)
        .then(done);
    });

    it('@gl should pick latest & closest points on hover if two points overlap', function(done) {
        var _mock = Lib.extendDeep({}, mock4);

        function _hover() {
            mouseEvent('mouseover', 0, 0);
            mouseEvent('mouseover', 200, 200);
        }

        Plotly.plot(gd, _mock)
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
        .catch(failTest)
        .then(done);
    });
});
