'use strict';

function zipArrays(arrays) {
    var zipped = [];
    arrays[0].forEach(function(e, i) {
        var row = [];
        arrays.forEach(function(arr) {
            row.push(arr[i]);
        });
        zipped.push(row);
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
        objRow.y = row[row.length - 1];
        objList.push(objRow);
    });
    return objList;
}

exports.matrixToObjectList = matrixToObjectList;

function sortObjectList(cols, objList) {
    var sortedObjectList = objList.map(function(e) {
        return e;
    });
    cols.slice().reverse().forEach(function(key) {
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

function sortedMatrix(list, removeNull) {
    var xs = [];
    var y = [];

    list.slice().forEach(function(item) {
        var val = item.pop();

        if(removeNull & item.includes(null)) {
            return;
        }

        y.push(val);
        xs.push(item);
    });

    return [xs, y];
}

exports.sortedMatrix = sortedMatrix;

function squareMatrix(matrix) {
    var width = matrix[0].length;
    var height = matrix.length;

    if(width === height) {
        return matrix;
    }

    var newMatrix = [];

    if(width > height) {
        for(var rw = 0; rw < height; rw++) {
            newMatrix.push(matrix[rw].slice());
        }
        for(var i = height; i < width; i++) {
            newMatrix.push(Array(width));
        }
    } else {
        for(var row = 0; row < height; row++) {
            var rowExpansion = Array(height - width);
            var rowSlice = matrix[row].slice();
            Array.prototype.push.apply(rowSlice, rowExpansion);
            newMatrix.push(rowSlice);
        }
    }
    return newMatrix;
}

exports.squareMatrix = squareMatrix;

function transpose(matrix) {
    var height = matrix.length;
    var width = matrix[0].length;

    var squaredMatrix = squareMatrix(matrix);

    var newMatrix = [];

    // prevent inplace change and mantain the main diagonal
    for(var rw = 0; rw < squaredMatrix.length; rw++) {
        newMatrix.push(squaredMatrix[rw].slice());
    }

    for(var i = 0; i < newMatrix.length; i++) {
        for(var j = 0; j < i; j++) {
            newMatrix = newMatrix.slice();
            var temp = newMatrix[i][j];
            newMatrix[i][j] = newMatrix[j][i];
            newMatrix[j][i] = temp;
        }
    }
    if(width > height) {
        for(var row = 0; row < newMatrix.length; row++) {
            newMatrix[row] = newMatrix[row].slice(0, height);
        }
    } else {
        newMatrix = newMatrix.slice(0, width);
    }
    return newMatrix;
}

exports.transpose = transpose;