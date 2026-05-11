var Plots = require('../../plots/plots');


function uploadToCloud(gd) {
    var fig = Plots.graphJson(gd, false, 'keepdata', 'object', true, true);
    alert(JSON.stringify(fig, null, 2));
}

module.exports = {
    uploadToCloud: uploadToCloud
};