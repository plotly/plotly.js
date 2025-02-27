var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/index');
var alignmentConstants = require('../../../src/constants/alignment');
var interactConstants = require('../../../src/constants/interactions');
var Lib = require('../../../src/lib');
var rgb = require('../../../src/components/color').rgb;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


describe('Plot title', function() {
    'use strict';

    var data = [{x: [1, 2, 3], y: [1, 2, 3]}];
    var titlePad = {t: 10, r: 10, b: 10, l: 10};
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    var containerElemSelector = {
        desc: 'container',
        select: function() {
            return d3SelectAll('.svg-container').node();
        },
        ref: 'container'
    };

    var paperElemSelector = {
        desc: 'plot area',
        select: function() {
            var bgLayer = d3SelectAll('.bglayer .bg');
            expect(bgLayer.empty()).toBe(false,
              'No background layer found representing the size of the plot area');
            return bgLayer.node();
        },
        ref: 'paper'
    };

    it('is centered horizontally and vertically above the plot by default', function(done) {
        Plotly.newPlot(gd, data, {title: {text: 'Plotly line chart'}})
        .then(function() {
            expectDefaultCenteredPosition(gd);
        })
        .then(done, done.fail);
    });

    it('can be updated via `relayout`', function(done) {
        Plotly.newPlot(gd, data, { title: { text: 'Plotly line chart' } })
          .then(expectTitleFn('Plotly line chart'))
          .then(function() {
              return Plotly.relayout(gd, {title: {text: 'Some other title'}});
          })
          .then(expectTitleFn('Some other title'))
          .then(done, done.fail);
    });

    // Horizontal alignment
    [
        {
            selector: containerElemSelector,
            xref: 'container'
        },
        {
            selector: paperElemSelector,
            xref: 'paper'
        }
    ].forEach(function(testCase) {
        it('can be placed at the left edge of the ' + testCase.selector.desc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: testCase.xref,
                x: 0,
                xanchor: 'left'
            }))
            .then(function() {
                expectLeftEdgeAlignedTo(testCase.selector);
            })
            .then(done, done.fail);
        });

        it('can be placed at the right edge of the ' + testCase.selector.desc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: testCase.xref,
                x: 1,
                xanchor: 'right'
            }))
            .then(function() {
                expectRightEdgeAlignedTo(testCase.selector);
            })
            .then(done, done.fail);
        });

        it('can be placed at the center of the ' + testCase.selector.desc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: testCase.xref,
                x: 0.5,
                xanchor: 'center'
            }))
            .then(function() {
                expectCenteredWithin(testCase.selector);
            })
            .then(done, done.fail);
        });
    });

    // Vertical alignment
    [
        {
            selector: containerElemSelector,
            yref: 'container'
        },
        {
            selector: paperElemSelector,
            yref: 'paper'
        }
    ].forEach(function(testCase) {
        it('can be placed at the top edge of the ' + testCase.selector.desc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: testCase.yref,
                y: 1,
                yanchor: 'top'
            }))
            .then(function() {
                expectCapLineAlignsWithTopEdgeOf(testCase.selector);
            })
            .then(done, done.fail);
        });

        it('can be placed at the bottom edge of the ' + testCase.selector.desc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: testCase.yref,
                y: 0,
                yanchor: 'bottom'
            }))
            .then(function() {
                expectBaselineAlignsWithBottomEdgeOf(testCase.selector);
            })
            .then(done, done.fail);
        });

        it('can be placed in the vertical center of the ' + testCase.selector.desc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: testCase.yref,
                y: 0.5,
                yanchor: 'middle'
            }))
            .then(function() {
                expectCenteredVerticallyWithin(testCase.selector);
            })
            .then(done, done.fail);
        });
    });

    // y 'auto' value
    it('provides a y \'auto\' value putting title baseline in middle ' +
      'of top margin irrespective of `yref`', function(done) {
        // yref: 'container'
        Plotly.newPlot(gd, data, extendLayout({
            yref: 'container',
            y: 'auto'
        }))
        .then(function() {
            expectBaselineInMiddleOfTopMargin(gd);

            // yref: 'paper'
            return Plotly.relayout(gd, {'title.yref': 'paper'});
        })
        .then(function() {
            expectBaselineInMiddleOfTopMargin(gd);
        })
        .then(done, done.fail);
    });

    // xanchor 'auto' test
    [
        {x: 0, expAlignment: 'start'},
        {x: 0.3, expAlignment: 'start'},
        {x: 0.4, expAlignment: 'middle'},
        {x: 0.5, expAlignment: 'middle'},
        {x: 0.6, expAlignment: 'middle'},
        {x: 0.7, expAlignment: 'end'},
        {x: 1, expAlignment: 'end'}
    ].forEach(function(testCase) {
        runXAnchorAutoTest(testCase, 'container');
        runXAnchorAutoTest(testCase, 'paper');
    });

    function runXAnchorAutoTest(testCase, xref) {
        var testDesc = 'with {xanchor: \'auto\', x: ' + testCase.x + ', xref: \'' + xref +
          '\'} expected to be aligned ' + testCase.expAlignment;
        it(testDesc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: xref,
                x: testCase.x,
                xanchor: 'auto'
            }))
            .then(function() {
                var textAnchor = titleSel().attr('text-anchor');
                expect(textAnchor).toBe(testCase.expAlignment, testDesc);
            })
            .then(done, done.fail);
        });
    }

    // yanchor 'auto' test
    //
    // Note: in contrast to xanchor, there's no SVG attribute like
    // text-anchor we can safely assume to work in all browsers. Thus the
    // dy attribute has to be used and as a consequence it's much harder to test
    // arbitrary vertical alignment options. Because of that only the
    // most common use cases are tested in this regard.
    [
        {y: 0, expAlignment: 'bottom', expFn: expectBaselineAlignsWithBottomEdgeOf},
        {y: 0.5, expAlignment: 'middle', expFn: expectCenteredVerticallyWithin},
        {y: 1, expAlignment: 'top', expFn: expectCapLineAlignsWithTopEdgeOf},
    ].forEach(function(testCase) {
        runYAnchorAutoTest(testCase, 'container', containerElemSelector);
        runYAnchorAutoTest(testCase, 'paper', paperElemSelector);
    });

    function runYAnchorAutoTest(testCase, yref, elemSelector) {
        var testDesc = 'with {yanchor: \'auto\', y: ' + testCase.y + ', yref: \'' + yref +
          '\'} expected to be aligned ' + testCase.expAlignment;
        it(testDesc, function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: yref,
                y: testCase.y,
                yanchor: 'auto'
            }))
            .then(function() {
                testCase.expFn(elemSelector);
            })
            .then(done, done.fail);
        });
    }

    it('{y: \'auto\'} overrules {yanchor: \'auto\'} to support behavior ' +
      'before chart title alignment was introduced', function(done) {
        Plotly.newPlot(gd, data, extendLayout({
            y: 'auto',
            yanchor: 'auto'
        }))
        .then(function() {
            expectDefaultCenteredPosition(gd);
        })
        .then(done, done.fail);
    });

    // Horizontal padding
    [containerElemSelector, paperElemSelector].forEach(function(refSelector) {
        it('can be placed x pixels away from left ' + refSelector.desc + ' edge', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: refSelector.ref,
                xanchor: 'left',
                x: 0,
                pad: titlePad
            }))
            .then(function() {
                expect(titleSel().attr('text-anchor')).toBe('start');
                expect(titleX() - 10).toBe(leftOf(refSelector));
            })
            .then(done, done.fail);
        });
    });

    [containerElemSelector, paperElemSelector].forEach(function(refSelector) {
        it('can be placed x pixels away from right ' + refSelector.desc + ' edge', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: refSelector.ref,
                xanchor: 'right',
                x: 1,
                pad: titlePad
            }))
            .then(function() {
                expect(titleSel().attr('text-anchor')).toBe('end');
                expect(titleX() + 10).toBe(rightOf(refSelector));
            })
            .then(done, done.fail);
        });
    });

    [containerElemSelector, paperElemSelector].forEach(function(refSelector) {
        it('figures out for itself which horizontal padding applies when {xanchor: \'auto\'}' +
          refSelector.desc + ' edge', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: refSelector.ref,
                xanchor: 'auto',
                x: 1,
                pad: titlePad
            }))
            .then(function() {
                expect(titleSel().attr('text-anchor')).toBe('end');
                expect(titleX() + 10).toBe(rightOf(refSelector));

                return Plotly.relayout(gd, 'title.x', 0);
            })
            .then(function() {
                expect(titleSel().attr('text-anchor')).toBe('start');
                expect(titleX() - 10).toBe(leftOf(refSelector));

                return Plotly.relayout(gd, 'title.x', 0.5);
            })
            .then(function() {
                expectCenteredWithin(refSelector);
            })
            .then(done, done.fail);
        });
    });

    // Cases when horizontal padding is ignored
    // (just testing with paper is sufficient)
    [
        {pad: {l: 20}, dir: 'left'},
        {pad: {r: 20}, dir: 'right'}
    ].forEach(function(testCase) {
        it('mutes ' + testCase.dir + ' padding for {xanchor: \'center\'}', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                xref: 'paper',
                xanchor: 'middle',
                x: 0.5,
                pad: testCase.pad
            }))
            .then(function() {
                expectCenteredWithin(paperElemSelector);
            })
            .then(done, done.fail);
        });
    });

    it('mutes left padding when xanchor is right', function(done) {
        Plotly.newPlot(gd, data, extendLayout({
            xref: 'paper',
            x: 1,
            xanchor: 'right',
            pad: {
                l: 1000
            }
        }))
        .then(function() {
            expectRightEdgeAlignedTo(paperElemSelector);
        })
        .then(done, done.fail);
    });

    it('mutes right padding when xanchor is left', function(done) {
        Plotly.newPlot(gd, data, extendLayout({
            xref: 'paper',
            x: 0,
            xanchor: 'left',
            pad: {
                r: 1000
            }
        }))
        .then(function() {
            expectLeftEdgeAlignedTo(paperElemSelector);
        })
        .then(done, done.fail);
    });

    // Vertical padding
    [containerElemSelector, paperElemSelector].forEach(function(refSelector) {
        it('can be placed x pixels below top ' + refSelector.desc + ' edge', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: refSelector.ref,
                yanchor: 'top',
                y: 1,
                pad: titlePad
            }))
            .then(function() {
                var capLineY = calcTextCapLineY(titleSel());
                expect(capLineY).toBe(topOf(refSelector) + 10);
            })
            .then(done, done.fail);
        });
    });

    [containerElemSelector, paperElemSelector].forEach(function(refSelector) {
        it('can be placed x pixels above bottom ' + refSelector.desc + ' edge', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: refSelector.ref,
                yanchor: 'bottom',
                y: 0,
                pad: titlePad
            }))
            .then(function() {
                var baselineY = calcTextBaselineY(titleSel());
                expect(baselineY).toBe(bottomOf(refSelector) - 10);
            })
            .then(done, done.fail);
        });
    });

    [containerElemSelector, paperElemSelector].forEach(function(refSelector) {
        it('figures out for itself which vertical padding applies when {yanchor: \'auto\'}' +
          refSelector.desc + ' edge', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: refSelector.ref,
                yanchor: 'auto',
                y: 1,
                pad: titlePad
            }))
            .then(function() {
                var capLineY = calcTextCapLineY(titleSel());
                expect(capLineY).toBe(topOf(refSelector) + 10);

                return Plotly.relayout(gd, 'title.y', 0);
            })
            .then(function() {
                var baselineY = calcTextBaselineY(titleSel());
                expect(baselineY).toBe(bottomOf(refSelector) - 10);

                return Plotly.relayout(gd, 'title.y', 0.5);
            })
            .then(function() {
                expectCenteredVerticallyWithin(refSelector);
            })
            .then(done, done.fail);
        });
    });

    // Cases when vertical padding is ignored
    // (just testing with paper is sufficient)
    [
        {pad: {t: 20}, dir: 'top'},
        {pad: {b: 20}, dir: 'bottom'}
    ].forEach(function(testCase) {
        it('mutes ' + testCase.dir + ' padding for {yanchor: \'middle\'}', function(done) {
            Plotly.newPlot(gd, data, extendLayout({
                yref: 'paper',
                yanchor: 'middle',
                y: 0.5,
                pad: testCase.pad
            }))
            .then(function() {
                expectCenteredVerticallyWithin(paperElemSelector);
            })
            .then(done, done.fail);
        });
    });

    it('mutes top padding when yanchor is bottom', function(done) {
        Plotly.newPlot(gd, data, extendLayout({
            yref: 'paper',
            y: 0,
            yanchor: 'bottom',
            pad: {
                t: 1000
            }
        }))
        .then(function() {
            expectBaselineAlignsWithBottomEdgeOf(paperElemSelector);
        })
        .then(done, done.fail);
    });

    it('mutes bottom padding when yanchor is top', function(done) {
        Plotly.newPlot(gd, data, extendLayout({
            yref: 'paper',
            y: 1,
            yanchor: 'top',
            pad: {
                b: 1000
            }
        }))
        .then(function() {
            expectCapLineAlignsWithTopEdgeOf(paperElemSelector);
        })
        .then(done, done.fail);
    });

    function extendLayout(titleAttrs) {
        return {
            title: Lib.extendFlat({text: 'A Chart Title'}, titleAttrs),

            // This needs to be set to have a DOM element that represents the
            // exact size of the plot area.
            plot_bgcolor: '#f9f9f9',
        };
    }

    function topOf(elemSelector) {
        return elemSelector.select().getBoundingClientRect().top;
    }

    function rightOf(elemSelector) {
        return elemSelector.select().getBoundingClientRect().right;
    }

    function bottomOf(elemSelector) {
        return elemSelector.select().getBoundingClientRect().bottom;
    }

    function leftOf(elemSelector) {
        return elemSelector.select().getBoundingClientRect().left;
    }

    function expectLeftEdgeAlignedTo(elemSelector) {
        expectHorizontalEdgeAligned(elemSelector, 'left');
    }

    function expectRightEdgeAlignedTo(elemSelector) {
        expectHorizontalEdgeAligned(elemSelector, 'right');
    }

    function expectHorizontalEdgeAligned(elemSelector, edgeKey) {
        var refElem = elemSelector.select();
        var titleElem = titleSel().node();
        var refElemBB = refElem.getBoundingClientRect();
        var titleBB = titleElem.getBoundingClientRect();

        var tolerance = 1.1;
        var msg = 'Title ' + edgeKey + ' of ' + elemSelector.desc;
        expect(titleBB[edgeKey] - refElemBB[edgeKey]).toBeWithin(0, tolerance, msg);
    }

    function expectCapLineAlignsWithTopEdgeOf(elemSelector) {
        var refElem = elemSelector.select();
        var refElemBB = refElem.getBoundingClientRect();

        // Note: getBoundingClientRect of an SVG <text> element
        // doesn't return the tightest bounding box of the current text
        // but a rectangle that is wide enough to contain any
        // possible character even though something like 'Ö' isn't
        // in the current title string. Moreover getBoundingClientRect
        // (with respect to SVG <text> elements) differs from browser to
        // browser and thus is unreliable for testing vertical alignment
        // of SVG text. Because of that the cap line is calculated based on the
        // element properties.
        var capLineY = calcTextCapLineY(titleSel());

        var msg = 'Title\'s cap line y is same as the top of ' + elemSelector.desc;
        expect(capLineY).toBeWithin(refElemBB.top, 1.1, msg);
    }

    function expectBaselineAlignsWithBottomEdgeOf(elemSelector) {
        var refElem = elemSelector.select();
        var refElemBB = refElem.getBoundingClientRect();

        // Note: using getBoundingClientRect is not reliable, see
        // comment in `expectCapLineAlignsWithTopEdgeOf` for more info.
        var baselineY = calcTextBaselineY(titleSel());

        var msg = 'Title baseline sits on the bottom of ' + elemSelector.desc;
        expect(baselineY).toBeWithin(refElemBB.bottom, 1.1, msg);
    }

    function expectCenteredWithin(elemSelector) {
        var refElem = elemSelector.select();
        var titleElem = titleSel().node();
        var refElemBB = refElem.getBoundingClientRect();
        var titleBB = titleElem.getBoundingClientRect();

        var leftDistance = titleBB.left - refElemBB.left;
        var rightDistance = refElemBB.right - titleBB.right;

        var tolerance = 1.1;
        var msg = 'Title in center of ' + elemSelector.desc;
        expect(leftDistance).toBeWithin(rightDistance, tolerance, msg);
    }

    function expectCenteredVerticallyWithin(elemSelector) {
        var refElem = elemSelector.select();
        var titleElem = titleSel().node();
        var refElemBB = refElem.getBoundingClientRect();
        var titleBB = titleElem.getBoundingClientRect();

        var topDistance = titleBB.top - refElemBB.top;
        var bottomDistance = refElemBB.bottom - titleBB.bottom;

        var tolerance = 1.3;
        var msg = 'Title centered vertically within ' + elemSelector.desc;
        expect(topDistance).toBeWithin(bottomDistance, tolerance, msg);
    }
});

