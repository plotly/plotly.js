var mouseEvent = require('./mouse_event');

module.exports = function hover(x, y) {
    mouseEvent('mousemove', x, y);
};
