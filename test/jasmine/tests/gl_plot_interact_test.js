var d3 = require('d3');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var selectButton = require('../assets/modebar_button');
var delay = require('../assets/delay');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

function countCanvases() {
    return d3.selectAll('canvas').size();
}

describe('Test gl3d plots', function() {
    var gd, ptData;

    var mock = require('@mocks/gl3d_marker-arrays.json');

    // lines, markers, text, error bars and surfaces each
    // correspond to one glplot object
    var mock2 = Lib.extendDeep({}, mock);
    mock2.data[0].mode = 'lines+markers+text';
    mock2.data[0].error_z = { value: 10 };
    mock2.data[0].surfaceaxis = 2;
    mock2.layout.showlegend = true;

    var mock3 = require('@mocks/gl3d_autocolorscale');

    function assertHoverText(xLabel, yLabel, zLabel, textLabel) {
        var content = [xLabel, yLabel, zLabel];
        if(textLabel) content.push(textLabel);
        assertHoverLabelContent({nums: content.join('\n')});
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

    beforeEach(function() {
        gd = createGraphDiv();
        ptData = {};
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@noCI should display correct hover labels and emit correct event data (scatter3d case)', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        function _hover() {
            mouseEvent('mouseover', 605, 271);
            return delay(20)();
        }

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(_hover)
        .then(delay(20))
        .then(function() {
            assertHoverText('x: 140.72', 'y: −96.97', 'z: −96.97');
            assertEventData(140.72, -96.97, -96.97, 0, 2, {
                'marker.symbol': 'cross',
                'marker.size': 30,
                'marker.color': 'orange',
                'marker.line.color': undefined
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
        .then(_hover)
        .then(function() {
            assertHoverText('x: Jan 1, 2017', 'y: −96.97', 'z: −96.97');

            return Plotly.restyle(gd, {
                x: [[new Date(2017, 2, 1), new Date(2017, 2, 2), new Date(2017, 2, 3), new Date(2017, 2, 4)]]
            });
        })
        .then(_hover)
        .then(function() {
            assertHoverText('x: Mar 3, 2017', 'y: −96.97', 'z: −96.97');

            return Plotly.update(gd, {
                y: [['a', 'b', 'c', 'd']],
                z: [[10, 1e3, 1e5, 1e10]]
            }, {
                'scene.zaxis.type': 'log'
            });
        })
        .then(_hover)
        .then(function() {
            assertHoverText('x: Mar 3, 2017', 'y: c', 'z: 100k');

            return Plotly.relayout(gd, 'scene.xaxis.calendar', 'chinese');
        })
        .then(_hover)
        .then(function() {
            assertHoverText('x: 二 6, 2017', 'y: c', 'z: 100k');

            return Plotly.restyle(gd, 'text', [['A', 'B', 'C', 'D']]);
        })
        .then(_hover)
        .then(function() {
            assertHoverText('x: 二 6, 2017', 'y: c', 'z: 100k', 'C');

            return Plotly.restyle(gd, 'hovertext', [['Apple', 'Banana', 'Clementine', 'Dragon fruit']]);
        })
        .then(_hover)
        .then(function() {
            assertHoverText('x: 二 6, 2017', 'y: c', 'z: 100k', 'Clementine');

            return Plotly.restyle(gd, {
                'hoverlabel.bgcolor': [['red', 'blue', 'green', 'yellow']],
                'hoverlabel.font.size': 20
            });
        })
        .then(_hover)
        .then(function() {
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
                bgcolor: 'rgb(0, 128, 0)',
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
        .then(_hover)
        .then(function() {
            assertHoverLabelStyle(d3.selectAll('g.hovertext'), {
                bgcolor: 'rgb(0, 128, 0)',
                bordercolor: 'rgb(255, 255, 0)',
                fontSize: 20,
                fontFamily: 'Roboto',
                fontColor: 'rgb(0, 255, 255)'
            }, 'restyle #2');

            return Plotly.restyle(gd, 'hoverinfo', [[null, null, 'y', null]]);
        })
        .then(_hover)
        .then(function() {
            var label = d3.selectAll('g.hovertext');

            expect(label.size()).toEqual(1);
            expect(label.select('text').text()).toEqual('c');

            return Plotly.restyle(gd, 'hoverinfo', [[null, null, 'dont+know', null]]);
        })
        .then(_hover)
        .then(function() {
            assertHoverText('x: 二 6, 2017', 'y: c', 'z: 100k', 'Clementine');
        })
        .catch(fail)
        .then(done);
    });

    it('@noCI should display correct hover labels and emit correct event data (surface case)', function(done) {
        var _mock = Lib.extendDeep({}, mock3);

        function _hover() {
            mouseEvent('mouseover', 605, 271);
            return delay(20)();
        }

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
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

            Plotly.restyle(gd, {
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
        .then(_hover)
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
        .then(_hover)
        .then(function() {
            assertEventData(1, 2, 43, 0, [1, 2], {
                'hoverinfo': 'y',
                'hoverlabel.font.color': 'cyan',
                'colorbar.tickvals': undefined,
                'colorbar.ticktext': undefined
            });
        })
        .then(done);
    });

    it('@noCI should emit correct event data on click (scatter3d case)', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        // N.B. gl3d click events are 'mouseover' events
        // with button 1 pressed
        function _click() {
            mouseEvent('mouseover', 605, 271, {buttons: 1});
            return delay(20)();
        }

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            gd.on('plotly_click', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(_click)
        .then(delay(20))
        .then(function() {
            assertEventData(140.72, -96.97, -96.97, 0, 2);
        })
        .then(done);
    });

    it('should be able to reversibly change trace type', function(done) {
        var _mock = Lib.extendDeep({}, mock2);
        var sceneLayout = { aspectratio: { x: 1, y: 1, z: 1 } };

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            expect(countCanvases()).toEqual(1);
            expect(gd.layout.scene).toEqual(sceneLayout);
            expect(gd.layout.xaxis).toBeUndefined();
            expect(gd.layout.yaxis).toBeUndefined();
            expect(gd._fullLayout._has('gl3d')).toBe(true);
            expect(gd._fullLayout.scene._scene).toBeDefined();

            return Plotly.restyle(gd, 'type', 'scatter');
        })
        .then(function() {
            expect(countCanvases()).toEqual(0);
            expect(gd.layout.scene).toEqual(sceneLayout);
            expect(gd.layout.xaxis).toBeDefined();
            expect(gd.layout.yaxis).toBeDefined();
            expect(gd._fullLayout._has('gl3d')).toBe(false);
            expect(gd._fullLayout.scene).toBeUndefined();

            return Plotly.restyle(gd, 'type', 'scatter3d');
        })
        .then(function() {
            expect(countCanvases()).toEqual(1);
            expect(gd.layout.scene).toEqual(sceneLayout);
            expect(gd.layout.xaxis).toBeDefined();
            expect(gd.layout.yaxis).toBeDefined();
            expect(gd._fullLayout._has('gl3d')).toBe(true);
            expect(gd._fullLayout.scene._scene).toBeDefined();

        })
        .then(done);
    });

    it('should be able to delete the last trace', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            expect(countCanvases()).toEqual(0);
            expect(gd._fullLayout._has('gl3d')).toBe(false);
            expect(gd._fullLayout.scene).toBeUndefined();
        })
        .then(done);
    });

    it('should be able to toggle visibility', function(done) {
        var _mock = Lib.extendDeep({}, mock2);
        _mock.data[0].x = [0, 1, 3];
        _mock.data[0].y = [0, 1, 2];
        _mock.data.push({
            type: 'surface',
            z: [[1, 2, 3], [1, 2, 3], [2, 1, 2]]
        }, {
            type: 'mesh3d',
            x: [0, 1, 2, 0], y: [0, 0, 1, 2], z: [0, 2, 0, 1],
            i: [0, 0, 0, 1], j: [1, 2, 3, 2], k: [2, 3, 1, 3]
        });

        // scatter3d traces are made of 5 gl-vis objects,
        // surface and mesh3d are made of 1 gl-vis object each.
        var order0 = [0, 0, 0, 0, 0, 1, 2];

        function assertObjects(expected) {
            var objects = gd._fullLayout.scene._scene.glplot.objects;
            var actual = objects.map(function(o) {
                return o._trace.data.index;
            });

            expect(actual).toEqual(expected);
        }

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            assertObjects(order0);

            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            assertObjects([]);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            assertObjects(order0);

            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            assertObjects([1, 2]);

            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            assertObjects(order0);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        })
        .then(function() {
            assertObjects([0, 0, 0, 0, 0, 2]);

            return Plotly.restyle(gd, 'visible', true, [1]);
        })
        .then(function() {
            assertObjects(order0);
        })
        .then(done);
    });

});

describe('Test gl3d modebar handlers', function() {
    var gd, modeBar;

    function assertScenes(cont, attr, val) {
        var sceneIds = Plots.getSubplotIds(cont, 'gl3d');

        sceneIds.forEach(function(sceneId) {
            var thisVal = Lib.nestedProperty(cont[sceneId], attr).get();
            expect(thisVal).toEqual(val);
        });
    }

    function assertCameraEye(sceneLayout, eyeX, eyeY, eyeZ) {
        expect(sceneLayout.camera.eye.x).toEqual(eyeX);
        expect(sceneLayout.camera.eye.y).toEqual(eyeY);
        expect(sceneLayout.camera.eye.z).toEqual(eyeZ);

        var camera = sceneLayout._scene.getCamera();
        expect(camera.eye.x).toBeCloseTo(eyeX);
        expect(camera.eye.y).toBeCloseTo(eyeY);
        expect(camera.eye.z).toBeCloseTo(eyeZ);
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mock = {
            data: [
                { type: 'scatter3d' },
                { type: 'surface', scene: 'scene2' }
            ],
            layout: {
                scene: { camera: { eye: { x: 0.1, y: 0.1, z: 1 }}},
                scene2: { camera: { eye: { x: 2.5, y: 2.5, z: 2.5 }}}
            }
        };

        Plotly.plot(gd, mock)
        .then(delay(20))
        .then(function() {
            modeBar = gd._fullLayout._modeBar;
        })
        .then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('button zoom3d should updates the scene dragmode and dragmode button', function() {
        var buttonTurntable = selectButton(modeBar, 'tableRotation');
        var buttonZoom3d = selectButton(modeBar, 'zoom3d');

        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonZoom3d.isActive()).toBe(false);

        buttonZoom3d.click();
        assertScenes(gd.layout, 'dragmode', 'zoom');
        expect(gd.layout.dragmode).toBe(undefined);
        expect(gd._fullLayout.dragmode).toBe('zoom');
        expect(buttonTurntable.isActive()).toBe(false);
        expect(buttonZoom3d.isActive()).toBe(true);

        buttonTurntable.click();
        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonZoom3d.isActive()).toBe(false);
    });

    it('button pan3d should updates the scene dragmode and dragmode button', function() {
        var buttonTurntable = selectButton(modeBar, 'tableRotation'),
            buttonPan3d = selectButton(modeBar, 'pan3d');

        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonPan3d.isActive()).toBe(false);

        buttonPan3d.click();
        assertScenes(gd.layout, 'dragmode', 'pan');
        expect(gd.layout.dragmode).toBe(undefined);
        expect(gd._fullLayout.dragmode).toBe('zoom');
        expect(buttonTurntable.isActive()).toBe(false);
        expect(buttonPan3d.isActive()).toBe(true);

        buttonTurntable.click();
        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonPan3d.isActive()).toBe(false);
    });

    it('button orbitRotation should updates the scene dragmode and dragmode button', function() {
        var buttonTurntable = selectButton(modeBar, 'tableRotation'),
            buttonOrbit = selectButton(modeBar, 'orbitRotation');

        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonOrbit.isActive()).toBe(false);

        buttonOrbit.click();
        assertScenes(gd.layout, 'dragmode', 'orbit');
        expect(gd.layout.dragmode).toBe(undefined);
        expect(gd._fullLayout.dragmode).toBe('zoom');
        expect(buttonTurntable.isActive()).toBe(false);
        expect(buttonOrbit.isActive()).toBe(true);

        buttonTurntable.click();
        assertScenes(gd._fullLayout, 'dragmode', 'turntable');
        expect(buttonTurntable.isActive()).toBe(true);
        expect(buttonOrbit.isActive()).toBe(false);
    });

    it('button hoverClosest3d should update the scene hovermode and spikes', function() {
        var buttonHover = selectButton(modeBar, 'hoverClosest3d');

        assertScenes(gd._fullLayout, 'hovermode', 'closest');
        expect(buttonHover.isActive()).toBe(true);

        buttonHover.click();
        assertScenes(gd._fullLayout, 'hovermode', false);
        assertScenes(gd._fullLayout, 'xaxis.showspikes', false);
        assertScenes(gd._fullLayout, 'yaxis.showspikes', false);
        assertScenes(gd._fullLayout, 'zaxis.showspikes', false);
        expect(buttonHover.isActive()).toBe(false);

        buttonHover.click();
        assertScenes(gd._fullLayout, 'hovermode', 'closest');
        assertScenes(gd._fullLayout, 'xaxis.showspikes', true);
        assertScenes(gd._fullLayout, 'yaxis.showspikes', true);
        assertScenes(gd._fullLayout, 'zaxis.showspikes', true);
        expect(buttonHover.isActive()).toBe(true);
    });

    it('button resetCameraDefault3d should reset camera to default', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');

        expect(gd._fullLayout.scene._scene.cameraInitial.eye).toEqual({ x: 0.1, y: 0.1, z: 1 });
        expect(gd._fullLayout.scene2._scene.cameraInitial.eye).toEqual({ x: 2.5, y: 2.5, z: 2.5 });

        gd.once('plotly_relayout', function() {
            assertScenes(gd._fullLayout, 'camera.eye.x', 1.25);
            assertScenes(gd._fullLayout, 'camera.eye.y', 1.25);
            assertScenes(gd._fullLayout, 'camera.eye.z', 1.25);

            expect(gd._fullLayout.scene._scene.getCamera().eye.z).toBeCloseTo(1.25);
            expect(gd._fullLayout.scene2._scene.getCamera().eye.z).toBeCloseTo(1.25);

            done();
        });

        buttonDefault.click();
    });

    it('button resetCameraLastSave3d should reset camera to default', function(done) {
        var buttonDefault = selectButton(modeBar, 'resetCameraDefault3d');
        var buttonLastSave = selectButton(modeBar, 'resetCameraLastSave3d');

        Plotly.relayout(gd, {
            'scene.camera.eye.z': 4,
            'scene2.camera.eye.z': 5
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 1);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 2.5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonDefault.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 1.25, 1.25, 1.25);
            assertCameraEye(gd._fullLayout.scene2, 1.25, 1.25, 1.25);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 1);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 2.5);

            delete gd._fullLayout.scene._scene.cameraInitial;
            delete gd._fullLayout.scene2._scene.cameraInitial;

            Plotly.relayout(gd, {
                'scene.bgcolor': '#d3d3d3',
                'scene.camera.eye.z': 4,
                'scene2.camera.eye.z': 5
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonDefault.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 1.25, 1.25, 1.25);
            assertCameraEye(gd._fullLayout.scene2, 1.25, 1.25, 1.25);

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', resolve);
                buttonLastSave.click();
            });
        })
        .then(function() {
            assertCameraEye(gd._fullLayout.scene, 0.1, 0.1, 4);
            assertCameraEye(gd._fullLayout.scene2, 2.5, 2.5, 5);
        })
        .then(done);
    });
});

