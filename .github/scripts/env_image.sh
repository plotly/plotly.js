#!/bin/sh
set -e
# install required fonts
sudo apt-get install fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji

# install additional fonts (committed in .github/fonts/)
sudo cp -r .github/fonts/ /usr/share/
sudo apt install fontconfig
sudo fc-cache -f

# install Kaleido & Plotly
sudo python3 -m pip install kaleido==0.2.1 plotly==6.6.0 --progress-bar off

# install numpy i.e. to convert arrays to typed arrays
sudo python3 -m pip install numpy==1.24.2
