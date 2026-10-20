const _ = require('../../../lib')._;

/**
 * Get the localized wording for the share chart dialog box.
 *
 * The strings must be built inside this function rather than defined
 * as constants because localization requires a reference to the graph div.
 *
 * Braces in the message strings mark the span of text that dialog.js turns
 * into a link to the destination server, so translations must keep them.
 *
 * @param {DOM node} gd - the graph div, used for localization
 * @returns {object} object containing localized strings
 */
const getDialogStrings = function(gd) {
    return {
        DIALOG_TITLE: _(gd, 'Share chart'),

        // Messages to be shown when serverUrl matches the default (Plotly Cloud) URL
        DIALOG_MESSAGE_CLOUD: _(gd, 'This chart will be uploaded to {Plotly Cloud} to create a sharing link. Only you can see it until you change its visibility.'),
        DIALOG_MESSAGE_CLOUD_ACCOUNT: _(gd, "If you don't have a Plotly Cloud account yet, you'll have a chance to create one."),

        // Message to be shown when serverUrl is not the default URL
        DIALOG_MESSAGE_OTHER: _(gd, 'This chart will be sent to {serverUrl}.'),

        // Labels for buttons
        DIALOG_CANCEL: _(gd, 'Cancel'),
        DIALOG_CONFIRM: _(gd, 'Share'),
    }
}

module.exports = getDialogStrings;