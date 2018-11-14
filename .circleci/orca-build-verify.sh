#!/usr/bin/env bash

ROOT=$(dirname $0)/..
MOCKS=$ROOT/test/image/mocks
BASELINES=$ROOT/test/image/baselines

TEST_IMAGES=$ROOT/build/test_images
DIFF_IMAGES=$ROOT/build/test_images_diff

get_mock_path()
{
  echo "$MOCKS/$1.json"
}
export -f get_mock_path

get_image_path()
{
  echo "$TEST_IMAGES/$1.png"
}

# Deterministic shuffling (https://www.gnu.org/software/coreutils/manual/html_node/Random-sources.html)
get_seeded_random()
{
  seed="$1"
  openssl enc -aes-256-ctr -pass pass:"$seed" -nosalt \
    </dev/zero 2>/dev/null
}

deterministic_shuffle()
{
  shuf --random-source=<(get_seeded_random "0")
}

if [ "$CIRCLECI" = true ];
then
  echo "Work split across $CIRCLE_NODE_TOTAL nodes"
  echo "Node index $CIRCLE_NODE_INDEX"
  sleep 1
else
  echo "Running locally"
  CIRCLE_NODE_TOTAL=1
  CIRCLE_NODE_INDEX=0
fi

rm -f /tmp/all
if [[ $# -eq 0 ]]; then
  ls $MOCKS/*.json | xargs -I{} -n1 basename {} .json > /tmp/all
else
  for var in "$@"
  do
    echo "$var" >> /tmp/all
  done
fi

cat /tmp/all | \
  # Shuffle to distribute randomly slow and fast mocks
  deterministic_shuffle > /tmp/shuffled_all

# Split on each node
split -d -a3 -n l/$CIRCLE_NODE_TOTAL /tmp/shuffled_all /tmp/queue
NODE_QUEUE="/tmp/queue$(printf "%03d" $CIRCLE_NODE_INDEX)"

echo ""
function generate()
{
  echo "Generating test images"
  cat $1 | awk '!/mapbox/' | \
      xargs -n1 -I{} echo "$MOCKS/{}.json" | \
      # Split in chunks of 20
      xargs -P1 -n20 xvfb-run -a orca graph --mathjax $ROOT/dist/extras/mathjax/MathJax.js --plotly $ROOT/build/plotly.js --verbose --output-dir $TEST_IMAGES
}
generate $NODE_QUEUE

function compare()
{
  echo "Comparing with baselines"
  cat $1 | awk '!/mapbox/' | \
  #find $TEST_IMAGES -type f -name "*.png" -printf "%f\n" | \
    # shuf | \
    # sort | \
    # head -n 20 | \
    # xargs -n1 -P16 -I {} bash -c "echo {} && ./node_modules/.bin/pixelmatch $1/{} $2/{} diff/{} 0 true" | tee results.txt
    xargs -n1 -P`nproc` -I {} bash -c "compare -verbose -metric AE $TEST_IMAGES/{}.png $BASELINES/{}.png $DIFF_IMAGES/{}.png 2> $DIFF_IMAGES/{}.txt"
}
compare $NODE_QUEUE

CODE=$(grep -R "all: [^0]" $DIFF_IMAGES/ | wc -l)

# If there are different images, retry
if [ "$CODE" -ne "0" ]; then
  grep -l -R "all: [^0]" $DIFF_IMAGES/ | gawk '{match($0, /diff\/([^.]*)/, arr); print arr[1]}' > /tmp/failed
  echo "Retrying the following $CODE images"
  cat /tmp/failed
  generate /tmp/failed
  compare /tmp/failed
  CODE=$(grep -R "all: [^0]" $DIFF_IMAGES/ | wc -l)
fi
echo "$CODE different images"
exit $CODE
