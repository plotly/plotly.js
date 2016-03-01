'use strict';

exports.setAttributes = function setAttributes(el, attributes) {
    for(var key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
};


exports.appendChildren = function appendChildren(el, children) {
    for(var i = 0; i < children.length; i++) {
        el.appendChild(children[i]);
    }
};
