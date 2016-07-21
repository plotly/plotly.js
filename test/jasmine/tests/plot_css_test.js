var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('css injection', function() {
    var plotcss_utils = require('@src/lib/plotcss_utils');
    var plotcss = require('@build/plotcss');

    // create a graph div in a child window
    function createGraphDivInChildWindow() {
        var childWindow = window.open('about:blank', 'popoutWindow', '');

        var gd = childWindow.document.createElement('div');
        gd.id = 'graph';
        childWindow.document.body.appendChild(gd);

        // force the graph to be at position 0,0 no matter what
        gd.style.position = 'fixed';
        gd.style.left = 0;
        gd.style.top = 0;

        return gd;
    }

    // the most basic of basic plots
    function plot(target) {
        Plotly.plot(target, [{
            x: [1, 2, 3, 4, 5],
            y: [1, 2, 4, 8, 16]
        }], {
            margin: {
                t: 0
            }
        });
    }

    // deletes all rules defined in plotcss
    function deletePlotCSSRules(sourceDocument) {
        for(var selector in plotcss) {
            var fullSelector = plotcss_utils.buildFullSelector(selector);

            for(var i = 0; i < sourceDocument.styleSheets.length; i++) {
                var styleSheet = sourceDocument.styleSheets[i];
                var selectors = [];

                for(var j = 0; j < styleSheet.cssRules.length; j++) {
                    var cssRule = styleSheet.cssRules[j];

                    selectors.push(cssRule.selectorText);
                }

                var selectorIndex = selectors.indexOf(fullSelector);

                if(selectorIndex !== -1) {
                    styleSheet.deleteRule(selectorIndex);
                    break;
                }
            }
        }
    }

    it('inserts styles on initial plot', function() {
        deletePlotCSSRules(document); // clear the rules

        // fix scope errors
        var selector = null;
        var fullSelector = null;

        // make sure the rules are cleared
        var allSelectors = plotcss_utils.getAllRuleSelectors(document);

        for(selector in plotcss) {
            fullSelector = plotcss_utils.buildFullSelector(selector);

            expect(allSelectors.indexOf(fullSelector)).toEqual(-1);
        }

        // plot
        var gd = createGraphDiv();
        plot(gd);

        // check for styles
        allSelectors = plotcss_utils.getAllRuleSelectors(document);

        for(selector in plotcss) {
            fullSelector = plotcss_utils.buildFullSelector(selector);

            expect(allSelectors.indexOf(fullSelector)).not.toEqual(-1);
        }

        // clean up
        destroyGraphDiv();
    });

    it('inserts styles in a child window document', function() {
        var gd = createGraphDivInChildWindow();
        var childWindow = gd.ownerDocument.defaultView;

        // plot
        plot(gd);

        // check for styles
        var allSelectors = plotcss_utils.getAllRuleSelectors(gd.ownerDocument);

        for(var selector in plotcss) {
            var fullSelector = plotcss_utils.buildFullSelector(selector);

            expect(allSelectors.indexOf(fullSelector)).not.toEqual(-1);
        }

        // clean up
        childWindow.close();
    });

    it('does not insert duplicate styles', function() {
        deletePlotCSSRules(document); // clear the rules

        // fix scope errors
        var selector = null;
        var fullSelector = null;

        // make sure the rules are cleared
        var allSelectors = plotcss_utils.getAllRuleSelectors(document);

        for(selector in plotcss) {
            fullSelector = plotcss_utils.buildFullSelector(selector);

            expect(allSelectors.indexOf(fullSelector)).toEqual(-1);
        }

        // plot
        var gd = createGraphDiv();
        plot(gd);
        plot(gd); // plot again so injectStyles gets called again

        // check for styles
        allSelectors = plotcss_utils.getAllRuleSelectors(document);

        for(selector in plotcss) {
            fullSelector = plotcss_utils.buildFullSelector(selector);

            var firstIndex = allSelectors.indexOf(fullSelector);

            // there should be no occurences after the initial one
            expect(allSelectors.indexOf(fullSelector, firstIndex + 1)).toEqual(-1);
        }

        // clean up
        destroyGraphDiv();
    });
});
