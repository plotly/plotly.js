var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var constants = require('@src/traces/sunburst/constants');

var d3 = require('d3');
var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var delay = require('../assets/delay');
var failTest = require('../assets/fail_test');

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
            var gd3 = d3.select(gd);
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
                return pt[k];
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
        expect(Lib.warn).toHaveBeenCalledWith('Multiple implied roots, cannot build sunburst hierarchy.');
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
        expect(extract('label')).toEqual([undefined, 'A', 'B', 'b']);
    });

    it('should compute hierarchy values', function() {
        var labels = ['Root', 'A', 'B', 'b'];
        var parents = ['', 'Root', 'Root', 'B'];

        _calc([
            {labels: labels, parents: parents},
            {labels: labels, parents: parents, values: [0, 1, 2, 3]},
            {labels: labels, parents: parents, values: [30, 20, 10, 5], branchvalues: 'total'}
        ]);

        expect(extractPt('value')).toEqual([
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
        expect(Lib.warn.calls.allArgs()[0][0]).toBe('Total value for node Root is smaller than the sum of its children.');
        expect(Lib.warn.calls.allArgs()[1][0]).toBe('Total value for node B is smaller than the sum of its children.');
    });

    it('should warn labels/parents lead to ambiguous hierarchy', function() {
        _calc({
            labels: ['Root', 'A', 'A', 'B'],
            parents: ['', 'Root', 'Root', 'A']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build sunburst hierarchy. Error: ambiguous: A');
    });

    it('should warn ids/parents lead to ambiguous hierarchy', function() {
        _calc({
            labels: ['label 1', 'label 2', 'label 3', 'label 4'],
            ids: ['a', 'b', 'b', 'c'],
            parents: ['', 'a', 'a', 'b']
        });

        expect(Lib.warn).toHaveBeenCalledTimes(1);
        expect(Lib.warn).toHaveBeenCalledWith('Failed to build sunburst hierarchy. Error: ambiguous: b');
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

        return Plotly.plot(gd, data, layout)
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
                    var gd3 = d3.select(gd);
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
                nums: 'Abel\n6',
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
                nums: 'Abel',
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
            run(spec).catch(failTest).then(done);
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

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
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

        Plotly.plot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 2))
        .then(function() {
            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined();
                expect(trackers.sunburstclick[0].points[0].label).toBe('Seth');
            } else {
                fail('incorrect plotly_sunburstclick triggering');
            }

            if(trackers.click.length) {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 1) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .catch(failTest)
        .then(done);
    });

    it('should trigger plotly_click event when clicking on root node', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
    });

    it('should trigger plotly_click event when clicking on leaf node', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
    });

    it('should not trigger animation when graph is transitioning', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        // should be same before and after 2nd click
        function _assertCommon(msg) {
            if(trackers.click.length) {
                fail('incorrect plotly_click triggering - ' + msg);
            }
            if(trackers.animating.length !== 1) {
                fail('incorrect plotly_animating triggering - ' + msg);
            }
        }

        Plotly.plot(gd, mock)
        .then(setupListeners())
        .then(click(gd, 2))
        .then(function() {
            var msg = 'after 1st click';

            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined(msg);
                expect(trackers.sunburstclick[0].points[0].label).toBe('Seth', msg);
            } else {
                fail('incorrect plotly_sunburstclick triggering - ' + msg);
            }

            _assertCommon(msg);
        })
        .then(click(gd, 4))
        .then(function() {
            var msg = 'after 2nd click';

            // should trigger plotly_sunburstclick twice, but not additional
            // plotly_click nor plotly_animating

            if(trackers.sunburstclick.length === 2) {
                expect(trackers.sunburstclick[0].event).toBeDefined(msg);
                expect(trackers.sunburstclick[0].points[0].label).toBe('Awan', msg);
            } else {
                fail('incorrect plotly_sunburstclick triggering - ' + msg);
            }

            _assertCommon(msg);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to override default click behavior using plotly_sunburstclick handler ()', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_first.json'));

        Plotly.plot(gd, mock)
        .then(setupListeners({turnOffAnimation: true}))
        .then(click(gd, 2))
        .then(function() {
            if(trackers.sunburstclick.length === 1) {
                expect(trackers.sunburstclick[0].event).toBeDefined();
                expect(trackers.sunburstclick[0].points[0].label).toBe('Seth');
            } else {
                fail('incorrect plotly_sunburstclick triggering');
            }

            if(trackers.click.length === 1) {
                expect(trackers.click[0].event).toBeDefined();
                expect(trackers.click[0].points[0].label).toBe('Seth');
            } else {
                fail('incorrect plotly_click triggering');
            }

            if(trackers.animating.length !== 0) {
                fail('incorrect plotly_animating triggering');
            }
        })
        .catch(failTest)
        .then(done);
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
                var layer = d3.select(gd).select('.sunburstlayer');
                expect(layer.selectAll('.trace').size()).toBe(exp, msg);
            };
        }

        Plotly.plot(gd, mock)
        .then(_assert('base', 2))
        .then(_restyle({'visible': false}))
        .then(_assert('both visible:false', 0))
        .then(_restyle({'visible': true}))
        .then(_assert('back to visible:true', 2))
        .catch(failTest)
        .then(done);
    });

    it('should be able to restyle *maxdepth* and *level* w/o recomputing the hierarchy', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/sunburst_coffee.json'));

        function _assert(msg, exp) {
            return function() {
                var layer = d3.select(gd).select('.sunburstlayer');

                expect(layer.selectAll('.slice').size()).toBe(exp, msg);

                // editType:plot
                if(msg !== 'base') {
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                }
            };
        }

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
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
                var layer = d3.select(gd).select('.sunburstlayer');

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

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
    });

    it('should be able to restyle *textinfo*', function(done) {
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
                var layer = d3.select(gd).select('.sunburstlayer');
                var tx = [];

                layer.selectAll('text.slicetext').each(function() {
                    var lines = d3.select(this).selectAll('tspan');

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

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
    });
});

