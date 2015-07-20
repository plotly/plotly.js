#!/bin/bash
#
# Run this script from ./ locally:
#
# -------------------------------------------------------------------------------

bundle_type='scientific'  # the only bundle to include gl3d

tmp_dir="test_subbundles"  # in .gitingore
jsbuilds="../shelly/plotlyjs/static/plotlyjs/jsbuilds/"
latest_bundle_dir=$(ls -t "$jsbuilds" | head -n 1)
bundle_name="${latest_bundle_dir}_$bundle_type"

index="index.html"
str_to_replace="./../shelly/plotlyjs/static/plotlyjs/build/plotlyjs-bundle.js"

mkdir -p $tmp_dir
unzip -o "$jsbuilds$latest_bundle_dir/${bundle_name}.zip" -d $tmp_dir

# replace in the subbundle of choice in the index <script>
str_to_replace_it="$tmp_dir/$bundle_name/plotly.min.js"
echo -e "\nreplacing:\n$str_to_replace by\n$str_to_replace_it\nin index.html"
sed -i.bak "s#$str_to_replace#$str_to_replace_it#g" $index

node server.js

# replace back the index file with the original version
mv -f $index.bak $index
