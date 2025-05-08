import os

import requests

dir_out = ".circleci/fonts/truetype/googleFonts/"


def download(repo, family, types, overwrite=True):
    for t in types:
        name = family + t + ".ttf"
        url = repo + name + "?raw=true"
        out_file = dir_out + name
        print("Getting: ", url)
        if os.path.exists(out_file) and not overwrite:
            print("    => Already exists: ", out_file)
            continue
        req = requests.get(url, allow_redirects=False)
        if req.status_code != 200:
            # If we get a redirect, print an error so that we know to update the URL
            if req.status_code == 302 or req.status_code == 301:
                new_url = req.headers.get("Location")
                print(f"    => Redirected -- please update URL to: {new_url}")
            raise RuntimeError(f"""
Download failed.
Status code: {req.status_code}
Message: {req.reason}
""")
        open(out_file, "wb").write(req.content)


download(
    "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansMono/hinted/ttf/",
    "NotoSansMono",
    ["-Regular", "-Bold"],
)

download(
    "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSans/hinted/ttf/",
    "NotoSans",
    ["-Regular", "-Italic", "-Bold"],
)

download(
    "https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSerif/hinted/ttf/",
    "NotoSerif",
    [
        "-Regular",
        "-Italic",
        "-Bold",
        "-BoldItalic",
    ],
)

download(
    "https://raw.githubusercontent.com/google/fonts/refs/heads/main/ofl/oldstandardtt/",
    "OldStandard",
    ["-Regular", "-Italic", "-Bold"],
)

download(
    "https://raw.githubusercontent.com/google/fonts/refs/heads/main/ofl/ptsansnarrow/",
    "PT_Sans-Narrow-Web",
    ["-Regular", "-Bold"],
)

download(
    "https://raw.githubusercontent.com/impallari/Raleway/refs/heads/master/fonts/v3.000%20Fontlab/TTF/",
    "Raleway",
    ["-Regular", "-Regular-Italic", "-Bold", "-Bold-Italic"],
)

download(
    "https://raw.githubusercontent.com/googlefonts/roboto-2/refs/heads/main/src/hinted/",
    "Roboto",
    ["-Regular", "-Italic", "-Bold", "-BoldItalic"],
)

download(
    "https://raw.githubusercontent.com/expo/google-fonts/refs/heads/main/font-packages/gravitas-one/400Regular/",
    "GravitasOne",
    ["_400Regular"],
)
