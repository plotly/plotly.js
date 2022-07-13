'use strict';

// more info: http://stackoverflow.com/questions/18531624/isplainobject-thing
module.exports = function isPlainObject(obj) {
    // We need to be a little less strict in the `imagetest` container because
    // of how async image requests are handled.
    //
    // N.B. isPlainObject(new Constructor()) will return true in `imagetest`
    if(window && window.process && window.process.versions) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    return (
        Object.prototype.toString.call(obj) === '[object Object]' &&
        Object.getPrototypeOf(obj).hasOwnProperty('hasOwnProperty')
    );
};
