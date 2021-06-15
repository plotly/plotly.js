import os
import sys
import json
import plotly.io as pio

args = []
if len(sys.argv) == 2 :
    args = sys.argv[1].split()
elif len(sys.argv) > 1 :
    args = sys.argv

root = os.getcwd()
dirIn = os.path.join(root, 'test', 'image', 'mocks')
dirOut = os.path.join(root, 'build', 'test_images')

if '=' in args :
    args = args[args.index('=') + 1:]
    dirOut = os.path.join(root, 'test', 'image', 'baselines')
    print('output to', dirOut)

pio.templates.default = 'none'
pio.kaleido.scope.plotlyjs = os.path.join(root, 'build', 'plotly.js')
# TODO: specify local mathjax and plotly-geo-assets files?

_credentials = open(os.path.join(root, 'build', 'credentials.json'), 'r')
pio.kaleido.scope.mapbox_access_token = json.load(_credentials)['MAPBOX_ACCESS_TOKEN']
_credentials.close()

ALL_MOCKS = [os.path.splitext(a)[0] for a in os.listdir(dirIn) if a.endswith('.json')]
ALL_MOCKS.sort()

if len(args) > 0 :
    allNames = [a for a in args if a in ALL_MOCKS]
else :
    allNames = ALL_MOCKS

# gl2d pointcloud and other non-regl gl2d mock(s)
# must be tested in certain order to work on CircleCI;
#
# gl-shader appears to conflict with regl.
# We suspect that the lone gl context on CircleCI is
# having issues with dealing with the two different
# program binding algorithm.
#
# The problem will be solved by switching all our
# WebGL-based trace types to regl.
#
# More info here:
# https://github.com/plotly/plotly.js/pull/1037

LAST = [
    'gl2d_pointcloud-basic',
    'gl2d_heatmapgl',
    'gl2d_heatmapgl_discrete'
]

HAD = [item in allNames for item in LAST]

allNames = [a for a in allNames if a not in LAST]

allNames += [item for item, had_item in zip(LAST, HAD) if had_item]

# unable to generate baselines for the following mocks
blacklist = [
    'mapbox_density0-legend',
    'mapbox_osm-style'
]
allNames = [a for a in allNames if a not in blacklist]

if len(allNames) == 0 :
    print('error: Nothing to create!')
    sys.exit(1)

failed = []
for name in allNames :
    print(name)

    created = False

    MAX_RETRY = 2 # 1 means retry once
    for attempt in range(0, MAX_RETRY + 1) :
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
                    file=os.path.join(dirOut, name + '.png'),
                    width=width,
                    height=height,
                    validate=False
                )
                created = True
            except Exception as e :
                print(e)
                if attempt < MAX_RETRY :
                    print('retry', attempt + 1, '/', MAX_RETRY)
                else :
                    failed.append(name)

        if(created) : break

if len(failed) > 0 :
    print('Failed at :')
    print(failed)
    sys.exit(1)
