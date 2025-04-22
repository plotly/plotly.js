// list of mocks that should include *all* plotly.js trace modules

var svgMockList = [
    ['1', require('../../image/mocks/1.json')],
    ['4', require('../../image/mocks/4.json')],
    ['5', require('../../image/mocks/5.json')],
    ['10', require('../../image/mocks/10.json')],
    ['11', require('../../image/mocks/11.json')],
    ['17', require('../../image/mocks/17.json')],
    ['21', require('../../image/mocks/21.json')],
    ['22', require('../../image/mocks/22.json')],
    ['airfoil', require('../../image/mocks/airfoil.json')], // important to keep because it's the only mock with config options
    ['annotations-autorange', require('../../image/mocks/annotations-autorange.json')],
    ['axes_enumerated_ticks', require('../../image/mocks/axes_enumerated_ticks.json')],
    ['axes_visible-false', require('../../image/mocks/axes_visible-false.json')],
    ['bar_and_histogram', require('../../image/mocks/bar_and_histogram.json')],
    ['waterfall', require('../../image/mocks/waterfall_profit-loss_2018vs2019_rectangle.json')],
    ['funnel', require('../../image/mocks/funnel_horizontal_group_basic.json')],
    ['funnelarea', require('../../image/mocks/funnelarea_title_multiple.json')],
    ['basic_error_bar', require('../../image/mocks/basic_error_bar.json')],
    ['binding', require('../../image/mocks/binding.json')],
    ['cheater_smooth', require('../../image/mocks/cheater_smooth.json')],
    ['finance_style', require('../../image/mocks/finance_style.json')],
    ['geo_first', require('../../image/mocks/geo_first.json')],
    ['indicator_bignumber', require('../../image/mocks/indicator_bignumber.json')],
    ['image_adventurer', require('../../image/mocks/image_adventurer.json')],
    ['layout_image', require('../../image/mocks/layout_image.json')],
    ['layout-colorway', require('../../image/mocks/layout-colorway.json')],
    ['multicategory', require('../../image/mocks/multicategory.json')],
    ['polar_categories', require('../../image/mocks/polar_categories.json')],
    ['polar_direction', require('../../image/mocks/polar_direction.json')],
    ['polar_wind-rose', require('../../image/mocks/polar_wind-rose.json')],
    ['range_selector_style', require('../../image/mocks/range_selector_style.json')],
    ['range_slider_multiple', require('../../image/mocks/range_slider_multiple.json')],
    ['sankey_energy', require('../../image/mocks/sankey_energy.json')],
    ['sunburst_coffee', require('../../image/mocks/sunburst_coffee.json')],
    ['treemap_coffee', require('../../image/mocks/treemap_coffee.json')],
    ['icicle_coffee', require('../../image/mocks/icicle_coffee.json')],
    ['parcats_bad-displayindex', require('../../image/mocks/parcats_bad-displayindex.json')],
    ['scattercarpet', require('../../image/mocks/scattercarpet.json')],
    ['smith_basic', require('../../image/mocks/smith_basic.json')],
    ['shapes', require('../../image/mocks/shapes.json')],
    ['splom_iris', require('../../image/mocks/splom_iris.json')],
    ['table_wrapped_birds', require('../../image/mocks/table_wrapped_birds.json')],
    ['ternary_fill', require('../../image/mocks/ternary_fill.json')],
    ['text_chart_arrays', require('../../image/mocks/text_chart_arrays.json')],
    ['updatemenus', require('../../image/mocks/updatemenus.json')],
    ['violin_side-by-side', require('../../image/mocks/violin_side-by-side.json')],
    ['world-cals', require('../../image/mocks/world-cals.json')],
    ['typed arrays', {
        data: [{
            x: new Float32Array([1, 2, 3]),
            y: new Float32Array([1, 2, 1])
        }]
    }]
];

var glMockList = [
    ['gl2d_line_dash', require('../../image/mocks/gl2d_line_dash.json')],
    ['gl2d_parcoords_2', require('../../image/mocks/gl2d_parcoords_2.json')],
    ['gl3d_annotations', require('../../image/mocks/gl3d_annotations.json')],
    ['gl3d_set-ranges', require('../../image/mocks/gl3d_set-ranges.json')],
    ['gl3d_world-cals', require('../../image/mocks/gl3d_world-cals.json')],
    ['gl3d_cone-autorange', require('../../image/mocks/gl3d_cone-autorange.json')],
    ['gl3d_streamtube-simple', require('../../image/mocks/gl3d_streamtube-simple.json')],
    ['glpolar_style', require('../../image/mocks/glpolar_style.json')],
    ['gl3d_isosurface_multiple-traces', require('../../image/mocks/gl3d_isosurface_multiple-traces.json')],
    ['gl3d_volume_multiple-traces', require('../../image/mocks/gl3d_volume_multiple-traces.json')]
];

var mapMockList = [
    ['scattermap', require('../../image/mocks/map_bubbles-text.json')],
    ['choroplethmap', require('../../image/mocks/map_choropleth0.json')],
    ['densitymap', require('../../image/mocks/map_density0.json')]
];

module.exports = {
    svg: svgMockList,
    gl: glMockList,
    map: mapMockList,
    all: svgMockList.concat(glMockList).concat(mapMockList)
};
