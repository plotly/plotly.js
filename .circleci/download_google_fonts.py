import os
import time

import requests

dir_out = ".circleci/fonts/truetype/googleFonts/"


def download(repo, family, types, overwrite=True, retries=4, timeout=20):
    session = requests.Session()
    for t in types:
        name = family + t + ".ttf"
        url = repo + name + "?raw=true"
        out_file = dir_out + name
        print("Getting: ", url)
        if os.path.exists(out_file) and not overwrite:
            print("    => Already exists: ", out_file)
            continue

        attempt = 0
        backoff = 2
        last_err = None
        # follow up to 2 redirects manually to keep logs readable
        max_redirects = 2
        while attempt <= retries:
            try:
                cur_url = url
                redirects = 0
                while True:
                    req = session.get(cur_url, allow_redirects=False, timeout=timeout)
                    if req.status_code in (301, 302) and redirects < max_redirects:
                        new_url = req.headers.get("Location")
                        print(f"    => Redirected to: {new_url}")
                        cur_url = new_url
                        redirects += 1
                        continue
                    break

                if req.status_code == 200:
                    os.makedirs(os.path.dirname(out_file), exist_ok=True)
                    with open(out_file, "wb") as f:
                        f.write(req.content)
                    print("    => Saved:", out_file)
                    last_err = None
                    break
                else:
                    print(f"    => HTTP {req.status_code}: {req.reason}")
                    last_err = RuntimeError(f"HTTP {req.status_code}: {req.reason}")
            except requests.exceptions.RequestException as e:
                last_err = e
                print(f"    => Network error: {e}")

            attempt += 1
            if attempt <= retries:
                print(f"    => Retrying in {backoff}s (attempt {attempt}/{retries})...")
                time.sleep(backoff)
                backoff *= 2

        if last_err is not None:
            # Don't hard-fail the entire job; log and move on.
            print(f"    => Giving up on {name}: {last_err}")


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
