#!/bin/bash

# override CircleCi's default run settings
set +e
set +o pipefail

EXIT_STATE=0

case $1 in

    jasmine)
        npm run test-jasmine    || EXIT_STATE=$?
        npm run test-bundle     || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    image)
        npm run test-image      || EXIT_STATE=$?
        npm run test-export     || EXIT_STATE=$?
        npm run test-image-gl2d || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    syntax)
        npm run lint            || EXIT_STATE=$?
        npm run test-syntax     || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

esac
