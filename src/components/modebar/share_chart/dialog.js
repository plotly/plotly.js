'use strict';

const d3 = require('@plotly/d3');

const { dfltConfig } = require('../../../plot_api/plot_config');
const getDialogStrings = require('./strings');
const { SUPPORTED_PROTOCOLS, DEFAULT_PROTOCOL_PREFIX } = require('./constants');

// DOM element ID for the custom server URL input field
const URL_INPUT_ID = 'plotly-cloud-dialog-url';

/**
 * Build the message explaining what will happen if the user chooses to
 * share the chart.
 *
 * The wording depends on the destination: when serverUrl is the default
 * Plotly Cloud URL we show wording specific to Plotly Cloud, otherwise we
 * show a generic message naming the server's hostname.
 *
 * @param {d3 selection} dialog - the dialog box element to append the message to
 * @param {object} strings - localized strings from ./strings
 * @param {string} serverUrl - destination URL (must be a valid URL)
 * @returns {d3 selection} the message element
 */
const buildDescription = (dialog, strings, serverUrl) => {
    const description = dialog.append('div')
        .classed('plotly-cloud-dialog-message', true);

    if (serverUrl === dfltConfig.plotlyServerURL) {
        // If serverUrl matches the default Plotly Cloud URL,
        // show a custom message designed for Plotly Cloud

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

        description.append('span').text(beforePart);
        description.append('a')
            .classed('plotly-cloud-dialog-message--hostname', true)
            .attr('href', serverUrlHref)
            .attr('target', '_blank')
            .text(serverUrlHostname);
        description.append('span').text(afterPart);
    }

    return description;
};

/**
 * Build the field where the user can name their own chart server, along with
 * the element used to report back any issues with the entered URL.
 *
 * @param {d3 selection} dialog - the dialog box element to append the field to
 * @param {object} strings - localized strings from ./strings
 * @returns {object} the field wrapper, its input and its error element
 */
const buildUrlField = (dialog, strings) => {
    const urlField = dialog.append('div')
        .classed('plotly-cloud-dialog-url-field', true)
        .style('display', 'none');

    urlField.append('label')
        .classed('plotly-cloud-dialog-label', true)
        .attr('for', URL_INPUT_ID)
        .text(strings.DIALOG_URL_LABEL);

    const input = urlField.append('input')
        .classed('plotly-cloud-dialog-input', true)
        .attr('id', URL_INPUT_ID)
        .attr('type', 'text')
        .attr('spellcheck', false)
        .attr('placeholder', strings.DIALOG_URL_PLACEHOLDER);

    const error = urlField.append('div')
        .classed('plotly-cloud-dialog-error', true)
        .style('display', 'none');

    return { urlField: urlField, input: input, error: error };
};

/**
 * Turn the user-provided URL string into a fully-qualified URL by adding
 * the prefix `https://`  (DEFAULT_PROTOCOL_PREFIX) if no protocol is provided,
 * then parsing it to ensure it is a valid URL with a supported protocol.
 *
 * If the URL is valid, returns the full URL string with protocol;
 * otherwise, returns null.
 *
 * @param {string} entered - the user-provided custom URL
 * @returns {string|null} the URL to upload to, or null if it is unusable
 */
const resolveCustomUrl = (entered) => {
    const url = entered.includes('://') ? entered : DEFAULT_PROTOCOL_PREFIX + entered;

    let urlObj;
    try {
        urlObj = new URL(url);
    } catch (e) {
        return null;
    }

    return SUPPORTED_PROTOCOLS.includes(urlObj.protocol) ? url : null;
};

/**
 * Build the chart-sharing confirmation dialog box and add it to the DOM
 * inside the overlay element.
 *
 * The chart goes to the serverUrl we were given unless the user opts to name
 * their own server, in which case the URL they enter overrides it.
 *
 * @param {DOM node} gd - the graph div (used for localizing strings)
 * @param {d3 selection} overlay - the dialog backdrop element to append the box to
 * @param {string} serverUrl - default destination URL (must be a valid URL)
 * @param {function} onClickConfirm - called with the chosen URL when the upload is confirmed
 * @param {function} onClickCancel - called when the cancel button is clicked
 */
