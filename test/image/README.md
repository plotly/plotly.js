# plotly.js image testing

Test plotly.js with the Plotly Image-Server docker container.


### Run the container with `docker compose`

Plotly.js uses `docker-compose` to ease the creation/stopping/deletion of testing docker container,
please refer [installing docker-compose](https://docs.docker.com/compose/install/) for installation.
Inside your `plotly.js` directory, run

```bash
$ docker-compose up -d
```

In the `docker-compose.yml` file, `latest` is the latest Plotly Image-Server docker container version
as listed on [hub.docker.com](https://hub.docker.com/r/plotly/imageserver/tags/) and
`imagetest` is the name of the docker container.


### Run the tests

Inside your `plotly.js` directory, run

```bash
npm run test-image
```

### SSH into docker

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


### List all images

```bash
docker images
```

### List all containers

```bash
docker ps -a
```

### Stop your testing container

Inside your `plotly.js` directory, run

```bash
docker-compose stop
```

### Remove your testing container

Inside your `plotly.js` directory, run

```bash
docker-compose rm -f
```

For more comprehensive information about docker, please refer to [docker document](http://docs.docker.com/)
