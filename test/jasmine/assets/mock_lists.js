// list of mocks that should include *all* plotly.js trace modules

var svgMockList = [
    ['1', require('@mocks/1.json')],
    ['4', require('@mocks/4.json')],
    ['5', require('@mocks/5.json')],
    ['10', require('@mocks/10.json')],
    ['11', require('@mocks/11.json')],
    ['17', require('@mocks/17.json')],
    ['21', require('@mocks/21.json')],
    ['22', require('@mocks/22.json')],
    ['airfoil', require('@mocks/airfoil.json')], // important to keep because it's the only mock with config options
    ['annotations-autorange', require('@mocks/annotations-autorange.json')],
    ['axes_enumerated_ticks', require('@mocks/axes_enumerated_ticks.json')],
    ['axes_visible-false', require('@mocks/axes_visible-false.json')],
    ['bar_and_histogram', require('@mocks/bar_and_histogram.json')],
    ['waterfall', require('@mocks/waterfall_profit-loss_2018vs2019_rectangle.json')],
    ['basic_error_bar', require('@mocks/basic_error_bar.json')],
    ['binding', require('@mocks/binding.json')],
    ['cheater_smooth', require('@mocks/cheater_smooth.json')],
    ['finance_style', require('@mocks/finance_style.json')],
    ['geo_first', require('@mocks/geo_first.json')],
    ['layout_image', require('@mocks/layout_image.json')],
    ['layout-colorway', require('@mocks/layout-colorway.json')],
    ['multicategory', require('@mocks/multicategory.json')],
    ['polar_categories', require('@mocks/polar_categories.json')],
    ['polar_direction', require('@mocks/polar_direction.json')],
    ['polar_wind-rose', require('@mocks/polar_wind-rose.json')],
    ['range_selector_style', require('@mocks/range_selector_style.json')],
    ['range_slider_multiple', require('@mocks/range_slider_multiple.json')],
    ['sankey_energy', require('@mocks/sankey_energy.json')],
    ['parcats_bad-displayindex', require('@mocks/parcats_bad-displayindex.json')],
    ['scattercarpet', require('@mocks/scattercarpet.json')],
    ['shapes', require('@mocks/shapes.json')],
    ['splom_iris', require('@mocks/splom_iris.json')],
    ['table_wrapped_birds', require('@mocks/table_wrapped_birds.json')],
    ['ternary_fill', require('@mocks/ternary_fill.json')],
    ['text_chart_arrays', require('@mocks/text_chart_arrays.json')],
    ['transforms', require('@mocks/transforms.json')],
    ['updatemenus', require('@mocks/updatemenus.json')],
    ['violin_side-by-side', require('@mocks/violin_side-by-side.json')],
    ['world-cals', require('@mocks/world-cals.json')],
    ['typed arrays', {
        data: [{
            x: new Float32Array([1, 2, 3]),
            y: new Float32Array([1, 2, 1])
        }]
    }]
];

var glMockList = [
    ['gl2d_heatmapgl', require('@mocks/gl2d_heatmapgl.json')],
    ['gl2d_line_dash', require('@mocks/gl2d_line_dash.json')],
    ['gl2d_parcoords_2', require('@mocks/gl2d_parcoords_2.json')],
    ['gl2d_pointcloud-basic', require('@mocks/gl2d_pointcloud-basic.json')],
    ['gl3d_annotations', require('@mocks/gl3d_annotations.json')],
    ['gl3d_set-ranges', require('@mocks/gl3d_set-ranges.json')],
    ['gl3d_world-cals', require('@mocks/gl3d_world-cals.json')],
    ['gl3d_cone-autorange', require('@mocks/gl3d_cone-autorange.json')],
    ['gl3d_streamtube-simple', require('@mocks/gl3d_streamtube-simple.json')],
    ['glpolar_style', require('@mocks/glpolar_style.json')],
    ['gl3d_isosurface_multiple-traces', require('@mocks/gl3d_isosurface_out_of_iso_range_case.json')]
];

var mapboxMockList = [
    ['scattermapbox', require('@mocks/mapbox_bubbles-text.json')]
];

module.exports = {
    svg: svgMockList,
    gl: glMockList,
    mapbox: mapboxMockList,
    all: svgMockList.concat(glMockList).concat(mapboxMockList)
};
