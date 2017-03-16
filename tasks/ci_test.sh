#!/bin/bash

EXIT_STATE=0

case $CIRCLE_NODE_INDEX in

    0)
        npm run test-image      || EXIT_STATE=$?
        npm run test-image-gl2d || EXIT_STATE=$?
        npm run test-bundle     || EXIT_STATE=$?
        npm run test-syntax     || EXIT_STATE=$?
        npm run lint            || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    1)
        npm run test-jasmine || EXIT_STATE=$?
        npm run test-export  || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

esac
