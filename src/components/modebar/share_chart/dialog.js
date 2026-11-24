'use strict';

const d3 = require('@plotly/d3');

const { dfltConfig } = require('../../../plot_api/plot_config');
const getDialogStrings = require('./strings');

/**
 * Build the chart-sharing confirmation dialog box and add it to DOM
 * inside the overlay element.
 *
 * The message wording depends on the destination: when serverUrl is the
 * default Plotly Cloud URL we show wording specific to Plotly Cloud,
 * otherwise we show a generic message naming the server's hostname.
 *
 * @param {DOM node} gd - the graph div (used for localizing strings)
 * @param {d3 selection} overlay - the dialog backdrop element to append the box to
 * @param {string} serverUrl - destination URL (must be a valid URL)
 * @param {function} onClickConfirm - called when the confirm button is clicked
 * @param {function} onClickCancel - called when the cancel button is clicked
 */
const buildDialogBox = (gd, overlay, serverUrl, onClickConfirm, onClickCancel) => {

    const strings = getDialogStrings(gd);

    const dialog = overlay.append('div')
        .classed('plotly-cloud-dialog-box', true);

    dialog.append('div')
        .classed('plotly-cloud-dialog-title', true)
        .text(strings.DIALOG_TITLE);

    if (serverUrl === dfltConfig.plotlyServerURL) {
        // If serverUrl matches the default Plotly Cloud URL,
        // show a custom message designed for Plotly Cloud
        const description = dialog.append('div')
            .classed('plotly-cloud-dialog-message', true);

        // Link to the base domain only, leaving the endpoint path
        const serverUrlHref = new URL(serverUrl).origin;

        // Split description into three parts: Before {, between, and after }
        const descriptionParts = strings.DIALOG_MESSAGE_CLOUD.split(/(\{|\})/);
        const beforePart = descriptionParts[0];
        const betweenPart = descriptionParts[2];
        const afterPart = descriptionParts[4];

        // Append the parts to the description div
        description.append('span').text(beforePart);
        description.append('a')
            .classed('plotly-cloud-dialog-message--hostname', true)
            .attr('href', serverUrlHref)
            .attr('target', '_blank')
            .text(betweenPart);
        description.append('span').text(afterPart);

        description.append('div')
            .classed('plotly-cloud-dialog-message--account', true)
            .text(strings.DIALOG_MESSAGE_CLOUD_ACCOUNT);
    } else {
        // Otherwise, show a generic message with the server URL
        // We can trust that serverUrl is a valid URL because it was validated in buttons.js
        const serverUrlObj = new URL(serverUrl);
        const serverUrlHostname = serverUrlObj.hostname;
        // Link to the base domain only, leaving off any endpoint path
        const serverUrlHref = serverUrlObj.origin;
        const descriptionParts = strings.DIALOG_MESSAGE_OTHER.split(/(\{|\})/);
        const beforePart = descriptionParts[0];
        const afterPart = descriptionParts[4];

        const description = dialog.append('div')
            .classed('plotly-cloud-dialog-message', true);

        description.append('span').text(beforePart);
        description.append('a')
            .classed('plotly-cloud-dialog-message--hostname', true)
            .attr('href', serverUrlHref)
            .attr('target', '_blank')
            .text(serverUrlHostname);
        description.append('span').text(afterPart);
    }

    const buttons = dialog.append('div')
        .classed('plotly-cloud-dialog-buttons', true);

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--cancel', true)
        .text(strings.DIALOG_CANCEL)
        .on('click', onClickCancel);

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--confirm', true)
        .text(strings.DIALOG_CONFIRM)
        .on('click', onClickConfirm);
};

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
const confirmCloudDialog = (gd, serverUrl, onConfirm) => {
    const container = d3.select(gd._fullLayout._paperdiv.node());

    // Never stack dialogs - drop any that is already open.
    container.selectAll('.plotly-cloud-dialog').remove();

    const overlay = container
        .append('div')
        .classed('plotly-cloud-dialog', true);

    const close = () => {
        overlay.remove();
        document.removeEventListener('keydown', onKeydown);
    };

    const onKeydown = (e) => {
        if(e.key === 'Escape' || e.keyCode === 27) close();
    };
    document.addEventListener('keydown', onKeydown);

    // Clicking the backdrop (but not the dialog box) cancels.
    overlay.on('click', () => {
        if(d3.event.target === overlay.node()) close();
    });

    // Build the dialog box and append it to the overlay
    buildDialogBox(
        gd,
        overlay,
        serverUrl,
        () => {
            close();
            onConfirm();
        },
        close
    );
};

module.exports = confirmCloudDialog;
