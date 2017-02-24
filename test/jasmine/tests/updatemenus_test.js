var UpdateMenus = require('@src/components/updatemenus');
var constants = require('@src/components/updatemenus/constants');

var d3 = require('d3');
var Plotly = require('@lib');
var Lib = require('@src/lib');
var Events = require('@src/lib/events');
var Drawing = require('@src/components/drawing');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var TRANSITION_DELAY = 100;
var fail = require('../assets/fail_test');
var getBBox = require('../assets/get_bbox');

describe('update menus defaults', function() {
    'use strict';

    var supply = UpdateMenus.supplyLayoutDefaults;

    var layoutIn, layoutOut;

    beforeEach(function() {
        layoutIn = {};
        layoutOut = {};
    });

    it('should skip non-array containers', function() {
        [null, undefined, {}, 'str', 0, false, true].forEach(function(cont) {
            var msg = '- ' + JSON.stringify(cont);

            layoutIn = { updatemenus: cont };
            layoutOut = {};
            supply(layoutIn, layoutOut);

            expect(layoutIn.updatemenus).toBe(cont, msg);
            expect(layoutOut.updatemenus).toEqual([], msg);
        });
    });

    it('should make non-object item visible: false', function() {
        var updatemenus = [null, undefined, [], 'str', 0, false, true];

        layoutIn = { updatemenus: updatemenus };
        layoutOut = {};
        supply(layoutIn, layoutOut);

        expect(layoutIn.updatemenus).toEqual(updatemenus);

        layoutOut.updatemenus.forEach(function(item, i) {
            expect(item).toEqual({
                visible: false,
                buttons: [],
                _input: {},
                _index: i
            });
        });
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

        // bump event max listeners to remove console warnings
        Events.init(gd);
        gd._internalEv.setMaxListeners(20);

        // move update menu #2 to click on them separately
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.updatemenus[1].x = 1;

        allMenus = mockCopy.layout.updatemenus;
        buttonMenus = allMenus.filter(function(opts) { return opts.type === 'buttons'; });
        dropdownMenus = allMenus.filter(function(opts) { return opts.type !== 'buttons'; });

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
        buttonMenus.forEach(function(menu) { buttonCount += menu.buttons.length; });

        assertNodeCount('.' + constants.buttonClassName, buttonCount);

        done();
    });

    function assertNodeCount(query, cnt) {
        expect(d3.selectAll(query).size()).toEqual(cnt);
    }
});

