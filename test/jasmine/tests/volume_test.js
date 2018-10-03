var Plotly = require('@lib');
var Lib = require('@src/lib');

var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test volume defaults', function() {
    var gd;

    function makeGD() {
        return {
            data: [{
                type: 'volume',
                x: [1, 2],
                y: [1, 2],
                z: [1, 2],
                values: [1, 2, 1, 2, 1, 2, 1, 2],
            }],
            layout: {}
        };
    }

    it('should not set `visible: false` for traces with x,y,z,values arrays', function() {
        gd = makeGD();
        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(true);
    });

    it('should set `visible: false` for traces missing x,y,z,values arrays', function() {
        var keysToDelete = ['x', 'y', 'z', 'values'];

        keysToDelete.forEach(function(k) {
            gd = makeGD();
            delete gd.data[0][k];

            supplyAllDefaults(gd);
            expect(gd._fullData[0].visible).toBe(!k, 'missing array ' + k);
        });
    });

    it('should set `visible: false` for traces empty x,y,z,values arrays', function() {
        var keysToEmpty = ['x', 'y', 'z', 'values'];

        keysToEmpty.forEach(function(k) {
            gd = makeGD();
            gd.data[0][k] = [];

            supplyAllDefaults(gd);
            expect(gd._fullData[0].visible).toBe(!k, 'empty array ' + k);
        });
    });
});

describe('Test volume autorange:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function _assertAxisRanges(msg, xrng, yrng, zrng) {
        var sceneLayout = gd._fullLayout.scene;
        expect(sceneLayout.xaxis.range).toBeCloseToArray(xrng, 2, 'xaxis range - ' + msg);
        expect(sceneLayout.yaxis.range).toBeCloseToArray(yrng, 2, 'yaxis range - ' + msg);
        expect(sceneLayout.zaxis.range).toBeCloseToArray(zrng, 2, 'zaxis range - ' + msg);
    }


});

describe('Test volume interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should add/clear gl objects correctly', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_volume-simple.json'));
        // put traces on same subplot
        delete fig.data[1].scene;

        Plotly.plot(gd, fig).then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(2);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(1);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout.scene;

            expect(scene).toBeUndefined();
        })
        .catch(failTest)
        .then(done);
    });


});