describe('Titles can be updated', function() {
    'use strict';

    var data = [{x: [1, 2, 3], y: [1, 2, 3]}];
    var NEW_TITLE = 'Weight over years';
    var NEW_XTITLE = 'Age in years';
    var NEW_YTITLE = 'Average weight';
    var gd;

    beforeEach(function() {
        var layout = {
            title: {text: 'Plotly line chart'},
            xaxis: {title: {text: 'Age'}},
            yaxis: {title: {text: 'Weight'}}
        };
        gd = createGraphDiv();
        Plotly.newPlot(gd, data, Lib.extendDeep({}, layout));

        expectTitles('Plotly line chart', 'Age', 'Weight');
    });

    afterEach(destroyGraphDiv);

    [
        {
            desc: 'by replacing the entire title objects',
            update: {
                title: {text: NEW_TITLE},
                xaxis: {title: {text: NEW_XTITLE}},
                yaxis: {title: {text: NEW_YTITLE}}
            }
        },
        {
            desc: 'by using attribute strings',
            update: {
                'title.text': NEW_TITLE,
                'xaxis.title.text': NEW_XTITLE,
                'yaxis.title.text': NEW_YTITLE
            }
        }
    ].forEach(function(testCase) {
        it('via `Plotly.relayout` ' + testCase.desc, function(done) {
            Plotly.relayout(gd, testCase.update)
            .then(function() {
                expectChangedTitles();
            })
            .then(done, done.fail);
        });

        it('via `Plotly.update` ' + testCase.desc, function(done) {
            Plotly.update(gd, {}, testCase.update)
            .then(function() {
                expectChangedTitles();
            })
            .then(done, done.fail);
        });
    });

    function expectChangedTitles() {
        expectTitles(NEW_TITLE, NEW_XTITLE, NEW_YTITLE);
    }

    function expectTitles(expTitle, expXTitle, expYTitle) {
        expectTitle(expTitle);

        var xSel = xTitleSel();
        expect(xSel.empty()).toBe(false, 'X-axis title element missing');
        expect(xSel.text()).toBe(expXTitle);

        var ySel = yTitleSel();
        expect(ySel.empty()).toBe(false, 'Y-axis title element missing');
        expect(ySel.text()).toBe(expYTitle);
    }
});

