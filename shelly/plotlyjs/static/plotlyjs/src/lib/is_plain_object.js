'use strict';

// more info: http://stackoverflow.com/questions/18531624/isplainobject-thing
module.exports = function isPlainObject(obj) {
    return (
        Object.prototype.toString.call(obj) === '[object Object]' &&
        Object.getPrototypeOf(obj) === Object.prototype
    );
};
