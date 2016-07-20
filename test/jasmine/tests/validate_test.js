var Plotly = require('@lib/index');
var Lib = require('@src/lib');

Plotly.register([
    // until they become official
    require('../assets/transforms/filter')
]);


describe('Plotly.validate', function() {

    function assertErrorContent(obj, code, cont, trace, path, astr, msg) {
        expect(obj.code).toEqual(code);
        expect(obj.container).toEqual(cont);
        expect(obj.trace).toEqual(trace);
        expect(obj.path).toEqual(path);
        expect(obj.astr).toEqual(astr);
        expect(obj.msg).toEqual(msg);
    }

    it('should return undefined when no errors are found', function() {
        var out = Plotly.validate([{
            type: 'scatter',
            x: [1, 2, 3]
        }], {
            title: 'my simple graph'
        });

        expect(out).toBeUndefined();
    });

    it('should report when data is not an array', function() {
        var out = Plotly.validate({
            type: 'scatter',
            x: [1, 2, 3]
        });

        expect(out.length).toEqual(1);
        assertErrorContent(
            out[0], 'array', 'data', null, '', '',
            'The data argument must be linked to an array container'
        );
    });

    it('should report when a data trace is not an object', function() {
        var out = Plotly.validate([{
            type: 'bar',
            x: [1, 2, 3]
        }, [1, 2, 3]]);

        expect(out.length).toEqual(1);
        assertErrorContent(
            out[0], 'object', 'data', 1, '', '',
            'Trace 1 in the data argument must be linked to an object container'
        );
    });

    it('should report when layout is not an object', function() {
        var out = Plotly.validate([], [1, 2, 3]);

        expect(out.length).toEqual(1);
        assertErrorContent(
            out[0], 'object', 'layout', null, '', '',
            'The layout argument must be linked to an object container'
        );
    });

    it('should report when trace is defaulted to not be visible', function() {
        var out = Plotly.validate([{
            type: 'scattergeo'
            // missing 'x' and 'y
        }], {});

        expect(out.length).toEqual(1);
        assertErrorContent(
            out[0], 'invisible', 'data', 0, '', '',
            'Trace 0 got defaulted to be not visible'
        );
    });

    it('should report when trace contains keys not part of the schema', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            markerColor: 'blue'
        }], {});

        expect(out.length).toEqual(1);
        assertErrorContent(
            out[0], 'schema', 'data', 0, ['markerColor'], 'markerColor',
            'In data trace 0, key markerColor is not part of the schema'
        );
    });

    it('should report when trace contains keys that are not coerced', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            mode: 'lines',
            marker: { color: 'blue' }
        }, {
            x: [1, 2, 3],
            mode: 'markers',
            marker: {
                color: 'blue',
                cmin: 10
            }
        }], {});

        expect(out.length).toEqual(2);
        assertErrorContent(
            out[0], 'unused', 'data', 0, ['marker'], 'marker',
            'In data trace 0, container marker did not get coerced'
        );
        assertErrorContent(
            out[1], 'unused', 'data', 1, ['marker', 'cmin'], 'marker.cmin',
            'In data trace 1, key marker.cmin did not get coerced'
        );
    });

    it('should report when trace contains keys set to invalid values', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            mode: 'lines',
            line: { width: 'a big number' }
        }, {
            x: [1, 2, 3],
            mode: 'markers',
            marker: { color: 10 }
        }], {});

        expect(out.length).toEqual(2);
        assertErrorContent(
            out[0], 'value', 'data', 0, ['line', 'width'], 'line.width',
            'In data trace 0, key line.width is set to an invalid value (a big number)'
        );
        assertErrorContent(
            out[1], 'value', 'data', 1, ['marker', 'color'], 'marker.color',
            'In data trace 1, key marker.color is set to an invalid value (10)'
        );
    });

    it('should work with isLinkedToArray attributes', function() {
        var out = Plotly.validate([], {
            annotations: [{
                text: 'some text'
            }, {
                arrowSymbol: 'cat'
            }, {
                font: { color: 'wont-work' }
            }],
            xaxis: {
                type: 'date',
                rangeselector: {
                    buttons: [{
                        label: '1 month',
                        step: 'all',
                        count: 10
                    }, {
                        title: '1 month'
                    }]
                }
            },
            xaxis2: {
                type: 'date',
                rangeselector: {
                    buttons: [{
                        title: '1 month'
                    }]
                }
            },
            xaxis3: {
                type: 'date',
                rangeselector: {
                    buttons: 'wont-work'
                }
            },
            shapes: [{
                opacity: 'none'
            }]
        });

        expect(out.length).toEqual(7);
        assertErrorContent(
            out[0], 'schema', 'layout', null,
            ['annotations', 1, 'arrowSymbol'], 'annotations[1].arrowSymbol',
            'In layout, key annotations[1].arrowSymbol is not part of the schema'
        );
        assertErrorContent(
            out[1], 'value', 'layout', null,
            ['annotations', 2, 'font', 'color'], 'annotations[2].font.color',
            'In layout, key annotations[2].font.color is set to an invalid value (wont-work)'
        );
        assertErrorContent(
            out[2], 'unused', 'layout', null,
            ['xaxis', 'rangeselector', 'buttons', 0, 'count'],
            'xaxis.rangeselector.buttons[0].count',
            'In layout, key xaxis.rangeselector.buttons[0].count did not get coerced'
        );
        assertErrorContent(
            out[3], 'schema', 'layout', null,
            ['xaxis', 'rangeselector', 'buttons', 1, 'title'],
            'xaxis.rangeselector.buttons[1].title',
            'In layout, key xaxis.rangeselector.buttons[1].title is not part of the schema'
        );
        assertErrorContent(
            out[4], 'schema', 'layout', null,
            ['xaxis2', 'rangeselector', 'buttons', 0, 'title'],
            'xaxis2.rangeselector.buttons[0].title',
            'In layout, key xaxis2.rangeselector.buttons[0].title is not part of the schema'
        );
        assertErrorContent(
            out[5], 'array', 'layout', null,
            ['xaxis3', 'rangeselector', 'buttons'],
            'xaxis3.rangeselector.buttons',
            'In layout, key xaxis3.rangeselector.buttons must be linked to an array container'
        );
        assertErrorContent(
            out[6], 'value', 'layout', null,
            ['shapes', 0, 'opacity'], 'shapes[0].opacity',
            'In layout, key shapes[0].opacity is set to an invalid value (none)'
        );
    });

    it('should work with isSubplotObj attributes', function() {
        var out = Plotly.validate([], {
            xaxis2: {
                range: 30
            },
            scene10: {
                bgcolor: 'red'
            },
            geo0: {},
            yaxis5: 'sup'
        });

        expect(out.length).toEqual(4);
        assertErrorContent(
            out[0], 'value', 'layout', null,
            ['xaxis2', 'range'], 'xaxis2.range',
            'In layout, key xaxis2.range is set to an invalid value (30)'
        );
        assertErrorContent(
            out[1], 'unused', 'layout', null,
            ['scene10'], 'scene10',
            'In layout, container scene10 did not get coerced'
        );
        assertErrorContent(
            out[2], 'schema', 'layout', null,
            ['geo0'], 'geo0',
            'In layout, key geo0 is not part of the schema'
        );
        assertErrorContent(
            out[3], 'object', 'layout', null,
            ['yaxis5'], 'yaxis5',
            'In layout, key yaxis5 must be linked to an object container'
        );
    });

    it('should work with attributes in registered transforms', function() {
        var base = {
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
        };

        var out = Plotly.validate([
            Lib.extendFlat({}, base, {
                transforms: [{
                    type: 'filter',
                    operation: '='
                }, {
                    type: 'filter',
                    operation: '=',
                    wrongKey: 'sup?'
                }, {
                    type: 'filter',
                    operation: 'wrongVal'
                },
                    'wont-work'
                ]
            }),
            Lib.extendFlat({}, base, {
                transforms: {
                    type: 'filter'
                }
            }),
            Lib.extendFlat({}, base, {
                transforms: [{
                    type: 'no gonna work'
                }]
            }),
        ], {
            title: 'my transformed graph'
        });

        expect(out.length).toEqual(5);
        assertErrorContent(
            out[0], 'schema', 'data', 0,
            ['transforms', 1, 'wrongKey'], 'transforms[1].wrongKey',
            'In data trace 0, key transforms[1].wrongKey is not part of the schema'
        );
        assertErrorContent(
            out[1], 'value', 'data', 0,
            ['transforms', 2, 'operation'], 'transforms[2].operation',
            'In data trace 0, key transforms[2].operation is set to an invalid value (wrongVal)'
        );
        assertErrorContent(
            out[2], 'object', 'data', 0,
            ['transforms', 3], 'transforms[3]',
            'In data trace 0, key transforms[3] must be linked to an object container'
        );
        assertErrorContent(
            out[3], 'array', 'data', 1,
            ['transforms'], 'transforms',
            'In data trace 1, key transforms must be linked to an array container'
        );
        assertErrorContent(
            out[4], 'value', 'data', 2,
            ['transforms', 0, 'type'], 'transforms[0].type',
            'In data trace 2, key transforms[0].type is set to an invalid value (no gonna work)'
        );
    });
});
