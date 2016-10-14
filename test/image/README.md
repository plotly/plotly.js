# plotly.js image testing

Test plotly.js with Plotly's image testing docker container.

Requirements:
- `docker` | [installation guidelines][docker-install]
- `docker-machine` (for Mac and Windows users only) | [installation guidelines][docker-machine-install]

### Step 0: Start the docker machine (Mac and Windows users only)

Boot up docker machine (named `default`):

```bash
docker-machine start default
```

If this is your first time, you'll need to create the machine instead:

```bash
docker-machine create --driver virtualbox default
```

Set up the docker environment:

```bash
eval $(docker-machine env default)
```

the above evaluates the output of `docker-machine env default`.


### Step 1: Setup the testing container

After `cd` into your `plotly.js` directory, pull the latest docker image with

```bash
npm run docker -- pull
```

which calls [`docker-pull`][docker-pull] with the correct arguments grabbing the
latest docker image as listed on [hub.docker.com][docker-hub].

Run the container with

```bash
npm run docker -- run
```

which calls [`docker-run`][docker-run] or [`docker-start`][docker-start] with
the correct arguments.


### Step 2: Run the image tests

The image testing docker container allows plotly.js developers to
([A](#a-run-image-comparison-tests)) run image comparison tests,
([B](#b-run-image-export-tests)) run image export tests and
([C](#c-generate-or-update-existing-baseline-image)) generate baseline images.

Before starting, don't forget to [set up your testing environment](https://github.com/plotly/plotly.js/blob/master/CONTRIBUTING.md#development):

```bash
$ npm run pretest
```

**IMPORTANT:** the image tests scripts do **not** bundle the source files before
running the image tests. We recommend running `npm run watch` or `npm start` in
a separate tab to ensure that the most up-to-date code is used.

##### A: Run image comparison tests

Image comparison tests take in plotly.js mock json files (found in
[`test/image/mocks`][mocks]), generate test png images (saved in
`build/test_images/` - which is git-ignored) and compare them pixel-by-pixel to
their corresponding baseline images (found in
[`test/image/baselines`][baselines]) using [`GraphicsMagick`][gm].

To run the image comparison tests, in your `plotly.js` directory:

```bash
npm run test-image
```

which runs all image comparison tests in batch. If some tests fail, compare their outputs
by booting up the test image viewer using `npm run start-image_viewer`.

As an alternative to running all image comparison tests at once, you can provide
a [glob][glob] as argument to target one or multiple test mocks found in
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
npm run baseline -- <glob-of-mocks-to-update>
```


### Step 3: Stop your testing container

Once done testing, inside your `plotly.js` directory, run

```bash
npm run docker -- stop
```

which calls [`docker-stop`][docker-stop] with the correct arguments.

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
npm run docker -- remove
```

which calls [`docker-rm`][docker-rm] with the correct arguments.

##### Remove your docker machine

If named `default`:

```bash
docker-machine kill default
```

For more comprehensive information about docker, please refer to the [docker docs](http://docs.docker.com/).

[mocks]: https://github.com/plotly/plotly.js/tree/master/test/image/mocks
[baselines]: https://github.com/plotly/plotly.js/tree/master/test/image/baselines
[docker-install]: http://docs.docker.com/engine/installation/
[docker-machine-install]: https://docs.docker.com/machine/install-machine/
[docker-hub]: https://hub.docker.com/r/plotly/testbed/tags/
[docker-pull]: https://docs.docker.com/engine/reference/commandline/pull/
[docker-run]: https://docs.docker.com/engine/reference/commandline/run/
[docker-start]: https://docs.docker.com/engine/reference/commandline/start/
[docker-stop]: https://docs.docker.com/engine/reference/commandline/stop/
[docker-rm]: https://docs.docker.com/engine/reference/commandline/rm/
[gm]: https://github.com/aheckmann/gm
[glob]: https://github.com/isaacs/node-glob