describe('Test gl3d drag and wheel interactions', function() {
    var gd, relayoutCallback;

    function scroll(target) {
        return new Promise(function(resolve) {
            target.dispatchEvent(new WheelEvent('wheel', {deltaY: 1}));
            setTimeout(resolve, 0);
        });
    }

    function drag(target) {
        return new Promise(function(resolve) {
            target.dispatchEvent(new MouseEvent('mousedown', {x: 0, y: 0}));
            target.dispatchEvent(new MouseEvent('mousemove', { x: 100, y: 100}));
            target.dispatchEvent(new MouseEvent('mouseup', { x: 100, y: 100}));
            setTimeout(resolve, 0);
        });
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mock = {
            data: [
                { type: 'scatter3d' },
                { type: 'surface', scene: 'scene2' }
            ],
            layout: {
                scene: { camera: { eye: { x: 0.1, y: 0.1, z: 1 }}},
                scene2: { camera: { eye: { x: 2.5, y: 2.5, z: 2.5 }}}
            }
        };

        Plotly.plot(gd, mock)
        .then(delay(20))
        .then(function() {
            relayoutCallback = jasmine.createSpy('relayoutCallback');
            gd.on('plotly_relayout', relayoutCallback);
        })
        .then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should update the scene camera', function(done) {
        var sceneLayout = gd._fullLayout.scene,
            sceneLayout2 = gd._fullLayout.scene2,
            sceneTarget = gd.querySelector('.svg-container .gl-container #scene  canvas'),
            sceneTarget2 = gd.querySelector('.svg-container .gl-container #scene2 canvas');

        expect(sceneLayout.camera.eye)
            .toEqual({x: 0.1, y: 0.1, z: 1});
        expect(sceneLayout2.camera.eye)
            .toEqual({x: 2.5, y: 2.5, z: 2.5});

        scroll(sceneTarget).then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
            relayoutCallback.calls.reset();

            return scroll(sceneTarget2);
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
            relayoutCallback.calls.reset();

            return drag(sceneTarget2);
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
            relayoutCallback.calls.reset();

            return drag(sceneTarget);
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
            relayoutCallback.calls.reset();

            return Plotly.relayout(gd, {
                'scene.dragmode': false,
                'scene2.dragmode': false
            });
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
            relayoutCallback.calls.reset();

            return drag(sceneTarget);
        })
        .then(function() {
            return drag(sceneTarget2);
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(0);

            return Plotly.relayout(gd, {
                'scene.dragmode': 'orbit',
                'scene2.dragmode': 'turntable'
            });
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
            relayoutCallback.calls.reset();

            return drag(sceneTarget);
        })
        .then(function() {
            return drag(sceneTarget2);
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(2);
        })
        .then(done);
    });
});

