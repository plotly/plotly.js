var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3Select = require('../../strict-d3').select;
var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

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

describe('Test icicle defaults:', function() {
    var gd;
    var fullData;

    function _supply(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'icicle'}, o || {});
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

    it('should use *layout.colorway* as dflt for *iciclecolorway*', function() {
        _supply([
            {labels: [1], parents: ['']}
        ], {
            colorway: ['red', 'blue', 'green']
        });
        expect(gd._fullLayout.iciclecolorway)
            .toEqual(['red', 'blue', 'green'], 'dflt to layout colorway');

        _supply([
            {labels: [1], parents: ['']}
        ], {
            colorway: ['red', 'blue', 'green'],
            iciclecolorway: ['cyan', 'yellow', 'black']
        });
        expect(gd._fullLayout.iciclecolorway)
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

describe('Test icicle calc:', function() {
    var gd;

    beforeEach(function() {
        spyOn(Lib, 'warn');
    });

    function _calc(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'icicle'}, o || {});
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
        expect(Lib.warn).toHaveBeenCalledWith('Multiple implied roots, cannot build icicle hierarchy of trace 0. These roots include: Root1, Root22');
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
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build icicle hierarchy of trace 0. Error: ambiguous: A');
    });

    it('should warn ids/parents lead to ambiguous hierarchy', function() {
        _calc({
            labels: ['label 1', 'label 2', 'label 3', 'label 4'],
            ids: ['a', 'b', 'b', 'c'],
            parents: ['', 'a', 'a', 'b']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build icicle hierarchy of trace 0. Error: ambiguous: b');
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

describe('Test icicle hover:', function() {
    var gd;

    var labels0 = ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'];
    var parents0 = ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve'];
    var values0 = [10, 14, 12, 10, 2, 6, 6, 1, 4];

    afterEach(destroyGraphDiv);

    function run(spec) {
        gd = createGraphDiv();

        var data = (spec.traces || [{}]).map(function(t) {
            t.type = 'icicle';
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
