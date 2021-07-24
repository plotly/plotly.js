var minimist = require('minimist');
var pixelmatch = require('pixelmatch');
var PNG = require('pngjs').PNG;
var fs = require('fs');

var common = require('../../tasks/util/common');
var getMockList = require('./assets/get_mock_list');
var getImagePaths = require('./assets/get_image_paths');

/**
 *  Image pixel comparison test script.
 *
 *  Called by `tasks/test_image.sh in `npm run test-image`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining which mock(s) are to be tested
 *
 *  Examples:
 *
 *  Run all tests:
 *
 *      npm run test-image
 *
 *  Run the 'contour_nolines' test:
 *
 *      npm run test-image -- contour_nolines
 *
 *  Run all gl3d image test
 *
 *      npm run test-image -- gl3d_*
 *
 */

var argv = minimist(process.argv.slice(2), {});

// If no pattern is provided, all mocks are compared
if(argv._.length === 0) {
    argv._.push('');
}

// Build list of mocks to compare
var allMockList = [];
argv._.forEach(function(pattern) {
    var mockList = getMockList(pattern);

    if(mockList.length === 0) {
        throw 'No mocks found with pattern ' + pattern;
    }

    allMockList = allMockList.concat(mockList);
});

// To get rid of duplicates
function unique(value, index, self) {
    return self.indexOf(value) === index;
}
allMockList = allMockList.filter(unique);

