
var µ = module.exports = { version: '0.2.2' };
µ.util = {};

µ.util.translator = function(obj, sourceBranch, targetBranch, reverse) {
    if (reverse) {
        var targetBranchCopy = targetBranch.slice();
        targetBranch = sourceBranch;
        sourceBranch = targetBranchCopy;
    }
    var value = sourceBranch.reduce(function(previousValue, currentValue) {
        if (typeof previousValue != 'undefined') return previousValue[currentValue];
    }, obj);
    if (typeof value === 'undefined') return;
    sourceBranch.reduce(function(previousValue, currentValue, index) {
        if (typeof previousValue == 'undefined') return;
        if (index === sourceBranch.length - 1) delete previousValue[currentValue];
        return previousValue[currentValue];
    }, obj);
    targetBranch.reduce(function(previousValue, currentValue, index) {
        if (typeof previousValue[currentValue] === 'undefined') previousValue[currentValue] = {};
        if (index === targetBranch.length - 1) previousValue[currentValue] = value;
        return previousValue[currentValue];
    }, obj);
};


module.exports.µ = µ.util.translator;
