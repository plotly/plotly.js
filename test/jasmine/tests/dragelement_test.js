var dragElement = require('@src/components/dragelement');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var touchEvent = require('../assets/touch_event');

describe('dragElement', function() {
    'use strict';

    beforeEach(function() {
        this.gd = createGraphDiv();
        this.hoverlayer = document.createElement('div');
        this.element = document.createElement('div');

        this.gd.className = 'js-plotly-plot';
        this.gd._fullLayout = {
            _hoverlayer: d3Select(this.hoverlayer)
        };
        this.gd._context = {
            doubleClickDelay: 300
        };
        this.element.innerHTML = 'drag element';

        this.gd.appendChild(this.element);
        this.element.appendChild(this.hoverlayer);

        var clientRect = this.element.getBoundingClientRect();
        this.x = clientRect.left + clientRect.width / 2;
        this.y = clientRect.top + clientRect.height / 2;
    });

    afterEach(destroyGraphDiv);

    function countCoverSlip() {
        return d3SelectAll('.dragcover').size();
    }

    it('should init drag element', function() {
        var options = { element: this.element, gd: this.gd };
        dragElement.init(options);

        expect(this.element.style.pointerEvents).toEqual('all', 'with pointer event style');
        expect(this.element.onmousedown).not.toBe(null, 'with on mousedown handler');
    });

    it('should pass event, startX and startY to prepFn on mousedown', function() {
        var args = [];
        var options = {
            element: this.element,
            gd: this.gd,
            prepFn: function(event, startX, startY) {
                args = [event, startX, startY];
            }
        };
        dragElement.init(options);

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mouseup', this.x, this.y);

        expect(args[0]).not.toBe(null);
        expect(args[1]).toEqual(Math.floor(this.x));
        expect(args[2]).toEqual(Math.floor(this.y));
    });

    it('should pass dx and dy to moveFn on mousemove', function() {
        var args = [];
        var options = {
            element: this.element,
            gd: this.gd,
            moveFn: function() {
                args = arguments;
            }
        };
        dragElement.init(options);

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mousemove', this.x + 10, this.y + 10);
        mouseEvent('mouseup', this.x, this.y);

        expect(args.length).toBe(2);
        expect(args[0]).toEqual(10);
        expect(args[1]).toEqual(10);
    });

    it('does not pass the event to doneFn on mouseup after mousemove', function() {
        var args = [];
        var options = {
            element: this.element,
            gd: this.gd,
            doneFn: function() {
                args = arguments;
            },
            clickFn: function() {
                expect('should not call clickFn').toBe(true);
            }
        };
        dragElement.init(options);

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mousemove', this.x + 10, this.y + 10);
        mouseEvent('mouseup', this.x, this.y);

        expect(args.length).toBe(0);
    });

    it('should pass numClicks and event to clickFn on mouseup after no/small mousemove', function() {
        var args = [];
        var options = {
            element: this.element,
            gd: this.gd,
            clickFn: function() {
                args = arguments;
            },
            moveFn: function() {
                expect('should not call moveFn').toBe(true);
            },
            doneFn: function() {
                expect('should not call doneFn').toBe(true);
            }
        };
        dragElement.init(options);

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mouseup', this.x, this.y);

        expect(args.length).toBe(2);
        expect(args[0]).toEqual(1);
        // click gets the mousedown event, as that's guaranteed to have
        // the correct target
        expect(args[1].type).toBe('mousedown');

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mousemove', this.x + 3, this.y + 3);
        mouseEvent('mouseup', this.x, this.y);

        expect(args.length).toBe(2);
        expect(args[0]).toEqual(2);
        expect(args[1].type).toBe('mousedown');
    });

    it('should pass numClicks and event to clickFn on mouseup after no/small mousemove w/ custom doubleClickDelay', function(done) {
        var args = [];

        this.gd._context.doubleClickDelay = 1000;

        var options = {
            element: this.element,
            gd: this.gd,
            clickFn: function() {
                args = arguments;
            },
            moveFn: function() {
                expect('should not call moveFn').toBe(true);
            },
            doneFn: function() {
                expect('should not call doneFn').toBe(true);
            }
        };
        dragElement.init(options);

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mouseup', this.x, this.y);

        expect(args.length).toBe(2);
        expect(args[0]).toEqual(1);
        // click gets the mousedown event, as that's guaranteed to have
        // the correct target
        expect(args[1].type).toBe('mousedown');

        var _this = this;
        setTimeout(function() {
            mouseEvent('mousedown', _this.x, _this.y);
            mouseEvent('mousemove', _this.x + 3, _this.y + 3);
            mouseEvent('mouseup', _this.x, _this.y);

            expect(args.length).toBe(2);
            expect(args[0]).toEqual(2);
            expect(args[1].type).toBe('mousedown');

            done();
        }, 500);
    });

    it('should add a cover slip div to the DOM', function() {
        var options = { element: this.element, gd: this.gd };
        dragElement.init(options);

        expect(countCoverSlip()).toEqual(0);

        mouseEvent('mousedown', this.x, this.y);
        expect(countCoverSlip()).toEqual(1);

        mouseEvent('mousemove', this.x + 10, this.y + 10);
        expect(countCoverSlip()).toEqual(1);

        mouseEvent('mouseup', this.x, this.y);
        expect(countCoverSlip()).toEqual(0);
    });

    it('should not add a cover slip div to the DOM when right click', function() {
        var clickCalls = 0;
        var options = {
            element: this.element,
            gd: this.gd,
            clickFn: function() {
                clickCalls++;
            }
        };
        dragElement.init(options);

        var mockObj = {
            handleClick: function() {}
        };
        spyOn(mockObj, 'handleClick');

        this.element.onclick = mockObj.handleClick;

        mouseEvent('mousedown', this.x, this.y, { buttons: 2 });
        expect(countCoverSlip()).toEqual(0);

        mouseEvent('mouseup', this.x, this.y);
        expect(mockObj.handleClick).not.toHaveBeenCalled();
        expect(clickCalls).toBe(1);
    });

    it('should fire off click event when down/up without dragging', function() {
        var options = { element: this.element, gd: this.gd };
        dragElement.init(options);

        var mockObj = {
            handleClick: function() {},
            dummy: function() {}
        };
        spyOn(mockObj, 'handleClick');
        spyOn(mockObj, 'dummy');

        this.element.onclick = mockObj.handleClick;

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mouseup', this.x, this.y);

        expect(mockObj.handleClick).toHaveBeenCalled();

        this.element.onclick = mockObj.dummy;

        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mousemove', this.x + 10, this.y + 10);
        mouseEvent('mouseup', this.x, this.y);

        expect(mockObj.dummy).not.toHaveBeenCalled();
    });

    it('should not register move event handler when dragmode is false', function() {
        var moveCalls = 0;
        var options = {
            element: this.element,
            gd: this.gd,
            dragmode: false,
            moveFn: function() {
                moveCalls++;
            }
        };
        dragElement.init(options);
        mouseEvent('mousedown', this.x, this.y);
        mouseEvent('mousemove', this.x + 10, this.y + 10);
        mouseEvent('mouseup', this.x, this.y);

        expect(moveCalls).toBe(0);

        touchEvent('touchstart', this.x, this.y);
        touchEvent('touchmove', this.x + 10, this.y + 10);
        touchEvent('touchend', this.x, this.y);

        expect(moveCalls).toBe(0);
    });
});

