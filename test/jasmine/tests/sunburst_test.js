var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');
var constants = require('@src/traces/sunburst/constants');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var d3Transition = require('../../strict-d3').transition;
var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var delay = require('../assets/delay');


var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var checkTextTemplate = require('../assets/check_texttemplate');

var SLICES_TEXT_SELECTOR = '.sunburstlayer text.slicetext';

function _mouseEvent(type, gd, v) {
    return function() {
        if(Array.isArray(v)) {
            // px-based position
            mouseEvent(type, v[0], v[1]);
        } else {
            // position from slice number
            var gd3 = d3Select(gd);
            var el = gd3.select('.slice:nth-child(' + v + ')').node();
            mouseEvent(type, 0, 0, {element: el});
        }
    };
}

function hover(gd, v) {
    return _mouseEvent('mouseover', gd, v);
}

function unhover(gd, v) {
    return _mouseEvent('mouseout', gd, v);
}

function click(gd, v) {
    return _mouseEvent('click', gd, v);
}

describe('Test sunburst defaults:', function() {
    var gd;
    var fullData;

    function _supply(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'sunburst'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
        fullData = gd._fullData;
    }

    it('should set *visible:false* when *labels* or *parents* is missing', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1]},
            {parents: ['']}
        ]);

        expect(fullData[0].visible).toBe(true, 'base');
        expect(fullData[1].visible).toBe(false, 'no parents');
        expect(fullData[2].visible).toBe(false, 'no labels');
    });

    it('should only coerce *count* when the *values* array is not present', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1], parents: [''], values: []},
            {labels: [1], parents: [''], values: [1]}
        ]);

        expect(fullData[0].count).toBe('leaves');
        expect(fullData[1].count).toBe('leaves', 'has empty values');
        expect(fullData[2].count).toBe(undefined, 'has values');
    });

    it('should not coerce *branchvalues* when *values* is not set', function() {
        _supply([
            {labels: [1], parents: [''], values: [1]},
            {labels: [1], parents: ['']},
        ]);

        expect(fullData[0].branchvalues).toBe('remainder', 'base');
        expect(fullData[1].branchvalues).toBe(undefined, 'no values');
    });

    it('should use *paper_bgcolor* as *marker.line.color* default', function() {
        _supply([
            {labels: [1], parents: [''], marker: {line: {color: 'red'}}},
            {labels: [1], parents: ['']}
        ], {
            paper_bgcolor: 'orange'
        });

        expect(fullData[0].marker.line.color).toBe('red', 'set color');
        expect(fullData[1].marker.line.color).toBe('orange', 'using dflt');
    });

    it('should not coerce *marker.line.color* when *marker.line.width* is 0', function() {
        _supply([
            {labels: [1], parents: [''], marker: {line: {width: 0}}},
            {labels: [1], parents: ['']}
        ]);

        expect(fullData[0].marker.line.color).toBe(undefined, 'not coerced');
        expect(fullData[1].marker.line.color).toBe('#fff', 'dflt');
    });

    it('should default *leaf.opacity* depending on a *colorscale* being present or not', function() {
        _supply([
            {labels: [1], parents: ['']},
            {labels: [1], parents: [''], marker: {colorscale: 'Blues'}}
        ]);

        expect(fullData[0].leaf.opacity).toBe(0.7, 'without colorscale');
        expect(fullData[1].leaf.opacity).toBe(1, 'with colorscale');
    });

    it('should include "text" flag in *textinfo* when *text* is set', function() {
        _supply([
            {labels: [1], parents: [''], text: ['A']},
            {labels: [1], parents: ['']}
        ]);

        expect(fullData[0].textinfo).toBe('text+label', 'with text');
        expect(fullData[1].textinfo).toBe('label', 'no text');
    });

    it('should use *layout.colorway* as dflt for *sunburstcolorway*', function() {
        _supply([
            {labels: [1], parents: ['']}
        ], {
            colorway: ['red', 'blue', 'green']
        });
        expect(gd._fullLayout.sunburstcolorway)
            .toEqual(['red', 'blue', 'green'], 'dflt to layout colorway');

        _supply([
            {labels: [1], parents: ['']}
        ], {
            colorway: ['red', 'blue', 'green'],
            sunburstcolorway: ['cyan', 'yellow', 'black']
        });
        expect(gd._fullLayout.sunburstcolorway)
            .toEqual(['cyan', 'yellow', 'black'], 'user-defined value');
    });

    it('should not default *marker.colorscale* when *marker.colors* is not present', function() {
        _supply([
            {labels: [1], parents: ['']}
        ]);

        expect(fullData[0].marker.colorscale).toBe(undefined);
    });

    it('should default *marker.colorscale* to *Reds* when *marker.colors* is present', function() {
        _supply([
            {labels: [1], parents: [''], marker: {
                colors: [0]
            }}
        ]);

        expect(fullData[0].marker.colorscale).toBeCloseToArray([
            [ 0, 'rgb(5,10,172)' ],
            [ 0.35, 'rgb(106,137,247)' ],
            [ 0.5, 'rgb(190,190,190)' ],
            [ 0.6, 'rgb(220,170,132)' ],
            [ 0.7, 'rgb(230,145,90)' ],
            [ 1, 'rgb(178,10,28)' ]
        ]);
    });
});

