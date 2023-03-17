'use strict';

var xmlnsNamespaces = require('../constants/xmlns_namespaces');

exports.pointsAccessorFunction = function(transforms, opts) {
    var tr;
    var prevIndexToPoints;
    for(var i = 0; i < transforms.length; i++) {
        tr = transforms[i];
        if(tr === opts) break;
        if(!tr._indexToPoints || tr.enabled === false) continue;
        prevIndexToPoints = tr._indexToPoints;
    }
    var originalPointsAccessor = prevIndexToPoints ?
        function(i) {return prevIndexToPoints[i];} :
        function(i) {return [i];};
    return originalPointsAccessor;
};

exports.generateInlineExternalFontDefs = async function(externalUrl, fontFamily, fontType) {
    const resp = await fetch(externalUrl);
    const blob = await resp.blob();
    const urls = await fileListToBase64([blob]);

    urls[0] = urls[0].replace('application/octet-stream', `font/${fontType}`)

    const defs = document.createElementNS(xmlnsNamespaces.svg, 'defs');

    const style = document.createElementNS(xmlnsNamespaces.svg, 'style');

    style.prepend(`@font-face { font-family: '${fontFamily}'; src: url(${urls[0]}) format('${fontType}'); }`)

    defs.appendChild(style);

    return defs;
}

async function fileListToBase64(fileList) {
    // create function which return resolved promise
    // with data:base64 string
    function getBase64(file) {
        const reader = new FileReader()
        return new Promise(resolve => {
        reader.onload = ev => {
            resolve(ev.target.result)
        }
        reader.readAsDataURL(file)
        })
    }

    // here will be array of promisified functions
    const promises = []

    // loop through fileList with for loop
    for (let i = 0; i < fileList.length; i++) {
        promises.push(getBase64(fileList[i]))
    }

    // array with base64 strings
    return await Promise.all(promises)
}