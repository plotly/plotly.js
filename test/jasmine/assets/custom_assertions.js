'use strict';

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var negateIf = require('./negate_if');

exports.assertDims = function(dims) {
    var traces = d3SelectAll('.trace');

    expect(traces.size())
        .toEqual(dims.length, 'to have correct number of traces');

    traces.each(function(_, i) {
        var trace = d3Select(this);
        var points = trace.selectAll('.point');

        expect(points.size())
            .toEqual(dims[i], 'to have correct number of pts in trace ' + i);
    });
};

exports.assertStyle = function(dims, color, opacity) {
    var N = dims.reduce(function(a, b) {
        return a + b;
    });

    var traces = d3SelectAll('.trace');
    expect(traces.size())
        .toEqual(dims.length, 'to have correct number of traces');

    expect(d3SelectAll('.point').size())
        .toEqual(N, 'to have correct total number of points');

    traces.each(function(_, i) {
        var trace = d3Select(this);
        var points = trace.selectAll('.point');

        expect(points.size())
            .toEqual(dims[i], 'to have correct number of pts in trace ' + i);

        points.each(function() {
            expect(this.style.fill)
                .toEqual(color[i], 'to have correct pt color');
            var op = this.style.opacity;
            expect(op === undefined ? 1 : +op)
                .toEqual(opacity[i], 'to have correct pt opacity');
        });
    });
};

exports.assertHoverLabelStyle = function(g, expectation, msg, textSelector) {
    if(!msg) msg = '';

    var pathStyle = window.getComputedStyle(g.select('path').node());
    expect(pathStyle.fill).toBe(expectation.bgcolor, msg + ': bgcolor');
    expect(pathStyle.stroke).toBe(expectation.bordercolor, msg + ': bordercolor');

    var textStyle = window.getComputedStyle(g.select(textSelector || 'text.nums').node());
    expect(textStyle.fontFamily.split(',')[0]).toBe(expectation.fontFamily, msg + ': font.family');
    expect(parseInt(textStyle.fontSize)).toBe(expectation.fontSize, msg + ': font.size');
    expect(textStyle.fill).toBe(expectation.fontColor, msg + ': font.color');
};

function getLabelContent(label) {
    var lines = label.selectAll('tspan.line');
    var content = [];

    function fill(sel) {
        if(sel.node()) {
            var html = sel.html();
            if(html) content.push(html);
        }
    }

    if(lines.size()) {
        lines.each(function() { fill(d3Select(this)); });
    } else {
        fill(label);
    }
    return content.join('\n');
}

function assertLabelContent(label, expectation, msg) {
    if(!expectation) expectation = '';

    var content = getLabelContent(label);

    expect(content).toBe(expectation, msg + ': text content');
}

function count(selector) {
    return d3SelectAll(selector).size();
}

/**
 * @param {object} expectation
 *  - nums {string || array of strings}
 *  - name {string || array of strings}
 *  - axis {string}
 *  - vOrder {array of number}
 *  - hOrder {array of number}
 *  - isRotated {boolean}
 * @param {string} msg
 */