describe('Titles and labels', function() {
    'use strict';

    var gd;
    beforeEach(function() { gd = createGraphDiv(); });
    afterEach(destroyGraphDiv);

    it('should react with transition', function(done) {
        Plotly.newPlot(gd, {
            data: [
                {
                    type: 'bar',
                    x: ['a', 'b'],
                    y: [1, 2],
                }
            ],
            layout: {
                title: {
                    text: 'OLD'
                },
                xaxis: {
                    title: {
                        text: 'x-old'
                    }
                }
            }
        }).then(function() {
            return Plotly.react(gd, {
                data: [
                    {
                        type: 'bar',
                        x: ['b', 'a'],
                        y: [3, 2],
                    }
                ],
                layout: {
                    title: {
                        text: 'NEW'
                    },
                    xaxis: {
                        title: {
                            text: 'x-new'
                        }
                    },
                    transition: { duration: 500 }
                }
            });
        }).then(function() {
            expectTitle('NEW');
            expect(xTitleSel().text()).toBe('x-new');
            expect(d3Select('.xtick').text()).toBe('b');
        })
        .then(done, done.fail);
    });
});

describe('Titles support setting custom font properties', function() {
    'use strict';

    var data = [{x: [1, 2, 3], y: [1, 2, 3]}];
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('through defining a `font` property in the respective title attribute', function(done) {
        var layout = {
            title: {
                text: 'Plotly line chart',
                font: {
                    color: 'blue',
                    family: 'serif',
                    size: 24
                }
            },
            xaxis: {
                title: {
                    text: 'X-Axis',
                    font: {
                        color: '#333',
                        family: 'sans-serif',
                        size: 20
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Y-Axis',
                    font: {
                        color: '#666',
                        family: 'Arial',
                        size: 16
                    }
                }
            }
        };

        Plotly.newPlot(gd, data, layout)
        .then(function() {
            expectTitleFont('blue', 'serif', 24);
            expectXAxisTitleFont('#333', 'sans-serif', 20);
            expectYAxisTitleFont('#666', 'Arial', 16);
        })
        .then(done, done.fail);
    });
});

describe('Title fonts can be updated', function() {
    'use strict';

    var data = [{x: [1, 2, 3], y: [1, 2, 3]}];
    var NEW_TITLE = 'Weight over years';
    var NEW_XTITLE = 'Age in years';
    var NEW_YTITLE = 'Average weight';
    var NEW_TITLE_FONT = {color: '#333', family: 'serif', size: 28};
    var NEW_XTITLE_FONT = {color: '#666', family: 'sans-serif', size: 18};
    var NEW_YTITLE_FONT = {color: '#999', family: 'serif', size: 12};
    var gd;

    beforeEach(function(done) {
        var layout = {
            title: {
                text: 'Plotly line chart',
                font: {color: 'black', family: 'sans-serif', size: 24}
            },
            xaxis: {
                title: {
                    text: 'Age',
                    font: {color: 'red', family: 'serif', size: 20}
                }
            },
            yaxis: {
                title: {
                    text: 'Weight',
                    font: {color: 'green', family: 'monospace', size: 16}
                }
            }
        };
        gd = createGraphDiv();
        Plotly.newPlot(gd, data, Lib.extendDeep({}, layout))
        .then(function() {
            expectTitleFont('black', 'sans-serif', 24);
            expectXAxisTitleFont('red', 'serif', 20);
            expectYAxisTitleFont('green', 'monospace', 16);
        })
        .then(done);
    });

    afterEach(destroyGraphDiv);

    [
        {
            desc: 'by replacing the entire title objects',
            update: {
                title: {
                    text: NEW_TITLE,
                    font: NEW_TITLE_FONT
                },
                xaxis: {
                    title: {
                        text: NEW_XTITLE,
                        font: NEW_XTITLE_FONT
                    }
                },
                yaxis: {
                    title: {
                        text: NEW_YTITLE,
                        font: NEW_YTITLE_FONT
                    }
                }
            }
        },
        {
            desc: 'by using attribute strings',
            update: {
                'title.font.color': NEW_TITLE_FONT.color,
                'title.font.family': NEW_TITLE_FONT.family,
                'title.font.size': NEW_TITLE_FONT.size,
                'xaxis.title.font.color': NEW_XTITLE_FONT.color,
                'xaxis.title.font.family': NEW_XTITLE_FONT.family,
                'xaxis.title.font.size': NEW_XTITLE_FONT.size,
                'yaxis.title.font.color': NEW_YTITLE_FONT.color,
                'yaxis.title.font.family': NEW_YTITLE_FONT.family,
                'yaxis.title.font.size': NEW_YTITLE_FONT.size
            }
        },
    ].forEach(function(testCase) {
        it('via `Plotly.relayout` ' + testCase.desc, function(done) {
            Plotly.relayout(gd, testCase.update)
            .then(function() {
                expectChangedTitleFonts();
            })
            .then(done, done.fail);
        });

        it('via `Plotly.update` ' + testCase.desc, function(done) {
            Plotly.update(gd, {}, testCase.update)
            .then(function() {
                expectChangedTitleFonts();
            })
            .then(done, done.fail);
        });
    });

    function expectChangedTitleFonts() {
        expectTitleFont(NEW_TITLE_FONT.color, NEW_TITLE_FONT.family, NEW_TITLE_FONT.size);
        expectXAxisTitleFont(NEW_XTITLE_FONT.color, NEW_XTITLE_FONT.family, NEW_XTITLE_FONT.size);
        expectYAxisTitleFont(NEW_YTITLE_FONT.color, NEW_YTITLE_FONT.family, NEW_YTITLE_FONT.size);
    }
});

// TODO: Add in tests for interactions with other automargined elements
describe('Title automargining', function() {
    'use strict';

    var data = [{x: [1, 1, 3], y: [1, 2, 3]}];
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should avoid overlap with container for yref=paper and allow padding', function(done) {
        Plotly.newPlot(gd, data, {
            margin: {t: 0, b: 0, l: 0, r: 0},
            height: 300,
            width: 400,
            title: {
                text: 'Basic title',
                font: {size: 24},
                yref: 'paper'
            }
        }).then(function() {
            expect(gd._fullLayout._size.t).toBe(0);
            expect(gd._fullLayout._size.h).toBe(300);
            return Plotly.relayout(gd, 'title.automargin', true);
        }).then(function() {
            expect(gd._fullLayout.title.automargin).toBe(true);
            expect(gd._fullLayout.title.y).toBe(1);
            expect(gd._fullLayout.title.yanchor).toBe('bottom');
            expect(gd._fullLayout._size.t).toBeCloseTo(27, -1);
            expect(gd._fullLayout._size.h).toBeCloseTo(273, -1);
            return Plotly.relayout(gd, 'title.pad.t', 10);
        }).then(function() {
            expect(gd._fullLayout._size.t).toBeCloseTo(37, -1);
            expect(gd._fullLayout._size.h).toBeCloseTo(263, -1);
            return Plotly.relayout(gd, 'title.pad.b', 10);
        }).then(function() {
            expect(gd._fullLayout._size.h).toBeCloseTo(253, -1);
            expect(gd._fullLayout._size.t).toBeCloseTo(47, -1);
            return Plotly.relayout(gd, 'title.yanchor', 'top');
        }).then(function() {
            expect(gd._fullLayout._size.t).toBe(0);
        }).then(done, done.fail);
    });


    it('should automargin and position title at the bottom of the plot if title.y=0', function(done) {
        Plotly.newPlot(gd, data, {
            margin: {t: 0, b: 0, l: 0, r: 0},
            height: 300,
            width: 400,
            title: {
                text: 'Basic title',
                font: {size: 24},
                yref: 'paper'
            }
        }).then(function() {
            return Plotly.relayout(gd, {'title.automargin': true, 'title.y': 0});
        }).then(function() {
            expect(gd._fullLayout._size.b).toBeCloseTo(27, -1);
            expect(gd._fullLayout._size.h).toBeCloseTo(273, -1);
            expect(gd._fullLayout.title.yanchor).toBe('top');
        }).then(done, done.fail);
    });

    it('should avoid overlap with container and plot area for yref=container and allow padding', function(done) {
        Plotly.newPlot(gd, data, {
            margin: {t: 0, b: 0, l: 0, r: 0},
            height: 300,
            width: 400,
            title: {
                text: 'Basic title',
                font: {size: 24},
                yref: 'container',
                automargin: true
            }
        }).then(function() {
            expect(gd._fullLayout._size.t).toBeCloseTo(27, -1);
            expect(gd._fullLayout._size.h).toBeCloseTo(273, -1);
            expect(gd._fullLayout.title.y).toBe(1);
            expect(gd._fullLayout.title.yanchor).toBe('top');
            return Plotly.relayout(gd, 'title.y', 0.6);
        }).then(function() {
            expect(gd._fullLayout._size.t).toBeCloseTo(147, -1);
            expect(gd._fullLayout._size.h).toBeCloseTo(153, -1);
        }).then(done, done.fail);
    });

    it('should make space for multiple container-referenced components on the same side of the plot', function(done) {
        Plotly.newPlot(gd, data, {
            margin: {t: 0, b: 0, l: 0, r: 0},
            xaxis: {
                automargin: true,
                title: {text: 'x-axis title'}
            },
            height: 300,
            width: 400,
            title: {
                text: 'Basic title',
                font: {size: 24},
                yref: 'container',
                automargin: true,
                y: 0
            }
        }).then(function() {
            expect(gd._fullLayout._size.b).toBeCloseTo(57, -1);
            expect(gd._fullLayout._size.h).toBeCloseTo(243, -1);
        }).then(done, done.fail);
    });
});

