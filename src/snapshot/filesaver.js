'use strict';

var Lib = require('../lib');
var helpers = require('./helpers');

/*
* substantial portions of this code from FileSaver.js
* https://github.com/eligrey/FileSaver.js
* License: https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
* FileSaver.js
* A saveAs() FileSaver implementation.
* 1.1.20160328
*
* By Eli Grey, http://eligrey.com
* License: MIT
*   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
*/
function fileSaver(url, name, format) {
    var saveLink = document.createElement('a');
    var canUseSaveLink = 'download' in saveLink;

    var promise = new Promise(function(resolve, reject) {
        var blob;
        var objectUrl;

        // IE 10+ (native saveAs)
        if(Lib.isIE()) {
            // At this point we are only dealing with a decoded SVG as
            // a data URL (since IE only supports SVG)
            blob = helpers.createBlob(url, 'svg');
            window.navigator.msSaveBlob(blob, name);
            blob = null;
            return resolve(name);
        }

        if(canUseSaveLink) {
            blob = helpers.createBlob(url, format);
            objectUrl = helpers.createObjectURL(blob);

            saveLink.href = objectUrl;
            saveLink.download = name;
            document.body.appendChild(saveLink);
            saveLink.click();

            document.body.removeChild(saveLink);
            helpers.revokeObjectURL(objectUrl);
            blob = null;

            return resolve(name);
        }

        // Older versions of Safari did not allow downloading of blob urls
        if(Lib.isSafari()) {
            var prefix = format === 'svg' ? ',' : ';base64,';
            helpers.octetStream(prefix + encodeURIComponent(url));
            return resolve(name);
        }

        reject(new Error('download error'));
    });

    return promise;
}


module.exports = fileSaver;
