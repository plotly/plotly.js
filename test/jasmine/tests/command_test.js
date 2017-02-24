var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Plots = Plotly.Plots;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var Lib = require('@src/lib');

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

describe('Plots.hasSimpleAPICommandBindings', function() {
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

    it('return the binding when bindings are simple', function() {
        var isSimple = Plots.hasSimpleAPICommandBindings(gd, [{
            method: 'restyle',
            args: [{'marker.size': 10}]
        }, {
            method: 'restyle',
            args: [{'marker.size': 20}]
        }]);

        expect(isSimple).toEqual({
            type: 'data',
            prop: 'marker.size',
            traces: null,
            value: 10
        });
    });

    it('return false when properties are not the same', function() {
        var isSimple = Plots.hasSimpleAPICommandBindings(gd, [{
            method: 'restyle',
            args: [{'marker.size': 10}]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}]
        }]);

        expect(isSimple).toBe(false);
    });

    it('return false when a command binds to more than one property', function() {
        var isSimple = Plots.hasSimpleAPICommandBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10, 'marker.size': 12}]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}]
        }]);

        expect(isSimple).toBe(false);
    });

    it('return false when commands affect different traces', function() {
        var isSimple = Plots.hasSimpleAPICommandBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10}, [0]]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}, [1]]
        }]);

        expect(isSimple).toBe(false);
    });

    it('return the binding when commands affect the same traces', function() {
        var isSimple = Plots.hasSimpleAPICommandBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10}, [1]]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}, [1]]
        }]);

        expect(isSimple).toEqual({
            type: 'data',
            prop: 'marker.color',
            traces: [ 1 ],
            value: [ 10 ]
        });
    });

    it('return the binding when commands affect the same traces in different order', function() {
        var isSimple = Plots.hasSimpleAPICommandBindings(gd, [{
            method: 'restyle',
            args: [{'marker.color': 10}, [1, 2]]
        }, {
            method: 'restyle',
            args: [{'marker.color': 20}, [2, 1]]
        }]);

        // See https://github.com/plotly/plotly.js/issues/1169 for an example of where
        // this logic was a little too sophisticated. It's better to bail out and omit
        // functionality than to get it wrong.
        expect(isSimple).toEqual(false);

        /* expect(isSimple).toEqual({
            type: 'data',
            prop: 'marker.color',
            traces: [ 1, 2 ],
            value: [ 10, 10 ]
        });*/
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
                    expect(result).toEqual([{prop: 'marker.size', traces: null, type: 'data', value: 7}]);
                });

                it('with an array value and no trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data', value: [7]}]);
                });

                it('with trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7, [0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data', value: [7]}]);
                });

                it('with a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', 7, [0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data', value: [7]}]);
                });

                it('with an array value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7], [1]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [1], type: 'data', value: [7]}]);
                });

                it('with two array values and two traces specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [0, 1]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0, 1], type: 'data', value: [7, 5]}]);
                });

                it('with traces specified in reverse order', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [1, 0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [1, 0], type: 'data', value: [7, 5]}]);
                });

                it('with two values and a single trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [0]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [0], type: 'data', value: [7]}]);
                });

                it('with two values and a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', ['marker.size', [7, 5], [1]]);
                    expect(result).toEqual([{prop: 'marker.size', traces: [1], type: 'data', value: [7]}]);
                });
            });
        });


        describe('with aobj notation', function() {
            describe('and a single attribute', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: null, value: 7}]);
                });

                it('with trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}, [0]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [0], value: [7]}]);
                });

                it('with a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7}, [1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1], value: [7]}]);
                });

                it('with an array value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7]}, [1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1], value: [7]}]);
                });

                it('with two array values and two traces specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [0, 1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [0, 1], value: [7, 5]}]);
                });

                it('with traces specified in reverse order', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [1, 0]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1, 0], value: [7, 5]}]);
                });

                it('with two values and a single trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [0]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [0], value: [7]}]);
                });

                it('with two values and a different trace specified', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': [7, 5]}, [1]]);
                    expect(result).toEqual([{type: 'data', prop: 'marker.size', traces: [1], value: [7]}]);
                });
            });

            describe('and multiple attributes', function() {
                it('with a scalar value', function() {
                    var result = Plots.computeAPICommandBindings(gd, 'restyle', [{'marker.size': 7, 'text.color': 'blue'}]);
                    expect(result).toEqual([
                        {type: 'data', prop: 'marker.size', traces: null, value: 7},
                        {type: 'data', prop: 'text.color', traces: null, value: 'blue'}
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
                    {type: 'data', prop: 'y', traces: [0], value: [[3, 4, 5]]},
                    {type: 'data', prop: 'marker.size', traces: [0, 1], value: [10, 20]},
                    {type: 'data', prop: 'line.color', traces: null, value: 'red'},
                    {type: 'data', prop: 'line.width', traces: [0, 1], value: [2, 8]}
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
                    {type: 'data', prop: 'y', traces: [1], value: [[3, 4, 5]]},
                    {type: 'data', prop: 'marker.size', traces: [1, 0], value: [10, 20]},

                    // This result is actually not quite correct. Setting `line` should override
                    // this—or actually it's technically undefined since the iteration order of
                    // objects is not strictly defined but is at least consistent across browsers.
                    // The worst-case scenario right now isn't too bad though since it's an obscure
                    // case that will definitely cause bailout anyway before any bindings would
                    // happen.
                    {type: 'data', prop: 'line.color', traces: [1, 0], value: ['red', 'red']},

                    {type: 'data', prop: 'line.width', traces: [1, 0], value: [2, 8]}
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
                    {type: 'data', prop: 'y', traces: [1], value: [[3, 4, 5]]},
                    {type: 'data', prop: 'marker.size', traces: [1], value: [10]},
                    {type: 'data', prop: 'line.color', traces: [1], value: ['red']},
                    {type: 'data', prop: 'line.width', traces: [1], value: [2]}
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
                expect(result).toEqual([{type: 'layout', prop: 'height', value: 500}]);
            });

            it('and two attributes', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', [{height: 500, width: 100}]);
                expect(result).toEqual([{type: 'layout', prop: 'height', value: 500}, {type: 'layout', prop: 'width', value: 100}]);
            });
        });

        describe('with astr + val notation', function() {
            it('and an attribute', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', ['width', 100]);
                expect(result).toEqual([{type: 'layout', prop: 'width', value: 100}]);
            });

            it('and nested atributes', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', ['margin.l', 10]);
                expect(result).toEqual([{type: 'layout', prop: 'margin.l', value: 10}]);
            });
        });

        describe('with mixed notation', function() {
            it('containing aob + astr', function() {
                var result = Plots.computeAPICommandBindings(gd, 'relayout', [{
                    'width': 100,
                    'margin.l': 10
                }]);
                expect(result).toEqual([
                    {type: 'layout', prop: 'width', value: 100},
                    {type: 'layout', prop: 'margin.l', value: 10}
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
                {type: 'data', prop: 'y', traces: [1], value: [[3, 4, 5]]},
                {type: 'data', prop: 'marker.size', traces: [1], value: [10]},
                {type: 'data', prop: 'line.color', traces: [1], value: ['red']},
                {type: 'data', prop: 'line.width', traces: [1], value: [2]},
                {type: 'layout', prop: 'margin.l', value: 50},
                {type: 'layout', prop: 'width', value: 10}
            ]);
        });
    });

    describe('animate', function() {
        it('binds to the frame for a simple animate command', function() {
            var result = Plots.computeAPICommandBindings(gd, 'animate', [['framename']]);

            expect(result).toEqual([{type: 'layout', prop: '_currentFrame', value: 'framename'}]);
        });

        it('treats numeric frame names as strings', function() {
            var result = Plots.computeAPICommandBindings(gd, 'animate', [[8]]);

            expect(result).toEqual([{type: 'layout', prop: '_currentFrame', value: '8'}]);
        });

        it('binds to nothing for a multi-frame animate command', function() {
            var result = Plots.computeAPICommandBindings(gd, 'animate', [['frame1', 'frame2']]);

            expect(result).toEqual([]);
        });
    });
});

