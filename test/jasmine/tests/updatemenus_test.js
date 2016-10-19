var UpdateMenus = require('@src/components/updatemenus');
var constants = require('@src/components/updatemenus/constants');

var d3 = require('d3');
var Plotly = require('@lib');
var Lib = require('@src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var TRANSITION_DELAY = 100;
var fail = require('../assets/fail_test');

describe('update menus defaults', function() {
    'use strict';

    var supply = UpdateMenus.supplyLayoutDefaults;

    var layoutIn, layoutOut;

    beforeEach(function() {
        layoutIn = {};
        layoutOut = {};
    });

    it('should set \'visible\' to false when no buttons are present', function() {
        layoutIn.updatemenus = [{
            buttons: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }, {
                method: 'update',
                args: [ { 'marker.size': 20 }, { 'xaxis.range': [0, 10] }, [0, 1] ]
            }, {
                method: 'animate',
                args: [ 'frame1', { transition: { duration: 500, ease: 'cubic-in-out' }}]
            }]
        }, {
            bgcolor: 'red'
        }, {
            visible: false,
            buttons: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0].visible).toBe(true);
        expect(layoutOut.updatemenus[0].active).toEqual(0);
        expect(layoutOut.updatemenus[0].buttons[0].args.length).toEqual(2);
        expect(layoutOut.updatemenus[0].buttons[1].args.length).toEqual(3);
        expect(layoutOut.updatemenus[0].buttons[2].args.length).toEqual(2);

        expect(layoutOut.updatemenus[1].visible).toBe(false);
        expect(layoutOut.updatemenus[1].active).toBeUndefined();

        expect(layoutOut.updatemenus[2].visible).toBe(false);
        expect(layoutOut.updatemenus[2].active).toBeUndefined();
    });

    it('should skip over non-object buttons', function() {
        layoutIn.updatemenus = [{
            buttons: [
                null,
                {
                    method: 'relayout',
                    args: ['title', 'Hello World']
                },
                'remove'
            ]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0].buttons.length).toEqual(1);
        expect(layoutOut.updatemenus[0].buttons[0]).toEqual({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: '',
            _index: 1
        });
    });

    it('should skip over buttons with array \'args\' field', function() {
        layoutIn.updatemenus = [{
            buttons: [{
                method: 'restyle',
            }, {
                method: 'relayout',
                args: ['title', 'Hello World']
            }, {
                method: 'relayout',
                args: null
            }, {}]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0].buttons.length).toEqual(1);
        expect(layoutOut.updatemenus[0].buttons[0]).toEqual({
            method: 'relayout',
            args: ['title', 'Hello World'],
            label: '',
            _index: 1
        });
    });

    it('should keep ref to input update menu container', function() {
        layoutIn.updatemenus = [{
            buttons: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }, {
            bgcolor: 'red'
        }, {
            visible: false,
            buttons: [{
                method: 'relayout',
                args: ['title', 'Hello World']
            }]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0]._input).toBe(layoutIn.updatemenus[0]);
        expect(layoutOut.updatemenus[1]._input).toBe(layoutIn.updatemenus[1]);
        expect(layoutOut.updatemenus[2]._input).toBe(layoutIn.updatemenus[2]);
    });

    it('should default \'bgcolor\' to layout \'paper_bgcolor\'', function() {
        var buttons = [{
            method: 'relayout',
            args: ['title', 'Hello World']
        }];

        layoutIn.updatemenus = [{
            buttons: buttons,
        }, {
            bgcolor: 'red',
            buttons: buttons
        }];

        layoutOut.paper_bgcolor = 'blue';

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0].bgcolor).toEqual('blue');
        expect(layoutOut.updatemenus[1].bgcolor).toEqual('red');
    });

    it('should default \'type\' to \'dropdown\'', function() {
        layoutIn.updatemenus = [{
            buttons: [{method: 'relayout', args: ['title', 'Hello World']}]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0].type).toEqual('dropdown');
    });

    it('should default \'direction\' to \'down\'', function() {
        layoutIn.updatemenus = [{
            buttons: [{method: 'relayout', args: ['title', 'Hello World']}]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0].direction).toEqual('down');
    });

    it('should default \'showactive\' to true', function() {
        layoutIn.updatemenus = [{
            buttons: [{method: 'relayout', args: ['title', 'Hello World']}]
        }];

        supply(layoutIn, layoutOut);

        expect(layoutOut.updatemenus[0].showactive).toEqual(true);
    });
});

