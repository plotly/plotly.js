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
    # run noCI tests
    npm run test-jasmine -- --tags=noCI,noCIdep --nowatch || EXIT_STATE=$?
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
