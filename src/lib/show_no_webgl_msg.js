/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../plotly');

var noop = function() {};


/**
 * Prints a no webgl error message into the scene container
 * @param {scene instance} scene
 *
 * Expects 'scene' to have property 'container'
 *
 */
module.exports = function showWebGlMsg(scene) {
    for(var prop in scene) {
        if(typeof scene[prop] === 'function') scene[prop] = noop;
    }

    scene.destroy = function() {
        scene.container.parentNode.removeChild(scene.container);
    };

    var div = document.createElement('div');
    div.textContent = 'Webgl is not supported by your browser - visit http://get.webgl.org for more info';
    div.style.cursor = 'pointer';
    div.style.fontSize = '24px';
    div.style.color = Plotly.Color.defaults[0];

    scene.container.appendChild(div);
    scene.container.style.background = '#FFFFFF';
    scene.container.onclick = function() {
        window.open('http://get.webgl.org');
    };

    // return before setting up camera and onrender methods
    return false;
};
