var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

var scatterFill = require('@mocks/scatter_fill_self_next.json');


describe('makeTemplate', function() {
    it('does not template non-style keys', function() {
        var template = Plotly.makeTemplate(scatterFill);
        expect(template).toEqual({
            data: [{fill: 'tonext'}, {fill: 'tonext'}, {fill: 'toself'}]
        });
    });
    it('does not template empty layout', function() {
        var template = Plotly.makeTemplate(scatterFill);
        expect(template.layout).toBe(undefined);
    });
    it('templates scalar array_ok keys but not when they are arrays', function() {
        var figure = {data: [{marker: {color: 'red'}}]};
        var template = Plotly.makeTemplate(figure);
        expect(template.data[0].marker.color).toBe('red');

    });
});

describe('applyTemplate', function() {
    it('forces default values for keys not present in template', function() {
        var template = {
            data: [{fill: 'tonext'}, {fill: 'tonext'}, {fill: 'toself'}]
        };
        var figure = Lib.extendDeepAll({}, scatterFill);
        var results = Plotly.applyTemplate(figure, template);
        var templatedFigure = results.templatedFigure;

        expect(templatedFigure).toEqual(figure);
    });
});
