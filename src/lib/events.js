'use strict';

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
         * Create functions for managing internal events. These are *only* triggered
         * by the mirroring of external events via the emit function.
         */
        plotObj._internalOn = internalEv.on.bind(internalEv);
        plotObj._internalOnce = internalEv.once.bind(internalEv);
        plotObj._removeInternalListener = internalEv.removeListener.bind(internalEv);
        plotObj._removeAllInternalListeners = internalEv.removeAllListeners.bind(internalEv);

        plotObj.emit = function(event, data) {
            ev.emit(event, data);
            internalEv.emit(event, data);
        };

        return plotObj;
    },

    /*
     * This function behaves like jQuery's triggerHandler. It calls
     * all handlers for a particular event and returns the return value
     * of the LAST handler.
     */
    triggerHandler: function(plotObj, event, data) {
        var nodeEventHandlerValue;

        /*
         * Now run all the node style event handlers
         */
        var ev = plotObj._ev;
        if(!ev) return;

        var handlers = ev._events[event];
        if(!handlers) return;

        // making sure 'this' is the EventEmitter instance
        function apply(handler) {
            // The 'once' case, we can't just call handler() as we need
            // the return value here. So,
            // - remove handler
            // - call listener and grab return value!
            // - stash 'fired' key to not call handler twice
            if(handler.listener) {
                ev.removeListener(event, handler.listener);
                if(!handler.fired) {
                    handler.fired = true;
                    return handler.listener.apply(ev, [data]);
                }
            } else {
                return handler.apply(ev, [data]);
            }
        }

        // handlers can be function or an array of functions
        handlers = Array.isArray(handlers) ? handlers : [handlers];

        var i;
        for(i = 0; i < handlers.length - 1; i++) {
            apply(handlers[i]);
        }
        // now call the final handler and collect its value
        nodeEventHandlerValue = apply(handlers[i]);

        return nodeEventHandlerValue;
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
