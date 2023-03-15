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
dirIn = os.path.join(root, 'test', 'image', 'mocks')
dirOut = dirIn

print('output to', dirOut)

ALL_MOCKS = [os.path.splitext(a)[0] for a in os.listdir(dirIn) if a.endswith('.json')]
ALL_MOCKS.sort()

if len(args) > 0 :
    allNames = [a for a in args if a in ALL_MOCKS]
else :
    allNames = ALL_MOCKS

if len(allNames) == 0 :
    print('error: Nothing to create!')
    sys.exit(1)

for name in allNames :
    outName = name

    with open(os.path.join(dirIn, name + '.json'), 'r') as _in :
        fig = json.load(_in)

        before = json.dumps(fig, indent = 2)

        newFig = dict()
        arraysToB64(fig, newFig)
        fig = newFig

        after = json.dumps(fig, indent = 2)

        if before != after :
            print(outName)

            _out = open(os.path.join(dirOut, outName + '.json'), 'w')
            _out.write(json.dumps(fig, indent = 2))
            _out.close()
