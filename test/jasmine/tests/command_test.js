var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Plots = Plotly.Plots;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('Plots.evaluateAPICommandBinding', function() {
    it('evaluates a data binding', function() {
        var gd = {_fullData: [null, {line: {width: 7}}]};
        var astr = 'data[1].line.width';

        expect(Plots.evaluateAPICommandBinding(gd, astr)).toEqual(7);
    });

    it('evaluates a layout binding', function() {
        var gd = {_fullLayout: {margin: {t: 100}}};
        var astr = 'layout.margin.t';

        expect(Plots.evaluateAPICommandBinding(gd, astr)).toEqual(100);
    });
});

describe('Plots.executeAPICommand', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        destroyGraphDiv(gd);
    });

    describe('with a successful API command', function() {
        beforeEach(function() {
            spyOn(PlotlyInternal, 'restyle').and.callFake(function() {
                return Promise.resolve('resolution');
            });
        });

        it('calls the API method and resolves', function(done) {
            Plots.executeAPICommand(gd, 'restyle', ['foo', 'bar']).then(function(value) {
                var m = PlotlyInternal.restyle;
                expect(m).toHaveBeenCalled();
                expect(m.calls.count()).toEqual(1);
                expect(m.calls.argsFor(0)).toEqual([gd, 'foo', 'bar']);

                expect(value).toEqual('resolution');
            }).catch(fail).then(done);
        });

    });

    describe('with an unsuccessful command', function() {
        beforeEach(function() {
            spyOn(PlotlyInternal, 'restyle').and.callFake(function() {
                return Promise.reject('rejection');
            });
        });

        it('calls the API method and rejects', function(done) {
            Plots.executeAPICommand(gd, 'restyle', ['foo', 'bar']).then(fail, function(value) {
                var m = PlotlyInternal.restyle;
                expect(m).toHaveBeenCalled();
                expect(m.calls.count()).toEqual(1);
                expect(m.calls.argsFor(0)).toEqual([gd, 'foo', 'bar']);

                expect(value).toEqual('rejection');
            }).catch(fail).then(done);
        });

    });
});

describe('Plots.hasSimpleBindings', function() {
    'use strict';
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();

        Plotly.plot(gd, [
            {x: [1, 2, 3], y: [1, 2, 3]},
            {x: [1, 2, 3], y: [4, 5, 6]},
        ]);
    });

    afterEach(function() {
        destroyGraphDiv(gd);
    });

    it('return true when bindings are simple', function() {
        var isSimple = Plots.hasSimpleBindings(gd, [{
            method: 'restyle',
            args: [{'marker.size': 10}]
        }, {
            method: 'restyle',
            args: [{'marker.size': 20}]
        }]);

        expect(isSimple).toBe(true);
    });

    it('return false when properties are not the same', function() {
        var isSimple = Plots.hasSimpleBindings(gd, [{
            method: 'restyle',
            args: [{'marker.size': 10}]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}]
        }]);

        expect(isSimple).toBe(false);
    });

    it('return false when a command binds to more than one property', function() {
        var isSimple = Plots.hasSimpleBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10, 'marker.size': 12}]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}]
        }]);

        expect(isSimple).toBe(false);
    });

    it('return false when commands affect different traces', function() {
        var isSimple = Plots.hasSimpleBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10}, [0]]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}, [1]]
        }]);

        expect(isSimple).toBe(false);
    });

    it('return true when commands affect the same traces', function() {
        var isSimple = Plots.hasSimpleBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10}, [1]]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}, [1]]
        }]);

        expect(isSimple).toBe(true);
    });

    it('return true when commands affect the same traces in different order', function() {
        var isSimple = Plots.hasSimpleBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10}, [1, 2]]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}, [2, 1]]
        }]);

        expect(isSimple).toBe(true);
    });
});

