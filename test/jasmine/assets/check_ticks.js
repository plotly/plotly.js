'use strict';

var d3 = require('d3');

module.exports = function checkTicks(axLetter, vals, msg) {
    var selection = d3.selectAll('.' + axLetter + 'tick text');
    expect(selection.size()).toBe(vals.length);
    selection.each(function(d, i) {
        expect(d3.select(this).text()).toBe(vals[i], msg + ': ' + i);
    });
};
