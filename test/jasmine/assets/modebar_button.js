'use strict';

var d3 = require('d3');

var modeBarButtons = require('@src/components/modebar/buttons');


module.exports = function selectButton(modeBar, name) {
    var button = d3.select(modeBar.element)
        .select('[data-title="' + modeBarButtons[name].title + '"]')
        .node();

    button.click = function() {
        var ev = new window.MouseEvent('click');
        button.dispatchEvent(ev);
    };

    button.isActive = function() {
        return d3.select(button).classed('active');
    };

    return button;
};
