gl3d code organization
======================

Main external interface is `scene.plot()`

## Scene management

* `gl_now.js`
* `scene-camera.js`
* `scene-framer.js`
* `scene.js`

## Plot objects and attribute mapping

* `gl3dlayout.js`
* `gl3daxes.js`
* `surface.js`
* `line-with-markers.js`
* `scatter3d.js`

## Miscellaneous computations

* `str2rgbarray.js`
* `calc-errors.js`
* `compute-tick-length.js`
* `dashes.json`
* `project.js`


# Questions

* How does the scene initially get created?

* How are plot types instantiated?

* Which places in the code explicitly reference objects in gl3d?