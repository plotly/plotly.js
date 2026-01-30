'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');

var attributes = require('./attributes');
var helpers = require('./helpers');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    handleArrayContainerDefaults(layoutIn, layoutOut, {
        name: 'shapes',
        handleItemDefaults: handleShapeDefaults
    });
};

function dfltLabelYanchor(isLine, labelTextPosition) {
    // If shape is a line, default y-anchor is 'bottom' (so that text is above line by default)
    // Otherwise, default y-anchor is equal to y-component of `textposition`
    // (so that text is positioned inside shape bounding box by default)
    return isLine
        ? 'bottom'
        : labelTextPosition.indexOf('top') !== -1
          ? 'top'
          : labelTextPosition.indexOf('bottom') !== -1
            ? 'bottom'
            : 'middle';
}

function handleShapeDefaults(shapeIn, shapeOut, fullLayout) {
    function coerce(attr, dflt) {
        return Lib.coerce(shapeIn, shapeOut, attributes, attr, dflt);
    }

    shapeOut._isShape = true;

    var visible = coerce('visible');
    if (!visible) return;

    var showlegend = coerce('showlegend');
    if (showlegend) {
        coerce('legend');
        coerce('legendwidth');
        coerce('legendgroup');
        coerce('legendgrouptitle.text');
        Lib.coerceFont(coerce, 'legendgrouptitle.font');
        coerce('legendrank');
    }

    var path = coerce('path');
    var dfltType = path ? 'path' : 'rect';
    var shapeType = coerce('type', dfltType);
    var noPath = shapeType !== 'path';
    if (noPath) delete shapeOut.path;

    coerce('editable');
    coerce('layer');
    coerce('opacity');
    coerce('fillcolor');
    coerce('fillrule');
    var lineWidth = coerce('line.width');
    if (lineWidth) {
        coerce('line.color');
        coerce('line.dash');
    }

    var xSizeMode = coerce('xsizemode');
    var ySizeMode = coerce('ysizemode');

    // positioning
    const dflts = [0.25, 0.75];
    const pixelDflts = [0, 10];

    ['x', 'y'].forEach(axLetter => {
        var attrAnchor = axLetter + 'anchor';
        var sizeMode = axLetter === 'x' ? xSizeMode : ySizeMode;
        var gdMock = { _fullLayout: fullLayout };
        var ax;
        var pos2r;
        var r2pos;

        // xref, yref - handle both string and array values
        var axRef;
        const refAttr = axLetter + 'ref';
        const inputRef = shapeIn[refAttr];

        if(Array.isArray(inputRef) && inputRef.length > 0) {
            // Array case: use coerceRefArray for validation
            const expectedLen = helpers.countDefiningCoords(shapeType, path, axLetter);
            axRef = Axes.coerceRefArray(shapeIn, shapeOut, gdMock, axLetter, undefined, 'paper', expectedLen);
            shapeOut['_' + axLetter + 'refArray'] = true;
        } else {
            // String/undefined case: use coerceRef
            axRef = Axes.coerceRef(shapeIn, shapeOut, gdMock, axLetter, undefined, 'paper');
        }

        if(Array.isArray(axRef)) {
            // Register the shape with all referenced axes for redrawing purposes
            axRef.forEach(function(ref) {
                if(Axes.getRefType(ref) === 'range') {
                    ax = Axes.getFromId(gdMock, ref);
                    if(ax && ax._shapeIndices.indexOf(shapeOut._index) === -1) {
                        ax._shapeIndices.push(shapeOut._index);
                    }
                }
            });

            if(noPath) {
                [0, 1].forEach(function(i) {
                    const ref = axRef[i];
                    const refType = Axes.getRefType(ref);
                    if(refType === 'range') {
                        ax = Axes.getFromId(gdMock, ref);
                        pos2r = helpers.shapePositionToRange(ax);
                        r2pos = helpers.rangeToShapePosition(ax);
                        if(ax.type === 'category' || ax.type === 'multicategory') {
                            coerce(axLetter + i + 'shift');
                        }
                    } else {
                        pos2r = r2pos = Lib.identity;
                    }

                    const attr = axLetter + i;
                    const inValue = shapeIn[attr];
                    shapeIn[attr] = pos2r(shapeIn[attr], true);

                    if(sizeMode === 'pixel') {
                        coerce(attr, pixelDflts[i]);
                    } else {
                        Axes.coercePosition(shapeOut, gdMock, coerce, ref, attr, dflts[i]);
                    }

                    shapeOut[attr] = r2pos(shapeOut[attr]);
                    shapeIn[attr] = inValue;

                    if(i === 0 && sizeMode === 'pixel') {
                        const inAnchor = shapeIn[attrAnchor];
                        shapeIn[attrAnchor] = pos2r(shapeIn[attrAnchor], true);
                        Axes.coercePosition(shapeOut, gdMock, coerce, ref, attrAnchor, 0.25);
                        shapeOut[attrAnchor] = r2pos(shapeOut[attrAnchor]);
                        shapeIn[attrAnchor] = inAnchor;
                    }
                });
            }
        } else {
            const axRefType = Axes.getRefType(axRef);

            if(axRefType === 'range') {
                ax = Axes.getFromId(gdMock, axRef);
                ax._shapeIndices.push(shapeOut._index);
                r2pos = helpers.rangeToShapePosition(ax);
                pos2r = helpers.shapePositionToRange(ax);
                if(noPath && (ax.type === 'category' || ax.type === 'multicategory')) {
                    coerce(axLetter + '0shift');
                    coerce(axLetter + '1shift');
                }
            } else {
                pos2r = r2pos = Lib.identity;
            }

            // Coerce x0, x1, y0, y1
            if(noPath) {
                // hack until V3.0 when log has regular range behavior - make it look like other
                // ranges to send to coerce, then put it back after
                // this is all to give reasonable default position behavior on log axes, which is
                // a pretty unimportant edge case so we could just ignore this.
                const attr0 = axLetter + '0';
                const attr1 = axLetter + '1';
                const in0 = shapeIn[attr0];
                const in1 = shapeIn[attr1];
                shapeIn[attr0] = pos2r(shapeIn[attr0], true);
                shapeIn[attr1] = pos2r(shapeIn[attr1], true);

                if(sizeMode === 'pixel') {
                    coerce(attr0, pixelDflts[0]);
                    coerce(attr1, pixelDflts[1]);
                } else {
                    Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attr0, dflts[0]);
                    Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attr1, dflts[1]);
                }

                // hack part 2
                shapeOut[attr0] = r2pos(shapeOut[attr0]);
                shapeOut[attr1] = r2pos(shapeOut[attr1]);
                shapeIn[attr0] = in0;
                shapeIn[attr1] = in1;
            }

            // Coerce xanchor and yanchor
            if(sizeMode === 'pixel') {
                // Hack for log axis described above
                const inAnchor = shapeIn[attrAnchor];
                shapeIn[attrAnchor] = pos2r(shapeIn[attrAnchor], true);

                Axes.coercePosition(shapeOut, gdMock, coerce, axRef, attrAnchor, 0.25);

                // Hack part 2
                shapeOut[attrAnchor] = r2pos(shapeOut[attrAnchor]);
                shapeIn[attrAnchor] = inAnchor;
            }
        }
    });

    if (noPath) {
        Lib.noneOrAll(shapeIn, shapeOut, ['x0', 'x1', 'y0', 'y1']);
    }

    // Label options
    var isLine = shapeType === 'line';
    var labelTextTemplate, labelText;
    if (noPath) {
        labelTextTemplate = coerce('label.texttemplate');
        coerce('label.texttemplatefallback');
    }
    if (!labelTextTemplate) {
        labelText = coerce('label.text');
    }
    if (labelText || labelTextTemplate) {
        coerce('label.textangle');
        var labelTextPosition = coerce('label.textposition', isLine ? 'middle' : 'middle center');
        coerce('label.xanchor');
        coerce('label.yanchor', dfltLabelYanchor(isLine, labelTextPosition));
        coerce('label.padding');
        Lib.coerceFont(coerce, 'label.font', fullLayout.font);
    }
}
