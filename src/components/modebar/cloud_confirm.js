'use strict';

var d3 = require('@plotly/d3');

/**
 * Show a styled confirmation dialog before sharing a chart with Plotly Cloud.
 *
 * The dialog is appended to the plot's positioning container (.svg-container)
 * so it is centered over the plot rather than the whole viewport. It can be
 * dismissed by clicking Cancel, clicking the backdrop, or pressing Escape.
 *
 * @param {DOM node} gd - the graph div, used to scope the dialog to the plot
 * @param {string} serverUrl - destination shown in the dialog message
 * @param {function} onConfirm - called when the user confirms the upload
 */
module.exports = function confirmCloudDialog(gd, serverUrl, onConfirm) {
    var container = d3.select(gd._fullLayout._paperdiv.node());

    // Never stack dialogs - drop any that is already open.
    container.selectAll('.plotly-cloud-dialog').remove();

    var overlay = container
        .append('div')
        .classed('plotly-cloud-dialog', true);

    var dialog = overlay.append('div')
        .classed('plotly-cloud-dialog-box', true);

    dialog.append('div')
        .classed('plotly-cloud-dialog-title', true)
        .text('Share with Plotly Cloud');

    dialog.append('div')
        .classed('plotly-cloud-dialog-message', true)
        .text('Your chart data will be sent to ' + serverUrl + '.');

    var buttons = dialog.append('div')
        .classed('plotly-cloud-dialog-buttons', true);

    function close() {
        overlay.remove();
        document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
        if(e.key === 'Escape' || e.keyCode === 27) close();
    }
    document.addEventListener('keydown', onKeydown);

    // Clicking the backdrop (but not the dialog box) cancels.
    overlay.on('click', function() {
        if(d3.event.target === overlay.node()) close();
    });

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--cancel', true)
        .text('Cancel')
        .on('click', close);

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--confirm', true)
        .text('Share')
        .on('click', function() {
            close();
            onConfirm();
        });
};