describe('Test sunburst calc:', function() {
    var gd;

    beforeEach(function() {
        spyOn(Lib, 'warn');
    });

    function _calc(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'sunburst'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
        Plots.doCalcdata(gd);
    }

    function extract(k) {
        var out = gd.calcdata.map(function(cd) {
            return cd.map(function(pt) { return pt[k]; });
        });
        return out.length > 1 ? out : out[0];
    }

    function extractPt(k) {
        var out = gd.calcdata.map(function(cd) {
            return cd[0].hierarchy.descendants().map(function(pt) {
                return Lib.nestedProperty(pt, k).get();
            });
        });
        return out.length > 1 ? out : out[0];
    }

    it('should generate *id* when it can', function() {
        _calc({
            labels: ['Root', 'A', 'B', 'b'],
            parents: ['', 'Root', 'Root', 'B']
        });

        expect(extract('id')).toEqual(['Root', 'A', 'B', 'b']);
        expect(Lib.warn).toHaveBeenCalledTimes(0);
    });

    it('should generate "implied root" when it can', function() {
        _calc({
            labels: [ 'A', 'B', 'b'],
            parents: ['Root', 'Root', 'B']
        });

        expect(extract('id')).toEqual(['Root', 'A', 'B', 'b']);
        expect(extract('pid')).toEqual(['', 'Root', 'Root', 'B']);
        expect(extract('label')).toEqual(['Root', 'A', 'B', 'b']);
        expect(Lib.warn).toHaveBeenCalledTimes(0);
    });

    it('should warn when there are multiple implied roots', function() {
        _calc({
            labels: [ 'A', 'B', 'b'],
            parents: ['Root1', 'Root22', 'B']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Multiple implied roots, cannot build sunburst hierarchy of trace 0. These roots include: Root1, Root22');
    });

    it('should generate "root of roots" when it can', function() {
        spyOn(Lib, 'randstr').and.callFake(function() {
            return 'dummy';
        });

        _calc({
            labels: [ 'A', 'B', 'b'],
            parents: ['', '', 'B']
        });

        expect(extract('id')).toEqual(['dummy', 'A', 'B', 'b']);
        expect(extract('pid')).toEqual(['', 'dummy', 'dummy', 'B']);
        expect(extract('label')).toEqual(['', 'A', 'B', 'b']);
    });

    it('should compute hierarchy values', function() {
        var labels = ['Root', 'A', 'B', 'b'];
        var parents = ['', 'Root', 'Root', 'B'];

        _calc([
            {labels: labels, parents: parents, count: 'leaves+branches'},
            {labels: labels, parents: parents, count: 'branches'},
            {labels: labels, parents: parents}, // N.B. counts 'leaves' in this case
            {labels: labels, parents: parents, values: [0, 1, 2, 3]},
            {labels: labels, parents: parents, values: [30, 20, 10, 5], branchvalues: 'total'}
        ]);

        expect(extractPt('value')).toEqual([
            [4, 2, 1, 1],
            [2, 1, 0, 0],
            [2, 1, 1, 1],
            [6, 5, 1, 3],
            [30, 20, 10, 5]
        ]);
        expect(Lib.warn).toHaveBeenCalledTimes(0);
    });

    it('should warn when values under *branchvalues:total* do not add up and not show trace', function() {
        _calc({
            labels: ['Root', 'A', 'B', 'b'],
            parents: ['', 'Root', 'Root', 'B'],
            values: [0, 1, 2, 3],
            branchvalues: 'total'
        });

        expect(gd.calcdata[0][0].hierarchy).toBe(undefined, 'no computed hierarchy');

        expect(Lib.warn).toHaveBeenCalledTimes(2);
        expect(Lib.warn.calls.allArgs()[0][0]).toBe('Total value for node Root of trace 0 is smaller than the sum of its children. \nparent value = 0 \nchildren sum = 3');
        expect(Lib.warn.calls.allArgs()[1][0]).toBe('Total value for node B of trace 0 is smaller than the sum of its children. \nparent value = 2 \nchildren sum = 3');
    });

    it('should warn labels/parents lead to ambiguous hierarchy', function() {
        _calc({
            labels: ['Root', 'A', 'A', 'B'],
            parents: ['', 'Root', 'Root', 'A']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build sunburst hierarchy of trace 0. Error: ambiguous: A');
    });

    it('should warn ids/parents lead to ambiguous hierarchy', function() {
        _calc({
            labels: ['label 1', 'label 2', 'label 3', 'label 4'],
            ids: ['a', 'b', 'b', 'c'],
            parents: ['', 'a', 'a', 'b']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build sunburst hierarchy of trace 0. Error: ambiguous: b');
    });

    it('should accept numbers (even `0`) are ids/parents items', function() {
        _calc({
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            ids: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            parents: ['', 0, 0, 2, 2, 0, 0, 6, 0]
        });

        expect(extract('id')).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
        expect(extract('pid')).toEqual(['', '0', '0', '2', '2', '0', '0', '6', '0']);
    });

    it('should accept mix typed are ids/parents items', function() {
        _calc({
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            ids: [true, 1, '2', 3, 4, 5, 6, 7, 8],
            parents: ['', true, true, 2, 2, 'true', 'true', '6', true]
        });

        expect(extract('id')).toEqual(['true', '1', '2', '3', '4', '5', '6', '7', '8']);
        expect(extract('pid')).toEqual(['', 'true', 'true', '2', '2', 'true', 'true', '6', 'true']);
    });

    it('should compute correct sector *value* for generated implied root', function() {
        _calc([{
            labels: [ 'A', 'B', 'b'],
            parents: ['Root', 'Root', 'B'],
            values: [1, 2, 1],
            branchvalues: 'remainder'
        }, {
            labels: [ 'A', 'B', 'b'],
            parents: ['Root', 'Root', 'B'],
            values: [1, 2, 1],
            branchvalues: 'total'
        }]);

        expect(extractPt('data.data.id')).toEqual([
            ['Root', 'B', 'A', 'b'],
            ['Root', 'B', 'A', 'b']
        ]);
        expect(extractPt('value')).toEqual([
            [4, 3, 1, 1],
            [3, 2, 1, 1]
        ]);
    });

    it('should compute correct sector *value* for generated "root of roots"', function() {
        spyOn(Lib, 'randstr').and.callFake(function() { return 'dummy'; });

        _calc([{
            labels: [ 'A', 'B', 'b'],
            parents: ['', '', 'B'],
            values: [1, 2, 1],
            branchvalues: 'remainder'
        }, {
            labels: [ 'A', 'B', 'b'],
            parents: ['', '', 'B'],
            values: [1, 2, 1],
            branchvalues: 'total'
        }]);

        expect(extractPt('data.data.id')).toEqual([
            ['dummy', 'B', 'A', 'b'],
            ['dummy', 'B', 'A', 'b']
        ]);
        expect(extractPt('value')).toEqual([
            [4, 3, 1, 1],
            [3, 2, 1, 1]
        ]);
    });

    it('should use *marker.colors*', function() {
        _calc({
            marker: { colors: ['pink', '#777', '#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#fff'] },
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve']
        });

        var cd = gd.calcdata[0];
        expect(cd.length).toEqual(9);
        expect(cd[0].color).toEqual('rgba(255, 192, 203, 1)');
        expect(cd[1].color).toEqual('rgba(119, 119, 119, 1)');
        expect(cd[2].color).toEqual('rgba(255, 0, 0, 1)');
        expect(cd[3].color).toEqual('rgba(255, 255, 0, 1)');
        expect(cd[4].color).toEqual('rgba(0, 255, 0, 1)');
        expect(cd[5].color).toEqual('rgba(0, 255, 255, 1)');
        expect(cd[6].color).toEqual('rgba(0, 0, 255, 1)');
        expect(cd[7].color).toEqual('rgba(255, 0, 255, 1)');
        expect(cd[8].color).toEqual('rgba(255, 255, 255, 1)');
    });

    it('should use *marker.colors* numbers with default colorscale', function() {
        _calc({
            marker: { colors: [-4, -3, -2, -1, 0, 1, 2, 3, 4] },
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve']
        });

        var cd = gd.calcdata[0];
        expect(cd.length).toEqual(9);
        expect(cd[0].color).toEqual('rgb(5, 10, 172)');
        expect(cd[1].color).toEqual('rgb(41, 55, 199)');
        expect(cd[2].color).toEqual('rgb(77, 101, 226)');
        expect(cd[3].color).toEqual('rgb(120, 146, 238)');
        expect(cd[4].color).toEqual('rgb(190, 190, 190)');
        expect(cd[5].color).toEqual('rgb(223, 164, 122)');
        expect(cd[6].color).toEqual('rgb(221, 123, 80)');
        expect(cd[7].color).toEqual('rgb(200, 66, 54)');
        expect(cd[8].color).toEqual('rgb(178, 10, 28)');
    });

    it('should use *marker.colors* numbers with desired colorscale', function() {
        _calc({
            marker: { colors: [1, 2, 3, 4, 5, 6, 7, 8, 9], colorscale: 'Portland' },
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve']
        });

        var cd = gd.calcdata[0];
        expect(cd.length).toEqual(9);
        expect(cd[0].color).toEqual('rgb(12, 51, 131)');
        expect(cd[1].color).toEqual('rgb(11, 94, 159)');
        expect(cd[2].color).toEqual('rgb(10, 136, 186)');
        expect(cd[3].color).toEqual('rgb(126, 174, 121)');
        expect(cd[4].color).toEqual('rgb(242, 211, 56)');
        expect(cd[5].color).toEqual('rgb(242, 177, 56)');
        expect(cd[6].color).toEqual('rgb(242, 143, 56)');
        expect(cd[7].color).toEqual('rgb(230, 87, 43)');
        expect(cd[8].color).toEqual('rgb(217, 30, 30)');
    });

    it('should use *marker.colors* numbers not values with colorscale', function() {
        _calc({
            values: [0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000],
            marker: { colors: [1, 2, 3, 4, 5, 6, 7, 8, 9], colorscale: 'Portland' },
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve']
        });

        var cd = gd.calcdata[0];
        expect(cd.length).toEqual(9);
        expect(cd[0].color).toEqual('rgb(12, 51, 131)');
        expect(cd[1].color).toEqual('rgb(11, 94, 159)');
        expect(cd[2].color).toEqual('rgb(10, 136, 186)');
        expect(cd[3].color).toEqual('rgb(126, 174, 121)');
        expect(cd[4].color).toEqual('rgb(242, 211, 56)');
        expect(cd[5].color).toEqual('rgb(242, 177, 56)');
        expect(cd[6].color).toEqual('rgb(242, 143, 56)');
        expect(cd[7].color).toEqual('rgb(230, 87, 43)');
        expect(cd[8].color).toEqual('rgb(217, 30, 30)');
    });

    it('should use values with colorscale when *marker.colors* in empty', function() {
        _calc({
            values: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            marker: { colors: [], colorscale: 'Portland' },
            labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
            parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve']
        });

        var cd = gd.calcdata[0];
        expect(cd.length).toEqual(9);
        expect(cd[0].color).toEqual('rgb(12, 51, 131)');
        expect(cd[1].color).toEqual('rgb(11, 94, 159)');
        expect(cd[2].color).toEqual('rgb(10, 136, 186)');
        expect(cd[3].color).toEqual('rgb(126, 174, 121)');
        expect(cd[4].color).toEqual('rgb(242, 211, 56)');
        expect(cd[5].color).toEqual('rgb(242, 177, 56)');
        expect(cd[6].color).toEqual('rgb(242, 143, 56)');
        expect(cd[7].color).toEqual('rgb(230, 87, 43)');
        expect(cd[8].color).toEqual('rgb(217, 30, 30)');
    });
});

describe('Test sunburst hover:', function() {
    var gd;

    var labels0 = ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'];
    var parents0 = ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve'];
    var values0 = [10, 14, 12, 10, 2, 6, 6, 1, 4];

    afterEach(destroyGraphDiv);

    function run(spec) {
        gd = createGraphDiv();

        var data = (spec.traces || [{}]).map(function(t) {
            t.type = 'sunburst';
            if(!t.labels) t.labels = labels0.slice();
            if(!t.parents) t.parents = parents0.slice();
            return t;
        });

        var layout = Lib.extendFlat({
            width: 500,
            height: 500,
            margin: {t: 0, b: 0, l: 0, r: 0, pad: 0}
        }, spec.layout || {});

        var exp = spec.exp || {};
        var ptData = null;

        return Plotly.newPlot(gd, data, layout)
            .then(function() {
                gd.once('plotly_hover', function(d) { ptData = d.points[0]; });
            })
            .then(hover(gd, spec.pos))
            .then(function() {
                assertHoverLabelContent(exp.label);

                for(var k in exp.ptData) {
                    expect(ptData[k]).toBe(exp.ptData[k], 'pt event data key ' + k);
                }

                if(exp.style) {
                    var gd3 = d3Select(gd);
                    assertHoverLabelStyle(gd3.select('.hovertext'), exp.style);
                }
            });
    }

    [{
        desc: 'base',
        pos: 2,
        exp: {
            label: {
                nums: 'Seth',
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 2,
                label: 'Seth',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with scalar hovertext',
        traces: [{ hovertext: 'A' }],
        pos: 3,
        exp: {
            label: {
                nums: 'Cain\nA',
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 1,
                label: 'Cain',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with array hovertext',
        traces: [{
            hovertext: values0,
            hoverinfo: 'all'
        }],
        pos: 4,
        exp: {
            label: {
                nums: 'Abel\nEve/\n17% of Eve\n6',
                name: 'trace 0'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with hoverlabel.namelength set ',
        traces: [{
            hoverlabel: {namelength: 4},
            hoverinfo: 'all'
        }],
        pos: 4,
        exp: {
            label: {
                nums: 'Abel\nEve/\n17% of Eve',
                name: 't...'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve'
            }
        }
    }, {
        desc: 'with values',
        traces: [{
            values: values0,
            hoverinfo: 'value'
        }],
        pos: 5,
        exp: {
            label: {
                nums: '6'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve',
                value: 6
            }
        }
    }, {
        desc: 'with values and hovertemplate',
        traces: [{
            values: values0,
            hovertemplate: '%{label} :: %{value:.2f}<extra><b>N.B.</b></extra>'
        }],
        pos: 5,
        exp: {
            label: {
                nums: 'Abel :: 6.00',
                name: '<tspan style="font-weight:bold">N.B.</tspan>'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 5,
                label: 'Abel',
                parent: 'Eve',
                value: 6
            }
        }
    }, {
        desc: 'with array hovertemplate and label styling',
        traces: [{
            hovertemplate: parents0.map(function(p) {
                return p ?
                    '%{label} -| %{parent}<extra></extra>' :
                    '%{label}<extra>THE ROOT</extra>';
            }),
            hoverlabel: {
                bgcolor: 'red',
                bordercolor: 'blue',
                font: {
                    size: 20,
                    family: 'Roboto',
                    color: 'orange'
                }
            }
        }],
        pos: 1,
        exp: {
            label: {
                nums: 'Eve',
                name: 'THE ROOT'
            },
            style: {
                bgcolor: 'rgb(255, 0, 0)',
                bordercolor: 'rgb(0, 0, 255)',
                fontSize: 20,
                fontFamily: 'Roboto',
                fontColor: 'rgb(255, 165, 0)'
            },
            ptData: {
                curveNumber: 0,
                pointNumber: 0,
                label: 'Eve',
                parent: ''
            }
        }
    }]
    .forEach(function(spec) {
        it('should generate correct hover labels and event data - ' + spec.desc, function(done) {
            run(spec).then(done, done.fail);
        });
    });
});

describe('Test sunburst hover lifecycle:', function() {
    var gd;
    var hoverData;
    var unhoverData;
    var hoverCnt;
    var unhoverCnt;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    function setupListeners() {
        hoverData = null;
        unhoverData = null;
        hoverCnt = 0;
        unhoverCnt = 0;

        return function() {
            gd.on('plotly_hover', function(d) {
                hoverData = d;
                hoverCnt++;
            });
            gd.on('plotly_unhover', function(d) {
                unhoverData = d;
                unhoverCnt++;
            });
        };
    }

    it('should fire the correct events', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.newPlot(gd, mock)
        .then(setupListeners())
        .then(hover(gd, 1))
        .then(function() {
            if(hoverCnt === 1) {
                expect(hoverData.event).toBeDefined();
                expect(hoverData.points[0].label).toBe('Eve');
            } else {
                fail('did not trigger correct # of plotly_hover events');
            }

            if(unhoverCnt) {
                fail('should not have triggered plotly_unhover');
            }
        })
        .then(unhover(gd, 1))
        .then(hover(gd, 2))
        .then(function() {
            if(hoverCnt === 2) {
                expect(hoverData.event).toBeDefined();
                expect(hoverData.points[0].label).toBe('Seth');
            } else {
                fail('did not trigger correct # of plotly_hover events');
            }

            if(unhoverCnt === 1) {
                expect(unhoverData.event).toBeDefined();
                expect(unhoverData.points[0].label).toBe('Eve');
            } else {
                fail('did not trigger correct # of plotly_unhover events');
            }
        })
        .then(done, done.fail);
    });
});

describe('Test sunburst clicks:', function() {
    var gd;
    var trackers;

    beforeEach(function() {
        gd = createGraphDiv();
        trackers = {};
    });

    afterEach(destroyGraphDiv);

    function setupListeners(opts) {
        opts = opts || {};

        trackers.sunburstclick = [];
        trackers.click = [];
        trackers.animating = [];

        // use `.unshift` that way to latest event data object
        // will be in entry [0], which is easier to pick out

        return function() {
            gd.on('plotly_sunburstclick', function(d) {
                trackers.sunburstclick.unshift(d);
                if(opts.turnOffAnimation) return false;
            });
            gd.on('plotly_click', function(d) {
                trackers.click.unshift(d);
            });
            gd.on('plotly_animating', function() {
                // N.B. does not emit event data
                trackers.animating.unshift(true);
            });
        };
    }

    it('should trigger animation when clicking on branches', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.newPlot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 2))
        .then(function() {
            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined();
                expect(trackers.sunburstclick[0].points[0].label).toBe('Seth');
                expect(trackers.sunburstclick[0].nextLevel).toBe('Seth');
            } else {
                fail('incorrect plotly_sunburstclick triggering');
            }

            if(trackers.click.length === 1) {
                expect(trackers.click[0].event).toBeDefined();
                expect(trackers.click[0].points[0].label).toBe('Seth');
                expect(trackers.click[0].nextLevel).not.toBeDefined();
            } else {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 1) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .then(done, done.fail);
    });

    it('should trigger plotly_click event when clicking on root node', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.newPlot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 1))
        .then(function() {
            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined();
                expect(trackers.sunburstclick[0].points[0].label).toBe('Eve');
            } else {
                fail('incorrect plotly_sunburstclick triggering');
            }

            if(trackers.click.length === 1) {
                expect(trackers.click[0].event).toBeDefined();
                expect(trackers.click[0].points[0].label).toBe('Eve');
            } else {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 0) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .then(done, done.fail);
    });

    it('should trigger plotly_click event when clicking on leaf node', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.newPlot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 8))
        .then(function() {
            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined();
                expect(trackers.sunburstclick[0].points[0].label).toBe('Noam');
            } else {
                fail('incorrect plotly_sunburstclick triggering');
            }

            if(trackers.click.length === 1) {
                expect(trackers.click[0].event).toBeDefined();
                expect(trackers.click[0].points[0].label).toBe('Noam');
            } else {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 0) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .then(done, done.fail);
    });

    it('should not trigger animation when graph is transitioning', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.newPlot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 2))
        .then(function() {
            var msg = 'after 1st click';

            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined(msg);
                expect(trackers.sunburstclick[0].points[0].label).toBe('Seth', msg);
                expect(trackers.sunburstclick[0].nextLevel).toBe('Seth', msg);
            } else {
                fail('incorrect plotly_sunburstclick triggering - ' + msg);
            }

            if(trackers.click.length === 1) {
                expect(trackers.click[0].event).toBeDefined(msg);
                expect(trackers.click[0].points[0].label).toBe('Seth', msg);
                expect(trackers.click[0].nextLevel).not.toBeDefined(msg);
            } else {
                fail('incorrect plotly_click triggering - ' + msg);
            }

            if(trackers.animating.length !== 1) {
                fail('incorrect plotly_animating triggering - ' + msg);
            }
        })
        .then(click(gd, 4))
        .then(function() {
            var msg = 'after 2nd click';

            // should trigger plotly_sunburstclick and plotly_click twice,
            // but not plotly_animating

            if(trackers.sunburstclick.length === 2) {
                expect(trackers.sunburstclick[0].event).toBeDefined(msg);
                expect(trackers.sunburstclick[0].points[0].label).toBe('Awan', msg);
                expect(trackers.sunburstclick[0].nextLevel).toBe('Awan', msg);
            } else {
                fail('incorrect plotly_sunburstclick triggering - ' + msg);
            }

            if(trackers.click.length === 2) {
                expect(trackers.click[0].event).toBeDefined(msg);
                expect(trackers.click[0].points[0].label).toBe('Awan', msg);
                expect(trackers.click[0].nextLevel).not.toBeDefined(msg);
            } else {
                fail('incorrect plotly_click triggering - ' + msg);
            }

            if(trackers.animating.length !== 1) {
                fail('incorrect plotly_animating triggering - ' + msg);
            }
        })
        .then(done, done.fail);
    });

    it('should be able to override default click behavior using plotly_sunburstclick handler ()', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.newPlot(gd, mock)
        .then(setupListeners({turnOffAnimation: true}))
        .then(click(gd, 2))
        .then(function() {
            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined();
                expect(trackers.sunburstclick[0].points[0].label).toBe('Seth');
            } else {
                fail('incorrect plotly_sunburstclick triggering');
            }

            if(trackers.click.length !== 0) {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 0) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .then(done, done.fail);
    });
});

describe('Test sunburst restyle:', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    function _restyle(updateObj) {
        return function() { return Plotly.restyle(gd, updateObj); };
    }

    it('should be able to toggle visibility', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        function _assert(msg, exp) {
            return function() {
                var layer = d3Select(gd).select('.sunburstlayer');
                expect(layer.selectAll('.trace').size()).toBe(exp, msg);
            };
        }

        Plotly.newPlot(gd, mock)
        .then(_assert('base', 2))
        .then(_restyle({'visible': false}))
        .then(_assert('both visible:false', 0))
        .then(_restyle({'visible': true}))
        .then(_assert('back to visible:true', 2))
        .then(done, done.fail);
    });

    it('should be able to restyle *maxdepth* and *level* w/o recomputing the hierarchy', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_coffee.json'));

        function _assert(msg, exp) {
            return function() {
                var layer = d3Select(gd).select('.sunburstlayer');

                expect(layer.selectAll('.slice').size()).toBe(exp, msg);

                // editType:plot
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.newPlot(gd, mock)
        .then(_assert('base', 96))
        .then(function() {
            spyOn(Plots, 'doCalcdata').and.callThrough();
        })
        .then(_restyle({maxdepth: 3}))
        .then(_assert('with maxdepth:3', 26))
        .then(_restyle({level: 'Aromas'}))
        .then(_assert('with non-root level', 13))
        .then(_restyle({maxdepth: null, level: null}))
        .then(_assert('back to first view', 96))
        .then(done, done.fail);
    });

    it('should be able to restyle *leaf.opacity*', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B']
            }]
        };

        function _assert(msg, exp) {
            return function() {
                var layer = d3Select(gd).select('.sunburstlayer');

                var opacities = [];
                layer.selectAll('path.surface').each(function() {
                    opacities.push(this.style.opacity);
                });

                expect(opacities).toEqual(exp, msg);

                // editType:style
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                    expect(gd._fullData[0]._module.plot).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.newPlot(gd, mock)
        .then(_assert('base', ['', '0.7', '', '0.7']))
        .then(function() {
            spyOn(Plots, 'doCalcdata').and.callThrough();
            spyOn(gd._fullData[0]._module, 'plot').and.callThrough();
        })
        .then(_restyle({'leaf.opacity': 0.3}))
        .then(_assert('lower leaf.opacity', ['', '0.3', '', '0.3']))
        .then(_restyle({'leaf.opacity': 1}))
        .then(_assert('raise leaf.opacity', ['', '1', '', '1']))
        .then(_restyle({'leaf.opacity': null}))
        .then(_assert('back to dflt', ['', '0.7', '', '0.7']))
        .then(done, done.fail);
    });

    it('should be able to restyle *textinfo* with various *insidetextorientation*', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                text: ['node0', 'node1', 'node2', 'node3'],
                values: [0, 1, 2, 3]
            }]
        };

        function _assert(msg, exp) {
            return function() {
                var layer = d3Select(gd).select('.sunburstlayer');
                var tx = [];

                layer.selectAll('text.slicetext').each(function() {
                    var lines = d3Select(this).selectAll('tspan');

                    if(lines.size()) {
                        var t = [];
                        lines.each(function() {
                            t.push(this.innerHTML);
                        });
                        tx.push(t.join('\n'));
                    } else {
                        tx.push(this.innerHTML);
                    }
                });

                expect(tx).toEqual(exp, msg);

                // editType:plot
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.newPlot(gd, mock)
        .then(_assert('base', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        .then(function() {
            spyOn(Plots, 'doCalcdata').and.callThrough();
        })
        .then(_restyle({textinfo: 'label'}))
        .then(_assert('just label', ['Root', 'B', 'A', 'b']))
        .then(_restyle({textinfo: 'value'}))
        .then(_assert('show input values', ['0', '2', '1', '3']))
        .then(_restyle({textinfo: 'none'}))
        .then(_assert('no textinfo', ['', '', '', '']))
        .then(_restyle({textinfo: 'label+text+value'}))
        .then(_assert('show everything', ['Root\n0\nnode0', 'B\n2\nnode2', 'A\n1\nnode1', 'b\n3\nnode3']))
        .then(_restyle({textinfo: null}))
        .then(_assert('back to dflt', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        // now change insidetextorientation to 'horizontal'
        .then(_restyle({insidetextorientation: 'horizontal'}))
        .then(_assert('back to dflt', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        .then(_restyle({textinfo: 'none'}))
        .then(_assert('no textinfo', ['', '', '', '']))
        .then(_restyle({textinfo: null}))
        .then(_assert('back to dflt', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        // now change insidetextorientation to 'tangential'
        .then(_restyle({insidetextorientation: 'tangential'}))
        .then(_assert('back to dflt', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        .then(_restyle({textinfo: 'none'}))
        .then(_assert('no textinfo', ['', '', '', '']))
        .then(_restyle({textinfo: null}))
        .then(_assert('back to dflt', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        // now change insidetextorientation to 'radial'
        .then(_restyle({insidetextorientation: 'radial'}))
        .then(_assert('back to dflt', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        .then(_restyle({textinfo: 'none'}))
        .then(_assert('no textinfo', ['', '', '', '']))
        .then(_restyle({textinfo: null}))
        .then(_assert('back to dflt', ['Root\nnode0', 'B\nnode2', 'A\nnode1', 'b\nnode3']))
        .then(done, done.fail);
    });
});

describe('Test sunburst tweening:', function() {
    var gd;
    var pathTweenFnLookup;
    var textTweenFnLookup;

    beforeEach(function() {
        gd = createGraphDiv();

        // hacky way to track tween functions
        spyOn(d3Transition.prototype, 'attrTween').and.callFake(function(attrName, fn) {
            var lookup = {d: pathTweenFnLookup, transform: textTweenFnLookup}[attrName];
            var pt = this[0][0].__data__;
            var id = pt.data.data.id;

            // we should never tween the same node twice on a given sector click
            lookup[id] = lookup[id] ? null : fn(pt);
        });
    });

    afterEach(destroyGraphDiv);

    function _reset() {
        pathTweenFnLookup = {};
        textTweenFnLookup = {};
    }

    function _run(gd, v) {
        _reset();
        click(gd, v)();

        // 1 second more than the click transition duration
        return delay(constants.CLICK_TRANSITION_TIME + 1);
    }

    function trim(s) {
        return s.replace(/\s/g, '');
    }

    function _assert(msg, attrName, id, exp, tolerance) {
        var lookup = {d: pathTweenFnLookup, transform: textTweenFnLookup}[attrName];
        var fn = lookup[id];
        // normalize time in [0, 1] where we'll assert the tweening fn output,
        // asserting at the mid point *should be* representative enough
        var t = 0.5;
        var actual = trim(fn(t));
        var msg2 = msg + ' | node ' + id + ' @t=' + t;

        if(attrName === 'transform') {
            var fake = {attr: function() { return actual; }};
            var xy = Drawing.getTranslate(fake);
            expect([xy.x, xy.y]).toBeWithinArray(exp, tolerance || 2, msg2);
        } else {
        // we could maybe to bring in:
        // https://github.com/hughsk/svg-path-parser
        // to make these assertions more readable
            expect(actual).toBe(trim(exp), msg2);
        }
    }

    it('should tween sector exit/update (case: click on branch, no maxdepth)', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B']
            }]
        };

        Plotly.newPlot(gd, mock)
        .then(_run(gd, 3))
        .then(function() {
            _assert('exit entry radially inward', 'd', 'Root',
                'M350,235 A0,00,1,0350,235 A0,00,1,0350,235Z' +
                'M372.5,235 A22.5,22.50,1,1327.5,235 A22.5,22.50,1,1372.5,235Z'
            );
            _assert('exit A clockwise', 'd', 'A',
                'M395,235 L440,235 A90,900,0,0350,145 L350,190 A45,450,0,1395,235Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M350,212.5 L350,156.25 A78.75,78.750,1,0428.75,235.00000000000003' +
                'L372.5,235 A22.5,22.50,1,1350,212.5Z'
            );
            _assert('update b to new position', 'd', 'b',
                'M350,156.25 L350,100 A135,1350,1,0485,235.00000000000003 L428.75,235.00000000000003' +
                'A78.75,78.750,1,1350,156.25Z'
            );
            _assert('move B text to new position', 'transform', 'B', [313.45, 275.54]);
            _assert('move b text to new position', 'transform', 'b', [274.42, 314.57]);
        })
        .then(done, done.fail);
    });

    it('should tween sector enter/update (case: click on entry, no maxdepth)', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                level: 'B'
            }]
        };

        Plotly.newPlot(gd, mock)
        .then(_run(gd, 1))
        .then(function() {
            _assert('enter new entry radially outward', 'd', 'Root',
                'M350,235 A0,00,1,0350,235 A0,00,1,0350,235Z' +
                'M372.5,235 A22.5,22.50,1,1327.5,235 A22.5,22.50,1,1372.5,235Z'
            );
            _assert('enter A counterclockwise', 'd', 'A',
                'M395,235 L440,235 A90,900,0,0350,145 L350,190 A45,450,0,1395,235Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M350,212.5 L350,156.25 A78.75,78.750,1,0428.75,235.00000000000003' +
                'L372.5,235 A22.5,22.50,1,1350,212.5Z'
            );
            _assert('update b to new position', 'd', 'b',
                'M350,156.25 L350,100 A135,1350,1,0485,235.00000000000003 L428.75,235.00000000000003' +
                'A78.75,78.750,1,1350,156.25Z'
            );
            _assert('move B text to new position', 'transform', 'B', [316.85, 272.14]);
            _assert('move b text to new position', 'transform', 'b', [274.42, 314.57]);
        })
        .then(done, done.fail);
    });

    it('should tween sector enter/update/exit (case: click on entry, maxdepth=2)', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                maxdepth: 2
            }]
        };

        Plotly.newPlot(gd, mock)
        .then(_run(gd, 3))
        .then(function() {
            _assert('exit entry radially inward', 'd', 'Root',
                'M350,235 A0,00,1,0350,235 A0,00,1,0350,235Z' +
                'M383.75,235 A33.75,33.750,1,1316.25,235A33.75,33.750,1,1383.75,235Z'
            );
            _assert('exit A clockwise', 'd', 'A',
                'M417.5,235 L485,235 A135,1350,0,0350,100 L350,167.5 A67.5,67.50,0,1417.5,235Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M350,201.25 L350,133.75 A101.25,101.250,1,0451.25,235.00000000000003' +
                'L383.75,235 A33.75,33.750,1,1350,201.25Z'
            );
            _assert('enter b for parent position', 'd', 'b',
                'M350,133.75 L350,100 A135,1350,0,0350,370 L350,336.25 A101.25,101.250,0,1350,133.75Z'
            );
            _assert('move B text to new position', 'transform', 'B', [303.01, 285.98]);
            _assert('enter b text to new position', 'transform', 'b', [248.75, 239]);
        })
        .then(done, done.fail);
    });

    it('should tween sector enter/update/exit (case: click on entry, maxdepth=2, level=B)', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b', 'bb'],
                parents: ['', 'Root', 'Root', 'B', 'b'],
                maxdepth: 2,
                level: 'B'
            }]
        };

        Plotly.newPlot(gd, mock)
        .then(_run(gd, 1))
        .then(function() {
            _assert('exit b radially outward and to parent sector angle', 'd', 'b',
                'M350,133.75L350,100A135,1350,1,0485,235.00000000000003' +
                'L451.25,235.00000000000003A101.25,101.250,1,1350,133.75Z'
            );
            _assert('enter new entry radially outward', 'd', 'Root',
                'M350,235A0,00,1,0350,235A0,00,1,0350,235Z' +
                'M383.75,235A33.75,33.750,1,1316.25,235A33.75,33.750,1,1383.75,235Z'
            );
            _assert('enter A counterclockwise', 'd', 'A',
                'M417.5,235L485,235A135,1350,0,0350,100L350,167.5A67.5,67.50,0,1417.5,235Z'
            );
            _assert('update B to new position', 'd', 'B',
                'M350,201.25L350,133.75A101.25,101.250,1,0451.25,235.00000000000003' +
                'L383.75,235A33.75,33.750,1,1350,201.25Z'
            );
        })
        .then(done, done.fail);
    });

    /*
    it('should tween in sectors from new traces', function(done) {
        Plotly.newPlot(gd, [{type: 'sunburst'}])
        .then(_reset)
        .then(function() {
            return Plotly.animate(gd, [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B']
            }]);
        })
        .then(function() {
            _assert('enter entry from theta=0', 'd', 'Root',
                ''
            );
            // _assert('enter A from theta=0', 'd', 'A',
            //     ''
            // );
            // _assert('enter B from theta=0', 'd', 'B',
            //     ''
            // );
            // _assert('enter b from theta=0', 'd', 'b',
            //     ''
            // );
        })
        .then(done, done.fail);
    });
    */

    it('should update text position during transition using *auto* insidetextorientation', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                textinfo: 'label',
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                parents: ['', 'A', 'A', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'J', 'J', 'J', 'J', 'J', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'U', 'U'],
                insidetextorientation: 'auto'
            }]
        })
        .then(_run(gd, 4))
        .then(function() {
            _assert('move J text to new position', 'transform', 'J', [309.3085305481173, 202.66937078300114]);
            _assert('move O text to new position', 'transform', 'O', [337.158534264498, 162.57550532369754], 5);
            _assert('move U text to new position', 'transform', 'U', [416.1153793700712, 163.4078137147134]);
            _assert('move V text to new position', 'transform', 'V', [471.63745793297295, 218.00377184475153]);
            _assert('move W text to new position', 'transform', 'W', [455.10235209157037, 177.717459723826], 5);
            _assert('move X text to new position', 'transform', 'X', [431.0320488371527, 145.88885474402548]);
            _assert('move Y text to new position', 'transform', 'Y', [395.12660928295867, 124.11350635624726]);
            _assert('move Z text to new position', 'transform', 'Z', [354.1550374068844, 115.63596810986363]);
        })
        .then(done, done.fail);
    });

    it('should update text position during transition using *horizontal* insidetextorientation', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                textinfo: 'label',
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                parents: ['', 'A', 'A', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'J', 'J', 'J', 'J', 'J', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'U', 'U'],
                insidetextorientation: 'horizontal'
            }]
        })
        .then(_run(gd, 4))
        .then(function() {
            _assert('move J text to new position', 'transform', 'J', [350, 185.9244172266002]);
            _assert('move O text to new position', 'transform', 'O', [350.1640625, 162.2952497427013]);
            _assert('move U text to new position', 'transform', 'U', [416.1153793700712, 163.4078137147134]);
            _assert('move V text to new position', 'transform', 'V', [471.63745793297295, 218.00377184475153]);
            _assert('move W text to new position', 'transform', 'W', [457.21539566810236, 178.44157384259557]);
            _assert('move X text to new position', 'transform', 'X', [431.0320488371527, 145.88885474402548]);
            _assert('move Y text to new position', 'transform', 'Y', [395.12660928295867, 124.11350635624726]);
            _assert('move Z text to new position', 'transform', 'Z', [354.1550374068844, 115.63596810986363]);
        })
        .then(done, done.fail);
    });

    it('should update text position during transition using *tangential* insidetextorientation', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                textinfo: 'label',
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                parents: ['', 'A', 'A', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'J', 'J', 'J', 'J', 'J', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'U', 'U'],
                insidetextorientation: 'tangential'
            }]
        })
        .then(_run(gd, 4))
        .then(function() {
            _assert('move J text to new position', 'transform', 'J', [350, 185.9244172266002]);
            _assert('move O text to new position', 'transform', 'O', [350.1640625, 162.3617907020963]);
            _assert('move U text to new position', 'transform', 'U', [387.0665312800944, 146.39132446549587]);
            _assert('move V text to new position', 'transform', 'V', [467.5637172232141, 214.71357776223093]);
            _assert('move W text to new position', 'transform', 'W', [453.6883022471187, 176.23118240799604]);
            _assert('move X text to new position', 'transform', 'X', [428.32070483274055, 145.007590714263]);
            _assert('move Y text to new position', 'transform', 'Y', [393.6173101979463, 123.958130483835]);
            _assert('move Z text to new position', 'transform', 'Z', [359.52567880729003, 116.05583257124167]);
        })
        .then(done, done.fail);
    });

    it('should update text position during transition using *radial* insidetextorientation', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                textinfo: 'label',
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                parents: ['', 'A', 'A', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'J', 'J', 'J', 'J', 'J', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'U', 'U'],
                insidetextorientation: 'radial'
            }]
        })
        .then(_run(gd, 4))
        .then(function() {
            _assert('move J text to new position', 'transform', 'J', [298.18238454231454, 239]);
            _assert('move O text to new position', 'transform', 'O', [299.00421744782363, 183.7721980352468]);
            _assert('move U text to new position', 'transform', 'U', [418.6530444037927, 162.19895218157865]);
            _assert('move V text to new position', 'transform', 'V', [471.8671910181962, 218.0219264868202]);
            _assert('move W text to new position', 'transform', 'W', [459.0093083790858, 178.21113754411613]);
            _assert('move X text to new position', 'transform', 'X', [433.74669513154777, 144.8536840385141]);
            _assert('move Y text to new position', 'transform', 'Y', [398.67767996405655, 121.9940236084775]);
            _assert('move Z text to new position', 'transform', 'Z', [354.00770212095256, 116.19286557341015]);
        })
        .then(done, done.fail);
    });

    it('should update text position during transition using *radial* insidetextorientation with level', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                textinfo: 'label',
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                parents: ['', 'A', 'A', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'J', 'J', 'J', 'J', 'J', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'U', 'U'],
                insidetextorientation: 'radial',
                level: 'O',
            }]
        })
        .then(_run(gd, 2))
        .then(function() {
            _assert('move U text to new position', 'transform', 'U', [317.71031126211744, 202.23522389350774]);
            _assert('move V text to new position', 'transform', 'V', [444.88381073744586, 191.14358863479603]);
            _assert('move W text to new position', 'transform', 'W', [365.5485731154604, 134.6827081871288]);
            _assert('move X text to new position', 'transform', 'X', [277.7815763779703, 162.7705278345142]);
            _assert('move Y text to new position', 'transform', 'Y', [247.47466543373307, 255.288278237516]);
            _assert('move Z text to new position', 'transform', 'Z', [300.75324430542196, 332.0135787956955]);
        })
        .then(done, done.fail);
    });

    it('should update text position during transition using *tangential* insidetextorientation with level', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                textinfo: 'label',
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                parents: ['', 'A', 'A', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'J', 'J', 'J', 'J', 'J', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'U', 'U'],
                insidetextorientation: 'tangential',
                level: 'O',
            }]
        })
        .then(_run(gd, 2))
        .then(function() {
            _assert('move U text to new position', 'transform', 'U', [313.79288001914836, 202.45694251914836]);
            _assert('move V text to new position', 'transform', 'V', [441.011030377721, 188.63633201157208]);
            _assert('move W text to new position', 'transform', 'W', [382.1346244328249, 135.0126788235936], 5);
            _assert('move X text to new position', 'transform', 'X', [277.7815763779703, 162.7705278345142]);
            _assert('move Y text to new position', 'transform', 'Y', [249.73412124927503, 271.78420776316403]);
            _assert('move Z text to new position', 'transform', 'Z', [305.39156336654094, 331.3597434293286]);
        })
        .then(done, done.fail);
    });

    it('should update text position during transition using *horizontal* insidetextorientation with level', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                textinfo: 'label',
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                parents: ['', 'A', 'A', 'C', 'C', 'C', 'F', 'F', 'F', 'F', 'J', 'J', 'J', 'J', 'J', 'O', 'O', 'O', 'O', 'O', 'O', 'U', 'U', 'U', 'U', 'U', 'U'],
                insidetextorientation: 'horizontal',
                level: 'O',
            }]
        })
        .then(_run(gd, 2))
        .then(function() {
            _assert('move U text to new position', 'transform', 'U', [313.79288001914836, 202.45694251914836]);
            _assert('move V text to new position', 'transform', 'V', [445.2341347726318, 190.47976534033592]);
            _assert('move W text to new position', 'transform', 'W', [366.3829959511747, 133.44080859889465]);
            _assert('move X text to new position', 'transform', 'X', [274.43577526068776, 163.42796276068773]);
            _assert('move Y text to new position', 'transform', 'Y', [244.44862109889465, 255.71893345117468]);
            _assert('move Z text to new position', 'transform', 'Z', [301.6438278403359, 334.2263222726318]);
        })
        .then(done, done.fail);
    });
});

