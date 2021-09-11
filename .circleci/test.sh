#!/bin/bash

# override CircleCi's default run settings
set +e
set +o pipefail

ROOT=$(dirname $0)/..
EXIT_STATE=0
MAX_AUTO_RETRY=0

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

case $1 in

    no-gl-jasmine)
        SUITE=$(circleci tests glob "$ROOT/test/jasmine/tests/*" | circleci tests split)
        MAX_AUTO_RETRY=2
        retry npm run test-jasmine -- $SUITE --skip-tags=gl,noCI,flaky || EXIT_STATE=$?

        exit $EXIT_STATE
        ;;

    webgl-jasmine)
        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --limit=5 --tag=gl | circleci tests split))
        for s in ${SHARDS[@]}; do
            MAX_AUTO_RETRY=2
            retry npm run test-jasmine -- "$s" --tags=gl --skip-tags=noCI --doNotFailOnEmptyTestSuite
        done

        exit $EXIT_STATE
        ;;

    flaky-no-gl-jasmine)
        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --limit=1 --tag=flaky | circleci tests split))

        for s in ${SHARDS[@]}; do
            MAX_AUTO_RETRY=5
            retry npm run test-jasmine -- "$s" --tags=flaky --skip-tags=noCI
        done

        exit $EXIT_STATE
        ;;

    bundle-jasmine)
        npm run test-bundle || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-baselines)
        SUITE=$(find $ROOT/test/image/mocks/ -type f -printf "%f\n" | sed 's/\.json$//1' | circleci tests split)
        python3 test/image/make_baseline.py $SUITE || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    test-image)
        node test/image/compare_pixels_test.js || { tar -cvf build/baselines.tar build/test_images/*.png ; exit 1 ; } || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    source-syntax)
        npm run lint        || EXIT_STATE=$?
        npm run test-syntax || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

esac
