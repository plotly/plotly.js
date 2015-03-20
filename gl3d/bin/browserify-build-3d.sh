#!/bin/bash
ASSETDIR="../shelly/shelly/static/js/plugins"
SOURCEDIR=.
JSGLOBAL="SceneFrame"

if [[ $1 == 'prod' ]]; then

    echo "building scene-framer for production"
    browserify $SOURCEDIR/index.js --standalone $JSGLOBAL | uglifyjs > $ASSETDIR/glcontext-bundle.js

elif [[ $1 == 'dev' ]]; then

    echo "building scene-framer for development"
    browserify $SOURCEDIR/index.js --debug --standalone $JSGLOBAL > $ASSETDIR/glcontext-bundle.js

else
    echo 'must supply either "prod" or "dev" as an argument'
fi
