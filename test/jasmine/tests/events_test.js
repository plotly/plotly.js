/* global $:false, jQuery:false */

/*
 * Note this test requires JQuery in the global scope.
 * we should keep it that way to keep testing our backward
 * compatibility with JQuery events.
 */

var Events = require('@src/lib/events');

describe('Events', function() {
    'use strict';

    var plotObj;
    var plotDiv;

    beforeEach(function() {
        plotObj = {};
        plotDiv = document.createElement('div');
    });

    describe('init', function() {

        it('instantiates an emitter on incoming plot object', function() {
            expect(plotObj._ev).not.toBeDefined();
            expect(Events.init(plotObj)._ev).toBeDefined();
        });

        it('maps function onto incoming plot object', function() {
            Events.init(plotObj);

            expect(typeof plotObj.on).toBe('function');
            expect(typeof plotObj.once).toBe('function');
            expect(typeof plotObj.removeListener).toBe('function');
            expect(typeof plotObj.removeAllListeners).toBe('function');
        });

        it('is idempotent', function() {
            Events.init(plotObj);
            plotObj.emit = function() {
                return 'initial';
            };

            Events.init(plotObj);
            expect(plotObj.emit()).toBe('initial');
        });

        it('triggers node style events', function(done) {
            Events.init(plotObj);

            plotObj.on('ping', function(data) {
                expect(data).toBe('pong');
                done();
            });

            setTimeout(function() {
                plotObj.emit('ping', 'pong');
            });
        });

        it('triggers jquery events', function(done) {
            Events.init(plotDiv);

            $(plotDiv).bind('ping', function(event, data) {
                expect(data).toBe('pong');
                done();
            });

            setTimeout(function() {
                $(plotDiv).trigger('ping', 'pong');
            });
        });
    });

    describe('triggerHandler', function() {

        it('triggers node handlers and returns last value', function() {
            var eventBaton = 0;

            Events.init(plotDiv);

            plotDiv.on('ping', function() {
                eventBaton++;
                return 'ping';
            });

            plotDiv.on('ping', function() {
                eventBaton++;
                return 'ping';
            });

            plotDiv.on('ping', function() {
                eventBaton++;
                return 'pong';
            });

            var result = Events.triggerHandler(plotDiv, 'ping');

            expect(eventBaton).toBe(3);
            expect(result).toBe('pong');
        });

        it('triggers jQuery handlers when no matching node events bound', function() {
            var eventBaton = 0;

            Events.init(plotDiv);

            $(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            /*
             * This will not be called
             */
            plotDiv.on('pong', function() {
                eventBaton++;
                return 'ping';
            });

            $(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'pong';
            });

            var result = Events.triggerHandler(plotDiv, 'ping');

            expect(eventBaton).toBe(2);
            expect(result).toBe('pong');
        });

        it('triggers jQuery handlers when no node events initialized', function() {
            var eventBaton = 0;

            $(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            $(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            $(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'pong';
            });

            var result = Events.triggerHandler(plotDiv, 'ping');

            expect(eventBaton).toBe(3);
            expect(result).toBe('pong');
        });


        it('triggers jQuery + nodejs handlers and returns last jQuery value', function() {
            var eventBaton = 0;

            Events.init(plotDiv);

            $(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            plotDiv.on('ping', function() {
                eventBaton++;
                return 'ping';
            });

            $(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'pong';
            });

            var result = Events.triggerHandler(plotDiv, 'ping');

            expect(eventBaton).toBe(3);
            expect(result).toBe('pong');
        });
    });

    describe('purge', function() {
        it('should remove all method from the plotObj', function() {
            Events.init(plotObj);
            Events.purge(plotObj);

            expect(plotObj).toEqual({});
        });
    });

    describe('when jQuery.noConflict is set, ', function() {

        beforeEach(function() {
            $.noConflict();
        });

        afterEach(function() {
            window.$ = jQuery;
        });

        it('triggers jquery events', function(done) {

            Events.init(plotDiv);

            jQuery(plotDiv).bind('ping', function(event, data) {
                expect(data).toBe('pong');
                done();
            });

            setTimeout(function() {
                jQuery(plotDiv).trigger('ping', 'pong');
            });
        });

        it('triggers jQuery handlers when no matching node events bound', function() {
            var eventBaton = 0;

            Events.init(plotDiv);

            jQuery(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            /*
             * This will not be called
             */
            plotDiv.on('pong', function() {
                eventBaton++;
                return 'ping';
            });

            jQuery(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'pong';
            });

            var result = Events.triggerHandler(plotDiv, 'ping');

            expect(eventBaton).toBe(2);
            expect(result).toBe('pong');
        });

        it('triggers jQuery handlers when no node events initialized', function() {
            var eventBaton = 0;

            jQuery(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            jQuery(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            jQuery(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'pong';
            });

            var result = Events.triggerHandler(plotDiv, 'ping');

            expect(eventBaton).toBe(3);
            expect(result).toBe('pong');
        });

        it('triggers jQuery + nodejs handlers and returns last jQuery value', function() {
            var eventBaton = 0;

            Events.init(plotDiv);

            jQuery(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'ping';
            });

            plotDiv.on('ping', function() {
                eventBaton++;
                return 'ping';
            });

            jQuery(plotDiv).bind('ping', function() {
                eventBaton++;
                return 'pong';
            });

            var result = Events.triggerHandler(plotDiv, 'ping');

            expect(eventBaton).toBe(3);
            expect(result).toBe('pong');
        });
    });
});
