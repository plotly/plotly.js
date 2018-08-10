var Plotly = require('@lib/index');
var Lib = require('@src/lib');


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

    it('should work with info arrays', function() {
        var out = Plotly.validate([{
            y: [1, 2, 2]
        }], {
            xaxis: { range: [0, 10] },
            yaxis: { range: 'not-gonna-work' },
        });

        expect(out.length).toEqual(1);
        assertErrorContent(
            out[0], 'value', 'layout', null, ['yaxis', 'range'], 'yaxis.range',
            'In layout, key yaxis.range is set to an invalid value (not-gonna-work)'
        );
    });

    it('should work with colorscale attributes', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            marker: {
                color: [20, 10, 30],
                colorscale: 'Reds'
            }
        }, {
            x: [1, 2, 3],
            marker: {
                color: [20, 10, 30],
                colorscale: 'not-gonna-work'
            }
        }, {
            x: [1, 2, 3],
            marker: {
                color: [20, 10, 30],
                colorscale: [[0, 'red'], [1, 'blue']]
            }
        }]);

        expect(out.length).toEqual(1);
        assertErrorContent(
            out[0], 'value', 'data', 1, ['marker', 'colorscale'], 'marker.colorscale',
            'In data trace 1, key marker.colorscale is set to an invalid value (not-gonna-work)'
        );
    });

    it('should work with isLinkedToArray attributes', function() {
        var out = Plotly.validate([
            {y: [1, 2]},
            {y: [1, 2], xaxis: 'x2'},
            {y: [1, 2], xaxis: 'x3'}
        ], {
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
                    }, 'wont-work', {
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
            }],
            updatemenus: [{
                buttons: [{
                    method: 'restyle',
                    args: ['marker.color', 'red']
                }]
            }, 'wont-work', {
                buttons: [{
                    method: 'restyle',
                    args: null
                }, {
                    method: 'relayout',
                    args: ['marker.color', 'red'],
                    title: 'not-gonna-work'
                }, 'wont-work']
            }]
        });

        expect(out.length).toEqual(12);
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
            ['xaxis', 'rangeselector', 'buttons', 2, 'title'],
            'xaxis.rangeselector.buttons[2].title',
            'In layout, key xaxis.rangeselector.buttons[2].title is not part of the schema'
        );
        assertErrorContent(
            out[4], 'object', 'layout', null,
            ['xaxis', 'rangeselector', 'buttons', 1],
            'xaxis.rangeselector.buttons[1]',
            'In layout, key xaxis.rangeselector.buttons[1] must be linked to an object container'
        );
        assertErrorContent(
            out[5], 'schema', 'layout', null,
            ['xaxis2', 'rangeselector', 'buttons', 0, 'title'],
            'xaxis2.rangeselector.buttons[0].title',
            'In layout, key xaxis2.rangeselector.buttons[0].title is not part of the schema'
        );
        assertErrorContent(
            out[6], 'array', 'layout', null,
            ['xaxis3', 'rangeselector', 'buttons'],
            'xaxis3.rangeselector.buttons',
            'In layout, key xaxis3.rangeselector.buttons must be linked to an array container'
        );
        assertErrorContent(
            out[7], 'value', 'layout', null,
            ['shapes', 0, 'opacity'], 'shapes[0].opacity',
            'In layout, key shapes[0].opacity is set to an invalid value (none)'
        );
        assertErrorContent(
            out[8], 'invisible', 'layout', null,
            ['updatemenus', 2, 'buttons', 0], 'updatemenus[2].buttons[0]',
            'In layout, item updatemenus[2].buttons[0] got defaulted to be not visible'
        );
        assertErrorContent(
            out[9], 'schema', 'layout', null,
            ['updatemenus', 2, 'buttons', 1, 'title'], 'updatemenus[2].buttons[1].title',
            'In layout, key updatemenus[2].buttons[1].title is not part of the schema'
        );
        assertErrorContent(
            out[10], 'object', 'layout', null,
            ['updatemenus', 2, 'buttons', 2], 'updatemenus[2].buttons[2]',
            'In layout, key updatemenus[2].buttons[2] must be linked to an object container'
        );
        assertErrorContent(
            out[11], 'object', 'layout', null,
            ['updatemenus', 1], 'updatemenus[1]',
            'In layout, key updatemenus[1] must be linked to an object container'
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

    it('should catch input errors for attribute with dynamic defaults', function() {
        var out = Plotly.validate([
            {y: [1, 2]},
            {y: [1, 2], xaxis: 'x2', yaxis: 'y2'}
        ], {
            xaxis: {
                constrain: 'domain',
                constraintoward: 'bottom'
            },
            yaxis: {
                constrain: 'domain',
                constraintoward: 'left'
            },
            xaxis2: {
                anchor: 'x3'
            },
            yaxis2: {
                overlaying: 'x'
            }
        });

        expect(out.length).toBe(4);
        assertErrorContent(
            out[0], 'dynamic', 'layout', null,
            ['xaxis', 'constraintoward'], 'xaxis.constraintoward',
            'In layout, key xaxis.constraintoward (set to \'bottom\') got reset to \'center\' during defaults.'
        );
        assertErrorContent(
            out[1], 'dynamic', 'layout', null,
            ['yaxis', 'constraintoward'], 'yaxis.constraintoward',
            'In layout, key yaxis.constraintoward (set to \'left\') got reset to \'middle\' during defaults.'
        );
        assertErrorContent(
            out[2], 'dynamic', 'layout', null,
            ['xaxis2', 'anchor'], 'xaxis2.anchor',
            'In layout, key xaxis2.anchor (set to \'x3\') got reset to \'y\' during defaults.'
        );
        assertErrorContent(
            out[3], 'dynamic', 'layout', null,
            ['yaxis2', 'overlaying'], 'yaxis2.overlaying',
            'In layout, key yaxis2.overlaying (set to \'x\') got reset to \'false\' during defaults.'
        );
    });

    it('catches bad axes in grid definitions', function() {
        var out = Plotly.validate([
            {y: [1, 2]},
            {y: [1, 2], xaxis: 'x2', yaxis: 'y2'}
        ], {
            grid: {xaxes: ['x3', '', 'x2', 4], yaxes: ['y', 3, '', 'y4']},
            // while we're at it check on another info_array
            xaxis: {range: [5, 'lots']}
        });

        expect(out.length).toBe(5);
        assertErrorContent(
            out[0], 'dynamic', 'layout', null,
            ['grid', 'xaxes', 0], 'grid.xaxes[0]',
            'In layout, key grid.xaxes[0] (set to \'x3\') got reset to \'\' during defaults.'
        );
        assertErrorContent(
            out[1], 'value', 'layout', null,
            ['grid', 'xaxes', 3], 'grid.xaxes[3]',
            'In layout, key grid.xaxes[3] is set to an invalid value (4)'
        );
        assertErrorContent(
            out[2], 'value', 'layout', null,
            ['grid', 'yaxes', 1], 'grid.yaxes[1]',
            'In layout, key grid.yaxes[1] is set to an invalid value (3)'
        );
        assertErrorContent(
            out[3], 'dynamic', 'layout', null,
            ['grid', 'yaxes', 3], 'grid.yaxes[3]',
            'In layout, key grid.yaxes[3] (set to \'y4\') got reset to \'\' during defaults.'
        );
        assertErrorContent(
            out[4], 'dynamic', 'layout', null,
            ['xaxis', 'range', 1], 'xaxis.range[1]',
            'In layout, key xaxis.range[1] (set to \'lots\') got reset to \'50\' during defaults.'
        );
    });

    it('catches bad subplots in grid definitions', function() {
        var out = Plotly.validate([
            {y: [1, 2]},
            {y: [1, 2], xaxis: 'x2', yaxis: 'y2'},
            {y: [1, 2], xaxis: 'x2'}
        ], {
            grid: {subplots: [['xy', 'x2y3'], ['x2y', 'x2y2'], [5, '']]},
        });

        expect(out.length).toBe(3);
        assertErrorContent(
            out[0], 'dynamic', 'layout', null,
            ['grid', 'subplots', 0, 1], 'grid.subplots[0][1]',
            'In layout, key grid.subplots[0][1] (set to \'x2y3\') got reset to \'\' during defaults.'
        );
        assertErrorContent(
            out[1], 'dynamic', 'layout', null,
            ['grid', 'subplots', 1, 0], 'grid.subplots[1][0]',
            'In layout, key grid.subplots[1][0] (set to \'x2y\') got reset to \'\' during defaults.'
        );
        assertErrorContent(
            out[2], 'value', 'layout', null,
            ['grid', 'subplots', 2, 0], 'grid.subplots[2][0]',
            'In layout, key grid.subplots[2][0] is set to an invalid value (5)'
        );
    });

    it('should detect opposite axis range slider attributes', function() {
        var out = Plotly.validate([
            {y: [1, 2]},
            {y: [1, 2], yaxis: 'y2'},
            {y: [1, 2], yaxis: 'y3'}
        ], {
            xaxis: {
                rangeslider: {
                    yaxis: { rangemode: 'auto' },
                    yaxis2: { rangemode: 'fixed' },
                    yaxis3: { range: [0, 1] }
                }
            },
            yaxis: {},
            yaxis2: {},
            yaxis3: {}
        });

        expect(out).toBeUndefined();
    });

    it('should accept attributes that really end in a number', function() {
        // and not try to strip that number off!
        // eg x0, x1 in shapes
        var shapeMock = require('@mocks/shapes.json');
        var out = Plotly.validate(shapeMock.data, shapeMock.layout);
        expect(out).toBeUndefined();
    });
});
