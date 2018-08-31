#!/bin/bash

# override CircleCi's default run settings
set +e
set +o pipefail

ROOT=$(dirname $0)/..
EXIT_STATE=0
MAX_AUTO_RETRY=5

log () {
    echo -e "\n$1"
}

# inspired by https://unix.stackexchange.com/a/82602
retry () {
    local n=1

    until [ $n -ge $MAX_AUTO_RETRY ]; do
        "$@" --failFast && break
        log "run $n of $MAX_AUTO_RETRY failed, trying again ..."
        n=$[$n+1]
    done

    if [ $n -eq $MAX_AUTO_RETRY ]; then
        log "one last time, w/o failing fast"
        "$@" && n=0
    fi

    if [ $n -eq $MAX_AUTO_RETRY ]; then
        log "all $n runs failed, moving on."
        EXIT_STATE=1
    fi
}

# set timezone to Alaska time (arbitrary timezone to test date logic)
set_tz () {
    sudo cp /usr/share/zoneinfo/America/Anchorage /etc/localtime
    export TZ='America/Anchorage'
}

case $1 in

    jasmine)
        set_tz

        npm run test-jasmine -- --skip-tags=gl,noCI,flaky || EXIT_STATE=$?
        retry npm run test-jasmine -- --tags=flaky --skip-tags=noCI
        npm run test-bundle || EXIT_STATE=$?

        exit $EXIT_STATE
        ;;

    jasmine2)
        set_tz

        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --tag=gl))

        for s in ${SHARDS[@]}; do
            retry npm run test-jasmine -- "$s" --tags=gl --skip-tags=noCI
        done

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
