import asyncio
import json
import kaleido
import os
import sys

root = os.getcwd()
dirIn = os.path.join(root, "test", "image", "mocks")
dirOut = os.path.join(root, "build", "test_images")
os.makedirs(dirOut, exist_ok=True)

plotlyjs = os.path.join(root, "build", "plotly.js")
topojson = "file://" + os.path.join(root, "topojson", "dist")

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


async def make_exports_async():
    global failed

    async with kaleido.Kaleido(n=1, plotlyjs=plotlyjs) as k:
        for name in allNames:
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

                for fmt in allFormats:
                    print(name + " --> " + fmt)

                    try:
                        data = await k.calc_fig(
                            fig,
                            opts=dict(
                                format=fmt,
                                width=width,
                                height=height,
                            ),
                            topojson=topojson,
                        )
                        filename = os.path.join(dirOut, name + "." + fmt)
                        with open(filename, "wb") as f:
                            f.write(data)

                    except Exception as e:
                        print(e)
                        failed += 1


if __name__ == "__main__":
    asyncio.run(make_exports_async())
    if failed > 0:
        sys.exit(1)