describe('Test sunburst interactions edge cases', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('should keep tracking hover labels and hover events after *calc* edits', function(done) {
        var mock = Lib.extendFlat({}, require('@mocks/sunburst_first.json'));
        var hoverCnt = 0;
        var unhoverCnt = 0;

        // see https://github.com/plotly/plotly.js/issues/3618

        function _assert(msg, exp) {
            expect(hoverCnt).toBe(exp.hoverCnt, msg + ' - hover cnt');
            expect(unhoverCnt).toBe(exp.unhoverCnt, msg + ' - unhover cnt');

            var label = d3Select(gd).select('g.hovertext');
            expect(label.size()).toBe(exp.hoverLabel, msg + ' - hover label cnt');

            hoverCnt = 0;
            unhoverCnt = 0;
        }

        Plotly.newPlot(gd, mock)
        .then(function() {
            gd.on('plotly_hover', function() {
                hoverCnt++;
                // N.B. trigger a 'plot' edit
                Plotly.restyle(gd, 'textinfo', 'none');
            });
            gd.on('plotly_unhover', function() {
                unhoverCnt++;
                // N.B. trigger a 'plot' edit
                Plotly.restyle(gd, 'textinfo', null);
            });
        })
        .then(hover(gd, 1))
        .then(function() {
            _assert('after hovering on first sector', {
                hoverCnt: 1,
                unhoverCnt: 0,
                hoverLabel: 1
            });
        })
        .then(unhover(gd, 1))
        .then(function() {
            _assert('after un-hovering from first sector', {
                hoverCnt: 0,
                unhoverCnt: 1,
                hoverLabel: 0
            });
        })
        .then(hover(gd, 2))
        .then(function() {
            _assert('after hovering onto second sector', {
                hoverCnt: 1,
                unhoverCnt: 0,
                hoverLabel: 1
            });
        })
        .then(done, done.fail);
    });

    it('should show falsy zero text', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                parents: ['', 'A', 'B', 'C', 'D', 'E', 'F'],
                labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
                values: [7, 6, 5, 4, 3, 2, 1],
                text: [null, '', '0', 0, 1, true, false],
                textinfo: 'label+text+value'
            }],
            layout: {
                width: 400,
                height: 400
            }
        })
        .then(hover(gd, 4))
        .then(function() {
            assertHoverLabelContent({ nums: 'D\n4\n0' });
        })
        .then(done, done.fail);
    });

    it('should transition sunburst traces only', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/display-text_zero-number.json'));
        mock.data[0].visible = false;

        function _assert(msg, exp) {
            var gd3 = d3Select(gd);
            expect(gd3.select('.cartesianlayer').selectAll('.trace').size())
                .toBe(exp.cartesianTraceCnt, '# of cartesian traces');
            expect(gd3.select('.pielayer').selectAll('.trace').size())
                .toBe(exp.pieTraceCnt, '# of pie traces');
            expect(gd3.select('.sunburstlayer').selectAll('.trace').size())
                .toBe(exp.sunburstTraceCnt, '# of sunburst traces');
        }

        Plotly.newPlot(gd, mock)
        .then(function() {
            _assert('base', {
                cartesianTraceCnt: 2,
                pieTraceCnt: 0,
                sunburstTraceCnt: 1
            });
        })
        .then(click(gd, 2))
        .then(delay(constants.CLICK_TRANSITION_TIME + 1))
        .then(function() {
            _assert('after sunburst click', {
                cartesianTraceCnt: 2,
                pieTraceCnt: 0,
                sunburstTraceCnt: 1
            });
        })
        .then(done, done.fail);
    });

    it('should be able to transition sunburst traces via `Plotly.react`', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/display-text_zero-number.json'));
        mock.layout.transition = {duration: 200};

        spyOn(Plots, 'transitionFromReact').and.callThrough();

        Plotly.newPlot(gd, mock)
        .then(function() {
            gd.data[1].level = 'B';
            return Plotly.react(gd, gd.data, gd.layout);
        })
        .then(delay(202))
        .then(function() {
            expect(Plots.transitionFromReact).toHaveBeenCalledTimes(1);
        })
        .then(done, done.fail);
    });
});