describe('component bindings', function() {
    'use strict';

    var gd;
    var mock = require('@mocks/binding.json');

    beforeEach(function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        gd = createGraphDiv();

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        destroyGraphDiv(gd);
    });

    it('creates an observer', function(done) {
        var count = 0;
        Plots.manageCommandObserver(gd, {}, [
            { method: 'restyle', args: ['marker.color', 'red'] },
            { method: 'restyle', args: ['marker.color', 'green'] }
        ], function(data) {
            count++;
            expect(data.index).toEqual(1);
        });

        // Doesn't trigger the callback:
        Plotly.relayout(gd, 'width', 400).then(function() {
            // Triggers the callback:
            return Plotly.restyle(gd, 'marker.color', 'green');
        }).then(function() {
            // Doesn't trigger a callback:
            return Plotly.restyle(gd, 'marker.width', 8);
        }).then(function() {
            expect(count).toEqual(1);
        }).catch(fail).then(done);
    });

    it('logs a warning if unable to create an observer', function() {
        var warnings = 0;
        spyOn(Lib, 'warn').and.callFake(function() {
            warnings++;
        });

        Plots.manageCommandObserver(gd, {}, [
            { method: 'restyle', args: ['marker.color', 'red'] },
            { method: 'restyle', args: [{'line.color': 'green', 'marker.color': 'green'}] }
        ]);

        expect(warnings).toEqual(1);
    });

    it('udpates bound components when the value changes', function(done) {
        expect(gd.layout.sliders[0].active).toBe(0);

        Plotly.restyle(gd, 'marker.color', 'blue').then(function() {
            expect(gd.layout.sliders[0].active).toBe(4);
        }).catch(fail).then(done);
    });

    it('does not update the component if the value is not present', function(done) {
        expect(gd.layout.sliders[0].active).toBe(0);

        Plotly.restyle(gd, 'marker.color', 'black').then(function() {
            expect(gd.layout.sliders[0].active).toBe(0);
        }).catch(fail).then(done);
    });

    it('udpates bound components when the computed value changes', function(done) {
        expect(gd.layout.sliders[0].active).toBe(0);

        // The default line color comes from the marker color, if specified.
        // That is, the fact that the marker color changes is just incidental, but
        // nonetheless is bound by value to the component.
        Plotly.restyle(gd, 'line.color', 'blue').then(function() {
            expect(gd.layout.sliders[0].active).toBe(4);
        }).catch(fail).then(done);
    });
});