exports.assertHoverLabelContent = function(expectation, msg) {
    if(!msg) msg = '';

    var ptSelector = 'g.hovertext';
    var ptMsg = msg + ' point hover label';
    var ptCnt = count(ptSelector);

    var axSelector = 'g.axistext';
    var axMsg = 'common axis hover label';
    var axCnt = count(axSelector);

    var reRotate = /(\brotate\(.*?\);?)/;

    if(ptCnt === 1) {
        var g = d3Select(ptSelector);
        var numsSel = g.select('text.nums');
        var nameSel = g.select('text.name');

        assertLabelContent(numsSel, expectation.nums, ptMsg + ' (nums)');
        assertLabelContent(nameSel, expectation.name, ptMsg + ' (name)');

        if('isRotated' in expectation) {
            negateIf(expectation.isRotated, expect(g.attr('transform').match(reRotate)))
                .toBe(null, ptMsg + ' should be rotated');
        }
    } else if(ptCnt > 1) {
        if(!Array.isArray(expectation.nums) || !Array.isArray(expectation.name)) {
            fail(ptMsg + ': expecting more than 1 labels.');
        }

        expect(ptCnt)
            .toBe(expectation.name.length, ptMsg + ' # of visible labels');

        var observed = [];
        var expected = expectation.nums.map(function(num, i) {
            return {
                num: num,
                name: expectation.name[i],
                order: (expectation.hOrder || expectation.vOrder || []).indexOf(i)
            };
        });
        d3SelectAll(ptSelector).each(function(_, i) {
            var g = d3Select(this);
            var numsSel = g.select('text.nums');
            var nameSel = g.select('text.name');

            // Label selection can be out of order... dunno why, but on AJ's Mac,
            // just for certain box and violin cases, the order looks correct but
            // it's different from what we see in CI (and presumably on
            // other systems) which looks wrong.
            // Anyway we don't *really* care about the order within the selection,
            // we just care that each label is correct. So collect all the info
            // about each label, and sort both observed and expected identically.
            observed.push({
                num: getLabelContent(numsSel),
                name: getLabelContent(nameSel),
                bbox: this.getBoundingClientRect(),
                order: -1
            });

            if('isRotated' in expectation) {
                negateIf(expectation.isRotated, expect(g.attr('transform').match(reRotate)))
                    .toBe(null, ptMsg + ' ' + i + ' should be rotated');
            }
        });
        if(expectation.vOrder || expectation.hOrder) {
            var o2 = observed.slice();
            o2.sort(function(a, b) {
                return expectation.vOrder ?
                    (a.bbox.top + a.bbox.bottom - b.bbox.top - b.bbox.bottom) / 2 :
                    (b.bbox.left + b.bbox.right - a.bbox.left - a.bbox.right) / 2;
            });
            o2.forEach(function(item, i) {
                item.order = i;
                delete item.bbox;
            });
        }
        observed.sort(labelSorter);
        expected.sort(labelSorter);
        // don't use .toEqual here because we want the message
        expect(observed.length).toBe(expected.length, ptMsg);
        observed.forEach(function(obsi, i) {
            var expi = expected[i];
            expect(obsi.num).toBe(expi.num, ptMsg + ' (nums ' + i + ')');
            expect(obsi.name).toBe(expi.name, ptMsg + ' (name ' + i + ')');
            if(expectation.vOrder || expectation.hOrder) {
                expect(obsi.order).toBe(expi.order, ptMsg + ' (order ' + i + ')');
            }
        });
    } else {
        if(expectation.nums) {
            fail(ptMsg + ': expecting *nums* labels, did not find any.');
        }
        if(expectation.name) {
            fail(ptMsg + ': expecting *nums* labels, did not find any.');
        }
    }

    if(axCnt) {
        assertLabelContent(
            d3Select(axSelector + '> text'),
            expectation.axis,
            axMsg
        );
    } else {
        if(expectation.axis) {
            fail(axMsg + ': expecting label, did not find any.');
        }
    }
};

function labelSorter(a, b) {
    if(a.name !== b.name) return a.name > b.name ? 1 : -1;
    if(a.num !== b.num) return a.num > b.num ? 1 : -1;
    return a.order - b.order;
}

exports.assertClip = function(sel, isClipped, size, msg) {
    expect(sel.size()).toBe(size, msg + ' clip path (selection size)');

    sel.each(function(d, i) {
        var clipPath = d3Select(this).attr('clip-path');

        if(isClipped) {
            expect(String(clipPath).substr(0, 4))
                .toBe('url(', msg + ' clip path ' + '(item ' + i + ')');
        } else {
            expect(clipPath)
                .toBe(null, msg + ' clip path ' + '(item ' + i + ')');
        }
    });
};

exports.assertNodeDisplay = function(sel, expectation, msg) {
    expect(sel.size())
        .toBe(expectation.length, msg + ' display (selection size)');

    sel.each(function(d, i) {
        expect(d3Select(this).attr('display'))
            .toBe(expectation[i], msg + ' display ' + '(item ' + i + ')');
    });
};

exports.checkTicks = function(axLetter, vals, msg) {
    var selection = d3SelectAll('.' + axLetter + 'tick text');
    expect(selection.size()).toBe(vals.length);
    selection.each(function(d, i) {
        expect(d3Select(this).text()).toBe(vals[i], msg + ': ' + i);
    });
};

exports.assertElemRightTo = function(elem, refElem, msg) {
    var elemBB = elem.getBoundingClientRect();
    var refElemBB = refElem.getBoundingClientRect();
    expect(elemBB.left >= refElemBB.right).toBe(true, msg);
};


exports.assertElemTopsAligned = function(elem1, elem2, msg) {
    var elem1BB = elem1.getBoundingClientRect();
    var elem2BB = elem2.getBoundingClientRect();

    // Hint: toBeWithin tolerance is exclusive, hence a
    // diff of exactly 1 would fail the test
    var tolerance = 1.1;
    expect(elem1BB.top - elem2BB.top).toBeWithin(0, tolerance, msg);
};

