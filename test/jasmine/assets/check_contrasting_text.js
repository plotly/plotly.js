'use strict';

const Plotly = require('../../../lib/index');

const Color = require('../../../src/components/color');
const Lib = require('../../../src/lib');
const d3SelectAll = require('../../strict-d3').selectAll;
const createGraphDiv = require('../assets/create_graph_div');
const destroyGraphDiv = require('../assets/destroy_graph_div');

/**
 * Check that inside text takes the more legible of the two default label colors.
 *
 * Traces that draw text on a filled shape pick the label color with
 * `Color.contrast`, which returns either `Color.background` or
 * `Color.defaultLine`. The rule that chooses between the two has changed more
 * than once, and a change moves every trace type at the same time.
 *
 * The check states the property instead of the resulting color, so a change to
 * the rule fails only where it makes text harder to read. `fillColor` must be
 * the opaque color the trace paints behind the text, and it must sit near the
 * point where the two label colors give similar contrast. A color far from that
 * point passes under any plausible rule and tests nothing.
 *
 * Hierarchy roots draw outside text, which does not contrast against the slice.
 * Give `tracePatch` a shape with no root when the trace type has a hierarchy.
 *
 * @param {String} traceType - Trace type to plot
 * @param {Object} tracePatch - Trace attributes that produce inside text
 * @param {String} textSelector - Selector matching the drawn text nodes
 * @param {String} fillColor - Opaque color painted behind the text
 */
module.exports = function checkContrastingText(traceType, tracePatch, textSelector, fillColor) {
    describe(`${traceType} default inside text color`, () => {
        let gd;

        beforeEach(() => {
            gd = createGraphDiv();
        });

        afterEach(() => {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        it('should read at least as well as the other default label color', (done) => {
            Plotly.newPlot(gd, [Lib.extendFlat({ type: traceType }, tracePatch)])
                .then(() => {
                    const nodes = d3SelectAll(textSelector);
                    expect(nodes.size()).toBeGreaterThan(0, `no text drawn for ${traceType}`);

                    nodes.each(function (_, i) {
                        const { fill } = this.style;

                        const isBackground = Color.equals(fill, Color.background);
                        const isDefaultLine = Color.equals(fill, Color.defaultLine);
                        expect(isBackground || isDefaultLine).toBe(
                            true,
                            `${traceType} element ${i}: ${fill} is not a default label color`
                        );

                        const other = isBackground ? Color.defaultLine : Color.background;
                        expect(Color.wcagContrast(fillColor, fill)).not.toBeLessThan(
                            Color.wcagContrast(fillColor, other),
                            `${traceType} element ${i}: ${fill} on ${fillColor}`
                        );
                    });
                })
                .then(done, done.fail);
        });
    });
};
