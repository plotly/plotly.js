# plotly.js image testing

Test plotly.js with Plotly's image testing docker container.

Requirements:
- `docker` | [installation guidelines](http://docs.docker.com/engine/installation/)
- `docker-machine` (for Mac and Windows users only) | [installation guidelines](https://docs.docker.com/machine/install-machine/)
- `docker-compose` | [installation guidelines](https://docs.docker.com/compose/install/)

### Step 0: Start the docker machine (Mac and Windows users only)

Boot up docker machine (named `default`):

```bash
docker-machine start default
```

Set up the docker environment for `docker-compose`:

```bash
eval $(docker-machine env default)
```

the above evaluates the output of `docker-machine env default`.


### Step 1: Run the testing container

Plotly.js uses `docker-compose` to ease the creation/stopping/deletion of the testing docker container.

Inside your `plotly.js` directory, run

```bash
docker-compose up -d
```

In the `docker-compose.yml` file, `latest` is the latest Plotly Image-Server docker container version
as listed on [hub.docker.com](https://hub.docker.com/r/plotly/testbed/tags/) and
`imagetest` is the name of the docker container. The `-d` flag tells docker to start the containers in the background and leave them running.

### Step 2: Run the image tests

Inside your `plotly.js` directory, run

```bash
npm run test-image
```

if some tests fail, compare their outputs using `npm run start-image_viewer`.

**IMPORTANT:** `npm run test-image` does **not** bundle the source files before running the image tests. We recommend runnnig `npm run watch` or `npm run start-test_dashboard` in a separate tab to ensure that the most up-to-date code is tested. 

### Step 2b: Make a new or update an existing baseline image

Inside your `plotly.js` directory, run

```bash
npm run baseline -- mock.json
```

where `mock.json` is the name of a `{"data": [], "layout": {}}` json file found in [`test/image/mocks/`](https://github.com/plotly/plotly.js/tree/master/test/image/mocks). The `"data"` and `"layout"` field are passed to `Plotly.plot` to produce an image saved in [`test/image/baslines`](https://github.com/plotly/plotly.js/tree/master/test/image/baselines).

### Step 3: Stop your testing container

Once done testing, inside your `plotly.js` directory, run

```bash
docker-compose stop
```

Mac and Windows user should also kill their docker-machine (named `default`) once done testing:

```bash
docker-machine kill default
```

### Docker tricks 

##### Get into docker container

```bash
docker exec -ti imagetest /bin/bash
```

##### List docker machines

```bash
docker-machine ls
```

##### List all images

```bash
docker images
```

##### List all containers

```bash
docker ps -a
```

whereas `docker ps` lists only the started containers.

##### Remove your testing container

Inside your `plotly.js` directory, run

```bash
docker-compose rm -f
```

##### Remove your docker machine

If named `default`:

```bash
docker-machine kill default
```

For more comprehensive information about docker, please refer to the [docker docs](http://docs.docker.com/).
