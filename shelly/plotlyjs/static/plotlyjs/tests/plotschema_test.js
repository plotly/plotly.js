var Plotly = require('../src/plotly');

describe('plot schema', function() {
    'use strict';

    var plotSchema = Plotly.PlotSchema.get(),
        valObjects = plotSchema.defs.valObjects;

    function assertPlotSchema(check) {
        var traces = plotSchema.traces;

        Object.keys(traces).forEach(function(traceName) {
            Plotly.PlotSchema.crawl(traces[traceName].attributes, check);
        });

        Plotly.PlotSchema.crawl(plotSchema.layout.layoutAttributes, check);
    }

    it('all attributes should have a valid `valType`', function() {
        var valTypes = Object.keys(valObjects);

        assertPlotSchema(function(attr) {
            expect(valTypes.indexOf(attr.valType) !== -1).toBe(true);
        });

    });

    it('all attributes should have the required options', function() {
        assertPlotSchema(function(attr) {
            var keys = Object.keys(attr);

            valObjects[attr.valType].requiredOpts.forEach(function(opt) {
                expect(keys.indexOf(opt) !== -1).toBe(true);
            });
        });
    });

    it('all attributes should only have compatible options', function() {
        assertPlotSchema(function(attr) {
            var valObject = valObjects[attr.valType],
                opts = valObject.requiredOpts
                    .concat(valObject.otherOpts)
                    .concat(['valType', 'description', 'role']);

            Object.keys(attr).forEach(function(key) {
                expect(opts.indexOf(key) !== -1).toBe(true);
            });
        });
    });
});