describe('Test gl3d relayout calls', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should be able to adjust margins', function(done) {
        var w = 500;
        var h = 500;

        function assertMargins(t, l, b, r) {
            var div3d = document.getElementById('scene');
            expect(parseFloat(div3d.style.top)).toEqual(t, 'top');
            expect(parseFloat(div3d.style.left)).toEqual(l, 'left');
            expect(h - parseFloat(div3d.style.height) - t).toEqual(b, 'bottom');
            expect(w - parseFloat(div3d.style.width) - l).toEqual(r, 'right');
        }

        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            width: w,
            height: h
        })
        .then(function() {
            assertMargins(100, 80, 80, 80);

            return Plotly.relayout(gd, 'margin', {
                l: 0, t: 0, r: 0, b: 0
            });
        })
        .then(function() {
            assertMargins(0, 0, 0, 0);
        })
        .catch(fail)
        .then(done);
    });

    it('should skip root-level axis objects', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }])
        .then(function() {
            return Plotly.relayout(gd, {
                xaxis: {},
                yaxis: {},
                zaxis: {}
            });
        })
        .catch(fail)
        .then(done);
    });
});

describe('Test gl2d plots', function() {
    var gd;

    var mock = require('@mocks/gl2d_10.json');

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function mouseTo(p0, p1) {
        mouseEvent('mousemove', p0[0], p0[1]);
        mouseEvent('mousedown', p0[0], p0[1], { buttons: 1 });
        mouseEvent('mousemove', p1[0], p1[1], { buttons: 1 });
        mouseEvent('mouseup', p1[0], p1[1]);
    }

    it('should respond to drag interactions', function(done) {
        var _mock = Lib.extendDeep({}, mock);
        var relayoutCallback = jasmine.createSpy('relayoutCallback');

        var originalX = [-0.3037383177570093, 5.303738317757009];
        var originalY = [-0.5532219548705213, 6.191112269783224];
        var newX = [-0.5373831775700935, 5.070093457943925];
        var newY = [-1.7575673521301187, 4.986766872523626];
        var precision = 5;

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            expect(gd.layout.xaxis.autorange).toBe(true);
            expect(gd.layout.yaxis.autorange).toBe(true);
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

            // Switch to pan mode
            var buttonPan = selectButton(gd._fullLayout._modeBar, 'pan2d');
            expect(buttonPan.isActive()).toBe(false, 'initially, zoom is active');
            buttonPan.click();
            expect(buttonPan.isActive()).toBe(true, 'switched on dragmode');

            // Switching mode must not change visible range
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(delay(200))
        .then(function() {
            gd.on('plotly_relayout', relayoutCallback);

            // Drag scene along the X axis
            mouseTo([200, 200], [220, 200]);

            expect(gd.layout.xaxis.autorange).toBe(false);
            expect(gd.layout.yaxis.autorange).toBe(false);

            expect(gd.layout.xaxis.range).toBeCloseToArray(newX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

            // Drag scene back along the X axis
            mouseTo([220, 200], [200, 200]);

            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

            // Drag scene along the Y axis
            mouseTo([200, 200], [200, 150]);

            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(newY, precision);

            // Drag scene back along the Y axis
            mouseTo([200, 150], [200, 200]);

            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

            // Drag scene along both the X and Y axis
            mouseTo([200, 200], [220, 150]);

            expect(gd.layout.xaxis.range).toBeCloseToArray(newX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(newY, precision);

            // Drag scene back along the X and Y axis
            mouseTo([220, 150], [200, 200]);

            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(delay(200))
        .then(function() {
            // callback count expectation: X and back; Y and back; XY and back
            expect(relayoutCallback).toHaveBeenCalledTimes(6);

            // a callback value structure and contents check
            expect(relayoutCallback).toHaveBeenCalledWith(jasmine.objectContaining({
                lastInputTime: jasmine.any(Number),
                xaxis: [jasmine.any(Number), jasmine.any(Number)],
                yaxis: [jasmine.any(Number), jasmine.any(Number)]
            }));
        })
        .then(done);
    });

    it('should be able to toggle visibility', function(done) {
        var _mock = Lib.extendDeep({}, mock);

        // a line object + scatter fancy
        var OBJECT_PER_TRACE = 2;

        var objects = function() {
            return gd._fullLayout._plots.xy._scene2d.glplot.objects;
        };

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            expect(objects().length).toEqual(OBJECT_PER_TRACE);

            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            expect(objects().length).toEqual(OBJECT_PER_TRACE);
            expect(objects()[0].data.length).toEqual(0);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(objects().length).toEqual(OBJECT_PER_TRACE);
            expect(objects()[0].data.length).not.toEqual(0);

            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene2d).toBeUndefined();

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(objects().length).toEqual(OBJECT_PER_TRACE);
            expect(objects()[0].data.length).not.toEqual(0);
        })
        .then(done);
    });

    it('should clear orphan cartesian subplots on addTraces', function(done) {
        Plotly.newPlot(gd, [], {
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' }
        })
        .then(function() {
            return Plotly.addTraces(gd, [{
                type: 'scattergl',
                x: [1, 2, 3, 4, 5, 6, 7],
                y: [0, 5, 8, 9, 8, 5, 0]
            }]);
        })
        .then(function() {
            expect(d3.select('.xtitle').size()).toEqual(0);
            expect(d3.select('.ytitle').size()).toEqual(0);
        })
        .then(done);
    });

    it('supports 1D and 2D Zoom', function(done) {
        var centerX, centerY;
        Plotly.newPlot(gd,
            [{type: 'scattergl', x: [1, 15], y: [1, 15]}],
            {
                width: 400,
                height: 400,
                margin: {t: 100, b: 100, l: 100, r: 100},
                xaxis: {range: [0, 16]},
                yaxis: {range: [0, 16]}
            }
        )
        .then(function() {
            var bBox = gd.getBoundingClientRect();
            centerX = bBox.left + 200;
            centerY = bBox.top + 200;

            // 2D
            mouseTo([centerX - 50, centerY], [centerX + 50, centerY + 50]);
            expect(gd.layout.xaxis.range).toBeCloseToArray([4, 12], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([4, 8], 3);

            // x only
            mouseTo([centerX - 50, centerY], [centerX, centerY + 5]);
            expect(gd.layout.xaxis.range).toBeCloseToArray([6, 8], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([4, 8], 3);

            // y only
            mouseTo([centerX, centerY - 50], [centerX - 5, centerY + 50]);
            expect(gd.layout.xaxis.range).toBeCloseToArray([6, 8], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([5, 7], 3);

            // no change - too small
            mouseTo([centerX, centerY], [centerX - 5, centerY + 5]);
            expect(gd.layout.xaxis.range).toBeCloseToArray([6, 8], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([5, 7], 3);
        })
        .catch(fail)
        .then(done);
    });

    it('supports axis constraints with zoom', function(done) {
        var centerX, centerY;
        Plotly.newPlot(gd,
            [{type: 'scattergl', x: [1, 15], y: [1, 15]}],
            {
                width: 400,
                height: 400,
                margin: {t: 100, b: 100, l: 100, r: 100},
                xaxis: {range: [0, 16]},
                yaxis: {range: [0, 16]}
            }
        )
        .then(function() {
            var bBox = gd.getBoundingClientRect();
            centerX = bBox.left + 200;
            centerY = bBox.top + 200;

            return Plotly.relayout(gd, {
                'yaxis.scaleanchor': 'x',
                'yaxis.scaleratio': 2
            });
        })
        .then(function() {
            // x range is adjusted to fit constraint
            expect(gd.layout.xaxis.range).toBeCloseToArray([-8, 24], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([0, 16], 3);

            // now there should only be 2D zooming
            // dy>>dx
            mouseTo([centerX, centerY], [centerX - 1, centerY - 50]);
            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 8], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([8, 12], 3);

            // dx>>dy
            mouseTo([centerX, centerY], [centerX + 50, centerY + 1]);
            expect(gd.layout.xaxis.range).toBeCloseToArray([4, 6], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([9, 10], 3);

            // no change - too small
            mouseTo([centerX, centerY], [centerX - 5, centerY + 5]);
            expect(gd.layout.xaxis.range).toBeCloseToArray([4, 6], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([9, 10], 3);

            return Plotly.relayout(gd, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray([-8.09195, 24.09195], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([-0.04598, 16.04598], 3);
        })
        .catch(fail)
        .then(done);
    });

    it('should change plot type with incomplete data', function(done) {
        Plotly.plot(gd, [{}]);

        expect(function() {
            Plotly.restyle(gd, {type: 'scattergl', x: [[1]]}, 0);
        }).not.toThrow();

        expect(function() {
            Plotly.restyle(gd, {y: [[1]]}, 0);
        }).not.toThrow();

        done();
    });
});

describe('Test removal of gl contexts', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('Plots.cleanPlot should remove gl context from the graph div of a gl3d plot', function(done) {
        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [2, 1, 3],
            z: [3, 2, 1]
        }])
        .then(function() {
            expect(gd._fullLayout.scene._scene.glplot).toBeDefined();

            Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);
            expect(gd._fullLayout.scene._scene.glplot).toBe(null);
        })
        .then(done);
    });

    it('Plots.cleanPlot should remove gl context from the graph div of a gl2d plot', function(done) {
        Plotly.plot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 3]
        }])
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene2d.glplot).toBeDefined();

            Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);
            expect(gd._fullLayout._plots).toEqual({});
        })
        .then(done);
    });

    it('Plotly.newPlot should remove gl context from the graph div of a gl3d plot', function(done) {
        var firstGlplotObject, firstGlContext, firstCanvas;

        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [2, 1, 3],
            z: [3, 2, 1]
        }])
        .then(function() {
            firstGlplotObject = gd._fullLayout.scene._scene.glplot;
            firstGlContext = firstGlplotObject.gl;
            firstCanvas = firstGlContext.canvas;

            expect(firstGlplotObject).toBeDefined();

            return Plotly.newPlot(gd, [{
                type: 'scatter3d',
                x: [2, 1, 3],
                y: [1, 2, 3],
                z: [2, 1, 3]
            }], {});
        })
        .then(function() {
            var secondGlplotObject = gd._fullLayout.scene._scene.glplot;
            var secondGlContext = secondGlplotObject.gl;
            var secondCanvas = secondGlContext.canvas;

            expect(secondGlplotObject).not.toBe(firstGlplotObject);
            expect(firstGlplotObject.gl === null);
            expect(secondGlContext instanceof WebGLRenderingContext);
            expect(secondGlContext).not.toBe(firstGlContext);

            // The same canvas can't possibly be reassinged a new WebGL context, but let's leave room
            // for the implementation to make the context get lost and have the old canvas stick around
            // in a disused state.
            expect(
                firstCanvas.parentNode === null ||
                firstCanvas !== secondCanvas && firstGlContext.isContextLost()
            );
        })
        .then(done);
    });

    it('Plotly.newPlot should remove gl context from the graph div of a gl2d plot', function(done) {
        var firstGlplotObject, firstGlContext, firstCanvas;

        Plotly.plot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 3]
        }])
        .then(function() {
            firstGlplotObject = gd._fullLayout._plots.xy._scene2d.glplot;
            firstGlContext = firstGlplotObject.gl;
            firstCanvas = firstGlContext.canvas;

            expect(firstGlplotObject).toBeDefined();
            expect(firstGlContext).toBeDefined();
            expect(firstGlContext instanceof WebGLRenderingContext);

            return Plotly.newPlot(gd, [{
                type: 'scattergl',
                x: [1, 2, 3],
                y: [2, 1, 3]
            }], {});
        })
        .then(function() {
            var secondGlplotObject = gd._fullLayout._plots.xy._scene2d.glplot;
            var secondGlContext = secondGlplotObject.gl;
            var secondCanvas = secondGlContext.canvas;

            expect(Object.keys(gd._fullLayout._plots).length === 1);
            expect(secondGlplotObject).not.toBe(firstGlplotObject);
            expect(firstGlplotObject.gl === null);
            expect(secondGlContext instanceof WebGLRenderingContext);
            expect(secondGlContext).not.toBe(firstGlContext);

            expect(
                firstCanvas.parentNode === null ||
                firstCanvas !== secondCanvas && firstGlContext.isContextLost()
            );
        })
        .then(done);
    });
});

