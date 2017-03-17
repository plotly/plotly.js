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
var customMatchers = require('../assets/custom_matchers');

// useful to put callback in the event queue
function delay() {
    return new Promise(function(resolve) {
        setTimeout(resolve, 20);
    });
}

function waitForModeBar() {
    return new Promise(function(resolve) {
        setTimeout(resolve, 200);
    });
}

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

    function mouseEventScatter3d(type, opts) {
        mouseEvent(type, 605, 271, opts);
    }

    function assertHoverText(xLabel, yLabel, zLabel) {
        var node = d3.selectAll('g.hovertext');
        expect(node.size()).toEqual(1, 'hover text group');

        var tspan = d3.selectAll('g.hovertext').selectAll('tspan')[0];
        expect(tspan[0].innerHTML).toEqual(xLabel, 'x val');
        expect(tspan[1].innerHTML).toEqual(yLabel, 'y val');
        expect(tspan[2].innerHTML).toEqual(zLabel, 'z val');
    }

    function assertEventData(x, y, z, curveNumber, pointNumber) {
        expect(Object.keys(ptData)).toEqual([
            'x', 'y', 'z',
            'data', 'fullData', 'curveNumber', 'pointNumber'
        ], 'correct hover data fields');

        expect(ptData.x).toEqual(x, 'x val');
        expect(ptData.y).toEqual(y, 'y val');
        expect(ptData.z).toEqual(z, 'z val');
        expect(ptData.curveNumber).toEqual(curveNumber, 'curveNumber');
        expect(ptData.pointNumber).toEqual(pointNumber, 'pointNumber');
    }

    beforeEach(function() {
        gd = createGraphDiv();
        ptData = {};
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@noCI should display correct hover labels and emit correct event data', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        function _hover() {
            mouseEventScatter3d('mouseover');
            return delay();
        }

        Plotly.plot(gd, _mock)
        .then(delay)
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(_hover)
        .then(delay)
        .then(function() {
            assertHoverText('x: 140.72', 'y: −96.97', 'z: −96.97');
            assertEventData('140.72', '−96.97', '−96.97', 0, 2);

            return Plotly.restyle(gd, {
                x: [['2016-01-11', '2016-01-12', '2017-01-01', '2017-02']]
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
        })
        .then(done);

    });

    it('@noCI should emit correct event data on click', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        // N.B. gl3d click events are 'mouseover' events
        // with button 1 pressed
        function _click() {
            mouseEventScatter3d('mouseover', {buttons: 1});
            return delay();
        }

        Plotly.plot(gd, _mock)
        .then(delay)
        .then(function() {
            gd.on('plotly_click', function(eventData) {
                ptData = eventData.points[0];
            });
        })
        .then(_click)
        .then(delay)
        .then(function() {
            assertEventData('140.72', '−96.97', '−96.97', 0, 2);
        })
        .then(done);
    });

    it('should be able to reversibly change trace type', function(done) {
        var _mock = Lib.extendDeep({}, mock2);
        var sceneLayout = { aspectratio: { x: 1, y: 1, z: 1 } };

        Plotly.plot(gd, _mock)
        .then(delay)
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
        .then(delay)
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
        .then(delay)
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

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

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
        .then(delay)
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
        .then(delay)
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

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should respond to drag interactions', function(done) {
        var _mock = Lib.extendDeep({}, mock);
        var relayoutCallback = jasmine.createSpy('relayoutCallback');

        var originalX = [-0.022068095838587643, 5.022068095838588];
        var originalY = [-0.21331533513634046, 5.851205650049042];
        var newX = [-0.23224043715846995, 4.811895754518705];
        var newY = [-1.2962655110623016, 4.768255474123081];
        var precision = 5;

        function mouseTo(p0, p1) {
            mouseEvent('mousemove', p0[0], p0[1]);
            mouseEvent('mousedown', p0[0], p0[1], { buttons: 1 });
            mouseEvent('mousemove', p1[0], p1[1], { buttons: 1 });
            mouseEvent('mouseup', p1[0], p1[1]);
        }

        Plotly.plot(gd, _mock)
        .then(delay)
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
        .then(waitForModeBar)
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
        .then(waitForModeBar)
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
        .then(delay)
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
            expect(d3.select('.subplot.xy').size()).toEqual(0);
            expect(d3.select('.xtitle').size()).toEqual(0);
            expect(d3.select('.ytitle').size()).toEqual(0);
        })
        .then(done);

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

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

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
            assertAnnotation([327, 325]);

            drag([250, 200], [200, 150]);
            assertAnnotation([277, 275]);

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
