/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


module.exports = {
  // ms between first mousedown and 2nd mouseup to constitute dblclick...
  // we don't seem to have access to the system setting
  DBLCLICKDELAY: 600,

  // pixels to move mouse before you stop clamping to starting point
  MINDRAG: 8,

  // smallest dimension allowed for a zoombox
  MINZOOM: 20,

  // width of axis drag regions
  DRAGGERSIZE: 20
};
