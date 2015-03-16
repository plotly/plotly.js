'use strict';
/*
*   Give it a json object for the body,
*   it'll return an options object ready
*   for request().
*   Just for added testing easypeasyness.
*/
function getOptions (body, url) {

    var opts = {
        url: url || 'http://localhost:9010/',
        method: 'POST'
    };

    if (body) opts.body = JSON.stringify(body);

    return opts;
}

module.exports = getOptions;
