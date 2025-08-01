var Plotly = require('../../../lib/index');
var attributes = require('../../../src/traces/sankey/attributes');
var Lib = require('../../../src/lib');
var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var d3sankey = require('@plotly/d3-sankey');
var d3SankeyCircular = require('@plotly/d3-sankey-circular');
var mock = require('../../image/mocks/sankey_energy.json');
var mockDark = require('../../image/mocks/sankey_energy_dark.json');
var mockCircular = require('../../image/mocks/sankey_circular.json');
var mockCircularLarge = require('../../image/mocks/sankey_circular_large.json');
var mockXY = require('../../image/mocks/sankey_x_y.json');
var Sankey = require('../../../src/traces/sankey');
var Registry = require('../../../src/registry');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var getNodeCoords = require('../assets/get_node_coords');
var assertHoverLabelContent = require('../assets/custom_assertions').assertHoverLabelContent;
var assertHoverLabelStyle = require('../assets/custom_assertions').assertHoverLabelStyle;
var supplyAllDefaults = require('../assets/supply_defaults');
var defaultColors = require('../../../src/components/color/attributes').defaults;

var drag = require('../assets/drag');
var checkOverlap = require('../assets/check_overlap');
var delay = require('../assets/delay');
var selectButton = require('../assets/modebar_button');

