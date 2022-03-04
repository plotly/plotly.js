'use strict';

module.exports = function loadScript(src, done) {
    var newScript;
    newScript = document.createElement('script');
    newScript.src = src;
    newScript.type = 'text/javascript';
    newScript.onload = done;
    newScript.onerror = done.fail;
    document.body.appendChild(newScript);
};
