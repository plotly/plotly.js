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

    virtual-webgl-jasmine)
        SHARDS=($(node $ROOT/tasks/shard_jasmine_tests.js --limit=5 --tag=gl | circleci tests split))
        for s in ${SHARDS[@]}; do
            MAX_AUTO_RETRY=2
            retry ./node_modules/karma/bin/karma start test/jasmine/karma.conf.js --virtualWebgl --tags=gl --skip-tags=noCI,noVirtualWebgl --doNotFailOnEmptyTestSuite -- "$s"
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
                } | sed 's/\.json$//1' | circleci tests split)
        python3 test/image/make_baseline.py virtual-webgl $SUITE || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-baselines-mathjax3)
        python3 test/image/make_baseline.py mathjax3    legend_mathjax_title_and_items mathjax parcats_grid_subplots table_latex_multitrace_scatter table_plain_birds table_wrapped_birds ternary-mathjax ternary-mathjax-title-place-subtitle || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    make-baselines-b64)
        SUITE=$(find $ROOT/test/image/mocks/ -type f -printf "%f\n" | sed 's/\.json$//1' | circleci tests split)
        python3 test/image/make_baseline.py b64 $SUITE || EXIT_STATE=$?
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

    test-image-mathjax3)
        node test/image/compare_pixels_test.js mathjax3 || { tar -cvf build/baselines.tar build/test_images/*.png ; exit 1 ; } || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    test-image-virtual-webgl)
        node test/image/compare_pixels_test.js virtual-webgl || { tar -cvf build/baselines.tar build/test_images/*.png ; exit 1 ; } || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

    source-syntax)
        npm run lint        || EXIT_STATE=$?
        npm run test-syntax || EXIT_STATE=$?
        exit $EXIT_STATE
        ;;

esac