describe('update menus initialization', function() {
    'use strict';
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.plot(gd, [{x: [1, 2, 3]}], {
            updatemenus: [{
                buttons: [
                    {method: 'restyle', args: [], label: 'first'},
                    {method: 'restyle', args: [], label: 'second'},
                ]
            }]
        }).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('does not set active on initial plot', function() {
        expect(gd.layout.updatemenus[0].active).toBeUndefined();
    });
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
        var initialUM1 = Lib.extendDeep({}, gd.layout.updatemenus[1]);
        assertMenus([0, 0]);
        expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeDefined();
        expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeDefined();

        Plotly.relayout(gd, 'updatemenus[0].visible', false).then(function() {
            assertMenus([0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeDefined();

            return Plotly.relayout(gd, 'updatemenus[1]', null);
        })
        .then(function() {
            assertNodeCount('.' + constants.containerClassName, 0);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeUndefined();

            return Plotly.relayout(gd, {
                'updatemenus[0].visible': true,
                'updatemenus[1]': initialUM1
            });
        })
        .then(function() {
            assertMenus([0, 0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeDefined();

            return Plotly.relayout(gd, {
                'updatemenus[0].visible': false,
                'updatemenus[1].visible': false
            });
        })
        .then(function() {
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
        })
        .then(function() {
            assertMenus([0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-2']).toBeDefined();

            return Plotly.relayout(gd, 'updatemenus[0].visible', true);
        })
        .then(function() {
            assertMenus([0, 0]);
            expect(gd._fullLayout._pushmargin['updatemenu-0']).toBeDefined();
            expect(gd._fullLayout._pushmargin['updatemenu-1']).toBeUndefined();
            expect(gd._fullLayout._pushmargin['updatemenu-2']).toBeDefined();
            expect(gd.layout.updatemenus.length).toEqual(3);

            return Plotly.relayout(gd, 'updatemenus[0]', null);
        })
        .then(function() {
            assertMenus([0]);
            expect(gd.layout.updatemenus.length).toEqual(2);

            return Plotly.relayout(gd, 'updatemenus', null);
        })
        .then(function() {
            expect(gd.layout.updatemenus).toBeUndefined();

        })
        .then(done);
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

    it('should emit an event on button click', function(done) {
        var clickCnt = 0;
        var data = [];
        gd.on('plotly_buttonclicked', function(datum) {
            data.push(datum);
            clickCnt++;
        });

        click(selectHeader(0)).then(function() {
            expect(clickCnt).toEqual(0);

            return click(selectButton(2));
        }).then(function() {
            expect(clickCnt).toEqual(1);
            expect(data.length).toEqual(1);
            expect(data[0].active).toEqual(2);

            return click(selectButton(1));
        }).then(function() {
            expect(clickCnt).toEqual(2);
            expect(data.length).toEqual(2);
            expect(data[1].active).toEqual(1);
        }).catch(fail).then(done);
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

    it('should update correctly on failed binding comparisons', function(done) {

        // See https://github.com/plotly/plotly.js/issues/1169
        // for more info.

        var data = [{
            y: [1, 2, 3],
            visible: true
        }, {
            y: [2, 3, 1],
            visible: false
        }, {
            y: [3, 1, 2],
            visible: false
        }];

        var layout = {
            updatemenus: [{
                buttons: [{
                    label: 'a',
                    method: 'restyle',
                    args: ['visible', [true, false, false]]
                }, {
                    label: 'b',
                    method: 'restyle',
                    args: ['visible', [false, true, false]]
                }, {
                    label: 'c',
                    method: 'restyle',
                    args: ['visible', [false, false, true]]
                }]
            }]
        };

        Plotly.newPlot(gd, data, layout).then(function() {
            return click(selectHeader(0));
        })
        .then(function() {
            return click(selectButton(1));
        })
        .then(function() {
            assertActive(gd, [1]);
        })
        .then(done);
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

    it('applies y padding on relayout', function(done) {
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
        expect(d3.selectAll(query).size()).toEqual(cnt, query);
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
        expect(Math.abs(actualWidth - width)).toBeLessThan(16);

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


describe('update menus interaction with other components:', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('buttons show be drawn above sliders', function(done) {

        Plotly.plot(createGraphDiv(), [{
            x: [1, 2, 3],
            y: [1, 2, 1]
        }], {
            sliders: [{
                xanchor: 'right',
                x: -0.05,
                y: 0.9,
                len: 0.3,
                steps: [{
                    label: 'red',
                    method: 'restyle',
                    args: [{'line.color': 'red'}]
                }, {
                    label: 'orange',
                    method: 'restyle',
                    args: [{'line.color': 'orange'}]
                }, {
                    label: 'yellow',
                    method: 'restyle',
                    args: [{'line.color': 'yellow'}]
                }]
            }],
            updatemenus: [{
                buttons: [{
                    label: 'markers and lines',
                    method: 'restyle',
                    args: [{ 'mode': 'markers+lines' }]
                }, {
                    label: 'markers',
                    method: 'restyle',
                    args: [{ 'mode': 'markers' }]
                }, {
                    label: 'lines',
                    method: 'restyle',
                    args: [{ 'mode': 'lines' }]
                }]
            }]
        })
        .then(function() {
            var infoLayer = d3.select('g.infolayer');
            var containerClassNames = ['slider-container', 'updatemenu-container'];
            var list = [];

            infoLayer.selectAll('*').each(function() {
                var className = d3.select(this).attr('class');

                if(containerClassNames.indexOf(className) !== -1) {
                    list.push(className);
                }
            });

            expect(list).toEqual(containerClassNames);
        })
        .then(done);
    });
});


describe('update menus interaction with scrollbox:', function() {
    'use strict';

    var gd,
        mock,
        menuDown,
        menuLeft,
        menuRight,
        menuUp;

    // Adapted from https://github.com/plotly/plotly.js/pull/770#issuecomment-234669383
    mock = {
        data: [],
        layout: {
            width: 1100,
            height: 450,
            updatemenus: [{
                buttons: [{
                    method: 'restyle',
                    args: ['line.color', 'red'],
                    label: 'red'
                }, {
                    method: 'restyle',
                    args: ['line.color', 'blue'],
                    label: 'blue'
                }, {
                    method: 'restyle',
                    args: ['line.color', 'green'],
                    label: 'green'
                }]
            }, {
                x: 0.5,
                xanchor: 'left',
                y: 0.5,
                yanchor: 'top',
                direction: 'down',
                buttons: []
            }, {
                x: 0.5,
                xanchor: 'right',
                y: 0.5,
                yanchor: 'top',
                direction: 'left',
                buttons: []
            }, {
                x: 0.5,
                xanchor: 'left',
                y: 0.5,
                yanchor: 'bottom',
                direction: 'right',
                buttons: []
            }, {
                x: 0.5,
                xanchor: 'right',
                y: 0.5,
                yanchor: 'bottom',
                direction: 'up',
                buttons: []
            }]
        }
    };

    for(var i = 0, n = 20; i < n; i++) {
        var j;

        var y;
        for(j = 0, y = []; j < 10; j++) y.push(Math.random);

        mock.data.push({
            y: y,
            line: {
                shape: 'spline',
                color: 'red'
            },
            visible: i === 0,
            name: 'Data set ' + i,
        });

        var visible;
        for(j = 0, visible = []; j < n; j++) visible.push(i === j);

        for(j = 1; j <= 4; j++) {
            mock.layout.updatemenus[j].buttons.push({
                method: 'restyle',
                args: ['visible', visible],
                label: 'Data set ' + i
            });
        }
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            var menus = document.getElementsByClassName('updatemenu-header');

            expect(menus.length).toBe(5);

            menuDown = menus[1];
            menuLeft = menus[2];
            menuRight = menus[3];
            menuUp = menus[4];
        }).catch(fail).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('scrollbox can be dragged', function() {
        var deltaX = -50,
            deltaY = -100,
            scrollBox,
            scrollBar,
            scrollBoxTranslate0,
            scrollBarTranslate0,
            scrollBoxTranslate1,
            scrollBarTranslate1;

        scrollBox = getScrollBox();
        expect(scrollBox).toBeDefined();

        // down menu
        click(menuDown);

        scrollBar = getVerticalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        dragScrollBox(scrollBox, 0, deltaY);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.y).toEqual(scrollBoxTranslate0.y + deltaY);
        expect(scrollBarTranslate1.y).toBeGreaterThan(scrollBarTranslate0.y);

        // left menu
        click(menuLeft);

        scrollBar = getHorizontalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        dragScrollBox(scrollBox, deltaX, 0);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.x).toEqual(scrollBoxTranslate0.x + deltaX);
        expect(scrollBarTranslate1.x).toBeGreaterThan(scrollBarTranslate0.x);

        // right menu
        click(menuRight);

        scrollBar = getHorizontalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        dragScrollBox(scrollBox, deltaX, 0);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.x).toEqual(scrollBoxTranslate0.x + deltaX);
        expect(scrollBarTranslate1.x).toBeGreaterThan(scrollBarTranslate0.x);

        // up menu
        click(menuUp);

        scrollBar = getVerticalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        dragScrollBox(scrollBox, 0, deltaY);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.y).toEqual(scrollBoxTranslate0.y + deltaY);
        expect(scrollBarTranslate1.y).toBeGreaterThan(scrollBarTranslate0.y);
    });

    it('scrollbox handles wheel events', function() {
        var deltaY = 100,
            scrollBox,
            scrollBar,
            scrollBoxTranslate0,
            scrollBarTranslate0,
            scrollBoxTranslate1,
            scrollBarTranslate1;

        scrollBox = getScrollBox();
        expect(scrollBox).toBeDefined();

        // down menu
        click(menuDown);

        scrollBar = getVerticalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        wheel(scrollBox, deltaY);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.y).toEqual(scrollBoxTranslate0.y - deltaY);
        expect(scrollBarTranslate1.y).toBeGreaterThan(scrollBarTranslate0.y);

        // left menu
        click(menuLeft);

        scrollBar = getHorizontalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        wheel(scrollBox, deltaY);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.x).toEqual(scrollBoxTranslate0.x - deltaY);
        expect(scrollBarTranslate1.x).toBeGreaterThan(scrollBarTranslate0.x);

        // right menu
        click(menuRight);

        scrollBar = getHorizontalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        wheel(scrollBox, deltaY);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.x).toEqual(scrollBoxTranslate0.x - deltaY);
        expect(scrollBarTranslate1.x).toBeGreaterThan(scrollBarTranslate0.x);

        // up menu
        click(menuUp);

        scrollBar = getVerticalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxTranslate0 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate0 = Drawing.getTranslate(scrollBar);
        wheel(scrollBox, deltaY);
        scrollBoxTranslate1 = Drawing.getTranslate(scrollBox);
        scrollBarTranslate1 = Drawing.getTranslate(scrollBar);

        expect(scrollBoxTranslate1.y).toEqual(scrollBoxTranslate0.y - deltaY);
        expect(scrollBarTranslate1.y).toBeGreaterThan(scrollBarTranslate0.y);
    });

    it('scrollbar can be dragged', function() {
        var deltaX = 20,
            deltaY = 10,
            scrollBox,
            scrollBar,
            scrollBoxPosition0,
            scrollBarPosition0,
            scrollBoxPosition1,
            scrollBarPosition1;

        scrollBox = getScrollBox();
        expect(scrollBox).toBeDefined();

        // down menu
        click(menuDown);

        scrollBar = getVerticalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxPosition0 = Drawing.getTranslate(scrollBox);
        scrollBarPosition0 = getScrollBarCenter(scrollBox, scrollBar);
        dragScrollBar(scrollBar, scrollBarPosition0, 0, deltaY);
        scrollBoxPosition1 = Drawing.getTranslate(scrollBox);
        scrollBarPosition1 = getScrollBarCenter(scrollBox, scrollBar);

        expect(scrollBoxPosition1.y).toBeLessThan(scrollBoxPosition0.y);
        expect(scrollBarPosition1.y).toEqual(scrollBarPosition0.y + deltaY);

        // left menu
        click(menuLeft);

        scrollBar = getHorizontalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxPosition0 = Drawing.getTranslate(scrollBox);
        scrollBarPosition0 = getScrollBarCenter(scrollBox, scrollBar);
        dragScrollBar(scrollBar, scrollBarPosition0, deltaX, 0);
        scrollBoxPosition1 = Drawing.getTranslate(scrollBox);
        scrollBarPosition1 = getScrollBarCenter(scrollBox, scrollBar);

        expect(scrollBoxPosition1.x).toBeLessThan(scrollBoxPosition0.x);
        expect(scrollBarPosition1.x).toEqual(scrollBarPosition0.x + deltaX);

        // right menu
        click(menuRight);

        scrollBar = getHorizontalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxPosition0 = Drawing.getTranslate(scrollBox);
        scrollBarPosition0 = getScrollBarCenter(scrollBox, scrollBar);
        dragScrollBar(scrollBar, scrollBarPosition0, deltaX, 0);
        scrollBoxPosition1 = Drawing.getTranslate(scrollBox);
        scrollBarPosition1 = getScrollBarCenter(scrollBox, scrollBar);

        expect(scrollBoxPosition1.x).toBeLessThan(scrollBoxPosition0.x);
        expect(scrollBarPosition1.x).toEqual(scrollBarPosition0.x + deltaX);

        // up menu
        click(menuUp);

        scrollBar = getVerticalScrollBar();
        expect(scrollBar).toBeDefined();

        scrollBoxPosition0 = Drawing.getTranslate(scrollBox);
        scrollBarPosition0 = getScrollBarCenter(scrollBox, scrollBar);
        dragScrollBar(scrollBar, scrollBarPosition0, 0, deltaY);
        scrollBoxPosition1 = Drawing.getTranslate(scrollBox);
        scrollBarPosition1 = getScrollBarCenter(scrollBox, scrollBar);

        expect(scrollBoxPosition1.y).toBeLessThan(scrollBoxPosition0.y);
        expect(scrollBarPosition1.y).toEqual(scrollBarPosition0.y + deltaY);
    });

    function getScrollBox() {
        return document.getElementsByClassName('updatemenu-dropdown-button-group')[0];
    }

    function getHorizontalScrollBar() {
        return document.getElementsByClassName('scrollbar-horizontal')[0];
    }

    function getVerticalScrollBar() {
        return document.getElementsByClassName('scrollbar-vertical')[0];
    }

    function getCenter(node) {
        var bbox = getBBox(node),
            x = bbox.x + 0.5 * bbox.width,
            y = bbox.y + 0.5 * bbox.height;

        return { x: x, y: y };
    }

    function getScrollBarCenter(scrollBox, scrollBar) {
        var scrollBoxTranslate = Drawing.getTranslate(scrollBox),
            scrollBarTranslate = Drawing.getTranslate(scrollBar),
            translateX = scrollBoxTranslate.x + scrollBarTranslate.x,
            translateY = scrollBoxTranslate.y + scrollBarTranslate.y,
            center = getCenter(scrollBar),
            x = center.x + translateX,
            y = center.y + translateY;

        return { x: x, y: y };
    }

    function click(node) {
        node.dispatchEvent(new MouseEvent('click'), {
            bubbles: true
        });
    }

    function drag(node, x, y, deltaX, deltaY) {
        node.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            clientX: x,
            clientY: y
        }));
        node.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true,
            clientX: x + deltaX,
            clientY: y + deltaY
        }));
    }

    function dragScrollBox(node, deltaX, deltaY) {
        var position = getCenter(node);

        drag(node, position.x, position.y, deltaX, deltaY);
    }

    function dragScrollBar(node, position, deltaX, deltaY) {
        drag(node, position.x, position.y, deltaX, deltaY);
    }

    function wheel(node, deltaY) {
        node.dispatchEvent(new WheelEvent('wheel', {
            bubbles: true,
            deltaY: deltaY
        }));
    }
});
