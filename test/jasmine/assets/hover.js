var mouseEvent = require('./mouse_event');

module.exports = function(x, y) {
    mouseEvent('mousemove', x, y);
};