function expectTitle(expTitle) {
    expectTitleFn(expTitle)();
}

function expectTitleFn(expTitle) {
    return function() {
        expect(titleSel().text()).toBe(expTitle);
    };
}

function expectTitleFont(color, family, size) {
    expectFont(titleSel(), color, family, size);
}

function expectXAxisTitleFont(color, family, size) {
    expectFont(xTitleSel(), color, family, size);
}

function expectYAxisTitleFont(color, family, size) {
    expectFont(yTitleSel(), color, family, size);
}

function expectFont(sel, color, family, size) {
    var node = sel.node();
    expect(node.style.fill).toBe(rgb(color));
    expect(node.style.fontFamily).toBe(family);
    expect(node.style.fontSize).toBe(size + 'px');
}

function expectDefaultCenteredPosition(gd) {
    var containerBB = gd.getBoundingClientRect();

    expect(titleX()).toBe(containerBB.width / 2);
    expectBaselineInMiddleOfTopMargin(gd);
}

function expectBaselineInMiddleOfTopMargin(gd) {
    var baselineY = calcTextBaselineY(titleSel());
    var topMarginHeight = gd._fullLayout.margin.t;

    expect(baselineY).toBe(topMarginHeight / 2);
}

function titleX() {
    return Number.parseFloat(titleSel().attr('x'));
}

