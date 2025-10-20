import os
import sys
import json
import plotly.io as pio

root = os.getcwd()
dirIn = os.path.join(root, 'test', 'image', 'mocks')
dirOut = os.path.join(root, 'build', 'test_images')

pio.templates.default = 'none'
pio.kaleido.scope.plotlyjs = os.path.join(root, 'build', 'plotly.js')

allFormats = ['svg', 'jpg', 'jpeg', 'webp', 'pdf']
# 'png' is tested by image-test

allNames = [
    'plot_types',
    'annotations',
    'shapes',
    'range_slider',
    'contour_legend-colorscale',
    'layout_image',
    'image_astronaut_source',
    'gl2d_no-clustering2',
    'gl3d_surface-heatmap-treemap_transparent-colorscale',
    'map_density-multiple_legend',
    'smith_modes',
    'zsmooth_methods',
    'fonts',
    'worldcup',
    'mathjax'
]

failed = 0
for name in allNames :
    for fmt in allFormats :
        print(name + ' --> ' + fmt)

        with open(os.path.join(dirIn, name + '.json'), 'r') as _in :
            fig = json.load(_in)

            width = 700
            height = 500
            if 'layout' in fig :
                layout = fig['layout']
                if 'autosize' not in layout or layout['autosize'] != True :
                    if 'width' in layout :
                        width = layout['width']
                    if 'height' in layout :
                        height = layout['height']

            try :
                pio.write_image(
                    fig=fig,
                    file=os.path.join(dirOut, name + '.' + fmt),
                    width=width,
                    height=height,
                    validate=False
                )

            except Exception as e :
                print(e)
                failed += 1

if failed > 0 : sys.exit(1)
