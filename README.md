# plotly.js
-----


The premier high-level javascript graphing library




## Test Plotly.js with Plot.ly Image-Server docker container

### Run container

```bash
$ docker run -d --name your_container_name \
                      -v $PWD/plotlyjs:/var/www/streambed/image_server/plotlyjs \
		      -p 9010:9010 -p 2022:22 plotly/imageserver:[version]
```

### Run the test

```bash
$ docker exec -i your_container_name /bin/bash -c "cd /var/www/streambed/image_server/plotlyjs && npm run test-image"
``` 