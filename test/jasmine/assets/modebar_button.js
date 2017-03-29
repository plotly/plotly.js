'use strict';

var d3 = require('d3');

var modeBarButtons = require('@src/components/modebar/buttons');


module.exports = function selectButton(modeBar, name) {
    var button = {};

    var node = button.node = d3.select(modeBar.element)
        .select('[data-title="' + modeBarButtons[name].title + '"]')
        .node();

    button.click = function() {
        var ev = new window.MouseEvent('click');
        node.dispatchEvent(ev);
    };

    button.isActive = function() {
        return d3.select(node).classed('active');
    };

    return button;
};
