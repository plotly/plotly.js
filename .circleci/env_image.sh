#!/bin/sh
set -e
# install required fonts
sudo apt-get install fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji

# install pip
sudo curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
sudo python3 get-pip.py

# install additional fonts
sudo python3 -m pip install requests
sudo python3 .circleci/download_google_fonts.py
sudo cp -r .circleci/fonts/ /usr/share/
sudo apt install fontconfig
sudo fc-cache -f

# install kaleido & plotly
sudo python3 -m pip install kaleido==0.2.1 plotly==6.2.0 --progress-bar off

# install numpy i.e. to convert arrays to typed arrays
sudo python3 -m pip install numpy==1.24.2
