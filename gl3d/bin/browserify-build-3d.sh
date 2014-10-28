#!/bin/bash
ASSETDIR="../shelly/shelly/static/js/plugins"
SOURCEDIR=.
JSGLOBAL="SceneFrame"

if [[ $1 == 'prod' ]]; then

    echo "building gl_now for production"
    browserify $SOURCEDIR/gl_now.js | uglifyjs > $ASSETDIR/glnow-bundle.js
    echo "building scene-framer for production"
    browserify $SOURCEDIR/scene-framer.js --standalone $JSGLOBAL | uglifyjs > $ASSETDIR/glcontext-bundle.js

elif [[ $1 == 'dev' ]]; then

    echo "building gl_now for development"
    browserify $SOURCEDIR/gl_now.js > $ASSETDIR/glnow-bundle.js
    echo "building scene-framer for development"
    browserify $SOURCEDIR/scene-framer.js --standalone $JSGLOBAL > $ASSETDIR/glcontext-bundle.js

else
    echo 'must supply either "prod" or "dev" as an argument'
fi
