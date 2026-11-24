'use strict';

var d3 = require('@plotly/d3');
var isNumeric = require('fast-isnumeric');

var NOTEDATA = [];

/**
 * notifier
 * @param {string} text - The message to display in the notification
 * @param {number|'long'|'stick'} [displayLength=1000] - Display duration in ms,
 *     'long' for 3000ms, or 'stick' to keep until manually closed
 * @param {object} [gd] - Plot div; if provided and gd._context.displayNotifier === false, notification is suppressed
 * @return {undefined} this function does not return a value
 */
module.exports = function(text, displayLength, gd) {
    if(gd?._context?.displayNotifier === false) return;
    if(NOTEDATA.indexOf(text) !== -1) return;

    NOTEDATA.push(text);

    var ts = 1000;
    if(isNumeric(displayLength)) ts = displayLength;
    else if(displayLength === 'long') ts = 3000;

    var notifierContainer = d3.select('body')
        .selectAll('.plotly-notifier')
        .data([0]);
    notifierContainer.enter()
        .append('div')
        .classed('plotly-notifier', true);

    var notes = notifierContainer.selectAll('.notifier-note').data(NOTEDATA);

    function killNote(transition) {
        transition
            .duration(700)
            .style('opacity', 0)
            .each('end', function(thisText) {
                var thisIndex = NOTEDATA.indexOf(thisText);
                if(thisIndex !== -1) NOTEDATA.splice(thisIndex, 1);
                d3.select(this).remove();
            });
    }

    notes.enter().append('div')
        .classed('notifier-note', true)
        .style('opacity', 0)
        .each(function(thisText) {
            var note = d3.select(this);

            note.append('button')
                .classed('notifier-close', true)
                .html('&times;')
                .on('click', function() {
                    note.transition().call(killNote);
                });

            var p = note.append('p');
            var lines = thisText.split(/<br\s*\/?>/g);
            for(var i = 0; i < lines.length; i++) {
                if(i) p.append('br');
                p.append('span').text(lines[i]);
            }

            if(displayLength === 'stick') {
                note.transition()
                    .duration(350)
                    .style('opacity', 1);
            } else {
                note.transition()
                    .duration(700)
                    .style('opacity', 1)
                    .transition()
                    .delay(ts)
                    .call(killNote);
            }
        });
};
