'use strict';

var d3Select = require('../../strict-d3').select;
var modeBarButtons = require('@src/components/modebar/buttons');

module.exports = function selectButton(modeBar, name) {
    var button = {};

    var title = modeBarButtons[name].title;

    if(typeof title === 'function') {
        title = title(modeBar.graphInfo);
    }

    var node = button.node = d3Select(modeBar.element)
        .select('[data-title="' + title + '"]')
        .node();

    button.click = function() {
        var ev = new window.MouseEvent('click');
        if(node) node.dispatchEvent(ev);
    };

    button.isActive = function() {
        return d3Select(node).classed('active');
    };

    return button;
};
