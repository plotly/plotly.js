#!/bin/sh
set -e
# install required fonts
sudo apt-get install fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji

# install additional fonts (committed in .github/fonts/)
sudo cp -r .github/fonts/ /usr/share/
sudo apt install fontconfig
sudo fc-cache -f

# install Kaleido & Plotly
uv pip install kaleido==1.2 plotly==6.6.0 --no-progress

# install numpy i.e. to convert arrays to typed arrays
uv pip install numpy==2.4.3

# verify version of python and versions of installed python packages
python --version
uv pip freeze