describe('attaching component bindings', function() {
    'use strict';
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();
        Plotly.plot(gd, [{x: [1, 2, 3], y: [1, 2, 3]}]).then(done);
    });

    afterEach(function() {
        destroyGraphDiv(gd);
    });

    it('attaches and updates bindings for sliders', function(done) {
        expect(gd._internalEv._events.plotly_animatingframe).toBeUndefined();

        Plotly.relayout(gd, {
            sliders: [{
                // This one gets bindings:
                steps: [
                    {label: 'first', method: 'restyle', args: ['marker.color', 'red']},
                    {label: 'second', method: 'restyle', args: ['marker.color', 'blue']},
                ]
            }, {
                // This one does *not*:
                steps: [
                    {label: 'first', method: 'restyle', args: ['line.color', 'red']},
                    {label: 'second', method: 'restyle', args: ['marker.color', 'blue']},
                ]
            }]
        }).then(function() {
            // Check that it has attached a listener:
            expect(typeof gd._internalEv._events.plotly_animatingframe).toBe('function');

            // Confirm the first position is selected:
            expect(gd.layout.sliders[0].active).toBeUndefined();

            // Modify the plot
            return Plotly.restyle(gd, {'marker.color': 'blue'});
        }).then(function() {
            // Confirm that this has changed the slider position:
            expect(gd.layout.sliders[0].active).toBe(1);

            // Swap the values of the components:
            return Plotly.relayout(gd, {
                'sliders[0].steps[0].args[1]': 'green',
                'sliders[0].steps[1].args[1]': 'red'
            });
        }).then(function() {
            return Plotly.restyle(gd, {'marker.color': 'green'});
        }).then(function() {
            // Confirm that the lookup table has been updated:
            expect(gd.layout.sliders[0].active).toBe(0);

            // Check that it still has one attached listener:
            expect(typeof gd._internalEv._events.plotly_animatingframe).toBe('function',
                gd._internalEv._events.plotly_animatingframe);

            // Change this to a non-simple binding:
            return Plotly.relayout(gd, {'sliders[0].steps[0].args[0]': 'line.color'});
        }).then(function() {
            // Bindings are no longer simple, so check to ensure they have
            // been removed
            expect(gd._internalEv._events.plotly_animatingframe).toBeUndefined();
        }).catch(fail).then(done);
    });

    it('attaches and updates bindings for updatemenus', function(done) {
        expect(gd._internalEv._events.plotly_animatingframe).toBeUndefined();

        Plotly.relayout(gd, {
            updatemenus: [{
                // This one gets bindings:
                buttons: [
                    {label: 'first', method: 'restyle', args: ['marker.color', 'red']},
                    {label: 'second', method: 'restyle', args: ['marker.color', 'blue']},
                ]
            }, {
                // This one does *not*:
                buttons: [
                    {label: 'first', method: 'restyle', args: ['line.color', 'red']},
                    {label: 'second', method: 'restyle', args: ['marker.color', 'blue']},
                ]
            }]
        }).then(function() {
            // Check that it has attached a listener:
            expect(typeof gd._internalEv._events.plotly_animatingframe).toBe('function');

            // Confirm the first position is selected:
            expect(gd.layout.updatemenus[0].active).toBeUndefined();

            // Modify the plot
            return Plotly.restyle(gd, {'marker.color': 'blue'});
        }).then(function() {
            // Confirm that this has changed the slider position:
            expect(gd.layout.updatemenus[0].active).toBe(1);

            // Swap the values of the components:
            return Plotly.relayout(gd, {
                'updatemenus[0].buttons[0].args[1]': 'green',
                'updatemenus[0].buttons[1].args[1]': 'red'
            });
        }).then(function() {
            return Plotly.restyle(gd, {'marker.color': 'green'});
        }).then(function() {
            // Confirm that the lookup table has been updated:
            expect(gd.layout.updatemenus[0].active).toBe(0);

            // Check that it still has one attached listener:
            expect(typeof gd._internalEv._events.plotly_animatingframe).toBe('function');

            // Change this to a non-simple binding:
            return Plotly.relayout(gd, {'updatemenus[0].buttons[0].args[0]': 'line.color'});
        }).then(function() {
            // Bindings are no longer simple, so check to ensure they have
            // been removed
            expect(gd._internalEv._events.plotly_animatingframe).toBeUndefined();
        }).catch(fail).then(done);
    });
});
