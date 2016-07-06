var Plotly = require('@lib/index');


describe('Plotly.validate', function() {

    function assertErrorShape(out, dataSize, layoutSize) {
        var actualDataSize = out.data.map(function(t) {
            return t.length;
        });

        expect(actualDataSize).toEqual(dataSize);
        expect(out.layout.length).toEqual(layoutSize);
    }

    function assertErrorContent(obj, code, path) {
        expect(obj.code).toEqual(code);
        expect(obj.path).toEqual(path);

        // TODO test msg
    }

    it('should report when trace is defaulted to not be visible', function() {
        var out = Plotly.validate([{
            type: 'scatter'
            // missing 'x' and 'y
        }], {});

        assertErrorShape(out, [1], 0);
        assertErrorContent(out.data[0][0], 'invisible', 0, '');
    });

    it('should report when trace contains keys not part of the schema', function() {
        var out = Plotly.validate([{
            x: [1, 2, 3],
            markerColor: 'blue'
        }], {});

        assertErrorShape(out, [1], 0);
        assertErrorContent(out.data[0][0], 'schema', ['markerColor'], '');
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

        assertErrorShape(out, [1, 1], 0);
        expect(out.layout.length).toEqual(0);
        assertErrorContent(out.data[0][0], 'unused', ['marker'], '');
        assertErrorContent(out.data[1][0], 'unused', ['marker', 'cmin'], '');

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

        assertErrorShape(out, [1, 1], 0);
        assertErrorContent(out.data[0][0], 'value', ['line', 'width'], '');
        assertErrorContent(out.data[1][0], 'value', ['marker', 'color'], '');
    });

    it('should work with isLinkedToArray attributes', function() {
        var out = Plotly.validate([], {
            annotations: [{
                text: 'some text'
            }, {
                arrowSymbol: 'cat'
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
            shapes: [{
                opacity: 'none'
            }]
        });

        assertErrorShape(out, [], 5);
        assertErrorContent(out.layout[0], 'schema', ['annotations[1]', 'arrowSymbol'], '');
        assertErrorContent(out.layout[1], 'unused', ['xaxis', 'rangeselector', 'buttons[0]', 'count'], '');
        assertErrorContent(out.layout[2], 'schema', ['xaxis', 'rangeselector', 'buttons[1]', 'title'], '');
        assertErrorContent(out.layout[3], 'schema', ['xaxis2', 'rangeselector', 'buttons[0]', 'title'], '');
        assertErrorContent(out.layout[4], 'value', ['shapes[0]', 'opacity'], '');
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

        assertErrorShape(out, [], 4);
        assertErrorContent(out.layout[0], 'value', ['xaxis2', 'range'], '');
        assertErrorContent(out.layout[1], 'unused', ['scene10'], '');
        assertErrorContent(out.layout[2], 'schema', ['geo0'], '');
        assertErrorContent(out.layout[3], 'container', ['yaxis5'], '');
    });
});
