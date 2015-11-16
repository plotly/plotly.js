#! /bin/bash
#
# TODO adapt this for Windows

# TODO add package.json config arguments to configure the container name,
#       ports and imageserver version

CONTAINER_NAME=""


docker run -d --name $CONTAINER_NAME \
    -v $PWD/plotly.js:/var/www/streambed/image_server/plotly.js \
    -p 9010:9010 -p 2022:22 plotly/imageserver:[version]

docker exec -i $CONTAINER_NAME /bin/bash \
    -c "cd /var/www/streambed/image_server/plotly.js && \
        cp -f test/image/index.html ../server_app/index.html && \
        monit restart nw1 && \
        sleep 5 && \
        node test/image/compare_pixels_test.js"
        
