var Selections = require('@src/components/selections');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var Axes = require('@src/plots/cartesian/axes');

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

    it('should make non-object item visible: false', function() {
        var selections = [null, undefined, [], 'str', 0, false, true];
        var layoutIn = { selections: selections };
        var out = _supply(layoutIn);

        expect(layoutIn.selections).toEqual(selections);

        out.forEach(function(item, i) {
            expect(item).toEqual(jasmine.objectContaining({
                visible: false,
                _index: i
            }));
        });
    });

    it('should provide the right defaults on all axis types', function() {
        var fullLayout = {
            xaxis: {type: 'linear', range: [0, 20], _selectionIndices: []},
            yaxis: {type: 'log', range: [1, 5], _selectionIndices: []},
            xaxis2: {type: 'date', range: ['2006-06-05', '2006-06-09'], _selectionIndices: []},
            yaxis2: {type: 'category', range: [-0.5, 7.5], _selectionIndices: []},
            _subplots: {xaxis: ['x', 'x2'], yaxis: ['y', 'y2']}
        };

        Axes.setConvert(fullLayout.xaxis);
        Axes.setConvert(fullLayout.yaxis);
        Axes.setConvert(fullLayout.xaxis2);
        Axes.setConvert(fullLayout.yaxis2);

        var selection1In = {type: 'rect'};
        var selection2In = {type: 'circle', xref: 'x2', yref: 'y2'};

        var layoutIn = {
            selections: [selection1In, selection2In]
        };

        _supply(layoutIn, fullLayout);

        var selection1Out = fullLayout.selections[0];
        var selection2Out = fullLayout.selections[1];

        // default positions are 1/4 and 3/4 of the full range of that axis
        expect(selection1Out.x0).toBe(5);
        expect(selection1Out.x1).toBe(15);

        // selections use data values for log axes (like everyone will in V3.0)
        expect(selection1Out.y0).toBeWithin(100, 0.001);
        expect(selection1Out.y1).toBeWithin(10000, 0.001);

        // date strings also interpolate
        expect(selection2Out.x0).toBe('2006-06-06');
        expect(selection2Out.x1).toBe('2006-06-08');

        // categories must use serial numbers to get continuous values
        expect(selection2Out.y0).toBeWithin(1.5, 0.001);
        expect(selection2Out.y1).toBeWithin(5.5, 0.001);
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

    var shapesMock = require('@mocks/shapes.json');
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

                return Plotly.relayout(gd, 'selections[2].visible', false);
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