describe('Plots.computeAPICommandBindings', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();

        Plotly.plot(gd, [
            {x: [1, 2, 3], y: [1, 2, 3]},
            {x: [1, 2, 3], y: [4, 5, 6]},
        ]);
    });

    afterEach(function() {
        destroyGraphDiv(gd);
    });

    describe('restyle', function() {
        describe('with invalid notation', function() {
            it('with a scalar value', function() {
                var result = Plots.computeAPICommandBindings(gd, 'restyle', [['x']]);
                expect(result).toEqual([]);
            });
        });

        describe('with astr + val notation', function() {
            describe('and a single attribute', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7]);
                    expect(result).toEqual([{prop: 'marker.size', traces: null, type: 'data'}]);
                });

                it('with an array value and no trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data'}]);
                });

                it('with trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7, [0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data'}]);
                });

                it('with a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7, [0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data'}]);
                });

                it('with an array value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7], [1]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [1], type: 'data'}]);
                });

                it('with two array values and two traces specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [0, 1]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0, 1], type: 'data'}]);
                });

                it('with traces specified in reverse order', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [1, 0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [1, 0], type: 'data'}]);
                });

                it('with two values and a single trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data'}]);
                });

                it('with two values and a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [1]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [1], type: 'data'}]);
                });
            });
        });

        describe('with aobj notation', function() {
            describe('and a single attribute', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: null}]);
                });

                it('with trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}, [0]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [0]}]);
                });

                it('with a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}, [1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1]}]);
                });

                it('with an array value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7]}, [1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1]}]);
                });

                it('with two array values and two traces specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [0, 1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [0, 1]}]);
                });

                it('with traces specified in reverse order', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [1, 0]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1, 0]}]);
                });

                it('with two values and a single trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [0]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [0]}]);
                });

                it('with two values and a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1]}]);
                });
            });

            describe('and multiple attributes', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7, 'text.color': 'blue'}]);
                    expect(result).toEqual([
                        {type: 'data', prop: 'marker.size', traces: null},
                        {type: 'data', prop: 'text.color', traces: null}
                    ]);
                });
            });
        });

        describe('with mixed notation', function() {
            it('and nested object and nested attr', function() {
                var result = Plots.computeAPICommandBindings(gd, 'restyle', [{
                    y: [[3, 4, 5]],
                    'marker.size': [10, 20, 25],
                    'line.color': 'red',
                    line: {
                        width: [2, 8]
                    }
                }]);

                // The results are definitely not completely intuitive, so this
                // is based upon empirical results with a codepen example:
                expect(result).toEqual([
                    {type: 'data', prop: 'y', traces: [0]},
                    {type: 'data', prop: 'marker.size', traces: [0, 1]},
                    {type: 'data', prop: 'line.color', traces: null},
                    {type: 'data', prop: 'line.width', traces: [0, 1]}
                ]);
            });

            it('and traces specified', function() {
                var result = Plots.computeAPICommandBindings(gd, 'restyle', [{
                    y: [[3, 4, 5]],
                    'marker.size': [10, 20, 25],
                    'line.color': 'red',
                    line: {
                        width: [2, 8]
                    }
                }, [1, 0]]);

                expect(result).toEqual([
                    {type: 'data', prop: 'y', traces: [1]},
                    {type: 'data', prop: 'marker.size', traces: [1, 0]},
                    {type: 'data', prop: 'line.color', traces: [1, 0]},
                    {type: 'data', prop: 'line.width', traces: [1, 0]}
                ]);
            });

            it('and more data than traces', function() {
                var result = Plots.computeAPICommandBindings(gd, 'restyle', [{
                    y: [[3, 4, 5]],
                    'marker.size': [10, 20, 25],
                    'line.color': 'red',
                    line: {
                        width: [2, 8]
                    }
                }, [1]]);

                expect(result).toEqual([
                    {type: 'data', prop: 'y', traces: [1]},
                    {type: 'data', prop: 'marker.size', traces: [1]},
                    {type: 'data', prop: 'line.color', traces: [1]},
                    {type: 'data', prop: 'line.width', traces: [1]}
                ]);
            });
        });
    });

    describe('relayout', function() {
        describe('with invalid notation', function() {
            it('and a scalar value', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', [['x']]);
                expect(result).toEqual([]);
            });
        });

        describe('with aobj notation', function() {
            it('and a single attribute', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', [{height: 500}]);
                expect(result).toEqual([{type: 'layout', prop: 'height'}]);
            });

            it('and two attributes', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', [{height: 500, width: 100}]);
                expect(result).toEqual([{type: 'layout', prop: 'height'}, {type: 'layout', prop: 'width'}]);
            });
        });

        describe('with astr + val notation', function() {
            it('and an attribute', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', ['width', 100]);
                expect(result).toEqual([{type: 'layout', prop: 'width'}]);
            });

            it('and nested atributes', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', ['margin.l', 10]);
                expect(result).toEqual([{type: 'layout', prop: 'margin.l'}]);
            });
        });

        describe('with mixed notation', function() {
            it('containing aob + astr', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', [{
                    'width': 100,
                    'margin.l': 10
                }]);
                expect(result).toEqual([
                    {type: 'layout', prop: 'width'},
                    {type: 'layout', prop: 'margin.l'}
                ]);
            });
        });
    });

    describe('update', function() {
        it('computes bindings', function() {
            var result = Plots.computeAPICommandBindings(gd, 'update', [{
                y: [[3, 4, 5]],
                'marker.size': [10, 20, 25],
                'line.color': 'red',
                line: {
                    width: [2, 8]
                }
            }, {
                'margin.l': 50,
                width: 10
            }, [1]]);

            expect(result).toEqual([
                {type: 'data', prop: 'y', traces: [1]},
                {type: 'data', prop: 'marker.size', traces: [1]},
                {type: 'data', prop: 'line.color', traces: [1]},
                {type: 'data', prop: 'line.width', traces: [1]},
                {type: 'layout', prop: 'margin.l'},
                {type: 'layout', prop: 'width'}
            ]);
        });
    });

    describe('animate', function() {
        it('computes bindings', function() {
            var result = Plots.computeAPICommandBindings(gd, 'animate', [{}]);

            expect(result).toEqual([{type: 'layout', prop: '_currentFrame'}]);
        });
    });
});