// keeping track of the mocks that passed image test in initial attempt to bump d3
var whiteList = [
    '0',
    '1',
    '10',
    '12',
    '13',
    '14',
    '17',
    '18',
    '20',
    '21',
    '25',
    '26',
    '27',
    '2dhistogram_contour_subplots_bingroup',
    '2dhistogram_contour_subplots',
    '30',
    '31',
    '32',
    '4',
    'animation_bar',
    'annotations',
    'arrow-markers',
    'axes_breaks-dtick_auto',
    'axes_breaks-dtick_hourly',
    'axes_breaks-gridlines',
    'axes_breaks-matches',
    'axes_breaks-night_autorange-reversed',
    'axes_breaks-ohlc_candlestick_box',
    'axes_breaks-overlap',
    'axes_breaks-reversed-without-pattern',
    'axes_breaks-round-weekdays',
    'axes_breaks-tickvals',
    'axes_breaks-values',
    'axes_breaks-weekends_autorange-reversed',
    'axes_breaks-weekends-weeknights',
    'axes_breaks',
    'axes_category_ascending',
    'axes_category_categoryarray_truncated_tails',
    'axes_category_categoryarray',
    'axes_category_descending_with_gaps',
    'axes_category_descending',
    'axes_category_null',
    'axes_chain_scaleanchor_matches_inside-ticklabels',
    'axes_chain_scaleanchor_matches',
    'axes_chain_scaleanchor_matches2_inside-ticklabels',
    'axes_chain_scaleanchor_matches2',
    'axes_custom-ticks_log-date',
    'axes_enumerated_ticks',
    'axes_free_default',
    'axes_line_noticklabels',
    'axes_matches-linear-categories',
    'axes_range_mode',
    'axes_reversed',
    'axes_scaleanchor-with-matches',
    'axes_scaleanchor',
    'axes_visible-false',
    'axis-title-standoff',
    'axislabel_separatethousands',
    'bar_and_histogram',
    'bar_annotation_max_range_eq_category',
    'bar_bargap0',
    'bar_gantt-chart',
    'bar_hide_nulls',
    'bar_nonnumeric_sizes',
    'bar_show_narrow',
    'bar_unhidden',
    'bar-alignment-offset',
    'bar-autotext-log-size-axes',
    'bar-grouping-vs-defaults',
    'bar-like_traces_no-tozero_stack',
    'bar-offsetgroups',
    'basic_bar',
    'basic_error_bar',
    'blank-bar-outsidetext',
    'box_grouped-multicategory',
    'box_horz_notched',
    'box_notched-inverted-end',
    'box_notched',
    'box_plot_jitter',
    'box_precomputed-stats',
    'box_single-group',
    'box_violin_just_pts',
    'box_with-empty-1st-trace',
    'box-alignment-offset',
    'box-violin-multicategory-on-val-axis',
    'box-violin-x0-category-position',
    'boxplots_outliercolordflt',
    'boxplots_undefined_vals',
    'bubblechart',
    'canada_geo_projections',
    'carpet_axis',
    'carpet_ordering-labeling',
    'carpet_rounded-off-edgepath-gt',
    'carpet_rounded-off-edgepath-lt',
    'carpet_rounded-off-edgepath',
    'carpet_template',
    'category_dtick_3',
    'category-autorange',
    'cheater_constraint_greater_than_with_hill',
    'cheater_constraint_greater_than_with_valley',
    'cheater_constraint_greater_than',
    'cheater_constraint_inner_range_hi_top_with_hill',
    'cheater_constraint_inner_range_hi_top_with_valley',
    'cheater_constraint_inner_range_hi_top',
    'cheater_constraint_inner_range_lo_top_with_hill',
    'cheater_constraint_inner_range_lo_top_with_valley',
    'cheater_constraint_inner_range_lo_top',
    'cheater_constraint_inner_range_with_hill',
    'cheater_constraint_inner_range_with_valley',
    'cheater_constraint_inner_range',
    'cheater_constraint_less_than_with_hill',
    'cheater_constraint_less_than_with_valley',
    'cheater_constraint_less_than',
    'cheater_constraint_outer_range_hi_top_with_hill',
    'cheater_constraint_outer_range_hi_top_with_valley',
    'cheater_constraint_outer_range_hi_top',
    'cheater_constraint_outer_range_lo_top_with_hill',
    'cheater_constraint_outer_range_lo_top_with_valley',
    'cheater_constraint_outer_range_lo_top',
    'cheater_constraint_outer_range_with_hill',
    'cheater_constraint_outer_range_with_valley',
    'cheater_constraint_outer_range',
    'cheaterslope_noticklabels',
    'cheaterslope',
    'cliponaxis_false-dates-log',
    'cliponaxis_false',
    'connectgaps_2d',
    'contour_constraints_edge_cases',
    'contour_constraints_equal_boundary_minmax',
    'contour_constraints',
    'contour_heatmap_coloring',
    'contour_label-font-size',
    'contour_label-reversed-axes',
    'contour_label-reversed-xy',
    'contour_label-thousands-suffix',
    'contour_lines_coloring',
    'contour_log',
    'contour_match_edges',
    'contour_scatter',
    'date_axes_period_breaks_automargin',
    'date_axes_period',
    'date_axes_period2',
    'date_axes_side_top',
    'date_axes',
    'date_histogram',
    'distance_satellite',
    'domain_refs',
    'empty',
    'error_bar_asymmetric_array',
    'error_bar_asymmetric_constant',
    'error_bar_bar_ids',
    'error_bar_horizontal',
    'error_bar_sqrt',
    'fake_violins',
    'font-wishlist',
    'fonts',
    'funnelarea_fonts',
    'funnelarea_label0_dlabel',
    'funnelarea_labels_colors_text',
    'funnelarea_no_scalegroup_various_domain',
    'funnelarea_no_scalegroup_various_ratios_and_domain',
    'funnelarea_no_scalegroup_various_ratios',
    'funnelarea_scalegroup_two',
    'funnelarea_scalegroup_various_ratios_and_domain',
    'funnelarea_scalegroup_various_ratios',
    'funnelarea_simple',
    'funnelarea_style',
    'geo_across-antimeridian',
    'geo_aitoff-sinusoidal',
    'geo_big-frame',
    'geo_canadian-cities',
    'geo_centering',
    'geo_country-names-text-chart',
    'geo_country-names',
    'geo_custom-colorscale',
    'geo_custom-geojson',
    'geo_featureidkey',
    'geo_fill',
    'geo_fitbounds-geojson',
    'geo_fitbounds-locations',
    'geo_fitbounds-scopes',
    'geo_lakes-and-rivers',
    'geo_miterlimit-base-layers',
    'geo_multi-geos',
    'geo_multiple-usa-choropleths',
    'geo_point-selection',
    'geo_scattergeo-locations',
    'geo_scattergeo-out-of-usa',
    'geo_text_chart_arrays',
    'geo_winkel-tripel',
    'gl2d_10',
    'gl2d_12',
    'gl2d_14',
    'gl2d_17',
    'gl2d_annotations',
    'gl2d_axes_labels2',
    'gl2d_axes_range_mode',
    'gl2d_clean-number',
    'gl2d_clustering',
    'gl2d_error_bars_log',
    'gl2d_fill-ordering',
    'gl2d_fonts',
    'gl2d_horiz-lines',
    'gl2d_line_aligned',
    'gl2d_line_dash',
    'gl2d_line_limit',
    'gl2d_line_select',
    'gl2d_marker_line_width',
    'gl2d_marker_size',
    'gl2d_marker_symbols',
    'gl2d_multiple-traces-axes',
    'gl2d_no-clustering',
    'gl2d_no-clustering2',
    'gl2d_open_marker_line_width',
    'gl2d_point-selection',
    'gl2d_pointcloud-basic',
    'gl2d_scatter-color-clustering',
    'gl2d_scatter-colorscale-points',
    'gl2d_scatter-continuous-clustering',
    'gl2d_scatter-marker-line-colorscales',
    'gl2d_scatter2d-multiple-colors',
    'gl2d_scattergl_gaps',
    'gl2d_selectedpoints',
    'gl2d_shapes_below_traces',
    'gl2d_size_margins',
    'gl2d_subplots_anchor',
    'gl2d_text_chart_basic',
    'gl2d_text_chart_single-string',
    'gl2d_text_chart_styling',
    'gl2d_texttemplate',
    'gl2d_tick-labels',
    'gl2d_ultra_zoom',
    'gl3d_annotations_orthographic',
    'gl3d_annotations',
    'gl3d_axes-visible-false',
    'gl3d_cone-autorange',
    'gl3d_cone-lighting',
    'gl3d_cone-with-streamtube',
    'gl3d_delaunay',
    'gl3d_directions-isosurface1',
    'gl3d_directions-isosurface2',
    'gl3d_directions-streamtube1',
    'gl3d_directions-streamtube2',
    'gl3d_directions-volume1',
    'gl3d_error_bars_log_2',
    'gl3d_error_bars_log',
    'gl3d_errorbars_sqrt',
    'gl3d_errorbars_xy',
    'gl3d_errorbars_zx',
    'gl3d_errorbars_zy',
    'gl3d_formatted-text-on-multiple-lines',
    'gl3d_indicator_scatter3d',
    'gl3d_marker_symbols',
    'gl3d_marker-arrays',
    'gl3d_marker-color',
    'gl3d_mesh3d_enable-alpha-with-rgba-color',
    'gl3d_mesh3d_surface_lighting',
    'gl3d_mesh3d-missing-colors',
    'gl3d_mirror-ticks',
    'gl3d_opacity-surface',
    'gl3d_scatter3d_line3d_error3d_enable-alpha-with-rgba-color',
    'gl3d_scatter3d_line3d_error3d_transparent-with-zero-alpha',
    'gl3d_scatter3d-different-align-texts',
    'gl3d_set-ranges',
    'gl3d_snowden_altered',
    'gl3d_snowden',
    'gl3d_streamtube-wind',
    'gl3d_surface_opacity_match_mesh3d',
    'gl3d_surface-lighting',
    'gl3d_tetrahedra',
    'gl3d_text-weirdness',
    'gl3d_ticks-milliseconds',
    'gl3d_traces-with-opacity',
    'gl3d_triangle',
    'gl3d_world-cals',
    'gl3d_z-range',
    'global_font',
    'glpolar_scatter',
    'groups-over-matching-axes',
    'heatmap_brick_padding',
    'heatmap_small_aspect-ratio',
    'heatmap-with-zero-category',
    'hist_0_to_093',
    'hist_0_to_1_midpoints',
    'hist_003_to_093',
    'hist_003_to_1',
    'hist_all_integer_n50',
    'hist_all_integer',
    'hist_almost_integer',
    'hist_category',
    'hist_cum_stacked',
    'hist_summed',
    'hist_valid_ses_y',
    'hist_valid_ses',
    'histogram_colorscale',
    'histogram_overlay-bingroup',
    'histogram-offsetgroups',
    'histogram2d_bingroup',
    'hists-on-matching-axes',
    'icicle_coffee-maxdepth3-all-directions',
    'icicle_coffee-maxdepth3',
    'icicle_coffee',
    'icicle_first',
    'icicle_flare',
    'icicle_leaf-opacity-level',
    'icicle_root-sort',
    'icicle_textposition',
    'icicle_with-without_values_template',
    'icicle_with-without_values',
    'image_adventurer',
    'image_astronaut_source',
    'image_axis_reverse',
    'image_axis_type',
    'image_cat',
    'image_colormodel',
    'image_non_numeric',
    'image_opacity',
    'image_source_axis_reverse_zsmooth',
    'image_source_axis_reverse',
    'image_with_gaps',
    'image_zmin_zmax',
    'indicator_attrs',
    'indicator_bignumber',
    'indicator_datacard',
    'indicator_datacard2',
    'indicator_datacard3',
    'indicator_format_extremes',
    'indicator_scatter',
    'japanese',
    'legend_horizontal_one_row',
    'legend_horizontal_testwrap',
    'legend_horizontal',
    'legend_inside',
    'legend_margin-autoexpand-false',
    'legend_mathjax_title_and_items',
    'legend_style',
    'legendgroup_horizontal_bg_fit',
    'legendrank',
    'legendrank2',
    'line_grid_color',
    'line_grid_width',
    'log_lines_fills',
    'mapbox_angles',
    'mapbox_bubbles-text',
    'mapbox_carto-style',
    'mapbox_choropleth-raw-geojson',
    'mapbox_custom-style',
    'mapbox_fill',
    'mapbox_geojson-attributes',
    'mapbox_layers',
    'mapbox_stamen-style',
    'mapbox_symbol-text',
    'mapbox_texttemplate',
    'mapbox_white-bg-style',
    'marker_line_width',
    'marker_symbols',
    'matching-categories',
    'mathjax',
    'mirror-all-vs-allticks',
    'multicategory_histograms',
    'multicategory-inside-ticks',
    'multicategory-sorting',
    'multicategory-y',
    'percent_error_bar',
    'period_positioning8',
    'period_positioning9',
    'pie_fonts',
    'pie_label0_dlabel',
    'pie_labels_colors_text',
    'pie_scale_textpos_hideslices',
    'pie_simple',
    'pie_sort_direction',
    'pie_style_arrays',
    'pie_style',
    'pie_textpad_radial',
    'pie_textpad_tangential',
    'pie_title_pull',
    'pie_title_subscript',
    'plot_types',
    'point-selection',
    'point-selection2',
    'polar_bar-width-base-offset',
    'polar_blank',
    'polar_dates',
    'polar_direction',
    'polar_fills',
    'polar_hole',
    'polar_line',
    'polar_long-category-angular-labels',
    'polar_polygon-bars',
    'polar_polygon-grids',
    'polar_r0dr-theta0dtheta',
    'polar_radial-range',
    'polar_scatter',
    'polar_sector',
    'polar_template',
    'polar_ticks',
    'range_slider_multiple',
    'reversed-axis-dividers',
    'sankey_circular_large',
    'sankey_circular_process',
    'sankey_circular_simple',
    'sankey_circular_simple2',
    'sankey_circular',
    'sankey_large_padding',
    'sankey_link_concentration',
    'sankey_messy',
    'sankey_subplots_circular',
    'sankey_subplots',
    'sankey_x_y',
    'scatter_fill_self_opacity',
    'scatter-marker-line-colorscales',
    'shapes_below_traces',
    'shapes',
    'simple_annotation',
    'size_margins',
    'splom_0',
    'splom_array-styles',
    'splom_dates',
    'splom_large',
    'splom_lower-nodiag-matching',
    'splom_lower-nodiag',
    'splom_mismatched-axis-types',
    'splom_multi-axis-type',
    'splom_nodiag',
    'splom_ragged-via-axes',
    'splom_ragged-via-visible-false',
    'splom_symbol_numbers',
    'splom_upper-nodiag',
    'splom_with-cartesian',
    'stacked_area_groupby',
    'style_bar',
    'sunburst_branchvalues-total-almost-equal',
    'sunburst_coffee-maxdepth3',
    'sunburst_coffee',
    'sunburst_first',
    'sunburst_flare',
    'sunburst_inside-text-orientation_clock',
    'sunburst_inside-text-orientation',
    'sunburst_level-depth',
    'sunburst_textfit',
    'sunburst_textpad_tangential',
    'sunburst_values',
    'sunburst_with-without_values',
    'sunburst_zero_values_textfit',
    'table_plain_birds',
    'table_ragged',
    'table_wrapped_birds',
    'ternary_axis_layers',
    'ternary_lines',
    'ternary_markers',
    'ternary_noticks',
    'ternary_simple',
    'ternary-mathjax',
    'text_chart_basic',
    'text_chart_single-string',
    'text_chart_styling',
    'text_export',
    'texttemplate_scatter',
    'tick_attributes',
    'tick_prefix_suffix_exponent',
    'tick_prefix_suffix',
    'tick-datafn',
    'tickformat',
    'tickformatstops',
    'ticklabeloverflow-0',
    'ticklabeloverflow-1',
    'ticklabeloverflow-2',
    'ticklabelposition-0',
    'ticklabelposition-overlay2',
    'tickson_boundaries',
    'treemap_coffee-maxdepth3',
    'treemap_coffee',
    'treemap_first',
    'treemap_flare',
    'treemap_fonts_nocolor',
    'treemap_fonts_withcolor',
    'treemap_level-depth',
    'treemap_packings',
    'treemap_pad_mirror',
    'treemap_pad_transpose',
    'treemap_root-color',
    'treemap_sunburst_basic',
    'treemap_sunburst_marker_colors',
    'treemap_textposition',
    'treemap_transpose_nopad',
    'treemap_values',
    'treemap_with-without_values_template',
    'treemap_with-without_values',
    'uniformtext_bar_edgecase1',
    'uniformtext_bar_edgecase2',
    'uniformtext_bar_edgecase4',
    'uniformtext_bar_edgecase5',
    'uniformtext_bar_edgecase6',
    'uniformtext_bar_edgecase7',
    'uniformtext_bar_edgecase8',
    'uniformtext_funnelarea',
    'uniformtext_icicle',
    'uniformtext_pie_outside',
    'uniformtext_sunburst_inside-text-orientation',
    'uniformtext_sunburst_treemap',
    'uniformtext_treemap_coffee-maxdepth3',
    'uniformtext_treemap',
    'various_geo_projections',
    'vertical-tickangles',
    'violin_bandwidth-edge-cases',
    'violin_box_multiple_widths',
    'violin_box_overlay',
    'violin_negative_sides_w_points',
    'violin_non-linear',
    'violin_old-faithful',
    'violin_one-sided',
    'violin_positive_and_negative',
    'violin_positive_sides_w_points',
    'violin_side-by-side',
    'violin_style',
    'violin_zoomed-in',
    'violin-offsetgroups',
    'waterfall_gap0',
    'worldcup'
];

