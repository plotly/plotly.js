module.exports = function getClientPosition(selector, index) {
    index = index || 0;

    var selection = document.querySelectorAll(selector);
    var clientPos = selection[index].getBoundingClientRect();
    var x = Math.floor((clientPos.left + clientPos.right) / 2);
    var y = Math.floor((clientPos.top + clientPos.bottom) / 2);

    return [x, y];
};
