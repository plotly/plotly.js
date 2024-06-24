var minimist = require('minimist');
var path = require('path');
var fs = require('fs');

var plotlyNode = require('./util/plotly_node');
var Plotly = plotlyNode('build/plotly.js');

var pathToRoot = path.join(__dirname, '..');
var pathToMocks = path.join(pathToRoot, 'test', 'image', 'mocks');

var list = [];

// command line options
var args = minimist(process.argv.slice(2), {});
if(args._.length) {
    // test listed mock(s)
    list = args._;
} else {
    // no mock listed, test all excluding the black list
    list = fs.readdirSync(pathToMocks)
        .filter(function(e) { return e.indexOf('.json') !== -1; })
        .map(function(e) { return e.replace('.json', ''); })
        .filter(notBlackListed);
}

var fail;
var failedMocks = [];

for(var i = 0; i < list.length; i++) {
    var name = list[i];
    console.log('validating ' + name);

    var filename = path.join(pathToMocks, name + '.json');
    var fig = JSON.parse(fs.readFileSync(filename));
    var out = Plotly.validate(fig.data, fig.layout);

    fail = false;
    assert(name, out);
    if(fail) failedMocks.push(name);
}

if(failedMocks.length) {
    var error = 'Failed at ' + JSON.stringify({mocks: failedMocks}, null, 2);
    throw error;
}

function expectToBe(actual, expected) {
    if(actual !== expected) {
        console.error('Expected ' + actual + ' to be ' + expected);
        fail = true;
    }
}

function assert(name, v) {
    var success = true;
    if(!v) {
        expectToBe(v, undefined);
        if(v !== undefined) success = false;
    } else {
        v.forEach(function(e) {
            var condition = (
                e.code === 'invisible' ||
                e.code === 'dynamic' ||
                e.path[e.path.length - 1] === 'coloraxis'
            );
            expectToBe(condition, true); // we accept invisible, dynamic and coloraxis for now
            if(!condition) {
                console.log('file:', name);
                console.log(JSON.stringify(v, null, 2));
                success = false;
                return success;
            }
        });
    }
    return success;
}

function notBlackListed(name) {
    return [
        // has transforms See https://github.com/plotly/plotly.js/issues/4759
        'gl2d_transforms',
        'polar_transforms',
        'smith_transforms',
        'transforms',

        // has contourcarpet See https://github.com/plotly/plotly.js/issues/5669
        'airfoil',
        'h-colorbar_airfoil',
        'cheater',
        'cheater_constraint_greater_than',
        'cheater_constraint_greater_than_with_hill',
        'cheater_constraint_greater_than_with_valley',
        'cheater_constraint_inner_range',
        'cheater_constraint_inner_range_hi_top',
        'cheater_constraint_inner_range_hi_top_with_hill',
        'cheater_constraint_inner_range_hi_top_with_valley',
        'cheater_constraint_inner_range_lo_top',
        'cheater_constraint_inner_range_lo_top_with_hill',
        'cheater_constraint_inner_range_lo_top_with_valley',
        'cheater_constraint_inner_range_with_hill',
        'cheater_constraint_inner_range_with_valley',
        'cheater_constraint_less_than',
        'cheater_constraint_less_than_with_hill',
        'cheater_constraint_less_than_with_valley',
        'cheater_constraint_outer_range',
        'cheater_constraint_outer_range_hi_top',
        'cheater_constraint_outer_range_hi_top_with_hill',
        'cheater_constraint_outer_range_hi_top_with_valley',
        'cheater_constraint_outer_range_lo_top',
        'cheater_constraint_outer_range_lo_top_with_hill',
        'cheater_constraint_outer_range_lo_top_with_valley',
        'cheater_constraint_outer_range_with_hill',
        'cheater_constraint_outer_range_with_valley',
        'cheater_constraints',
        'cheater_contour',
        'cheater_fully_filled',
        'cheater_smooth',

        // other
        '1',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31',
        '32',
        'annotations',
        'annotations-autorange',
        'axes_booleans',
        'axes_labels',
        'axes-ticks',
        'candlestick_double-y-axis',
        'candlestick_rangeslider_thai',
        'category-autorange',
        'contour_match_edges',
        'dendrogram',
        'error_bar_style',
        'fake_violins',
        'fonts',
        'font-variant-bar',
        'font-weight-bar',
        'geo_africa-insets',
        'gl2d_10',
        'gl2d_12',
        'gl2d_14',
        'gl2d_17',
        'gl2d_annotations',
        'gl2d_axes_booleans',
        'gl2d_axes_labels',
        'gl2d_fill_trace_tozero_order',
        'gl2d_fonts',
        'gl2d_layout_image',
        'gl2d_marker_coloraxis',
        'gl2d_pointcloud-basic',
        'gl2d_rgb_dont_accept_alpha_scattergl',
        'gl2d_scatter-marker-line-colorscales',
        'gl2d_scatter-subplot-panel',
        'gl2d_shape_line',
        'gl2d_text_chart_basic',
        'gl2d_text_chart_single-string',
        'gl2d_text_chart_styling',
        'gl2d_texttemplate',
        'gl3d_autocolorscale',
        'gl3d_bunny',
        'gl3d_bunny-hull',
        'gl3d_coloraxes',
        'gl3d_contour-lines',
        'gl3d_contour-lines2',
        'gl3d_convex-hull',
        'gl3d_cufflinks',
        'gl3d_directions-volume1',
        'gl3d_ibm-plot',
        'gl3d_line-colorscale-with-markers',
        'gl3d_opacity-surface',
        'gl3d_scatter-colorscale-marker',
        'gl3d_scatter3d-align-texts',
        'gl3d_surface_opacity-and-opacityscale',
        'gl3d_surface_opacityscale_contour',
        'gl3d_surface-heatmap-treemap_transparent-colorscale',
        'gl3d_surface-lighting',
        'gl3d_traces-with-legend',
        'gl3d_traces-with-opacity',
        'gl3d_volume_multiple-traces',
        'gl3d_z-range',
        'glpolar_scatter',
        'heatmap_small_aspect-ratio',
        'histogram_errorbars_inherit_color',
        'indicator_attrs',
        'indicator_bignumber',
        'indicator_bullet',
        'indicator_datacard',
        'indicator_datacard2',
        'indicator_gauge',
        'indicator_scatter',
        'japanese',
        'layout_image',
        'layout_metatext',
        'legend_horizontal',
        'legend_horizontal_autowrap',
        'legend-constant-itemsizing',
        'matching-missing-axes',
        'mathjax',
        'ohlc_first',
        'pattern_bars',
        'pattern_fgcolor_overlay_fillmode',
        'pattern_with_colorscale',
        'petrophysics',
        'plot_types',
        'polar_blank',
        'polar_dates',
        'range_slider_box',
        'shapes_fixed_size',
        'splom_ragged-via-axes',
        'stacked_area_duplicates',
        'table_plain_birds',
        'table_wrapped_birds',
        'text_chart_basic',
        'text_chart_single-string',
        'text_chart_styling',
        'texttemplate',
        'texttemplate_scatter',
        'titles-avoid-labels',
        'trace_metatext',
        'updatemenus',
        'violin_non-linear',
        'violin_ridgeplot',
        'violin_style',
        'waterfall_funnel_texttemplate_date',
        'yaxis-over-yaxis2',
        'yignbu_heatmap',
        'yiorrd_heatmap'
    ].indexOf(name) === -1;
}
