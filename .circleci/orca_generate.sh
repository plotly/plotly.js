#!/usr/bin/env bash

cd build/test_images
ls ../../test/image/mocks/*.json | awk '!/mapbox/' | shuf | xargs -P1 -n20 xvfb-run -a orca graph --verbose
