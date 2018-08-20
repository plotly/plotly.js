#!/bin/bash

# override CircleCi's default run settings
set +e
set +o pipefail

ROOT=$(dirname $0)/..
EXIT_STATE=0
MAX_AUTO_RETRY=5

# inspired by https://unix.stackexchange.com/a/82602
retry () {
    local n=0

    until [ $n -ge $MAX_AUTO_RETRY ]; do
        if [ $n -ge 1 ]; then
            echo ''
            echo run $n of $MAX_AUTO_RETRY failed, trying again ...
            echo ''
            sleep 15
        fi
        "$@" && break
        n=$[$n+1]
    done

    if [ $n -eq $MAX_AUTO_RETRY ]; then
        EXIT_STATE=1
    fi
}

case $1 in

    jasmine)
        npm run test-jasmine -- --skip-tags=gl,noCI,flaky || EXIT_STATE=$?
        npm run test-bundle || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    jasmine2)
        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --tag=gl))

        for s in ${SHARDS[@]}; do
            retry npm run test-jasmine -- "$s" --tags=gl --skip-tags=noCI,flaky
        done

        retry npm run test-jasmine -- --tags=flaky --skip-tags=noCI
        exit $EXIT_STATE
        ;;

    image)
        npm run test-image      || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    image2)
        npm run test-export     || EXIT_STATE=$?
        npm run test-image-gl2d || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    syntax)
        npm run lint        || EXIT_STATE=$?
        npm run test-syntax || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

esac
