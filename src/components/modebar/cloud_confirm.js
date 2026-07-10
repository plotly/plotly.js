'use strict';

var d3 = require('@plotly/d3');

var _ = require('../../lib')._;

/**
 * Show a styled confirmation dialog before sharing a chart with Plotly Cloud.
 *
 * The dialog is appended to the plot's positioning container (.svg-container)
 * so it is centered over the plot rather than the whole viewport. It can be
 * dismissed by clicking Cancel, clicking the backdrop, or pressing Escape.
 *
 * By default the chart is uploaded to the configured plotlyServerURL. A
 * "Use a custom server URL" link reveals an editable "Server URL" field
 * pre-filled with that default; whatever the user leaves in the field when they
 * confirm becomes the destination, so a custom URL entered here overrides the
 * plotlyServerURL config for that upload.
 *
 * @param {DOM node} gd - the graph div, used to scope the dialog to the plot
 * @param {string} serverUrl - default destination, pre-filled into the URL input
 * @param {function} onConfirm - called with the (possibly edited) server URL when confirmed
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
        .text(_(gd, 'Share Chart'));

    var description = dialog.append('div')
        .classed('plotly-cloud-dialog-message', true)
        .text(_(gd, 'This chart and its data will be sent to') + ' ' + serverUrl + '. ');

    // The custom-URL field stays hidden until the user opts in. By default the
    // chart is shared to the configured serverUrl; a button in the button row
    // reveals this input for anyone who wants to override that destination.
    var urlField = dialog.append('div')
        .classed('plotly-cloud-dialog-url-field', true)
        .style('display', 'none');

    urlField.append('label')
        .classed('plotly-cloud-dialog-label', true)
        .attr('for', 'plotly-cloud-dialog-url')
        .text(_(gd, 'Dash Enterprise URL'));

    var input = urlField.append('input')
        .classed('plotly-cloud-dialog-input', true)
        .attr('id', 'plotly-cloud-dialog-url')
        .attr('type', 'text')
        .attr('spellcheck', false)
        .attr('placeholder', 'https://<your-dash-enterprise-instance>/newchart');

    var error = dialog.append('div')
        .classed('plotly-cloud-dialog-error', true)
        .style('display', 'none');

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

    function confirm() {
        var url = (input.property('value') || serverUrl).trim();

        if(!url) {
            error.text(_(gd, 'Please enter a server URL.')).style('display', '');
            input.node().focus();
            return;
        }

        try {
            new URL(url);
        } catch(e) {
            error.text(_(gd, 'Please enter a valid server URL.')).style('display', '');
            input.node().focus();
            return;
        }

        close();
        onConfirm(url);
    }

    // Hide the error and allow Enter to confirm from the input.
    input.on('input', function() {
        error.style('display', 'none');
    });
    input.on('keydown', function() {
        if(d3.event.key === 'Enter' || d3.event.keyCode === 13) confirm();
    });

    // Sits at the left of the button row, in line with Cancel/Share. Reveals
    // the Server URL field and hides itself once a custom URL is requested.
    var customBtn = buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--custom', true)
        .attr('type', 'button')
        .text(_(gd, 'Share with Dash Enterprise'));

    customBtn.on('click', function() {
        customBtn.style('display', 'none');
        urlField.style('display', '');
        description.text(_(gd, 'This chart and its data will be sent to the server URL you provide.'));
        input.node().focus();
    });

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--cancel', true)
        .text(_(gd, 'Cancel'))
        .on('click', close);

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--confirm', true)
        .text(_(gd, 'Share'))
        .on('click', confirm);
};
