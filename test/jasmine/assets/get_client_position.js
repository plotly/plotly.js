module.exports = function getClientPosition(selector, index) {
    index = index || 0;

    var selection = document.querySelectorAll(selector),
        clientPos = selection[index].getBoundingClientRect(),
        x = Math.floor((clientPos.left + clientPos.right) / 2),
        y = Math.floor((clientPos.top + clientPos.bottom) / 2);

    return [x, y];
};
