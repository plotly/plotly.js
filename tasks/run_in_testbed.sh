#! /bin/bash
#
# Useful shortcut to run command inside the `testbed` docker container
# on CircleCI.
#
# ===============================================================================

ID="$1"
CMD="$2"

CONTAINER="$(docker inspect --format '{{.Id}}' $ID)"
REPOPATH="/var/www/streambed/image_server/plotly.js"

lxc-attach -n $CONTAINER -- bash -c "cd $REPOPATH && $CMD"
