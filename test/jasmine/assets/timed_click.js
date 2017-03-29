var mouseEvent = require('./mouse_event');

module.exports = function click(x, y) {
    mouseEvent('mousemove', x, y, {buttons: 0});

    window.setTimeout(function() {

        mouseEvent('mousedown', x, y, {buttons: 1});

        window.setTimeout(function() {

            mouseEvent('mouseup', x, y, {buttons: 0});

        }, 50);

    }, 150);
};
