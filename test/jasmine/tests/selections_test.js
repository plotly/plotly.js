var Selections = require('../../../src/components/selections');

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');
var Axes = require('../../../src/plots/cartesian/axes');

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('Test selections defaults:', function() {
    'use strict';

    function _supply(layoutIn, layoutOut) {
        layoutOut = layoutOut || {};
        layoutOut._has = Plots._hasPlotType.bind(layoutOut);

        Selections.supplyLayoutDefaults(layoutIn, layoutOut);

        return layoutOut.selections;
    }

    it('should skip non-array containers', function() {
        [null, undefined, {}, 'str', 0, false, true].forEach(function(cont) {
            var msg = '- ' + JSON.stringify(cont);
            var layoutIn = { selections: cont };
            var out = _supply(layoutIn);

            expect(layoutIn.selections).toBe(cont, msg);
            expect(out).toEqual([], msg);
        });
    });

    it('should make non-object item null', function() {
        var selections = [null, undefined, [], 'str', 0, false, true];
        var layoutIn = { selections: selections };
        var out = _supply(layoutIn);

        expect(layoutIn.selections).toEqual(selections);

        out.forEach(function(item) {
            expect(item).toEqual(null);
        });
    });

    it('should drop box selections with insufficient x0, y0, x1, y1 coordinate', function() {
        var fullLayout = {
            xaxis: {type: 'linear', range: [0, 20], _selectionIndices: []},
            yaxis: {type: 'linear', range: [0, 20], _selectionIndices: []},
            _subplots: {xaxis: ['x'], yaxis: ['y']}
        };

        Axes.setConvert(fullLayout.xaxis);
        Axes.setConvert(fullLayout.yaxis);

        var selection1In = {type: 'rect', x0: 0, x1: 1};
        var selection2In = {type: 'rect', y0: 0, y1: 1};

        var layoutIn = {
            selections: [selection1In, selection2In]
        };

        _supply(layoutIn, fullLayout);

        var selection1Out = fullLayout.selections[0];
        var selection2Out = fullLayout.selections[1];

        expect(selection1Out).toBe(null);
        expect(selection2Out).toBe(null);
    });

    it('should not coerce line.color and line.dash when line.width is zero', function() {
        var fullLayout = {
            xaxis: {type: 'linear', range: [0, 1], _selectionIndices: []},
            yaxis: {type: 'log', range: [0, 1], _selectionIndices: []},
            _subplots: {xaxis: ['x'], yaxis: ['y']}
        };

        Axes.setConvert(fullLayout.xaxis);
        Axes.setConvert(fullLayout.yaxis);

        var layoutIn = {
            selections: [{
                type: 'line',
                xref: 'xaxis',
                yref: 'yaxis',
                x0: 0,
                x1: 1,
                y0: 1,
                y1: 10,
                line: {
                    width: 0
                }
            }]
        };

        var selections = _supply(layoutIn, fullLayout);

        expect(selections[0].line.color).toEqual(undefined);
        expect(selections[0].line.dash).toEqual('dot');
    });
});

function countSelectionPathsInGraph() {
    return d3SelectAll('.selectionlayer > path').size();
}

