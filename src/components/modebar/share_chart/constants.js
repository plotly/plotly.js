'use strict';

// A URL's protocol is the part in front of the '://' that says how the browser
// should reach the address: the 'https' in 'https://example.com/charts'.

// The protocols we are willing to upload a chart over, whether the destination
// comes from the plotlyServerURL config or is typed into the dialog. Both
// values keep the trailing ':' so they can be compared directly against the
// 'protocol' property the browser's URL parser hands back.
const SUPPORTED_PROTOCOLS = ['http:', 'https:'];

// Put in front of an address that states no protocol of its own, which is the
// same assumption a browser makes about what you type into its address bar.
const DEFAULT_PROTOCOL_PREFIX = 'https://';

module.exports = {
    SUPPORTED_PROTOCOLS: SUPPORTED_PROTOCOLS,
    DEFAULT_PROTOCOL_PREFIX: DEFAULT_PROTOCOL_PREFIX
};
