var d3 = require('d3');

var createModeBar = require('@src/components/modebar');
var manageModeBar = require('@src/components/modebar/manage');

var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var selectButton = require('../assets/modebar_button');


describe('ModeBar', function() {
    'use strict';

    function noop() {}

    function getMockContainerTree() {
        var root = document.createElement('div');
        root.className = 'plot-container';
        var parent = document.createElement('div');
        parent.className = 'svg-container';
        root.appendChild(parent);

        return parent;
    }

    function getMockGraphInfo() {
        return {
            _fullLayout: {
                dragmode: 'zoom',
                _paperdiv: d3.select(getMockContainerTree())
            },
            _fullData: [],
            _context: {
                displaylogo: true,
                displayModeBar: true,
                modeBarButtonsToRemove: [],
                modeBarButtonsToAdd: []
            }
        };
    }

    function countGroups(modeBar) {
        return d3.select(modeBar.element).selectAll('div.modebar-group')[0].length;
    }

    function countButtons(modeBar) {
        return d3.select(modeBar.element).selectAll('a.modebar-btn')[0].length;
    }

    function countLogo(modeBar) {
        return d3.select(modeBar.element).selectAll('a.plotlyjsicon')[0].length;
    }

    function checkBtnAttr(modeBar, index, attr) {
        var buttons = d3.select(modeBar.element).selectAll('a.modebar-btn');
        return d3.select(buttons[0][index]).attr(attr);
    }

    var buttons = [[{
        name: 'button 1',
        click: noop
    }, {
        name: 'button 2',
        click: noop
    }]];

    var modeBar = createModeBar(getMockGraphInfo(), buttons);

    describe('createModebar', function() {
        it('creates a mode bar', function() {
            expect(countGroups(modeBar)).toEqual(2);
            expect(countButtons(modeBar)).toEqual(3);
            expect(countLogo(modeBar)).toEqual(1);
        });

        it('throws when button config does not have name', function() {
            expect(function() {
                createModeBar(getMockGraphInfo(), [[
                    { click: function() { console.log('not gonna work'); } }
                ]]);
            }).toThrowError();
        });

        it('throws when button name is not unique', function() {
            expect(function() {
                createModeBar(getMockGraphInfo(), [[
                    { name: 'A', click: function() { console.log('not gonna'); } },
                    { name: 'A', click: function() { console.log('... work'); } }
                ]]);
            }).toThrowError();
        });

        it('throws when button config does not have a click handler', function() {
            expect(function() {
                createModeBar(getMockGraphInfo(), [[
                    { name: 'not gonna work' }
                ]]);
            }).toThrowError();
        });

        it('defaults title to name when missing', function() {
            var modeBar = createModeBar(getMockGraphInfo(), [[
                { name: 'the title too', click: noop }
            ]]);

            expect(checkBtnAttr(modeBar, 0, 'data-title')).toEqual('the title too');
        });

        it('hides title to when title is falsy but not 0', function() {
            var modeBar;

            modeBar = createModeBar(getMockGraphInfo(), [[
                { name: 'button', title: null, click: noop }
            ]]);
            expect(checkBtnAttr(modeBar, 0, 'data-title')).toBe(null);

            modeBar = createModeBar(getMockGraphInfo(), [[
                { name: 'button', title: '', click: noop }
            ]]);
            expect(checkBtnAttr(modeBar, 0, 'data-title')).toBe(null);

            modeBar = createModeBar(getMockGraphInfo(), [[
                { name: 'button', title: false, click: noop }
            ]]);
            expect(checkBtnAttr(modeBar, 0, 'data-title')).toBe(null);

            modeBar = createModeBar(getMockGraphInfo(), [[
                { name: 'button', title: 0, click: noop }
            ]]);
            expect(checkBtnAttr(modeBar, 0, 'data-title')).toEqual('0');
        });
    });

    describe('modeBar.removeAllButtons', function() {
        it('removes all mode bar buttons', function() {
            modeBar.removeAllButtons();

            expect(modeBar.element.innerHTML).toEqual('');
            expect(modeBar.hasLogo).toBe(false);
        });
    });

    describe('modeBar.destroy', function() {
        it('removes the mode bar entirely', function() {
            var modeBarParent = modeBar.element.parentNode;

            modeBar.destroy();

            expect(modeBarParent.querySelector('.modebar')).toBeNull();
        });
    });

    describe('manageModeBar', function() {

        function getButtons(list) {
            for(var i = 0; i < list.length; i++) {
                for(var j = 0; j < list[i].length; j++) {

                    // minimal button config object
                    list[i][j] = { name: list[i][j], click: noop };
                }
            }
            return list;
        }

        function checkButtons(modeBar, buttons, logos) {
            var expectedGroupCount = buttons.length + logos;
            var expectedButtonCount = logos;
            buttons.forEach(function(group) {
                expectedButtonCount += group.length;
            });

            expect(modeBar.hasButtons(buttons)).toBe(true);
            expect(countGroups(modeBar)).toEqual(expectedGroupCount);
            expect(countButtons(modeBar)).toEqual(expectedButtonCount);
            expect(countLogo(modeBar)).toEqual(1);
        }

        it('creates mode bar (unselectable cartesian version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom2d', 'pan2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasCartesian = true;
            gd._fullLayout.xaxis = {fixedrange: false};

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (selectable cartesian version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasCartesian = true;
            gd._fullLayout.xaxis = {fixedrange: false};
            gd._fullData = [{
                type: 'scatter',
                visible: true,
                mode: 'markers',
                _module: {selectPoints: true}
            }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian fixed-axes version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasCartesian = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (gl3d version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'],
                ['resetCameraDefault3d', 'resetCameraLastSave3d'],
                ['hoverClosest3d']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasGL3D = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (geo version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoomInGeo', 'zoomOutGeo', 'resetGeo'],
                ['hoverClosestGeo']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasGeo = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (gl2d version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom2d', 'pan2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['hoverClosestGl2d']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasGL2D = true;
            gd._fullLayout.xaxis = {fixedrange: false};

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (pie version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['hoverClosestPie']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasPie = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian + gl3d version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['resetViews', 'toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasCartesian = true;
            gd._fullLayout._hasGL3D = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian + geo version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['resetViews', 'toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasCartesian = true;
            gd._fullLayout._hasGeo = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian + pie version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasCartesian = true;
            gd._fullData = [{
                type: 'scatter',
                visible: true,
                mode: 'markers',
                _module: {selectPoints: true}
            }];
            gd._fullLayout.xaxis = {fixedrange: false};
            gd._fullLayout._hasPie = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (gl3d + geo version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['resetViews', 'toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasGL3D = true;
            gd._fullLayout._hasGeo = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (un-selectable ternary version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom2d', 'pan2d']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasTernary = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (selectable ternary version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasTernary = true;
            gd._fullData = [{
                type: 'scatterternary',
                visible: true,
                mode: 'markers',
                _module: {selectPoints: true}
            }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (ternary + cartesian version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['zoom2d', 'pan2d'],
                ['hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasTernary = true;
            gd._fullLayout._hasCartesian = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (ternary + gl3d version)', function() {
            var buttons = getButtons([
                ['toImage', 'sendDataToCloud'],
                ['resetViews', 'toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._hasTernary = true;
            gd._fullLayout._hasGL3D = true;

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('throws an error if modeBarButtonsToRemove isn\'t an array', function() {
            var gd = getMockGraphInfo();
            gd._context.modeBarButtonsToRemove = 'not gonna work';

            expect(function() { manageModeBar(gd); }).toThrowError();
        });

        it('throws an error if modeBarButtonsToAdd isn\'t an array', function() {
            var gd = getMockGraphInfo();
            gd._context.modeBarButtonsToAdd = 'not gonna work';

            expect(function() { manageModeBar(gd); }).toThrowError();
        });

        it('displays or not mode bar according to displayModeBar config arg', function() {
            var gd = getMockGraphInfo();
            gd._context.displayModeBar = false;

            manageModeBar(gd);
            expect(gd._fullLayout._modeBar).not.toBeDefined();
        });

        it('updates mode bar according to displayModeBar config arg', function() {
            var gd = getMockGraphInfo();
            manageModeBar(gd);
            expect(gd._fullLayout._modeBar).toBeDefined();

            gd._context.displayModeBar = false;
            manageModeBar(gd);
            expect(gd._fullLayout._modeBar).not.toBeDefined();
        });

        it('displays or not logo according to displaylogo config arg', function() {
            var gd = getMockGraphInfo();
            manageModeBar(gd);
            expect(countLogo(gd._fullLayout._modeBar)).toEqual(1);

            gd._context.displaylogo = false;
            manageModeBar(gd);
            expect(countLogo(gd._fullLayout._modeBar)).toEqual(0);
        });

        // gives 11 buttons in 5 groups by default
        function setupGraphInfo() {
            var gd = getMockGraphInfo();
            gd._fullLayout._hasCartesian = true;
            gd._fullLayout.xaxis = {fixedrange: false};
            return gd;
        }

        it('updates mode bar buttons if plot type changes', function() {
            var gd = setupGraphInfo();
            manageModeBar(gd);

            gd._fullLayout._hasCartesian = false;
            gd._fullLayout._hasGL3D = true;
            manageModeBar(gd);

            expect(countButtons(gd._fullLayout._modeBar)).toEqual(10);
        });

        it('updates mode bar buttons if modeBarButtonsToRemove changes', function() {
            var gd = setupGraphInfo();
            manageModeBar(gd);
            var initialButtonCount = countButtons(gd._fullLayout._modeBar);

            gd._context.modeBarButtonsToRemove = ['toImage', 'sendDataToCloud'];
            manageModeBar(gd);

            expect(countButtons(gd._fullLayout._modeBar))
                .toEqual(initialButtonCount - 2);
        });

        it('updates mode bar buttons if modeBarButtonsToAdd changes', function() {
            var gd = setupGraphInfo();
            manageModeBar(gd);

            var initialGroupCount = countGroups(gd._fullLayout._modeBar),
                initialButtonCount = countButtons(gd._fullLayout._modeBar);

            gd._context.modeBarButtonsToAdd = [{
                name: 'some button',
                click: noop
            }];
            manageModeBar(gd);

            expect(countGroups(gd._fullLayout._modeBar))
                .toEqual(initialGroupCount + 1);
            expect(countButtons(gd._fullLayout._modeBar))
                .toEqual(initialButtonCount + 1);
        });

        it('sets up buttons with modeBarButtonsToAdd and modeBarButtonToRemove', function() {
            var gd = setupGraphInfo();
            gd._context.modeBarButtonsToRemove = [
                'toImage', 'pan2d', 'hoverCompareCartesian'
            ];
            gd._context.modeBarButtonsToAdd = [
                { name: 'some button', click: noop },
                { name: 'some other button', click: noop }
            ];

            manageModeBar(gd);

            var modeBar = gd._fullLayout._modeBar;
            expect(countGroups(modeBar)).toEqual(6);
            expect(countButtons(modeBar)).toEqual(10);
        });

        it('sets up buttons with modeBarButtonsToAdd and modeBarButtonToRemove (2)', function() {
            var gd = setupGraphInfo();
            gd._context.modeBarButtonsToRemove = [
                'toImage', 'pan2d', 'hoverCompareCartesian'
            ];
            gd._context.modeBarButtonsToAdd = [[
                { name: 'some button', click: noop },
                { name: 'some other button', click: noop }
            ], [
                { name: 'some button 2', click: noop },
                { name: 'some other button 2', click: noop }
            ]];

            manageModeBar(gd);

            var modeBar = gd._fullLayout._modeBar;
            expect(countGroups(modeBar)).toEqual(7);
            expect(countButtons(modeBar)).toEqual(12);
        });

        it('sets up buttons with fully custom modeBarButtons', function() {
            var gd = setupGraphInfo();
            gd._context.modeBarButtons = [[
                { name: 'some button', click: noop },
                { name: 'some other button', click: noop }
            ], [
                { name: 'some button in another group', click: noop },
                { name: 'some other button in another group', click: noop }
            ]];

            manageModeBar(gd);

            var modeBar = gd._fullLayout._modeBar;
            expect(countGroups(modeBar)).toEqual(3);
            expect(countButtons(modeBar)).toEqual(5);
        });

        it('sets up buttons with custom modeBarButtons + default name', function() {
            var gd = setupGraphInfo();
            gd._context.modeBarButtons = [[
                { name: 'some button', click: noop },
                { name: 'some other button', click: noop }
            ], [
                'toImage', 'pan2d', 'hoverCompareCartesian'
            ]];

            manageModeBar(gd);

            var modeBar = gd._fullLayout._modeBar;
            expect(countGroups(modeBar)).toEqual(3);
            expect(countButtons(modeBar)).toEqual(6);
        });

        it('throw error when modeBarButtons contains invalid name', function() {
            var gd = setupGraphInfo();
            gd._context.modeBarButtons = [[
                'toImage', 'pan2d', 'no gonna work'
            ]];

            expect(function() { manageModeBar(gd); }).toThrowError();
        });

    });

    describe('modebar on clicks', function() {
        var gd, modeBar;

        afterEach(destroyGraphDiv);

        function assertRange(actual, expected) {
            var PRECISION = 2;
            expect(actual[0]).toBeCloseTo(expected[0], PRECISION);
            expect(actual[1]).toBeCloseTo(expected[1], PRECISION);
        }

        function assertActive(buttons, activeButton) {
            for(var i = 0; i < buttons.length; i++) {
                expect(buttons[i].isActive()).toBe(
                    buttons[i] === activeButton
                );
            }
        }

        describe('cartesian handlers', function() {

            beforeEach(function(done) {
                var mockData = [{
                    type: 'scatter',
                    y: [2, 1, 2]
                }, {
                    type: 'bar',
                    y: [2, 1, 2],
                    xaxis: 'x2',
                    yaxis: 'y2'
                }];

                var mockLayout = {
                    xaxis: {
                        anchor: 'y',
                        domain: [0, 0.5],
                        range: [0, 5]
                    },
                    yaxis: {
                        anchor: 'x',
                        range: [0, 3]
                    },
                    xaxis2: {
                        anchor: 'y2',
                        domain: [0.5, 1],
                        range: [-1, 4]
                    },
                    yaxis2: {
                        anchor: 'x2',
                        range: [0, 4]
                    }
                };

                gd = createGraphDiv();
                Plotly.plot(gd, mockData, mockLayout).then(function() {
                    modeBar = gd._fullLayout._modeBar;
                    done();
                });
            });

            describe('buttons zoomIn2d, zoomOut2d, autoScale2d and resetScale2d', function() {
                it('should update axis ranges', function() {
                    var buttonZoomIn = selectButton(modeBar, 'zoomIn2d'),
                        buttonZoomOut = selectButton(modeBar, 'zoomOut2d'),
                        buttonAutoScale = selectButton(modeBar, 'autoScale2d'),
                        buttonResetScale = selectButton(modeBar, 'resetScale2d');

                    assertRange(gd._fullLayout.xaxis.range, [0, 5]);
                    assertRange(gd._fullLayout.yaxis.range, [0, 3]);
                    assertRange(gd._fullLayout.xaxis2.range, [-1, 4]);
                    assertRange(gd._fullLayout.yaxis2.range, [0, 4]);

                    buttonZoomIn.click();
                    assertRange(gd._fullLayout.xaxis.range, [1.25, 3.75]);
                    assertRange(gd._fullLayout.yaxis.range, [0.75, 2.25]);
                    assertRange(gd._fullLayout.xaxis2.range, [0.25, 2.75]);
                    assertRange(gd._fullLayout.yaxis2.range, [1, 3]);

                    buttonZoomOut.click();
                    assertRange(gd._fullLayout.xaxis.range, [0, 5]);
                    assertRange(gd._fullLayout.yaxis.range, [0, 3]);
                    assertRange(gd._fullLayout.xaxis2.range, [-1, 4]);
                    assertRange(gd._fullLayout.yaxis2.range, [0, 4]);

                    buttonZoomIn.click();
                    buttonAutoScale.click();
                    assertRange(gd._fullLayout.xaxis.range, [-0.1375913, 2.137591]);
                    assertRange(gd._fullLayout.yaxis.range, [0.92675159, 2.073248]);
                    assertRange(gd._fullLayout.xaxis2.range, [-0.5, 2.5]);
                    assertRange(gd._fullLayout.yaxis2.range, [0, 2.105263]);

                    buttonResetScale.click();
                    assertRange(gd._fullLayout.xaxis.range, [0, 5]);
                    assertRange(gd._fullLayout.yaxis.range, [0, 3]);
                    assertRange(gd._fullLayout.xaxis2.range, [-1, 4]);
                    assertRange(gd._fullLayout.yaxis2.range, [0, 4]);
                });
            });

            describe('buttons zoom2d, pan2d, select2d and lasso2d', function() {
                it('should update the layout dragmode', function() {
                    var zoom2d = selectButton(modeBar, 'zoom2d'),
                        pan2d = selectButton(modeBar, 'pan2d'),
                        select2d = selectButton(modeBar, 'select2d'),
                        lasso2d = selectButton(modeBar, 'lasso2d'),
                        buttons = [zoom2d, pan2d, select2d, lasso2d];

                    expect(gd._fullLayout.dragmode).toBe('zoom');
                    assertActive(buttons, zoom2d);

                    pan2d.click();
                    expect(gd._fullLayout.dragmode).toBe('pan');
                    assertActive(buttons, pan2d);

                    select2d.click();
                    expect(gd._fullLayout.dragmode).toBe('select');
                    assertActive(buttons, select2d);

                    lasso2d.click();
                    expect(gd._fullLayout.dragmode).toBe('lasso');
                    assertActive(buttons, lasso2d);

                    zoom2d.click();
                    expect(gd._fullLayout.dragmode).toBe('zoom');
                    assertActive(buttons, zoom2d);
                });
            });

            describe('buttons hoverCompareCartesian and hoverClosestCartesian ', function() {
                it('should update layout hovermode', function() {
                    var buttonCompare = selectButton(modeBar, 'hoverCompareCartesian'),
                        buttonClosest = selectButton(modeBar, 'hoverClosestCartesian'),
                        buttons = [buttonCompare, buttonClosest];

                    expect(gd._fullLayout.hovermode).toBe('x');
                    assertActive(buttons, buttonCompare);

                    buttonClosest.click();
                    expect(gd._fullLayout.hovermode).toBe('closest');
                    assertActive(buttons, buttonClosest);

                    buttonCompare.click();
                    expect(gd._fullLayout.hovermode).toBe('x');
                    assertActive(buttons, buttonCompare);
                });
            });
        });

        describe('pie handlers', function() {

            beforeEach(function(done) {
                var mockData = [{
                    type: 'pie',
                    labels: ['apples', 'bananas', 'grapes'],
                    values: [10, 20, 30]
                }];

                gd = createGraphDiv();
                Plotly.plot(gd, mockData).then(function() {
                    modeBar = gd._fullLayout._modeBar;
                    done();
                });
            });

            describe('buttons hoverClosestPie', function() {
                it('should update layout hovermode', function() {
                    var button = selectButton(modeBar, 'hoverClosestPie');

                    expect(gd._fullLayout.hovermode).toBe('closest');
                    expect(button.isActive()).toBe(true);

                    button.click();
                    expect(gd._fullLayout.hovermode).toBe(false);
                    expect(button.isActive()).toBe(false);

                    button.click();
                    expect(gd._fullLayout.hovermode).toBe('closest');
                    expect(button.isActive()).toBe(true);
                });
            });
        });

        describe('geo handlers', function() {

            beforeEach(function(done) {
                var mockData = [{
                    type: 'scattergeo',
                    lon: [10, 20, 30],
                    lat: [10, 20, 30]
                }];

                gd = createGraphDiv();
                Plotly.plot(gd, mockData).then(function() {
                    modeBar = gd._fullLayout._modeBar;
                    done();
                });
            });

            describe('buttons hoverClosestGeo', function() {
                it('should update layout hovermode', function() {
                    var button = selectButton(modeBar, 'hoverClosestGeo');

                    expect(gd._fullLayout.hovermode).toBe('closest');
                    expect(button.isActive()).toBe(true);

                    button.click();
                    expect(gd._fullLayout.hovermode).toBe(false);
                    expect(button.isActive()).toBe(false);

                    button.click();
                    expect(gd._fullLayout.hovermode).toBe('closest');
                    expect(button.isActive()).toBe(true);
                });
            });

        });

    });
});
