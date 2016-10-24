var PlotlyInternal = require('@src/plotly');

var hasWebGLSupport = require('../assets/has_webgl_support');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('date axis', function() {

    if(!hasWebGLSupport('axes_test date axis')) return;

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should use the fancy gl-vis/gl-scatter2d', function() {
        PlotlyInternal.plot(gd, [{
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
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('gl2d');

        // one way of check which renderer - fancy vs not - we're using
        expect(gd._fullLayout._plots.xy._scene2d.glplot.objects[3].pointCount).toBe(0);
    });

    it('should use the fancy gl-vis/gl-scatter2d once again', function() {
        PlotlyInternal.plot(gd, [{
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
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('gl2d');

        // one way of check which renderer - fancy vs not - we're using
        expect(gd._fullLayout._plots.xy._scene2d.glplot.objects[3].pointCount).toBe(0);
    });

    it('should now use the non-fancy gl-vis/gl-scatter2d', function() {
        PlotlyInternal.plot(gd, [{
            type: 'scattergl',
            mode: 'markers', // important, as otherwise lines are assumed (which needs fancy)
            x: [new Date('2016-10-10'), new Date('2016-10-11')],
            y: [15, 16]
        }]);

        expect(gd._fullLayout.xaxis.type).toBe('date');
        expect(gd._fullLayout.yaxis.type).toBe('linear');
        expect(gd._fullData[0].type).toBe('scattergl');
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('gl2d');

        expect(gd._fullLayout._plots.xy._scene2d.glplot.objects[3].pointCount).toBe(2);
    });

    it('should use the non-fancy gl-vis/gl-scatter2d with string dates', function() {
        PlotlyInternal.plot(gd, [{
            type: 'scattergl',
            mode: 'markers', // important, as otherwise lines are assumed (which needs fancy)
            x: ['2016-10-10', '2016-10-11'],
            y: [15, 16]
        }]);

        expect(gd._fullLayout.xaxis.type).toBe('date');
        expect(gd._fullLayout.yaxis.type).toBe('linear');
        expect(gd._fullData[0].type).toBe('scattergl');
        expect(gd._fullData[0]._module.basePlotModule.name).toBe('gl2d');

        expect(gd._fullLayout._plots.xy._scene2d.glplot.objects[3].pointCount).toBe(2);
    });
});