function calcTextBaselineY(textSel) {
    var y = Number.parseFloat(textSel.attr('y'));
    var yShift = 0;
    var dy = textSel.attr('dy');
    var parsedDy, dyNumValue, dyUnit;
    var fontSize, parsedFontSize;

    if(dy) {
        parsedDy = /^([0-9.]*)(\w*)$/.exec(dy);
        if(parsedDy) {
            dyUnit = parsedDy[2];
            dyNumValue = Number.parseFloat(parsedDy[1]);

            if(dyUnit === 'em') {
                fontSize = textSel.node().style.fontSize;
                parsedFontSize = parseFontSizeAttr(fontSize);

                yShift = dyNumValue * Number.parseFloat(parsedFontSize.val);
            } else if(dyUnit === '') {
                yShift = dyNumValue;
            } else {
                fail('Calculating y-shift for unit ' + dyUnit + ' not implemented in test');
            }
        } else {
            fail('dy value \'' + dy + '\' could not be parsed by test');
        }
    }

    return y + yShift;
}

function calcTextCapLineY(textSel) {
    var baselineY = calcTextBaselineY(textSel);
    var fontSize = textSel.node().style.fontSize;
    var fontSizeVal = parseFontSizeAttr(fontSize).val;

    // CAP_SHIFT is assuming a cap height of an average font.
    // One would have to analyze the font metrics of the
    // used font to determine an accurate cap shift factor.
    return baselineY - fontSizeVal * alignmentConstants.CAP_SHIFT;
}

