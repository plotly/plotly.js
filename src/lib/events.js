/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/* global jQuery:false */

var EventEmitter = require('events').EventEmitter;

var Events = {

    init: function(plotObj) {

        /*
         * If we have already instantiated an emitter for this plot
         * return early.
         */
        if(plotObj._ev instanceof EventEmitter) return plotObj;

        var ev = new EventEmitter();
        var internalEv = new EventEmitter();

        /*
         * Assign to plot._ev while we still live in a land
         * where plot is a DOM element with stuff attached to it.
         * In the future we can make plot the event emitter itself.
         */
        plotObj._ev = ev;

        /*
         * Create a second event handler that will manage events *internally*.
         * This allows parts of plotly to respond to thing like relayout without
         * having to use the user-facing event handler. They cannot peacefully
         * coexist on the same handler because a user invoking
         * plotObj.removeAllListeners() would detach internal events, breaking
         * plotly.
         */
        plotObj._internalEv = internalEv;

        /*
         * Assign bound methods from the ev to the plot object. These methods
         * will reference the 'this' of plot._ev even though they are methods
         * of plot. This will keep the event machinery away from the plot object
         * which currently is often a DOM element but presents an API that will
         * continue to function when plot becomes an emitter. Not all EventEmitter
         * methods have been bound to `plot` as some do not currently add value to
         * the Plotly event API.
         */
        plotObj.on = ev.on.bind(ev);
        plotObj.once = ev.once.bind(ev);
        plotObj.removeListener = ev.removeListener.bind(ev);
        plotObj.removeAllListeners = ev.removeAllListeners.bind(ev);

        /*
         * Create funtions for managing internal events. These are *only* triggered
         * by the mirroring of external events via the emit function.
         */
        plotObj._internalOn = internalEv.on.bind(internalEv);
        plotObj._internalOnce = internalEv.once.bind(internalEv);
        plotObj._removeInternalListener = internalEv.removeListener.bind(internalEv);
        plotObj._removeAllInternalListeners = internalEv.removeAllListeners.bind(internalEv);

        /*
         * We must wrap emit to continue to support JQuery events. The idea
         * is to check to see if the user is using JQuery events, if they are
         * we emit JQuery events to trigger user handlers as well as the EventEmitter
         * events.
         */
        plotObj.emit = function(event, data) {
            if(typeof jQuery !== 'undefined') {
                jQuery(plotObj).trigger(event, data);
            }

            ev.emit(event, data);
            internalEv.emit(event, data);
        };

        return plotObj;
    },

    /*
     * This function behaves like jQueries triggerHandler. It calls
     * all handlers for a particular event and returns the return value
     * of the LAST handler. This function also triggers jQuery's
     * triggerHandler for backwards compatibility.
     *
     * Note: triggerHandler has been recommended for deprecation in v2.0.0,
     * so the additional behavior of triggerHandler triggering internal events
     * is deliberate excluded in order to avoid reinforcing more usage.
     */
    triggerHandler: function(plotObj, event, data) {
        var jQueryHandlerValue;
        var nodeEventHandlerValue;
        /*
         * If Jquery exists run all its handlers for this event and
         * collect the return value of the LAST handler function
         */
        if(typeof jQuery !== 'undefined') {
            jQueryHandlerValue = jQuery(plotObj).triggerHandler(event, data);
        }

        /*
         * Now run all the node style event handlers
         */
        var ev = plotObj._ev;
        if(!ev) return jQueryHandlerValue;

        var handlers = ev._events[event];
        if(!handlers) return jQueryHandlerValue;

        /*
         * handlers can be function or an array of functions
         */
        if(typeof handlers === 'function') handlers = [handlers];
        var lastHandler = handlers.pop();

        /*
         * Call all the handlers except the last one.
         */
        for(var i = 0; i < handlers.length; i++) {
            handlers[i](data);
        }

        /*
         * Now call the final handler and collect its value
         */
        nodeEventHandlerValue = lastHandler(data);

        /*
         * Return either the jquery handler value if it exists or the
         * nodeEventHandler value. Jquery event value superceeds nodejs
         * events for backwards compatability reasons.
         */
        return jQueryHandlerValue !== undefined ? jQueryHandlerValue :
            nodeEventHandlerValue;
    },

    purge: function(plotObj) {
        delete plotObj._ev;
        delete plotObj.on;
        delete plotObj.once;
        delete plotObj.removeListener;
        delete plotObj.removeAllListeners;
        delete plotObj.emit;

        delete plotObj._ev;
        delete plotObj._internalEv;
        delete plotObj._internalOn;
        delete plotObj._internalOnce;
        delete plotObj._removeInternalListener;
        delete plotObj._removeAllInternalListeners;

        return plotObj;
    }

};

module.exports = Events;