describe('dragElement.getCursor', function() {
    'use strict';

    var getCursor = dragElement.getCursor;

    it('should return sw-resize when x < 1/3, y < 1/3', function() {
        var cursor = getCursor(0.2, 0);
        expect(cursor).toEqual('sw-resize');

        cursor = getCursor(1, 0, 'left');
        expect(cursor).toEqual('sw-resize', 'with left xanchor');

        cursor = getCursor(0.3, 1, null, 'bottom');
        expect(cursor).toEqual('sw-resize', 'with bottom yanchor');
    });

    it('should return s-resize when 1/3 < x < 2/3, y < 1/3', function() {
        var cursor = getCursor(0.4, 0.3);
        expect(cursor).toEqual('s-resize');

        cursor = getCursor(0, 0, 'center');
        expect(cursor).toEqual('s-resize', 'with center xanchor');

        cursor = getCursor(0.63, 1, null, 'bottom');
        expect(cursor).toEqual('s-resize', 'with bottom yanchor');
    });

    it('should return se-resize when x > 2/3, y < 1/3', function() {
        var cursor = getCursor(0.9, 0.1);
        expect(cursor).toEqual('se-resize');

        cursor = getCursor(0, 0, 'right');
        expect(cursor).toEqual('se-resize', 'with right xanchor');

        cursor = getCursor(0.63, 1, null, 'bottom');
        expect(cursor).toEqual('s-resize', 'with bottom yanchor');
    });

    it('should return w-resize when x < 1/3, 1/3 < y < 2/3', function() {
        var cursor = getCursor(0.1, 0.4);
        expect(cursor).toEqual('w-resize');

        cursor = getCursor(0.9, 0.5, 'left');
        expect(cursor).toEqual('w-resize', 'with left xanchor');

        cursor = getCursor(0.1, 0.1, null, 'middle');
        expect(cursor).toEqual('w-resize', 'with middle yanchor');
    });

    it('should return move when 1/3 < x < 2/3, 1/3 < y < 2/3', function() {
        var cursor = getCursor(0.4, 0.4);
        expect(cursor).toEqual('move');

        cursor = getCursor(0.9, 0.5, 'center');
        expect(cursor).toEqual('move', 'with center xanchor');

        cursor = getCursor(0.4, 0.1, null, 'middle');
        expect(cursor).toEqual('move', 'with middle yanchor');
    });

    it('should return e-resize when x > 1/3, 1/3 < y < 2/3', function() {
        var cursor = getCursor(0.8, 0.4);
        expect(cursor).toEqual('e-resize');

        cursor = getCursor(0.09, 0.5, 'right');
        expect(cursor).toEqual('e-resize', 'with right xanchor');

        cursor = getCursor(0.9, 0.1, null, 'middle');
        expect(cursor).toEqual('e-resize', 'with middle yanchor');
    });

    it('should return nw-resize when x > 1/3, y > 2/3', function() {
        var cursor = getCursor(0.2, 0.7);
        expect(cursor).toEqual('nw-resize');

        cursor = getCursor(0.9, 0.9, 'left');
        expect(cursor).toEqual('nw-resize', 'with left xanchor');

        cursor = getCursor(0.1, 0.1, null, 'top');
        expect(cursor).toEqual('nw-resize', 'with top yanchor');
    });

    it('should return nw-resize when 1/3 < x < 2/3, y > 2/3', function() {
        var cursor = getCursor(0.4, 0.7);
        expect(cursor).toEqual('n-resize');

        cursor = getCursor(0.9, 0.9, 'center');
        expect(cursor).toEqual('n-resize', 'with center xanchor');

        cursor = getCursor(0.5, 0.1, null, 'top');
        expect(cursor).toEqual('n-resize', 'with top yanchor');
    });

    it('should return nw-resize when x > 2/3, y > 2/3', function() {
        var cursor = getCursor(0.7, 0.7);
        expect(cursor).toEqual('ne-resize');

        cursor = getCursor(0.09, 0.9, 'right');
        expect(cursor).toEqual('ne-resize', 'with right xanchor');

        cursor = getCursor(0.8, 0.1, null, 'top');
        expect(cursor).toEqual('ne-resize', 'with top yanchor');
    });
});

