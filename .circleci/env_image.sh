#!/bin/sh
set -e
python3 --version
# install required fonts
sudo apt-get install fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji
python3 -m pip install requests --progress-bar off
python3 .circleci/download_google_fonts.py
sudo cp -r .circleci/fonts/ /usr/share/
sudo fc-cache -f
# install kaleido & plotly
# python -m pip install "plotly[kaleido]==6.1.2" --progress-bar off
# Once new Kaleido and Plotly versions are released, uncomment the line above, update the Plotly version,
# and delete the two lines below.
python3 -m pip install "git+https://github.com/plotly/plotly.py.git@6837831" --progress-bar off
python3 -m pip install "git+https://github.com/plotly/Kaleido.git@b83b6b8#subdirectory=src/py" --progress-bar off
# install numpy i.e. to convert arrays to typed arrays
python3 -m pip install numpy==1.24.2
