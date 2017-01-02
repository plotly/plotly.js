/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/* global MathJax:false */

/**
 * Check and configure MathJax
 */
if(typeof MathJax !== 'undefined') {
    exports.MathJax = true;

    MathJax.Hub.Config({
        messageStyle: 'none',
        skipStartupTypeset: true,
        displayAlign: 'left',
        tex2jax: {
            inlineMath: [['$', '$'], ['\\(', '\\)']]
        }
    });

    MathJax.Hub.Configured();
} else {
    exports.MathJax = false;
}
