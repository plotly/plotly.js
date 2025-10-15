import os
import sys
import json
import plotly.io as pio
from convert_b64 import arraysToB64

args = []
if len(sys.argv) == 2 :
    args = sys.argv[1].split()
elif len(sys.argv) > 1 :
    args = sys.argv

root = os.getcwd()

virtual_webgl = os.path.join(root, 'node_modules', 'virtual-webgl', 'src', 'virtual-webgl.js')
plotlyjs = os.path.join(root, 'build', 'plotly.js')
plotlyjs_with_virtual_webgl = os.path.join(root, 'build', 'plotly_with_virtual-webgl.js')

dirIn = os.path.join(root, 'test', 'image', 'mocks')
dirOut = os.path.join(root, 'build', 'test_images')

# N.B. equal is the falg to write to baselines not test_images

if '=' in args :
    args = args[args.index('=') + 1:]
    dirOut = os.path.join(root, 'test', 'image', 'baselines')

if 'mathjax3=' in sys.argv :
    dirOut = os.path.join(root, 'test', 'image', 'baselines')

print('output to', dirOut)

mathjax_version = 2
if 'mathjax3' in sys.argv or 'mathjax3=' in sys.argv :
    # until https://github.com/plotly/Kaleido/issues/124 is addressed
    # we are uanble to use local mathjax v3 installed in node_modules
    # for now let's download it from the internet:
    pio.kaleido.scope.mathjax = 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'
    mathjax_version = 3
    print('Kaleido using MathJax v3')

virtual_webgl_version = 0 # i.e. virtual-webgl is not used
if 'virtual-webgl' in sys.argv or 'virtual-webgl=' in sys.argv :
    virtual_webgl_version = 1
    print('using virtual-webgl for WebGL v1')

    with open(plotlyjs_with_virtual_webgl, 'w') as fileOut:
        for filename in [virtual_webgl, plotlyjs]:
            with open(filename, 'r') as fileIn:
                for line in fileIn:
                    fileOut.write(line)

    plotlyjs = plotlyjs_with_virtual_webgl

pio.kaleido.scope.plotlyjs = plotlyjs
pio.kaleido.scope.topojson = "file://" + os.path.join(root, 'topojson', 'dist')
pio.templates.default = 'none'

ALL_MOCKS = [os.path.splitext(a)[0] for a in os.listdir(dirIn) if a.endswith('.json')]
ALL_MOCKS.sort()

if len(args) > 0 :
    allNames = [a for a in args if a in ALL_MOCKS]
else :
    allNames = ALL_MOCKS

# unable to generate baselines for the following mocks
blacklist = [
    'map_stamen-style',
    'map_predefined-styles2',
    'map_scattercluster',
    'map_fonts-supported-open-sans',
    'map_fonts-supported-open-sans-weight',
]
allNames = [a for a in allNames if a not in blacklist]

if len(allNames) == 0 :
    print('error: Nothing to create!')
    sys.exit(1)

failed = []
for name in allNames :
    outName = name
    if mathjax_version == 3 :
        outName = 'mathjax3___' + name

    print(outName)

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

            if 'b64' in sys.argv or 'b64=' in sys.argv or 'b64-json' in sys.argv :
                newFig = dict()
                arraysToB64(fig, newFig)
                fig = newFig
                if 'b64-json' in sys.argv and attempt == 0 : print(json.dumps(fig, indent = 2))

            try :
                pio.write_image(
                    fig=fig,
                    file=os.path.join(dirOut, outName + '.png'),
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
                    failed.append(outName)

        if(created) : break

if len(failed) > 0 :
    print('Failed at :')
    print(failed)
    sys.exit(1)