describe('Test gl plot side effects', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should not draw the rangeslider', function(done) {
        var data = [{
            x: [1, 2, 3],
            y: [2, 3, 4],
            type: 'scattergl'
        }, {
            x: [1, 2, 3],
            y: [2, 3, 4],
            type: 'scatter'
        }];

        var layout = {
            xaxis: { rangeslider: { visible: true } }
        };

        Plotly.plot(gd, data, layout).then(function() {
            var rangeSlider = document.getElementsByClassName('range-slider')[0];
            expect(rangeSlider).not.toBeDefined();
        })
        .then(done);
    });

    it('should be able to replot from a blank graph', function(done) {

        function countCanvases(cnt) {
            var nodes = d3.selectAll('canvas');
            expect(nodes.size()).toEqual(cnt);
        }

        var data = [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 2]
        }];

        Plotly.plot(gd, []).then(function() {
            countCanvases(0);

            return Plotly.plot(gd, data);
        }).then(function() {
            countCanvases(1);

            return Plotly.purge(gd);
        }).then(function() {
            countCanvases(0);

            return Plotly.plot(gd, data);
        }).then(function() {
            countCanvases(1);

            return Plotly.deleteTraces(gd, [0]);
        }).then(function() {
            countCanvases(0);

            return Plotly.purge(gd);
        }).then(done);
    });
});

