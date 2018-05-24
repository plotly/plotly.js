#! /bin/bash

EXIT_STATE=0
root=$(dirname $0)/..

# tests that aren't run on CI (yet)

# jasmine specs with @noCI tag
npm run test-jasmine -- --tags=noCI,noCIdep --nowatch || EXIT_STATE=$?

# mapbox image tests take too much resources on CI
#
# since the update to mapbox-gl@0.44.0, we must use orca
# as mapbox-gl versions >0.22.1 aren't supported on nw.js@0.12 used in the
# 'old' image server
#
# cone traces don't render correctly in the imagetest container
$root/../orca/bin/orca.js graph \
    $root/test/image/mocks/mapbox_* \
    $root/test/image/mocks/gl3d_cone* \
    --plotly $root/build/plotly.js \
    --mapbox-access-token "pk.eyJ1IjoiZXRwaW5hcmQiLCJhIjoiY2luMHIzdHE0MGFxNXVubTRxczZ2YmUxaCJ9.hwWZful0U2CQxit4ItNsiQ" \
    --output-dir $root/test/image/baselines/ \
    --verbose

exit $EXIT_STATE