describe('sankey tests', function() {
    'use strict';

    function _supply(traceIn) {
        var traceOut = { visible: true };
        var defaultColor = '#444';
        var layout = { colorway: defaultColors };

        Sankey.supplyDefaults(traceIn, traceOut, defaultColor, layout);

        return traceOut;
    }

    function _supplyWithLayout(traceIn, layout) {
        var traceOut = { visible: true };
        var defaultColor = '#444';

        Sankey.supplyDefaults(traceIn, traceOut, defaultColor, Lib.extendFlat({colorway: defaultColors}, layout));

        return traceOut;
    }

    describe('don\'t remove nodes if encountering no circularity', function() {
        it('removing a single self-pointing node', function() {
            var fullTrace = _supply({
                node: {
                    label: ['a', 'b']
                },
                link: {
                    value: [1],
                    source: [1],
                    target: [0]
                }
            });

            expect(fullTrace.node.label).toEqual(['a', 'b'], 'node labels retained');
            expect(fullTrace.link.value).toEqual([1], 'link value(s) retained');
            expect(fullTrace.link.source).toEqual([1], 'link source(s) retained');
            expect(fullTrace.link.target).toEqual([0], 'link target(s) retained');
        });
    });

    describe('No warnings for missing nodes', function() {
        // we used to warn when some nodes were not used in the links
        // not doing that anymore, it's not really consistent with
        // the rest of our data processing.
        it('some nodes are not linked', function() {
            var warnings = [];
            spyOn(Lib, 'warn').and.callFake(function(msg) {
                warnings.push(msg);
            });

            _supply({
                node: {
                    label: ['a', 'b', 'c']
                },
                link: {
                    value: [1],
                    source: [0],
                    target: [1]
                }
            });

            expect(warnings.length).toEqual(0);
        });
    });

    describe('sankey global defaults', function() {
        it('should not coerce trace opacity', function() {
            var gd = Lib.extendDeep({}, mock);

            supplyAllDefaults(gd);

            expect(gd._fullData[0].opacity).toBeUndefined();
        });
    });

    describe('sankey defaults', function() {
        it('\'Sankey\' specification should have proper arrays where mandatory',
            function() {
                var fullTrace = _supply({});

                expect(fullTrace.node.label)
                    .toEqual([], 'presence of node label array is guaranteed');

                expect(fullTrace.link.value)
                    .toEqual([], 'presence of link value array is guaranteed');

                expect(fullTrace.link.source)
                    .toEqual([], 'presence of link source array is guaranteed');

                expect(fullTrace.link.target)
                    .toEqual([], 'presence of link target array is guaranteed');

                expect(fullTrace.link.label)
                    .toEqual([], 'presence of link target array is guaranteed');

                expect(fullTrace.link.colorscales)
                    .toEqual([], 'presence of link colorscales array is guaranteed');
            });

        it('\'Sankey\' specification should have proper types',
            function() {
                var fullTrace = _supply({});

                expect(fullTrace.orientation)
                    .toEqual(attributes.orientation.dflt, 'use orientation by default');

                expect(fullTrace.valueformat)
                    .toEqual(attributes.valueformat.dflt, 'valueformat by default');

                expect(fullTrace.valuesuffix)
                    .toEqual(attributes.valuesuffix.dflt, 'valuesuffix by default');

                expect(fullTrace.arrangement)
                    .toEqual(attributes.arrangement.dflt, 'arrangement by default');

                expect(fullTrace.domain.x)
                    .toEqual(attributes.domain.x.dflt, 'x domain by default');

                expect(fullTrace.domain.y)
                    .toEqual(attributes.domain.y.dflt, 'y domain by default');
            });

        it('\'Sankey\' layout dependent specification should have proper types',
            function() {
                var fullTrace = _supplyWithLayout({}, {font: {
                    family: 'Arial',
                    weight: 'bold',
                    style: 'italic',
                    variant: 'small-caps',
                    textcase: 'word caps',
                    lineposition: 'under',
                    shadow: '1px 1px 2px green',
                }});
                expect(fullTrace.textfont)
                    .toEqual({
                        family: 'Arial',
                        weight: 'bold',
                        style: 'italic',
                        variant: 'small-caps',
                        textcase: 'word caps',
                        lineposition: 'under',
                        shadow: '1px 1px 2px green',
                    }, 'textfont is defined');
            });

        it('\'line\' specifications should yield the default values',
            function() {
                var fullTrace = _supply({});

                expect(fullTrace.node.line.color)
                    .toEqual('#444', 'default node line color');
                expect(fullTrace.node.line.width)
                    .toEqual(0.5, 'default node line thickness');

                expect(fullTrace.link.line.color)
                    .toEqual('#444', 'default link line color');
                expect(fullTrace.link.line.width)
                    .toEqual(0, 'default link line thickness');
            });

        it('fills \'node\' colors if not specified', function() {
            var fullTrace = _supply({
                node: {
                    label: ['a', 'b']
                },
                link: {
                    source: [0],
                    target: [1],
                    value: [1]
                }
            });

            expect(Array.isArray(fullTrace.node.color)).toBe(true, 'set up color array');
            expect(fullTrace.node.color).toEqual(['rgba(31, 119, 180, 0.8)', 'rgba(255, 127, 14, 0.8)']);
        });

        it('respects layout.colorway', function() {
            var fullTrace = _supplyWithLayout({
                node: {
                    label: ['a', 'b']
                },
                link: {
                    source: [0],
                    target: [1],
                    value: [1]
                }
            }, {colorway: ['rgb(255, 0, 0)', 'rgb(0, 0, 255)']});

            expect(Array.isArray(fullTrace.node.color)).toBe(true, 'set up color array');
            expect(fullTrace.node.color).toEqual(['rgba(255, 0, 0, 0.8)', 'rgba(0, 0, 255, 0.8)']);
        });

        it('does not fill \'link\' labels even if not specified', function() {
            var fullTrace = _supply({
                node: {
                    label: ['a', 'b']
                },
                link: {
                    source: [0, 1],
                    target: [1, 0],
                    value: [1, 2]
                }
            });

            expect(Array.isArray(fullTrace.link.label)).toBe(true, 'must be an array');
            expect(fullTrace.link.label).toEqual([], 'an array of empty strings');
        });

        it('preserves \'link\' labels if  specified', function() {
            var fullTrace = _supply({
                node: {
                    label: ['a', 'b']
                },
                link: {
                    source: [0, 1],
                    target: [1, 0],
                    value: [1, 2],
                    label: ['a', 'b']
                }
            });

            expect(Array.isArray(fullTrace.link.label)).toBe(true, 'must be an array');
            expect(fullTrace.link.label).toEqual(['a', 'b'], 'an array of the supplied values');
        });

        it('defaults to `snap` arrangement', function() {
            var fullTrace = _supply({
                link: {
                    source: [0],
                    target: [1],
                    value: [1]
                }
            });
            expect(fullTrace.arrangement).toBe('snap');
        });

        it('defaults to `freeform` arrangement if node.(x|y) is specified', function() {
            var fullTrace = _supply({
                node: {
                    x: [0, 0.5],
                    y: [0, 0.5]
                },
                link: {
                    source: [0],
                    target: [1],
                    value: [1]
                }
            });
            expect(fullTrace.arrangement).toBe('freeform');
        });
    });

    describe('sankey calc', function() {
        function _calc(trace) {
            var gd = { data: [trace] };

            supplyAllDefaults(gd);
            var fullTrace = gd._fullData[0];
            return Sankey.calc(gd, fullTrace);
        }

        var base = { type: 'sankey' };

        it('detects circularity', function() {
            var calcData = _calc(Lib.extendDeep({}, base, {
                node: {
                    label: ['a', 'b', 'c', 'd', 'e']
                },
                link: {
                    value: [1, 1, 1, 1],
                    source: [0, 1, 2, 3],
                    target: [1, 2, 0, 4]
                }
            }));
            expect(calcData[0].circular).toBeTruthy();
        });

        it('detects the absence of circularity', function() {
            var calcData = _calc(Lib.extendDeep({}, base, {
                node: {
                    label: ['a', 'b', 'c', 'd', 'e']
                },
                link: {
                    value: [1, 1, 1, 1],
                    source: [0, 1, 2, 3],
                    target: [1, 2, 4, 4]
                }
            }));
            expect(calcData[0].circular).toBe(false);
        });

        it('keep an index of groups', function() {
            var calcData = _calc(Lib.extendDeep({}, base, {
                node: {
                    label: ['a', 'b', 'c', 'd', 'e'],
                    groups: [[0, 1], [2, 3]]
                },
                link: {
                    value: [1, 1, 1, 1],
                    source: [0, 1, 2, 3],
                    target: [1, 2, 4, 4]
                }
            }));
            var groups = calcData[0]._nodes.filter(function(node) {
                return node.group;
            });
            expect(groups.length).toBe(2);
            expect(calcData[0].circular).toBe(false);
        });

        it('emits a warning if a node is part of more than one group', function() {
            var warnings = [];
            spyOn(Lib, 'warn').and.callFake(function(msg) {
                warnings.push(msg);
            });

            var calcData = _calc(Lib.extendDeep({}, base, {
                node: {
                    label: ['a', 'b', 'c', 'd', 'e'],
                    groups: [[0, 1], [1, 2, 3]]
                },
                link: {
                    value: [1, 1, 1, 1],
                    source: [0, 1, 2, 3],
                    target: [1, 2, 4, 4]
                }
            }));

            expect(warnings.length).toBe(1);

            // Expect node '1' to be in the first group
            expect(calcData[0]._groupLookup[1]).toBe(5);
        });
    });

    describe('lifecycle methods', function() {
        var gd;
        beforeEach(function() {
            gd = createGraphDiv();
        });
        afterEach(destroyGraphDiv);

        it('Plotly.deleteTraces with two traces removes the deleted plot', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            var mockCopy2 = Lib.extendDeep({}, mockDark);

            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3SelectAll('.sankey').size()).toEqual(1);
                    return Plotly.addTraces(gd, mockCopy2.data[0]);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(2);
                    expect(d3SelectAll('.sankey').size()).toEqual(2);
                    return Plotly.deleteTraces(gd, [0]);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3SelectAll('.sankey').size()).toEqual(1);
                    return Plotly.deleteTraces(gd, 0);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(0);
                    expect(d3SelectAll('.sankey').size()).toEqual(0);
                })
                .then(done, done.fail);
        });

        it('Plotly.deleteTraces removes draggers', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    expect(document.getElementsByClassName('bgsankey').length).toBe(1);
                    return Plotly.deleteTraces(gd, [0]);
                })
                .then(function() {
                    expect(document.getElementsByClassName('bgsankey').length).toBe(0);
                })
                .then(done, done.fail);
        });

        it('Plotly.newPlot does not show Sankey if \'visible\' is false', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3SelectAll('.sankey').size()).toEqual(1);
                    return Plotly.restyle(gd, 'visible', false);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3SelectAll('.sankey').size()).toEqual(0);
                    return Plotly.restyle(gd, 'visible', true);
                })
                .then(function() {
                    expect(gd.data.length).toEqual(1);
                    expect(d3SelectAll('.sankey').size()).toEqual(1);
                })
                .then(done, done.fail);
        });

        it('\'node\' remains visible even if \'value\' is very low', function(done) {
            var minimock = [{
                type: 'sankey',
                node: {
                    label: ['a', 'b1', 'b2']
                },
                link: {
                    source: [0, 0],
                    target: [1, 2],
                    value: [1000000, 0.001]
                }
            }];
            Plotly.newPlot(gd, minimock)
                .then(function() {
                    expect(d3SelectAll('.sankey .node-rect')[0].reduce(function(prevMin, rect) {
                        return Math.min(prevMin, d3Select(rect).attr('height'));
                    }, Infinity)).toEqual(0.5);
                })
                .then(done, done.fail);
        });

        it('switch from normal to circular Sankey on react', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);
            var mockCircularCopy = Lib.extendDeep({}, mockCircular);

            Plotly.newPlot(gd, mockCopy)
              .then(function() {
                  expect(gd.calcdata[0][0].circular).toBe(false);
                  return Plotly.react(gd, mockCircularCopy);
              })
              .then(function() {
                  expect(gd.calcdata[0][0].circular).toBe(true);
              })
              .then(done, done.fail);
        });

        it('switch from circular to normal Sankey on react', function(done) {
            var mockCircularCopy = Lib.extendDeep({}, mockCircular);

            Plotly.newPlot(gd, mockCircularCopy)
              .then(function() {
                  expect(gd.calcdata[0][0].circular).toBe(true);

                  // Remove circular links
                  var source = mockCircularCopy.data[0].link.source;
                  source.splice(6, 1);
                  source.splice(4, 1);

                  var target = mockCircularCopy.data[0].link.target;
                  target.splice(6, 1);
                  target.splice(4, 1);

                  return Plotly.react(gd, mockCircularCopy);
              })
              .then(function() {
                  expect(gd.calcdata[0][0].circular).toBe(false);
              })
              .then(done, done.fail);
        });

        it('can create groups, restyle groups and properly update DOM', function(done) {
            var mockCircularCopy = Lib.extendDeep({}, mockCircular);
            var firstGroup = [[2, 3], [0, 1]];
            var newGroup = [[2, 3]];
            mockCircularCopy.data[0].node.groups = firstGroup;

            Plotly.newPlot(gd, mockCircularCopy)
              .then(function() {
                  expect(gd._fullData[0].node.groups).toEqual(firstGroup);
                  return Plotly.restyle(gd, {'node.groups': [newGroup]});
              })
              .then(function() {
                  expect(gd._fullData[0].node.groups).toEqual(newGroup);

                  // Check that all links have updated their links
                  d3SelectAll('.sankey .sankey-link').each(function(d, i) {
                      var path = this.getAttribute('d');
                      expect(path).toBe(d.linkPath()(d), 'link ' + i + ' has wrong `d` attribute');
                  });

                  // Check that ghost nodes used for animations:
                  // 1) are drawn first so they apear behind
                  var seeRealNode = false;
                  var sankeyNodes = d3SelectAll('.sankey .sankey-node');
                  sankeyNodes.each(function(d, i) {
                      if(d.partOfGroup) {
                          if(seeRealNode) fail('node ' + i + ' is a ghost node and should be behind');
                      } else {
                          seeRealNode = true;
                      }
                  });
                  // 2) have an element for each grouped node
                  var L = sankeyNodes.filter(function(d) { return d.partOfGroup;}).size();
                  expect(L).toBe(newGroup.flat().length, 'does not have the right number of ghost nodes');
              })
              .then(done, done.fail);
        });

        it('switches from normal to circular Sankey on grouping', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy)
              .then(function() {
                  expect(gd.calcdata[0][0].circular).toBe(false);

                  // Group two nodes that creates a circularity
                  return Plotly.restyle(gd, 'node.groups', [[[1, 3]]]);
              })
              .then(function() {
                  expect(gd.calcdata[0][0].circular).toBe(true);
                  // Group two nodes that do not create a circularity
                  return Plotly.restyle(gd, 'node.groups', [[[1, 4]]]);
              })
              .then(function() {
                  expect(gd.calcdata[0][0].circular).toBe(false);
              })
              .then(done, done.fail);
        });

        it('prevents nodes from overlapping in snap arrangement', function(done) {
            function checkElementOverlap(i, j) {
                var base = document.querySelector('.sankey-node:nth-of-type(' + i + ')');
                base = base.querySelector('.node-rect');
                var compare = document.querySelector('.sankey-node:nth-of-type(' + j + ')');
                compare = compare.querySelector('.node-rect');
                return checkOverlap(base, compare);
            }

            var mockCopy = Lib.extendDeep({}, mockXY);

            Plotly.newPlot(gd, mockCopy)
            .then(function() {
                // Nodes overlap
                expect(checkElementOverlap(3, 6)).toBeTruthy('nodes do not overlap');

                mockCopy.data[0].arrangement = 'snap';
                return Plotly.newPlot(gd, mockCopy);
            })
            .then(function() {
                // Nodes do not overlap in snap
                expect(checkElementOverlap(3, 6)).not.toBeTruthy('nodes overlap');
            })
            .then(done, done.fail);
        });

        it('resets each subplot to its initial view (ie. x, y groups) via modebar button', function(done) {
            var mockCopy = Lib.extendDeep({}, require('../../image/mocks/sankey_subplots_circular'));

            // Set initial view
            mockCopy.data[0].node.x = [0.25];
            mockCopy.data[0].node.y = [0.25];

            mockCopy.data[0].node.groups = [];
            mockCopy.data[1].node.groups = [[2, 3]];

            Plotly.newPlot(gd, mockCopy)
            .then(function() {
                expect(gd._fullData[0].node.groups).toEqual([]);
                expect(gd._fullData[1].node.groups).toEqual([[2, 3]]);

                // Change groups
                return Plotly.restyle(gd, {
                    'node.groups': [[[1, 2]], [[]]],
                    'node.x': [[0.1]],
                    'node.y': [[0.1]]
                });
            })
            .then(function() {
                // Check current state
                expect(gd._fullData[0].node.x).toEqual([0.1]);
                expect(gd._fullData[0].node.y).toEqual([0.1]);

                expect(gd._fullData[0].node.groups).toEqual([[1, 2]]);
                expect(gd._fullData[1].node.groups).toEqual([[]]);

                // Click reset
                var resetButton = selectButton(gd._fullLayout._modeBar, 'resetViewSankey');
                resetButton.click();
            })
            .then(function() {
                // Check we are back to initial view
                expect(gd._fullData[0].node.x).toEqual([0.25]);
                expect(gd._fullData[0].node.y).toEqual([0.25]);

                expect(gd._fullData[0].node.groups).toEqual([]);
                expect(gd._fullData[1].node.groups).toEqual([[2, 3]]);
            })
            .then(done, done.fail);
        });

        it('works as a subplot in the presence of other trace types', function(done) {
            var mockCopy = Lib.extendDeep({}, require('../../image/mocks/sankey_subplots_circular'));

            mockCopy.data[0] = {
                y: [5, 1, 4, 3, 2]
            };

            Plotly.newPlot(gd, mockCopy)
            .then(done, done.fail);
        });

        ['0', '1'].forEach(function(finalUIRevision) {
            it('on Plotly.react, it preserves the groups depending on layout.uirevision', function(done) {
                var uirevisions = ['0', finalUIRevision];

                var mockCopy = Lib.extendDeep({}, mockCircular);
                mockCopy.layout.uirevision = uirevisions[0];

                Plotly.newPlot(gd, mockCopy)
                      .then(function() {
                          // Create a group via guiRestyle
                          return Registry.call('_guiRestyle', gd, 'node.groups', [[[0, 1]]]);
                      })
                      .then(function() {
                          // Check that the nodes are grouped
                          expect(gd._fullData[0].node.groups).toEqual([[0, 1]]);

                          // Change color of nodes
                          mockCopy = Lib.extendDeep({}, mockCircular);
                          mockCopy.data[0].node.color = 'orange';
                          mockCopy.layout.uirevision = uirevisions[1];
                          return Plotly.react(gd, mockCopy);
                      })
                      .then(function() {
                          if(uirevisions[0] === uirevisions[1]) {
                              // If uirevision is the same, the groups should stay the same
                              expect(gd._fullData[0].node.groups).toEqual(
                                [[0, 1]],
                                'should stay the same because uirevision did not change'
                              );
                          } else {
                              // If uirevision changed, the groups should be empty as in the figure obj
                              expect(gd._fullData[0].node.groups).toEqual(
                                [],
                                'should go back to its default because uirevision changed'
                              );
                          }
                      })
                      .then(done, done.fail);
            });
        });
    });

    describe('Test hover/click interactions:', function() {
        afterEach(destroyGraphDiv);

        function _hover(px, py) {
            mouseEvent('mousemove', px, py);
            mouseEvent('mouseover', px, py);
            Lib.clearThrottle();
        }

        var node = [410, 300];
        var link = [450, 300];

        it('should show the correct hover labels', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy).then(function() {
                _hover(410, 300);

                assertLabel(
                    ['Solid', 'incoming flow count: 4', 'outgoing flow count: 3', '447TWh'],
                    ['rgb(148, 103, 189)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );
            })
            .then(function() {
                _hover(450, 300);

                assertLabel(
                    ['source: Solid', 'target: Industry', '46TWh'],
                    ['rgb(0, 0, 96)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );
            })
            // Test layout.hoverlabel
            .then(function() {
                return Plotly.relayout(gd, 'hoverlabel.font.family', 'Roboto');
            })
            .then(function() {
                _hover(410, 300);

                assertLabel(
                    ['Solid', 'incoming flow count: 4', 'outgoing flow count: 3', '447TWh'],
                    ['rgb(148, 103, 189)', 'rgb(255, 255, 255)', 13, 'Roboto', 'rgb(255, 255, 255)']
                );
            })
            .then(function() {
                _hover(450, 300);

                assertLabel(
                    ['source: Solid', 'target: Industry', '46TWh'],
                    ['rgb(0, 0, 96)', 'rgb(255, 255, 255)', 13, 'Roboto', 'rgb(255, 255, 255)']
                );
            })
            // Test trace-level hoverlabel
            .then(function() {
                return Plotly.restyle(gd, {
                    'hoverlabel.bgcolor': 'blue',
                    'hoverlabel.bordercolor': 'red',
                    'hoverlabel.font.size': 22,
                    'hoverlabel.font.color': 'magenta'
                });
            })
            .then(function() {
                _hover(410, 300);

                assertLabel(
                    ['Solid', 'incoming flow count: 4', 'outgoing flow count: 3', '447TWh'],
                    ['rgb(0, 0, 255)', 'rgb(255, 0, 0)', 22, 'Roboto', 'rgb(255, 0, 255)']
                );
            })
            .then(function() {
                _hover(450, 300);

                assertLabel(
                    ['source: Solid', 'target: Industry', '46TWh'],
                    ['rgb(0, 0, 255)', 'rgb(255, 0, 0)', 22, 'Roboto', 'rgb(255, 0, 255)']
                );
            })
            // Test (node|link).hoverlabel
            .then(function() {
                return Plotly.restyle(gd, {
                    'node.hoverlabel.bgcolor': 'red',
                    'node.hoverlabel.bordercolor': 'blue',
                    'node.hoverlabel.font.size': 20,
                    'node.hoverlabel.font.color': 'black',
                    'node.hoverlabel.font.family': 'Roboto',
                    'link.hoverlabel.bgcolor': 'yellow',
                    'link.hoverlabel.bordercolor': 'magenta',
                    'link.hoverlabel.font.size': 18,
                    'link.hoverlabel.font.color': 'green',
                    'link.hoverlabel.font.family': 'Roboto'
                });
            })
            .then(function() {
                _hover(410, 300);

                assertLabel(
                    ['Solid', 'incoming flow count: 4', 'outgoing flow count: 3', '447TWh'],
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 20, 'Roboto', 'rgb(0, 0, 0)']
                );
            })
            .then(function() {
                _hover(450, 300);

                assertLabel(
                    ['source: Solid', 'target: Industry', '46TWh'],
                    ['rgb(255, 255, 0)', 'rgb(255, 0, 255)', 18, 'Roboto', 'rgb(0, 128, 0)']
                );
            })
            .then(done, done.fail);
        });

        it('@noCI should position hover labels correctly - horizontal', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy)
            .then(function() {
                _hover(900, 230);

                assertLabel(
                    ['source: Thermal generation', 'target: Losses', '787TWh'],
                    ['rgb(0, 0, 96)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );

                var g = d3Select('.hovertext');
                var pos = g.node().getBoundingClientRect();
                expect(pos.x).toBeCloseTo(555, -1.5, 'it should have correct x position');
                expect(pos.y).toBeCloseTo(196, -1.5, 'it should have correct y position');
            })
            .then(done, done.fail);
        });

        it('@noCI should position hover labels correctly - vertical ', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);
            mock.data[0].orientation = 'v';

            Plotly.newPlot(gd, mockCopy)
            .then(function() {
                _hover(600, 200);

                assertLabel(
                    ['source: Thermal generation', 'target: Losses', '787TWh'],
                    ['rgb(0, 0, 96)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );

                var g = d3Select('.hovertext');
                var pos = g.node().getBoundingClientRect();
                expect(pos.x).toBeCloseTo(781, -1.5);
                expect(pos.y).toBeCloseTo(196, -1.5);
            })
            .then(done, done.fail);
        });

        it('should show the correct hover labels when hovertemplate is specified', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].node.customdata = [];
            mockCopy.data[0].node.customdata[4] = ['nodeCustomdata0', 'nodeCustomdata1'];
            mockCopy.data[0].link.customdata = [];
            mockCopy.data[0].link.customdata[61] = ['linkCustomdata0', 'linkCustomdata1'];

            Plotly.newPlot(gd, mockCopy).then(function() {
                _hover(410, 300);

                assertLabel(
                    ['Solid', 'incoming flow count: 4', 'outgoing flow count: 3', '447TWh'],
                    ['rgb(148, 103, 189)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );
            })
            .then(function() {
                _hover(450, 300);

                assertLabel(
                    ['source: Solid', 'target: Industry', '46TWh'],
                    ['rgb(0, 0, 96)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );
            })
            // Test (node|link).hovertemplate
            .then(function() {
                return Plotly.restyle(gd, {
                    'node.hovertemplate': 'hovertemplate<br>%{value}<br>%{value:0.2f}<br>%{customdata[0]}/%{customdata[1]}<extra>%{fullData.name}</extra>',
                    'link.hovertemplate': 'hovertemplate<br>source: %{source.label}<br>target: %{target.label}<br>size: %{value:0.0f}TWh<br>%{customdata[1]}<extra>%{fullData.name}</extra>'
                });
            })
            .then(function() {
                _hover(410, 300);

                assertLabel(
                    [ 'hovertemplate', '447TWh', '447.48', 'nodeCustomdata0/nodeCustomdata1', 'trace 0'],
                    ['rgb(148, 103, 189)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );
            })
            .then(function() {
                _hover(450, 300);

                assertLabel(
                    ['hovertemplate', 'source: Solid', 'target: Industry', 'size: 46TWh', 'linkCustomdata1', 'trace 0'],
                    ['rgb(0, 0, 96)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                );
            })
            .then(done, done.fail);
        });

        it('should show the correct hover labels with the style provided in template', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.layout.template = {
                data: {
                    sankey: [{
                        node: {
                            hoverlabel: {
                                bgcolor: 'red',
                                bordercolor: 'blue',
                                font: {
                                    size: 20,
                                    color: 'black',
                                    family: 'Roboto'
                                }
                            }
                        },
                        link: {
                            hoverlabel: {
                                bgcolor: 'yellow',
                                bordercolor: 'magenta',
                                font: {
                                    size: 18,
                                    color: 'green',
                                    family: 'Roboto'
                                }
                            }
                        }
                    }]
                }
            };

            Plotly.newPlot(gd, mockCopy)
            .then(function() {
                _hover(410, 300);

                assertLabel(
                    ['Solid', 'incoming flow count: 4', 'outgoing flow count: 3', '447TWh'],
                    ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 20, 'Roboto', 'rgb(0, 0, 0)']
                );
            })
            .then(function() {
                _hover(450, 300);

                assertLabel(
                    ['source: Solid', 'target: Industry', '46TWh'],
                    ['rgb(255, 255, 0)', 'rgb(255, 0, 255)', 18, 'Roboto', 'rgb(0, 128, 0)']
                );
            })
            .then(done, done.fail);
        });

        it('should show the correct hover labels even if there is no link.label supplied', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);
            delete mockCopy.data[0].link.label;

            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    _hover(450, 300);

                    assertLabel(
                        ['source: Solid', 'target: Industry', '46TWh'],
                        ['rgb(0, 0, 96)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)']
                    );
                })
                .then(done, done.fail);
        });

        it('should show the multiple hover labels in a flow in hovermode `x`', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);
            Plotly.newPlot(gd, mockCopy).then(function() {
                _hover(351, 202);

                assertLabel(
                    ['source: Nuclear', 'target: Thermal generation', '100TWh'],
                    ['rgb(144, 238, 144)', 'rgb(68, 68, 68)', 13, 'Arial', 'rgb(68, 68, 68)']
                );

                var g = d3SelectAll('.hovertext');
                expect(g.size()).toBe(1);
                return Plotly.relayout(gd, 'hovermode', 'x');
            })
            .then(function() {
                _hover(351, 202);

                assertMultipleLabels(
                    [
                      ['Old generation plant (made-up)', 'source: Nuclear', 'target: Thermal generation', '500TWh'],
                      ['New generation plant (made-up)', 'source: Nuclear', 'target: Thermal generation', '140TWh'],
                      ['source: Nuclear', 'target: Thermal generation', '100TWh'],
                      ['source: Nuclear', 'target: Thermal generation', '100TWh']
                    ],
                    [
                      ['rgb(33, 102, 172)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)'],
                      ['rgb(178, 24, 43)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)'],
                      ['rgb(144, 238, 144)', 'rgb(68, 68, 68)', 13, 'Arial', 'rgb(68, 68, 68)'],
                      ['rgb(218, 165, 32)', 'rgb(68, 68, 68)', 13, 'Arial', 'rgb(68, 68, 68)']
                    ]
                );

                var g = d3Select('.hovertext:nth-child(3)');
                var domRect = g.node().getBoundingClientRect();
                expect((domRect.bottom + domRect.top) / 2).toBeCloseTo(203, 0, 'it should center the hoverlabel associated with hovered link');
            })
            .then(done, done.fail);
        });

        it('should not show any labels if hovermode is false', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy).then(function() {
                return Plotly.relayout(gd, 'hovermode', false);
            })
            .then(function() {
                _hover(node[0], node[1]);
                assertNoLabel();
            })
            .then(function() {
                _hover(link[0], link[1]);
                assertNoLabel();
            })
            .then(done, done.fail);
        });

        ['skip', 'none'].forEach(function(hoverinfoFlag) {
            it('should not show node labels if node.hoverinfo is ' + hoverinfoFlag, function(done) {
                var gd = createGraphDiv();
                var mockCopy = Lib.extendDeep({}, mock);

                Plotly.newPlot(gd, mockCopy).then(function() {
                    return Plotly.restyle(gd, 'node.hoverinfo', hoverinfoFlag);
                })
                .then(function() {
                    _hover(node[0], node[1]);
                    assertNoLabel();
                })
                .then(done, done.fail);
            });
        });

        ['skip', 'none'].forEach(function(hoverinfoFlag) {
            it('should not show link labels if link.hoverinfo is ' + hoverinfoFlag, function(done) {
                var gd = createGraphDiv();
                var mockCopy = Lib.extendDeep({}, mock);

                Plotly.newPlot(gd, mockCopy).then(function() {
                    return Plotly.restyle(gd, 'link.hoverinfo', hoverinfoFlag);
                })
                .then(function() {
                    _hover(link[0], link[1]);
                    assertNoLabel();
                })
                .then(done, done.fail);
            });
        });

        ['skip', 'none'].forEach(function(hoverinfoFlag) {
            it('should not show labels if trace hoverinfo is ' + hoverinfoFlag + ' and (node|link).hoverinfo is undefined', function(done) {
                var gd = createGraphDiv();
                var mockCopy = Lib.extendDeep({}, mock);

                Plotly.newPlot(gd, mockCopy).then(function() {
                    return Plotly.restyle(gd, 'hoverinfo', hoverinfoFlag);
                })
                .then(function() {
                    _hover(node[0], node[1]);
                    assertNoLabel();
                })
                .then(function() {
                    _hover(link[0], link[1]);
                    assertNoLabel();
                })
                .then(done, done.fail);
            });
        });

        it('should not show link labels if link.hoverinfo is skip', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy).then(function() {
                return Plotly.restyle(gd, 'link.hoverinfo', 'skip');
            })
            .then(function() {
                _hover(link[0], link[1]);
                assertNoLabel();
            })
            .then(done, done.fail);
        });

        it('should honor *hoverlabel.namelength*', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy)
            .then(function() { _hover(410, 300); })
            .then(function() {
                assertHoverLabelContent({
                    nums: 'Solid\nincoming flow count: 4\noutgoing flow count: 3',
                    name: '447TWh'
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hoverlabel.namelength', 3);
            })
            .then(function() { _hover(410, 300); })
            .then(function() {
                assertHoverLabelContent({
                    nums: 'Solid\nincoming flow count: 4\noutgoing flow count: 3',
                    name: '447'
                });
            })
            .then(done, done.fail);
        });

        it('should (un-)highlight all traces ending in a (un-)hovered node', function(done) {
            var gd = createGraphDiv();
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    _hover(200, 250);
                })
                .then(function() {
                    d3SelectAll('.sankey-link')
                        .filter(function(obj) {
                            return obj.link.label === 'stream 1';
                        })[0].forEach(function(l) {
                            expect(l.style.fillOpacity).toEqual('0.4');
                        });
                }).then(function() {
                    mouseEvent('mouseout', 200, 250);
                }).then(function() {
                    d3SelectAll('.sankey-link')
                        .filter(function(obj) {
                            return obj.link.label === 'stream 1';
                        })[0].forEach(function(l) {
                            expect(l.style.fillOpacity).toEqual('0.2');
                        });
                })
                .then(done, done.fail);
        });
    });

    describe('Test hover/click event data:', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function _makeWrapper(eventType, mouseFn) {
            var posByElementType = {
                node: [410, 300],
                link: [450, 300]
            };

            return function(elType) {
                return new Promise(function(resolve, reject) {
                    gd.once(eventType, function(d) {
                        Lib.clearThrottle();
                        resolve(d);
                    });

                    mouseFn(posByElementType[elType]);
                    setTimeout(function() {
                        reject(eventType + ' did not get called!');
                    }, 100);
                });
            };
        }

        var _hover = _makeWrapper('plotly_hover', function(pos) {
            mouseEvent('mouseover', pos[0], pos[1]);
        });

        var _click = _makeWrapper('plotly_click', function(pos) {
            mouseEvent('click', pos[0], pos[1]);
        });

        var _unhover = _makeWrapper('plotly_unhover', function(pos) {
            mouseEvent('mouseover', pos[0], pos[1]);
            mouseEvent('mouseout', pos[0], pos[1]);
        });

        function _assert(d, expectedPtData) {
            expect(d.event).toBeDefined('original event reference');

            var ptData = d.points[0];
            Object.keys(expectedPtData).forEach(function(k) {
                expect(ptData[k]).toBe(expectedPtData[k], 'point data for ' + k);
            });
        }

        it('should output correct click event data', function(done) {
            var fig = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, fig)
            .then(function() { return _click('node'); })
            .then(function(d) {
                _assert(d, {
                    curveNumber: 0,
                    pointNumber: 4,
                    label: 'Solid'
                });
            })
            .then(function() { return _click('link'); })
            .then(function(d) {
                _assert(d, {
                    curveNumber: 0,
                    pointNumber: 61,
                    value: 46.477
                });
            })
            .then(done, done.fail);
        });

        it('should output correct hover/unhover event data', function(done) {
            var fig = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, fig)
            .then(function() { return Plotly.restyle(gd, 'hoverinfo', 'none'); })
            .then(function() { return _hover('node'); })
            .then(function(d) {
                _assert(d, {
                    curveNumber: 0,
                    pointNumber: 4,
                    label: 'Solid',
                    value: 447.48
                });
                var pt = d.points[0];
                expect(pt.sourceLinks.length).toBe(3);
                expect(pt.targetLinks.length).toBe(4);
            })
            .then(function() { return _hover('link'); })
            .then(function(d) {
                _assert(d, {
                    curveNumber: 0,
                    pointNumber: 61,
                    value: 46.477
                });
                var pt = d.points[0];
                expect(pt.hasOwnProperty('source')).toBeTruthy();
                expect(pt.hasOwnProperty('target')).toBeTruthy();
                expect(pt.hasOwnProperty('flow')).toBeTruthy();

                expect(pt.flow.hasOwnProperty('concentration')).toBeTruthy();
                expect(pt.flow.hasOwnProperty('labelConcentration')).toBeTruthy();
                expect(pt.flow.hasOwnProperty('value')).toBeTruthy();
                expect(pt.flow.hasOwnProperty('links')).toBeTruthy();
            })
            .then(function() { return _unhover('node'); })
            .then(function(d) {
                _assert(d, {
                    curveNumber: 0,
                    pointNumber: 4,
                    label: 'Solid'
                });
            })
            .then(function() { return _unhover('link'); })
            .then(function(d) {
                _assert(d, {
                    curveNumber: 0,
                    pointNumber: 61,
                    value: 46.477
                });
            })
            .then(done, done.fail);
        });

        function assertNoHoverEvents(type) {
            return function() {
                return Promise.resolve()
                .then(function() { return _hover(type); })
                .then(failTest).catch(function(err) {
                    expect(err).toBe('plotly_hover did not get called!');
                })
                .then(function() { return _unhover(type); })
                .then(failTest).catch(function(err) {
                    expect(err).toBe('plotly_unhover did not get called!');
                });
            };
        }

        it('should not output hover/unhover event data when hovermode is false', function(done) {
            var fig = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, fig)
            .then(function() { return Plotly.relayout(gd, 'hovermode', false); })
            .then(assertNoHoverEvents('node'))
            .then(assertNoHoverEvents('link'))
            .then(done, done.fail);
        });

        it('should not output hover/unhover event data when trace hoverinfo is skip', function(done) {
            var fig = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, fig)
            .then(function() { return Plotly.restyle(gd, 'hoverinfo', 'skip'); })
            .then(assertNoHoverEvents('link'))
            .then(assertNoHoverEvents('node'))
            .then(done, done.fail);
        });

        it('should not output hover/unhover event data when link.hoverinfo is skip', function(done) {
            var fig = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, fig)
                  .then(function() { return Plotly.restyle(gd, 'link.hoverinfo', 'skip'); })
                  .then(assertNoHoverEvents('link'))
                  .then(done, done.fail);
        });

        it('should not output hover/unhover event data when node.hoverinfo is skip', function(done) {
            var fig = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, fig)
                  .then(function() { return Plotly.restyle(gd, 'node.hoverinfo', 'skip'); })
                  .then(assertNoHoverEvents('node'))
                  .then(done, done.fail);
        });
    });

    describe('Test drag interactions', function() {
        ['freeform', 'perpendicular', 'snap'].forEach(function(arrangement) {
            describe('for arrangement ' + arrangement + ':', function() {
                var gd;
                var mockCopy;
                var nodeId = 4; // Selecting node with label 'Solid'

                beforeEach(function() {
                    gd = createGraphDiv();
                    mockCopy = Lib.extendDeep({}, mock);
                });

                afterEach(function() {
                    Plotly.purge(gd);
                    destroyGraphDiv();
                });

                function testDragNode(move) {
                    return function() {
                        var position;
                        var nodes;
                        var node;

                        return Promise.resolve()
                        .then(function() {
                            nodes = document.getElementsByClassName('sankey-node');
                            node = nodes.item(nodeId);
                            position = getNodeCoords(node);
                            var timeDelay = (arrangement === 'snap') ? 2000 : 0; // Wait for force simulation to finish
                            return drag({node: node, dpos: move, nsteps: 10, timeDelay: timeDelay});
                        })
                        .then(function() {
                            nodes = document.getElementsByClassName('sankey-node');
                            node = nodes.item(nodes.length - 1); // Dragged node is now the last one
                            var newPosition = getNodeCoords(node);
                            if(arrangement === 'freeform') {
                                expect(newPosition.x).toBeCloseTo(position.x + move[0], 0, 'final x position is off');
                            }
                            expect(newPosition.y).toBeCloseTo(position.y + move[1], 2, 'final y position is off');
                            return Promise.resolve(true);
                        });
                    };
                }

                it('should change the position of a node on drag', function(done) {
                    mockCopy.data[0].arrangement = arrangement;
                    var move = [50, -150];

                    Plotly.newPlot(gd, mockCopy)
                      .then(testDragNode(move))
                      .then(done, done.fail);
                });

                it('should not change the position of a node if the mouse does not move', function(done) {
                    mockCopy.data[0].arrangement = arrangement;
                    var move = [0, 0];

                    Plotly.newPlot(gd, mockCopy)
                      .then(testDragNode(move))
                      .then(done, done.fail);
                });

                it('should persist the position of every nodes after drag in attributes nodes.(x|y)', function(done) {
                    mockCopy.data[0].arrangement = arrangement;
                    var move = [50, -50];
                    var nodes;
                    var node;
                    var x, x1;
                    var y, y1;
                    var precision = 2;

                    Plotly.newPlot(gd, mockCopy)
                      .then(function() {
                          x = gd._fullData[0].node.x.slice();
                          y = gd._fullData[0].node.y.slice();
                          expect(x.length).toBe(0);
                          expect(y.length).toBe(0);

                          nodes = document.getElementsByClassName('sankey-node');
                          node = nodes.item(nodeId);
                          return drag({node: node, dpos: move});
                      })
                      .then(function() {
                          x = gd._fullData[0].node.x.slice();
                          y = gd._fullData[0].node.y.slice();
                          expect(x.length).toBe(mockCopy.data[0].node.label.length);
                          expect(y.length).toBe(mockCopy.data[0].node.label.length);

                          nodes = document.getElementsByClassName('sankey-node');
                          node = nodes.item(nodes.length - 1); // Dragged node is now the last one
                          return drag({node: node, dpos: move, timeDelay: arrangement === 'snap' ? 200 : 0}); // Wait for animation to finish
                      })
                      .then(function() {
                          x1 = gd._fullData[0].node.x.slice();
                          y1 = gd._fullData[0].node.y.slice();
                          if(arrangement === 'freeform') expect(x1[nodeId]).not.toBeCloseTo(x[nodeId], 2, 'node ' + nodeId + ' has not changed x position');
                          expect(y1[nodeId]).not.toBeCloseTo(y[nodeId], precision, 'node ' + nodeId + ' has not changed y position');

                          // All nodes should have same x, y values after drag
                          for(var i = 0; i < x.length; i++) {
                              if(i === nodeId) continue; // except the one was just dragged
                              if(arrangement === 'freeform') expect(x1[i]).toBeCloseTo(x[i], 3, 'node ' + i + ' has changed x position');
                              expect(y1[i]).toBeCloseTo(y[i], precision, 'node ' + i + ' has changed y position');
                          }
                          return true;
                      })
                      .then(done, done.fail);
                });
            });
        });

        describe('in relation to uirevision', function() {
            var gd;

            beforeEach(function() {
                gd = createGraphDiv();
            });

            afterEach(function() {
                Plotly.purge(gd);
                destroyGraphDiv();
            });

            ['0', '1'].forEach(function(finalUIRevision) {
                it('on Plotly.react, it preserves the position of nodes depending on layout.uirevision', function(done) {
                    var nodes, node, positionBeforeDrag, positionAfterDrag;
                    var move = [-50, 100];
                    var uirevisions = ['0', finalUIRevision];

                    // Use a freeform arrangement
                    var mockCircularFreeform = Lib.extendDeep({}, mockCircular);
                    mockCircularFreeform.data[0].arrangement = 'freeform';

                    var mockCopy = Lib.extendDeep({}, mockCircularFreeform);
                    mockCopy.layout.uirevision = uirevisions[0];

                    Plotly.newPlot(gd, mockCopy)
                      .then(function() {
                          // move a node around
                          nodes = document.getElementsByClassName('sankey-node');
                          node = Array.prototype.slice.call(nodes).find(function(n) { return n.textContent === '0';});
                          positionBeforeDrag = getNodeCoords(node);
                          positionBeforeDrag = [positionBeforeDrag.x, positionBeforeDrag.y];
                          positionAfterDrag = [positionBeforeDrag[0] + move[0], positionBeforeDrag[1] + move[1]];
                          return drag({node: node, dpos: move, nsteps: 10, timeDelay: 1000});
                      })
                      .then(function() {
                          // Check that the node was really moved
                          nodes = document.getElementsByClassName('sankey-node');
                          node = Array.prototype.slice.call(nodes).find(function(n) { return n.textContent === '0';});
                          var newPosition = getNodeCoords(node);
                          expect(newPosition.x).toBeCloseTo(positionAfterDrag[0], 2, 'final x position is off');
                          expect(newPosition.y).toBeCloseTo(positionAfterDrag[1], 2, 'final y position is off');

                          // Change color of nodes
                          var mockCopy = Lib.extendDeep({}, mockCircularFreeform);
                          mockCopy.data[0].node.color = 'orange';
                          mockCopy.layout.uirevision = uirevisions[1];
                          return Plotly.react(gd, mockCopy);
                      })
                      .then(delay(1000))
                      .then(function() {
                          nodes = document.getElementsByClassName('sankey-node');
                          node = Array.prototype.slice.call(nodes).find(function(n) { return n.textContent === '0';});
                          var newPosition = getNodeCoords(node);

                          var pos, msg;
                          if(uirevisions[0] === uirevisions[1]) {
                              // If uirevision is the same, the node should stay where it is
                              pos = positionAfterDrag;
                              msg = 'should stay the same because uirevision did not change';
                          } else {
                              // If uirevision changed, the node should go back to its default position
                              pos = positionBeforeDrag;
                              msg = 'should go back to its default because uirevision changed';
                          }
                          expect(newPosition.x).toBeCloseTo(pos[0], 2, 'x position ' + msg);
                          expect(newPosition.y).toBeCloseTo(pos[1], 2, 'y position ' + msg);
                      })
                      .then(done, done.fail);
                });
            });
        });
    });

    it('emits a warning if node.pad is too large', function(done) {
        var gd = createGraphDiv();
        var mockCopy = Lib.extendDeep({}, mock);

        var warnings = [];
        spyOn(Lib, 'warn').and.callFake(function(msg) {
            warnings.push(msg);
        });
        Plotly.newPlot(gd, mockCopy).then(function() {
            expect(warnings.length).toEqual(0);

            return Plotly.restyle(gd, 'node.pad', 50);
        })
        .then(function() {
            expect(warnings.length).toEqual(1);
        })
        .catch(failTest)
        .finally(destroyGraphDiv)
        .then(done);
    });
});

