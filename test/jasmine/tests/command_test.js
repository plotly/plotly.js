var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Lib = require('@src/lib');
var Plots = Plotly.Plots;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

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
        describe('astr + val notation', function() {
            describe('with a single attribute', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7]);
                    expect(result).toEqual(['data[0].marker.size', 'data[1].marker.size']);
                });

                it('with an array value and no trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7]]);
                    expect(result).toEqual(['data[0].marker.size', 'data[1].marker.size']);
                });

                it('with trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7, [0]]);
                    expect(result).toEqual(['data[0].marker.size']);
                });

                it('with a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7, [1]]);
                    expect(result).toEqual(['data[1].marker.size']);
                });

                it('with an array value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7], [0]]);
                    expect(result).toEqual(['data[1].marker.size']);
                });

                it('with two array values and two traces specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [0, 1]]);
                    expect(result).toEqual(['data[0].marker.size', 'data[1].marker.size']);
                });

                it('with traces specified in reverse order', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [1, 0]]);
                    expect(result).toEqual(['data[1].marker.size', 'data[0].marker.size']);
                });

                it('with two values and a single trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [0]]);
                    expect(result).toEqual(['data[0].marker.size']);
                });

                it('with two values and a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [1]]);
                    expect(result).toEqual(['data[1].marker.size']);
                });
            });
        });

        describe('aobj notation', function() {
            describe('with a single attribute', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}]);
                    expect(result).toEqual(['data[0].marker.size', 'data[1].marker.size']);
                });

                it('with trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}, [0]]);
                    expect(result).toEqual(['data[0].marker.size']);
                });

                it('with a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}, [1]]);
                    expect(result).toEqual(['data[1].marker.size']);
                });

                it('with an array value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7]}, [0]]);
                    expect(result).toEqual(['data[1].marker.size']);
                });

                it('with two array values and two traces specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [0, 1]]);
                    expect(result).toEqual(['data[0].marker.size', 'data[1].marker.size']);
                });

                it('with traces specified in reverse order', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [1, 0]]);
                    expect(result).toEqual(['data[1].marker.size', 'data[0].marker.size']);
                });

                it('with two values and a single trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [0]]);
                    expect(result).toEqual(['data[0].marker.size']);
                });

                it('with two values and a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [1]]);
                    expect(result).toEqual(['data[1].marker.size']);
                });
            });

            describe('with multiple attributes', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7, 'text.color': 'blue'}]);
                    expect(result).toEqual(['data[0].marker.size', 'data[1].marker.size', 'data[0].text.color', 'data[1].text.color']);
                });
            });
        });
    });
});
