/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

exports.setAttributes = function setAttributes(el, attributes) {
    for(var key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
};


exports.appendChildren = function appendChildren(el, children) {
    for(var i = 0; i < children.length; i++) {
        if(children[i]) {
            el.appendChild(children[i]);
        }
    }
};
