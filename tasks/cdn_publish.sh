#!/bin/bash -e

# check if aws is installed
if [[ ! -n `which aws` ]]; then
    echo "Error: Please install and configure 'aws'."
    exit 1
fi

# get plotly.js version from its package json
version=$(node -e "console.log(require('./package.json').version);")
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
done

# copy topojson files over to the sync folder
cp $dist/topojson/* $sync

# list folder and files
echo $sync
ls $sync

# sync to s3
aws s3 sync $sync/ s3://plotly-cdn/ --acl public-read
