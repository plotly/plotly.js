/* eslint-disable new-cap */

var Plotly = require('../../../lib/index');

var delay = require('../assets/delay');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var loadScript = require('../assets/load_script');

// eslint-disable-next-line no-undef
var mathjaxVersion = __karma__.config.mathjaxVersion;

describe('Test MathJax v' + mathjaxVersion + ' config test:', function() {
    var gd;

    beforeAll(function(done) {
        gd = createGraphDiv();

        window.MathJax = {
            startup: {
                output: 'chtml',
                tex: {
                    inlineMath: [['|', '|']]
                }
            }
        };

        const src = mathjaxVersion === 3 ?
            '/base/node_modules/@plotly/mathjax-v3/es5/tex-svg.js' :
            '/base/node_modules/@plotly/mathjax-v4/tex-svg.js';

        loadScript(src, done);
    });

    afterAll(destroyGraphDiv);

    it('should maintain startup renderer & inlineMath after SVG rendering', function(done) {
        // before plot
        expect(window.MathJax.config.startup.output).toEqual('chtml');
        expect(window.MathJax.config.startup.tex.inlineMath).toEqual([['|', '|']]);

        Plotly.newPlot(gd, {
            data: [{
                y: [1, 2]
            }],
            layout: {
                title: {
                    text: '$E=mc^2$'
                }
            }
        })
        .then(function() {
            // after plot
            expect(window.MathJax.config.startup.output).toEqual('chtml');
            expect(window.MathJax.config.startup.tex.inlineMath).toEqual([['|', '|']]);
        })
        .then(done, done.fail);
    });
});