describe('Test selections:', function() {
    'use strict';

    var shapesMock = require('../../image/mocks/shapes.json');
    var mock = Lib.extendDeep({}, shapesMock);
    mock.layout.selections = mock.layout.shapes;
    delete mock.layout.shapes;

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockData = Lib.extendDeep([], mock.data);
        var mockLayout = Lib.extendDeep({}, mock.layout);

        Plotly.newPlot(gd, mockData, mockLayout).then(done);
    });

    afterEach(destroyGraphDiv);

    function countSelections(gd) {
        return gd.layout.selections ?
            gd.layout.selections.length :
            0;
    }

    function getLastSelection(gd) {
        return gd.layout.selections ?
            gd.layout.selections[gd.layout.selections.length - 1] :
            null;
    }

    Lib.seedPseudoRandom();

    function getRandomSelection() {
        return {
            x0: Lib.pseudoRandom(),
            y0: Lib.pseudoRandom(),
            x1: Lib.pseudoRandom(),
            y1: Lib.pseudoRandom()
        };
    }

    describe('Plotly.relayout', function() {
        it('should be able to add a selection', function(done) {
            var index = countSelections(gd);
            var selection = getRandomSelection();

            Plotly.relayout(gd, 'selections[' + index + ']', selection)
            .then(function() {
                expect(getLastSelection(gd)).toEqual(selection);
                expect(countSelections(gd)).toEqual(index + 1);

                // add a selection not at the end of the array
                return Plotly.relayout(gd, 'selections[0]', getRandomSelection());
            })
            .then(function() {
                expect(getLastSelection(gd)).toEqual(selection);
                expect(countSelections(gd)).toEqual(index + 2);
            })
            .then(done, done.fail);
        });

        it('should be able to remove a selection', function(done) {
            var index = countSelections(gd);
            var selection = getRandomSelection();

            Plotly.relayout(gd, 'selections[' + index + ']', selection)
            .then(function() {
                expect(getLastSelection(gd)).toEqual(selection);
                expect(countSelections(gd)).toEqual(index + 1);

                return Plotly.relayout(gd, 'selections[' + index + ']', 'remove');
            })
            .then(function() {
                expect(countSelections(gd)).toEqual(index);

                return Plotly.relayout(gd, 'selections[1]', null);
            })
            .then(function() {
                expect(countSelections(gd)).toEqual(index - 1);
            })
            .then(done, done.fail);
        });

        it('should be able to remove all selections', function(done) {
            Plotly.relayout(gd, { selections: null })
            .then(function() {
                expect(countSelectionPathsInGraph()).toEqual(0);
            })
            .then(function() {
                return Plotly.relayout(gd, {'selections[0]': getRandomSelection()});
            })
            .then(function() {
                expect(countSelectionPathsInGraph()).toEqual(2);
                expect(gd.layout.selections.length).toBe(1);

                return Plotly.relayout(gd, {'selections[0]': null});
            })
            .then(function() {
                expect(countSelectionPathsInGraph()).toEqual(0);
                expect(gd.layout.selections).toBeUndefined();
            })
            .then(done, done.fail);
        });

        it('can replace the selections array', function(done) {
            spyOn(Lib, 'warn');

            Plotly.relayout(gd, { selections: [
                getRandomSelection(),
                getRandomSelection()
            ]})
            .then(function() {
                expect(countSelectionPathsInGraph()).toEqual(4);
                expect(gd.layout.selections.length).toBe(2);
                expect(Lib.warn).not.toHaveBeenCalled();
            })
            .then(done, done.fail);
        });

        it('should be able to update a selection layer', function(done) {
            var index = countSelections(gd);
            var astr = 'selections[' + index + ']';
            var selection = getRandomSelection();

            selection.xref = 'paper';
            selection.yref = 'paper';

            Plotly.relayout(gd, astr, selection).then(function() {
                expect(getLastSelection(gd)).toEqual(selection);
                expect(countSelections(gd)).toEqual(index + 1);
            })
            .then(function() {
                selection.layer = 'below';
                return Plotly.relayout(gd, astr + '.layer', selection.layer);
            })
            .then(function() {
                expect(getLastSelection(gd)).toEqual(selection);
                expect(countSelections(gd)).toEqual(index + 1);
            })
            .then(function() {
                selection.layer = 'above';
                return Plotly.relayout(gd, astr + '.layer', selection.layer);
            })
            .then(function() {
                expect(getLastSelection(gd)).toEqual(selection);
                expect(countSelections(gd)).toEqual(index + 1);
            })
            .then(done, done.fail);
        });
    });
});

describe('Emit plotly_selected when plot a graph that has selections', function() {
    'use strict';

    var gd;
    var points;
    var selections;
    var selectedCnt = 0;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('emit plotly_selected on react calls', function(done) {
        var data = [{y: [1, 2, 3]}];

        Plotly.newPlot(gd, data, {})
        .then(function() {
            gd.on('plotly_selected', function(d) {
                points = d.points;
                selections = d.selections;
                selectedCnt++;
            });
        })
        .then(function() {
            return Plotly.react(gd, data, {
                selections: [{ x0: 0.5, x1: 1.5, y0: 1.5, y1: 2.5}]
            });
        })
        .then(function() {
            expect(selectedCnt).toEqual(1);
            expect(points).not.toBeUndefined();
            expect(selections).not.toBeUndefined();
            expect(selections.length).toEqual(1);
            expect(selections[0].x0).toEqual(0.5);
        })
        .then(function() {
            return Plotly.react(gd, data, {
                selections: [{ x0: 0.5, x1: 1.5, y0: 1.5, y1: 2.5}] // same selections
            });
        })
        .then(function() {
            expect(selectedCnt).toEqual(1);
        })
        .then(function() {
            return Plotly.react(gd, data, {
                selections: [{ x0: 0.25, x1: 1.75, y0: 1.25, y1: 2.25}] // different selections
            });
        })
        .then(function() {
            expect(selectedCnt).toEqual(2);
            expect(points).not.toBeUndefined();
            expect(selections).not.toBeUndefined();
            expect(selections.length).toEqual(1);
            expect(selections[0].x0).toEqual(0.25);
        })
        .then(done, done.fail);
    });
});