function assertLabel(content, style) {
    assertMultipleLabels([content], [style]);
}

function assertMultipleLabels(contentArray, styleArray) {
    var g = d3SelectAll('.hovertext');
    expect(g.size()).toEqual(contentArray.length);
    g.each(function(el, i) {
        _assertLabelGroup(d3Select(this), contentArray[i], styleArray[i]);
    });
}

function _assertLabelGroup(g, content, style) {
    var lines = g.selectAll('.nums .line');
    var name = g.selectAll('.name');
    var tooltipBoundingBox = g.node().getBoundingClientRect();
    var nameBoundingBox = name.node().getBoundingClientRect();

    expect(tooltipBoundingBox.top <= nameBoundingBox.top);
    expect(tooltipBoundingBox.bottom >= nameBoundingBox.bottom);

    expect(lines.size()).toBe(content.length - 1);

    lines.each(function(_, i) {
        expect(d3Select(this).text()).toBe(content[i]);
    });

    expect(name.text()).toBe(content[content.length - 1]);

    assertHoverLabelStyle(g, {
        bgcolor: style[0],
        bordercolor: style[1],
        fontSize: style[2],
        fontFamily: style[3],
        fontColor: style[4]
    });
}

function assertNoLabel() {
    var g = d3SelectAll('.hovertext');
    expect(g.size()).toBe(0);
}

