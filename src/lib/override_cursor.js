/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var setCursor = require('./setCursor');

var STASHATTR = 'data-savedcursor';

/*
 * works with our CSS cursor classes (see css/_cursor.scss)
 * to override a previous cursor set on d3 single-element selections,
 * by moving the name of the original cursor to the data-savedcursor attr.
 * omit cursor to revert to the previously set value.
 */
module.exports = function overrideCursor(el3, csr) {
    var savedCursor = el3.attr(STASHATTR);
    if(csr) {
        if(savedCursor) {
            setCursor(el3, csr);
        }
        else {
            var classes = (el3.attr('class') || '').split(' ');
            for(var i = 0; i < classes.length; i++) {
                var cls = classes[i];
                if(cls.indexOf('cursor-') === 0) {
                    el3.attr(STASHATTR, cls.substr(7))
                        .classed(cls, false);
                }
            }
        }
    }
    else if(savedCursor) {
        el3.attr(STASHATTR, null);
        setCursor(el3, savedCursor);
    }
};
