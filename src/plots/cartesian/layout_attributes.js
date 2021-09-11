'use strict';

var fontAttrs = require('../font_attributes');
var colorAttrs = require('../../components/color/attributes');
var dash = require('../../components/drawing/attributes').dash;
var extendFlat = require('../../lib/extend').extendFlat;
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var descriptionWithDates = require('../../plots/cartesian/axis_format_attributes').descriptionWithDates;

var ONEDAY = require('../../constants/numerical').ONEDAY;
var constants = require('./constants');
var HOUR = constants.HOUR_PATTERN;
var DAY_OF_WEEK = constants.WEEKDAY_PATTERN;

module.exports = {
    visible: {
        valType: 'boolean',
        editType: 'plot',
        description: [
            'A single toggle to hide the axis while preserving interaction like dragging.',
            'Default is true when a cheater plot is present on the axis, otherwise',
            'false'
        ].join(' ')
    },
    color: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        editType: 'ticks',
        description: [
            'Sets default for all colors associated with this axis',
            'all at once: line, font, tick, and grid colors.',
            'Grid color is lightened by blending this with the plot background',
            'Individual pieces can override this.'
        ].join(' ')
    },
    title: {
        text: {
            valType: 'string',
            editType: 'ticks',
            description: [
                'Sets the title of this axis.',
                'Note that before the existence of `title.text`, the title\'s',
                'contents used to be defined as the `title` attribute itself.',
                'This behavior has been deprecated.'
            ].join(' ')
        },
        font: fontAttrs({
            editType: 'ticks',
            description: [
                'Sets this axis\' title font.',
                'Note that the title\'s font used to be customized',
                'by the now deprecated `titlefont` attribute.'
            ].join(' ')
        }),
        standoff: {
            valType: 'number',
            min: 0,
            editType: 'ticks',
            description: [
                'Sets the standoff distance (in px) between the axis labels and the title text',
                'The default value is a function of the axis tick labels, the title `font.size`',
                'and the axis `linewidth`.',
                'Note that the axis title position is always constrained within the margins,',
                'so the actual standoff distance is always less than the set or default value.',
                'By setting `standoff` and turning on `automargin`, plotly.js will push the',
                'margins to fit the axis title at given standoff distance.'
            ].join(' ')
        },
        editType: 'ticks'
    },
    type: {
        valType: 'enumerated',
        // '-' means we haven't yet run autotype or couldn't find any data
        // it gets turned into linear in gd._fullLayout but not copied back
        // to gd.data like the others are.
        values: ['-', 'linear', 'log', 'date', 'category', 'multicategory'],
        dflt: '-',
        editType: 'calc',
        // we forget when an axis has been autotyped, just writing the auto
        // value back to the input - so it doesn't make sense to template this.
        // Note: we do NOT prohibit this in `coerce`, so if someone enters a
        // type in the template explicitly it will be honored as the default.
        _noTemplating: true,
        description: [
            'Sets the axis type.',
            'By default, plotly attempts to determined the axis type',
            'by looking into the data of the traces that referenced',
            'the axis in question.'
        ].join(' ')
    },
    autotypenumbers: {
        valType: 'enumerated',
        values: ['convert types', 'strict'],
        dflt: 'convert types',
        editType: 'calc',
        description: [
            'Using *strict* a numeric string in trace data is not converted to a number.',
            'Using *convert types* a numeric string in trace data may be',
            'treated as a number during automatic axis `type` detection.',
            'Defaults to layout.autotypenumbers.'
        ].join(' ')
    },
    autorange: {
        valType: 'enumerated',
        values: [true, false, 'reversed'],
        dflt: true,
        editType: 'axrange',
        impliedEdits: {'range[0]': undefined, 'range[1]': undefined},
        description: [
            'Determines whether or not the range of this axis is',
            'computed in relation to the input data.',
            'See `rangemode` for more info.',
            'If `range` is provided, then `autorange` is set to *false*.'
        ].join(' ')
    },
    rangemode: {
        valType: 'enumerated',
        values: ['normal', 'tozero', 'nonnegative'],
        dflt: 'normal',
        editType: 'plot',
        description: [
            'If *normal*, the range is computed in relation to the extrema',
            'of the input data.',
            'If *tozero*`, the range extends to 0,',
            'regardless of the input data',
            'If *nonnegative*, the range is non-negative,',
            'regardless of the input data.',
            'Applies only to linear axes.'
        ].join(' ')
    },
    range: {
        valType: 'info_array',
        items: [
            {valType: 'any', editType: 'axrange', impliedEdits: {'^autorange': false}, anim: true},
            {valType: 'any', editType: 'axrange', impliedEdits: {'^autorange': false}, anim: true}
        ],
        editType: 'axrange',
        impliedEdits: {'autorange': false},
        anim: true,
        description: [
            'Sets the range of this axis.',
            'If the axis `type` is *log*, then you must take the log of your',
            'desired range (e.g. to set the range from 1 to 100,',
            'set the range from 0 to 2).',
            'If the axis `type` is *date*, it should be date strings,',
            'like date data, though Date objects and unix milliseconds',
            'will be accepted and converted to strings.',
            'If the axis `type` is *category*, it should be numbers,',
            'using the scale where each category is assigned a serial',
            'number from zero in the order it appears.'
        ].join(' ')
    },
    fixedrange: {
        valType: 'boolean',
        dflt: false,
        editType: 'calc',
        description: [
            'Determines whether or not this axis is zoom-able.',
            'If true, then zoom is disabled.'
        ].join(' ')
    },
    // scaleanchor: not used directly, just put here for reference
    // values are any opposite-letter axis id
    scaleanchor: {
        valType: 'enumerated',
        values: [
            constants.idRegex.x.toString(),
            constants.idRegex.y.toString()
        ],
        editType: 'plot',
        description: [
            'If set to another axis id (e.g. `x2`, `y`), the range of this axis',
            'changes together with the range of the corresponding axis',
            'such that the scale of pixels per unit is in a constant ratio.',
            'Both axes are still zoomable, but when you zoom one, the other will',
            'zoom the same amount, keeping a fixed midpoint.',
            '`constrain` and `constraintoward` determine how we enforce the constraint.',
            'You can chain these, ie `yaxis: {scaleanchor: *x*}, xaxis2: {scaleanchor: *y*}`',
            'but you can only link axes of the same `type`.',
            'The linked axis can have the opposite letter (to constrain the aspect ratio)',
            'or the same letter (to match scales across subplots).',
            'Loops (`yaxis: {scaleanchor: *x*}, xaxis: {scaleanchor: *y*}` or longer) are redundant',
            'and the last constraint encountered will be ignored to avoid possible',
            'inconsistent constraints via `scaleratio`.',
            'Note that setting axes simultaneously in both a `scaleanchor` and a `matches` constraint',
            'is currently forbidden.'
        ].join(' ')
    },
    scaleratio: {
        valType: 'number',
        min: 0,
        dflt: 1,
        editType: 'plot',
        description: [
            'If this axis is linked to another by `scaleanchor`, this determines the pixel',
            'to unit scale ratio. For example, if this value is 10, then every unit on',
            'this axis spans 10 times the number of pixels as a unit on the linked axis.',
            'Use this for example to create an elevation profile where the vertical scale',
            'is exaggerated a fixed amount with respect to the horizontal.'
        ].join(' ')
    },
    constrain: {
        valType: 'enumerated',
        values: ['range', 'domain'],
        editType: 'plot',
        description: [
            'If this axis needs to be compressed (either due to its own `scaleanchor` and',
            '`scaleratio` or those of the other axis), determines how that happens:',
            'by increasing the *range*, or by decreasing the *domain*.',
            'Default is *domain* for axes containing image traces, *range* otherwise.'
        ].join(' ')
    },
    // constraintoward: not used directly, just put here for reference
    constraintoward: {
        valType: 'enumerated',
        values: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
        editType: 'plot',
        description: [
            'If this axis needs to be compressed (either due to its own `scaleanchor` and',
            '`scaleratio` or those of the other axis), determines which direction we push',
            'the originally specified plot area. Options are *left*, *center* (default),',
            'and *right* for x axes, and *top*, *middle* (default), and *bottom* for y axes.'
        ].join(' ')
    },
    matches: {
        valType: 'enumerated',
        values: [
            constants.idRegex.x.toString(),
            constants.idRegex.y.toString()
        ],
        editType: 'calc',
        description: [
            'If set to another axis id (e.g. `x2`, `y`), the range of this axis',
            'will match the range of the corresponding axis in data-coordinates space.',
            'Moreover, matching axes share auto-range values, category lists and',
            'histogram auto-bins.',
            'Note that setting axes simultaneously in both a `scaleanchor` and a `matches` constraint',
            'is currently forbidden.',
            'Moreover, note that matching axes must have the same `type`.'
        ].join(' ')
    },

    rangebreaks: templatedArray('rangebreak', {
        enabled: {
            valType: 'boolean',
            dflt: true,
            editType: 'calc',
            description: [
                'Determines whether this axis rangebreak is enabled or disabled.',
                'Please note that `rangebreaks` only work for *date* axis type.'
            ].join(' ')
        },

        bounds: {
            valType: 'info_array',
            items: [
                {valType: 'any', editType: 'calc'},
                {valType: 'any', editType: 'calc'}
            ],
            editType: 'calc',
            description: [
                'Sets the lower and upper bounds of this axis rangebreak.',
                'Can be used with `pattern`.'
            ].join(' ')
        },

        pattern: {
            valType: 'enumerated',
            values: [DAY_OF_WEEK, HOUR, ''],
            editType: 'calc',
            description: [
                'Determines a pattern on the time line that generates breaks.',
                'If *' + DAY_OF_WEEK + '* - days of the week in English e.g. \'Sunday\' or `\sun\`',
                '(matching is case-insensitive and considers only the first three characters),',
                'as well as Sunday-based integers between 0 and 6.',
                'If *' + HOUR + '* - hour (24-hour clock) as decimal numbers between 0 and 24.',
                'for more info.',
                'Examples:',
                '- { pattern: \'' + DAY_OF_WEEK + '\', bounds: [6, 1] }',
                ' or simply { bounds: [\'sat\', \'mon\'] }',
                '  breaks from Saturday to Monday (i.e. skips the weekends).',
                '- { pattern: \'' + HOUR + '\', bounds: [17, 8] }',
                '  breaks from 5pm to 8am (i.e. skips non-work hours).'
            ].join(' ')
        },

        values: {
            valType: 'info_array',
            freeLength: true,
            editType: 'calc',
            items: {
                valType: 'any',
                editType: 'calc'
            },
            description: [
                'Sets the coordinate values corresponding to the rangebreaks.',
                'An alternative to `bounds`.',
                'Use `dvalue` to set the size of the values along the axis.'
            ].join(' ')
        },
        dvalue: {
            // TODO could become 'any' to add support for 'months', 'years'
            valType: 'number',
            editType: 'calc',
            min: 0,
            dflt: ONEDAY,
            description: [
                'Sets the size of each `values` item.',
                'The default is one day in milliseconds.'
            ].join(' ')
        },

        /*
        gap: {
            valType: 'number',
            min: 0,
            dflt: 0, // for *date* axes, maybe something else for *linear*
            editType: 'calc',
            description: [
                'Sets the gap distance between the start and the end of this rangebreak.',
                'Use with `gapmode` to set the unit of measurement.'
            ].join(' ')
        },
        gapmode: {
            valType: 'enumerated',
            values: ['pixels', 'fraction'],
            dflt: 'pixels',
            editType: 'calc',
            description: [
                'Determines if the `gap` value corresponds to a pixel length',
                'or a fraction of the plot area.'
            ].join(' ')
        },
        */

        // To complete https://github.com/plotly/plotly.js/issues/4210
        // we additionally need `gap` and make this work on *linear*, and
        // possibly all other cartesian axis types. We possibly would also need
        // some style attributes controlling the zig-zag on the corresponding
        // axis.

        editType: 'calc'
    }),

    // ticks
    tickmode: {
        valType: 'enumerated',
        values: ['auto', 'linear', 'array'],
        editType: 'ticks',
        impliedEdits: {tick0: undefined, dtick: undefined},
        description: [
            'Sets the tick mode for this axis.',
            'If *auto*, the number of ticks is set via `nticks`.',
            'If *linear*, the placement of the ticks is determined by',
            'a starting position `tick0` and a tick step `dtick`',
            '(*linear* is the default value if `tick0` and `dtick` are provided).',
            'If *array*, the placement of the ticks is set via `tickvals`',
            'and the tick text is `ticktext`.',
            '(*array* is the default value if `tickvals` is provided).'
        ].join(' ')
    },
    nticks: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        editType: 'ticks',
        description: [
            'Specifies the maximum number of ticks for the particular axis.',
            'The actual number of ticks will be chosen automatically to be',
            'less than or equal to `nticks`.',
            'Has an effect only if `tickmode` is set to *auto*.'
        ].join(' ')
    },
    tick0: {
        valType: 'any',
        editType: 'ticks',
        impliedEdits: {tickmode: 'linear'},
        description: [
            'Sets the placement of the first tick on this axis.',
            'Use with `dtick`.',
            'If the axis `type` is *log*, then you must take the log of your starting tick',
            '(e.g. to set the starting tick to 100, set the `tick0` to 2)',
            'except when `dtick`=*L<f>* (see `dtick` for more info).',
            'If the axis `type` is *date*, it should be a date string, like date data.',
            'If the axis `type` is *category*, it should be a number, using the scale where',
            'each category is assigned a serial number from zero in the order it appears.'
        ].join(' ')
    },
    dtick: {
        valType: 'any',
        editType: 'ticks',
        impliedEdits: {tickmode: 'linear'},
        description: [
            'Sets the step in-between ticks on this axis. Use with `tick0`.',
            'Must be a positive number, or special strings available to *log* and *date* axes.',
            'If the axis `type` is *log*, then ticks are set every 10^(n*dtick) where n',
            'is the tick number. For example,',
            'to set a tick mark at 1, 10, 100, 1000, ... set dtick to 1.',
            'To set tick marks at 1, 100, 10000, ... set dtick to 2.',
            'To set tick marks at 1, 5, 25, 125, 625, 3125, ... set dtick to log_10(5), or 0.69897000433.',
            '*log* has several special values; *L<f>*, where `f` is a positive number,',
            'gives ticks linearly spaced in value (but not position).',
            'For example `tick0` = 0.1, `dtick` = *L0.5* will put ticks at 0.1, 0.6, 1.1, 1.6 etc.',
            'To show powers of 10 plus small digits between, use *D1* (all digits) or *D2* (only 2 and 5).',
            '`tick0` is ignored for *D1* and *D2*.',
            'If the axis `type` is *date*, then you must convert the time to milliseconds.',
            'For example, to set the interval between ticks to one day,',
            'set `dtick` to 86400000.0.',
            '*date* also has special values *M<n>* gives ticks spaced by a number of months.',
            '`n` must be a positive integer.',
            'To set ticks on the 15th of every third month, set `tick0` to *2000-01-15* and `dtick` to *M3*.',
            'To set ticks every 4 years, set `dtick` to *M48*'
        ].join(' ')
    },
    tickvals: {
        valType: 'data_array',
        editType: 'ticks',
        description: [
            'Sets the values at which ticks on this axis appear.',
            'Only has an effect if `tickmode` is set to *array*.',
            'Used with `ticktext`.'
        ].join(' ')
    },
    ticktext: {
        valType: 'data_array',
        editType: 'ticks',
        description: [
            'Sets the text displayed at the ticks position via `tickvals`.',
            'Only has an effect if `tickmode` is set to *array*.',
            'Used with `tickvals`.'
        ].join(' ')
    },
    ticks: {
        valType: 'enumerated',
        values: ['outside', 'inside', ''],
        editType: 'ticks',
        description: [
            'Determines whether ticks are drawn or not.',
            'If **, this axis\' ticks are not drawn.',
            'If *outside* (*inside*), this axis\' are drawn outside (inside)',
            'the axis lines.'
        ].join(' ')
    },
    tickson: {
        valType: 'enumerated',
        values: ['labels', 'boundaries'],
        dflt: 'labels',
        editType: 'ticks',
        description: [
            'Determines where ticks and grid lines are drawn with respect to their',
            'corresponding tick labels.',
            'Only has an effect for axes of `type` *category* or *multicategory*.',
            'When set to *boundaries*, ticks and grid lines are drawn half a category',
            'to the left/bottom of labels.'
        ].join(' ')
    },
    ticklabelmode: {
        valType: 'enumerated',
        values: ['instant', 'period'],
        dflt: 'instant',
        editType: 'ticks',
        description: [
            'Determines where tick labels are drawn with respect to their',
            'corresponding ticks and grid lines.',
            'Only has an effect for axes of `type` *date*',
            'When set to *period*, tick labels are drawn in the middle of the period',
            'between ticks.'
        ].join(' ')
    },
    // ticklabelposition: not used directly, as values depend on direction (similar to side)
    // left/right options are for x axes, and top/bottom options are for y axes
    ticklabelposition: {
        valType: 'enumerated',
        values: [
            'outside', 'inside',
            'outside top', 'inside top',
            'outside left', 'inside left',
            'outside right', 'inside right',
            'outside bottom', 'inside bottom'
        ],
        dflt: 'outside',
        editType: 'calc',
        description: [
            'Determines where tick labels are drawn with respect to the axis',
            'Please note that',
            'top or bottom has no effect on x axes or when `ticklabelmode` is set to *period*.',
            'Similarly',
            'left or right has no effect on y axes or when `ticklabelmode` is set to *period*.',
            'Has no effect on *multicategory* axes or when `tickson` is set to *boundaries*.',
            'When used on axes linked by `matches` or `scaleanchor`,',
            'no extra padding for inside labels would be added by autorange,',
            'so that the scales could match.'
        ].join(' ')
    },
    ticklabeloverflow: {
        valType: 'enumerated',
        values: [
            'allow',
            'hide past div',
            'hide past domain'
        ],
        editType: 'calc',
        description: [
            'Determines how we handle tick labels that would overflow either the graph div or the domain of the axis.',
            'The default value for inside tick labels is *hide past domain*.',
            'Otherwise on *category* and *multicategory* axes the default is *allow*.',
            'In other cases the default is *hide past div*.'
        ].join(' ')
    },
    mirror: {
        valType: 'enumerated',
        values: [true, 'ticks', false, 'all', 'allticks'],
        dflt: false,
        editType: 'ticks+layoutstyle',
        description: [
            'Determines if the axis lines or/and ticks are mirrored to',
            'the opposite side of the plotting area.',
            'If *true*, the axis lines are mirrored.',
            'If *ticks*, the axis lines and ticks are mirrored.',
            'If *false*, mirroring is disable.',
            'If *all*, axis lines are mirrored on all shared-axes subplots.',
            'If *allticks*, axis lines and ticks are mirrored',
            'on all shared-axes subplots.'
        ].join(' ')
    },
    ticklen: {
        valType: 'number',
        min: 0,
        dflt: 5,
        editType: 'ticks',
        description: 'Sets the tick length (in px).'
    },
    tickwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        editType: 'ticks',
        description: 'Sets the tick width (in px).'
    },
    tickcolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        editType: 'ticks',
        description: 'Sets the tick color.'
    },
    showticklabels: {
        valType: 'boolean',
        dflt: true,
        editType: 'ticks',
        description: 'Determines whether or not the tick labels are drawn.'
    },
    automargin: {
        valType: 'boolean',
        dflt: false,
        editType: 'ticks',
        description: [
            'Determines whether long tick labels automatically grow the figure',
            'margins.'
        ].join(' ')
    },
    showspikes: {
        valType: 'boolean',
        dflt: false,
        editType: 'modebar',
        description: [
            'Determines whether or not spikes (aka droplines) are drawn for this axis.',
            'Note: This only takes affect when hovermode = closest'
        ].join(' ')
    },
    spikecolor: {
        valType: 'color',
        dflt: null,
        editType: 'none',
        description: 'Sets the spike color. If undefined, will use the series color'
    },
    spikethickness: {
        valType: 'number',
        dflt: 3,
        editType: 'none',
        description: 'Sets the width (in px) of the zero line.'
    },
    spikedash: extendFlat({}, dash, {dflt: 'dash', editType: 'none'}),
    spikemode: {
        valType: 'flaglist',
        flags: ['toaxis', 'across', 'marker'],
        dflt: 'toaxis',
        editType: 'none',
        description: [
            'Determines the drawing mode for the spike line',
            'If *toaxis*, the line is drawn from the data point to the axis the ',
            'series is plotted on.',

            'If *across*, the line is drawn across the entire plot area, and',
            'supercedes *toaxis*.',

            'If *marker*, then a marker dot is drawn on the axis the series is',
            'plotted on'
        ].join(' ')
    },
    spikesnap: {
        valType: 'enumerated',
        values: ['data', 'cursor', 'hovered data'],
        dflt: 'hovered data',
        editType: 'none',
        description: 'Determines whether spikelines are stuck to the cursor or to the closest datapoints.'
    },
    tickfont: fontAttrs({
        editType: 'ticks',
        description: 'Sets the tick font.'
    }),
    tickangle: {
        valType: 'angle',
        dflt: 'auto',
        editType: 'ticks',
        description: [
            'Sets the angle of the tick labels with respect to the horizontal.',
            'For example, a `tickangle` of -90 draws the tick labels',
            'vertically.'
        ].join(' ')
    },
    tickprefix: {
        valType: 'string',
        dflt: '',
        editType: 'ticks',
        description: 'Sets a tick label prefix.'
    },
    showtickprefix: {
        valType: 'enumerated',
        values: ['all', 'first', 'last', 'none'],
        dflt: 'all',
        editType: 'ticks',
        description: [
            'If *all*, all tick labels are displayed with a prefix.',
            'If *first*, only the first tick is displayed with a prefix.',
            'If *last*, only the last tick is displayed with a suffix.',
            'If *none*, tick prefixes are hidden.'
        ].join(' ')
    },
    ticksuffix: {
        valType: 'string',
        dflt: '',
        editType: 'ticks',
        description: 'Sets a tick label suffix.'
    },
    showticksuffix: {
        valType: 'enumerated',
        values: ['all', 'first', 'last', 'none'],
        dflt: 'all',
        editType: 'ticks',
        description: 'Same as `showtickprefix` but for tick suffixes.'
    },
    showexponent: {
        valType: 'enumerated',
        values: ['all', 'first', 'last', 'none'],
        dflt: 'all',
        editType: 'ticks',
        description: [
            'If *all*, all exponents are shown besides their significands.',
            'If *first*, only the exponent of the first tick is shown.',
            'If *last*, only the exponent of the last tick is shown.',
            'If *none*, no exponents appear.'
        ].join(' ')
    },
    exponentformat: {
        valType: 'enumerated',
        values: ['none', 'e', 'E', 'power', 'SI', 'B'],
        dflt: 'B',
        editType: 'ticks',
        description: [
            'Determines a formatting rule for the tick exponents.',
            'For example, consider the number 1,000,000,000.',
            'If *none*, it appears as 1,000,000,000.',
            'If *e*, 1e+9.',
            'If *E*, 1E+9.',
            'If *power*, 1x10^9 (with 9 in a super script).',
            'If *SI*, 1G.',
            'If *B*, 1B.'
        ].join(' ')
    },
    minexponent: {
        valType: 'number',
        dflt: 3,
        min: 0,
        editType: 'ticks',
        description: [
            'Hide SI prefix for 10^n if |n| is below this number.',
            'This only has an effect when `tickformat` is *SI* or *B*.'
        ].join(' ')
    },
    separatethousands: {
        valType: 'boolean',
        dflt: false,
        editType: 'ticks',
        description: [
            'If "true", even 4-digit integers are separated'
        ].join(' ')
    },
    tickformat: {
        valType: 'string',
        dflt: '',
        editType: 'ticks',
        description: descriptionWithDates('tick label')
    },
    tickformatstops: templatedArray('tickformatstop', {
        enabled: {
            valType: 'boolean',
            dflt: true,
            editType: 'ticks',
            description: [
                'Determines whether or not this stop is used.',
                'If `false`, this stop is ignored even within its `dtickrange`.'
            ].join(' ')
        },
        dtickrange: {
            valType: 'info_array',
            items: [
                {valType: 'any', editType: 'ticks'},
                {valType: 'any', editType: 'ticks'}
            ],
            editType: 'ticks',
            description: [
                'range [*min*, *max*], where *min*, *max* - dtick values',
                'which describe some zoom level, it is possible to omit *min*',
                'or *max* value by passing *null*'
            ].join(' ')
        },
        value: {
            valType: 'string',
            dflt: '',
            editType: 'ticks',
            description: [
                'string - dtickformat for described zoom level, the same as *tickformat*'
            ].join(' ')
        },
        editType: 'ticks'
    }),
    hoverformat: {
        valType: 'string',
        dflt: '',
        editType: 'none',
        description: descriptionWithDates('hover text')
    },
    // lines and grids
    showline: {
        valType: 'boolean',
        dflt: false,
        editType: 'ticks+layoutstyle',
        description: [
            'Determines whether or not a line bounding this axis is drawn.'
        ].join(' ')
    },
    linecolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        editType: 'layoutstyle',
        description: 'Sets the axis line color.'
    },
    linewidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        editType: 'ticks+layoutstyle',
        description: 'Sets the width (in px) of the axis line.'
    },
    showgrid: {
        valType: 'boolean',
        editType: 'ticks',
        description: [
            'Determines whether or not grid lines are drawn.',
            'If *true*, the grid lines are drawn at every tick mark.'
        ].join(' ')
    },
    gridcolor: {
        valType: 'color',
        dflt: colorAttrs.lightLine,
        editType: 'ticks',
        description: 'Sets the color of the grid lines.'
    },
    gridwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        editType: 'ticks',
        description: 'Sets the width (in px) of the grid lines.'
    },
    zeroline: {
        valType: 'boolean',
        editType: 'ticks',
        description: [
            'Determines whether or not a line is drawn at along the 0 value',
            'of this axis.',
            'If *true*, the zero line is drawn on top of the grid lines.'
        ].join(' ')
    },
    zerolinecolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        editType: 'ticks',
        description: 'Sets the line color of the zero line.'
    },
    zerolinewidth: {
        valType: 'number',
        dflt: 1,
        editType: 'ticks',
        description: 'Sets the width (in px) of the zero line.'
    },

    showdividers: {
        valType: 'boolean',
        dflt: true,
        editType: 'ticks',
        description: [
            'Determines whether or not a dividers are drawn',
            'between the category levels of this axis.',
            'Only has an effect on *multicategory* axes.'
        ].join(' ')
    },
    dividercolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        editType: 'ticks',
        description: [
            'Sets the color of the dividers',
            'Only has an effect on *multicategory* axes.'
        ].join(' ')
    },
    dividerwidth: {
        valType: 'number',
        dflt: 1,
        editType: 'ticks',
        description: [
            'Sets the width (in px) of the dividers',
            'Only has an effect on *multicategory* axes.'
        ].join(' ')
    },
    // TODO dividerlen: that would override "to label base" length?

    // positioning attributes
    // anchor: not used directly, just put here for reference
    // values are any opposite-letter axis id
    anchor: {
        valType: 'enumerated',
        values: [
            'free',
            constants.idRegex.x.toString(),
            constants.idRegex.y.toString()
        ],
        editType: 'plot',
        description: [
            'If set to an opposite-letter axis id (e.g. `x2`, `y`), this axis is bound to',
            'the corresponding opposite-letter axis.',
            'If set to *free*, this axis\' position is determined by `position`.'
        ].join(' ')
    },
    // side: not used directly, as values depend on direction
    // values are top, bottom for x axes, and left, right for y
    side: {
        valType: 'enumerated',
        values: ['top', 'bottom', 'left', 'right'],
        editType: 'plot',
        description: [
            'Determines whether a x (y) axis is positioned',
            'at the *bottom* (*left*) or *top* (*right*)',
            'of the plotting area.'
        ].join(' ')
    },
    // overlaying: not used directly, just put here for reference
    // values are false and any other same-letter axis id that's not
    // itself overlaying anything
    overlaying: {
        valType: 'enumerated',
        values: [
            'free',
            constants.idRegex.x.toString(),
            constants.idRegex.y.toString()
        ],
        editType: 'plot',
        description: [
            'If set a same-letter axis id, this axis is overlaid on top of',
            'the corresponding same-letter axis, with traces and axes visible for both',
            'axes.',
            'If *false*, this axis does not overlay any same-letter axes.',
            'In this case, for axes with overlapping domains only the highest-numbered',
            'axis will be visible.'
        ].join(' ')
    },
    layer: {
        valType: 'enumerated',
        values: ['above traces', 'below traces'],
        dflt: 'above traces',
        editType: 'plot',
        description: [
            'Sets the layer on which this axis is displayed.',
            'If *above traces*, this axis is displayed above all the subplot\'s traces',
            'If *below traces*, this axis is displayed below all the subplot\'s traces,',
            'but above the grid lines.',
            'Useful when used together with scatter-like traces with `cliponaxis`',
            'set to *false* to show markers and/or text nodes above this axis.'
        ].join(' ')
    },
    domain: {
        valType: 'info_array',
        items: [
            {valType: 'number', min: 0, max: 1, editType: 'plot'},
            {valType: 'number', min: 0, max: 1, editType: 'plot'}
        ],
        dflt: [0, 1],
        editType: 'plot',
        description: [
            'Sets the domain of this axis (in plot fraction).'
        ].join(' ')
    },
    position: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        editType: 'plot',
        description: [
            'Sets the position of this axis in the plotting space',
            '(in normalized coordinates).',
            'Only has an effect if `anchor` is set to *free*.'
        ].join(' ')
    },
    categoryorder: {
        valType: 'enumerated',
        values: [
            'trace', 'category ascending', 'category descending', 'array',
            'total ascending', 'total descending',
            'min ascending', 'min descending',
            'max ascending', 'max descending',
            'sum ascending', 'sum descending',
            'mean ascending', 'mean descending',
            'median ascending', 'median descending'
        ],
        dflt: 'trace',
        editType: 'calc',
        description: [
            'Specifies the ordering logic for the case of categorical variables.',
            'By default, plotly uses *trace*, which specifies the order that is present in the data supplied.',
            'Set `categoryorder` to *category ascending* or *category descending* if order should be determined by',
            'the alphanumerical order of the category names.',
            'Set `categoryorder` to *array* to derive the ordering from the attribute `categoryarray`. If a category',
            'is not found in the `categoryarray` array, the sorting behavior for that attribute will be identical to',
            'the *trace* mode. The unspecified categories will follow the categories in `categoryarray`.',
            'Set `categoryorder` to *total ascending* or *total descending* if order should be determined by the',
            'numerical order of the values.',
            'Similarly, the order can be determined by the min, max, sum, mean or median of all the values.'
        ].join(' ')
    },
    categoryarray: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the order in which categories on this axis appear.',
            'Only has an effect if `categoryorder` is set to *array*.',
            'Used with `categoryorder`.'
        ].join(' ')
    },
    uirevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of user-driven changes in axis `range`,',
            '`autorange`, and `title` if in `editable: true` configuration.',
            'Defaults to `layout.uirevision`.'
        ].join(' ')
    },
    editType: 'calc',

    _deprecated: {
        autotick: {
            valType: 'boolean',
            editType: 'ticks',
            description: [
                'Obsolete.',
                'Set `tickmode` to *auto* for old `autotick` *true* behavior.',
                'Set `tickmode` to *linear* for `autotick` *false*.'
            ].join(' ')
        },
        title: {
            valType: 'string',
            editType: 'ticks',
            description: [
                'Value of `title` is no longer a simple *string* but a set of sub-attributes.',
                'To set the axis\' title, please use `title.text` now.'
            ].join(' ')
        },
        titlefont: fontAttrs({
            editType: 'ticks',
            description: [
                'Former `titlefont` is now the sub-attribute `font` of `title`.',
                'To customize title font properties, please use `title.font` now.'
            ].join(' ')
        })
    }
};
