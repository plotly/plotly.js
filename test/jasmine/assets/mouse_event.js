module.exports = function(type, x, y, opts) {
    var fullOpts = {
        bubbles: true,
        clientX: x,
        clientY: y
    };

    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
    if(opts && opts.buttons) {
        fullOpts.buttons = opts.buttons;
    }

    var el = document.elementFromPoint(x,y);
    var ev = new window.MouseEvent(type, fullOpts);
    el.dispatchEvent(ev);
};
