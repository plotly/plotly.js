#! /bin/bash
#
# TODO adapt this for Windows
#
# TODO add package.json config arguments to configure:
#       - container name,
#       - ports and
#       - imageserver version
#
# ===============================================================================

CONTAINER_NAME="imagetest"
IMAGE_NAME="registry.plot.ly:5000/imageserver"
IMAGE_VERSION="1.3.0"

# Run docker container:
#
# docker run -d --name $CONTAINER_NAME \
#     -v $PWD/plotly.js:/var/www/streambed/image_server/plotly.js \
#     -p 9010:9010 -p 2022:22 \
#     $IMAGE_NAME:[$IMAGE_VERSION]

CMD=(
    "cd /var/www/streambed/image_server/plotly.js &&"
    "cp -f test/image/index.html ../server_app/index.html &&"
    "monit restart nw1 &&"
    "sleep 5 &&"
    "node test/image/make_baseline.js $1"
)

docker exec -i $CONTAINER_NAME /bin/bash -c "${CMD[*]}"
