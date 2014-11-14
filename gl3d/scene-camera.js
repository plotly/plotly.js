'use strict';

var createOrbitCamera = require('orbit-camera');

function attachCamera(shell, scene) {
  var camera = createOrbitCamera();

  shell.on('tick', function() {

    // * rotate - Shift + Left Button
    // * pan - Right mouse button OR control + left click
    // * zoom - Middle mouse button OR alt + left click OR scroll
    if (!camera.keyBindingMode) camera.keyBindingMode = 'rotate';

    var rotate = camera.keyBindingMode === 'rotate';
    var pan = camera.keyBindingMode === 'pan';
    var zoom = camera.keyBindingMode === 'zoom';

    var ctrl   = shell.down('control');
    var alt    = shell.down('alt');
    var shift  = shell.down('shift');
    var left   = shell.down('mouse-left');
    var right  = shell.down('mouse-right');
    var middle = shell.down('mouse-middle');


    if( (rotate && left && !ctrl && !alt && !shift) || (left && !ctrl && !alt && shift)) {
      camera.rotate([shell.mouseX/shell.width-0.5, shell.mouseY/shell.height-0.5],
                    [shell.prevMouseX/shell.width-0.5, shell.prevMouseY/shell.height-0.5]);
      scene.dirty = true;
    }
    if( (pan && left && !ctrl && !alt && !shift) || right || (left && ctrl && !alt && !shift)) {
      scene.dirty = true;
      camera.pan([(shell.mouseX - shell.prevMouseX)/shell.width,
                  (shell.mouseY - shell.prevMouseY)/shell.height]);
    }
    if(shell.scroll[1]) {
      camera.distance *= Math.exp(shell.scroll[1] / shell.height);
      scene.dirty = true;
    }
    if( (zoom && left && !ctrl && !alt && !shift) || middle || (left && !ctrl && alt && !shift)) {
      var d = shell.mouseY - shell.prevMouseY;
      if(d) {
        camera.distance *= Math.exp(d / shell.height);
      }
      scene.dirty = true;
    }

    //Update moving flag
    var moving = ctrl || alt || shift || left || right || middle;
    if(!moving && scene.moving) {
      scene.dirty = true;
      scene.selectDirty = true;
    }
    scene.moving = moving;
  });

  return camera;
}

module.exports = attachCamera;
