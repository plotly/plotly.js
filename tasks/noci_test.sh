#! /bin/bash
#
# Run tests that aren't ran on CI (yet)
#
# to run all no-ci tests
# $ (plotly.js) ./tasks/noci_test.sh
#
# to run jasmine no-ci tests
# $ (plotly.js) ./tasks/noci_test.sh jasmine

# to run image no-ci tests
# $ (plotly.js) ./tasks/noci_test.sh image
#
# -----------------------------------------------

EXIT_STATE=0
root=$(dirname $0)/..

# jasmine specs with @noCI tag
test_jasmine () {
    # run MathJax on FireFox
    ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --FF --bundleTest=mathjax --nowatch && \
    # run noCI tests
    npm run test-jasmine -- --tags=noCI,noCIdep --nowatch || EXIT_STATE=$?
}

# mapbox image tests take too much resources on CI
#
# since the update to mapbox-gl@0.44.0, we must use orca
# as mapbox-gl versions >0.22.1 aren't supported on nw.js@0.12 used in the
# 'old' image server
#
# due to mathjax upgrade to v2.7.5, we are unable to test mathjax mocks in the
# 'old' image server and we use orca
#
test_image () {
    $root/../orca/bin/orca.js graph \
        $root/test/image/mocks/mapbox_* \
        $root/test/image/mocks/mathjax.json \
        $root/test/image/mocks/ternary-mathjax.json \
        $root/test/image/mocks/table_plain_birds.json \
        $root/test/image/mocks/table_wrapped_birds.json \
        $root/test/image/mocks/parcats_grid_subplots.json \
        $root/test/image/mocks/legend_mathjax_title_and_items.json \
        $root/test/image/mocks/table_latex_multitrace_scatter.json \
        --mathjax $root/node_modules/mathjax/MathJax.js \
        --plotly $root/build/plotly.js \
        --mapbox-access-token "pk.eyJ1IjoicGxvdGx5LWpzLXRlc3RzIiwiYSI6ImNrNG9meTJmOTAxa3UzZm10dWdteDQ2eWMifQ.2REjOFyIrleMqwS8H8y1-A" \
        --output-dir $root/test/image/baselines/ \
        --verbose || EXIT_STATE=$?
}

case $1 in
    jasmine)
        test_jasmine
        ;;
    image)
        test_image
        ;;
    *)
        test_jasmine
        test_image
        ;;
esac

exit $EXIT_STATE
