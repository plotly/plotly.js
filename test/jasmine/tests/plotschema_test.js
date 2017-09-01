var Plotly = require('@lib/index');

var Lib = require('@src/lib');

var baseAttrs = require('@src/plots/attributes');
var scatter = require('@src/traces/scatter');
var parcoords = require('@src/traces/parcoords');
var surface = require('@src/traces/surface');

var baseLayoutAttrs = require('@src/plots/layout_attributes');
var cartesianAttrs = require('@src/plots/cartesian').layoutAttributes;
var gl3dAttrs = require('@src/plots/gl3d').layoutAttributes;
var polarLayoutAttrs = require('@src/plots/polar/axis_attributes');
var annotationAttrs = require('@src/components/annotations').layoutAttributes;
var updatemenuAttrs = require('@src/components/updatemenus').layoutAttributes;

describe('plot schema', function() {
    'use strict';

    var plotSchema = Plotly.PlotSchema.get(),
        valObjects = plotSchema.defs.valObjects;

    var isValObject = Plotly.PlotSchema.isValObject,
        isPlainObject = Lib.isPlainObject;

    var VALTYPES = Object.keys(valObjects);
    var ROLES = ['info', 'style', 'data'];
    var editTypes = plotSchema.defs.editTypes;

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
                    expect(ROLES.indexOf(attr.role) !== -1).toBe(true, attr);
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
                            .concat(['valType', 'description', 'role', 'editType']);

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
            cnt = 0;

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
                if(attr[IS_SUBPLOT_OBJ] === true) {
                    expect(astrs.indexOf(attrName)).not.toEqual(-1);
                    cnt++;
                }
            }
        );

        expect(cnt).toEqual(astrs.length);
    });

    it('should convert _isLinkedToArray attributes to items object', function() {
        var astrs = [
            'annotations', 'shapes', 'images',
            'xaxis.rangeselector.buttons',
            'updatemenus',
            'sliders',
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

    it('includes xaxis-only items on only the x axis, not y or bare', function() {
        var items = ['rangeselector', 'rangeslider'];

        var layoutAttrs = plotSchema.layout.layoutAttributes;

        items.forEach(function(item) {
            expect(layoutAttrs.xaxis[item]).toBeDefined(item);
            expect(layoutAttrs.yaxis[item]).toBeUndefined(item);
            expect(layoutAttrs[item]).toBeUndefined(item);
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

    it('has valid or no `editType` in every attribute', function() {
        var validEditTypes = editTypes.traces;
        assertPlotSchema(
            function(attr, attrName, attrs) {
                if(attrs === plotSchema.layout.layoutAttributes) {
                    // detect when we switch from trace attributes to layout
                    // attributes - depends on doing all the trace attributes
                    // first, then switching to layout attributes
                    validEditTypes = editTypes.layout;
                }
                if(attr.editType !== undefined) {
                    var editTypeParts = attr.editType.split('+');
                    editTypeParts.forEach(function(editTypePart) {
                        expect(validEditTypes[editTypePart])
                            .toBe(false, editTypePart);
                    });
                }
            }
        );
    });

    it('should work with registered transforms', function() {
        var valObjects = plotSchema.transforms.filter.attributes,
            attrNames = Object.keys(valObjects);

        ['operation', 'value', 'target'].forEach(function(k) {
            expect(attrNames).toContain(k);
        });
    });

    it('should work with registered transforms (2)', function() {
        var valObjects = plotSchema.transforms.groupby.attributes;
        var items = valObjects.styles.items || {};

        expect(Object.keys(items)).toEqual(['style']);
    });

    it('should work with registered components', function() {
        expect(plotSchema.traces.scatter.attributes.xcalendar.valType).toEqual('enumerated');
        expect(plotSchema.traces.scatter3d.attributes.zcalendar.valType).toEqual('enumerated');

        expect(plotSchema.layout.layoutAttributes.calendar.valType).toEqual('enumerated');
        expect(plotSchema.layout.layoutAttributes.xaxis.calendar.valType).toEqual('enumerated');
        expect(plotSchema.layout.layoutAttributes.scene.xaxis.calendar.valType).toEqual('enumerated');

        expect(plotSchema.transforms.filter.attributes.valuecalendar.valType).toEqual('enumerated');
        expect(plotSchema.transforms.filter.attributes.targetcalendar.valType).toEqual('enumerated');
    });

    it('should list correct defs', function() {
        expect(plotSchema.defs.valObjects).toBeDefined();

        expect(plotSchema.defs.metaKeys)
            .toEqual([
                '_isSubplotObj', '_isLinkedToArray', '_arrayAttrRegexps',
                '_deprecated', 'description', 'role'
            ]);
    });

    it('should list the correct frame attributes', function() {
        expect(plotSchema.frames).toBeDefined();
        expect(plotSchema.frames.role).toEqual('object');
        expect(plotSchema.frames.items.frames_entry).toBeDefined();
        expect(plotSchema.frames.items.frames_entry.role).toEqual('object');
    });
});

describe('getTraceValObject', function() {
    var getTraceValObject = Plotly.PlotSchema.getTraceValObject;

    it('finds base attributes', function() {
        expect(getTraceValObject({}, ['type']))
            .toBe(baseAttrs.type);
        expect(getTraceValObject({_module: parcoords}, ['customdata', 0, 'charm']))
            .toBe(baseAttrs.customdata);
    });

    it('looks first for trace._module, then for trace.type, then dflt', function() {
        expect(getTraceValObject({_module: parcoords}, ['domain', 'x', 0]))
            .toBe(parcoords.attributes.domain.x.items[0]);
        expect(getTraceValObject({_module: parcoords}, ['fugacity'])).toBe(false);

        expect(getTraceValObject({type: 'parcoords'}, ['dimensions', 5, 'range', 1]))
            .toBe(parcoords.attributes.dimensions.range.items[1]);
        expect(getTraceValObject({type: 'parcoords'}, ['llamas'])).toBe(false);

        expect(getTraceValObject({}, ['marker', 'opacity']))
            .toBe(scatter.attributes.marker.opacity);
        expect(getTraceValObject({}, ['dimensions', 5, 'range', 1])).toBe(false);
    });

    it('finds subplot attributes', function() {
        expect(getTraceValObject({}, ['xaxis']))
            .toBe(require('@src/plots/cartesian').attributes.xaxis);

        expect(getTraceValObject({type: 'surface'}, ['scene']))
            .toBe(require('@src/plots/gl3d').attributes.scene);
        expect(getTraceValObject({type: 'surface'}, ['xaxis'])).toBe(false);
    });

    it('finds pre-merged component attributes', function() {
        expect(getTraceValObject({}, ['xcalendar']))
            .toBe(scatter.attributes.xcalendar);
        expect(getTraceValObject({_module: surface}, ['xcalendar']))
            .toBe(surface.attributes.xcalendar);
        expect(getTraceValObject({_module: surface}, ['zcalendar']))
            .toBe(surface.attributes.zcalendar);
    });

    it('supports transform attributes', function() {
        var mockTrace = {transforms: [
            {type: 'filter'},
            {type: 'groupby'}
        ]};

        var filterAttrs = require('@src/transforms/filter').attributes;
        expect(getTraceValObject(mockTrace, ['transforms', 0, 'operation']))
            .toBe(filterAttrs.operation);
        // check a component-provided attr
        expect(getTraceValObject(mockTrace, ['transforms', 0, 'valuecalendar']))
            .toBe(filterAttrs.valuecalendar);

        expect(getTraceValObject(mockTrace, ['transforms', 1, 'styles', 13, 'value', 'line', 'color']))
            .toBe(require('@src/transforms/groupby').attributes.styles.value);

        [
            ['transforms', 0],
            ['transforms', 0, 'nameformat'],
            ['transforms', 2, 'enabled'],
            ['transforms', '0', 'operation']
        ].forEach(function(attrArray) {
            expect(getTraceValObject(mockTrace, attrArray)).toBe(false, attrArray);
        });

        expect(getTraceValObject({}, ['transforms', 0, 'operation'])).toBe(false);
    });

    it('supports polar area attributes', function() {
        var areaAttrs = require('@src/plots/polar/area_attributes');
        expect(getTraceValObject({type: 'area'}, ['r'])).toBe(areaAttrs.r);
        expect(getTraceValObject({type: 'area'}, ['t', 23])).toBe(areaAttrs.t);
        expect(getTraceValObject({type: 'area'}, ['q'])).toBe(false);
    });

    it('does not return attribute properties', function() {
        // it still returns the attribute itself - but maybe we should only do this
        // for valType: any? (or data_array/arrayOk with just an index)
        [
            'valType', 'dflt', 'role', 'description', 'arrayOk',
            'editTypes', 'min', 'max', 'values'
        ].forEach(function(prop) {
            expect(getTraceValObject({}, ['x', prop]))
                .toBe(scatter.attributes.x, prop);

            expect(getTraceValObject({}, ['xcalendar', prop]))
                .toBe(scatter.attributes.xcalendar, prop);

            expect(getTraceValObject({}, ['line', 'smoothing', prop]))
                .toBe(scatter.attributes.line.smoothing, prop);
        });
    });
});

describe('getLayoutValObject', function() {
    var getLayoutValObject = Plotly.PlotSchema.getLayoutValObject;

    it('finds base attributes', function() {
        expect(getLayoutValObject(['font', 'family'])).toBe(baseLayoutAttrs.font.family);
        expect(getLayoutValObject(['margin'])).toBe(baseLayoutAttrs.margin);
        expect(getLayoutValObject(['margarine'])).toBe(false);
    });

    it('finds trace layout attributes', function() {
        expect(getLayoutValObject(['barmode']))
            .toBe(require('@src/traces/bar').layoutAttributes.barmode);
        expect(getLayoutValObject(['boxgap']))
            .toBe(require('@src/traces/box').layoutAttributes.boxgap);
        expect(getLayoutValObject(['hiddenlabels']))
            .toBe(require('@src/traces/pie').layoutAttributes.hiddenlabels);
    });

    it('finds component attributes', function() {
        // the ones with schema are already merged into other places
        expect(getLayoutValObject(['calendar']))
            .toBe(baseLayoutAttrs.calendar);
        expect(getLayoutValObject(['scene4', 'annotations', 44, 'z']))
            .toBe(gl3dAttrs.annotations.z);

        // ones with only layoutAttributes we need to look in the component
        expect(getLayoutValObject(['annotations']))
            .toBe(annotationAttrs);
        expect(getLayoutValObject(['annotations', 123]))
            .toBe(annotationAttrs);
        expect(getLayoutValObject(['annotations', 123, 'textangle']))
            .toBe(annotationAttrs.textangle);

        expect(getLayoutValObject(['updatemenus', 3, 'buttons', 4, 'args', 2]))
            .toBe(updatemenuAttrs.buttons.args.items[2]);
    });

    it('finds cartesian subplot attributes', function() {
        expect(getLayoutValObject(['xaxis', 'title']))
            .toBe(cartesianAttrs.title);
        expect(getLayoutValObject(['yaxis', 'tickfont', 'family']))
            .toBe(cartesianAttrs.tickfont.family);
        expect(getLayoutValObject(['xaxis3', 'range', 1]))
            .toBe(cartesianAttrs.range.items[1]);
        expect(getLayoutValObject(['yaxis12', 'dtick']))
            .toBe(cartesianAttrs.dtick);

        // improper axis names
        [
            'xaxis0', 'yaxis1', 'xaxis2a', 'yaxis3x3', 'zaxis', 'aaxis'
        ].forEach(function(name) {
            expect(getLayoutValObject([name, 'dtick'])).toBe(false, name);
        });
    });

    it('finds 3d subplot attributes', function() {
        expect(getLayoutValObject(['scene', 'zaxis', 'spikesides']))
            .toBe(gl3dAttrs.zaxis.spikesides);
        expect(getLayoutValObject(['scene45', 'bgcolor']))
            .toBe(gl3dAttrs.bgcolor);

        // improper scene names
        expect(getLayoutValObject(['scene0', 'bgcolor'])).toBe(false);
        expect(getLayoutValObject(['scene1', 'bgcolor'])).toBe(false);
        expect(getLayoutValObject(['scene2k', 'bgcolor'])).toBe(false);
    });

    it('finds polar attributes', function() {
        expect(getLayoutValObject(['direction']))
            .toBe(polarLayoutAttrs.layout.direction);

        expect(getLayoutValObject(['radialaxis', 'range', 0]))
            .toBe(polarLayoutAttrs.radialaxis.range.items[0]);

        expect(getLayoutValObject(['angularaxis', 'domain']))
            .toBe(polarLayoutAttrs.angularaxis.domain);
    });
});
