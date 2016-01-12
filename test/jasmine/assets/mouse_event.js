module.exports = function(type, x, y) {
    var options = {
        bubbles: true,
        clientX: x,
        clientY: y
    };

    var el = document.elementFromPoint(x,y);
    var ev = new window.MouseEvent(type, options);
    el.dispatchEvent(ev);
};
