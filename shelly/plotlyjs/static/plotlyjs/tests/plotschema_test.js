var Plotly = require('../src/plotly');

describe('plot schema', function() {
    'use strict';

    var plotSchema = Plotly.getPlotSchema(),
        valObjects = plotSchema.defs.valObjects;

    function isPlainObject(o) {
        return Object.prototype.toString.call(o) === '[object Object]';
    }

    function isValObject(o) {
        return Object.keys(o).indexOf('valType') !== -1;
    }

    function assertPlotSchema(check) {
        var traces = plotSchema.traces;
        Object.keys(traces).forEach(function(traceName) {
            crawl(traces[traceName].attributes, check);
        });

        crawl(plotSchema.layout.layoutAttributes, check);
    }

    function crawl(attrs, check) {
        Object.keys(attrs).forEach(function(attrName) {
            var attr = attrs[attrName];

            if(isValObject(attr)) check(attr);
            else if(isPlainObject(attr)) crawl(attr, check);
        });
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