var succeeded = [];
var skipped = [];
var failed = [];
var fail = function(mockName) {
    if(failed.indexOf(mockName) === -1) {
        failed.push(mockName);
    }
};
for(var i = 0; i < allMockList.length; i++) {
    var mockName = allMockList[i];

    // skip blacklist
    if([
        'mapbox_density0-legend',
        'mapbox_osm-style'
    ].indexOf(mockName) !== -1) {
        continue;
    }

    var imagePaths = getImagePaths(mockName);
    var base = imagePaths.baseline;
    var test = imagePaths.test;

    if(!common.doesFileExist(test)) {
        console.log('- skip:', mockName);
        skipped.push(mockName);
        continue;
    }
    console.log('+ test:', mockName);

    var img0 = PNG.sync.read(fs.readFileSync(base));
    var img1 = PNG.sync.read(fs.readFileSync(test));
    var s0, s1, key;

    key = 'width';
    s0 = img0[key];
    s1 = img0[key];
    if(s0 !== s1) {
        console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
        fail(mockName);
    }

    key = 'height';
    s0 = img0[key];
    s1 = img0[key];
    if(s0 !== s1) {
        console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
        fail(mockName);
    }

    var width = img0.width;
    var height = img0.height;

    var diff = new PNG({
        width: width,
        height: height
    });

    var isMapbox = mockName.substr(0, 7) === 'mapbox_';
    var isOtherFlaky = [
        // list flaky mocks other than mapbox:
        'gl3d_bunny-hull'
    ].indexOf(mockName) !== -1;

    var shouldBePixelPerfect = !(isMapbox || isOtherFlaky);

    var numDiffPixels = pixelmatch(img0.data, img1.data, diff.data, width, height, {
        threshold: shouldBePixelPerfect ? 0 :
            [
                // more flaky
                'mapbox_angles',
                'mapbox_layers',
                'mapbox_geojson-attributes'
            ].indexOf(mockName) !== -1 ? 0.5 : 0.15
    });

    if(numDiffPixels) {
        fs.writeFileSync(imagePaths.diff, PNG.sync.write(diff));

        console.error('pixels do not match: ' + numDiffPixels);
        fail(mockName);
    } else {
        // remove when identical
        fs.unlinkSync(imagePaths.test);

        succeeded.push(mockName);
    }
}

console.log('Total succeeded before:', whiteList.length);
console.log('Total succeeded now:', succeeded.length);
console.log(JSON.stringify({ succeeded: succeeded }, null, 2));

if(failed.length || skipped.length) {
    for(var k = 0; k < failed.length; k++) {
        var f = failed[k];
        if(whiteList.indexOf(f) !== -1) {
            console.error('"' + f + '" used to pass; but now it does not pass!');
        }
    }

    throw JSON.stringify({
        failed: failed,
        skipped: skipped
    }, null, 2);
}
