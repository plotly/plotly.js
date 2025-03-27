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

        if(mathjaxVersion === 3) {
            window.MathJax = {
                startup: {
                    output: 'chtml',
                    tex: {
                        inlineMath: [['|', '|']]
                    }
                }
            };
        }

        var src = mathjaxVersion === 3 ?
            '/base/node_modules/@plotly/mathjax-v3/es5/tex-svg.js' :
            '/base/node_modules/@plotly/mathjax-v2/MathJax.js?config=TeX-AMS_SVG';

        loadScript(src, done);
    });

    afterAll(destroyGraphDiv);

    it('should maintain startup renderer & inlineMath after SVG rendering', function(done) {
        if(mathjaxVersion === 2) {
            window.MathJax.Hub.Config({
                tex2jax: {
                    inlineMath: [['|', '|']]
                }
            });

            window.MathJax.Hub.setRenderer('CHTML');
        }

        // before plot
        if(mathjaxVersion === 3) {
            expect(window.MathJax.config.startup.output).toEqual('chtml');
            expect(window.MathJax.config.startup.tex.inlineMath).toEqual([['|', '|']]);
        }
        if(mathjaxVersion === 2) {
            expect(window.MathJax.Hub.config.menuSettings.renderer).toEqual('');
            expect(window.MathJax.Hub.config.tex2jax.inlineMath).toEqual([['|', '|']]);
        }

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
            if(mathjaxVersion === 3) {
                expect(window.MathJax.config.startup.output).toEqual('chtml');
                expect(window.MathJax.config.startup.tex.inlineMath).toEqual([['|', '|']]);
            }
            if(mathjaxVersion === 2) {
                expect(window.MathJax.Hub.config.menuSettings.renderer).toEqual('');
            }
        })
        .then(delay(1000)) // TODO: why we need this delay for mathjax v2 here?
        .then(function() {
            if(mathjaxVersion === 2) {
                expect(window.MathJax.Hub.config.tex2jax.inlineMath).toEqual([['|', '|']]);
            }
        })
        .then(done, done.fail);
    });
});
