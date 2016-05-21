var prettySize = require('prettysize');


/**
 *  Format the on-bundle output message
 *
 * @param {browserify instance} b
 * @param {string} bundleName name of the bundle built
 */
module.exports = function formatBundleMsg(b, bundleName) {
    var msgParts = [
        bundleName, ':', '',
        'written', 'in', '', 'sec',
        '[', '', '', '', ']'
    ];

    b.on('bytes', function(bytes) {
        msgParts[2] = prettySize(bytes, true);
    });

    b.on('time', function(time) {
        msgParts[5] = (time / 1000).toFixed(2);
    });

    b.on('log', function() {
        var date = new Date();

        // get locale date
        msgParts[msgParts.length - 4] = date.toLocaleDateString();

        // get locale time
        msgParts[msgParts.length - 3] = date.toLocaleTimeString();

        // get time zone code
        msgParts[msgParts.length - 2] = date.toString().match(/\(([A-Za-z\s].*)\)/)[1];

        console.log(msgParts.join(' '));
    });
};
