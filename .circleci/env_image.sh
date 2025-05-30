#!/bin/sh
set -e
# install required fonts
sudo apt-get install fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji
sudo python3 .circleci/download_google_fonts.py
sudo cp -r .circleci/fonts/ /usr/share/
sudo fc-cache -f
sudo python3 -m ensurepip
# install kaleido & plotly
# sudo python3 -m pip install "plotly[kaleido]==6.1.2" --progress-bar off
# Once new Kaleido and Plotly versions are released, uncomment the line above, update the Plotly version,
# and delete the two lines below.
sudo python3 -m pip install "git+https://github.com/plotly/plotly.py.git@6837831" --progress-bar off
sudo python3 -m pip install "git+https://github.com/plotly/Kaleido.git@2a4bfa2#subdirectory=src/py" --progress-bar off
# install numpy i.e. to convert arrays to typed arrays
sudo python3 -m pip install numpy==1.24.2
