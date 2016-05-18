#! /bin/bash
#
# Starts docker, sets up and runs test, then shuts down docker
#
# ===============================================================================


# create and set up docker
docker-machine start default &&
eval $(docker-machine env default) &&
docker-compose up -d &&

# run test
npm run test-image ;

# quit docker irrespective of success / failure
docker-compose stop &&
docker-machine kill default
