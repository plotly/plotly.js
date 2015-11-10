var Plotly = require('@src/plotly');

describe('Test Modebar', function() {
    'use strict';

    var getMockGraphInfo = function() {
        var graphInfo = {
            _fullLayout: {
                dragmode: 'zoom'
            },
            _context: {
                displayModeBar: true,
                displaylogo: true
            }
        };
        return graphInfo;
    };

    var getMockContainerTree = function() {
        var root = document.createElement('div');
        root.className = 'plot-container';
        var parent = document.createElement('div');
        parent.className = 'svg-container';
        root.appendChild(parent);
        return parent;
    };

    var createModebar = function(buttons) {

        var container = getMockContainerTree(),
            graphInfo = getMockGraphInfo();

        var modebar = new Plotly.ModeBar({
            buttons: buttons,
            container: container,
            Plotly: Plotly,
            graphInfo: graphInfo
        });
        return modebar;
    };

    describe('Test modebarCleanup:', function() {

        it('should make a cleanup.', function() {
            var buttons = [['zoom2d']];
            var modebar = createModebar(buttons);
            var modebarParent = modebar.element.parentNode;
            modebar.cleanup();
            expect(modebar.element.innerHTML).toEqual('');
            expect(modebarParent.querySelector('.modebar'))
                .toBeNull();
        });
    });

    describe('Test modebarHasButtons:', function() {

        var modeButtons2d,
            modeButtons3d;

        // Same as in ../graph_interact.js
        beforeEach( function() {
            modeButtons2d = [
                ['toImage'],
                ['zoom2d', 'pan2d'],
                ['zoomIn2d', 'zoomOut2d', 'resetScale2d', 'autoScale2d'],
                ['hoverClosest2d', 'hoverCompare2d']
            ];

            modeButtons3d = [
                ['toImage'],
                ['orbitRotation', 'tableRotation', 'zoom3d', 'pan3d'],
                ['resetCameraDefault3d', 'resetCameraLastSave3d'],
                ['hoverClosest3d']
            ];
        });

        it('should return true going from 3D -> 3D buttons.', function() {
            var modebar = createModebar(modeButtons3d);
            expect(modebar.hasButtons(modeButtons3d)).toBe(true);
        });

        it('should return true going from 2D -> 2D buttons.', function() {
            var modebar = createModebar(modeButtons2d);
            expect(modebar.hasButtons(modeButtons2d)).toBe(true);
        });

        it('should return false going from 2D -> 3D buttons.', function() {
            var modebar = createModebar(modeButtons2d);
            expect(modebar.hasButtons(modeButtons3d)).toBe(false);
        });

        it('should return false going from 3D -> 2D buttons.', function() {
            var modebar = createModebar(modeButtons3d);
            expect(modebar.hasButtons(modeButtons2d)).toBe(false);
        });
    });
});
