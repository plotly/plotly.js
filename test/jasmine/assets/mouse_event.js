var Lib = require('@src/lib');

module.exports = function(type, x, y, opts) {
  var fullOpts = {
    bubbles: true,
    clientX: x,
    clientY: y,
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
  if (opts && opts.buttons) {
    fullOpts.buttons = opts.buttons;
  }
  if (opts && opts.altKey) {
    fullOpts.altKey = opts.altKey;
  }
  if (opts && opts.ctrlKey) {
    fullOpts.ctrlKey = opts.ctrlKey;
  }
  if (opts && opts.metaKey) {
    fullOpts.metaKey = opts.metaKey;
  }
  if (opts && opts.shiftKey) {
    fullOpts.shiftKey = opts.shiftKey;
  }

  var el = (opts && opts.element) || document.elementFromPoint(x, y), ev;

  if (type === 'scroll') {
    ev = new window.WheelEvent('wheel', Lib.extendFlat({}, fullOpts, opts));
  } else {
    ev = new window.MouseEvent(type, fullOpts);
  }

  el.dispatchEvent(ev);

  return el;
};