describe('Test sunburst texttemplate without `values` should work at root level:', function() {
    checkTextTemplate([{
        type: 'sunburst',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['color: rgba(0,0,0,0)', 'color: #1f77b4', 'color: #ff7f0e', 'color: #2ca02c', 'color: #d62728', 'color: #9467bd', 'color: #ff7f0e', 'color: #ff7f0e', 'color: #d62728']],
        ['label: %{label}', ['label: Eve', 'label: Cain', 'label: Seth', 'label: Enos', 'label: Noam', 'label: Abel', 'label: Awan', 'label: Enoch', 'label: Azura']],
        ['text: %{text}', ['text: sixty-five', 'text: fourteen', 'text: twelve', 'text: ten', 'text: two', 'text: six', 'text: six', 'text: one', 'text: four']],
        ['path: %{currentPath}', ['path: /', 'path: Eve/', 'path: Eve/', 'path: Eve/', 'path: Eve/', 'path: Eve', 'path: Eve/Seth', 'path: Eve/Seth/', 'path: Eve/Awan/']],
        ['%{percentRoot} of %{root}', ['100% of Eve', '33% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve']],
        ['%{percentEntry} of %{entry}', ['100% of Eve', '33% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve']],
        ['%{percentParent} of %{parent}', ['%{percentParent} of %{parent}', '100% of Seth', '33% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '17% of Eve', '50% of Seth', '100% of Awan']],
        [
            [
                'label: %{label}',
                'text: %{text}',
                'value: %{value}',
                '%{percentRoot} of %{root}',
                '%{percentEntry} of %{entry}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}',
                'color: %{color}'
            ],
            [
                'label: Eve',
                'text: fourteen',
                'value: %{value}', // N.B. there is no `values` array
                '17% of Eve',
                '17% of Eve',
                '17% of Eve',
                '17% of Eve',
                '100% of Awan',
                'color: #9467bd'
            ]
        ]
    ]);
});

describe('Test sunburst texttemplate with *total* `values` should work at root level:', function() {
    checkTextTemplate([{
        type: 'sunburst',
        branchvalues: 'total',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        values: [65, 14, 12, 10, 2, 6, 6, 1, 4],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['color: rgba(0,0,0,0)', 'color: #1f77b4', 'color: #ff7f0e', 'color: #2ca02c', 'color: #d62728', 'color: #9467bd', 'color: #ff7f0e', 'color: #ff7f0e', 'color: #d62728']],
        ['label: %{label}', ['label: Eve', 'label: Cain', 'label: Seth', 'label: Enos', 'label: Noam', 'label: Abel', 'label: Awan', 'label: Enoch', 'label: Azura']],
        ['value: %{value}', ['value: 65', 'value: 14', 'value: 12', 'value: 10', 'value: 2', 'value: 6', 'value: 6', 'value: 1', 'value: 4']],
        ['text: %{text}', ['text: sixty-five', 'text: fourteen', 'text: twelve', 'text: ten', 'text: two', 'text: six', 'text: six', 'text: one', 'text: four']],
        ['path: %{currentPath}', ['path: /', 'path: Eve/', 'path: Eve/', 'path: Eve/', 'path: Eve/', 'path: Eve', 'path: Eve/Seth', 'path: Eve/Seth/', 'path: Eve/Awan/']],
        ['%{percentRoot} of %{root}', ['100% of Eve', '22% of Eve', '18% of Eve', '9% of Eve', '9% of Eve', '6% of Eve', '15% of Eve', '3% of Eve', '2% of Eve']],
        ['%{percentEntry} of %{entry}', ['100% of Eve', '22% of Eve', '18% of Eve', '9% of Eve', '9% of Eve', '6% of Eve', '15% of Eve', '3% of Eve', '2% of Eve']],
        ['%{percentParent} of %{parent}', ['%{percentParent} of %{parent}', '22% of Eve', '18% of Eve', '9% of Eve', '9% of Eve', '6% of Eve', '83% of Seth', '17% of Seth', '17% of Awan']],
        [
            [
                'label: %{label}',
                'text: %{text}',
                'value: %{value}',
                '%{percentRoot} of %{root}',
                '%{percentEntry} of %{entry}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}',
                'color: %{color}'
            ],
            [
                'label: Eve',
                'text: fourteen',
                'value: 12',
                '9% of Eve',
                '15% of Eve',
                '3% of Eve',
                '6% of Eve',
                '17% of Awan',
                'color: #9467bd'
            ]
        ]
    ]);
});

describe('Test sunburst texttemplate with *remainder* `values` should work at root level:', function() {
    checkTextTemplate([{
        type: 'sunburst',
        branchvalues: 'remainder',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        values: [65, 14, 12, 10, 2, 6, 6, 1, 4],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['color: rgba(0,0,0,0)', 'color: #1f77b4', 'color: #ff7f0e', 'color: #2ca02c', 'color: #d62728', 'color: #9467bd', 'color: #ff7f0e', 'color: #ff7f0e', 'color: #d62728']],
        ['label: %{label}', ['label: Eve', 'label: Cain', 'label: Seth', 'label: Enos', 'label: Noam', 'label: Abel', 'label: Awan', 'label: Enoch', 'label: Azura']],
        ['value: %{value}', ['value: 65', 'value: 14', 'value: 12', 'value: 10', 'value: 2', 'value: 6', 'value: 6', 'value: 1', 'value: 4']],
        ['text: %{text}', ['text: sixty-five', 'text: fourteen', 'text: twelve', 'text: ten', 'text: two', 'text: six', 'text: six', 'text: one', 'text: four']],
        ['path: %{currentPath}', ['path: /', 'path: Eve/', 'path: Eve/', 'path: Eve/', 'path: Eve/', 'path: Eve', 'path: Eve/Seth', 'path: Eve/Seth/', 'path: Eve/Awan/']],
        ['%{percentRoot} of %{root}', ['100% of Eve', '20% of Eve', '12% of Eve', '6% of Eve', '5% of Eve', '3% of Eve', '8% of Eve', '2% of Eve', '1% of Eve']],
        ['%{percentEntry} of %{entry}', ['100% of Eve', '20% of Eve', '12% of Eve', '6% of Eve', '5% of Eve', '3% of Eve', '8% of Eve', '2% of Eve', '1% of Eve']],
        ['%{percentParent} of %{parent}', ['%{percentParent} of %{parent}', '20% of Eve', '12% of Eve', '6% of Eve', '5% of Eve', '3% of Eve', '42% of Seth', '8% of Seth', '14% of Awan']],
        [
            [
                'label: %{label}',
                'text: %{text}',
                'value: %{value}',
                '%{percentRoot} of %{root}',
                '%{percentEntry} of %{entry}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}',
                '%{percentParent} of %{parent}',
                'color: %{color}'
            ],
            [
                'label: Eve',
                'text: fourteen',
                'value: 12',
                '6% of Eve',
                '5% of Eve',
                '8% of Eve',
                '2% of Eve',
                '14% of Awan',
                'color: #9467bd'
            ]
        ]
    ]);
});

describe('Test sunburst texttemplate without `values` should work when *level* is set:', function() {
    checkTextTemplate([{
        type: 'sunburst',
        level: 'Seth',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['color: #1f77b4', 'color: #1f77b4', 'color: #1f77b4']],
        ['label: %{label}', ['label: Seth', 'label: Enos', 'label: Noam']],
        ['text: %{text}', ['text: twelve', 'text: ten', 'text: two']],
        ['path: %{currentPath}', ['path: Eve/', 'path: Eve/Seth', 'path: Eve/Seth/']],
        ['%{percentRoot} of %{root}', ['33% of Eve', '17% of Eve', '17% of Eve']],
        ['%{percentEntry} of %{entry}', ['100% of Seth', '50% of Seth', '50% of Seth']],
        ['%{percentParent} of %{parent}', ['33% of Eve', '50% of Seth', '50% of Seth']],
    ], /* skipEtra */ true);
});

describe('Test sunburst texttemplate with *total* `values` should work when *level* is set:', function() {
    checkTextTemplate([{
        type: 'sunburst',
        level: 'Seth',
        branchvalues: 'total',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        values: [65, 14, 12, 10, 2, 6, 6, 1, 4],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['color: #ff7f0e', 'color: #ff7f0e', 'color: #ff7f0e']],
        ['label: %{label}', ['label: Seth', 'label: Enos', 'label: Noam']],
        ['text: %{text}', ['text: twelve', 'text: ten', 'text: two']],
        ['path: %{currentPath}', ['path: Eve/', 'path: Eve/Seth', 'path: Eve/Seth/']],
        ['%{percentRoot} of %{root}', ['18% of Eve', '15% of Eve', '3% of Eve']],
        ['%{percentEntry} of %{entry}', ['100% of Seth', '83% of Seth', '17% of Seth']],
        ['%{percentParent} of %{parent}', ['18% of Eve', '83% of Seth', '17% of Seth']],
    ], /* skipEtra */ true);
});

describe('Test sunburst texttemplate with *remainder* `values` should work when *level* is set:', function() {
    checkTextTemplate([{
        type: 'sunburst',
        level: 'Seth',
        branchvalues: 'remainder',
        labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
        parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve' ],
        values: [65, 14, 12, 10, 2, 6, 6, 1, 4],
        text: ['sixty-five', 'fourteen', 'twelve', 'ten', 'two', 'six', 'six', 'one', 'four']
    }], 'g.slicetext', [
        ['color: %{color}', ['color: #1f77b4', 'color: #1f77b4', 'color: #1f77b4']],
        ['label: %{label}', ['label: Seth', 'label: Enos', 'label: Noam']],
        ['text: %{text}', ['text: twelve', 'text: ten', 'text: two']],
        ['path: %{currentPath}', ['path: Eve/', 'path: Eve/Seth', 'path: Eve/Seth/']],
        ['%{percentRoot} of %{root}', ['20% of Eve', '8% of Eve', '2% of Eve']],
        ['%{percentEntry} of %{entry}', ['100% of Seth', '42% of Seth', '8% of Seth']],
        ['%{percentParent} of %{parent}', ['20% of Eve', '42% of Seth', '8% of Seth']],
    ], /* skipEtra */ true);
});

describe('sunburst inside text orientation', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function assertTextRotations(msg, opts) {
        return function() {
            var selection = d3SelectAll(SLICES_TEXT_SELECTOR);
            var size = selection.size();
            ['rotations'].forEach(function(e) {
                expect(size).toBe(opts[e].length, 'length for ' + e + ' does not match with the number of elements');
            });

            for(var i = 0; i < selection[0].length; i++) {
                var transform = selection[0][i].getAttribute('transform');
                var pos0 = transform.indexOf('rotate(');
                var rotate = 0;
                if(pos0 !== -1) {
                    pos0 += 'rotate('.length;
                    var pos1 = transform.indexOf(')', pos0);
                    rotate = +(transform.substring(pos0, pos1));
                }

                expect(opts.rotations[i]).toBeCloseTo(rotate, -1, 'rotation for element ' + i, msg);
            }
        };
    }

    it('should be able to react to new insidetextorientation option', function(done) {
        var fig = {
            data: [{
                type: 'sunburst',
                parents: ['', '', '', ''],
                labels: [64, 32, 16, 8],
                values: [64, 32, 16, 8],
                sort: false,

                text: [
                    'very long label',
                    'label',
                    'long label',
                    '+'
                ],

                textinfo: 'text',
                textposition: 'inside',
                showlegend: false
            }],
            layout: {
                width: 300,
                height: 300
            }
        };

        Plotly.newPlot(gd, fig)
        .then(assertTextRotations('using default "auto"', {
            rotations: [-0.6, 0, 48, 0]
        }))
        .then(function() {
            fig.data[0].insidetextorientation = 'horizontal';
            return Plotly.react(gd, fig);
        })
        .then(assertTextRotations('using "horizontal"', {
            rotations: [0, 0, 0, 0]
        }))
        .then(function() {
            fig.data[0].insidetextorientation = 'radial';
            return Plotly.react(gd, fig);
        })
        .then(assertTextRotations('using "radial"', {
            rotations: [84, -60, 48, 12]
        }))
        .then(function() {
            fig.data[0].insidetextorientation = 'tangential';
            return Plotly.react(gd, fig);
        })
        .then(assertTextRotations('using "tangential"', {
            rotations: [0, 30, -42, -78]
        }))
        .then(function() {
            fig.data[0].insidetextorientation = 'auto';
            return Plotly.react(gd, fig);
        })
        .then(assertTextRotations('back to "auto"', {
            rotations: [-0.6, 0, 48, 0]
        }))
        .then(done, done.fail);
    });
});

describe('sunburst uniformtext', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function assertTextSizes(msg, opts) {
        return function() {
            var selection = d3SelectAll(SLICES_TEXT_SELECTOR);
            var size = selection.size();
            ['fontsizes', 'scales'].forEach(function(e) {
                expect(size).toBe(opts[e].length, 'length for ' + e + ' does not match with the number of elements');
            });

            selection.each(function(d, i) {
                var fontSize = this.style.fontSize;
                expect(fontSize).toBe(opts.fontsizes[i] + 'px', 'fontSize for element ' + i, msg);
            });

            for(var i = 0; i < selection[0].length; i++) {
                var transform = selection[0][i].getAttribute('transform');
                var pos0 = transform.indexOf('scale(');
                var scale = 1;
                if(pos0 !== -1) {
                    pos0 += 'scale('.length;
                    var pos1 = transform.indexOf(')', pos0);
                    scale = +(transform.substring(pos0, pos1));
                }

                expect(opts.scales[i]).toBeCloseTo(scale, 1, 'scale for element ' + i, msg);
            }
        };
    }

    it('should be able to react with new uniform text options', function(done) {
        var fig = {
            data: [{
                type: 'sunburst',
                parents: ['', '', '', '', '', '', '', '', '', ''],
                labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

                text: [
                    0,
                    '<br>',
                    null,
                    '',
                    ' ',
                    '.',
                    '+',
                    '=',
                    '$',
                    'very long lablel'
                ],

                textinfo: 'text'
            }],
            layout: {
                width: 300,
                height: 300
            }
        };

        Plotly.newPlot(gd, fig)
        .then(assertTextSizes('without uniformtext', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
            scales: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.52],
        }))
        .then(function() {
            fig.layout.uniformtext = {mode: 'hide'}; // default with minsize=0
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using mode: "hide"', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
            scales: [0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52],
        }))
        .then(function() {
            fig.layout.uniformtext.minsize = 9; // set a minsize less than trace font size
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using minsize: 9', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
            scales: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        }))
        .then(function() {
            fig.layout.uniformtext.minsize = 32; // set a minsize greater than trace font size
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using minsize: 32', {
            fontsizes: [32, 32, 32, 32, 32, 32, 32, 32, 32, 32],
            scales: [0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        }))
        .then(function() {
            fig.layout.uniformtext.minsize = 16; // set a minsize greater than trace font size
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using minsize: 16', {
            fontsizes: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
            scales: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        }))
        .then(function() {
            fig.layout.uniformtext.mode = 'show';
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using mode: "show"', {
            fontsizes: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
            scales: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        }))
        .then(function() {
            fig.layout.uniformtext = undefined; // back to default
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('clear uniformtext', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
            scales: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.52],
        }))
        .then(done, done.fail);
    });

    it('should uniform text scales after transition', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'sunburst',
                parents: [
                    '',
                    'Oscar',
                    'Oscar',
                    'Oscar',
                    'Oscar',
                    'Oscar',
                    'Oscar',
                    'Uniform',
                    'Uniform',
                    'Uniform',
                    'Uniform',
                    'Uniform',
                    'Uniform'
                ],
                labels: [
                    'Oscar',
                    'Papa',
                    'Quebec',
                    'Romeo and Juliet',
                    'Sierra',
                    'Tango',
                    'Uniform',
                    'ViKtor Korchnoi - Anatoly Karpov',
                    'Whiskey',
                    'X ray',
                    'Yankee',
                    'Zulu'
                ],
                textinfo: 'label'
            }],
            layout: {
                width: 500,
                height: 500,
                uniformtext: {
                    mode: 'hide',
                    minsize: 12
                }
            }
        })
        .then(assertTextSizes('before click', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
            scales: [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
        }))
        .then(click(gd, 2)) // click on Uniform
        .then(delay(constants.CLICK_TRANSITION_TIME + 1))
        .then(assertTextSizes('after click child', {
            fontsizes: [12, 12, 12, 12, 12, 12],
            scales: [1, 0, 1, 1, 1, 1],
        }))
        .then(click(gd, 1)) // click on Oscar
        .then(delay(constants.CLICK_TRANSITION_TIME + 1))
        .then(assertTextSizes('after click parent', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
            scales: [1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1],
        }))
        .then(done, done.fail);
    });
});
