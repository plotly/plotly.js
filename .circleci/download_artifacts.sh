#! /bin/bash
#
# https://circleci.com/docs/2.0/artifacts/#downloading-all-artifacts-for-a-build-on-circleci

if [[ $# -eq 0 ]] ; then
    echo 'Must provide Circle CI built number'
    echo 'Go to https://circleci.com/gh/plotly/plotly.js to find out'
    exit 1
fi

if [[ -z "${CIRCLECI_TOKEN}" ]]; then
    echo 'CIRCLECI_TOKEN environment variable must be set'
    echo 'Go to https://circleci.com/account/api to generate an access token'
    exit 1
fi

BUILT=$1
URL="https://circleci.com/api/v1.1/project/github/plotly/plotly.js/$BUILT/artifacts?circle-token=$CIRCLECI_TOKEN"
DIR="$(dirname $0)/../build/circleci-artifacts-$BUILT"

mkdir -p $DIR/{test_images,test_images_diff}

FILES=$(curl -s $URL | grep -o 'https://[^"]*')

for f in $FILES; do
    if [[ $f == *"/test_images/"* ]]; then
        wget $f %$CIRCLECI_TOKEN -q --show-progress -P $DIR/test_images
    elif [[ $f == *"/test_images_diff/"* ]]; then
        wget $f %$CIRCLECI_TOKEN -q --show-progress -P $DIR/test_images_diff
    fi
done
