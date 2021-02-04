#!/bin/bash -e

vendor=vendor
dist=dist

# clear and make a dist folder
if [ -d "$dist" ]; then rm -rf $dist; fi
mkdir -p $dist

# copy vendor files namely (extras/mathjax and topojson) over to the dist folder
cp -r $vendor/* $dist
