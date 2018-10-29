var Plotly = require('@lib/index');

var Lib = require('@src/lib');
var Registry = require('@src/registry');

var baseAttrs = require('@src/plots/attributes');
var scatter = require('@src/traces/scatter');
var parcoords = require('@src/traces/parcoords');
var surface = require('@src/traces/surface');

var baseLayoutAttrs = require('@src/plots/layout_attributes');
var cartesianAttrs = require('@src/plots/cartesian').layoutAttributes;
var gl3dAttrs = require('@src/plots/gl3d').layoutAttributes;
var polarLayoutAttrs = require('@src/plots/polar/legacy/axis_attributes');
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
    var editType = plotSchema.defs.editType;

    function assertTraceSchema(callback) {
        var traces = plotSchema.traces;

        Object.keys(traces).forEach(function(traceName) {
            Plotly.PlotSchema.crawl(traces[traceName].attributes, callback, 0, traceName);
        });
    }

    function assertTransformSchema(callback) {
        var transforms = plotSchema.transforms;

        Object.keys(transforms).forEach(function(transformName) {
            Plotly.PlotSchema.crawl(transforms[transformName].attributes, callback, 0, transformName);
        });
    }

    function assertLayoutSchema(callback) {
        Plotly.PlotSchema.crawl(plotSchema.layout.layoutAttributes, callback, 0, 'layout');

        var traces = plotSchema.traces;

        Object.keys(traces).forEach(function(traceName) {
            var layoutAttrs = traces[traceName].layoutAttributes;
            if(layoutAttrs) {
                Plotly.PlotSchema.crawl(layoutAttrs, callback, 0, traceName + ': layout');
            }
        });
    }

    function assertPlotSchema(callback) {
        assertTraceSchema(callback);
        assertLayoutSchema(callback);
        assertTransformSchema(callback);
    }

    it('all attributes should have a valid `valType`', function() {
        assertPlotSchema(
            function(attr) {
                if(isValObject(attr)) {
                    expect(VALTYPES.indexOf(attr.valType) !== -1).toBe(true, attr);
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
                            .concat([
                                'valType', 'description', 'role',
                                'editType', 'impliedEdits',
                                '_compareAsJSON', '_noTemplating'
                            ]);

                    Object.keys(attr).forEach(function(key) {
                        expect(opts.indexOf(key) !== -1).toBe(true, key, attr);
                    });
                }
            }
        );
    });

    it('all subplot objects should contain _isSubplotObj', function() {
        var IS_SUBPLOT_OBJ = '_isSubplotObj';
        var cnt = 0;

        var astrs = [
            'xaxis', 'yaxis', 'scene', 'geo', 'ternary', 'mapbox', 'polar',
            // not really a 'subplot' object but supports yaxis, yaxis2, yaxis3,
            // ... counters, so list it here
            'xaxis.rangeslider.yaxis'
        ];

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
                if(attr && attr[IS_SUBPLOT_OBJ] === true) {
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
            function(attr, attrName, attrs, level, attrString) {
                if(attr && isPlainObject(attr[DEPRECATED])) {
                    Object.keys(attr[DEPRECATED]).forEach(function(dAttrName) {
                        var dAttr = attr[DEPRECATED][dAttrName];

                        expect(VALTYPES.indexOf(dAttr.valType) !== -1)
                            .toBe(true, attrString + ': ' + dAttrName);
                        expect(ROLES.indexOf(dAttr.role) !== -1)
                            .toBe(true, attrString + ': ' + dAttrName);
                    });
                }
            }
        );
    });

    it('has valid or no `impliedEdits` in every attribute', function() {
        assertPlotSchema(function(attr, attrName, attrs, level, attrString) {
            if(attr && attr.impliedEdits !== undefined) {
                expect(isPlainObject(attr.impliedEdits))
                    .toBe(true, attrString + ': ' + JSON.stringify(attr.impliedEdits));
                // make sure it wasn't emptied out
                expect(Object.keys(attr.impliedEdits).length).not.toBe(0, attrString);
            }
        });
    });

    it('has valid `editType` in all attributes and containers', function() {
        function shouldHaveEditType(attr, attrName) {
            // ensure any object (container or regular val object) has editType
            // array containers have extra nesting where editType would be redundant
            return Lib.isPlainObject(attr) && attrName !== 'impliedEdits' &&
                attrName !== 'items' && !Lib.isPlainObject(attr.items);
        }

        assertTraceSchema(function(attr, attrName, attrs, level, attrString) {
            if(shouldHaveEditType(attr, attrName)) {
                expect(Lib.validate(attr.editType, editType.traces))
                    .toBe(true, attrString + ': ' + JSON.stringify(attr.editType));
            }
        });

        assertTransformSchema(function(attr, attrName, attrs, level, attrString) {
            if(shouldHaveEditType(attr, attrName)) {
                expect(Lib.validate(attr.editType, editType.traces))
                    .toBe(true, attrString + ': ' + JSON.stringify(attr.editType));
            }
        });

        assertLayoutSchema(function(attr, attrName, attrs, level, attrString) {
            if(shouldHaveEditType(attr, attrName)) {
                expect(Lib.validate(attr.editType, editType.layout))
                    .toBe(true, attrString + ': ' + JSON.stringify(attr.editType));
            }
        });
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
                '_deprecated', 'description', 'role', 'editType', 'impliedEdits'
            ]);
    });

    it('should list the correct frame attributes', function() {
        expect(plotSchema.frames).toBeDefined();
        expect(plotSchema.frames.role).toEqual('object');
        expect(plotSchema.frames.items.frames_entry).toBeDefined();
        expect(plotSchema.frames.items.frames_entry.role).toEqual('object');
    });

    it('should list trace-dependent & direction-dependent error bar attributes', function() {
        var scatterSchema = plotSchema.traces.scatter.attributes;
        expect(scatterSchema.error_x.copy_ystyle).toBeDefined();
        expect(scatterSchema.error_x.copy_ystyle.editType).toBe('plot');
        expect(scatterSchema.error_x.copy_zstyle).toBeUndefined();
        expect(scatterSchema.error_y.copy_ystyle).toBeUndefined();
        expect(scatterSchema.error_y.copy_zstyle).toBeUndefined();

        var scatter3dSchema = plotSchema.traces.scatter3d.attributes;
        expect(scatter3dSchema.error_x.copy_ystyle).toBeUndefined();
        expect(scatter3dSchema.error_x.copy_zstyle).toBeDefined();
        expect(scatter3dSchema.error_x.copy_zstyle.editType).toBe('calc');
        expect(scatter3dSchema.error_y.copy_ystyle).toBeUndefined();
        expect(scatter3dSchema.error_y.copy_zstyle).toBeDefined();
        expect(scatter3dSchema.error_y.copy_zstyle.editType).toBe('calc');
        expect(scatter3dSchema.error_z.copy_ystyle).toBeUndefined();
        expect(scatter3dSchema.error_z.copy_zstyle).toBeUndefined();

        var scatterglSchema = plotSchema.traces.scattergl.attributes;
        expect(scatterglSchema.error_x.copy_ystyle).toBeDefined();
        expect(scatterglSchema.error_x.copy_ystyle.editType).toBe('calc');
        expect(scatterglSchema.error_x.copy_zstyle).toBeUndefined();
        expect(scatterglSchema.error_y.copy_ystyle).toBeUndefined();
        expect(scatterglSchema.error_y.copy_zstyle).toBeUndefined();
    });

    it('should convert regex valObject fields to strings', function() {
        var splomAttrs = plotSchema.traces.splom.attributes;

        expect(typeof splomAttrs.xaxes.items.regex).toBe('string');
        expect(splomAttrs.xaxes.items.regex).toBe('/^x([2-9]|[1-9][0-9]+)?$/');
        expect(typeof splomAttrs.yaxes.items.regex).toBe('string');
        expect(splomAttrs.yaxes.items.regex).toBe('/^y([2-9]|[1-9][0-9]+)?$/');
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
        var areaAttrs = require('@src/plots/polar/legacy/area_attributes');
        expect(getTraceValObject({type: 'area'}, ['r'])).toBe(areaAttrs.r);
        expect(getTraceValObject({type: 'area'}, ['t', 23])).toBe(areaAttrs.t);
        expect(getTraceValObject({type: 'area'}, ['q'])).toBe(false);
    });

    it('does not return attribute properties', function() {
        // it still returns the attribute itself - but maybe we should only do this
        // for valType: any? (or data_array/arrayOk with just an index)
        [
            'valType', 'dflt', 'role', 'description', 'arrayOk',
            'editType', 'min', 'max', 'values'
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
    var blankLayout = {};

    it('finds base attributes', function() {
        expect(getLayoutValObject(blankLayout, ['font', 'family'])).toBe(baseLayoutAttrs.font.family);
        expect(getLayoutValObject(blankLayout, ['margin'])).toBe(baseLayoutAttrs.margin);
        expect(getLayoutValObject(blankLayout, ['margarine'])).toBe(false);
    });

    it('finds trace layout attributes', function() {
        var layoutBar = {_modules: [Registry.modules.bar._module]};
        expect(getLayoutValObject(layoutBar, ['barmode']))
            .toBe(require('@src/traces/bar').layoutAttributes.barmode);
        var layoutBox = {_modules: [Registry.modules.box._module]};
        expect(getLayoutValObject(layoutBox, ['boxgap']))
            .toBe(require('@src/traces/box').layoutAttributes.boxgap);
        var layoutPie = {_modules: [Registry.modules.pie._module]};
        expect(getLayoutValObject(layoutPie, ['hiddenlabels']))
            .toBe(require('@src/traces/pie').layoutAttributes.hiddenlabels);

        // not found when these traces are unused on the plot
        expect(getLayoutValObject(blankLayout, ['barmode'])).toBe(false);
        expect(getLayoutValObject(blankLayout, ['boxgap'])).toBe(false);
        expect(getLayoutValObject(blankLayout, ['hiddenlabels'])).toBe(false);
    });

    it('finds component attributes', function() {
        var layout3D = {_basePlotModules: [Registry.subplotsRegistry.gl3d]};
        // the ones with schema are already merged into other places
        expect(getLayoutValObject(blankLayout, ['calendar']))
            .toBe(baseLayoutAttrs.calendar);
        expect(getLayoutValObject(layout3D, ['scene4', 'annotations', 44, 'z']))
            .toBe(gl3dAttrs.annotations.z);

        // still need to have the subplot in the plot to find these
        expect(getLayoutValObject(blankLayout, ['scene4', 'annotations', 44, 'z'])).toBe(false);

        // ones with only layoutAttributes we need to look in the component
        expect(getLayoutValObject(blankLayout, ['annotations']))
            .toBe(annotationAttrs);
        expect(getLayoutValObject(blankLayout, ['annotations', 123]))
            .toBe(annotationAttrs);
        expect(getLayoutValObject(blankLayout, ['annotations', 123, 'textangle']))
            .toBe(annotationAttrs.textangle);

        expect(getLayoutValObject(blankLayout, ['updatemenus', 3, 'buttons', 4, 'args', 2]))
            .toBe(updatemenuAttrs.buttons.args.items[2]);
    });

    it('finds cartesian subplot attributes', function() {
        var layoutCartesian = {_basePlotModules: [Registry.subplotsRegistry.cartesian]};
        expect(getLayoutValObject(layoutCartesian, ['xaxis', 'title']))
            .toBe(cartesianAttrs.title);
        expect(getLayoutValObject(layoutCartesian, ['yaxis', 'tickfont', 'family']))
            .toBe(cartesianAttrs.tickfont.family);
        expect(getLayoutValObject(layoutCartesian, ['xaxis3', 'range', 1]))
            .toBe(cartesianAttrs.range.items[1]);
        expect(getLayoutValObject(layoutCartesian, ['yaxis12', 'dtick']))
            .toBe(cartesianAttrs.dtick);

        // not found when cartesian is unused
        expect(getLayoutValObject(blankLayout, ['xaxis', 'title'])).toBe(false);
        expect(getLayoutValObject(blankLayout, ['yaxis', 'tickfont', 'family'])).toBe(false);
        expect(getLayoutValObject(blankLayout, ['xaxis3', 'range', 1])).toBe(false);
        expect(getLayoutValObject(blankLayout, ['yaxis12', 'dtick'])).toBe(false);

        // improper axis names
        [
            'xaxis0', 'yaxis1', 'xaxis2a', 'yaxis3x3', 'zaxis', 'aaxis'
        ].forEach(function(name) {
            expect(getLayoutValObject(layoutCartesian, [name, 'dtick'])).toBe(false, name);
        });
    });

    it('finds 3d subplot attributes if 3d is present', function() {
        var layout3D = {_basePlotModules: [Registry.subplotsRegistry.gl3d]};
        expect(getLayoutValObject(layout3D, ['scene', 'zaxis', 'spikesides']))
            .toBe(gl3dAttrs.zaxis.spikesides);
        expect(getLayoutValObject(layout3D, ['scene45', 'bgcolor']))
            .toBe(gl3dAttrs.bgcolor);

        // not found when the gl3d is unused
        expect(getLayoutValObject(blankLayout, ['scene', 'zaxis', 'spikesides'])).toBe(false);
        expect(getLayoutValObject(blankLayout, ['scene45', 'bgcolor'])).toBe(false);

        // improper scene names
        expect(getLayoutValObject(layout3D, ['scene0', 'bgcolor'])).toBe(false);
        expect(getLayoutValObject(layout3D, ['scene1', 'bgcolor'])).toBe(false);
        expect(getLayoutValObject(layout3D, ['scene2k', 'bgcolor'])).toBe(false);
    });

    it('finds polar attributes', function() {
        expect(getLayoutValObject(blankLayout, ['direction']))
            .toBe(polarLayoutAttrs.layout.direction);

        expect(getLayoutValObject(blankLayout, ['radialaxis', 'range', 0]))
            .toBe(polarLayoutAttrs.radialaxis.range.items[0]);

        expect(getLayoutValObject(blankLayout, ['angularaxis', 'domain']))
            .toBe(polarLayoutAttrs.angularaxis.domain);
    });

    it('lets gl2d override cartesian & global attrs', function() {
        var svgModule = Registry.subplotsRegistry.cartesian;
        var gl2dModule = Registry.subplotsRegistry.gl2d;
        var layoutSVG = {_basePlotModules: [svgModule]};
        var layoutGL2D = {_basePlotModules: [gl2dModule]};
        var combinedLayout1 = {_basePlotModules: [svgModule, gl2dModule]};
        var combinedLayout2 = {_basePlotModules: [gl2dModule, svgModule]};

        var bgParts = ['plot_bgcolor'];
        var baseBG = baseLayoutAttrs.plot_bgcolor;
        var gl2dBG = gl2dModule.baseLayoutAttrOverrides.plot_bgcolor;
        expect(getLayoutValObject(blankLayout, bgParts)).toBe(baseBG);
        expect(getLayoutValObject(layoutSVG, bgParts)).toBe(baseBG);
        expect(getLayoutValObject(layoutGL2D, bgParts)).toBe(gl2dBG);
        expect(getLayoutValObject(combinedLayout1, bgParts)).toBe(gl2dBG);
        expect(getLayoutValObject(combinedLayout2, bgParts)).toBe(gl2dBG);

        var ticklenParts = ['xaxis4', 'ticklen'];
        var svgTicklen = svgModule.layoutAttributes.ticklen;
        var gl2dTicklen = gl2dModule.layoutAttrOverrides.ticklen;
        expect(getLayoutValObject(blankLayout, ticklenParts)).toBe(false);
        expect(getLayoutValObject(layoutSVG, ticklenParts)).toBe(svgTicklen);
        expect(getLayoutValObject(layoutGL2D, ticklenParts)).toBe(gl2dTicklen);
        expect(getLayoutValObject(combinedLayout1, ticklenParts)).toBe(gl2dTicklen);
        expect(getLayoutValObject(combinedLayout2, ticklenParts)).toBe(gl2dTicklen);
    });
});

describe('component schemas', function() {
    it('does not have yaxis-only attributes or mismatched x/yaxis attributes', function() {
        // in principle either of these should be allowable, but we don't currently
        // support them so lets simply test that we haven't added them accidentally!

        function delDescription(attr) { delete attr.description; }

        for(var key in Registry.componentsRegistry) {
            var _module = Registry.componentsRegistry[key];
            var schema = _module.schema;
            if(schema && schema.subplots && schema.subplots.yaxis) {
                expect(schema.subplots.xaxis).toBeDefined(_module.name);

                var xa = Lib.extendDeep({}, schema.subplots.xaxis);
                var ya = Lib.extendDeep({}, schema.subplots.yaxis);
                Plotly.PlotSchema.crawl(xa, delDescription);
                Plotly.PlotSchema.crawl(ya, delDescription);
                expect(JSON.stringify(xa)).toBe(JSON.stringify(ya), _module.name);
            }
        }
    });
});