describe('sankey layout generators', function() {
    function checkArray(arr, key, result) {
        var value = arr.map(function(obj) {
            return obj[key];
        });
        expect(value).toEqual(result, 'invalid property named ' + key);
    }

    function checkRoundedArray(arr, key, result) {
        var value = arr.map(function(obj) {
            return Math.round(obj[key]);
        });
        expect(value).toEqual(result, 'invalid property named ' + key);
    }

    function moveNode(sankey, graph, nodeIndex, delta) {
        var node = graph.nodes[nodeIndex];
        var pos0 = [node.x0, node.y0];
        var pos1 = [node.x1, node.y1];

        // Update node's position
        node.x0 += delta[0];
        node.x1 += delta[0];
        node.y0 += delta[1];
        node.y1 += delta[1];

        // Update links
        var updatedGraph = sankey.update(graph);

        // Check node position
        expect(updatedGraph.nodes[nodeIndex].x0).toBeCloseTo(pos0[0] + delta[0], 0);
        expect(updatedGraph.nodes[nodeIndex].x1).toBeCloseTo(pos1[0] + delta[0], 0);
        expect(updatedGraph.nodes[nodeIndex].y0).toBeCloseTo(pos0[1] + delta[1], 0);
        expect(updatedGraph.nodes[nodeIndex].y1).toBeCloseTo(pos1[1] + delta[1], 0);

        return updatedGraph;
    }

    describe('d3-sankey', function() {
        function _calc(trace) {
            var gd = { data: [trace] };

            supplyAllDefaults(gd);
            var fullTrace = gd._fullData[0];
            return Sankey.calc(gd, fullTrace);
        }
        var data;
        var sankey;
        var graph;
        var margin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };
        var width = 1200 - margin.left - margin.right;
        var height = 740 - margin.top - margin.bottom;

        beforeEach(function() {
            data = _calc({
                type: 'sankey',
                node: {
                    label: ['node0', 'node1', 'node2', 'node3', 'node4'],
                    x: [0, 20, 40, 60, 80, 100, 120, 140],
                    y: [0, 20, 40, 60, 80, 100, 120, 140]
                },
                link: {
                    source: [0, 1, 1, 0, 2, 2, 3],
                    target: [2, 2, 3, 4, 3, 4, 4],
                    value: [2, 2, 2, 2, 2, 2, 4]
                }
            });
            data = {
                nodes: data[0]._nodes,
                links: data[0]._links
            };
            sankey = d3sankey
            .sankey()
            .nodeWidth(36)
            .nodePadding(10)
            .nodes(data.nodes)
            .links(data.links)
            .size([width, height])
            .iterations(32);

            graph = sankey();
        });

        it('controls the width of nodes', function() {
            expect(sankey.nodeWidth()).toEqual(36, 'incorrect nodeWidth');
        });

        it('controls the padding between nodes', function() {
            expect(sankey.nodePadding()).toEqual(10, 'incorrect nodePadding');
        });

        it('controls the padding between nodes', function() {
            expect(sankey.nodePadding()).toEqual(10, 'incorrect nodePadding');
        });

        it('keep a list of nodes', function() {
            checkArray(graph.nodes, 'label', ['node0', 'node1', 'node2', 'node3', 'node4']);
        });

        it('keep a list of nodes with x and y values', function() {
            checkRoundedArray(graph.nodes, 'x0', [0, 0, 381, 763, 1144]);
            checkRoundedArray(graph.nodes, 'y0', [0, 365, 184, 253, 0]);
        });

        it('keep a list of nodes with positions in integer (depth, height)', function() {
            checkArray(graph.nodes, 'depth', [0, 0, 1, 2, 3]);
            checkArray(graph.nodes, 'height', [3, 3, 2, 1, 0]);
        });

        it('keep a list of links', function() {
            var linkWidths = sankey().links.map(function(obj) {
                return (obj.width);
            });
            expect(linkWidths).toEqual([177.5, 177.5, 177.5, 177.5, 177.5, 177.5, 355]);
        });

        it('controls the size of the figure', function() {
            expect(sankey.size()).toEqual([1180, 720], 'incorrect size');
        });

        it('updates links vertical position upon moving nodes', function() {
            var nodeIndex = 0;
            var linkIndex = 0;
            var delta = [200, 300];

            var linkY0 = graph.links[linkIndex].y0;
            var updatedGraph = moveNode(sankey, graph, nodeIndex, delta);
            expect(updatedGraph.links[linkIndex].y0).toBeCloseTo(linkY0 + delta[1]);
        });
    });

    describe('d3-sankey-circular', function() {
        var data, sankey, graph;

        describe('implements d3-sankey compatible API', function() {
            function _calc(trace) {
                var gd = { data: [trace] };

                supplyAllDefaults(gd);
                var fullTrace = gd._fullData[0];
                return Sankey.calc(gd, fullTrace);
            }

            beforeEach(function() {
                data = _calc(mockCircular.data[0]);
                data = {
                    nodes: data[0]._nodes,
                    links: data[0]._links
                };
                sankey = d3SankeyCircular
                  .sankeyCircular()
                  .iterations(32)
                  .circularLinkGap(2)
                  .nodePadding(10)
                  .size([500, 500])
                  .nodeId(function(d) {
                      return d.pointNumber;
                  })
                  .nodes(data.nodes)
                  .links(data.links);

                graph = sankey();
            });

            it('creates a graph with circular links', function() {
                expect(graph.nodes.length).toEqual(6, 'there are 6 nodes');
                var circularLinks = graph.links.filter(function(link) {
                    return link.circular;
                });
                expect(circularLinks.length).toEqual(2, 'there are two circular links');
            });

            it('keep a list of nodes with positions in integer (depth, height)', function() {
                checkArray(graph.nodes, 'depth', [0, 0, 2, 3, 1, 1]);
                checkArray(graph.nodes, 'height', [1, 3, 1, 0, 2, 0]);
            });

            it('keep a list of nodes with positions in x and y', function() {
                checkRoundedArray(graph.nodes, 'x0', [72, 72, 267, 365, 169, 169]);
                checkRoundedArray(graph.nodes, 'y0', [303, 86, 72, 109, 86, 359]);
            });

            it('supports column reordering', function() {
                checkArray(graph.nodes, 'column', [0, 0, 2, 3, 1, 1]);

                var a = graph.nodes[0].x0;
                var reorder = [ 2, 2, 1, 1, 0, 0 ];
                sankey.nodeAlign(function(node) {
                    return reorder[node.pointNumber];
                });
                graph = sankey();
                checkArray(graph.nodes, 'column', reorder);
                checkArray(graph.nodes, 'height', [1, 3, 1, 0, 2, 0]);
                var b = graph.nodes[0].x0;
                expect(a).not.toEqual(b);
            });

            it('updates links vertical position and circularLinkType upon moving nodes', function() {
                var linkIndex = 6;
                var nodeIndex = 2;
                var delta = [0, 400];

                var link = graph.links[linkIndex];
                var linkY1 = link.y1;
                var node = graph.nodes[nodeIndex];
                var offsetTopToBottom = (node.y1 - node.y0) * link.value / node.value;

                // Start with a circular link on top
                expect(link.circular).toBeTruthy();
                expect(link.circularLinkType).toEqual('top');

                // Update graph
                var updatedGraph = moveNode(sankey, graph, nodeIndex, delta);
                var updatedLink = updatedGraph.links[linkIndex];

                // End up with a cirular link on bottom
                expect(updatedLink.circular).toBeTruthy();
                expect(updatedLink.circularLinkType).toEqual('bottom');
                expect(updatedLink.y1).toBeCloseTo(linkY1 + delta[1] + offsetTopToBottom, 0);
            });
        });

        describe('handles large number of links', function() {
            function _calc(trace) {
                var gd = { data: [trace] };

                supplyAllDefaults(gd);
                var fullTrace = gd._fullData[0];
                return Sankey.calc(gd, fullTrace);
            }

            beforeEach(function() {
                data = _calc(mockCircularLarge.data[0]);
                data = {
                    nodes: data[0]._nodes,
                    links: data[0]._links
                };
                sankey = d3SankeyCircular
                  .sankeyCircular()
                  .iterations(32)
                  .nodePadding(10)
                  .size([500, 500])
                  .nodeId(function(d) {
                      return d.pointNumber;
                  })
                  .nodes(data.nodes)
                  .links(data.links);

                graph = sankey();
            });

            it('creates a graph with circular links', function() {
                expect(graph.nodes.length).toEqual(26, 'right number of nodes');
                var circularLinks = graph.links.filter(function(link) {
                    return link.circular;
                });
                expect(circularLinks.length).toEqual(89, 'right number of circular links');
            });
        });
    });
});
