#!/bin/bash -e

# check if aws is installed
if [[ ! -n `which aws` ]]; then
    echo "Error: Please install and configure 'aws'."
    exit 1
fi

# get plotly.js version from its package json
version=$(node -e "console.log(require('./package.json').version);")
major=$(node -e "console.log(require('./package.json').version.split('.')[0]);")

# read tag either latest or rc
baseTag=$(node -e "var rc = require('./package.json').version.split('-')[1]; console.log(rc ? rc.split('.')[0] : 'latest');")

# if not v1 add major version to the tag e.g. latest-v2
tag=$baseTag
if [ $major -ne 1 ]; then tag=$tag-v$major; fi
echo $tag

dist=dist
sync=build/sync

# clear and make a sync folder
if [ -d "$sync" ]; then rm -rf $sync; fi
mkdir -p $sync

# copy dist bundles over to the sync folder and rename them
for path in `ls $dist/plotly*`; do
    basename=${path##*/}
    name=${basename%%.*}
    ext="${basename#*.}"

    if [ $name == 'plotly-geo-assets' ] || [ $name == 'plotly-with-meta' ]; then
        continue
    fi

    cp $path "$sync/${name}-${version}.$ext"

    if [ $baseTag = "latest" ]; then
        cp $path "$sync/${name}-${tag}.$ext"
    fi
done

# copy topojson files over to the sync folder
cp $dist/topojson/* $sync

# list folder and files
echo $sync
ls $sync

# sync to s3
aws s3 sync $sync/ s3://plotly-cdn/ --acl public-read
