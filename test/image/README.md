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

### Step 2b: Make a new baseline image

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

##### SSH into docker container

```bash
ssh -p 2022 root@localhost # with password `root`
```

If you got this error:

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ECDSA key sent by the remote host is
dd:1e:e0:95:8d:ef:06:b8:0f:2f.
Please contact your system administrator.
Add correct host key in /home/jh/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /home/jh/.ssh/known_hosts:104
  remove with: ssh-keygen -f "/home/jh/.ssh/known_hosts" -R [localhost]:2022
ECDSA host key for [localhost]:2022 has changed and you have requested strict checking.
Host key verification failed.
```
simply run

```bash
ssh-keygen -f "${HOME}/.ssh/known_hosts" -R [localhost]:2022
```

to remove host information.

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