describe('Test sunburst tweening:', function() {
    var gd;
    var pathTweenFnLookup;
    var textTweenFnLookup;

    beforeEach(function() {
        gd = createGraphDiv();

        // hacky way to track tween functions
        spyOn(d3.transition.prototype, 'attrTween').and.callFake(function(attrName, fn) {
            var lookup = {d: pathTweenFnLookup, transform: textTweenFnLookup}[attrName];
            var pt = this[0][0].__data__;
            var id = pt.data.data.id;

            // we should never tween the same node twice on a given sector click
            lookup[id] = lookup[id] ? null : fn(pt);
        });
    });

    afterEach(destroyGraphDiv);

    function _run(gd, v) {
        pathTweenFnLookup = {};
        textTweenFnLookup = {};

        click(gd, v)();

        // 1 second more than the click transition duration
        return delay(constants.CLICK_TRANSITION_TIME + 1);
    }

    function trim(s) {
        return s.replace(/\s/g, '');
    }

    function _assert(msg, attrName, id, exp) {
        var lookup = {d: pathTweenFnLookup, transform: textTweenFnLookup}[attrName];
        var fn = lookup[id];
        // normalize time in [0, 1] where we'll assert the tweening fn output,
        // asserting at the mid point *should be* representative enough
        var t = 0.5;
        var actual = trim(fn(t));

        // do not assert textBB translate piece,
        // which isn't tweened and has OS-dependent results
        if(attrName === 'transform') {
            actual = actual.split('translate').slice(0, 2).join('translate');
        }

        // we could maybe to bring in:
        // https://github.com/hughsk/svg-path-parser
        // to make these assertions more readable

        expect(actual).toBe(trim(exp), msg + ' | node ' + id + ' @t=' + t);
    }

    it('should tween sector exit/update (case: branch, no maxdepth)', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B']
            }]
        };

        Plotly.plot(gd, mock)
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
            _assert('move B text to new position', 'transform', 'B',
                'translate(313.45694251914836,271.54305748085164)'
            );
            _assert('move b text to new position', 'transform', 'b',
                'translate(274.4279627606877,310.57203723931224)'
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('should tween sector enter/update (case: entry, no maxdepth)', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                level: 'B'
            }]
        };

        Plotly.plot(gd, mock)
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
            _assert('move B text to new position', 'transform', 'B',
                'translate(316.8522926358638,268.1477073641362)'
            );
            _assert('move b text to new position', 'transform', 'b',
                'translate(274.4279627606877,310.57203723931224)'
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('should tween sector enter/update/exit (case: entry, maxdepth=2)', function(done) {
        var mock = {
            data: [{
                type: 'sunburst',
                labels: ['Root', 'A', 'B', 'b'],
                parents: ['', 'Root', 'Root', 'B'],
                maxdepth: 2
            }]
        };

        Plotly.plot(gd, mock)
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
            _assert('move B text to new position', 'transform', 'B',
                'translate(303.0160689531907,281.9839310468093)'
            );
            _assert('enter b text to new position', 'transform', 'b',
                'translate(248.75,235)'
            );
        })
        .catch(failTest)
        .then(done);
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

            var label = d3.select(gd).select('g.hovertext');
            expect(label.size()).toBe(exp.hoverLabel, msg + ' - hover label cnt');

            hoverCnt = 0;
            unhoverCnt = 0;
        }

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
    });

    it('should show falsy zero text', function(done) {
        Plotly.plot(gd, {
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
        .then(done);
    });

    it('should transition sunburst traces only', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/display-text_zero-number.json'));
        mock.data[0].visible = false;

        function _assert(msg, exp) {
            var gd3 = d3.select(gd);
            expect(gd3.select('.cartesianlayer').selectAll('.trace').size())
                .toBe(exp.cartesianTraceCnt, '# of cartesian traces');
            expect(gd3.select('.pielayer').selectAll('.trace').size())
                .toBe(exp.pieTraceCnt, '# of pie traces');
            expect(gd3.select('.sunburstlayer').selectAll('.trace').size())
                .toBe(exp.sunburstTraceCnt, '# of sunburst traces');
        }

        Plotly.plot(gd, mock)
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
        .catch(failTest)
        .then(done);
    });

    it('should be able to transition sunburst traces via `Plotly.react`', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/display-text_zero-number.json'));
        mock.layout.transition = {duration: 200};

        spyOn(Plots, 'transitionFromReact').and.callThrough();

        Plotly.plot(gd, mock)
        .then(function() {
            gd.data[1].level = 'B';
            return Plotly.react(gd, gd.data, gd.layout);
        })
        .then(delay(202))
        .then(function() {
            expect(Plots.transitionFromReact).toHaveBeenCalledTimes(1);
        })
        .catch(failTest)
        .then(done);
    });
});
