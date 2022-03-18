'use strict';

// Replace .substr(a, ?b) with .substring(a, (a)+b)
//
// String.prototype.substr() is deprecated!
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substr

var fs = require('fs');
var allFolders = ['dist/'];
if(process.argv.indexOf('build') !== -1) allFolders.push('build/');

for(var k = 0; k < allFolders.length; k++) {
    var folder = allFolders[k];
    var allFilenames = fs.readdirSync(folder);

    for(var i = 0; i < allFilenames.length; i++) {
        var filename = allFilenames[i];
        var len = filename.length;
        if(
            filename.substring(0, 6) === 'plotly' &&
            filename.substring(len - 3) === '.js'
        ) {
            var f = folder + filename;
            var str = fs.readFileSync(f, {encoding: 'utf8', flag: 'r+'});
            var newStr = replaceSubstr(str);
            if(newStr !== str) {
                fs.writeFileSync(f, newStr, 'utf8');
                console.log('Overwritten: ' + f);
            }
        }
    }
}

function replaceSubstr(str) {
    var i0 = 0;
    while(i0 !== -1) {
        i0 = str.indexOf('.substr(', i0);
        if(i0 === -1) return str;

        var args = [];
        var text = '';
        var k = 0;

        // step into the function
        var i = i0 + 7;
        var p = 1; // open parentheses
        while(p > 0) {
            i++;

            var c = str.charAt(i);
            if(!c) break;
            if(p === 1 && (
                c === ',' ||
                c === ')'
            )) {
                args[k++] = text;
                text = '';
            } else {
                text += c;
            }

            if(c === '(') p++;
            if(c === ')') p--;
        }

        // console.log(str.substring(i0, i + 1));
        // console.log(args);

        var startStr = args[0];
        var lengthStr = args[1];
        var out = '.substring(' + startStr;

        if(lengthStr !== undefined) {
            out += ',';
            if(+startStr !== 0) {
                out += '(' + startStr + ')+';
            }
            out += lengthStr;
        }

        out += ')';

        // console.log(out)
        // console.log('__');

        str = str.substring(0, i0) + out + str.substring(i + 1);
    }

    return str;
}
