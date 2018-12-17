/*
 * Un-polyfills - to be included in karma.conf.js to catch
 * browser-dependent errors.
 */

'use strict';

(function(arr) {
    arr.forEach(function(item) {
        Object.defineProperty(item, 'remove', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                throw Error([
                    'test/jasmine/assets/unpolyfill.js error: calling ChildNode.remove()',
                    'which is not available in IE.'
                ].join(' '));
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