describe('dragElement.align', function() {
    'use strict';

    var align = dragElement.align;

    it('should return min value if anchor is set to \'bottom\' or \'left\'', function() {
        var al = align(0, 1, 0, 1, 'bottom');
        expect(al).toEqual(0);

        al = align(0, 1, 0, 1, 'left');
        expect(al).toEqual(0);
    });

    it('should return max value if anchor is set to \'top\' or \'right\'', function() {
        var al = align(0, 1, 0, 1, 'top');
        expect(al).toEqual(1);

        al = align(0, 1, 0, 1, 'right');
        expect(al).toEqual(1);
    });

    it('should return center value if anchor is set to \'middle\' or \'center\'', function() {
        var al = align(0, 1, 0, 1, 'middle');
        expect(al).toEqual(0.5);

        al = align(0, 1, 0, 1, 'center');
        expect(al).toEqual(0.5);
    });

    it('should return center value if anchor is set to \'middle\' or \'center\'', function() {
        var al = align(0, 1, 0, 1, 'middle');
        expect(al).toEqual(0.5);

        al = align(0, 1, 0, 1, 'center');
        expect(al).toEqual(0.5);
    });

    it('should return min value ', function() {
        var al = align(0, 1, 0, 1);
        expect(al).toEqual(0);
    });

    it('should return max value ', function() {
        var al = align(1, 1, 0, 1);
        expect(al).toEqual(2);
    });
});
