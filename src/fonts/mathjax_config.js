'use strict';

/* global MathJax:false */

module.exports = function() {
    if(typeof MathJax !== 'undefined') {
        var globalConfig = (window.PlotlyConfig || {}).MathJaxConfig !== 'local';

        if(globalConfig) {
            MathJax.Hub.Config({
                messageStyle: 'none',
                skipStartupTypeset: true,
                displayAlign: 'left',
                tex2jax: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']]
                }
            });
            MathJax.Hub.Configured();
        }
    }
};
