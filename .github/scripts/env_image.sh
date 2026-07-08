#!/bin/sh
set -e

APT_PACKAGES="fonts-liberation2 fonts-open-sans fonts-noto-cjk fonts-noto-color-emoji fontconfig"
APT_CACHE_DIR="${HOME}/.cache/apt-fonts"

if [ "$APT_CACHE_HIT" = "true" ] && [ -d "$APT_CACHE_DIR" ]; then
    echo "Installing font packages from cache..."
    sudo dpkg -i "$APT_CACHE_DIR"/*.deb 2>/dev/null || sudo apt-get install -yf
else
    echo "Downloading and installing font packages..."
    sudo apt-get update -q
    sudo apt-get install -y --no-install-recommends $APT_PACKAGES
    # Save debs for future cache
    mkdir -p "$APT_CACHE_DIR"
    for pkg in $APT_PACKAGES; do
        cp /var/cache/apt/archives/${pkg}_*.deb "$APT_CACHE_DIR/" 2>/dev/null || true
    done
fi

# Rebuild font cache
sudo fc-cache -f

# Install additional fonts (committed in .github/fonts/)
sudo cp -r .github/fonts/ /usr/share/
sudo fc-cache -f

# Install Kaleido & Plotly
uv pip install --system kaleido==1.2 plotly==6.6.0 --no-progress

# Install numpy i.e. to convert arrays to typed arrays
uv pip install --system numpy==2.4.3

# Verify version of python and versions of installed python packages
python --version
uv pip freeze --system
