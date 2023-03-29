'use strict';

var docs = require('../constants/docs');
var FORMAT_LINK = docs.FORMAT_LINK;
var DATE_FORMAT_LINK = docs.DATE_FORMAT_LINK;

function templateFormatStringDescription(opts) {
    var supportOther = opts && opts.supportOther;

    return [
        'Variables are inserted using %{variable},',
        'for example "y: %{y}"' + (
            supportOther ?
                ' as well as %{xother}, {%_xother}, {%_xother_}, {%xother_}. When showing info for several points, *xother* will be added to those with different x positions from the first point. An underscore before or after *(x|y)other* will add a space on that side, only when this field is shown.' :
                '.'
        ),
        'Numbers are formatted using d3-format\'s syntax %{variable:d3-format}, for example "Price: %{y:$.2f}".',
        FORMAT_LINK,
        'for details on the formatting syntax.',
        'Dates are formatted using d3-time-format\'s syntax %{variable|d3-time-format}, for example "Day: %{2019-01-01|%A}".',
        DATE_FORMAT_LINK,
        'for details on the date formatting syntax.'
    ].join(' ');
}

function shapeTemplateFormatStringDescription() {
    return [
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
    ].join(' ');
}

function describeVariables(extra) {
    var descPart = extra.description ? ' ' + extra.description : '';
    var keys = extra.keys || [];
    if(keys.length > 0) {
        var quotedKeys = [];
        for(var i = 0; i < keys.length; i++) {
            quotedKeys[i] = '`' + keys[i] + '`';
        }
        descPart = descPart + 'Finally, the template string has access to ';
        if(keys.length === 1) {
            descPart = descPart + 'variable ' + quotedKeys[0];
        } else {
            descPart = descPart + 'variables ' + quotedKeys.slice(0, -1).join(', ') + ' and ' + quotedKeys.slice(-1) + '.';
        }
    }
    return descPart;
}

exports.hovertemplateAttrs = function(opts, extra) {
    opts = opts || {};
    extra = extra || {};

    var descPart = describeVariables(extra);

    var hovertemplate = {
        valType: 'string',
        dflt: '',
        editType: opts.editType || 'none',
        description: [
            'Template string used for rendering the information that appear on hover box.',
            'Note that this will override `hoverinfo`.',
            templateFormatStringDescription({supportOther: true}),
            'The variables available in `hovertemplate` are the ones emitted as event data described at this link https://plotly.com/javascript/plotlyjs-events/#event-data.',
            'Additionally, every attributes that can be specified per-point (the ones that are `arrayOk: true`) are available.',
            descPart,
            'Anything contained in tag `<extra>` is displayed in the secondary box, for example "<extra>{fullData.name}</extra>".',
            'To hide the secondary box completely, use an empty tag `<extra></extra>`.'
        ].join(' ')
    };

    if(opts.arrayOk !== false) {
        hovertemplate.arrayOk = true;
    }

    return hovertemplate;
};

exports.texttemplateAttrs = function(opts, extra) {
    opts = opts || {};
    extra = extra || {};

    var descPart = describeVariables(extra);

    var texttemplate = {
        valType: 'string',
        dflt: '',
        editType: opts.editType || 'calc',
        description: [
            'Template string used for rendering the information text that appear on points.',
            'Note that this will override `textinfo`.',
            templateFormatStringDescription(),
            'Every attributes that can be specified per-point (the ones that are `arrayOk: true`) are available.',
            descPart
        ].join(' ')
    };

    if(opts.arrayOk !== false) {
        texttemplate.arrayOk = true;
    }
    return texttemplate;
};


exports.shapeTexttemplateAttrs = function(opts, extra) {
    opts = opts || {};
    extra = extra || {};

    var newStr = opts.newshape ? 'new ' : '';

    var descPart = describeVariables(extra);

    var texttemplate = {
        valType: 'string',
        dflt: '',
        editType: opts.editType || 'arraydraw',
        description: [
            'Template string used for rendering the ' + newStr + 'shape\'s label.',
            'Note that this will override `text`.',
            shapeTemplateFormatStringDescription(),
            descPart,
        ].join(' ')
    };
    return texttemplate;
};
