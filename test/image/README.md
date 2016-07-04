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

We use `docker-compose` to ease the creation/stopping/deletion of the testing docker container.

Inside your `plotly.js` directory, run

```bash
docker-compose up -d
```

In the `docker-compose.yml` file, `latest` is the latest Plotly Image-Server docker container version
as listed on [hub.docker.com](https://hub.docker.com/r/plotly/testbed/tags/) and
`imagetest` is the name of the docker container. The `-d` flag tells docker to start the containers in the background and leave them running.

### Step 2: Run the image tests

The image testing docker container allows plotly.js developers to ([A](#a-run-image-comparison-tests) run image
comparison tests, ([B](#b-run-image-export-tests) run image export tests and ([C](#c-generate-or-update-existing-baseline-image)) generate baseline
images.

**IMPORTANT:** the image tests scripts do **not** bundle the source files before
running the image tests. We recommend running `npm run watch` or `npm start` in
a separate tab to ensure that the most up-to-date code is used.

##### A: Run image comparison tests

Image comparison tests take in plotly.js mock json files (found in
[`test/image/mocks`][mocks]), generate test png images (saved in
`build/test_images/` - which is git-ignored) and compare them pixel-by-pixel to
their corresponding baseline images (found in
[`test/image/baselines`][baselines]) using
[`GraphicsMagick`](https://github.com/aheckmann/gm).

To run the image comparison tests, in your `plotly.js` directory:

```bash
npm run test-image
```

which runs all image comparison tests in batch. If some tests fail, compare their outputs
by booting up the test image viewer using `npm run start-image_viewer`.

As an alternative to running all image comparison tests at once, you can provide
a [glob](https://github.com/isaacs/node-glob) as argument to target one or multiple test mocks found in
[`test/image/mocks`][mocks].
For example,

```bash
# Run one test (e.g. the 'contour_nolines' test):
$ npm run test-image -- contour_nolines

# Run all gl3d image test in batch:
$ npm run test-image -- gl3d_*
```

Developers on weak hardware might encounter batch timeout issue. These are most
common when generated WebGL-based graphs. In this case, running the image
comparison tests in queue (i.e. with no concurrency) is recommended:

```bash
# Run all gl3d image test in queue:
$ npm run test-image -- gl3d_* --queue
```

##### B: Run image export tests

Image export tests check that image export works for formats other than png.

To run the image export tests, in your `plotly.js` directory:

```bash
npm run test-export

# or
npm run test-export -- <glob>
```

##### C: Generate or update existing baseline image

To generate a new baseline image, add a new mock file in
[`test/image/mocks`][mocks]. Note that mock file needs to be a valid JSON and
have both a "data" and a `"layout"` field. Then, in your plotly.js directory,
run:

```bash
npm run baseline -- <name-of-mock>
```

which generates a baseline png image in [`test/image/baselines`][baselines].

To update existing baseline image(s), run

```bash
npm run basline -- <glob-of-mocks-to-update>
```


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

[mocks]: https://github.com/plotly/plotly.js/tree/master/test/image/mocks
[baselines]: https://github.com/plotly/plotly.js/tree/master/test/image/baselines