exports.assertElemInside = function(elem, container, msg) {
    var elemBB = elem.getBoundingClientRect();
    var contBB = container.getBoundingClientRect();
    expect(contBB.left < elemBB.left &&
      contBB.right > elemBB.right &&
      contBB.top < elemBB.top &&
      contBB.bottom > elemBB.bottom).toBe(true, msg);
};

/*
 * quick plot area dimension check: test width and/or height of the inner
 * plot area (single subplot) to verify that the margins are as expected
 *
 * opts can have keys (all optional):
 *   width (exact width match)
 *   height (exact height match)
 *   widthLessThan (width must be less than this)
 *   heightLessThan (height must be less than this)
 */
exports.assertPlotSize = function(opts, msg) {
    var width = opts.width;
    var height = opts.height;
    var widthLessThan = opts.widthLessThan;
    var heightLessThan = opts.heightLessThan;

    var plotBB = d3Select('.plotclip > rect').node().getBoundingClientRect();
    var actualWidth = plotBB.width;
    var actualHeight = plotBB.height;

    var msgPlus = msg ? ': ' + msg : '';

    if(width) expect(actualWidth).toBeWithin(width, 1, 'width' + msgPlus);
    if(height) expect(actualHeight).toBeWithin(height, 1, 'height' + msgPlus);
    if(widthLessThan) expect(actualWidth).toBeLessThan(widthLessThan - 1, 'widthLessThan' + msgPlus);
    if(heightLessThan) expect(actualHeight).toBeLessThan(heightLessThan - 1, 'heightLessThan' + msgPlus);
};

/**
 * Ordering test - since SVG layering is purely dependent on ordering in the
 * node tree, this tells you if the items are layered correctly.
 * Note that we only take the first matching node for each selector, and it's
 * not necessary that the nodes be siblings or at the same level of nesting.
 *
 * @param {string} selectorBehind: css selector for the node that should be behind
 * @param {string} selectorInFront: css selector for the node that should be in front
 * @param {string} msg: context for debugging
 */
exports.assertNodeOrder = function(selectorBehind, selectorInFront, msg) {
    var nodeBehind = document.querySelector(selectorBehind);
    var nodeInFront = document.querySelector(selectorInFront);
    if(!nodeBehind) {
        fail(selectorBehind + ' not found (' + msg + ')');
    } else if(!nodeInFront) {
        fail(selectorInFront + ' not found (' + msg + ')');
    } else {
        var parentsBehind = getParents(nodeBehind);
        var parentsInFront = getParents(nodeInFront);

        var commonParent = null;
        var siblingBehind = null;
        var siblingInFront = null;
        for(var i = 0; i < parentsBehind.length; i++) {
            if(parentsBehind[i] === parentsInFront[i]) {
                commonParent = parentsBehind[i];
            } else {
                siblingBehind = parentsBehind[i];
                siblingInFront = parentsInFront[i];
                break;
            }
        }
        var allSiblings = collectionToArray(commonParent.children);
        var behindIndex = allSiblings.indexOf(siblingBehind);
        var frontIndex = allSiblings.indexOf(siblingInFront);

        // sanity check - if these fail there's just something wrong in this routine
        expect(behindIndex).toBeGreaterThan(-1, 'error in assertNodeOrder: ' + msg);
        expect(frontIndex).toBeGreaterThan(-1, 'error in assertNodeOrder: ' + msg);

        // the real test
        expect(frontIndex).toBeGreaterThan(behindIndex,
            '"' + selectorBehind + '" is not behind "' + selectorInFront + '": ' + msg);
    }
};

/**
 * Ordering test for any number of nodes - calls assertNodeOrder n-1 times.
 * Note that we only take the first matching node for each selector, and it's
 * not necessary that the nodes be siblings or at the same level of nesting.
 *
 * @param {Array[string]} selectorArray: css selectors in the order they should
 *     appear in the document, from back to front.
 * @param {string} msg: context for debugging
 */
exports.assertMultiNodeOrder = function(selectorArray, msg) {
    for(var i = 0; i < selectorArray.length - 1; i++) {
        var msgi = (msg ? msg + ' - ' : '') + 'entries ' + i + ' and ' + (i + 1);
        exports.assertNodeOrder(selectorArray[i], selectorArray[i + 1], msgi);
    }
};

function getParents(node) {
    var parent = node.parentNode;
    if(parent) return getParents(parent).concat(node);
    return [node];
}

function collectionToArray(collection) {
    var len = collection.length;
    var a = new Array(len);
    for(var i = 0; i < len; i++) a[i] = collection[i];
    return a;
}

exports.assertD3Data = function(selection, expectedData) {
    var data = [];
    selection.each(function(d) { data.push(d); });
    expect(data).toEqual(expectedData);
};