const buildDialogBox = (gd, overlay, serverUrl, onClickConfirm, onClickCancel) => {

    const strings = getDialogStrings(gd);

    const dialog = overlay.append('div')
        .classed('plotly-cloud-dialog-box', true);

    dialog.append('div')
        .classed('plotly-cloud-dialog-title', true)
        .text(strings.DIALOG_TITLE);

    const description = buildDescription(dialog, strings, serverUrl);

    // Read config flag _enableShareToDE to determine whether
    // to show the "Share to Dash Enterprise" link and the custom URL field
    const enableShareToDE = gd._context._enableShareToDE;

    // Replaces the description above once the user opts to name their own server.
    let customDescription = null;
    let field = null;

    // Whether the user has opted to name their own server, in which case the
    // URL field is showing and its contents decide where the chart goes.
    let useCustomUrl = false;

    const showError = (message) => {
        field.error.text(message).style('display', '');
        field.input.node().focus();
    };

    const confirm = () => {
        if (!useCustomUrl) {
            onClickConfirm(serverUrl);
            return;
        }

        const entered = (field.input.property('value') || '').trim();
        if (!entered) {
            showError(strings.DIALOG_URL_ERROR_EMPTY);
            return;
        }

        const customUrl = resolveCustomUrl(entered);
        if (!customUrl) {
            showError(strings.DIALOG_URL_ERROR_INVALID);
            return;
        }

        onClickConfirm(customUrl);
    };

    if (enableShareToDE) {
        customDescription = dialog.append('div')
            .classed('plotly-cloud-dialog-message', true)
            .style('display', 'none')
            .text(strings.DIALOG_MESSAGE_CUSTOM);

        field = buildUrlField(dialog, strings);

        field.input.on('input', () => {
            field.error.style('display', 'none');
        });

        field.input.on('keydown', () => {
            if (d3.event.key === 'Enter' || d3.event.keyCode === 13) confirm();
        });
    }

    const buttons = dialog.append('div')
        .classed('plotly-cloud-dialog-buttons', true);

    if (enableShareToDE) {
        const customBtn = buttons.append('button')
            .classed('plotly-cloud-dialog-link', true)
            .attr('type', 'button')
            .text(strings.DIALOG_CUSTOM_URL);

        // If user clicks the "Share to Dash Enterprise" link,
        // change dialog wording and display text field for entering another server URL
        customBtn.on('click', () => {
            useCustomUrl = true;
            customBtn.style('display', 'none');
            description.style('display', 'none');
            customDescription.style('display', '');
            field.urlField.style('display', '');
            field.input.node().focus();
        });
    }

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--cancel', true)
        .text(strings.DIALOG_CANCEL)
        .on('click', onClickCancel);

    buttons.append('button')
        .classed('plotly-cloud-dialog-btn', true)
        .classed('plotly-cloud-dialog-btn--confirm', true)
        .text(strings.DIALOG_CONFIRM)
        .on('click', confirm);
};

/**
 * Show a styled confirmation dialog before sharing a chart with Plotly Cloud.
 *
 * The dialog is appended to the plot's positioning container (.svg-container)
 * so it is centered over the plot rather than the whole viewport. It can be
 * dismissed by clicking Cancel, clicking the backdrop, or pressing Escape.
 *
 * @param {DOM node} gd - the graph div, used to scope the dialog to the plot
 * @param {string} serverUrl - default destination shown in the dialog message
 * @param {function} onConfirm - called with the chosen server URL when the user confirms
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
        (chosenUrl) => {
            close();
            onConfirm(chosenUrl);
        },
        close
    );
};

module.exports = confirmCloudDialog;
