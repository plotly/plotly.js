var Plotly = require('../src/plotly');

describe('plot schema', function() {
    'use strict';

    var plotSchema = Plotly.PlotSchema.get(),
        valObjects = plotSchema.defs.valObjects;

    function assertPlotSchema(checkOnValObject, checkOnPlainObject) {
        var traces = plotSchema.traces;

        Object.keys(traces).forEach(function(traceName) {
            Plotly.PlotSchema.crawl(traces[traceName].attributes,
                checkOnValObject, checkOnPlainObject);
        });

        Plotly.PlotSchema.crawl(plotSchema.layout.layoutAttributes,
                checkOnValObject, checkOnPlainObject);
    }

    it('all attributes should have a valid `valType`', function() {
        var valTypes = Object.keys(valObjects);

        assertPlotSchema(function(attr) {
            expect(valTypes.indexOf(attr.valType) !== -1).toBe(true);
        });

    });

    it('all attributes should only have valid `role`', function() {
        var roles = ['info', 'style', 'data', 'object'];

        assertPlotSchema(
            function(attr) {
                expect(roles.indexOf(attr.role) !== -1).toBe(true);
            },
            function(attr) {
                expect(roles.indexOf(attr.role) === 'object').toBe(true);
            }
        );
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