describe('update menus buttons', function() {
    var mock = require('@mocks/updatemenus_positioning.json');
    var gd;
    var allMenus, buttonMenus, dropdownMenus;

    beforeEach(function(done) {
        gd = createGraphDiv();

        // move update menu #2 to click on them separately
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.updatemenus[1].x = 1;

        allMenus = mockCopy.layout.updatemenus;
        buttonMenus = allMenus.filter(function(opts) {return opts.type === 'buttons';});
        dropdownMenus = allMenus.filter(function(opts) {return opts.type !== 'buttons';});

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('creates button menus', function(done) {
        assertNodeCount('.' + constants.containerClassName, 1);

        // 12 menus, but button menus don't have headers, so there are only six headers:
        assertNodeCount('.' + constants.headerClassName, dropdownMenus.length);

        // Count the *total* number of buttons we expect for this mock:
        var buttonCount = 0;
        buttonMenus.forEach(function(menu) {buttonCount += menu.buttons.length;});

        assertNodeCount('.' + constants.buttonClassName, buttonCount);

        done();

    });

    function assertNodeCount(query, cnt) {
        expect(d3.selectAll(query).size()).toEqual(cnt);
    }
});

describe('update menus interactions', function() {
    'use strict';

    var mock = require('@mocks/updatemenus.json'),
        bgColor = 'rgb(255, 255, 255)',
        activeColor = 'rgb(244, 250, 255)';

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        // move update menu #2 to click on them separately
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.updatemenus[1].x = 1;

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should draw only visible menus', function(done) {
        assertMenus([0, 0]);
        expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeDefined();
        expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeDefined();

        Plotly.relayout(gd, 'updatemenus[0].visible', false).then(function() {
            assertMenus([0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeDefined();

            return Plotly.relayout(gd, 'updatemenus[1]', null);
        }).then(function() {
            assertNodeCount('.' + constants.containerClassName, 0);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeUndefined();

            return Plotly.relayout(gd, {
                'updatemenus[0].visible': true,
                'updatemenus[1].visible': true
            });
        }).then(function() {
            assertMenus([0, 0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeDefined();

            return Plotly.relayout(gd, {
                'updatemenus[0].visible': false,
                'updatemenus[1].visible': false
            });
        }).then(function() {
            assertNodeCount('.' + constants.containerClassName, 0);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeUndefined();

            return Plotly.relayout(gd, {
                'updatemenus[2]': {
                    buttons: [{
                        method: 'relayout',
                        args: ['title', 'new title']
                    }]
                }
            });
        }).then(function() {
            assertMenus([0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-2']).toBeDefined();

            return Plotly.relayout(gd, 'updatemenus[0].visible', true);
        }).then(function() {
            assertMenus([0, 0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-2']).toBeDefined();

            done();
        });
    });

    it('should drop/fold buttons when clicking on header', function(done) {
        var header0 = selectHeader(0),
            header1 = selectHeader(1);

        click(header0).then(function() {
            assertMenus([3, 0]);
            return click(header0);
        }).then(function() {
            assertMenus([0, 0]);
            return click(header1);
        }).then(function() {
            assertMenus([0, 4]);
            return click(header1);
        }).then(function() {
            assertMenus([0, 0]);
            return click(header0);
        }).then(function() {
            assertMenus([3, 0]);
            return click(header1);
        }).then(function() {
            assertMenus([0, 4]);
            return click(header0);
        }).then(function() {
            assertMenus([3, 0]);
            done();
        });
    });

    it('should apply update on button click', function(done) {
        var header0 = selectHeader(0),
            header1 = selectHeader(1);

        assertActive(gd, [1, 2]);

        click(header0).then(function() {
            assertItemColor(selectButton(1), activeColor);

            return click(selectButton(0));
        }).then(function() {
            assertActive(gd, [0, 2]);

            return click(header1);
        }).then(function() {
            assertItemColor(selectButton(2), activeColor);

            return click(selectButton(0));
        }).then(function() {
            assertActive(gd, [0, 0]);

            done();
        });
    });

    it('should change color on mouse over', function(done) {
        var INDEX_0 = 2,
            INDEX_1 = gd.layout.updatemenus[1].active;

        var header0 = selectHeader(0);

        assertItemColor(header0, bgColor);
        mouseEvent('mouseover', header0);
        assertItemColor(header0, activeColor);
        mouseEvent('mouseout', header0);
        assertItemColor(header0, bgColor);

        click(header0).then(function() {
            var button = selectButton(INDEX_0);

            assertItemColor(button, bgColor);
            mouseEvent('mouseover', button);
            assertItemColor(button, activeColor);
            mouseEvent('mouseout', button);
            assertItemColor(button, bgColor);

            return click(selectHeader(1));
        }).then(function() {
            var button = selectButton(INDEX_1);

            assertItemColor(button, activeColor);
            mouseEvent('mouseover', button);
            assertItemColor(button, activeColor);
            mouseEvent('mouseout', button);
            assertItemColor(button, activeColor);

            done();
        });
    });

    it('should relayout', function(done) {
        assertItemColor(selectHeader(0), 'rgb(255, 255, 255)');
        assertItemDims(selectHeader(1), 95, 33);

        Plotly.relayout(gd, 'updatemenus[0].bgcolor', 'red').then(function() {
            assertItemColor(selectHeader(0), 'rgb(255, 0, 0)');

            return click(selectHeader(0));
        }).then(function() {
            assertMenus([3, 0]);

            return Plotly.relayout(gd, 'updatemenus[0].bgcolor', 'blue');
        }).then(function() {
            // and keep menu dropped
            assertMenus([3, 0]);
            assertItemColor(selectHeader(0), 'rgb(0, 0, 255)');

            return Plotly.relayout(gd, 'updatemenus[1].buttons[1].label', 'a looooooooooooong<br>label');
        }).then(function() {
            assertItemDims(selectHeader(1), 179, 35);

            return click(selectHeader(1));
        }).then(function() {
            assertMenus([0, 4]);

            return Plotly.relayout(gd, 'updatemenus[1].visible', false);
        }).then(function() {
            // and delete buttons
            assertMenus([0]);

            return click(selectHeader(0));
        }).then(function() {
            assertMenus([3]);

            return Plotly.relayout(gd, 'updatemenus[1].visible', true);
        }).then(function() {
            // fold up buttons whenever new menus are added
            assertMenus([0, 0]);

            return Plotly.relayout(gd, {
                'updatemenus[0].bgcolor': null,
                'paper_bgcolor': 'black'
            });
        }).then(function() {
            assertItemColor(selectHeader(0), 'rgb(0, 0, 0)');
            assertItemColor(selectHeader(1), 'rgb(0, 0, 0)');

            done();
        });
    });

    it('applies padding on all sides', function(done) {
        var xy1, xy2;
        var firstMenu = d3.select('.' + constants.headerGroupClassName);
        var xpad = 80;
        var ypad = 60;

        // Position it center-anchored and in the middle of the plot:
        Plotly.relayout(gd, {
            'updatemenus[0].x': 0.2,
            'updatemenus[0].y': 0.5,
            'updatemenus[0].xanchor': 'center',
            'updatemenus[0].yanchor': 'middle',
        }).then(function() {
            // Convert to xy:
            xy1 = firstMenu.attr('transform').match(/translate\(([^,]*),\s*([^\)]*)\)/).slice(1).map(parseFloat);

            // Set three of four paddings. This should move it.
            return Plotly.relayout(gd, {
                'updatemenus[0].pad.t': ypad,
                'updatemenus[0].pad.r': xpad,
                'updatemenus[0].pad.b': ypad,
                'updatemenus[0].pad.l': xpad,
            });
        }).then(function() {
            xy2 = firstMenu.attr('transform').match(/translate\(([^,]*),\s*([^\)]*)\)/).slice(1).map(parseFloat);

            expect(xy1[0] - xy2[0]).toEqual(xpad);
            expect(xy1[1] - xy2[1]).toEqual(ypad);
        }).catch(fail).then(done);
    });

    it('appliesy padding on relayout', function(done) {
        var x1, x2;
        var firstMenu = d3.select('.' + constants.headerGroupClassName);
        var padShift = 40;

        // Position the menu in the center of the plot horizontal so that
        // we can test padding updates without worrying about margin pushing.
        Plotly.relayout(gd, {
            'updatemenus[0].x': 0.5,
            'updatemenus[0].pad.r': 0,
        }).then(function() {
            // Extract the x-component of the translation:
            x1 = parseInt(firstMenu.attr('transform').match(/translate\(([^,]*).*/)[1]);

            return Plotly.relayout(gd, 'updatemenus[0].pad.r', 40);
        }).then(function() {
            // Extract the x-component of the translation:
            x2 = parseInt(firstMenu.attr('transform').match(/translate\(([^,]*).*/)[1]);

            expect(x1 - x2).toBeCloseTo(padShift, 1);
        }).catch(fail).then(done);
    });

    function assertNodeCount(query, cnt) {
        expect(d3.selectAll(query).size()).toEqual(cnt);
    }

    // call assertMenus([0, 3]); to check that the 2nd update menu is dropped
    // and showing 3 buttons.
    function assertMenus(expectedMenus) {
        assertNodeCount('.' + constants.containerClassName, 1);
        assertNodeCount('.' + constants.headerClassName, expectedMenus.length);

        var gButton = d3.select('.' + constants.dropdownButtonGroupClassName),
            actualActiveIndex = +gButton.attr(constants.menuIndexAttrName),
            hasActive = false;

        expectedMenus.forEach(function(expected, i) {
            if(expected) {
                expect(actualActiveIndex).toEqual(i);
                assertNodeCount('.' + constants.dropdownButtonClassName, expected);
                hasActive = true;
            }
        });

        if(!hasActive) {
            expect(actualActiveIndex).toEqual(-1);
            assertNodeCount('.' + constants.dropdownButtonClassName, 0);
        }
    }

    function assertActive(gd, expectedMenus) {
        expectedMenus.forEach(function(expected, i) {
            expect(gd.layout.updatemenus[i].active).toEqual(expected);
            expect(gd._fullLayout.updatemenus[i].active).toEqual(expected);
        });
    }

    function assertItemColor(node, color) {
        var rect = node.select('rect');
        expect(rect.style('fill')).toEqual(color);
    }

    function assertItemDims(node, width, height) {
        var rect = node.select('rect'),
            actualWidth = +rect.attr('width');

        // must compare with a tolerance as the exact result
        // is browser/font dependent (via getBBox)
        expect(Math.abs(actualWidth - width)).toBeLessThan(11);

        // height is determined by 'fontsize',
        // so no such tolerance is needed
        expect(+rect.attr('height')).toEqual(height);
    }

    function click(selection) {
        return new Promise(function(resolve) {
            setTimeout(function() {
                mouseEvent('click', selection);
                resolve();
            }, TRANSITION_DELAY);
        });
    }

    // For some reason, ../assets/mouse_event.js fails
    // to detect the button elements in FF38 (like on CircleCI 2016/08/02),
    // so dispatch the mouse event directly about the nodes instead.
    function mouseEvent(type, selection) {
        var ev = new window.MouseEvent(type, { bubbles: true });
        selection.node().dispatchEvent(ev);
    }

    function selectHeader(menuIndex) {
        var headers = d3.selectAll('.' + constants.headerClassName),
            header = d3.select(headers[0][menuIndex]);
        return header;
    }

    function selectButton(buttonIndex) {
        var buttons = d3.selectAll('.' + constants.dropdownButtonClassName),
            button = d3.select(buttons[0][buttonIndex]);
        return button;
    }
});
