/*
 * For image testing
 *
 * Give it a json object for the body,
 * it'll return an options object ready for request().
 */
module.exports = function getOptions(body, url) {
    var opts = {
        url: url || 'http://localhost:9010/',
        method: 'POST'
    };

    if(body) opts.body = JSON.stringify(body);

    return opts;
};
