var Plotly = require('@lib/index');
var Lib = require('@src/lib');

describe('plot schema', function() {
    'use strict';

    var plotSchema = Plotly.PlotSchema.get(),
        valObjects = plotSchema.defs.valObjects;

    var isValObject = Plotly.PlotSchema.isValObject,
        isPlainObject = Lib.isPlainObject;

    var VALTYPES = Object.keys(valObjects),
        ROLES = ['info', 'style', 'data'];

    function assertPlotSchema(callback) {
        var traces = plotSchema.traces;

        Object.keys(traces).forEach(function(traceName) {
            Plotly.PlotSchema.crawl(traces[traceName].attributes, callback);
        });

        Plotly.PlotSchema.crawl(plotSchema.layout.layoutAttributes, callback);
    }

    it('all attributes should have a valid `valType`', function() {
        assertPlotSchema(
            function(attr) {
                if(isValObject(attr)) {
                    expect(VALTYPES.indexOf(attr.valType) !== -1).toBe(true);
                }
            }
        );

    });

    it('all attributes should only have valid `role`', function() {
        assertPlotSchema(
            function(attr) {
                if(isValObject(attr)) {
                    expect(ROLES.indexOf(attr.role) !== -1).toBe(true);
                }
            }
        );
    });

    it('all nested objects should have the *object* `role`', function() {
        assertPlotSchema(
            function(attr, attrName) {
                if(!isValObject(attr) && isPlainObject(attr) && attrName!=='items') {
                    expect(attr.role === 'object').toBe(true);
                }
            }
        );
    });

    it('all attributes should have the required options', function() {
        assertPlotSchema(
            function(attr) {
                if(isValObject(attr)) {
                    var keys = Object.keys(attr);

                    valObjects[attr.valType].requiredOpts.forEach(function(opt) {
                        expect(keys.indexOf(opt) !== -1).toBe(true);
                    });
                }
            }
        );
    });

    it('all attributes should only have compatible options', function() {
        assertPlotSchema(
            function(attr) {
                if(isValObject(attr)) {
                    var valObject = valObjects[attr.valType],
                        opts = valObject.requiredOpts
                            .concat(valObject.otherOpts)
                            .concat(['valType', 'description', 'role']);

                    Object.keys(attr).forEach(function(key) {
                        // handle the histogram marker.color case
                        if(opts.indexOf(key)===-1 && opts[key]===undefined) return;

                        expect(opts.indexOf(key) !== -1).toBe(true);
                    });
                }
            }
        );
    });

    it('all subplot objects should contain _isSubplotObj', function() {
        var IS_SUBPLOT_OBJ = '_isSubplotObj',
            astrs = ['xaxis', 'yaxis', 'scene', 'geo'],
            list = [];

        // check if the subplot objects have '_isSubplotObj'
        astrs.forEach(function(astr) {
            expect(
                Lib.nestedProperty(
                    plotSchema.layout.layoutAttributes,
                    astr + '.' + IS_SUBPLOT_OBJ
                ).get()
            ).toBe(true);
        });

        // check that no other object has '_isSubplotObj'
        assertPlotSchema(
            function(attr, attrName) {
                if(attr[IS_SUBPLOT_OBJ] === true) list.push(attrName);
            }
        );
        expect(list).toEqual(astrs);
    });

    it('layout.annotations and layout.shapes should contain `items`', function() {
        var astrs = ['annotations', 'shapes'];

        astrs.forEach(function(astr) {
            expect(
                isPlainObject(
                    Lib.nestedProperty(
                        plotSchema.layout.layoutAttributes, astr
                    ).get().items
                )
            ).toBe(true);
        });
    });

    it('valObjects descriptions should be strings', function() {
        assertPlotSchema(
            function(attr) {
                var isValid;

                if(isValObject(attr)) {
                    // attribute don't have to have a description (for now)
                    isValid = (typeof attr.description === 'string') ||
                        (attr.description === undefined);

                    expect(isValid).toBe(true);
                }
            }
        );
    });

    it('deprecated attributes should have a `valType` and `role`', function() {
        var DEPRECATED = '_deprecated';

        assertPlotSchema(
            function(attr) {
                if(isPlainObject(attr[DEPRECATED])) {
                    Object.keys(attr[DEPRECATED]).forEach(function(dAttrName) {
                        var dAttr = attr[DEPRECATED][dAttrName];

                        expect(VALTYPES.indexOf(dAttr.valType) !== -1).toBe(true);
                        expect(ROLES.indexOf(dAttr.role) !== -1).toBe(true);
                    });
                }
            }
        );
    });
});
