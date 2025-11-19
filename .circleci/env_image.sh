#!/bin/bash
set -e
# install required fonts
sudo apt-get install fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji

# install pip
curl -LsSf https://astral.sh/uv/install.sh | sh
uv venv
source .venv/bin/activate

# install additional fonts
uv pip install requests
python .circleci/download_google_fonts.py
sudo cp -r .circleci/fonts/ /usr/share/
sudo apt install fontconfig
sudo fc-cache -f

# install kaleido & plotly
uv pip install "plotly==6.5" "kaleido==1.2" --no-progress

# install numpy i.e. to convert arrays to typed arrays
uv pip install "numpy==2.3" --no-progress

# verify version of python and versions of installed python packages
python --version
uv pip freeze
