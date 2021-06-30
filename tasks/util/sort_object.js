function caseInsensitive(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
}

function sortObject(obj) {
    var allKeys = Object.keys(obj);
    allKeys.sort(caseInsensitive);

    var newObj = {};
    for(var i = 0; i < allKeys.length; i++) {
        var key = allKeys[i];
        var v = obj[key];
        newObj[key] = (typeof v === 'object' && v !== null && !(v instanceof Array)) ?
            sortObject(v) :
            v;
    }

    return newObj;
}

module.exports = sortObject;
