var Plotly = require('@lib/index');

var list = [
    '0',
    '1',
    '4',
    '5',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
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
    '2dhistogram_contour_subplots',
    '2dhistogram_contour_subplots_bingroup',
    'airfoil',
    'animation',
    'animation_bar',
    'annotations',
    'annotations-autorange',
    'arrow-markers',
    'automargin-large-margins',
    'automargin-large-margins-both-sides',
    'automargin-large-margins-horizontal',
    'automargin-narrow-indicator',
    'automargin-mirror-all',
    'automargin-mirror-allticks',
    'automargin-multiline-titles',
    'automargin-push-x-extra',
    'automargin-push-y-extra',
    'automargin-rangeslider-and-sidepush',
    'automargin-small-width',
    'automargin-superimposed-axes',
    'automargin-title-standoff',
    'autorange-tozero-rangemode',
    'axes_booleans',
    'axes_breaks',
    'axes_breaks-candlestick',
    'axes_breaks-candlestick2',
    'axes_breaks-contour1d',
    'axes_breaks-contour2d',
    'axes_breaks-dtick_auto',
    'axes_breaks-dtick_hourly',
    'axes_breaks-finance',
    'axes_breaks-gridlines',
    'axes_breaks-heatmap1d',
    'axes_breaks-heatmap2d',
    'axes_breaks-histogram2d',
    'axes_breaks-night_autorange-reversed',
    'axes_breaks-ohlc_candlestick_box',
    'axes_breaks-overlap',
    'axes_breaks-rangeslider',
    'axes_breaks-reversed-without-pattern',
    'axes_breaks-round-weekdays',
    'axes_breaks-tickvals',
    'axes_breaks-values',
    'axes_breaks-weekends_autorange-reversed',
    'axes_breaks-weekends-weeknights',
    'axes_category_ascending',
    'axes_category_categoryarray',
    'axes_category_categoryarray_truncated_tails',
    'axes_category_descending',
    'axes_category_descending_with_gaps',
    'axes_category_null',
    'axes_chain_scaleanchor_matches',
    'axes_chain_scaleanchor_matches2',
    'axes_chain_scaleanchor_matches_inside-ticklabels',
    'axes_chain_scaleanchor_matches2_inside-ticklabels',
    'axes_custom-ticks_log-date',
    'axes_enumerated_ticks',
    'axes_free_default',
    'axes_labels',
    'axes_line_noticklabels',
    'axes_lines',
    'axes_linked_date_autorange',
    'axes_matches-linear-categories',
    'axes_range_manual',
    'axes_range_mode',
    'axes_range_type',
    'axes_reversed',
    'axes_scaleanchor',
    'axes_scaleanchor-constrain-domain-fixedrange',
    'axes_scaleanchor-with-matches',
    'axes_visible-false',
    'axes-autotype-empty',
    'axes-ticks',
    'axis_automargin_zero_margins',
    'axis-title-standoff',
    'axislabel_separatethousands',
    'bar_and_histogram',
    'bar_attrs_group',
    'bar_attrs_group_norm',
    'bar_attrs_overlay',
    'bar_attrs_relative',
    'bar_autorange-above-zero',
    'bar_autorange-above-zero-normalized',
    'bar_axis_textangle_outside',
    'bar_bargap0',
    'bar_cliponaxis-false',
    'bar_display_height_zero',
    'bar_display_height_zero_no_line_width',
    'bar_display_height_zero_only_line_width',
    'bar_errorbars_inherit_color',
    'bar_gantt-chart',
    'bar_group_percent',
    'bar_hide_nulls',
    'bar_line',
    'bar_marker_array',
    'bar_annotation_max_range_eq_category',
    'bar_multiline_labels',
    'bar_nonnumeric_sizes',
    'bar_show_narrow',
    'bar_stack-with-gaps',
    'bar_stackrelative_negative',
    'bar_stackrelativeto100_negative',
    'bar_stackto1',
    'bar_stackto100_negative',
    'bar_unhidden',
    'bar-alignment-offset',
    'bar-autotext-log-size-axes',
    'bar-colorscale-colorbar',
    'bar-grouping-vs-defaults',
    'bar-insidetext-log-size-axis',
    'bar-like_textangle45',
    'bar-like_textangle60',
    'bar-like_traces_no-tozero',
    'bar-like_traces_no-tozero_negative',
    'bar-like_traces_no-tozero_stack',
    'bar-like_traces_tozero',
    'bar-marker-line-colorscales',
    'bar-offsetgroups',
    'bar-with-milliseconds',
    'basic_area',
    'basic_bar',
    'basic_error_bar',
    'basic_heatmap',
    'basic_line',
    'benchmarks',
    'binding',
    'blackbody_heatmap',
    'blank-bar-outsidetext',
    'bluered_heatmap',
    'box_grouped',
    'box_grouped_horz',
    'box_grouped_mean_descending',
    'box_grouped-multicategory',
    'box_horz_notched',
    'box_log_scale',
    'box_notched',
    'box_notched-inverted-end',
    'box_plot_jitter',
    'box_plot_jitter_edge_cases',
    'box_precomputed-stats',
    'box_quartile-methods',
    'box_single-group',
    'box_violin_just_pts',
    'box_with-empty-1st-trace',
    'box-alignment-offset',
    'box-violin-multicategory-on-val-axis',
    'box-violin-x0-category-position',
    'boxplots_outliercolordflt',
    'boxplots_undefined_vals',
    'bubble_markersize0',
    'bubble_nonnumeric-sizes',
    'bubblechart',
    'candlestick_double-y-axis',
    'candlestick_rangeslider_thai',
    'carpet_axis',
    'carpet_ordering-labeling',
    'carpet_rounded-off-edgepath',
    'carpet_rounded-off-edgepath-gt',
    'carpet_rounded-off-edgepath-lt',
    'carpet_template',
    'category_dtick_3',
    'category-autorange',
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
    'cheaterslope',
    'cheaterslope_noticklabels',
    'cividis_heatmap',
    'cliponaxis_false',
    'cliponaxis_false-dates-log',
    'cmid-zmid',
    'colorbar_enumerated_ticks',
    'colorbar_tick_prefix_suffix',
    'colorbar_tickformat',
    'colorscale_constraint',
    'colorscale_opacity',
    'colorscale_template',
    'connectgaps_2d',
    'contour_constraints',
    'contour_constraints_edge_cases',
    'contour_constraints_equal_boundary_minmax',
    'contour_doublemerge',
    'contour_edge_cases',
    'contour_heatmap_coloring',
    'contour_heatmap_coloring_reversescale',
    'contour_label-font-size',
    'contour_label-formatting-via-colorbar',
    'contour_label-reversed-axes',
    'contour_label-reversed-xy',
    'contour_label-thousands-suffix',
    'contour_legend',
    'contour_legend-coloraxis',
    'contour_legend-colorscale',
    'contour_lines_coloring',
    'contour_log',
    'contour_match_edges',
    'contour_nolines',
    'contour_scatter',
    'contour_transposed',
    'contour_transposed-irregular',
    'contour_valid_ses',
    'contour_xyz-gaps-on-sides',
    'contour-heatmap-coloring-set-contours',
    'custom_colorscale',
    'custom_size_subplot',
    'date_axes',
    'date_axes_side_top',
    'date_axes_period',
    'date_axes_period2',
    'date_axes_period_breaks_automargin',
    'date_histogram',
    'dendrogram',
    'display-text_zero-number',
    'domain_refs',
    'domain_ref_axis_types',
    'earth_heatmap',
    'electric_heatmap',
    'empty',
    'error_bar_asymmetric_array',
    'error_bar_asymmetric_constant',
    'error_bar_bar',
    'error_bar_bar_ids',
    'error_bar_horizontal',
    'error_bar_layers',
    'error_bar_sqrt',
    'error_bar_style',
    'fake_violins',
    'finance_multicategory',
    'finance_style',
    'finance_subplots_categories',
    'font-wishlist',
    'fonts',
    'funnel_11',
    'funnel_attrs',
    'funnel_axis',
    'funnel_axis_textangle',
    'funnel_axis_textangle_outside',
    'funnel_axis_textangle_start-end',
    'funnel_axis_with_other_traces',
    'funnel_cliponaxis-false',
    'funnel_custom',
    'funnel_date-axes',
    'funnel_gap0',
    'funnel_horizontal_group_basic',
    'funnel_horizontal_stack_basic',
    'funnel_horizontal_stack_more',
    'funnel_multicategory',
    'funnel_nonnumeric_sizes',
    'funnel_vertical_overlay_custom_arrays',
    'funnel-grouping-vs-defaults',
    'funnel-offsetgroups',
    'funnelarea_aggregated',
    'funnelarea_fonts',
    'funnelarea_label0_dlabel',
    'funnelarea_labels_colors_text',
    'funnelarea_line_width',
    'funnelarea_no_scalegroup_various_domain',
    'funnelarea_no_scalegroup_various_ratios',
    'funnelarea_no_scalegroup_various_ratios_and_domain',
    'funnelarea_pie_colorways',
    'funnelarea_scalegroup_two',
    'funnelarea_scalegroup_various_ratios',
    'funnelarea_scalegroup_various_ratios_and_domain',
    'funnelarea_simple',
    'funnelarea_style',
    'funnelarea_title_multiple',
    'funnelarea_with_other_traces',
    'geo_across-antimeridian',
    'geo_africa-insets',
    'geo_aitoff-sinusoidal',
    'geo_bg-color',
    'geo_big-frame',
    'geo_bubbles-colorscales',
    'geo_bubbles-sizeref',
    'geo_canadian-cities',
    'geo_centering',
    'geo_choropleth-legend',
    'geo_choropleth-text',
    'geo_choropleth-usa',
    'geo_choropleth-usa_legend',
    'geo_conic-conformal',
    'geo_connectgaps',
    'geo_country-names',
    'geo_country-names-text-chart',
    'geo_custom-colorscale',
    'geo_custom-geojson',
    'geo_europe-bubbles',
    'geo_featureidkey',
    'geo_fill',
    'geo_first',
    'geo_fitbounds-geojson',
    'geo_fitbounds-locations',
    'geo_fitbounds-scopes',
    'geo_kavrayskiy7',
    'geo_lakes-and-rivers',
    'geo_legendonly',
    'geo_miterlimit-base-layers',
    'geo_multi-geos',
    'geo_multiple-usa-choropleths',
    'geo_orthographic',
    'geo_point-selection',
    'geo_scattergeo-locations',
    'geo_scattergeo-out-of-usa',
    'geo_second',
    'geo_skymap',
    'geo_stereographic',
    'geo_text_chart_arrays',
    'geo_tick0',
    'geo_usa-states',
    'geo_usa-states-on-world-scope',
    'geo_visible_false_override_template',
    'geo_winkel-tripel',
    'gl2d_10',
    'gl2d_12',
    'gl2d_14',
    'gl2d_17',
    'gl2d_annotations',
    'gl2d_axes_booleans',
    'gl2d_axes_labels',
    'gl2d_axes_labels2',
    'gl2d_axes_lines',
    'gl2d_axes_range_manual',
    'gl2d_axes_range_mode',
    'gl2d_axes_range_type',
    'gl2d_clean-number',
    'gl2d_clustering',
    'gl2d_connect_gaps',
    'gl2d_date_axes',
    'gl2d_error_bars',
    'gl2d_error_bars_log',
    'gl2d_fill_trace_tozero_order',
    'gl2d_fill-ordering',
    'gl2d_fonts',
    'gl2d_heatmapgl',
    'gl2d_heatmapgl_discrete',
    'gl2d_horiz-lines',
    'gl2d_layout_image',
    'gl2d_line_aligned',
    'gl2d_line_dash',
    'gl2d_line_limit',
    'gl2d_line_select',
    'gl2d_lines_almost_horizontal_vertical',
    'gl2d_marker_coloraxis',
    'gl2d_marker_line_width',
    'gl2d_marker_size',
    'gl2d_marker_symbols',
    'gl2d_multiple_subplots',
    'gl2d_multiple-traces-axes',
    'gl2d_multiple-traces-axes-labels',
    'gl2d_no-clustering',
    'gl2d_no-clustering2',
    'gl2d_open_marker_line_width',
    'gl2d_order_error',
    'gl2d_parcoords',
    'gl2d_parcoords_1',
    'gl2d_parcoords_2',
    'gl2d_parcoords_256_colors',
    'gl2d_parcoords_60_dims',
    'gl2d_parcoords_blocks',
    'gl2d_parcoords_coloraxis',
    'gl2d_parcoords_constraints',
    'gl2d_parcoords_large',
    'gl2d_parcoords_out-of-range_selected-above-below',
    'gl2d_parcoords_out-of-range_selected-all',
    'gl2d_parcoords_out-of-range_selected-below',
    'gl2d_parcoords_out-of-range_selected-none',
    'gl2d_parcoords_rgba_colorscale',
    'gl2d_parcoords_select_first_last_enum',
    'gl2d_parcoords_style_labels',
    'gl2d_parcoords_tick_format',
    'gl2d_period_positioning',
    'gl2d_point-selection',
    'gl2d_pointcloud-basic',
    'gl2d_rgb_dont_accept_alpha_scattergl',
    'gl2d_scatter_fill_self_next',
    'gl2d_scatter_fill_self_next_vs_nogl',
    'gl2d_scatter-color-clustering',
    'gl2d_scatter-colorscale-colorbar',
    'gl2d_scatter-colorscale-points',
    'gl2d_scatter-continuous-clustering',
    'gl2d_scatter-marker-line-colorscales',
    'gl2d_scatter-subplot-panel',
    'gl2d_scatter2d-multiple-colors',
    'gl2d_scattergl_errorbars_inherit_color',
    'gl2d_scattergl_gaps',
    'gl2d_scattergl_simple_line_reversed_ranges',
    'gl2d_selectedpoints',
    'gl2d_shape_line',
    'gl2d_shapes_below_traces',
    'gl2d_simple_inset',
    'gl2d_size_margins',
    'gl2d_stacked_coupled_subplots',
    'gl2d_stacked_subplots',
    'gl2d_subplots_anchor',
    'gl2d_symbol_numbers',
    'gl2d_text_chart_arrays',
    'gl2d_text_chart_basic',
    'gl2d_text_chart_invalid-arrays',
    'gl2d_text_chart_single-string',
    'gl2d_text_chart_styling',
    'gl2d_texttemplate',
    'gl2d_tick-labels',
    'gl2d_transforms',
    'gl2d_ultra_zoom',
    'gl3d_annotations',
    'gl3d_annotations_orthographic',
    'gl3d_autocolorscale',
    'gl3d_autorange-zero',
    'gl3d_axes-visible-false',
    'gl3d_bunny',
    'gl3d_bunny_cell-area',
    'gl3d_bunny-hull',
    'gl3d_chrisp-nan-1',
    'gl3d_coloraxes',
    'gl3d_colormap256',
    'gl3d_cone-absolute',
    'gl3d_cone-autorange',
    'gl3d_cone-lighting',
    'gl3d_cone-newplot_reversed_ranges',
    'gl3d_cone-rossler',
    'gl3d_cone-simple',
    'gl3d_cone-single',
    'gl3d_cone-wind',
    'gl3d_cone-with-streamtube',
    'gl3d_contour-lines',
    'gl3d_contour-lines2',
    'gl3d_convex-hull',
    'gl3d_cube',
    'gl3d_cufflinks',
    'gl3d_delaunay',
    'gl3d_directions-isosurface1',
    'gl3d_directions-isosurface2',
    'gl3d_directions-streamtube1',
    'gl3d_directions-streamtube2',
    'gl3d_directions-volume1',
    'gl3d_error_bars_log',
    'gl3d_error_bars_log_2',
    'gl3d_errorbars_sqrt',
    'gl3d_errorbars_xy',
    'gl3d_errorbars_zx',
    'gl3d_errorbars_zy',
    'gl3d_formatted-text-on-multiple-lines',
    'gl3d_ibm-plot',
    'gl3d_indicator_scatter3d',
    'gl3d_isosurface_1single-surface_middle-range',
    'gl3d_isosurface_2surfaces-checker_spaceframe',
    'gl3d_isosurface_5more-surfaces_between-ranges',
    'gl3d_isosurface_9more-surfaces_between-ranges_orthographic',
    'gl3d_isosurface_log-axis_slices_surface-fill',
    'gl3d_isosurface_math',
    'gl3d_isosurface_multiple-traces',
    'gl3d_isosurface_out_of_iso_range_case',
    'gl3d_isosurface_thin_caps_different_dims',
    'gl3d_isosurface_thin_slices_transparent',
    'gl3d_isosurface_transparent',
    'gl3d_isosurface_uneven-scales_ranges_iso-null',
    'gl3d_isosurface_with_surface-pattern',
    'gl3d_isosurface_xycaps_volume_slices',
    'gl3d_line_rectangle_render',
    'gl3d_line-colorscale-with-markers',
    'gl3d_log-axis',
    'gl3d_log-axis-big',
    'gl3d_marker_symbols',
    'gl3d_marker-arrays',
    'gl3d_marker-color',
    'gl3d_mesh3d_cell-intensity',
    'gl3d_mesh3d_coloring',
    'gl3d_mesh3d_enable-alpha-with-rgba-color',
    'gl3d_mesh3d_surface_lighting',
    'gl3d_mesh3d_surface3d_scatter3d_line3d_error3d_log_reversed_ranges',
    'gl3d_mesh3d_surface3d_scatter3d_orthographic',
    'gl3d_mesh3d-missing-colors',
    'gl3d_mirror-ticks',
    'gl3d_multi-scene',
    'gl3d_multiple-scatter3d-traces',
    'gl3d_nan-holes',
    'gl3d_opacity-scaling-spikes',
    'gl3d_opacity-surface',
    'gl3d_parametric_surface_data_precision',
    'gl3d_perspective_tick_distances',
    'gl3d_projection-traces',
    'gl3d_reversescale',
    'gl3d_rgb_dont_accept_alpha_scatter3d',
    'gl3d_ribbons',
    'gl3d_scatter-color-array',
    'gl3d_scatter-color-line-gradient',
    'gl3d_scatter-color-mono-and-palette',
    'gl3d_scatter-colorscale-marker',
    'gl3d_scatter3d_errorbars_inherit_color',
    'gl3d_scatter3d_line3d_error3d_enable-alpha-with-rgba-color',
    'gl3d_scatter3d_line3d_error3d_transparent-with-zero-alpha',
    'gl3d_scatter3d-align-texts',
    'gl3d_scatter3d-blank-text',
    'gl3d_scatter3d-colorscale',
    'gl3d_scatter3d-colorscale-marker-and-line',
    'gl3d_scatter3d-colorscale-with-line',
    'gl3d_scatter3d-connectgaps',
    'gl3d_scatter3d-different-align-texts',
    'gl3d_scatter3d-texttemplate',
    'gl3d_set-ranges',
    'gl3d_snowden',
    'gl3d_snowden_altered',
    'gl3d_streamtube_reversed_ranges',
    'gl3d_streamtube-first',
    'gl3d_streamtube-simple',
    'gl3d_streamtube-thin',
    'gl3d_streamtube-wind',
    'gl3d_surface_after_heatmap',
    'gl3d_surface_connectgaps',
    'gl3d_surface_contour_precision',
    'gl3d_surface_contour_start-end-size',
    'gl3d_surface_intensity',
    'gl3d_surface_opacity_match_mesh3d',
    'gl3d_surface_opacity-and-opacityscale',
    'gl3d_surface_opacityscale_contour',
    'gl3d_surface_transparent-with-contours',
    'gl3d_surface-circular-colorscale',
    'gl3d_surface-circular-opacityscale',
    'gl3d_surface-heatmap-treemap_transparent-colorscale',
    'gl3d_surface-lighting',
    'gl3d_tetrahedra',
    'gl3d_text-weirdness',
    'gl3d_ticks-milliseconds',
    'gl3d_traces-with-legend',
    'gl3d_traces-with-opacity',
    'gl3d_transparent_same-depth',
    'gl3d_triangle',
    'gl3d_volume_airflow',
    'gl3d_volume_multiple-traces',
    'gl3d_volume_multiple-traces_one-cube',
    'gl3d_volume_opacityscale-iso',
    'gl3d_wire-surface',
    'gl3d_world-cals',
    'gl3d_xy-defined-ticks',
    'gl3d_z-range',
    'global_font',
    'glpolar_scatter',
    'glpolar_style',
    'glpolar_subplots',
    'greens_heatmap',
    'greys_heatmap',
    'grid_subplot_types',
    'grouped_bar',
    'groups-over-matching-axes',
    'heatmap_autocolor_negative',
    'heatmap_autocolor_positive',
    'heatmap_brick_padding',
    'heatmap_categoryorder',
    'heatmap_columnar',
    'heatmap_contour_irregular_bricks',
    'heatmap_legend',
    'heatmap_multi-trace',
    'heatmap_multicategory',
    'heatmap_shared_categories',
    'heatmap_small_aspect-ratio',
    'heatmap_xyz-dates-and-categories',
    'heatmap_xyz-gaps-on-sides',
    'heatmap-reverse-autocolorscale',
    'heatmap-with-zero-category',
    'hist_0_to_093',
    'hist_0_to_1_midpoints',
    'hist_003_to_093',
    'hist_003_to_1',
    'hist_all_integer',
    'hist_all_integer_n50',
    'hist_almost_integer',
    'hist_category',
    'hist_category_total_ascending',
    'hist_cum_stacked',
    'hist_grouped',
    'hist_multi',
    'hist_stacked',
    'hist_summed',
    'hist_valid_ses',
    'hist_valid_ses_y',
    'hist2d_summed',
    'histogram_barmode_relative',
    'histogram_colorscale',
    'histogram_errorbars_inherit_color',
    'histogram_overlay-bingroup',
    'histogram-offsetgroups',
    'histogram2d_bingroup',
    'histogram2d_bingroup-coloraxis',
    'histogram2d_legend',
    'histogram2d_legend-colorscale',
    'histogram2dcontour_bingroup-coloraxis',
    'histogram2dcontour_legend-coloraxis',
    'hists-on-matching-axes',
    'hot_heatmap',
    'image_adventurer',
    'image_astronaut_source',
    'image_axis_reverse',
    'image_axis_type',
    'image_cat',
    'image_colormodel',
    'image_non_numeric',
    'image_opacity',
    'image_source_axis_reverse',
    'image_source_axis_reverse_zsmooth',
    'image_with_gaps',
    'image_with_heatmap',
    'image_zmin_zmax',
    'indicator_attrs',
    'indicator_bignumber',
    'indicator_bullet',
    'indicator_datacard',
    'indicator_datacard2',
    'indicator_datacard3',
    'indicator_format_extremes',
    'indicator_gauge',
    'indicator_grid_template',
    'indicator_scatter',
    'japanese',
    'jet_heatmap',
    'labelled_heatmap',
    'layout_image',
    'layout_metatext',
    'layout-colorway',
    'legend_horizontal',
    'legend_horizontal_autowrap',
    'legend_horizontal_bg_fit',
    'legend_horizontal_groups',
    'legend_horizontal_one_row',
    'legend_horizontal_testwrap',
    'legend_horizontal_wrap-alll-lines',
    'legend_inside',
    'legend_itemwidth_dashline',
    'legend_labels',
    'legend_large_margin',
    'legend_margin-autoexpand-false',
    'legend_mathjax_title_and_items',
    'legend_negative_x',
    'legend_negative_x2',
    'legend_negative_y',
    'legend_outside',
    'legend_scroll',
    'legend_scroll_beyond_plotarea',
    'legend_scroll_with_title',
    'legend_small_horizontal',
    'legend_small_vertical',
    'legend_style',
    'legend_valign_middle',
    'legend_valign_top',
    'legend_visibility',
    'legend_x_push_margin_constrained',
    'legend-constant-itemsizing',
    'legendgroup',
    'legendgroup_bar-stack',
    'legendgroup_horizontal_bg_fit',
    'legendgroup_horizontal_wrapping',
    'line_grid_color',
    'line_grid_width',
    'line_scatter',
    'line_style',
    'log_lines_fills',
    'log-axis_no-minor_suffix-prefix',
    'long_axis_labels',
    'mapbox_0',
    'mapbox_angles',
    'mapbox_bubbles',
    'mapbox_bubbles-text',
    'mapbox_carto-style',
    'mapbox_choropleth-multiple',
    'mapbox_choropleth-raw-geojson',
    'mapbox_choropleth0',
    'mapbox_choropleth0-legend',
    'mapbox_connectgaps',
    'mapbox_custom-style',
    'mapbox_density-multiple',
    'mapbox_density-multiple_legend',
    'mapbox_density0',
    'mapbox_density0-legend',
    'mapbox_earthquake-density',
    'mapbox_fill',
    'mapbox_geojson-attributes',
    'mapbox_layers',
    'mapbox_osm-style',
    'mapbox_stamen-style',
    'mapbox_symbol-text',
    'mapbox_texttemplate',
    'mapbox_white-bg-style',
    'marker_colorscale_template',
    'marker_line_width',
    'marker_symbols',
    'matching-categories',
    'matching-missing-axes',
    'mathjax',
    'mirror-all-vs-allticks',
    'missing-category-order',
    'multicategory',
    'multicategory_histograms',
    'multicategory-inside-ticks',
    'multicategory-mirror',
    'multicategory-sorting',
    'multicategory-y',
    'multicategory2',
    'multiple_axes_double',
    'multiple_axes_multiple',
    'multiple_subplots',
    'ohlc_first',
    'overlaying-axis-lines',
    'parcats_bad-displayindex',
    'parcats_basic',
    'parcats_basic_freeform',
    'parcats_bundled',
    'parcats_bundled_reversed',
    'parcats_colorscale_template',
    'parcats_dark',
    'parcats_grid_subplots',
    'parcats_hoveron_color',
    'parcats_hoveron_dimension',
    'parcats_invisible_dimension',
    'parcats_numeric_sort',
    'parcats_reordered',
    'parcats_unbundled',
    'percent_error_bar',
    'period_positioning',
    'period_positioning2',
    'period_positioning3',
    'period_positioning4',
    'period_positioning5',
    'period_positioning6',
    'period_positioning7',
    'period_positioning8',
    'picnic_heatmap',
    'pie_aggregated',
    'pie_automargin',
    'pie_automargin-margin0',
    'pie_fonts',
    'pie_inside-text-orientation',
    'pie_label0_dlabel',
    'pie_labels_colors_text',
    'pie_legend_line_color_array',
    'pie_scale_textpos_hideslices',
    'pie_simple',
    'pie_sort_direction',
    'pie_style',
    'pie_style_arrays',
    'pie_textpad_radial',
    'pie_textpad_tangential',
    'pie_title_groupscale',
    'pie_title_middle_center',
    'pie_title_middle_center_multiline',
    'pie_title_multiple',
    'pie_title_pull',
    'pie_title_subscript',
    'pie_title_variations',
    'plot_types',
    'point-selection',
    'point-selection2',
    'polar_bar-overlay',
    'polar_bar-stacked',
    'polar_bar-width-base-offset',
    'polar_blank',
    'polar_categories',
    'polar_dates',
    'polar_direction',
    'polar_fills',
    'polar_funky-bars',
    'polar_hole',
    'polar_line',
    'polar_long-category-angular-labels',
    'polar_polygon-bars',
    'polar_polygon-grids',
    'polar_r0dr-theta0dtheta',
    'polar_radial-range',
    'polar_scatter',
    'polar_sector',
    'polar_subplots',
    'polar_template',
    'polar_ticks',
    'polar_transforms',
    'polar_wind-rose',
    'portland_heatmap',
    'pseudo_html',
    'range_selector',
    'range_selector_style',
    'range_slider',
    'range_slider_axes_double',
    'range_slider_axes_stacked',
    'range_slider_box',
    'range_slider_initial_expanded',
    'range_slider_initial_valid',
    'range_slider_legend_left',
    'range_slider_multiple',
    'range_slider_rangemode',
    'range_slider_reversed-range',
    'range_slider_top_axis',
    'rdbu_heatmap',
    'reversed-axis-dividers',
    'sankey_circular',
    'sankey_circular_large',
    'sankey_circular_process',
    'sankey_circular_simple',
    'sankey_circular_simple2',
    'sankey_energy',
    'sankey_energy_dark',
    'sankey_groups',
    'sankey_large_padding',
    'sankey_link_concentration',
    'sankey_messy',
    'sankey_subplots',
    'sankey_subplots_circular',
    'sankey_x_y',
    'scatter_category_total_descending',
    'scatter_errorbars_inherit_color',
    'scatter_fill_corner_cases',
    'scatter_fill_no_opacity',
    'scatter_fill_self_next',
    'scatter_fill_self_opacity',
    'scatter-colorscale-colorbar',
    'scatter-marker-line-colorscales',
    'scattercarpet',
    'scattercarpet-on-two-carpets',
    'scattercarpet-text',
    'shapes',
    'shapes_below_traces',
    'shapes_fixed_size',
    'shapes_move-and-reshape-lines',
    'shared_axes_subplots',
    'shared_coloraxes',
    'shared_coloraxes_contour',
    'show_legend',
    'simple_annotation',
    'simple_contour',
    'simple_inset',
    'simple_subplot',
    'size_margins',
    'sliders',
    'sort_by_total_matching_axes',
    'splom_0',
    'splom_array-styles',
    'splom_dates',
    'splom_iris',
    'splom_iris-matching',
    'splom_large',
    'splom_log',
    'splom_lower',
    'splom_lower-nodiag',
    'splom_lower-nodiag-matching',
    'splom_mismatched-axis-types',
    'splom_multi-axis-type',
    'splom_nodiag',
    'splom_ragged-via-axes',
    'splom_ragged-via-visible-false',
    'splom_symbol_numbers',
    'splom_upper',
    'splom_upper-nodiag',
    'splom_with-cartesian',
    'stacked_area',
    'stacked_area_duplicates',
    'stacked_area_groupby',
    'stacked_area_groups',
    'stacked_area_horz',
    'stacked_area_log',
    'stacked_bar',
    'stacked_coupled_subplots',
    'stacked_subplots',
    'stacked_subplots_shared_yaxis',
    'style_bar',
    'styling_names',
    'sunburst_branchvalues-total-almost-equal',
    'sunburst_coffee',
    'sunburst_coffee-maxdepth3',
    'sunburst_count_branches',
    'sunburst_first',
    'sunburst_flare',
    'sunburst_inside-text-orientation',
    'sunburst_inside-text-orientation_clock',
    'sunburst_level-depth',
    'sunburst_packages_colorscale_novalue',
    'sunburst_textfit',
    'sunburst_textpad_radial',
    'sunburst_textpad_tangential',
    'sunburst_values',
    'sunburst_values_colorscale',
    'sunburst_with-without_values',
    'sunburst_zero_values_textfit',
    'symbols_string-numbers',
    'table_latex_multitrace_scatter',
    'table_plain_birds',
    'table_ragged',
    'table_wrapped_birds',
    'template',
    'ternary_array_styles',
    'ternary_axis_layers',
    'ternary_fill',
    'ternary_lines',
    'ternary_markers',
    'ternary_multiple',
    'ternary_noticks',
    'ternary_simple',
    'ternary-mathjax',
    'text_chart_arrays',
    'text_chart_basic',
    'text_chart_invalid-arrays',
    'text_chart_single-string',
    'text_chart_styling',
    'text_export',
    'texttemplate',
    'texttemplate_scatter',
    'tick_attributes',
    'tick_prefix_suffix',
    'tick_prefix_suffix_exponent',
    'tick-datafn',
    'tick-increment',
    'tick-percent',
    'tickformat',
    'tickformatstops',
    'ticklabelposition-0',
    'ticklabelposition-1',
    'ticklabelposition-2',
    'ticklabelposition-3',
    'ticklabelposition-4',
    'ticklabelposition-a',
    'ticklabelposition-b',
    'ticklabelposition-c',
    'ticklabelposition-d',
    'tickson_boundaries',
    'titles-avoid-labels',
    'trace_metatext',
    'transforms',
    'treemap_coffee',
    'treemap_coffee-maxdepth3',
    'treemap_first',
    'treemap_flare',
    'treemap_fonts_nocolor',
    'treemap_fonts_withcolor',
    'treemap_level-depth',
    'treemap_packages_colorscale_allone',
    'treemap_packages_colorscale_novalue',
    'treemap_packings',
    'treemap_pad_mirror',
    'treemap_pad_transpose',
    'treemap_root-color',
    'treemap_sunburst_basic',
    'treemap_sunburst_marker_colors',
    'treemap_textfit',
    'treemap_textposition',
    'treemap_transpose_nopad',
    'treemap_values',
    'treemap_values_colorscale',
    'treemap_with-without_values',
    'treemap_with-without_values_template',
    'ultra_zoom',
    'ultra_zoom_fill',
    'uniformtext_bar_axis_textangle_inside',
    'uniformtext_bar_axis_textangle_outside',
    'uniformtext_bar_edgecase1',
    'uniformtext_bar_edgecase2',
    'uniformtext_bar_edgecase3',
    'uniformtext_bar_edgecase4',
    'uniformtext_bar_edgecase5',
    'uniformtext_bar_edgecase6',
    'uniformtext_bar_edgecase7',
    'uniformtext_bar_edgecase8',
    'uniformtext_bar-like_10_auto',
    'uniformtext_bar-like_8_horizontal',
    'uniformtext_bar-like_8_textangle',
    'uniformtext_bar-like_8_textangle45',
    'uniformtext_funnelarea',
    'uniformtext_pie_16_auto',
    'uniformtext_pie_8_horizontal',
    'uniformtext_pie_8_horizontal_center',
    'uniformtext_pie_8_radial',
    'uniformtext_pie_8_tangential',
    'uniformtext_pie_inside-text-orientation',
    'uniformtext_pie_outside',
    'uniformtext_pie_pull',
    'uniformtext_sunburst_inside-text-orientation',
    'uniformtext_sunburst_treemap',
    'uniformtext_treemap',
    'uniformtext_treemap_coffee-maxdepth3',
    'updatemenus',
    'updatemenus_positioning',
    'updatemenus_toggle',
    'vertical-tickangles',
    'violin_bandwidth-edge-cases',
    'violin_box_multiple_widths',
    'violin_box_overlay',
    'violin_grouped',
    'violin_grouped_horz-multicategory',
    'violin_log_scale',
    'violin_negative_sides_w_points',
    'violin_non-linear',
    'violin_old-faithful',
    'violin_one-sided',
    'violin_only_zeroes',
    'violin_positive_and_negative',
    'violin_positive_sides_w_points',
    'violin_ridgeplot',
    'violin_side-by-side',
    'violin_style',
    'violin_zoomed-in',
    'violin-offsetgroups',
    'viridis_heatmap',
    'waterfall_11',
    'waterfall_and_bar',
    'waterfall_and_histogram',
    'waterfall_attrs',
    'waterfall_axis',
    'waterfall_cliponaxis-false',
    'waterfall_custom',
    'waterfall_date-axes',
    'waterfall_funnel_texttemplate_date',
    'waterfall_gap0',
    'waterfall_line',
    'waterfall_months',
    'waterfall_multicategory',
    'waterfall_nonnumeric_sizes',
    'waterfall_profit-loss_2018_positive-negative',
    'waterfall_profit-loss_2018vs2019_overlay',
    'waterfall_profit-loss_2018vs2019_rectangle',
    'waterfall_profit-loss_2018vs2019_textinfo_base',
    'waterfall-grouping-vs-defaults',
    'waterfall-offsetgroups',
    'world-cals',
    'yaxis-over-yaxis2',
    'yignbu_heatmap',
    'yiorrd_heatmap',
    'zsmooth_methods'
];

