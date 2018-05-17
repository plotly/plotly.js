var Plotly = require('@lib');
var Lib = require('@src/lib');

var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('Test cone defaults', function() {
    var gd;

    function makeGD() {
        return {
            data: [{
                type: 'cone',
                x: [1, 2],
                y: [1, 2],
                z: [1, 2],
                u: [1, 2],
                v: [1, 2],
                w: [1, 2]
            }],
            layout: {}
        };
    }

    it('should set `visible: false` for traces missing x,y,z,u,v,w arrays', function() {
        var keysToDelete = ['x', 'y', 'z', 'u', 'v', 'w', ''];

        keysToDelete.forEach(function(k) {
            gd = makeGD();
            delete gd.data[0][k];

            supplyAllDefaults(gd);
            expect(gd._fullData[0].visible).toBe(!k, 'missing array ' + k);
        });
    });

    it('should set `visible: false` for traces empty x,y,z,u,v,w arrays', function() {
        var keysToEmpty = ['x', 'y', 'z', 'u', 'v', 'w'];

        keysToEmpty.forEach(function(k) {
            gd = makeGD();
            gd.data[0][k] = [];

            supplyAllDefaults(gd);
            expect(gd._fullData[0].visible).toBe(!k, 'empty array ' + k);
        });
    });
});

describe('@gl Test cone interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should add/clear gl objects correctly', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl3d_cone-simple.json'));
        // put traces on same subplot
        delete fig.data[1].scene;

        Plotly.plot(gd, fig).then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(4);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout.scene._scene;
            var objs = scene.glplot.objects;

            expect(objs.length).toBe(2);

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