function parseFontSizeAttr(fontSizeAttr) {
    var parsedFontSize = /^([0-9.]*)px$/.exec(fontSizeAttr);
    var isFontSizeInPx = !!parsedFontSize;
    expect(isFontSizeInPx).toBe(true, 'Tests assumes font-size is set in pixel');

    return {
        val: parsedFontSize[1],
        unit: parsedFontSize[2]
    };
}

function titleSel() {
    var titleSel = d3Select('.infolayer .g-gtitle .gtitle');
    expect(titleSel.empty()).toBe(false, 'Plot title element missing');
    return titleSel;
}

function xTitleSel(num) {
    var axIdx = num === 1 ? '' : (num || '');
    var xTitleSel = d3Select('.x' + axIdx + 'title');
    expect(xTitleSel.empty()).toBe(false, 'X-axis ' + axIdx + ' title element missing');
    return xTitleSel;
}

function yTitleSel(num) {
    var axIdx = num === 1 ? '' : (num || '');
    var yTitleSel = d3Select('.y' + axIdx + 'title');
    expect(yTitleSel.empty()).toBe(false, 'Y-axis ' + axIdx + ' title element missing');
    return yTitleSel;
}

describe('Editable titles', function() {
    'use strict';

    var data = [{x: [1, 2, 3], y: [1, 2, 3]}];

    var gd;

    afterEach(destroyGraphDiv);

    beforeEach(function() {
        gd = createGraphDiv();
    });

    function checkTitle(className, text, opacityOut, opacityIn) {
        var titleEl = d3Select('.' + className);
        expect(titleEl.text()).toBe(text);
        expect(+(titleEl.node().style.opacity || 1)).toBe(opacityOut);

        var bb = titleEl.node().getBoundingClientRect();
        var xCenter = (bb.left + bb.right) / 2;
        var yCenter = (bb.top + bb.bottom) / 2;
        var done;
        var promise = new Promise(function(resolve) { done = resolve; });

        mouseEvent('mouseover', xCenter, yCenter);
        setTimeout(function() {
            expect(+(titleEl.node().style.opacity || 1)).toBe(opacityIn);

            mouseEvent('mouseout', xCenter, yCenter);
            console.log({ titleEl_opacity: titleEl.node().style.opacity, className: className });
            setTimeout(function() {
                expect(+(titleEl.node().style.opacity || 1)).toBe(opacityOut);
                done();
            }, interactConstants.HIDE_PLACEHOLDER + 50);
        }, interactConstants.SHOW_PLACEHOLDER + 50);

        return promise;
    }

    function editTitle(className, attr, text) {
        return new Promise(function(resolve) {
            gd.once('plotly_relayout', function(eventData) {
                expect(eventData[attr]).toEqual(text, [className, attr, eventData]);
                console.log(eventData[attr]);
                setTimeout(resolve, 10);
            });

            var textNode = document.querySelector('.' + className);
            textNode.dispatchEvent(new window.MouseEvent('click'));

            var editNode = document.querySelector('.plugin-editable.editable');
            editNode.dispatchEvent(new window.FocusEvent('focus'));
            editNode.textContent = text;
            editNode.dispatchEvent(new window.FocusEvent('focus'));
            editNode.dispatchEvent(new window.FocusEvent('blur'));
        });
    }

    it('shows default titles semi-opaque with no hover effects', function(done) {
        Plotly.newPlot(gd, data, {}, {editable: true})
        .then(function() {
            return Promise.all([
                // Check all four titles in parallel. This only works because
                // we're using synthetic events, not a real mouse. It's a big
                // win though because the test takes 1.2 seconds with the
                // animations...
                checkTitle('xtitle', 'Click to enter X axis title', 0.2, 0.2),
                checkTitle('ytitle', 'Click to enter Y axis title', 0.2, 0.2),
                checkTitle('gtitle', 'Click to enter Plot title', 0.2, 0.2),
                checkTitle('gtitle-subtitle', 'Click to enter Plot subtitle', 0.2, 0.2)
            ]);
        })
        .then(done, done.fail);
    });

    it('has hover effects for blank titles', function(done) {
        Plotly.newPlot(gd, data, {
            xaxis: {title: {text: ''}},
            yaxis: {title: {text: ''}},
            title: { text: '', subtitle: { text: ''}},
        }, {editable: true})
        .then(function() {
            return Promise.all([
                checkTitle('xtitle', 'Click to enter X axis title', 0, 1),
                checkTitle('ytitle', 'Click to enter Y axis title', 0, 1),
                checkTitle('gtitle', 'Click to enter Plot title', 0, 1),
                checkTitle('gtitle-subtitle', 'Click to enter Plot subtitle', 0, 1)
            ]);
        })
        .then(done, done.fail);
    });

    it('has no hover effects for titles that used to be blank', function(done) {
        Plotly.newPlot(gd, data, {
            xaxis: {title: {text: ''}},
            yaxis: {title: {text: ''}},
            title: {text: ''}
        }, {editable: true})
        .then(function() {
            return editTitle('xtitle', 'xaxis.title.text', 'XXX');
        })
        .then(function() {
            return editTitle('ytitle', 'yaxis.title.text', 'YYY');
        })
        .then(function() {
            return editTitle('gtitle', 'title.text', 'TTT');
        })
        .then(function() {
            return editTitle('gtitle-subtitle', 'title.subtitle.text', 'SSS');
        })
        .then(function() {
            return Promise.all([
                checkTitle('xtitle', 'XXX', 1, 1),
                checkTitle('ytitle', 'YYY', 1, 1),
                checkTitle('gtitle', 'TTT', 1, 1),
                checkTitle('gtitle-subtitle', 'SSS', 1, 1)
            ]);
        })
        .then(done, done.fail);
    });
});