var figs = {};
/* eslint dot-notation: 0*/

/* RUN this in the browser console to generate the list of requires
    var code = '';
    list.forEach(function(name) {
        code += "figs['" + name + "'] = require('@mocks/" + name + "');\n";
    });
    console.log(code);
*/


figs['0'] = require('@mocks/0');
// figs['1'] = require('@mocks/1');
figs['4'] = require('@mocks/4');
figs['5'] = require('@mocks/5');
figs['10'] = require('@mocks/10');
// figs['11'] = require('@mocks/11');
// figs['12'] = require('@mocks/12');
// figs['13'] = require('@mocks/13');
// figs['14'] = require('@mocks/14');
// figs['15'] = require('@mocks/15');
// figs['16'] = require('@mocks/16');
// figs['17'] = require('@mocks/17');
// figs['18'] = require('@mocks/18');
// figs['19'] = require('@mocks/19');
figs['20'] = require('@mocks/20');
// figs['21'] = require('@mocks/21');
// figs['22'] = require('@mocks/22');
// figs['23'] = require('@mocks/23');
// figs['24'] = require('@mocks/24');
// figs['25'] = require('@mocks/25');
// figs['26'] = require('@mocks/26');
// figs['27'] = require('@mocks/27');
// figs['28'] = require('@mocks/28');
// figs['29'] = require('@mocks/29');
// figs['30'] = require('@mocks/30');
// figs['31'] = require('@mocks/31');
// figs['32'] = require('@mocks/32');
// figs['2dhistogram_contour_subplots'] = require('@mocks/2dhistogram_contour_subplots');
// figs['2dhistogram_contour_subplots_bingroup'] = require('@mocks/2dhistogram_contour_subplots_bingroup');
// figs['airfoil'] = require('@mocks/airfoil');
figs['animation'] = require('@mocks/animation');
figs['animation_bar'] = require('@mocks/animation_bar');
// figs['annotations'] = require('@mocks/annotations');
// figs['annotations-autorange'] = require('@mocks/annotations-autorange');
figs['arrow-markers'] = require('@mocks/arrow-markers');
figs['automargin-large-margins'] = require('@mocks/automargin-large-margins');
figs['automargin-large-margins-both-sides'] = require('@mocks/automargin-large-margins-both-sides');
figs['automargin-large-margins-horizontal'] = require('@mocks/automargin-large-margins-horizontal');
figs['automargin-narrow-indicator'] = require('@mocks/automargin-narrow-indicator');
figs['automargin-mirror-all'] = require('@mocks/automargin-mirror-all');
figs['automargin-mirror-allticks'] = require('@mocks/automargin-mirror-allticks');
figs['automargin-multiline-titles'] = require('@mocks/automargin-multiline-titles');
figs['automargin-push-x-extra'] = require('@mocks/automargin-push-x-extra');
figs['automargin-push-y-extra'] = require('@mocks/automargin-push-y-extra');
figs['automargin-rangeslider-and-sidepush'] = require('@mocks/automargin-rangeslider-and-sidepush');
figs['automargin-small-width'] = require('@mocks/automargin-small-width');
figs['automargin-superimposed-axes'] = require('@mocks/automargin-superimposed-axes');
figs['automargin-title-standoff'] = require('@mocks/automargin-title-standoff');
figs['autorange-tozero-rangemode'] = require('@mocks/autorange-tozero-rangemode');
// figs['axes_booleans'] = require('@mocks/axes_booleans');
figs['axes_breaks'] = require('@mocks/axes_breaks');
figs['axes_breaks-candlestick'] = require('@mocks/axes_breaks-candlestick');
figs['axes_breaks-candlestick2'] = require('@mocks/axes_breaks-candlestick2');
figs['axes_breaks-contour1d'] = require('@mocks/axes_breaks-contour1d');
figs['axes_breaks-contour2d'] = require('@mocks/axes_breaks-contour2d');
figs['axes_breaks-dtick_auto'] = require('@mocks/axes_breaks-dtick_auto');
figs['axes_breaks-dtick_hourly'] = require('@mocks/axes_breaks-dtick_hourly');
figs['axes_breaks-finance'] = require('@mocks/axes_breaks-finance');
figs['axes_breaks-gridlines'] = require('@mocks/axes_breaks-gridlines');
figs['axes_breaks-heatmap1d'] = require('@mocks/axes_breaks-heatmap1d');
figs['axes_breaks-heatmap2d'] = require('@mocks/axes_breaks-heatmap2d');
figs['axes_breaks-histogram2d'] = require('@mocks/axes_breaks-histogram2d');
figs['axes_breaks-night_autorange-reversed'] = require('@mocks/axes_breaks-night_autorange-reversed');
figs['axes_breaks-ohlc_candlestick_box'] = require('@mocks/axes_breaks-ohlc_candlestick_box');
figs['axes_breaks-overlap'] = require('@mocks/axes_breaks-overlap');
figs['axes_breaks-rangeslider'] = require('@mocks/axes_breaks-rangeslider');
figs['axes_breaks-reversed-without-pattern'] = require('@mocks/axes_breaks-reversed-without-pattern');
figs['axes_breaks-round-weekdays'] = require('@mocks/axes_breaks-round-weekdays');
figs['axes_breaks-tickvals'] = require('@mocks/axes_breaks-tickvals');
figs['axes_breaks-values'] = require('@mocks/axes_breaks-values');
figs['axes_breaks-weekends_autorange-reversed'] = require('@mocks/axes_breaks-weekends_autorange-reversed');
figs['axes_breaks-weekends-weeknights'] = require('@mocks/axes_breaks-weekends-weeknights');
// figs['axes_category_ascending'] = require('@mocks/axes_category_ascending');
figs['axes_category_categoryarray'] = require('@mocks/axes_category_categoryarray');
figs['axes_category_categoryarray_truncated_tails'] = require('@mocks/axes_category_categoryarray_truncated_tails');
// figs['axes_category_descending'] = require('@mocks/axes_category_descending');
// figs['axes_category_descending_with_gaps'] = require('@mocks/axes_category_descending_with_gaps');
figs['axes_category_null'] = require('@mocks/axes_category_null');
figs['axes_chain_scaleanchor_matches'] = require('@mocks/axes_chain_scaleanchor_matches');
figs['axes_chain_scaleanchor_matches2'] = require('@mocks/axes_chain_scaleanchor_matches2');
figs['axes_chain_scaleanchor_matches_inside-ticklabels'] = require('@mocks/axes_chain_scaleanchor_matches_inside-ticklabels');
figs['axes_chain_scaleanchor_matches2_inside-ticklabels'] = require('@mocks/axes_chain_scaleanchor_matches2_inside-ticklabels');
figs['axes_custom-ticks_log-date'] = require('@mocks/axes_custom-ticks_log-date');
figs['axes_enumerated_ticks'] = require('@mocks/axes_enumerated_ticks');
figs['axes_free_default'] = require('@mocks/axes_free_default');
// figs['axes_labels'] = require('@mocks/axes_labels');
figs['axes_line_noticklabels'] = require('@mocks/axes_line_noticklabels');
figs['axes_lines'] = require('@mocks/axes_lines');
figs['axes_linked_date_autorange'] = require('@mocks/axes_linked_date_autorange');
figs['axes_matches-linear-categories'] = require('@mocks/axes_matches-linear-categories');
figs['axes_range_manual'] = require('@mocks/axes_range_manual');
figs['axes_range_mode'] = require('@mocks/axes_range_mode');
figs['axes_range_type'] = require('@mocks/axes_range_type');
figs['axes_reversed'] = require('@mocks/axes_reversed');
figs['axes_scaleanchor'] = require('@mocks/axes_scaleanchor');
figs['axes_scaleanchor-constrain-domain-fixedrange'] = require('@mocks/axes_scaleanchor-constrain-domain-fixedrange');
figs['axes_scaleanchor-with-matches'] = require('@mocks/axes_scaleanchor-with-matches');
figs['axes_visible-false'] = require('@mocks/axes_visible-false');
figs['axes-autotype-empty'] = require('@mocks/axes-autotype-empty');
// figs['axes-ticks'] = require('@mocks/axes-ticks');
figs['axis_automargin_zero_margins'] = require('@mocks/axis_automargin_zero_margins');
figs['axis-title-standoff'] = require('@mocks/axis-title-standoff');
figs['axislabel_separatethousands'] = require('@mocks/axislabel_separatethousands');
figs['bar_and_histogram'] = require('@mocks/bar_and_histogram');
figs['bar_attrs_group'] = require('@mocks/bar_attrs_group');
figs['bar_attrs_group_norm'] = require('@mocks/bar_attrs_group_norm');
figs['bar_attrs_overlay'] = require('@mocks/bar_attrs_overlay');
figs['bar_attrs_relative'] = require('@mocks/bar_attrs_relative');
figs['bar_autorange-above-zero'] = require('@mocks/bar_autorange-above-zero');
figs['bar_autorange-above-zero-normalized'] = require('@mocks/bar_autorange-above-zero-normalized');
figs['bar_axis_textangle_outside'] = require('@mocks/bar_axis_textangle_outside');
figs['bar_bargap0'] = require('@mocks/bar_bargap0');
figs['bar_cliponaxis-false'] = require('@mocks/bar_cliponaxis-false');
figs['bar_display_height_zero'] = require('@mocks/bar_display_height_zero');
figs['bar_display_height_zero_no_line_width'] = require('@mocks/bar_display_height_zero_no_line_width');
figs['bar_display_height_zero_only_line_width'] = require('@mocks/bar_display_height_zero_only_line_width');
figs['bar_errorbars_inherit_color'] = require('@mocks/bar_errorbars_inherit_color');
figs['bar_gantt-chart'] = require('@mocks/bar_gantt-chart');
figs['bar_group_percent'] = require('@mocks/bar_group_percent');
figs['bar_hide_nulls'] = require('@mocks/bar_hide_nulls');
figs['bar_line'] = require('@mocks/bar_line');
figs['bar_marker_array'] = require('@mocks/bar_marker_array');
figs['bar_annotation_max_range_eq_category'] = require('@mocks/bar_annotation_max_range_eq_category');
figs['bar_multiline_labels'] = require('@mocks/bar_multiline_labels');
figs['bar_nonnumeric_sizes'] = require('@mocks/bar_nonnumeric_sizes');
figs['bar_show_narrow'] = require('@mocks/bar_show_narrow');
figs['bar_stack-with-gaps'] = require('@mocks/bar_stack-with-gaps');
figs['bar_stackrelative_negative'] = require('@mocks/bar_stackrelative_negative');
figs['bar_stackrelativeto100_negative'] = require('@mocks/bar_stackrelativeto100_negative');
figs['bar_stackto1'] = require('@mocks/bar_stackto1');
figs['bar_stackto100_negative'] = require('@mocks/bar_stackto100_negative');
figs['bar_unhidden'] = require('@mocks/bar_unhidden');
// figs['bar-alignment-offset'] = require('@mocks/bar-alignment-offset');
figs['bar-autotext-log-size-axes'] = require('@mocks/bar-autotext-log-size-axes');
figs['bar-colorscale-colorbar'] = require('@mocks/bar-colorscale-colorbar');
figs['bar-grouping-vs-defaults'] = require('@mocks/bar-grouping-vs-defaults');
figs['bar-insidetext-log-size-axis'] = require('@mocks/bar-insidetext-log-size-axis');
figs['bar-like_textangle45'] = require('@mocks/bar-like_textangle45');
figs['bar-like_textangle60'] = require('@mocks/bar-like_textangle60');
figs['bar-like_traces_no-tozero'] = require('@mocks/bar-like_traces_no-tozero');
figs['bar-like_traces_no-tozero_negative'] = require('@mocks/bar-like_traces_no-tozero_negative');
figs['bar-like_traces_no-tozero_stack'] = require('@mocks/bar-like_traces_no-tozero_stack');
figs['bar-like_traces_tozero'] = require('@mocks/bar-like_traces_tozero');
figs['bar-marker-line-colorscales'] = require('@mocks/bar-marker-line-colorscales');
figs['bar-offsetgroups'] = require('@mocks/bar-offsetgroups');
figs['bar-with-milliseconds'] = require('@mocks/bar-with-milliseconds');
figs['basic_area'] = require('@mocks/basic_area');
figs['basic_bar'] = require('@mocks/basic_bar');
figs['basic_error_bar'] = require('@mocks/basic_error_bar');
figs['basic_heatmap'] = require('@mocks/basic_heatmap');
figs['basic_line'] = require('@mocks/basic_line');
figs['benchmarks'] = require('@mocks/benchmarks');
figs['binding'] = require('@mocks/binding');
figs['blackbody_heatmap'] = require('@mocks/blackbody_heatmap');
figs['blank-bar-outsidetext'] = require('@mocks/blank-bar-outsidetext');
figs['bluered_heatmap'] = require('@mocks/bluered_heatmap');
figs['box_grouped'] = require('@mocks/box_grouped');
figs['box_grouped_horz'] = require('@mocks/box_grouped_horz');
figs['box_grouped_mean_descending'] = require('@mocks/box_grouped_mean_descending');
figs['box_grouped-multicategory'] = require('@mocks/box_grouped-multicategory');
figs['box_horz_notched'] = require('@mocks/box_horz_notched');
figs['box_log_scale'] = require('@mocks/box_log_scale');
figs['box_notched'] = require('@mocks/box_notched');
figs['box_notched-inverted-end'] = require('@mocks/box_notched-inverted-end');
figs['box_plot_jitter'] = require('@mocks/box_plot_jitter');
figs['box_plot_jitter_edge_cases'] = require('@mocks/box_plot_jitter_edge_cases');
figs['box_precomputed-stats'] = require('@mocks/box_precomputed-stats');
figs['box_quartile-methods'] = require('@mocks/box_quartile-methods');
figs['box_single-group'] = require('@mocks/box_single-group');
figs['box_violin_just_pts'] = require('@mocks/box_violin_just_pts');
figs['box_with-empty-1st-trace'] = require('@mocks/box_with-empty-1st-trace');
// figs['box-alignment-offset'] = require('@mocks/box-alignment-offset');
figs['box-violin-multicategory-on-val-axis'] = require('@mocks/box-violin-multicategory-on-val-axis');
figs['box-violin-x0-category-position'] = require('@mocks/box-violin-x0-category-position');
figs['boxplots_outliercolordflt'] = require('@mocks/boxplots_outliercolordflt');
figs['boxplots_undefined_vals'] = require('@mocks/boxplots_undefined_vals');
figs['bubble_markersize0'] = require('@mocks/bubble_markersize0');
figs['bubble_nonnumeric-sizes'] = require('@mocks/bubble_nonnumeric-sizes');
figs['bubblechart'] = require('@mocks/bubblechart');
// figs['candlestick_double-y-axis'] = require('@mocks/candlestick_double-y-axis');
// figs['candlestick_rangeslider_thai'] = require('@mocks/candlestick_rangeslider_thai');
figs['carpet_axis'] = require('@mocks/carpet_axis');
figs['carpet_ordering-labeling'] = require('@mocks/carpet_ordering-labeling');
figs['carpet_rounded-off-edgepath'] = require('@mocks/carpet_rounded-off-edgepath');
figs['carpet_rounded-off-edgepath-gt'] = require('@mocks/carpet_rounded-off-edgepath-gt');
figs['carpet_rounded-off-edgepath-lt'] = require('@mocks/carpet_rounded-off-edgepath-lt');
figs['carpet_template'] = require('@mocks/carpet_template');
figs['category_dtick_3'] = require('@mocks/category_dtick_3');
// figs['category-autorange'] = require('@mocks/category-autorange');
// figs['cheater'] = require('@mocks/cheater');
// figs['cheater_constraint_greater_than'] = require('@mocks/cheater_constraint_greater_than');
// figs['cheater_constraint_greater_than_with_hill'] = require('@mocks/cheater_constraint_greater_than_with_hill');
// figs['cheater_constraint_greater_than_with_valley'] = require('@mocks/cheater_constraint_greater_than_with_valley');
// figs['cheater_constraint_inner_range'] = require('@mocks/cheater_constraint_inner_range');
// figs['cheater_constraint_inner_range_hi_top'] = require('@mocks/cheater_constraint_inner_range_hi_top');
// figs['cheater_constraint_inner_range_hi_top_with_hill'] = require('@mocks/cheater_constraint_inner_range_hi_top_with_hill');
// figs['cheater_constraint_inner_range_hi_top_with_valley'] = require('@mocks/cheater_constraint_inner_range_hi_top_with_valley');
// figs['cheater_constraint_inner_range_lo_top'] = require('@mocks/cheater_constraint_inner_range_lo_top');
// figs['cheater_constraint_inner_range_lo_top_with_hill'] = require('@mocks/cheater_constraint_inner_range_lo_top_with_hill');
// figs['cheater_constraint_inner_range_lo_top_with_valley'] = require('@mocks/cheater_constraint_inner_range_lo_top_with_valley');
// figs['cheater_constraint_inner_range_with_hill'] = require('@mocks/cheater_constraint_inner_range_with_hill');
// figs['cheater_constraint_inner_range_with_valley'] = require('@mocks/cheater_constraint_inner_range_with_valley');
// figs['cheater_constraint_less_than'] = require('@mocks/cheater_constraint_less_than');
// figs['cheater_constraint_less_than_with_hill'] = require('@mocks/cheater_constraint_less_than_with_hill');
// figs['cheater_constraint_less_than_with_valley'] = require('@mocks/cheater_constraint_less_than_with_valley');
// figs['cheater_constraint_outer_range'] = require('@mocks/cheater_constraint_outer_range');
// figs['cheater_constraint_outer_range_hi_top'] = require('@mocks/cheater_constraint_outer_range_hi_top');
// figs['cheater_constraint_outer_range_hi_top_with_hill'] = require('@mocks/cheater_constraint_outer_range_hi_top_with_hill');
// figs['cheater_constraint_outer_range_hi_top_with_valley'] = require('@mocks/cheater_constraint_outer_range_hi_top_with_valley');
// figs['cheater_constraint_outer_range_lo_top'] = require('@mocks/cheater_constraint_outer_range_lo_top');
// figs['cheater_constraint_outer_range_lo_top_with_hill'] = require('@mocks/cheater_constraint_outer_range_lo_top_with_hill');
// figs['cheater_constraint_outer_range_lo_top_with_valley'] = require('@mocks/cheater_constraint_outer_range_lo_top_with_valley');
// figs['cheater_constraint_outer_range_with_hill'] = require('@mocks/cheater_constraint_outer_range_with_hill');
// figs['cheater_constraint_outer_range_with_valley'] = require('@mocks/cheater_constraint_outer_range_with_valley');
// figs['cheater_constraints'] = require('@mocks/cheater_constraints');
// figs['cheater_contour'] = require('@mocks/cheater_contour');
// figs['cheater_fully_filled'] = require('@mocks/cheater_fully_filled');
// figs['cheater_smooth'] = require('@mocks/cheater_smooth');
figs['cheaterslope'] = require('@mocks/cheaterslope');
figs['cheaterslope_noticklabels'] = require('@mocks/cheaterslope_noticklabels');
figs['cividis_heatmap'] = require('@mocks/cividis_heatmap');
figs['cliponaxis_false'] = require('@mocks/cliponaxis_false');
figs['cliponaxis_false-dates-log'] = require('@mocks/cliponaxis_false-dates-log');
figs['cmid-zmid'] = require('@mocks/cmid-zmid');
figs['colorbar_enumerated_ticks'] = require('@mocks/colorbar_enumerated_ticks');
figs['colorbar_tick_prefix_suffix'] = require('@mocks/colorbar_tick_prefix_suffix');
figs['colorbar_tickformat'] = require('@mocks/colorbar_tickformat');
figs['colorscale_constraint'] = require('@mocks/colorscale_constraint');
figs['colorscale_opacity'] = require('@mocks/colorscale_opacity');
figs['colorscale_template'] = require('@mocks/colorscale_template');
figs['connectgaps_2d'] = require('@mocks/connectgaps_2d');
figs['contour_constraints'] = require('@mocks/contour_constraints');
figs['contour_constraints_edge_cases'] = require('@mocks/contour_constraints_edge_cases');
figs['contour_constraints_equal_boundary_minmax'] = require('@mocks/contour_constraints_equal_boundary_minmax');
figs['contour_doublemerge'] = require('@mocks/contour_doublemerge');
figs['contour_edge_cases'] = require('@mocks/contour_edge_cases');
figs['contour_heatmap_coloring'] = require('@mocks/contour_heatmap_coloring');
figs['contour_heatmap_coloring_reversescale'] = require('@mocks/contour_heatmap_coloring_reversescale');
figs['contour_label-font-size'] = require('@mocks/contour_label-font-size');
figs['contour_label-formatting-via-colorbar'] = require('@mocks/contour_label-formatting-via-colorbar');
figs['contour_label-reversed-axes'] = require('@mocks/contour_label-reversed-axes');
figs['contour_label-reversed-xy'] = require('@mocks/contour_label-reversed-xy');
figs['contour_label-thousands-suffix'] = require('@mocks/contour_label-thousands-suffix');
figs['contour_legend'] = require('@mocks/contour_legend');
figs['contour_legend-coloraxis'] = require('@mocks/contour_legend-coloraxis');
figs['contour_legend-colorscale'] = require('@mocks/contour_legend-colorscale');
figs['contour_lines_coloring'] = require('@mocks/contour_lines_coloring');
figs['contour_log'] = require('@mocks/contour_log');
// figs['contour_match_edges'] = require('@mocks/contour_match_edges');
figs['contour_nolines'] = require('@mocks/contour_nolines');
figs['contour_scatter'] = require('@mocks/contour_scatter');
figs['contour_transposed'] = require('@mocks/contour_transposed');
figs['contour_transposed-irregular'] = require('@mocks/contour_transposed-irregular');
figs['contour_valid_ses'] = require('@mocks/contour_valid_ses');
figs['contour_xyz-gaps-on-sides'] = require('@mocks/contour_xyz-gaps-on-sides');
figs['contour-heatmap-coloring-set-contours'] = require('@mocks/contour-heatmap-coloring-set-contours');
figs['custom_colorscale'] = require('@mocks/custom_colorscale');
figs['custom_size_subplot'] = require('@mocks/custom_size_subplot');
figs['date_axes'] = require('@mocks/date_axes');
figs['date_axes_side_top'] = require('@mocks/date_axes_side_top');
figs['date_axes_period'] = require('@mocks/date_axes_period');
figs['date_axes_period2'] = require('@mocks/date_axes_period2');
figs['date_axes_period_breaks_automargin'] = require('@mocks/date_axes_period_breaks_automargin');
figs['date_histogram'] = require('@mocks/date_histogram');
// figs['dendrogram'] = require('@mocks/dendrogram');
figs['display-text_zero-number'] = require('@mocks/display-text_zero-number');
figs['domain_refs'] = require('@mocks/domain_refs');
figs['domain_ref_axis_types'] = require('@mocks/domain_ref_axis_types');
figs['earth_heatmap'] = require('@mocks/earth_heatmap');
figs['electric_heatmap'] = require('@mocks/electric_heatmap');
figs['empty'] = require('@mocks/empty');
figs['error_bar_asymmetric_array'] = require('@mocks/error_bar_asymmetric_array');
figs['error_bar_asymmetric_constant'] = require('@mocks/error_bar_asymmetric_constant');
figs['error_bar_bar'] = require('@mocks/error_bar_bar');
figs['error_bar_bar_ids'] = require('@mocks/error_bar_bar_ids');
figs['error_bar_horizontal'] = require('@mocks/error_bar_horizontal');
figs['error_bar_layers'] = require('@mocks/error_bar_layers');
figs['error_bar_sqrt'] = require('@mocks/error_bar_sqrt');
// figs['error_bar_style'] = require('@mocks/error_bar_style');
// figs['fake_violins'] = require('@mocks/fake_violins');
figs['finance_multicategory'] = require('@mocks/finance_multicategory');
figs['finance_style'] = require('@mocks/finance_style');
figs['finance_subplots_categories'] = require('@mocks/finance_subplots_categories');
figs['font-wishlist'] = require('@mocks/font-wishlist');
// figs['fonts'] = require('@mocks/fonts');
// figs['funnel_11'] = require('@mocks/funnel_11');
figs['funnel_attrs'] = require('@mocks/funnel_attrs');
figs['funnel_axis'] = require('@mocks/funnel_axis');
figs['funnel_axis_textangle'] = require('@mocks/funnel_axis_textangle');
figs['funnel_axis_textangle_outside'] = require('@mocks/funnel_axis_textangle_outside');
figs['funnel_axis_textangle_start-end'] = require('@mocks/funnel_axis_textangle_start-end');
figs['funnel_axis_with_other_traces'] = require('@mocks/funnel_axis_with_other_traces');
figs['funnel_cliponaxis-false'] = require('@mocks/funnel_cliponaxis-false');
figs['funnel_custom'] = require('@mocks/funnel_custom');
figs['funnel_date-axes'] = require('@mocks/funnel_date-axes');
figs['funnel_gap0'] = require('@mocks/funnel_gap0');
figs['funnel_horizontal_group_basic'] = require('@mocks/funnel_horizontal_group_basic');
figs['funnel_horizontal_stack_basic'] = require('@mocks/funnel_horizontal_stack_basic');
figs['funnel_horizontal_stack_more'] = require('@mocks/funnel_horizontal_stack_more');
figs['funnel_multicategory'] = require('@mocks/funnel_multicategory');
figs['funnel_nonnumeric_sizes'] = require('@mocks/funnel_nonnumeric_sizes');
figs['funnel_vertical_overlay_custom_arrays'] = require('@mocks/funnel_vertical_overlay_custom_arrays');
figs['funnel-grouping-vs-defaults'] = require('@mocks/funnel-grouping-vs-defaults');
figs['funnel-offsetgroups'] = require('@mocks/funnel-offsetgroups');
figs['funnelarea_aggregated'] = require('@mocks/funnelarea_aggregated');
figs['funnelarea_fonts'] = require('@mocks/funnelarea_fonts');
figs['funnelarea_label0_dlabel'] = require('@mocks/funnelarea_label0_dlabel');
figs['funnelarea_labels_colors_text'] = require('@mocks/funnelarea_labels_colors_text');
figs['funnelarea_line_width'] = require('@mocks/funnelarea_line_width');
figs['funnelarea_no_scalegroup_various_domain'] = require('@mocks/funnelarea_no_scalegroup_various_domain');
figs['funnelarea_no_scalegroup_various_ratios'] = require('@mocks/funnelarea_no_scalegroup_various_ratios');
figs['funnelarea_no_scalegroup_various_ratios_and_domain'] = require('@mocks/funnelarea_no_scalegroup_various_ratios_and_domain');
figs['funnelarea_pie_colorways'] = require('@mocks/funnelarea_pie_colorways');
figs['funnelarea_scalegroup_two'] = require('@mocks/funnelarea_scalegroup_two');
figs['funnelarea_scalegroup_various_ratios'] = require('@mocks/funnelarea_scalegroup_various_ratios');
figs['funnelarea_scalegroup_various_ratios_and_domain'] = require('@mocks/funnelarea_scalegroup_various_ratios_and_domain');
figs['funnelarea_simple'] = require('@mocks/funnelarea_simple');
figs['funnelarea_style'] = require('@mocks/funnelarea_style');
figs['funnelarea_title_multiple'] = require('@mocks/funnelarea_title_multiple');
figs['funnelarea_with_other_traces'] = require('@mocks/funnelarea_with_other_traces');
figs['geo_across-antimeridian'] = require('@mocks/geo_across-antimeridian');
// figs['geo_africa-insets'] = require('@mocks/geo_africa-insets');
figs['geo_aitoff-sinusoidal'] = require('@mocks/geo_aitoff-sinusoidal');
figs['geo_bg-color'] = require('@mocks/geo_bg-color');
figs['geo_big-frame'] = require('@mocks/geo_big-frame');
figs['geo_bubbles-colorscales'] = require('@mocks/geo_bubbles-colorscales');
figs['geo_bubbles-sizeref'] = require('@mocks/geo_bubbles-sizeref');
figs['geo_canadian-cities'] = require('@mocks/geo_canadian-cities');
figs['geo_centering'] = require('@mocks/geo_centering');
figs['geo_choropleth-legend'] = require('@mocks/geo_choropleth-legend');
figs['geo_choropleth-text'] = require('@mocks/geo_choropleth-text');
figs['geo_choropleth-usa'] = require('@mocks/geo_choropleth-usa');
figs['geo_choropleth-usa_legend'] = require('@mocks/geo_choropleth-usa_legend');
figs['geo_conic-conformal'] = require('@mocks/geo_conic-conformal');
figs['geo_connectgaps'] = require('@mocks/geo_connectgaps');
figs['geo_country-names'] = require('@mocks/geo_country-names');
figs['geo_country-names-text-chart'] = require('@mocks/geo_country-names-text-chart');
figs['geo_custom-colorscale'] = require('@mocks/geo_custom-colorscale');
figs['geo_custom-geojson'] = require('@mocks/geo_custom-geojson');
figs['geo_europe-bubbles'] = require('@mocks/geo_europe-bubbles');
figs['geo_featureidkey'] = require('@mocks/geo_featureidkey');
figs['geo_fill'] = require('@mocks/geo_fill');
figs['geo_first'] = require('@mocks/geo_first');
figs['geo_fitbounds-geojson'] = require('@mocks/geo_fitbounds-geojson');
figs['geo_fitbounds-locations'] = require('@mocks/geo_fitbounds-locations');
figs['geo_fitbounds-scopes'] = require('@mocks/geo_fitbounds-scopes');
figs['geo_kavrayskiy7'] = require('@mocks/geo_kavrayskiy7');
figs['geo_lakes-and-rivers'] = require('@mocks/geo_lakes-and-rivers');
figs['geo_legendonly'] = require('@mocks/geo_legendonly');
figs['geo_miterlimit-base-layers'] = require('@mocks/geo_miterlimit-base-layers');
figs['geo_multi-geos'] = require('@mocks/geo_multi-geos');
figs['geo_multiple-usa-choropleths'] = require('@mocks/geo_multiple-usa-choropleths');
figs['geo_orthographic'] = require('@mocks/geo_orthographic');
figs['geo_point-selection'] = require('@mocks/geo_point-selection');
figs['geo_scattergeo-locations'] = require('@mocks/geo_scattergeo-locations');
figs['geo_scattergeo-out-of-usa'] = require('@mocks/geo_scattergeo-out-of-usa');
figs['geo_second'] = require('@mocks/geo_second');
figs['geo_skymap'] = require('@mocks/geo_skymap');
figs['geo_stereographic'] = require('@mocks/geo_stereographic');
figs['geo_text_chart_arrays'] = require('@mocks/geo_text_chart_arrays');
figs['geo_tick0'] = require('@mocks/geo_tick0');
figs['geo_usa-states'] = require('@mocks/geo_usa-states');
figs['geo_usa-states-on-world-scope'] = require('@mocks/geo_usa-states-on-world-scope');
figs['geo_visible_false_override_template'] = require('@mocks/geo_visible_false_override_template');
figs['geo_winkel-tripel'] = require('@mocks/geo_winkel-tripel');
// figs['gl2d_10'] = require('@mocks/gl2d_10');
// figs['gl2d_12'] = require('@mocks/gl2d_12');
// figs['gl2d_14'] = require('@mocks/gl2d_14');
// figs['gl2d_17'] = require('@mocks/gl2d_17');
// figs['gl2d_annotations'] = require('@mocks/gl2d_annotations');
// figs['gl2d_axes_booleans'] = require('@mocks/gl2d_axes_booleans');
// figs['gl2d_axes_labels'] = require('@mocks/gl2d_axes_labels');
figs['gl2d_axes_labels2'] = require('@mocks/gl2d_axes_labels2');
figs['gl2d_axes_lines'] = require('@mocks/gl2d_axes_lines');
figs['gl2d_axes_range_manual'] = require('@mocks/gl2d_axes_range_manual');
figs['gl2d_axes_range_mode'] = require('@mocks/gl2d_axes_range_mode');
figs['gl2d_axes_range_type'] = require('@mocks/gl2d_axes_range_type');
figs['gl2d_clean-number'] = require('@mocks/gl2d_clean-number');
figs['gl2d_clustering'] = require('@mocks/gl2d_clustering');
figs['gl2d_connect_gaps'] = require('@mocks/gl2d_connect_gaps');
figs['gl2d_date_axes'] = require('@mocks/gl2d_date_axes');
figs['gl2d_error_bars'] = require('@mocks/gl2d_error_bars');
figs['gl2d_error_bars_log'] = require('@mocks/gl2d_error_bars_log');
// figs['gl2d_fill_trace_tozero_order'] = require('@mocks/gl2d_fill_trace_tozero_order');
figs['gl2d_fill-ordering'] = require('@mocks/gl2d_fill-ordering');
// figs['gl2d_fonts'] = require('@mocks/gl2d_fonts');
figs['gl2d_heatmapgl'] = require('@mocks/gl2d_heatmapgl');
figs['gl2d_heatmapgl_discrete'] = require('@mocks/gl2d_heatmapgl_discrete');
figs['gl2d_horiz-lines'] = require('@mocks/gl2d_horiz-lines');
// figs['gl2d_layout_image'] = require('@mocks/gl2d_layout_image');
figs['gl2d_line_aligned'] = require('@mocks/gl2d_line_aligned');
figs['gl2d_line_dash'] = require('@mocks/gl2d_line_dash');
figs['gl2d_line_limit'] = require('@mocks/gl2d_line_limit');
figs['gl2d_line_select'] = require('@mocks/gl2d_line_select');
figs['gl2d_lines_almost_horizontal_vertical'] = require('@mocks/gl2d_lines_almost_horizontal_vertical');
// figs['gl2d_marker_coloraxis'] = require('@mocks/gl2d_marker_coloraxis');
figs['gl2d_marker_line_width'] = require('@mocks/gl2d_marker_line_width');
figs['gl2d_marker_size'] = require('@mocks/gl2d_marker_size');
figs['gl2d_marker_symbols'] = require('@mocks/gl2d_marker_symbols');
figs['gl2d_multiple_subplots'] = require('@mocks/gl2d_multiple_subplots');
figs['gl2d_multiple-traces-axes'] = require('@mocks/gl2d_multiple-traces-axes');
figs['gl2d_multiple-traces-axes-labels'] = require('@mocks/gl2d_multiple-traces-axes-labels');
figs['gl2d_no-clustering'] = require('@mocks/gl2d_no-clustering');
figs['gl2d_no-clustering2'] = require('@mocks/gl2d_no-clustering2');
figs['gl2d_open_marker_line_width'] = require('@mocks/gl2d_open_marker_line_width');
figs['gl2d_order_error'] = require('@mocks/gl2d_order_error');
figs['gl2d_parcoords'] = require('@mocks/gl2d_parcoords');
figs['gl2d_parcoords_1'] = require('@mocks/gl2d_parcoords_1');
figs['gl2d_parcoords_2'] = require('@mocks/gl2d_parcoords_2');
// figs['gl2d_parcoords_256_colors'] = require('@mocks/gl2d_parcoords_256_colors');
figs['gl2d_parcoords_60_dims'] = require('@mocks/gl2d_parcoords_60_dims');
figs['gl2d_parcoords_blocks'] = require('@mocks/gl2d_parcoords_blocks');
figs['gl2d_parcoords_coloraxis'] = require('@mocks/gl2d_parcoords_coloraxis');
// figs['gl2d_parcoords_constraints'] = require('@mocks/gl2d_parcoords_constraints');
figs['gl2d_parcoords_large'] = require('@mocks/gl2d_parcoords_large');
// figs['gl2d_parcoords_out-of-range_selected-above-below'] = require('@mocks/gl2d_parcoords_out-of-range_selected-above-below');
// figs['gl2d_parcoords_out-of-range_selected-all'] = require('@mocks/gl2d_parcoords_out-of-range_selected-all');
// figs['gl2d_parcoords_out-of-range_selected-below'] = require('@mocks/gl2d_parcoords_out-of-range_selected-below');
figs['gl2d_parcoords_out-of-range_selected-none'] = require('@mocks/gl2d_parcoords_out-of-range_selected-none');
figs['gl2d_parcoords_rgba_colorscale'] = require('@mocks/gl2d_parcoords_rgba_colorscale');
// figs['gl2d_parcoords_select_first_last_enum'] = require('@mocks/gl2d_parcoords_select_first_last_enum');
figs['gl2d_parcoords_style_labels'] = require('@mocks/gl2d_parcoords_style_labels');
figs['gl2d_parcoords_tick_format'] = require('@mocks/gl2d_parcoords_tick_format');
figs['gl2d_period_positioning'] = require('@mocks/gl2d_period_positioning');
figs['gl2d_point-selection'] = require('@mocks/gl2d_point-selection');
// figs['gl2d_pointcloud-basic'] = require('@mocks/gl2d_pointcloud-basic');
// figs['gl2d_rgb_dont_accept_alpha_scattergl'] = require('@mocks/gl2d_rgb_dont_accept_alpha_scattergl');
figs['gl2d_scatter_fill_self_next'] = require('@mocks/gl2d_scatter_fill_self_next');
figs['gl2d_scatter_fill_self_next_vs_nogl'] = require('@mocks/gl2d_scatter_fill_self_next_vs_nogl');
figs['gl2d_scatter-color-clustering'] = require('@mocks/gl2d_scatter-color-clustering');
figs['gl2d_scatter-colorscale-colorbar'] = require('@mocks/gl2d_scatter-colorscale-colorbar');
figs['gl2d_scatter-colorscale-points'] = require('@mocks/gl2d_scatter-colorscale-points');
figs['gl2d_scatter-continuous-clustering'] = require('@mocks/gl2d_scatter-continuous-clustering');
// figs['gl2d_scatter-marker-line-colorscales'] = require('@mocks/gl2d_scatter-marker-line-colorscales');
// figs['gl2d_scatter-subplot-panel'] = require('@mocks/gl2d_scatter-subplot-panel');
figs['gl2d_scatter2d-multiple-colors'] = require('@mocks/gl2d_scatter2d-multiple-colors');
figs['gl2d_scattergl_errorbars_inherit_color'] = require('@mocks/gl2d_scattergl_errorbars_inherit_color');
figs['gl2d_scattergl_gaps'] = require('@mocks/gl2d_scattergl_gaps');
figs['gl2d_scattergl_simple_line_reversed_ranges'] = require('@mocks/gl2d_scattergl_simple_line_reversed_ranges');
figs['gl2d_selectedpoints'] = require('@mocks/gl2d_selectedpoints');
// figs['gl2d_shape_line'] = require('@mocks/gl2d_shape_line');
figs['gl2d_shapes_below_traces'] = require('@mocks/gl2d_shapes_below_traces');
figs['gl2d_simple_inset'] = require('@mocks/gl2d_simple_inset');
figs['gl2d_size_margins'] = require('@mocks/gl2d_size_margins');
figs['gl2d_stacked_coupled_subplots'] = require('@mocks/gl2d_stacked_coupled_subplots');
figs['gl2d_stacked_subplots'] = require('@mocks/gl2d_stacked_subplots');
figs['gl2d_subplots_anchor'] = require('@mocks/gl2d_subplots_anchor');
figs['gl2d_symbol_numbers'] = require('@mocks/gl2d_symbol_numbers');
figs['gl2d_text_chart_arrays'] = require('@mocks/gl2d_text_chart_arrays');
// figs['gl2d_text_chart_basic'] = require('@mocks/gl2d_text_chart_basic');
figs['gl2d_text_chart_invalid-arrays'] = require('@mocks/gl2d_text_chart_invalid-arrays');
// figs['gl2d_text_chart_single-string'] = require('@mocks/gl2d_text_chart_single-string');
// figs['gl2d_text_chart_styling'] = require('@mocks/gl2d_text_chart_styling');
// figs['gl2d_texttemplate'] = require('@mocks/gl2d_texttemplate');
figs['gl2d_tick-labels'] = require('@mocks/gl2d_tick-labels');
// figs['gl2d_transforms'] = require('@mocks/gl2d_transforms');
figs['gl2d_ultra_zoom'] = require('@mocks/gl2d_ultra_zoom');
figs['gl3d_annotations'] = require('@mocks/gl3d_annotations');
figs['gl3d_annotations_orthographic'] = require('@mocks/gl3d_annotations_orthographic');
// figs['gl3d_autocolorscale'] = require('@mocks/gl3d_autocolorscale');
figs['gl3d_autorange-zero'] = require('@mocks/gl3d_autorange-zero');
figs['gl3d_axes-visible-false'] = require('@mocks/gl3d_axes-visible-false');
// figs['gl3d_bunny'] = require('@mocks/gl3d_bunny');
figs['gl3d_bunny_cell-area'] = require('@mocks/gl3d_bunny_cell-area');
// figs['gl3d_bunny-hull'] = require('@mocks/gl3d_bunny-hull');
figs['gl3d_chrisp-nan-1'] = require('@mocks/gl3d_chrisp-nan-1');
// figs['gl3d_coloraxes'] = require('@mocks/gl3d_coloraxes');
figs['gl3d_colormap256'] = require('@mocks/gl3d_colormap256');
figs['gl3d_cone-absolute'] = require('@mocks/gl3d_cone-absolute');
figs['gl3d_cone-autorange'] = require('@mocks/gl3d_cone-autorange');
figs['gl3d_cone-lighting'] = require('@mocks/gl3d_cone-lighting');
figs['gl3d_cone-newplot_reversed_ranges'] = require('@mocks/gl3d_cone-newplot_reversed_ranges');
figs['gl3d_cone-rossler'] = require('@mocks/gl3d_cone-rossler');
figs['gl3d_cone-simple'] = require('@mocks/gl3d_cone-simple');
figs['gl3d_cone-single'] = require('@mocks/gl3d_cone-single');
figs['gl3d_cone-wind'] = require('@mocks/gl3d_cone-wind');
figs['gl3d_cone-with-streamtube'] = require('@mocks/gl3d_cone-with-streamtube');
// figs['gl3d_contour-lines'] = require('@mocks/gl3d_contour-lines');
// figs['gl3d_contour-lines2'] = require('@mocks/gl3d_contour-lines2');
// figs['gl3d_convex-hull'] = require('@mocks/gl3d_convex-hull');
figs['gl3d_cube'] = require('@mocks/gl3d_cube');
// figs['gl3d_cufflinks'] = require('@mocks/gl3d_cufflinks');
figs['gl3d_delaunay'] = require('@mocks/gl3d_delaunay');
figs['gl3d_directions-isosurface1'] = require('@mocks/gl3d_directions-isosurface1');
figs['gl3d_directions-isosurface2'] = require('@mocks/gl3d_directions-isosurface2');
figs['gl3d_directions-streamtube1'] = require('@mocks/gl3d_directions-streamtube1');
figs['gl3d_directions-streamtube2'] = require('@mocks/gl3d_directions-streamtube2');
// figs['gl3d_directions-volume1'] = require('@mocks/gl3d_directions-volume1');
figs['gl3d_error_bars_log'] = require('@mocks/gl3d_error_bars_log');
figs['gl3d_error_bars_log_2'] = require('@mocks/gl3d_error_bars_log_2');
figs['gl3d_errorbars_sqrt'] = require('@mocks/gl3d_errorbars_sqrt');
figs['gl3d_errorbars_xy'] = require('@mocks/gl3d_errorbars_xy');
figs['gl3d_errorbars_zx'] = require('@mocks/gl3d_errorbars_zx');
figs['gl3d_errorbars_zy'] = require('@mocks/gl3d_errorbars_zy');
figs['gl3d_formatted-text-on-multiple-lines'] = require('@mocks/gl3d_formatted-text-on-multiple-lines');
// figs['gl3d_ibm-plot'] = require('@mocks/gl3d_ibm-plot');
figs['gl3d_indicator_scatter3d'] = require('@mocks/gl3d_indicator_scatter3d');
figs['gl3d_isosurface_1single-surface_middle-range'] = require('@mocks/gl3d_isosurface_1single-surface_middle-range');
figs['gl3d_isosurface_2surfaces-checker_spaceframe'] = require('@mocks/gl3d_isosurface_2surfaces-checker_spaceframe');
figs['gl3d_isosurface_5more-surfaces_between-ranges'] = require('@mocks/gl3d_isosurface_5more-surfaces_between-ranges');
figs['gl3d_isosurface_9more-surfaces_between-ranges_orthographic'] = require('@mocks/gl3d_isosurface_9more-surfaces_between-ranges_orthographic');
figs['gl3d_isosurface_log-axis_slices_surface-fill'] = require('@mocks/gl3d_isosurface_log-axis_slices_surface-fill');
figs['gl3d_isosurface_math'] = require('@mocks/gl3d_isosurface_math');
figs['gl3d_isosurface_multiple-traces'] = require('@mocks/gl3d_isosurface_multiple-traces');
figs['gl3d_isosurface_out_of_iso_range_case'] = require('@mocks/gl3d_isosurface_out_of_iso_range_case');
figs['gl3d_isosurface_thin_caps_different_dims'] = require('@mocks/gl3d_isosurface_thin_caps_different_dims');
figs['gl3d_isosurface_thin_slices_transparent'] = require('@mocks/gl3d_isosurface_thin_slices_transparent');
figs['gl3d_isosurface_transparent'] = require('@mocks/gl3d_isosurface_transparent');
figs['gl3d_isosurface_uneven-scales_ranges_iso-null'] = require('@mocks/gl3d_isosurface_uneven-scales_ranges_iso-null');
figs['gl3d_isosurface_with_surface-pattern'] = require('@mocks/gl3d_isosurface_with_surface-pattern');
figs['gl3d_isosurface_xycaps_volume_slices'] = require('@mocks/gl3d_isosurface_xycaps_volume_slices');
figs['gl3d_line_rectangle_render'] = require('@mocks/gl3d_line_rectangle_render');
// figs['gl3d_line-colorscale-with-markers'] = require('@mocks/gl3d_line-colorscale-with-markers');
figs['gl3d_log-axis'] = require('@mocks/gl3d_log-axis');
figs['gl3d_log-axis-big'] = require('@mocks/gl3d_log-axis-big');
figs['gl3d_marker_symbols'] = require('@mocks/gl3d_marker_symbols');
figs['gl3d_marker-arrays'] = require('@mocks/gl3d_marker-arrays');
figs['gl3d_marker-color'] = require('@mocks/gl3d_marker-color');
figs['gl3d_mesh3d_cell-intensity'] = require('@mocks/gl3d_mesh3d_cell-intensity');
figs['gl3d_mesh3d_coloring'] = require('@mocks/gl3d_mesh3d_coloring');
figs['gl3d_mesh3d_enable-alpha-with-rgba-color'] = require('@mocks/gl3d_mesh3d_enable-alpha-with-rgba-color');
figs['gl3d_mesh3d_surface_lighting'] = require('@mocks/gl3d_mesh3d_surface_lighting');
figs['gl3d_mesh3d_surface3d_scatter3d_line3d_error3d_log_reversed_ranges'] = require('@mocks/gl3d_mesh3d_surface3d_scatter3d_line3d_error3d_log_reversed_ranges');
figs['gl3d_mesh3d_surface3d_scatter3d_orthographic'] = require('@mocks/gl3d_mesh3d_surface3d_scatter3d_orthographic');
figs['gl3d_mesh3d-missing-colors'] = require('@mocks/gl3d_mesh3d-missing-colors');
figs['gl3d_mirror-ticks'] = require('@mocks/gl3d_mirror-ticks');
figs['gl3d_multi-scene'] = require('@mocks/gl3d_multi-scene');
figs['gl3d_multiple-scatter3d-traces'] = require('@mocks/gl3d_multiple-scatter3d-traces');
figs['gl3d_nan-holes'] = require('@mocks/gl3d_nan-holes');
figs['gl3d_opacity-scaling-spikes'] = require('@mocks/gl3d_opacity-scaling-spikes');
// figs['gl3d_opacity-surface'] = require('@mocks/gl3d_opacity-surface');
figs['gl3d_parametric_surface_data_precision'] = require('@mocks/gl3d_parametric_surface_data_precision');
figs['gl3d_perspective_tick_distances'] = require('@mocks/gl3d_perspective_tick_distances');
figs['gl3d_projection-traces'] = require('@mocks/gl3d_projection-traces');
figs['gl3d_reversescale'] = require('@mocks/gl3d_reversescale');
figs['gl3d_rgb_dont_accept_alpha_scatter3d'] = require('@mocks/gl3d_rgb_dont_accept_alpha_scatter3d');
figs['gl3d_ribbons'] = require('@mocks/gl3d_ribbons');
figs['gl3d_scatter-color-array'] = require('@mocks/gl3d_scatter-color-array');
figs['gl3d_scatter-color-line-gradient'] = require('@mocks/gl3d_scatter-color-line-gradient');
figs['gl3d_scatter-color-mono-and-palette'] = require('@mocks/gl3d_scatter-color-mono-and-palette');
// figs['gl3d_scatter-colorscale-marker'] = require('@mocks/gl3d_scatter-colorscale-marker');
figs['gl3d_scatter3d_errorbars_inherit_color'] = require('@mocks/gl3d_scatter3d_errorbars_inherit_color');
figs['gl3d_scatter3d_line3d_error3d_enable-alpha-with-rgba-color'] = require('@mocks/gl3d_scatter3d_line3d_error3d_enable-alpha-with-rgba-color');
figs['gl3d_scatter3d_line3d_error3d_transparent-with-zero-alpha'] = require('@mocks/gl3d_scatter3d_line3d_error3d_transparent-with-zero-alpha');
// figs['gl3d_scatter3d-align-texts'] = require('@mocks/gl3d_scatter3d-align-texts');
figs['gl3d_scatter3d-blank-text'] = require('@mocks/gl3d_scatter3d-blank-text');
figs['gl3d_scatter3d-colorscale'] = require('@mocks/gl3d_scatter3d-colorscale');
figs['gl3d_scatter3d-colorscale-marker-and-line'] = require('@mocks/gl3d_scatter3d-colorscale-marker-and-line');
figs['gl3d_scatter3d-colorscale-with-line'] = require('@mocks/gl3d_scatter3d-colorscale-with-line');
figs['gl3d_scatter3d-connectgaps'] = require('@mocks/gl3d_scatter3d-connectgaps');
figs['gl3d_scatter3d-different-align-texts'] = require('@mocks/gl3d_scatter3d-different-align-texts');
figs['gl3d_scatter3d-texttemplate'] = require('@mocks/gl3d_scatter3d-texttemplate');
figs['gl3d_set-ranges'] = require('@mocks/gl3d_set-ranges');
figs['gl3d_snowden'] = require('@mocks/gl3d_snowden');
figs['gl3d_snowden_altered'] = require('@mocks/gl3d_snowden_altered');
figs['gl3d_streamtube_reversed_ranges'] = require('@mocks/gl3d_streamtube_reversed_ranges');
figs['gl3d_streamtube-first'] = require('@mocks/gl3d_streamtube-first');
figs['gl3d_streamtube-simple'] = require('@mocks/gl3d_streamtube-simple');
figs['gl3d_streamtube-thin'] = require('@mocks/gl3d_streamtube-thin');
figs['gl3d_streamtube-wind'] = require('@mocks/gl3d_streamtube-wind');
figs['gl3d_surface_after_heatmap'] = require('@mocks/gl3d_surface_after_heatmap');
figs['gl3d_surface_connectgaps'] = require('@mocks/gl3d_surface_connectgaps');
figs['gl3d_surface_contour_precision'] = require('@mocks/gl3d_surface_contour_precision');
figs['gl3d_surface_contour_start-end-size'] = require('@mocks/gl3d_surface_contour_start-end-size');
figs['gl3d_surface_intensity'] = require('@mocks/gl3d_surface_intensity');
figs['gl3d_surface_opacity_match_mesh3d'] = require('@mocks/gl3d_surface_opacity_match_mesh3d');
// figs['gl3d_surface_opacity-and-opacityscale'] = require('@mocks/gl3d_surface_opacity-and-opacityscale');
// figs['gl3d_surface_opacityscale_contour'] = require('@mocks/gl3d_surface_opacityscale_contour');
figs['gl3d_surface_transparent-with-contours'] = require('@mocks/gl3d_surface_transparent-with-contours');
figs['gl3d_surface-circular-colorscale'] = require('@mocks/gl3d_surface-circular-colorscale');
figs['gl3d_surface-circular-opacityscale'] = require('@mocks/gl3d_surface-circular-opacityscale');
// figs['gl3d_surface-heatmap-treemap_transparent-colorscale'] = require('@mocks/gl3d_surface-heatmap-treemap_transparent-colorscale');
// figs['gl3d_surface-lighting'] = require('@mocks/gl3d_surface-lighting');
figs['gl3d_tetrahedra'] = require('@mocks/gl3d_tetrahedra');
figs['gl3d_text-weirdness'] = require('@mocks/gl3d_text-weirdness');
figs['gl3d_ticks-milliseconds'] = require('@mocks/gl3d_ticks-milliseconds');
// figs['gl3d_traces-with-legend'] = require('@mocks/gl3d_traces-with-legend');
// figs['gl3d_traces-with-opacity'] = require('@mocks/gl3d_traces-with-opacity');
figs['gl3d_transparent_same-depth'] = require('@mocks/gl3d_transparent_same-depth');
figs['gl3d_triangle'] = require('@mocks/gl3d_triangle');
figs['gl3d_volume_airflow'] = require('@mocks/gl3d_volume_airflow');
// figs['gl3d_volume_multiple-traces'] = require('@mocks/gl3d_volume_multiple-traces');
figs['gl3d_volume_multiple-traces_one-cube'] = require('@mocks/gl3d_volume_multiple-traces_one-cube');
figs['gl3d_volume_opacityscale-iso'] = require('@mocks/gl3d_volume_opacityscale-iso');
figs['gl3d_wire-surface'] = require('@mocks/gl3d_wire-surface');
figs['gl3d_world-cals'] = require('@mocks/gl3d_world-cals');
figs['gl3d_xy-defined-ticks'] = require('@mocks/gl3d_xy-defined-ticks');
// figs['gl3d_z-range'] = require('@mocks/gl3d_z-range');
figs['global_font'] = require('@mocks/global_font');
// figs['glpolar_scatter'] = require('@mocks/glpolar_scatter');
figs['glpolar_style'] = require('@mocks/glpolar_style');
figs['glpolar_subplots'] = require('@mocks/glpolar_subplots');
figs['greens_heatmap'] = require('@mocks/greens_heatmap');
figs['greys_heatmap'] = require('@mocks/greys_heatmap');
figs['grid_subplot_types'] = require('@mocks/grid_subplot_types');
figs['grouped_bar'] = require('@mocks/grouped_bar');
figs['groups-over-matching-axes'] = require('@mocks/groups-over-matching-axes');
figs['heatmap_autocolor_negative'] = require('@mocks/heatmap_autocolor_negative');
figs['heatmap_autocolor_positive'] = require('@mocks/heatmap_autocolor_positive');
figs['heatmap_brick_padding'] = require('@mocks/heatmap_brick_padding');
figs['heatmap_categoryorder'] = require('@mocks/heatmap_categoryorder');
figs['heatmap_columnar'] = require('@mocks/heatmap_columnar');
figs['heatmap_contour_irregular_bricks'] = require('@mocks/heatmap_contour_irregular_bricks');
figs['heatmap_legend'] = require('@mocks/heatmap_legend');
figs['heatmap_multi-trace'] = require('@mocks/heatmap_multi-trace');
figs['heatmap_multicategory'] = require('@mocks/heatmap_multicategory');
figs['heatmap_shared_categories'] = require('@mocks/heatmap_shared_categories');
// figs['heatmap_small_aspect-ratio'] = require('@mocks/heatmap_small_aspect-ratio');
figs['heatmap_xyz-dates-and-categories'] = require('@mocks/heatmap_xyz-dates-and-categories');
figs['heatmap_xyz-gaps-on-sides'] = require('@mocks/heatmap_xyz-gaps-on-sides');
figs['heatmap-reverse-autocolorscale'] = require('@mocks/heatmap-reverse-autocolorscale');
figs['heatmap-with-zero-category'] = require('@mocks/heatmap-with-zero-category');
figs['hist_0_to_093'] = require('@mocks/hist_0_to_093');
figs['hist_0_to_1_midpoints'] = require('@mocks/hist_0_to_1_midpoints');
figs['hist_003_to_093'] = require('@mocks/hist_003_to_093');
figs['hist_003_to_1'] = require('@mocks/hist_003_to_1');
figs['hist_all_integer'] = require('@mocks/hist_all_integer');
figs['hist_all_integer_n50'] = require('@mocks/hist_all_integer_n50');
figs['hist_almost_integer'] = require('@mocks/hist_almost_integer');
figs['hist_category'] = require('@mocks/hist_category');
figs['hist_category_total_ascending'] = require('@mocks/hist_category_total_ascending');
// figs['hist_cum_stacked'] = require('@mocks/hist_cum_stacked');
figs['hist_grouped'] = require('@mocks/hist_grouped');
figs['hist_multi'] = require('@mocks/hist_multi');
figs['hist_stacked'] = require('@mocks/hist_stacked');
figs['hist_summed'] = require('@mocks/hist_summed');
figs['hist_valid_ses'] = require('@mocks/hist_valid_ses');
figs['hist_valid_ses_y'] = require('@mocks/hist_valid_ses_y');
figs['hist2d_summed'] = require('@mocks/hist2d_summed');
figs['histogram_barmode_relative'] = require('@mocks/histogram_barmode_relative');
figs['histogram_colorscale'] = require('@mocks/histogram_colorscale');
// figs['histogram_errorbars_inherit_color'] = require('@mocks/histogram_errorbars_inherit_color');
figs['histogram_overlay-bingroup'] = require('@mocks/histogram_overlay-bingroup');
figs['histogram-offsetgroups'] = require('@mocks/histogram-offsetgroups');
figs['histogram2d_bingroup'] = require('@mocks/histogram2d_bingroup');
figs['histogram2d_bingroup-coloraxis'] = require('@mocks/histogram2d_bingroup-coloraxis');
figs['histogram2d_legend'] = require('@mocks/histogram2d_legend');
figs['histogram2d_legend-colorscale'] = require('@mocks/histogram2d_legend-colorscale');
figs['histogram2dcontour_bingroup-coloraxis'] = require('@mocks/histogram2dcontour_bingroup-coloraxis');
figs['histogram2dcontour_legend-coloraxis'] = require('@mocks/histogram2dcontour_legend-coloraxis');
figs['hists-on-matching-axes'] = require('@mocks/hists-on-matching-axes');
figs['hot_heatmap'] = require('@mocks/hot_heatmap');
figs['image_adventurer'] = require('@mocks/image_adventurer');
figs['image_astronaut_source'] = require('@mocks/image_astronaut_source');
figs['image_axis_reverse'] = require('@mocks/image_axis_reverse');
figs['image_axis_type'] = require('@mocks/image_axis_type');
figs['image_cat'] = require('@mocks/image_cat');
figs['image_colormodel'] = require('@mocks/image_colormodel');
figs['image_non_numeric'] = require('@mocks/image_non_numeric');
figs['image_opacity'] = require('@mocks/image_opacity');
figs['image_source_axis_reverse'] = require('@mocks/image_source_axis_reverse');
figs['image_source_axis_reverse_zsmooth'] = require('@mocks/image_source_axis_reverse_zsmooth');
figs['image_with_gaps'] = require('@mocks/image_with_gaps');
figs['image_with_heatmap'] = require('@mocks/image_with_heatmap');
figs['image_zmin_zmax'] = require('@mocks/image_zmin_zmax');
// figs['indicator_attrs'] = require('@mocks/indicator_attrs');
// figs['indicator_bignumber'] = require('@mocks/indicator_bignumber');
// figs['indicator_bullet'] = require('@mocks/indicator_bullet');
// figs['indicator_datacard'] = require('@mocks/indicator_datacard');
// figs['indicator_datacard2'] = require('@mocks/indicator_datacard2');
figs['indicator_datacard3'] = require('@mocks/indicator_datacard3');
figs['indicator_format_extremes'] = require('@mocks/indicator_format_extremes');
// figs['indicator_gauge'] = require('@mocks/indicator_gauge');
figs['indicator_grid_template'] = require('@mocks/indicator_grid_template');
// figs['indicator_scatter'] = require('@mocks/indicator_scatter');
// figs['japanese'] = require('@mocks/japanese');
figs['jet_heatmap'] = require('@mocks/jet_heatmap');
figs['labelled_heatmap'] = require('@mocks/labelled_heatmap');
// figs['layout_image'] = require('@mocks/layout_image');
// figs['layout_metatext'] = require('@mocks/layout_metatext');
figs['layout-colorway'] = require('@mocks/layout-colorway');
// figs['legend_horizontal'] = require('@mocks/legend_horizontal');
// figs['legend_horizontal_autowrap'] = require('@mocks/legend_horizontal_autowrap');
figs['legend_horizontal_bg_fit'] = require('@mocks/legend_horizontal_bg_fit');
figs['legend_horizontal_groups'] = require('@mocks/legend_horizontal_groups');
figs['legend_horizontal_one_row'] = require('@mocks/legend_horizontal_one_row');
figs['legend_horizontal_testwrap'] = require('@mocks/legend_horizontal_testwrap');
figs['legend_horizontal_wrap-alll-lines'] = require('@mocks/legend_horizontal_wrap-alll-lines');
figs['legend_inside'] = require('@mocks/legend_inside');
figs['legend_itemwidth_dashline'] = require('@mocks/legend_itemwidth_dashline');
figs['legend_labels'] = require('@mocks/legend_labels');
figs['legend_large_margin'] = require('@mocks/legend_large_margin');
figs['legend_margin-autoexpand-false'] = require('@mocks/legend_margin-autoexpand-false');
figs['legend_mathjax_title_and_items'] = require('@mocks/legend_mathjax_title_and_items');
figs['legend_negative_x'] = require('@mocks/legend_negative_x');
figs['legend_negative_x2'] = require('@mocks/legend_negative_x2');
figs['legend_negative_y'] = require('@mocks/legend_negative_y');
figs['legend_outside'] = require('@mocks/legend_outside');
figs['legend_scroll'] = require('@mocks/legend_scroll');
figs['legend_scroll_beyond_plotarea'] = require('@mocks/legend_scroll_beyond_plotarea');
figs['legend_scroll_with_title'] = require('@mocks/legend_scroll_with_title');
figs['legend_small_horizontal'] = require('@mocks/legend_small_horizontal');
figs['legend_small_vertical'] = require('@mocks/legend_small_vertical');
figs['legend_style'] = require('@mocks/legend_style');
figs['legend_valign_middle'] = require('@mocks/legend_valign_middle');
figs['legend_valign_top'] = require('@mocks/legend_valign_top');
figs['legend_visibility'] = require('@mocks/legend_visibility');
figs['legend_x_push_margin_constrained'] = require('@mocks/legend_x_push_margin_constrained');
// figs['legend-constant-itemsizing'] = require('@mocks/legend-constant-itemsizing');
figs['legendgroup'] = require('@mocks/legendgroup');
figs['legendgroup_bar-stack'] = require('@mocks/legendgroup_bar-stack');
figs['legendgroup_horizontal_bg_fit'] = require('@mocks/legendgroup_horizontal_bg_fit');
figs['legendgroup_horizontal_wrapping'] = require('@mocks/legendgroup_horizontal_wrapping');
figs['line_grid_color'] = require('@mocks/line_grid_color');
figs['line_grid_width'] = require('@mocks/line_grid_width');
figs['line_scatter'] = require('@mocks/line_scatter');
figs['line_style'] = require('@mocks/line_style');
figs['log_lines_fills'] = require('@mocks/log_lines_fills');
figs['log-axis_no-minor_suffix-prefix'] = require('@mocks/log-axis_no-minor_suffix-prefix');
figs['long_axis_labels'] = require('@mocks/long_axis_labels');
figs['mapbox_0'] = require('@mocks/mapbox_0');
figs['mapbox_angles'] = require('@mocks/mapbox_angles');
figs['mapbox_bubbles'] = require('@mocks/mapbox_bubbles');
figs['mapbox_bubbles-text'] = require('@mocks/mapbox_bubbles-text');
figs['mapbox_carto-style'] = require('@mocks/mapbox_carto-style');
figs['mapbox_choropleth-multiple'] = require('@mocks/mapbox_choropleth-multiple');
figs['mapbox_choropleth-raw-geojson'] = require('@mocks/mapbox_choropleth-raw-geojson');
figs['mapbox_choropleth0'] = require('@mocks/mapbox_choropleth0');
figs['mapbox_choropleth0-legend'] = require('@mocks/mapbox_choropleth0-legend');
figs['mapbox_connectgaps'] = require('@mocks/mapbox_connectgaps');
figs['mapbox_custom-style'] = require('@mocks/mapbox_custom-style');
figs['mapbox_density-multiple'] = require('@mocks/mapbox_density-multiple');
figs['mapbox_density-multiple_legend'] = require('@mocks/mapbox_density-multiple_legend');
figs['mapbox_density0'] = require('@mocks/mapbox_density0');
figs['mapbox_density0-legend'] = require('@mocks/mapbox_density0-legend');
figs['mapbox_earthquake-density'] = require('@mocks/mapbox_earthquake-density');
figs['mapbox_fill'] = require('@mocks/mapbox_fill');
figs['mapbox_geojson-attributes'] = require('@mocks/mapbox_geojson-attributes');
figs['mapbox_layers'] = require('@mocks/mapbox_layers');
figs['mapbox_osm-style'] = require('@mocks/mapbox_osm-style');
figs['mapbox_stamen-style'] = require('@mocks/mapbox_stamen-style');
figs['mapbox_symbol-text'] = require('@mocks/mapbox_symbol-text');
figs['mapbox_texttemplate'] = require('@mocks/mapbox_texttemplate');
figs['mapbox_white-bg-style'] = require('@mocks/mapbox_white-bg-style');
figs['marker_colorscale_template'] = require('@mocks/marker_colorscale_template');
figs['marker_line_width'] = require('@mocks/marker_line_width');
figs['marker_symbols'] = require('@mocks/marker_symbols');
figs['matching-categories'] = require('@mocks/matching-categories');
// figs['matching-missing-axes'] = require('@mocks/matching-missing-axes');
// figs['mathjax'] = require('@mocks/mathjax');
figs['mirror-all-vs-allticks'] = require('@mocks/mirror-all-vs-allticks');
figs['missing-category-order'] = require('@mocks/missing-category-order');
figs['multicategory'] = require('@mocks/multicategory');
figs['multicategory_histograms'] = require('@mocks/multicategory_histograms');
figs['multicategory-inside-ticks'] = require('@mocks/multicategory-inside-ticks');
figs['multicategory-mirror'] = require('@mocks/multicategory-mirror');
figs['multicategory-sorting'] = require('@mocks/multicategory-sorting');
figs['multicategory-y'] = require('@mocks/multicategory-y');
figs['multicategory2'] = require('@mocks/multicategory2');
figs['multiple_axes_double'] = require('@mocks/multiple_axes_double');
figs['multiple_axes_multiple'] = require('@mocks/multiple_axes_multiple');
figs['multiple_subplots'] = require('@mocks/multiple_subplots');
// figs['ohlc_first'] = require('@mocks/ohlc_first');
figs['overlaying-axis-lines'] = require('@mocks/overlaying-axis-lines');
figs['parcats_bad-displayindex'] = require('@mocks/parcats_bad-displayindex');
figs['parcats_basic'] = require('@mocks/parcats_basic');
figs['parcats_basic_freeform'] = require('@mocks/parcats_basic_freeform');
figs['parcats_bundled'] = require('@mocks/parcats_bundled');
figs['parcats_bundled_reversed'] = require('@mocks/parcats_bundled_reversed');
figs['parcats_colorscale_template'] = require('@mocks/parcats_colorscale_template');
figs['parcats_dark'] = require('@mocks/parcats_dark');
figs['parcats_grid_subplots'] = require('@mocks/parcats_grid_subplots');
figs['parcats_hoveron_color'] = require('@mocks/parcats_hoveron_color');
figs['parcats_hoveron_dimension'] = require('@mocks/parcats_hoveron_dimension');
figs['parcats_invisible_dimension'] = require('@mocks/parcats_invisible_dimension');
figs['parcats_numeric_sort'] = require('@mocks/parcats_numeric_sort');
figs['parcats_reordered'] = require('@mocks/parcats_reordered');
figs['parcats_unbundled'] = require('@mocks/parcats_unbundled');
figs['percent_error_bar'] = require('@mocks/percent_error_bar');
figs['period_positioning'] = require('@mocks/period_positioning');
figs['period_positioning2'] = require('@mocks/period_positioning2');
figs['period_positioning3'] = require('@mocks/period_positioning3');
figs['period_positioning4'] = require('@mocks/period_positioning4');
figs['period_positioning5'] = require('@mocks/period_positioning5');
figs['period_positioning6'] = require('@mocks/period_positioning6');
figs['period_positioning7'] = require('@mocks/period_positioning7');
figs['period_positioning8'] = require('@mocks/period_positioning8');
figs['picnic_heatmap'] = require('@mocks/picnic_heatmap');
figs['pie_aggregated'] = require('@mocks/pie_aggregated');
figs['pie_automargin'] = require('@mocks/pie_automargin');
figs['pie_automargin-margin0'] = require('@mocks/pie_automargin-margin0');
figs['pie_fonts'] = require('@mocks/pie_fonts');
figs['pie_inside-text-orientation'] = require('@mocks/pie_inside-text-orientation');
figs['pie_label0_dlabel'] = require('@mocks/pie_label0_dlabel');
figs['pie_labels_colors_text'] = require('@mocks/pie_labels_colors_text');
figs['pie_legend_line_color_array'] = require('@mocks/pie_legend_line_color_array');
figs['pie_scale_textpos_hideslices'] = require('@mocks/pie_scale_textpos_hideslices');
figs['pie_simple'] = require('@mocks/pie_simple');
figs['pie_sort_direction'] = require('@mocks/pie_sort_direction');
figs['pie_style'] = require('@mocks/pie_style');
figs['pie_style_arrays'] = require('@mocks/pie_style_arrays');
figs['pie_textpad_radial'] = require('@mocks/pie_textpad_radial');
figs['pie_textpad_tangential'] = require('@mocks/pie_textpad_tangential');
figs['pie_title_groupscale'] = require('@mocks/pie_title_groupscale');
figs['pie_title_middle_center'] = require('@mocks/pie_title_middle_center');
figs['pie_title_middle_center_multiline'] = require('@mocks/pie_title_middle_center_multiline');
figs['pie_title_multiple'] = require('@mocks/pie_title_multiple');
figs['pie_title_pull'] = require('@mocks/pie_title_pull');
figs['pie_title_subscript'] = require('@mocks/pie_title_subscript');
figs['pie_title_variations'] = require('@mocks/pie_title_variations');
// figs['plot_types'] = require('@mocks/plot_types');
figs['point-selection'] = require('@mocks/point-selection');
figs['point-selection2'] = require('@mocks/point-selection2');
figs['polar_bar-overlay'] = require('@mocks/polar_bar-overlay');
figs['polar_bar-stacked'] = require('@mocks/polar_bar-stacked');
figs['polar_bar-width-base-offset'] = require('@mocks/polar_bar-width-base-offset');
// figs['polar_blank'] = require('@mocks/polar_blank');
figs['polar_categories'] = require('@mocks/polar_categories');
// figs['polar_dates'] = require('@mocks/polar_dates');
figs['polar_direction'] = require('@mocks/polar_direction');
figs['polar_fills'] = require('@mocks/polar_fills');
figs['polar_funky-bars'] = require('@mocks/polar_funky-bars');
figs['polar_hole'] = require('@mocks/polar_hole');
figs['polar_line'] = require('@mocks/polar_line');
figs['polar_long-category-angular-labels'] = require('@mocks/polar_long-category-angular-labels');
figs['polar_polygon-bars'] = require('@mocks/polar_polygon-bars');
figs['polar_polygon-grids'] = require('@mocks/polar_polygon-grids');
figs['polar_r0dr-theta0dtheta'] = require('@mocks/polar_r0dr-theta0dtheta');
figs['polar_radial-range'] = require('@mocks/polar_radial-range');
figs['polar_scatter'] = require('@mocks/polar_scatter');
figs['polar_sector'] = require('@mocks/polar_sector');
figs['polar_subplots'] = require('@mocks/polar_subplots');
figs['polar_template'] = require('@mocks/polar_template');
figs['polar_ticks'] = require('@mocks/polar_ticks');
// figs['polar_transforms'] = require('@mocks/polar_transforms');
figs['polar_wind-rose'] = require('@mocks/polar_wind-rose');
figs['portland_heatmap'] = require('@mocks/portland_heatmap');
figs['pseudo_html'] = require('@mocks/pseudo_html');
figs['range_selector'] = require('@mocks/range_selector');
figs['range_selector_style'] = require('@mocks/range_selector_style');
figs['range_slider'] = require('@mocks/range_slider');
figs['range_slider_axes_double'] = require('@mocks/range_slider_axes_double');
figs['range_slider_axes_stacked'] = require('@mocks/range_slider_axes_stacked');
// figs['range_slider_box'] = require('@mocks/range_slider_box');
figs['range_slider_initial_expanded'] = require('@mocks/range_slider_initial_expanded');
figs['range_slider_initial_valid'] = require('@mocks/range_slider_initial_valid');
figs['range_slider_legend_left'] = require('@mocks/range_slider_legend_left');
figs['range_slider_multiple'] = require('@mocks/range_slider_multiple');
figs['range_slider_rangemode'] = require('@mocks/range_slider_rangemode');
figs['range_slider_reversed-range'] = require('@mocks/range_slider_reversed-range');
figs['range_slider_top_axis'] = require('@mocks/range_slider_top_axis');
figs['rdbu_heatmap'] = require('@mocks/rdbu_heatmap');
figs['reversed-axis-dividers'] = require('@mocks/reversed-axis-dividers');
figs['sankey_circular'] = require('@mocks/sankey_circular');
figs['sankey_circular_large'] = require('@mocks/sankey_circular_large');
figs['sankey_circular_process'] = require('@mocks/sankey_circular_process');
figs['sankey_circular_simple'] = require('@mocks/sankey_circular_simple');
figs['sankey_circular_simple2'] = require('@mocks/sankey_circular_simple2');
figs['sankey_energy'] = require('@mocks/sankey_energy');
figs['sankey_energy_dark'] = require('@mocks/sankey_energy_dark');
figs['sankey_groups'] = require('@mocks/sankey_groups');
figs['sankey_large_padding'] = require('@mocks/sankey_large_padding');
figs['sankey_link_concentration'] = require('@mocks/sankey_link_concentration');
figs['sankey_messy'] = require('@mocks/sankey_messy');
figs['sankey_subplots'] = require('@mocks/sankey_subplots');
figs['sankey_subplots_circular'] = require('@mocks/sankey_subplots_circular');
figs['sankey_x_y'] = require('@mocks/sankey_x_y');
figs['scatter_category_total_descending'] = require('@mocks/scatter_category_total_descending');
figs['scatter_errorbars_inherit_color'] = require('@mocks/scatter_errorbars_inherit_color');
figs['scatter_fill_corner_cases'] = require('@mocks/scatter_fill_corner_cases');
figs['scatter_fill_no_opacity'] = require('@mocks/scatter_fill_no_opacity');
figs['scatter_fill_self_next'] = require('@mocks/scatter_fill_self_next');
figs['scatter_fill_self_opacity'] = require('@mocks/scatter_fill_self_opacity');
figs['scatter-colorscale-colorbar'] = require('@mocks/scatter-colorscale-colorbar');
figs['scatter-marker-line-colorscales'] = require('@mocks/scatter-marker-line-colorscales');
figs['scattercarpet'] = require('@mocks/scattercarpet');
figs['scattercarpet-on-two-carpets'] = require('@mocks/scattercarpet-on-two-carpets');
figs['scattercarpet-text'] = require('@mocks/scattercarpet-text');
figs['shapes'] = require('@mocks/shapes');
figs['shapes_below_traces'] = require('@mocks/shapes_below_traces');
// figs['shapes_fixed_size'] = require('@mocks/shapes_fixed_size');
figs['shapes_move-and-reshape-lines'] = require('@mocks/shapes_move-and-reshape-lines');
figs['shared_axes_subplots'] = require('@mocks/shared_axes_subplots');
figs['shared_coloraxes'] = require('@mocks/shared_coloraxes');
figs['shared_coloraxes_contour'] = require('@mocks/shared_coloraxes_contour');
figs['show_legend'] = require('@mocks/show_legend');
figs['simple_annotation'] = require('@mocks/simple_annotation');
figs['simple_contour'] = require('@mocks/simple_contour');
figs['simple_inset'] = require('@mocks/simple_inset');
figs['simple_subplot'] = require('@mocks/simple_subplot');
figs['size_margins'] = require('@mocks/size_margins');
figs['sliders'] = require('@mocks/sliders');
figs['sort_by_total_matching_axes'] = require('@mocks/sort_by_total_matching_axes');
figs['splom_0'] = require('@mocks/splom_0');
figs['splom_array-styles'] = require('@mocks/splom_array-styles');
figs['splom_dates'] = require('@mocks/splom_dates');
figs['splom_iris'] = require('@mocks/splom_iris');
figs['splom_iris-matching'] = require('@mocks/splom_iris-matching');
figs['splom_large'] = require('@mocks/splom_large');
figs['splom_log'] = require('@mocks/splom_log');
figs['splom_lower'] = require('@mocks/splom_lower');
figs['splom_lower-nodiag'] = require('@mocks/splom_lower-nodiag');
figs['splom_lower-nodiag-matching'] = require('@mocks/splom_lower-nodiag-matching');
figs['splom_mismatched-axis-types'] = require('@mocks/splom_mismatched-axis-types');
figs['splom_multi-axis-type'] = require('@mocks/splom_multi-axis-type');
figs['splom_nodiag'] = require('@mocks/splom_nodiag');
// figs['splom_ragged-via-axes'] = require('@mocks/splom_ragged-via-axes');
figs['splom_ragged-via-visible-false'] = require('@mocks/splom_ragged-via-visible-false');
figs['splom_symbol_numbers'] = require('@mocks/splom_symbol_numbers');
figs['splom_upper'] = require('@mocks/splom_upper');
figs['splom_upper-nodiag'] = require('@mocks/splom_upper-nodiag');
figs['splom_with-cartesian'] = require('@mocks/splom_with-cartesian');
figs['stacked_area'] = require('@mocks/stacked_area');
// figs['stacked_area_duplicates'] = require('@mocks/stacked_area_duplicates');
figs['stacked_area_groupby'] = require('@mocks/stacked_area_groupby');
figs['stacked_area_groups'] = require('@mocks/stacked_area_groups');
figs['stacked_area_horz'] = require('@mocks/stacked_area_horz');
figs['stacked_area_log'] = require('@mocks/stacked_area_log');
figs['stacked_bar'] = require('@mocks/stacked_bar');
figs['stacked_coupled_subplots'] = require('@mocks/stacked_coupled_subplots');
figs['stacked_subplots'] = require('@mocks/stacked_subplots');
figs['stacked_subplots_shared_yaxis'] = require('@mocks/stacked_subplots_shared_yaxis');
figs['style_bar'] = require('@mocks/style_bar');
figs['styling_names'] = require('@mocks/styling_names');
figs['sunburst_branchvalues-total-almost-equal'] = require('@mocks/sunburst_branchvalues-total-almost-equal');
figs['sunburst_coffee'] = require('@mocks/sunburst_coffee');
figs['sunburst_coffee-maxdepth3'] = require('@mocks/sunburst_coffee-maxdepth3');
figs['sunburst_count_branches'] = require('@mocks/sunburst_count_branches');
figs['sunburst_first'] = require('@mocks/sunburst_first');
figs['sunburst_flare'] = require('@mocks/sunburst_flare');
figs['sunburst_inside-text-orientation'] = require('@mocks/sunburst_inside-text-orientation');
figs['sunburst_inside-text-orientation_clock'] = require('@mocks/sunburst_inside-text-orientation_clock');
figs['sunburst_level-depth'] = require('@mocks/sunburst_level-depth');
figs['sunburst_packages_colorscale_novalue'] = require('@mocks/sunburst_packages_colorscale_novalue');
figs['sunburst_textfit'] = require('@mocks/sunburst_textfit');
figs['sunburst_textpad_radial'] = require('@mocks/sunburst_textpad_radial');
figs['sunburst_textpad_tangential'] = require('@mocks/sunburst_textpad_tangential');
figs['sunburst_values'] = require('@mocks/sunburst_values');
figs['sunburst_values_colorscale'] = require('@mocks/sunburst_values_colorscale');
figs['sunburst_with-without_values'] = require('@mocks/sunburst_with-without_values');
figs['sunburst_zero_values_textfit'] = require('@mocks/sunburst_zero_values_textfit');
figs['symbols_string-numbers'] = require('@mocks/symbols_string-numbers');
figs['table_latex_multitrace_scatter'] = require('@mocks/table_latex_multitrace_scatter');
// figs['table_plain_birds'] = require('@mocks/table_plain_birds');
figs['table_ragged'] = require('@mocks/table_ragged');
// figs['table_wrapped_birds'] = require('@mocks/table_wrapped_birds');
figs['template'] = require('@mocks/template');
figs['ternary_array_styles'] = require('@mocks/ternary_array_styles');
figs['ternary_axis_layers'] = require('@mocks/ternary_axis_layers');
figs['ternary_fill'] = require('@mocks/ternary_fill');
figs['ternary_lines'] = require('@mocks/ternary_lines');
figs['ternary_markers'] = require('@mocks/ternary_markers');
figs['ternary_multiple'] = require('@mocks/ternary_multiple');
figs['ternary_noticks'] = require('@mocks/ternary_noticks');
figs['ternary_simple'] = require('@mocks/ternary_simple');
figs['ternary-mathjax'] = require('@mocks/ternary-mathjax');
figs['text_chart_arrays'] = require('@mocks/text_chart_arrays');
// figs['text_chart_basic'] = require('@mocks/text_chart_basic');
figs['text_chart_invalid-arrays'] = require('@mocks/text_chart_invalid-arrays');
// figs['text_chart_single-string'] = require('@mocks/text_chart_single-string');
// figs['text_chart_styling'] = require('@mocks/text_chart_styling');
figs['text_export'] = require('@mocks/text_export');
// figs['texttemplate'] = require('@mocks/texttemplate');
// figs['texttemplate_scatter'] = require('@mocks/texttemplate_scatter');
figs['tick_attributes'] = require('@mocks/tick_attributes');
figs['tick_prefix_suffix'] = require('@mocks/tick_prefix_suffix');
figs['tick_prefix_suffix_exponent'] = require('@mocks/tick_prefix_suffix_exponent');
figs['tick-datafn'] = require('@mocks/tick-datafn');
figs['tick-increment'] = require('@mocks/tick-increment');
figs['tick-percent'] = require('@mocks/tick-percent');
figs['tickformat'] = require('@mocks/tickformat');
figs['tickformatstops'] = require('@mocks/tickformatstops');
figs['ticklabelposition-0'] = require('@mocks/ticklabelposition-0');
figs['ticklabelposition-1'] = require('@mocks/ticklabelposition-1');
figs['ticklabelposition-2'] = require('@mocks/ticklabelposition-2');
figs['ticklabelposition-3'] = require('@mocks/ticklabelposition-3');
figs['ticklabelposition-4'] = require('@mocks/ticklabelposition-4');
figs['ticklabelposition-a'] = require('@mocks/ticklabelposition-a');
figs['ticklabelposition-b'] = require('@mocks/ticklabelposition-b');
figs['ticklabelposition-c'] = require('@mocks/ticklabelposition-c');
figs['ticklabelposition-d'] = require('@mocks/ticklabelposition-d');
figs['tickson_boundaries'] = require('@mocks/tickson_boundaries');
// figs['titles-avoid-labels'] = require('@mocks/titles-avoid-labels');
// figs['trace_metatext'] = require('@mocks/trace_metatext');
// figs['transforms'] = require('@mocks/transforms');
figs['treemap_coffee'] = require('@mocks/treemap_coffee');
figs['treemap_coffee-maxdepth3'] = require('@mocks/treemap_coffee-maxdepth3');
figs['treemap_first'] = require('@mocks/treemap_first');
figs['treemap_flare'] = require('@mocks/treemap_flare');
figs['treemap_fonts_nocolor'] = require('@mocks/treemap_fonts_nocolor');
figs['treemap_fonts_withcolor'] = require('@mocks/treemap_fonts_withcolor');
figs['treemap_level-depth'] = require('@mocks/treemap_level-depth');
figs['treemap_packages_colorscale_allone'] = require('@mocks/treemap_packages_colorscale_allone');
figs['treemap_packages_colorscale_novalue'] = require('@mocks/treemap_packages_colorscale_novalue');
figs['treemap_packings'] = require('@mocks/treemap_packings');
figs['treemap_pad_mirror'] = require('@mocks/treemap_pad_mirror');
figs['treemap_pad_transpose'] = require('@mocks/treemap_pad_transpose');
figs['treemap_root-color'] = require('@mocks/treemap_root-color');
figs['treemap_sunburst_basic'] = require('@mocks/treemap_sunburst_basic');
figs['treemap_sunburst_marker_colors'] = require('@mocks/treemap_sunburst_marker_colors');
figs['treemap_textfit'] = require('@mocks/treemap_textfit');
figs['treemap_textposition'] = require('@mocks/treemap_textposition');
figs['treemap_transpose_nopad'] = require('@mocks/treemap_transpose_nopad');
figs['treemap_values'] = require('@mocks/treemap_values');
figs['treemap_values_colorscale'] = require('@mocks/treemap_values_colorscale');
figs['treemap_with-without_values'] = require('@mocks/treemap_with-without_values');
figs['treemap_with-without_values_template'] = require('@mocks/treemap_with-without_values_template');
figs['ultra_zoom'] = require('@mocks/ultra_zoom');
figs['ultra_zoom_fill'] = require('@mocks/ultra_zoom_fill');
figs['uniformtext_bar_axis_textangle_inside'] = require('@mocks/uniformtext_bar_axis_textangle_inside');
figs['uniformtext_bar_axis_textangle_outside'] = require('@mocks/uniformtext_bar_axis_textangle_outside');
figs['uniformtext_bar_edgecase1'] = require('@mocks/uniformtext_bar_edgecase1');
figs['uniformtext_bar_edgecase2'] = require('@mocks/uniformtext_bar_edgecase2');
figs['uniformtext_bar_edgecase3'] = require('@mocks/uniformtext_bar_edgecase3');
figs['uniformtext_bar_edgecase4'] = require('@mocks/uniformtext_bar_edgecase4');
figs['uniformtext_bar_edgecase5'] = require('@mocks/uniformtext_bar_edgecase5');
figs['uniformtext_bar_edgecase6'] = require('@mocks/uniformtext_bar_edgecase6');
figs['uniformtext_bar_edgecase7'] = require('@mocks/uniformtext_bar_edgecase7');
figs['uniformtext_bar_edgecase8'] = require('@mocks/uniformtext_bar_edgecase8');
figs['uniformtext_bar-like_10_auto'] = require('@mocks/uniformtext_bar-like_10_auto');
figs['uniformtext_bar-like_8_horizontal'] = require('@mocks/uniformtext_bar-like_8_horizontal');
figs['uniformtext_bar-like_8_textangle'] = require('@mocks/uniformtext_bar-like_8_textangle');
figs['uniformtext_bar-like_8_textangle45'] = require('@mocks/uniformtext_bar-like_8_textangle45');
figs['uniformtext_funnelarea'] = require('@mocks/uniformtext_funnelarea');
figs['uniformtext_pie_16_auto'] = require('@mocks/uniformtext_pie_16_auto');
figs['uniformtext_pie_8_horizontal'] = require('@mocks/uniformtext_pie_8_horizontal');
figs['uniformtext_pie_8_horizontal_center'] = require('@mocks/uniformtext_pie_8_horizontal_center');
figs['uniformtext_pie_8_radial'] = require('@mocks/uniformtext_pie_8_radial');
figs['uniformtext_pie_8_tangential'] = require('@mocks/uniformtext_pie_8_tangential');
figs['uniformtext_pie_inside-text-orientation'] = require('@mocks/uniformtext_pie_inside-text-orientation');
figs['uniformtext_pie_outside'] = require('@mocks/uniformtext_pie_outside');
figs['uniformtext_pie_pull'] = require('@mocks/uniformtext_pie_pull');
figs['uniformtext_sunburst_inside-text-orientation'] = require('@mocks/uniformtext_sunburst_inside-text-orientation');
figs['uniformtext_sunburst_treemap'] = require('@mocks/uniformtext_sunburst_treemap');
figs['uniformtext_treemap'] = require('@mocks/uniformtext_treemap');
figs['uniformtext_treemap_coffee-maxdepth3'] = require('@mocks/uniformtext_treemap_coffee-maxdepth3');
// figs['updatemenus'] = require('@mocks/updatemenus');
figs['updatemenus_positioning'] = require('@mocks/updatemenus_positioning');
figs['updatemenus_toggle'] = require('@mocks/updatemenus_toggle');
figs['vertical-tickangles'] = require('@mocks/vertical-tickangles');
figs['violin_bandwidth-edge-cases'] = require('@mocks/violin_bandwidth-edge-cases');
figs['violin_box_multiple_widths'] = require('@mocks/violin_box_multiple_widths');
figs['violin_box_overlay'] = require('@mocks/violin_box_overlay');
figs['violin_grouped'] = require('@mocks/violin_grouped');
figs['violin_grouped_horz-multicategory'] = require('@mocks/violin_grouped_horz-multicategory');
figs['violin_log_scale'] = require('@mocks/violin_log_scale');
figs['violin_negative_sides_w_points'] = require('@mocks/violin_negative_sides_w_points');
// figs['violin_non-linear'] = require('@mocks/violin_non-linear');
figs['violin_old-faithful'] = require('@mocks/violin_old-faithful');
figs['violin_one-sided'] = require('@mocks/violin_one-sided');
figs['violin_only_zeroes'] = require('@mocks/violin_only_zeroes');
figs['violin_positive_and_negative'] = require('@mocks/violin_positive_and_negative');
figs['violin_positive_sides_w_points'] = require('@mocks/violin_positive_sides_w_points');
// figs['violin_ridgeplot'] = require('@mocks/violin_ridgeplot');
figs['violin_side-by-side'] = require('@mocks/violin_side-by-side');
// figs['violin_style'] = require('@mocks/violin_style');
figs['violin_zoomed-in'] = require('@mocks/violin_zoomed-in');
figs['violin-offsetgroups'] = require('@mocks/violin-offsetgroups');
figs['viridis_heatmap'] = require('@mocks/viridis_heatmap');
// figs['waterfall_11'] = require('@mocks/waterfall_11');
figs['waterfall_and_bar'] = require('@mocks/waterfall_and_bar');
figs['waterfall_and_histogram'] = require('@mocks/waterfall_and_histogram');
figs['waterfall_attrs'] = require('@mocks/waterfall_attrs');
figs['waterfall_axis'] = require('@mocks/waterfall_axis');
figs['waterfall_cliponaxis-false'] = require('@mocks/waterfall_cliponaxis-false');
figs['waterfall_custom'] = require('@mocks/waterfall_custom');
figs['waterfall_date-axes'] = require('@mocks/waterfall_date-axes');
// figs['waterfall_funnel_texttemplate_date'] = require('@mocks/waterfall_funnel_texttemplate_date');
figs['waterfall_gap0'] = require('@mocks/waterfall_gap0');
figs['waterfall_line'] = require('@mocks/waterfall_line');
figs['waterfall_months'] = require('@mocks/waterfall_months');
figs['waterfall_multicategory'] = require('@mocks/waterfall_multicategory');
figs['waterfall_nonnumeric_sizes'] = require('@mocks/waterfall_nonnumeric_sizes');
figs['waterfall_profit-loss_2018_positive-negative'] = require('@mocks/waterfall_profit-loss_2018_positive-negative');
figs['waterfall_profit-loss_2018vs2019_overlay'] = require('@mocks/waterfall_profit-loss_2018vs2019_overlay');
figs['waterfall_profit-loss_2018vs2019_rectangle'] = require('@mocks/waterfall_profit-loss_2018vs2019_rectangle');
figs['waterfall_profit-loss_2018vs2019_textinfo_base'] = require('@mocks/waterfall_profit-loss_2018vs2019_textinfo_base');
figs['waterfall-grouping-vs-defaults'] = require('@mocks/waterfall-grouping-vs-defaults');
figs['waterfall-offsetgroups'] = require('@mocks/waterfall-offsetgroups');
// figs['world-cals'] = require('@mocks/world-cals');
// figs['yaxis-over-yaxis2'] = require('@mocks/yaxis-over-yaxis2');
// figs['yignbu_heatmap'] = require('@mocks/yignbu_heatmap');
// figs['yiorrd_heatmap'] = require('@mocks/yiorrd_heatmap');
figs['zsmooth_methods'] = require('@mocks/zsmooth_methods');

describe('@noCI mock validation', function() {
    list.forEach(function(name) {
        var figure = figs[name];
        if(figure) {
            it('validating mock: "' + name + '"', function() {
                var out = Plotly.validate(
                    figure.data,
                    figure.layout
                );
                assert(name, out);
            });
        }
    });
});

function assert(name, v) {
    var success = true;
    if(!v) {
        expect(v).toBeUndefined();
        if(v !== undefined) success = false;
    } else {
        v.forEach(function(e) {
            var condition = (
                e.code === 'invisible' ||
                e.code === 'dynamic' ||
                e.path[e.path.length - 1] === 'coloraxis'
            );
            expect(condition).toBe(true); // we accept invisible, dynamic and coloraxis for now
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
