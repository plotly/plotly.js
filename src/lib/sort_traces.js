'use strict';

function zipArrays(arrays) {
    var zipped = arrays[0].map(function(e, i) {
        var row = [];
        arrays.map(function(arr) {
            row.push(arr[i]);
        });
        return row;
    });
    return zipped;
}

function sortObjecstByKey(a, b, key) {
    if(a[key] === b[key]) return 0;
    if(a[key] < b[key]) return -1;
    return 1;
}

function matrixToObjectList(matrix, cols) {
    var zipped = zipArrays(matrix);

    var objList = [];

    zipped.forEach(function(row) {
        var objRow = {};
        cols.forEach(function(col, idx) {
            objRow[col] = row[idx];
        });
        objRow.y = row.at(-1);
        objList.push(objRow);
    });
    return objList;
}

exports.matrixToObjectList = matrixToObjectList;

function sortObjectList(cols, objList) {
    var sortedObjectList = objList.map(function(e) {
        return e;
    });
    cols.reverse().forEach(function(key) {
        sortedObjectList = sortedObjectList.sort(function(a, b) {
            return sortObjecstByKey(a, b, key);
        });
    });
    return sortedObjectList;
}

exports.sortObjectList = sortObjectList;

function objectListToList(objectList) {
    var list = [];
    objectList.forEach(function(item) {
        list.push(Object.values(item));
    });
    return list;
}

exports.objectListToList = objectListToList;

function sortedMatrix(list) {
    var xs = [];
    var y = [];

    list.slice().forEach(function(item) {
        y.push(item.pop());
        xs.push(item);
    });

    return [xs, y];
}

exports.sortedMatrix = sortedMatrix;

function transpose(matrix) {
    var width = matrix[0].length;
    var newMatrix = [];

    // prevent inplace change
    for(var row = 0; row < matrix.length; row++) {
        newMatrix.push(matrix[row].slice());
    }

    for(var i = 0; i < newMatrix.length; i++) {
        for(var j = 0; j < i; j++) {
            newMatrix = newMatrix.slice();
            var temp = newMatrix[i][j];
            newMatrix[i][j] = newMatrix[j][i];
            newMatrix[j][i] = temp;
        }
    }

    newMatrix = newMatrix.slice(0, width);
    console.table('sortLib Matrix', newMatrix);
    return newMatrix;
}

exports.transpose = transpose;
