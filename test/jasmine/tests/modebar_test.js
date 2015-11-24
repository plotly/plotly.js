var d3 = require('d3');

var createModeBar = require('@src/components/modebar');
var manageModeBar = require('@src/components/modebar/manage');


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

        it('hides title to when title is set to null or \'\' or false', function() {
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

        it('creates mode bar (cartesian version)', function() {
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

            expect(modeBar.hasButtons(buttons)).toBe(true);
            expect(countGroups(modeBar)).toEqual(5);
            expect(countButtons(modeBar)).toEqual(11);
            expect(countLogo(modeBar)).toEqual(1);
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

            expect(modeBar.hasButtons(buttons)).toBe(true);
            expect(countGroups(modeBar)).toEqual(3);
            expect(countButtons(modeBar)).toEqual(5);
            expect(countLogo(modeBar)).toEqual(1);
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

            expect(modeBar.hasButtons(buttons)).toBe(true);
            expect(countGroups(modeBar)).toEqual(5);
            expect(countButtons(modeBar)).toEqual(10);
            expect(countLogo(modeBar)).toEqual(1);
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

            expect(modeBar.hasButtons(buttons)).toBe(true);
            expect(countGroups(modeBar)).toEqual(4);
            expect(countButtons(modeBar)).toEqual(7);
            expect(countLogo(modeBar)).toEqual(1);
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

            expect(modeBar.hasButtons(buttons)).toBe(true);
            expect(countGroups(modeBar)).toEqual(5);
            expect(countButtons(modeBar)).toEqual(10);
            expect(countLogo(modeBar)).toEqual(1);
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

            expect(modeBar.hasButtons(buttons)).toBe(true);
            expect(countGroups(modeBar)).toEqual(3);
            expect(countButtons(modeBar)).toEqual(4);
            expect(countLogo(modeBar)).toEqual(1);
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

            gd._context.modeBarButtonsToRemove = ['toImage', 'sendDataToCloud'];
            manageModeBar(gd);

            expect(countButtons(gd._fullLayout._modeBar)).toEqual(9);
        });

        it('updates mode bar buttons if modeBarButtonsToAdd changes', function() {
            var gd = setupGraphInfo();
            manageModeBar(gd);

            gd._context.modeBarButtonsToAdd = [{
                name: 'some button',
                click: noop
            }];
            manageModeBar(gd);

            expect(countGroups(gd._fullLayout._modeBar)).toEqual(6);
            expect(countButtons(gd._fullLayout._modeBar)).toEqual(12);
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

});
