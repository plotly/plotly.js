var Plotly = require('@lib/index');
var Lib = require('@src/lib');

Plotly.register([
    require('@src/transforms/filter'),
    require('@src/transforms/groupby')
]);

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
                if(!isValObject(attr) && isPlainObject(attr) && attrName !== 'items') {
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
                        expect(opts.indexOf(key) !== -1).toBe(true, key, attr);
                    });
                }
            }
        );
    });

    it('all subplot objects should contain _isSubplotObj', function() {
        var IS_SUBPLOT_OBJ = '_isSubplotObj',
            astrs = ['xaxis', 'yaxis', 'scene', 'geo', 'ternary', 'mapbox'],
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

    it('should convert _isLinkedToArray attributes to items object', function() {
        var astrs = [
            'annotations', 'shapes', 'images',
            'xaxis.rangeselector.buttons', 'yaxis.rangeselector.buttons',
            'mapbox.layers'
        ];

        astrs.forEach(function(astr) {
            var np = Lib.nestedProperty(
                plotSchema.layout.layoutAttributes, astr
            );

            var name = np.parts[np.parts.length - 1],
                itemName = name.substr(0, name.length - 1);

            var itemsObj = np.get().items,
                itemObj = itemsObj[itemName];

            // N.B. the specs below must be satisfied for plotly.py
            expect(isPlainObject(itemsObj)).toBe(true);
            expect(itemsObj.role).toBeUndefined();
            expect(Object.keys(itemsObj).length).toEqual(1);
            expect(isPlainObject(itemObj)).toBe(true);
            expect(itemObj.role).toBe('object');

            var role = np.get().role;
            expect(role).toEqual('object');
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

    it('should work with registered transforms', function() {
        var valObjects = plotSchema.transforms.filter.attributes,
            attrNames = Object.keys(valObjects);

        expect(attrNames).toEqual(['operation', 'value', 'filtersrc']);
    });
});
