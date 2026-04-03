#!/bin/bash

# GitHub Actions version of .circleci/test.sh
# Replaces `circleci tests split` with split_files.mjs

set +e
set +o pipefail

ROOT=$(dirname $0)/../..
SPLIT="$ROOT/.github/scripts/split_files.mjs"
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

# Ensure output directories exist (not present in fresh GHA checkout)
mkdir -p build/test_images

case $1 in

    no-gl-jasmine)
        SUITE=$(ls -1 $ROOT/test/jasmine/tests/* | sort | node "$SPLIT")
        MAX_AUTO_RETRY=2
        retry npm run test-jasmine -- $SUITE --skip-tags=gl,noCI,flaky || EXIT_STATE=$?

        exit $EXIT_STATE
        ;;

    webgl-jasmine)
        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --limit=5 --tag=gl | node "$SPLIT"))
        for s in ${SHARDS[@]}; do
            MAX_AUTO_RETRY=2
            retry npm run test-jasmine -- "$s" --tags=gl --skip-tags=noCI --doNotFailOnEmptyTestSuite
        done

        exit $EXIT_STATE
        ;;

    virtual-webgl-jasmine)
        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --limit=5 --tag=gl | node "$SPLIT"))
        for s in ${SHARDS[@]}; do
            MAX_AUTO_RETRY=2
            retry ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --virtualWebgl --tags=gl --skip-tags=noCI,noVirtualWebgl --doNotFailOnEmptyTestSuite -- "$s"
        done

        exit $EXIT_STATE
        ;;

    flaky-no-gl-jasmine)
        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --limit=1 --tag=flaky | node "$SPLIT"))

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

    mathjax-firefox)
        ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --FF --bundleTest=mathjax --nowatch || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    mathjax-firefox)
        ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --FF --bundleTest=mathjax --nowatch &&
        ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --FF --bundleTest=mathjax --mathjax3 --nowatch &&
        ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --FF --bundleTest=mathjax_config --mathjax3 --nowatch &&
        ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --FF --bundleTest=mathjax_config --nowatch || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-baselines-virtual-webgl)
        SUITE=$({\
                  find $ROOT/test/image/mocks/gl*     -type f -printf "%f\n"; \
                  find $ROOT/test/image/mocks/map* -type f -printf "%f\n"; \
                } | sed 's/\.json$//1' | sort | node "$SPLIT")
        python test/image/make_baseline.py virtual-webgl $SUITE || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-baselines-mathjax3)
        MATHJAX3_MOCKS=$(jq -r '.compare_mathjax3 | join(" ")' test/image/compare_pixels_collections.json)
        python test/image/make_baseline.py mathjax3 $MATHJAX3_MOCKS || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-baselines-b64)
        SUITE=$(find $ROOT/test/image/mocks/ -type f -printf "%f\n" | sed 's/\.json$//1' | sort | node "$SPLIT")
        python test/image/make_baseline.py b64 $SUITE || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-baselines)
        SUITE=$(find $ROOT/test/image/mocks/ -type f -printf "%f\n" | sed 's/\.json$//1' | sort | node "$SPLIT")
        python test/image/make_baseline.py $SUITE || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-exports)
        python test/image/make_exports.py || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    test-image)
        node test/image/compare_pixels_test.mjs || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    test-image-mathjax3)
        node test/image/compare_pixels_test.mjs mathjax3 || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    test-image-virtual-webgl)
        node test/image/compare_pixels_test.mjs virtual-webgl || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    source-syntax)
        npm run lint        || EXIT_STATE=$?
        npm run test-syntax || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

esac
