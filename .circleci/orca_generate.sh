#!/usr/bin/env bash

ROOT=$(dirname $0)/..
MOCKS=$ROOT/test/image/mocks
BASELINES=$ROOT/test/image/baselines

TEST_IMAGES=$ROOT/build/test_images
DIFF_IMAGES=$ROOT/build/test_images_diff

echo "Generating test images"
ls $MOCKS/*.json | awk '!/mapbox/' | \
    # Shuffle to distribute randomly slow and fast mocks
    shuf | \
    # head -n 10 | \
    # Split in chunks of 20
    xargs -P1 -n20 xvfb-run -a orca graph --verbose --output-dir $TEST_IMAGES

# Call compare.sh#
echo "Comparing with baselines"
find $TEST_IMAGES -type f -name "*.png" -printf "%f\n" | \
  # shuf | \
  # sort | \
  # head -n 20 | \
  # xargs -n1 -P16 -I {} bash -c "echo {} && ./node_modules/.bin/pixelmatch $1/{} $2/{} diff/{} 0 true" | tee results.txt
  xargs -n1 -P8 -I {} bash -c "compare -verbose -metric AE $TEST_IMAGES/{} $BASELINES/{} $DIFF_IMAGES/{} 2> $DIFF_IMAGES/{}.txt"

CODE=$(grep -R "all: [^0]" $DIFF_IMAGES/ | wc -l)
grep -l -R "all: [^0]" $DIFF_IMAGES/ | gawk '{match($0, /diff\/([^.]*)/, arr); print arr[1]}'
echo "$CODE different images"
exit $CODE