describe('Test gl2d interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('data-referenced annotations should update on drag', function(done) {
        function drag(start, end) {
            mouseEvent('mousemove', start[0], start[1]);
            mouseEvent('mousedown', start[0], start[1], { buttons: 1 });
            mouseEvent('mousemove', end[0], end[1], { buttons: 1 });
            mouseEvent('mouseup', end[0], end[1]);
        }

        function assertAnnotation(xy) {
            var ann = d3.select('g.annotation-text-g').select('g');
            var translate = Drawing.getTranslate(ann);

            expect(translate.x).toBeWithin(xy[0], 1.5);
            expect(translate.y).toBeWithin(xy[1], 1.5);
        }

        Plotly.plot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 2]
        }], {
            annotations: [{
                x: 2,
                y: 1,
                text: 'text'
            }],
            dragmode: 'pan'
        })
        .then(function() {
            assertAnnotation([327, 315]);

            drag([250, 200], [200, 150]);
            assertAnnotation([277, 265]);

            return Plotly.relayout(gd, {
                'xaxis.range': [1.5, 2.5],
                'yaxis.range': [1, 1.5]
            });
        })
        .then(function() {
            assertAnnotation([327, 331]);
        })
        .then(done);
    });
});

describe('Test gl3d annotations', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function assertAnnotationText(expectations, msg) {
        var anns = d3.selectAll('g.annotation-text-g');

        expect(anns.size()).toBe(expectations.length, msg);

        anns.each(function(_, i) {
            var tx = d3.select(this).select('text').text();
            expect(tx).toEqual(expectations[i], msg + ' - ann ' + i);
        });
    }

    function assertAnnotationsXY(expectations, msg) {
        var TOL = 2.5;
        var anns = d3.selectAll('g.annotation-text-g');

        expect(anns.size()).toBe(expectations.length, msg);

        anns.each(function(_, i) {
            var ann = d3.select(this).select('g');
            var translate = Drawing.getTranslate(ann);

            expect(translate.x).toBeWithin(expectations[i][0], TOL, msg + ' - ann ' + i + ' x');
            expect(translate.y).toBeWithin(expectations[i][1], TOL, msg + ' - ann ' + i + ' y');
        });
    }

    // more robust (especially on CI) than update camera via mouse events
    function updateCamera(x, y, z) {
        var scene = gd._fullLayout.scene._scene;
        var camera = scene.getCamera();

        camera.eye = {x: x, y: y, z: z};
        scene.setCamera(camera);
        // need a fairly long delay to let the camera update here
        // 200 was not robust for me (AJ), 300 seems to be.
        return delay(300)();
    }

    it('should move with camera', function(done) {
        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                camera: {eye: {x: 2.1, y: 0.1, z: 0.9}},
                annotations: [{
                    text: 'hello',
                    x: 1, y: 1, z: 1
                }, {
                    text: 'sup?',
                    x: 1, y: 1, z: 2
                }, {
                    text: 'look!',
                    x: 2, y: 2, z: 1
                }]
            }
        })
        .then(function() {
            assertAnnotationsXY([[262, 199], [257, 135], [325, 233]], 'base 0');

            return updateCamera(1.5, 2.5, 1.5);
        })
        .then(function() {
            assertAnnotationsXY([[340, 187], [341, 142], [325, 221]], 'after camera update');

            return updateCamera(2.1, 0.1, 0.9);
        })
        .then(function() {
            assertAnnotationsXY([[262, 199], [257, 135], [325, 233]], 'base 0');
        })
        .catch(fail)
        .then(done);
    });

    it('should be removed when beyond the scene axis ranges', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/gl3d_annotations'));

        // replace text with something easier to identify
        mock.layout.scene.annotations.forEach(function(ann, i) { ann.text = String(i); });

        Plotly.plot(gd, mock).then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'base');

            return Plotly.relayout(gd, 'scene.yaxis.range', [0.5, 1.5]);
        })
        .then(function() {
            assertAnnotationText(['1', '4', '5', '6'], 'after yaxis range relayout');

            return Plotly.relayout(gd, 'scene.yaxis.range', null);
        })
        .then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'back to base after yaxis range relayout');

            return Plotly.relayout(gd, 'scene.zaxis.range', [0, 3]);
        })
        .then(function() {
            assertAnnotationText(['0', '4', '5', '6'], 'after zaxis range relayout');

            return Plotly.relayout(gd, 'scene.zaxis.range', null);
        })
        .then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'back to base after zaxis range relayout');
        })
        .catch(fail)
        .then(done);
    });

    it('should be able to add/remove and hide/unhide themselves via relayout', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/gl3d_annotations'));

        // replace text with something easier to identify
        mock.layout.scene.annotations.forEach(function(ann, i) { ann.text = String(i); });

        var annNew = {
            x: '2017-03-01',
            y: 'C',
            z: 3,
            text: 'new!'
        };

        Plotly.plot(gd, mock).then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'base');

            return Plotly.relayout(gd, 'scene.annotations[1].visible', false);
        })
        .then(function() {
            assertAnnotationText(['0', '2', '3', '4', '5', '6'], 'after [1].visible:false');

            return Plotly.relayout(gd, 'scene.annotations[1].visible', true);
        })
        .then(function() {
            assertAnnotationText(['0', '1', '2', '3', '4', '5', '6'], 'back to base (1)');

            return Plotly.relayout(gd, 'scene.annotations[0]', null);
        })
        .then(function() {
            assertAnnotationText(['1', '2', '3', '4', '5', '6'], 'after [0] null');

            return Plotly.relayout(gd, 'scene.annotations[0]', annNew);
        })
        .then(function() {
            assertAnnotationText(['new!', '1', '2', '3', '4', '5', '6'], 'after add new (1)');

            return Plotly.relayout(gd, 'scene.annotations', null);
        })
        .then(function() {
            assertAnnotationText([], 'after rm all');

            return Plotly.relayout(gd, 'scene.annotations[0]', annNew);
        })
        .then(function() {
            assertAnnotationText(['new!'], 'after add new (2)');
        })
        .catch(fail)
        .then(done);
    });

    it('should work across multiple scenes', function(done) {
        function assertAnnotationCntPerScene(id, cnt) {
            expect(d3.selectAll('g.annotation-' + id).size()).toEqual(cnt);
        }

        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }, {
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [2, 1, 2],
            scene: 'scene2'
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 1, y: 1, z: 1
                }]
            },
            scene2: {
                annotations: [{
                    text: 'sup?',
                    x: 1, y: 1, z: 2
                }, {
                    text: 'look!',
                    x: 2, y: 2, z: 1
                }]
            }
        })
        .then(function() {
            assertAnnotationCntPerScene('scene', 1);
            assertAnnotationCntPerScene('scene2', 2);

            return Plotly.deleteTraces(gd, [1]);
        })
        .then(function() {
            assertAnnotationCntPerScene('scene', 1);
            assertAnnotationCntPerScene('scene2', 0);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            assertAnnotationCntPerScene('scene', 0);
            assertAnnotationCntPerScene('scene2', 0);
        })
        .catch(fail)
        .then(done);
    });

    it('should contribute to scene axis autorange', function(done) {
        function assertSceneAxisRanges(xRange, yRange, zRange) {
            var sceneLayout = gd._fullLayout.scene;

            expect(sceneLayout.xaxis.range).toBeCloseToArray(xRange, 1, 'xaxis range');
            expect(sceneLayout.yaxis.range).toBeCloseToArray(yRange, 1, 'yaxis range');
            expect(sceneLayout.zaxis.range).toBeCloseToArray(zRange, 1, 'zaxis range');
        }

        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 1, y: 1, z: 3
                }]
            }
        })
        .then(function() {
            assertSceneAxisRanges([0.9375, 3.0625], [0.9375, 3.0625], [0.9375, 3.0625]);

            return Plotly.relayout(gd, 'scene.annotations[0].z', 10);
        })
        .then(function() {
            assertSceneAxisRanges([0.9375, 3.0625], [0.9375, 3.0625], [0.7187, 10.2813]);
        })
        .catch(fail)
        .then(done);
    });

    it('should allow text and tail position edits under `editable: true`', function(done) {
        function editText(newText, expectation) {
            return new Promise(function(resolve) {
                gd.once('plotly_relayout', function(eventData) {
                    expect(eventData).toEqual(expectation);
                    setTimeout(resolve, 0);
                });

                var clickNode = d3.select('g.annotation-text-g').select('g').node();
                clickNode.dispatchEvent(new window.MouseEvent('click'));

                var editNode = d3.select('.plugin-editable.editable').node();
                editNode.dispatchEvent(new window.FocusEvent('focus'));

                editNode.textContent = newText;
                editNode.dispatchEvent(new window.FocusEvent('focus'));
                editNode.dispatchEvent(new window.FocusEvent('blur'));
            });
        }

        function moveArrowTail(dx, dy, expectation) {
            var px = 243;
            var py = 150;

            return new Promise(function(resolve) {
                gd.once('plotly_relayout', function(eventData) {
                    expect(eventData).toEqual(expectation);
                    resolve();
                });

                mouseEvent('mousemove', px, py);
                mouseEvent('mousedown', px, py);
                mouseEvent('mousemove', px + dx, py + dy);
                mouseEvent('mouseup', px + dx, py + dy);
            });
        }

        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 2, y: 2, z: 2,
                    font: { size: 30 }
                }]
            },
            margin: {l: 0, t: 0, r: 0, b: 0},
            width: 500,
            height: 500
        }, {
            editable: true
        })
        .then(function() {
            return editText('allo', {'scene.annotations[0].text': 'allo'});
        })
        .then(function() {
            return moveArrowTail(-100, -50, {
                'scene.annotations[0].ax': -110,
                'scene.annotations[0].ay': -80
            });
        })
        .catch(fail)
        .then(done);
    });

    it('should display hover labels and trigger *plotly_clickannotation* event', function(done) {
        function dispatch(eventType) {
            var target = d3.select('g.annotation-text-g').select('g').node();
            target.dispatchEvent(new MouseEvent(eventType));
        }

        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1]
        }], {
            scene: {
                annotations: [{
                    text: 'hello',
                    x: 2, y: 2, z: 2,
                    ax: 0, ay: -100,
                    hovertext: 'HELLO',
                    hoverlabel: {
                        bgcolor: 'red',
                        font: { size: 20 }
                    }
                }]
            },
            width: 500,
            height: 500
        })
        .then(function() {
            dispatch('mouseover');
            expect(d3.select('.hovertext').size()).toEqual(1);
        })
        .then(function() {
            return new Promise(function(resolve, reject) {
                gd.once('plotly_clickannotation', function(eventData) {
                    expect(eventData.index).toEqual(0);
                    expect(eventData.subplotId).toEqual('scene');
                    resolve();
                });

                setTimeout(function() {
                    reject('plotly_clickannotation did not get called!');
                }, 100);

                dispatch('click');
            });
        })
        .catch(fail)
        .then(done);
    });
});
