var mouseEvent = require('./mouse_event');
var Lib = require('../../../src/lib');

/*
 * simulated click event at screen pixel position x, y
 *
 * @param {number} x: x pixel position on the page (clientX)
 * @param {number} y: y pixel position on the page (clientY)
 *
 * @param {object} opts: optional event options
 *   @param {bool} opts.altKey - was alt/option pressed during this click?
 *   @param {bool} opts.ctrlKey - was ctrl pressed during this click?
 *   @param {bool} opts.metaKey - was meta/command pressed during this click?
 *   @param {bool} opts.shiftKey - was shift pressed during this click?
 *   @param {number} opts.button: the button used for the click.
 *     Do NOT supply `opts.buttons`, it will be automatically generated to match.
 *     The events generated and button/buttons for each will be tailored to match real events.
 *       0 or missing - left button
 *       2 - right button
 *       anything else - we don't use other buttons, so throw an error if we test with them.
 *  @param {bool} cancelContext: act as though `preventDefault` was called during a `contextmenu`
 *    handler, which stops native contextmenu and therefore allows mouseup events to be fired.
 *    Only relevant if button=2 or ctrlKey=true.
 */
module.exports = function click(x, y, optsIn) {
    var opts = Lib.extendFlat({}, optsIn || {});
    var button = opts.button || 0;
    if(button && button !== 2) throw new Error('unsupported button: ' + button);
    if(opts.buttons !== undefined) throw new Error('do not supply opts.buttons');
    var buttons = button ? 2 : 1;

    // TODO: this is the behavior I observe (Chrome 63 Mac) but we should verify that it's consistent:
    // - `buttons` is 0 for mouseUp and click events, but you get `button` unchanged
    // - ctrlKey or right button triggers contextMenu
    // - you only get a mouseup after contextmenu if you preventDefault on the contextmenu
    // - you still don't get a `click` event after contextmenu
    var rightClick = (button === 2) || opts.ctrlKey;
    var callContext = rightClick && !opts.cancelContext;
    delete opts.cancelContext;

    var moveOpts = Lib.extendFlat({}, opts);
    delete moveOpts.button;

    var downOpts = Lib.extendFlat({buttons: buttons}, opts);
    var upOpts = opts;

    mouseEvent('mousemove', x, y, moveOpts);
    mouseEvent('mousedown', x, y, downOpts);
    if(callContext) mouseEvent('contextmenu', x, y, downOpts);
    if(!callContext) mouseEvent('mouseup', x, y, upOpts);
    if(!rightClick) mouseEvent('click', x, y, upOpts);
};
