#!/bin/sh
# install required fonts
sudo apt-get install fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji && \
sudo python3 .circleci/download_google_fonts.py && \
sudo cp -r .circleci/fonts/ /usr/share/ && \
sudo fc-cache -f && \
# install kaleido & plotly
sudo python3 -m pip install "plotly[kaleido]==6.1.0rc0" --progress-bar off
# install numpy i.e. to convert arrays to typed arrays
sudo python3 -m pip install numpy==1.24.2
