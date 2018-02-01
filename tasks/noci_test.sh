#! /bin/bash

EXIT_STATE=0

# tests that aren't run on CI

# jasmine specs with @noCI tag
npm run test-jasmine -- --tags=noCI --nowatch || EXIT_STATE=$?

# mapbox image tests take too much resources on CI
npm run test-image -- mapbox_* --queue || EXIT_STATE=$?

exit $EXIT_STATE
