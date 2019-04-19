'use strict';

/**
 * Given n states (denoted by their indices 0..n-1) this routine produces
 * a sequence of indices such that you efficiently execute each transition
 * from any state to any other state.
 */
module.exports = function transitions(n) {
    var out = [0];
    var nextStates = [];
    var i;
    for(i = 0; i < n; i++) nextStates[i] = (i + 1) % n;
    var finishedStates = 0;
    var thisState = 0;
    var nextState;
    while(finishedStates < n) {
        nextState = nextStates[thisState];
        if(nextState === thisState) {
            // I don't actually know how to prove that this algorithm works,
            // but I've never seen it fail for n>1
            // For prime n it's the same sequence as the one I started with
            // (n transitions of +1 index, then n transitions +2 etc...)
            // but this one works for non-prime n as well.
            throw new Error('your transitions algo failed.');
        }
        nextStates[thisState] = (nextStates[thisState] + 1) % n;
        if(nextStates[thisState] === thisState) finishedStates++;
        out.push(nextState);
        thisState = nextState;
    }
    if(out.length !== n * (n - 1) + 1) {
        throw new Error('your transitions algo failed.');
    }
    return out;
};
