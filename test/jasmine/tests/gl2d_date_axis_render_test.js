var Plotly = require('@lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('date axis', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should use the fancy gl-vis/gl-scatter2d', function() {
        Plotly.plot(gd, [{
            type: 'scattergl',
            'marker': {
                'color': 'rgb(31, 119, 180)',
                'size': 18,
                'symbol': [
                    'diamond',
                    'cross'
                ]
            },
            x: [new Date('2016-10-10'), new Date('2016-10-12')],
            y: [15, 16]
        }]);

        expect(gd._fullLayout.xaxis.type).toBe('date');
        expect(gd._fullLayout.yaxis.type).toBe('linear');
        expect(gd._fullData[0].type).toBe('scattergl');
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('cartesian');

        // one way of check which renderer - fancy vs not - we're
        var scene = gd._fullLayout._plots.xy._scene;
        expect(scene.scatter2d).toBeDefined();
        expect(scene.markerOptions[0].positions.length).toEqual(4);
        expect(scene.line2d).not.toBeUndefined();
    });

    it('should use the fancy gl-vis/gl-scatter2d once again', function() {
        Plotly.plot(gd, [{
            type: 'scattergl',
            'marker': {
                'color': 'rgb(31, 119, 180)',
                'size': 36,
                'symbol': [
                    'circle',
                    'cross'
                ]
            },
            x: [new Date('2016-10-10'), new Date('2016-10-11')],
            y: [15, 16]
        }]);

        expect(gd._fullLayout.xaxis.type).toBe('date');
        expect(gd._fullLayout.yaxis.type).toBe('linear');
        expect(gd._fullData[0].type).toBe('scattergl');
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('cartesian');

        var scene = gd._fullLayout._plots.xy._scene;
        expect(scene.scatter2d).toBeDefined();
        expect(scene.markerOptions[0].positions.length).toEqual(4);
        expect(scene.line2d).toBeDefined();
    });

    it('should now use the non-fancy gl-vis/gl-scatter2d', function() {
        Plotly.plot(gd, [{
            type: 'scattergl',
            mode: 'markers',
            x: [new Date('2016-10-10'), new Date('2016-10-11')],
            y: [15, 16]
        }]);

        expect(gd._fullLayout.xaxis.type).toBe('date');
        expect(gd._fullLayout.yaxis.type).toBe('linear');
        expect(gd._fullData[0].type).toBe('scattergl');
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('cartesian');

        var scene = gd._fullLayout._plots.xy._scene;
        expect(scene.scatter2d).toBeDefined();
        expect(scene.markerOptions[0].positions.length).toEqual(4);
        expect(scene.line2d).toBeDefined();
    });

    it('should use the non-fancy gl-vis/gl-scatter2d with string dates', function() {
        Plotly.plot(gd, [{
            type: 'scattergl',
            mode: 'markers',
            x: ['2016-10-10', '2016-10-11'],
            y: [15, 16]
        }]);

        expect(gd._fullLayout.xaxis.type).toBe('date');
        expect(gd._fullLayout.yaxis.type).toBe('linear');
        expect(gd._fullData[0].type).toBe('scattergl');
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('cartesian');

        var scene = gd._fullLayout._plots.xy._scene;
        expect(scene.scatter2d).toBeDefined();
        expect(scene.markerOptions[0].positions.length).toEqual(4);
        expect(scene.line2d).toBeDefined();
    });
});
