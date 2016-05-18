#! /bin/bash
#
# TODO adapt this for Windows
#
# ===============================================================================

CONTAINER_NAME="imagetest"  # same as in docker-compose.yml

# create/run/start docker container with:
#   $ docker-compose up -d

CMD=(
    "cd /var/www/streambed/image_server/plotly.js &&"
    "cp -f test/image/index.html ../server_app/index.html &&"
    "supervisorctl restart nw1 && "
    "wget --server-response --spider --tries=10 --retry-connrefused http://localhost:9010/ping &&"
    "node test/image/compare_pixels_test.js $1"
)

docker exec -i $CONTAINER_NAME /bin/bash -c "${CMD[*]}"
