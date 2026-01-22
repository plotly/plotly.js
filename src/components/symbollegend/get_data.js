'use strict';

var Drawing = require('../drawing');

/**
 * Collect unique symbol values from all traces referencing this symbollegend
 *
 * @param {object} gd - graph div
 * @param {string} symbollegendId - e.g., 'symbollegend', 'symbollegend2'
 * @returns {Array} - array of {value, symbolNumber, label, traces, points}
 */
module.exports = function getSymbollegendData(gd, symbollegendId) {
    var fullData = gd._fullData;

    var valueMap = {};  // value -> {symbolNumber, label, traces, points}
    var values = [];    // ordered list of unique values

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(!trace.visible || trace.visible === 'legendonly') continue;

        var marker = trace.marker;
        if(!marker || marker.symbollegend !== symbollegendId) continue;

        var symbols = marker.symbol;
        if(!Array.isArray(symbols)) {
            // Single symbol value - treat as one item
            symbols = [symbols];
        }

        for(var j = 0; j < symbols.length; j++) {
            var symbolVal = symbols[j];
            var key = String(symbolVal);

            if(!valueMap[key]) {
                var symbolNumber = Drawing.symbolNumber(symbolVal);
                var label = getSymbolLabel(symbolVal, symbolNumber);

                valueMap[key] = {
                    value: symbolVal,
                    symbolNumber: symbolNumber,
                    label: label,
                    traces: [],
                    points: []
                };
                values.push(key);
            }

            if(valueMap[key].traces.indexOf(i) === -1) {
                valueMap[key].traces.push(i);
            }
            valueMap[key].points.push({trace: i, i: j});
        }
    }

    // Return discrete values
    return values.map(function(key) {
        return valueMap[key];
    });
};

/**
 * Get a human-readable label for a symbol
 * @param {string|number} symbolVal - the symbol value (name or number)
 * @param {number} symbolNumber - the resolved symbol number
 * @returns {string} - human-readable label
 */
function getSymbolLabel(symbolVal, symbolNumber) {
    // If it's already a string name, use it
    if(typeof symbolVal === 'string') {
        return symbolVal;
    }

    // If it's a number, try to get the name from symbolList
    var symbolList = Drawing.symbolList;
    if(symbolList && symbolNumber < symbolList.length) {
        // symbolList entries are [name, number, ...]
        // We need to find the entry with this number
        for(var i = 0; i < symbolList.length; i++) {
            if(symbolList[i] === symbolVal || Drawing.symbolNumber(symbolList[i]) === symbolNumber) {
                if(typeof symbolList[i] === 'string') {
                    return symbolList[i];
                }
            }
        }
    }

    // Fallback to the value itself
    return String(symbolVal);
}
