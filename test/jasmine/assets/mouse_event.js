module.exports = function (type, x, y, opts) {
    var el = document.elementFromPoint(x,y);
    var options = opts || { bubbles: true };
    var ev = new window.MouseEvent(type, options);
    el.dispatchEvent(ev);
};
