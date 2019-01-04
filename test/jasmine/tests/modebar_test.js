var d3 = require('d3');

var createModeBar = require('@src/components/modebar/modebar');
var manageModeBar = require('@src/components/modebar/manage');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Registry = require('@src/registry');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var selectButton = require('../assets/modebar_button');
var failTest = require('../assets/fail_test');


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

    function getMockGraphInfo(xaxes, yaxes) {
        return {
            _fullLayout: {
                _uid: '6ea6a7',
                dragmode: 'zoom',
                _paperdiv: d3.select(getMockContainerTree()),
                _has: Plots._hasPlotType,
                _subplots: {xaxis: xaxes || [], yaxis: yaxes || []},
                modebar: {
                    orientation: 'h',
                    bgcolor: 'rgba(255,255,255,0.7)',
                    color: 'rgba(0, 31, 95, 0.3)',
                    activecolor: 'rgba(0, 31, 95, 1)'
                }
            },
            _fullData: [],
            _context: {
                displaylogo: true,
                showSendToCloud: false,
                displayModeBar: true,
                modeBarButtonsToRemove: [],
                modeBarButtonsToAdd: [],
                locale: 'en',
                locales: {}
            }
        };
    }

    function countGroups(modeBar) {
        return d3.select(modeBar.element).selectAll('div.modebar-group').size();
    }

    function countButtons(modeBar) {
        return d3.select(modeBar.element).selectAll('a.modebar-btn').size();
    }

    function countLogo(modeBar) {
        return d3.select(modeBar.element).selectAll('a.plotlyjsicon').size();
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

        describe('creates a custom button', function() {
            function getIconSvg(modeBar) {
                if(!modeBar || !modeBar.buttonElements || !modeBar.buttonElements.length > 0) {
                    return undefined;
                }
                var button = modeBar.buttonElements[0];
                return d3.select(button).select('svg');
            }

            it('with a Plotly icon', function() {
                var modeBar = createModeBar(getMockGraphInfo(), [[
                    {
                        name: 'some button',
                        click: noop,
                        icon: Plotly.Icons.home
                    }
                ]]);

                var svg = getIconSvg(modeBar);
                expect(svg).toBeDefined();
                var path = svg.select('path');
                expect(path.attr('d')).toBeDefined();
                expect(path.attr('transform')).toBeDefined();
            });

            it('with a custom icon', function() {
                var modeBar = createModeBar(getMockGraphInfo(), [[
                    {
                        name: 'some button',
                        click: noop,
                        icon: {
                            width: 1000,
                            height: 1000,
                            path: 'M0,-150 L1000,-150 L500,850 L0,-150 Z',
                            transform: 'matrix(1 0 0 -1 0 850)',
                        }
                    }
                ]]);

                var svg = getIconSvg(modeBar);
                expect(svg).toBeDefined();
                expect(svg.attr('viewBox')).toBe('0 0 1000 1000');
                var path = svg.select('path');
                expect(path.attr('d')).toBeDefined();
                expect(path.attr('transform')).toEqual('matrix(1 0 0 -1 0 850)');
            });

            it('with a custom icon with no transform', function() {
                var modeBar = createModeBar(getMockGraphInfo(), [[
                    {
                        name: 'some button',
                        click: noop,
                        icon: {
                            width: 1000,
                            height: 1000,
                            path: 'M500,0 L1000,1000 L0,1000 L500,0 Z',
                        }
                    }
                ]]);

                var svg = getIconSvg(modeBar);
                expect(svg).toBeDefined();
                expect(svg.attr('viewBox')).toBe('0 0 1000 1000');
                var path = svg.select('path');
                expect(path.attr('d')).toBeDefined();
                expect(path.attr('transform')).toBeNull();
            });

            it('with a custom icon created by a function', function() {
                var modeBar = createModeBar(getMockGraphInfo(), [[
                    {
                        name: 'some button',
                        click: noop,
                        icon: function() {
                            var xmlns = 'http://www.w3.org/2000/svg';
                            var icon = document.createElementNS(xmlns, 'svg');
                            icon.setAttribute('viewBox', '0 0 1000 1000');
                            icon.setAttribute('height', '1em');
                            icon.setAttribute('width', '1em');
                            icon.setAttribute('class', 'custom-svg');
                            var path = document.createElementNS(xmlns, 'path');
                            path.setAttribute('d', 'M500,0 L1000,1000 L0,1000 L500,0 Z');
                            icon.appendChild(path);
                            return icon;
                        }
                    }
                ]]);

                var svg = getIconSvg(modeBar);
                expect(svg).toBeDefined();
                expect(svg.attr('viewBox')).toBe('0 0 1000 1000');
                expect(svg.attr('class')).toBe('custom-svg');
                var path = svg.select('path');
                expect(path.attr('d')).toBeDefined();
                expect(path.attr('transform')).toBeNull();
            });

            it('with a legacy icon config', function() {
                var modeBar = createModeBar(getMockGraphInfo(), [[
                    {
                        name: 'some button',
                        click: noop,
                        icon: {
                            width: 1000,
                            path: 'M0,-150 L1000,-150 L500,850 L0,-150 Z',
                            ascent: 850,
                            descent: -150
                        }
                    }
                ]]);

                var svg = getIconSvg(modeBar);
                expect(svg).toBeDefined();
                expect(svg.attr('viewBox')).toBe('0 0 1000 1000');
                var path = svg.select('path');
                expect(path.attr('d')).toBeDefined();
                expect(path.attr('transform')).toEqual('matrix(1 0 0 -1 0 850)');
            });

            it('with the spikeline icon', function() {
                var modeBar = createModeBar(getMockGraphInfo(), [[
                    {
                        name: 'some button',
                        click: noop,
                        icon: Plotly.Icons.spikeline
                    }
                ]]);

                var svg = getIconSvg(modeBar);
                expect(svg).toBeDefined();
                expect(svg.attr('viewBox')).toBe('0 0 1000 1000');
                var path = svg.select('path');
                expect(path.attr('d')).toBeDefined();
                expect(path.attr('transform')).toEqual('matrix(1.5 0 0 -1.5 0 850)');
            });
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

            var actualButtons = modeBar.buttons.map(function(group) {
                return group.map(function(button) { return button.name; }).join(', ');
            }).join(' - ');

            expect(modeBar.hasButtons(buttons)).toBe(true, 'modeBar.hasButtons: ' + actualButtons);
            expect(countGroups(modeBar)).toBe(expectedGroupCount, 'correct group count');
            expect(countButtons(modeBar)).toBe(expectedButtonCount, 'correct button count');
            expect(countLogo(modeBar)).toBe(1, 'correct logo count');
        }

        it('creates mode bar (unselectable cartesian version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }];
            gd._fullLayout.xaxis = {fixedrange: false};

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (selectable scatter version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }];
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

        it('creates mode bar (selectable box version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }];
            gd._fullLayout.xaxis = {fixedrange: false};
            gd._fullData = [{
                type: 'box',
                visible: true,
                boxpoints: 'all',
                _module: {selectPoints: true}
            }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian fixed-axes version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (gl3d version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'],
                ['resetCameraDefault3d', 'resetCameraLastSave3d'],
                ['hoverClosest3d']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'gl3d' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (geo version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['pan2d'],
                ['zoomInGeo', 'zoomOutGeo', 'resetGeo'],
                ['hoverClosestGeo']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'geo' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (geo + selected version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['pan2d', 'select2d', 'lasso2d'],
                ['zoomInGeo', 'zoomOutGeo', 'resetGeo'],
                ['hoverClosestGeo']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'geo' }];
            gd._fullData = [{
                type: 'scattergeo',
                visible: true,
                mode: 'markers',
                _module: {selectPoints: true}
            }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (mapbox version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['pan2d'],
                ['resetViewMapbox'],
                ['toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'mapbox' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (mapbox + selected version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['pan2d', 'select2d', 'lasso2d'],
                ['resetViewMapbox'],
                ['toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'mapbox' }];
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

        it('creates mode bar (gl2d version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['hoverClosestGl2d']
            ]);

            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullLayout._basePlotModules = [{ name: 'gl2d' }];
            gd._fullLayout.xaxis = {fixedrange: false};

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (pie version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['hoverClosestPie']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'pie' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian + gl3d version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'],
                ['resetViews'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }, { name: 'gl3d' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian + geo unselectable version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetViews'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }, { name: 'geo' }];
            gd._fullLayout.xaxis = {fixedrange: false};

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (cartesian + geo selectable version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetViews'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }, { name: 'geo' }];
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

        it('creates mode bar (cartesian + pie version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
                ['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullData = [{
                type: 'scatter',
                visible: true,
                mode: 'markers',
                _module: {selectPoints: true}
            }];
            gd._fullLayout.xaxis = {fixedrange: false};
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }, { name: 'pie' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (gl3d + geo version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'],
                ['resetViews'],
                ['toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'geo' }, { name: 'gl3d' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (un-selectable ternary version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d'],
                ['toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'ternary' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (selectable ternary version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d', 'select2d', 'lasso2d'],
                ['toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullData = [{
                type: 'scatterternary',
                visible: true,
                mode: 'markers',
                _module: {selectPoints: true}
            }];
            gd._fullLayout._basePlotModules = [{ name: 'ternary' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (ternary + cartesian version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom2d', 'pan2d'],
                ['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'ternary' }, { name: 'cartesian' }];

            manageModeBar(gd);
            var modeBar = gd._fullLayout._modeBar;

            checkButtons(modeBar, buttons, 1);
        });

        it('creates mode bar (ternary + gl3d version)', function() {
            var buttons = getButtons([
                ['toImage'],
                ['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation'],
                ['resetViews'],
                ['toggleHover']
            ]);

            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'ternary' }, { name: 'gl3d' }];

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

        it('displays/hides cloud link according to showSendToCloud config arg', function() {
            var gd = getMockGraphInfo();
            gd._fullLayout._basePlotModules = [{ name: 'pie' }];
            manageModeBar(gd);
            checkButtons(gd._fullLayout._modeBar, getButtons([
                ['toImage'],
                ['hoverClosestPie']
            ]), 1);

            gd._context.showSendToCloud = true;
            manageModeBar(gd);
            checkButtons(gd._fullLayout._modeBar, getButtons([
                ['toImage', 'sendDataToCloud'],
                ['hoverClosestPie']
            ]), 1);
        });

        it('always displays the logo if watermark config arg is true', function() {
            var gd = getMockGraphInfo();
            gd._context.displaylogo = false;
            gd._context.displayModeBar = false;
            gd._context.watermark = true;
            manageModeBar(gd);
            expect(countLogo(gd._fullLayout._modeBar)).toEqual(1);
            expect(countButtons(gd._fullLayout._modeBar)).toEqual(1);
        });

        // gives 11 buttons in 5 groups by default
        function setupGraphInfo() {
            var gd = getMockGraphInfo(['x'], ['y']);
            gd._fullLayout._basePlotModules = [{ name: 'cartesian' }];
            gd._fullLayout.xaxis = {fixedrange: false};
            return gd;
        }

        it('updates mode bar buttons if plot type changes', function() {
            var gd = setupGraphInfo();
            manageModeBar(gd);

            expect(countButtons(gd._fullLayout._modeBar)).toEqual(11);

            gd._fullLayout._basePlotModules = [{ name: 'gl3d' }];
            manageModeBar(gd);

            expect(countButtons(gd._fullLayout._modeBar)).toEqual(9);
        });

        it('updates mode bar buttons if modeBarButtonsToRemove changes', function() {
            var gd = setupGraphInfo();
            manageModeBar(gd);
            var initialButtonCount = countButtons(gd._fullLayout._modeBar);

            gd._context.modeBarButtonsToRemove = ['toImage', 'zoom2d'];
            manageModeBar(gd);

            expect(countButtons(gd._fullLayout._modeBar))
                .toEqual(initialButtonCount - 2);
        });

        it('updates mode bar buttons if modeBarButtonsToAdd changes', function() {
            var gd = setupGraphInfo();
            manageModeBar(gd);

            var initialGroupCount = countGroups(gd._fullLayout._modeBar);
            var initialButtonCount = countButtons(gd._fullLayout._modeBar);

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
        var gd, modeBar, buttonClosest, buttonCompare, buttonToggle, hovermodeButtons;

        afterEach(destroyGraphDiv);

        function assertRange(axName, expected) {
            var PRECISION = 2;

            var ax = gd._fullLayout[axName];
            var actual = ax.range;

            if(ax.type === 'date') {
                var truncate = function(v) { return v.substr(0, 10); };
                expect(actual.map(truncate)).toEqual(expected.map(truncate), axName);
            }
            else {
                expect(actual).toBeCloseToArray(expected, PRECISION, axName);
            }
        }

        function assertActive(buttons, activeButton) {
            for(var i = 0; i < buttons.length; i++) {
                expect(buttons[i].isActive()).toBe(
                    buttons[i] === activeButton
                );
            }
        }

        describe('toImage handlers', function() {
            beforeEach(function() {
                spyOn(Registry, 'call').and.callFake(function() {
                    return Promise.resolve();
                });
                gd = createGraphDiv();
            });

            it('should use defaults', function(done) {
                Plotly.plot(gd, {data: [], layout: {}})
                .then(function() {
                    selectButton(gd._fullLayout._modeBar, 'toImage').click();
                    expect(Registry.call).toHaveBeenCalledWith('downloadImage', gd,
                        {format: 'png'});
                    done();
                });
            });

            it('should accept overriding defaults', function(done) {
                Plotly.plot(gd, {data: [], layout: {}, config: {
                    toImageButtonOptions: {
                        format: 'svg',
                        filename: 'x',
                        unsupported: 'should not pass'
                    }
                } })
                .then(function() {
                    selectButton(gd._fullLayout._modeBar, 'toImage').click();
                    expect(Registry.call).toHaveBeenCalledWith('downloadImage', gd,
                        {format: 'svg', filename: 'x'});
                    done();
                });
            });

        });

        describe('cartesian handlers', function() {

            beforeEach(function(done) {
                var mockData = [{
                    type: 'scatter',
                    x: ['2016-01-01', '2016-02-01', '2016-03-01'],
                    y: [10, 100, 1000],
                }, {
                    type: 'bar',
                    x: ['a', 'b', 'c'],
                    y: [2, 1, 2],
                    xaxis: 'x2',
                    yaxis: 'y2'
                }];

                var mockLayout = {
                    xaxis: {
                        anchor: 'y',
                        domain: [0, 0.5],
                        range: ['2016-01-01', '2016-04-01']
                    },
                    yaxis: {
                        anchor: 'x',
                        type: 'log',
                        range: [1, 3]
                    },
                    xaxis2: {
                        anchor: 'y2',
                        domain: [0.5, 1],
                        range: [-1, 4]
                    },
                    yaxis2: {
                        anchor: 'x2',
                        range: [0, 4]
                    },
                    width: 600,
                    height: 500
                };

                gd = createGraphDiv();
                Plotly.plot(gd, mockData, mockLayout).then(function() {
                    modeBar = gd._fullLayout._modeBar;
                    buttonToggle = selectButton(modeBar, 'toggleSpikelines');
                    buttonCompare = selectButton(modeBar, 'hoverCompareCartesian');
                    buttonClosest = selectButton(modeBar, 'hoverClosestCartesian');
                    hovermodeButtons = [buttonCompare, buttonClosest];
                    done();
                });
            });

            describe('buttons zoomIn2d, zoomOut2d, autoScale2d and resetScale2d', function() {
                it('should update axis ranges', function() {
                    var buttonZoomIn = selectButton(modeBar, 'zoomIn2d');
                    var buttonZoomOut = selectButton(modeBar, 'zoomOut2d');
                    var buttonAutoScale = selectButton(modeBar, 'autoScale2d');
                    var buttonResetScale = selectButton(modeBar, 'resetScale2d');

                    assertRange('xaxis', ['2016-01-01', '2016-04-01']);
                    assertRange('yaxis', [1, 3]);
                    assertRange('xaxis2', [-1, 4]);
                    assertRange('yaxis2', [0, 4]);

                    buttonZoomIn.click();
                    assertRange('xaxis', ['2016-01-23 17:45', '2016-03-09 05:15']);
                    assertRange('yaxis', [1.5, 2.5]);
                    assertRange('xaxis2', [0.25, 2.75]);
                    assertRange('yaxis2', [1, 3]);

                    buttonZoomOut.click();
                    assertRange('xaxis', ['2016-01-01', '2016-04-01']);
                    assertRange('yaxis', [1, 3]);
                    assertRange('xaxis2', [-1, 4]);
                    assertRange('yaxis2', [0, 4]);

                    buttonZoomIn.click();
                    buttonAutoScale.click();
                    assertRange('xaxis', ['2015-12-27 06:36:39.6661', '2016-03-05 17:23:20.3339']);
                    assertRange('yaxis', [0.8591, 3.1408]);
                    assertRange('xaxis2', [-0.5, 2.5]);
                    assertRange('yaxis2', [0, 2.105263]);

                    buttonResetScale.click();
                    assertRange('xaxis', ['2016-01-01', '2016-04-01']);
                    assertRange('yaxis', [1, 3]);
                    assertRange('xaxis2', [-1, 4]);
                    assertRange('yaxis2', [0, 4]);
                });
            });

            describe('buttons zoom2d, pan2d, select2d and lasso2d', function() {
                it('should update the layout dragmode', function() {
                    var zoom2d = selectButton(modeBar, 'zoom2d');
                    var pan2d = selectButton(modeBar, 'pan2d');
                    var select2d = selectButton(modeBar, 'select2d');
                    var lasso2d = selectButton(modeBar, 'lasso2d');
                    var buttons = [zoom2d, pan2d, select2d, lasso2d];

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
                    expect(gd._fullLayout.hovermode).toBe('x');
                    assertActive(hovermodeButtons, buttonCompare);

                    buttonClosest.click();
                    expect(gd._fullLayout.hovermode).toBe('closest');
                    assertActive(hovermodeButtons, buttonClosest);

                    buttonCompare.click();
                    expect(gd._fullLayout.hovermode).toBe('x');
                    assertActive(hovermodeButtons, buttonCompare);
                });
            });

            describe('button toggleSpikelines', function() {
                it('should not change layout hovermode', function() {
                    expect(gd._fullLayout.hovermode).toBe('x');
                    assertActive(hovermodeButtons, buttonCompare);

                    buttonToggle.click();
                    expect(gd._fullLayout.hovermode).toBe('x');
                    assertActive(hovermodeButtons, buttonCompare);
                });
                it('should makes spikelines visible', function() {
                    buttonToggle.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('on');

                    buttonToggle.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('off');
                });
                it('should not become disabled when hovermode is switched off closest', function() {
                    buttonToggle.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('on');

                    buttonCompare.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('on');
                });
                it('should keep the state on changing the hovermode', function() {
                    buttonToggle.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('on');

                    buttonCompare.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('on');

                    buttonToggle.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('off');

                    buttonClosest.click();
                    expect(gd._fullLayout._cartesianSpikesEnabled).toBe('off');
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

        describe('@noCI mapbox handlers', function() {
            it('button *resetViewMapbox* should reset the mapbox view attribute to their default', function(done) {
                var gd = createGraphDiv();

                function _assert(centerLon, centerLat, zoom) {
                    var mapboxLayout = gd._fullLayout.mapbox;

                    expect(mapboxLayout.center.lon).toBe(centerLon, 'center.lon');
                    expect(mapboxLayout.center.lat).toBe(centerLat, 'center.lat');
                    expect(mapboxLayout.zoom).toBe(zoom, 'zoom');
                }

                Plotly.plot(gd, [{
                    type: 'scattermapbox',
                    lon: [10, 20, 30],
                    lat: [10, 20, 30]
                }], {
                    mapbox: {
                        center: {lon: 10, lat: 10},
                        zoom: 8
                    }
                }, {
                    mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
                })
                .then(function() {
                    _assert(10, 10, 8);

                    return Plotly.relayout(gd, {
                        'mapbox.zoom': 10,
                        'mapbox.center.lon': 30
                    });
                })
                .then(function() {
                    _assert(30, 10, 10);

                    var button = selectButton(gd._fullLayout._modeBar, 'resetViewMapbox');

                    button.isActive(false);
                    button.click(false);
                    _assert(10, 10, 8);
                    button.isActive(false);
                })
                .then(done);
            });
        });
    });

    describe('modebar styling', function() {
        var gd;
        var colors = ['rgba(128, 128, 128, 0.7)', 'rgba(255, 0, 128, 0.2)'];
        var targetBtn = 'pan2d';
        var button, style;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        function checkButtonColor(button, color) {
            var paths = button.node.querySelector('path');
            var style = window.getComputedStyle(paths);
            expect(style.fill).toBe(color);
        }

        it('create an associated style element and destroy it on purge', function(done) {
            var styleSelector, style;
            Plotly.plot(gd, [], {})
            .then(function() {
                styleSelector = 'style[id*="modebar-' + gd._fullLayout._uid + '"]';

                style = document.querySelector(styleSelector);
                expect(style).toBeTruthy();
            })
            .then(function() {
                Plotly.purge(gd);
                style = document.querySelector(styleSelector);
                expect(style).toBeNull();
            })
            .then(done);
        });

        it('changes icon colors', function(done) {
            Plotly.plot(gd, [], {modebar: { color: colors[0]}})
            .then(function() {
                button = selectButton(gd._fullLayout._modeBar, targetBtn);
                checkButtonColor(button, colors[0]);
            })
            .then(function() {Plotly.relayout(gd, 'modebar.color', colors[1]);})
            .then(function() {
                checkButtonColor(button, colors[1]);
            })
            .catch(failTest)
            .then(done);
        });

        it('changes active icon colors', function(done) {
            Plotly.plot(gd, [], {modebar: { activecolor: colors[0]}})
            .then(function() {
                button = selectButton(gd._fullLayout._modeBar, targetBtn);
                button.click();
                checkButtonColor(button, colors[0]);
            })
            .then(function() {Plotly.relayout(gd, 'modebar.activecolor', colors[1]);})
            .then(function() {
                checkButtonColor(button, colors[1]);
            })
            .catch(failTest)
            .then(done);
        });

        it('changes background color (displayModeBar: hover)', function(done) {
            function getStyleRule() {
                var uid = gd._fullLayout._uid;
                var ownerNode = document.getElementById('plotly.js-style-modebar-' + uid);
                var styleSheets = document.styleSheets;
                for(var i = 0; i < styleSheets.length; i++) {
                    var ss = styleSheets[i];
                    if(ss.ownerNode === ownerNode) return ss;
                }
            }

            Plotly.plot(gd, [], {modebar: { bgcolor: colors[0]}})
            .then(function() {
                style = window.getComputedStyle(gd._fullLayout._modeBar.element);
                expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
                expect(getStyleRule().rules[3].style.backgroundColor).toBe(colors[0]);
            })
            .then(function() {Plotly.relayout(gd, 'modebar.bgcolor', colors[1]);})
            .then(function() {
                style = window.getComputedStyle(gd._fullLayout._modeBar.element);
                expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
                expect(getStyleRule().rules[3].style.backgroundColor).toBe(colors[1]);
            })
            .catch(failTest)
            .then(done);
        });

        it('changes background color (displayModeBar: true)', function(done) {
            function getStyleRule() {
                var uid = gd._fullLayout._uid;
                var ownerNode = document.getElementById('plotly.js-style-modebar-' + uid);
                var styleSheets = document.styleSheets;
                for(var i = 0; i < styleSheets.length; i++) {
                    var ss = styleSheets[i];
                    if(ss.ownerNode === ownerNode) return ss;
                }
            }

            Plotly.plot(gd, [], {modebar: {bgcolor: colors[0]}}, {displayModeBar: true})
            .then(function() {
                style = window.getComputedStyle(gd._fullLayout._modeBar.element);
                expect(style.backgroundColor).toBe(colors[0]);
                expect(getStyleRule().rules[3].style.backgroundColor).toBe(colors[0]);
            })
            .then(function() {Plotly.relayout(gd, 'modebar.bgcolor', colors[1]);})
            .then(function() {
                style = window.getComputedStyle(gd._fullLayout._modeBar.element);
                expect(style.backgroundColor).toBe(colors[1]);
                expect(getStyleRule().rules[3].style.backgroundColor).toBe(colors[1]);
            })
            .catch(failTest)
            .then(done);
        });

        it('changes orientation', function(done) {
            var modeBarEl, size;

            Plotly.plot(gd, [], {modebar: { orientation: 'v' }})
            .then(function() {
                modeBarEl = gd._fullLayout._modeBar.element;
                size = modeBarEl.getBoundingClientRect();
                expect(size.width < size.height).toBeTruthy();
            })
            .then(function() {Plotly.relayout(gd, 'modebar.orientation', 'h');})
            .catch(failTest)
            .then(function() {
                size = modeBarEl.getBoundingClientRect();
                expect(size.width > size.height).toBeTruthy();
            })
            .then(done);
        });
    });
});
