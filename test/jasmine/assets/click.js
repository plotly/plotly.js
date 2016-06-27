var mouseEvent = require('./mouse_event');

module.exports = function click(x, y) {
    mouseEvent('mousemove', x, y);
    mouseEvent('mousedown', x, y);
    mouseEvent('mouseup', x, y);
};
