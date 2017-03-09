#! /bin/bash

EXIT_STATE=0

# tests that aren't run on CI

# jasmine specs with @noCI tag
npm run citest-jasmine --  tests/*_test.js --tags noCI || EXIT_STATE=$?

# mapbox image tests take too much resources on CI
npm run test-image -- mapbox_* || EXIT_STATE=$?

# run gl2d image test again (some mocks are skipped on CI)
npm run test-image-gl2d || EXIT_STATE=$?

exit $EXIT_STATE
