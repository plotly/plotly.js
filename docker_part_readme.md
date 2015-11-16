# plotly.js
-----


The premier high-level javascript graphing library


## Test Plotly.js with Plot.ly Image-Server docker container

### Run container

Under your `plotly.js` folder, run

```bash
$ docker run -d --name your_container_name \
      -v $PWD:/var/www/streambed/image_server/plotly.js \
      -p 9010:9010 -p 2022:22 plotly/imageserver:[version]
```

### Run the test

Under your `plotly.js` folder, run

```bash
npm run test-image
``` 

### SSH into docker

```bash
$ ssh -p 2022 root@localhost # with password `root`
```

if you got error

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
$ ssh-keygen -f "/home/jh/.ssh/known_hosts" -R [localhost]:2022
```

to remove host information.

### list all images

```bash
docker images
```

### list all container

```bash
docker ps -a
```

### stop container

```bash
docker stop [container hash]
```

### remover container

```bash
docker rm [container hash]
```
