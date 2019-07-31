'use strict';

function compare(baseRects, compareRects) {
    return baseRects.left < compareRects.right &&
            baseRects.right > compareRects.left &&
            baseRects.top < compareRects.bottom &&
            baseRects.bottom > compareRects.top;
}

module.exports = function checkOverlap(base, elements) {
    var baseRects = base.getBoundingClientRect();

    // handle array as second argument
    if(Array.isArray(elements)) {
        return elements.map(function(el) {
            if(!el) return false;

            var compareRects = el.getBoundingClientRect();
            return compare(baseRects, compareRects);
        });
    }

    // handle HTMLCollection or NodeList as second argument
    if(elements instanceof NodeList || elements instanceof HTMLCollection) {
        var collection = Array.prototype.slice.call(elements);

        return collection.map(function(el) {
            // check for holly or null values
            if(!el) return false;

            var compareRects = el.getBoundingClientRect();
            return compare(baseRects, compareRects);
        });
    }

    // assume element is node
    return compare(baseRects, elements.getBoundingClientRect());
};
