'use strict';
const { DATE_FORMAT_LINK, FORMAT_LINK } = require('../constants/docs');

const MISSING_UNDEFINED_DESCRIPTION = [
    "Variables that can't be found will be replaced with the specifier.",
    'For example, a template of "data: %{x}, %{y}" will result in a value of "data: 1, %{y}" if x is 1 and y is missing.',
    'Variables with an undefined value will be replaced with the fallback value.'
].join(' ');

function templateFormatStringDescription({ supportOther } = {}) {
    const supportOtherText =
        ' as well as %{xother}, {%_xother}, {%_xother_}, {%xother_}. When showing info for several points, *xother* will be added to those with different x positions from the first point. An underscore before or after *(x|y)other* will add a space on that side, only when this field is shown.';

    return [
        'Variables are inserted using %{variable},',
        'for example "y: %{y}"' + (supportOther ? supportOtherText : '.'),
        'Numbers are formatted using d3-format\'s syntax %{variable:d3-format}, for example "Price: %{y:$.2f}".',
        FORMAT_LINK,
        'for details on the formatting syntax.',
        'Dates are formatted using d3-time-format\'s syntax %{variable|d3-time-format}, for example "Day: %{2019-01-01|%A}".',
        DATE_FORMAT_LINK,
        'for details on the date formatting syntax.',
        MISSING_UNDEFINED_DESCRIPTION
    ].join(' ');
}
exports.templateFormatStringDescription = templateFormatStringDescription;

function describeVariables({ description, keys = [] }) {
    let descPart = description ? ' ' : '';
    if (keys.length > 0) {
        const quotedKeys = keys.map((k) => `\`${k}\``);
        descPart += 'Finally, the template string has access to ';
        if (keys.length === 1) {
            descPart += `variable ${quotedKeys[0]}`;
        } else {
            descPart += `variables ${quotedKeys.slice(0, -1).join(', ')} and ${quotedKeys.slice(-1)}.`;
        }
    }

    return descPart;
}

exports.hovertemplateAttrs = ({ editType = 'none', arrayOk } = {}, extra = {}) => ({
    valType: 'string',
    dflt: '',
    editType,
    description: [
        'Template string used for rendering the information that appear on hover box.',
        'Note that this will override `hoverinfo`.',
        templateFormatStringDescription({ supportOther: true }),
        'The variables available in `hovertemplate` are the ones emitted as event data described at this link https://plotly.com/javascript/plotlyjs-events/#event-data.',
        'Additionally, all attributes that can be specified per-point (the ones that are `arrayOk: true`) are available.',
        describeVariables(extra),
        'Anything contained in tag `<extra>` is displayed in the secondary box, for example `<extra>%{fullData.name}</extra>`.',
        'To hide the secondary box completely, use an empty tag `<extra></extra>`.'
    ].join(' '),
    ...(arrayOk !== false ? { arrayOk: true } : {})
});

exports.texttemplateAttrs = ({ editType = 'calc', arrayOk } = {}, extra = {}) => ({
    valType: 'string',
    dflt: '',
    editType,
    description: [
        'Template string used for rendering the information text that appears on points.',
        'Note that this will override `textinfo`.',
        templateFormatStringDescription(),
        'All attributes that can be specified per-point (the ones that are `arrayOk: true`) are available.',
        describeVariables(extra)
    ].join(' '),
    ...(arrayOk !== false ? { arrayOk: true } : {})
});

exports.shapeTexttemplateAttrs = ({ editType = 'arraydraw', newshape } = {}, extra = {}) => ({
    valType: 'string',
    dflt: '',
    editType,
    description: [
        `Template string used for rendering the ${newshape ? 'new ' : ''}shape's label.`,
        'Note that this will override `text`.',
        'Variables are inserted using %{variable},',
        'for example "x0: %{x0}".',
        'Numbers are formatted using d3-format\'s syntax %{variable:d3-format}, for example "Price: %{x0:$.2f}". See',
        FORMAT_LINK,
        'for details on the formatting syntax.',
        'Dates are formatted using d3-time-format\'s syntax %{variable|d3-time-format}, for example "Day: %{x0|%m %b %Y}". See',
        DATE_FORMAT_LINK,
        'for details on the date formatting syntax.',
        'A single multiplication or division operation may be applied to numeric variables, and combined with',
        'd3 number formatting, for example "Length in cm: %{x0*2.54}", "%{slope*60:.1f} meters per second."',
        'For log axes, variable values are given in log units.',
        'For date axes, x/y coordinate variables and center variables use datetimes, while all other variable values use values in ms.',
        describeVariables(extra),
        MISSING_UNDEFINED_DESCRIPTION
    ].join(' ')
});

exports.templatefallbackAttrs = ({ editType = 'none' } = {}) => ({
    valType: 'any',
    dflt: '-',
    editType,
    description: [
        "Fallback string that's displayed when a variable referenced in a template is missing.",
        "If the boolean value 'false' is passed in, the specifier with the missing variable will be displayed."
    ].join(' ')
});
