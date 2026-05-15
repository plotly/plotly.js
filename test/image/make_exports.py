import os
import sys
import json
import plotly.io as pio

root = os.getcwd()
dirIn = os.path.join(root, "test", "image", "mocks")
dirOut = os.path.join(root, "build", "test_images")

pio.templates.default = "none"
pio.kaleido.scope.plotlyjs = os.path.join(root, "build", "plotly.js")

allFormats = ["svg", "jpg", "jpeg", "webp", "pdf"]
# 'png' is tested by image-test

allNames = [
    "annotations",
    "contour_legend-colorscale",
    "fonts",
    "gl2d_no-clustering2",
    "gl3d_surface-heatmap-treemap_transparent-colorscale",
    "image_astronaut_source",
    "layout_image",
    "map_density-multiple_legend",
    "mathjax",
    "plot_types",
    "range_slider",
    "shapes",
    "smith_modes",
    "worldcup",
    "zsmooth_methods",
]

failed = 0
for name in allNames:
    for fmt in allFormats:
        print(name + " --> " + fmt)

        with open(os.path.join(dirIn, name + ".json"), "r") as _in:
            fig = json.load(_in)

            width = 700
            height = 500
            if "layout" in fig:
                layout = fig["layout"]
                if "autosize" not in layout or layout["autosize"] != True:
                    if "width" in layout:
                        width = layout["width"]
                    if "height" in layout:
                        height = layout["height"]

            try:
                pio.write_image(
                    fig=fig,
                    file=os.path.join(dirOut, name + "." + fmt),
                    width=width,
                    height=height,
                    validate=False,
                )

            except Exception as e:
                print(e)
                failed += 1

if failed > 0:
    sys.exit(1)
