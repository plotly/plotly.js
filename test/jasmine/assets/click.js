var mouseEvent = require('./mouse_event');

module.exports = function click(x, y, opts) {
    mouseEvent('mousemove', x, y, opts);
    mouseEvent('mousedown', x, y, opts);
    mouseEvent('mouseup', x, y, opts);
    mouseEvent('click', x, y, opts);
};
