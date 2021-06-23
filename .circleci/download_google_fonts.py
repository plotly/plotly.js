import requests

dirOut = '.circleci/fonts/truetype/googleFonts/'

def download(repo, family, types) :
    for t in types :
        name = family + t + '.ttf'
        url = repo + name + '?raw=true'
        print(url)
        req = requests.get(url, allow_redirects=True)
        open(dirOut + name, 'wb').write(req.content)

download(
    'https://github.com/impallari/Raleway/blob/master/fonts/v3.000%20Fontlab/TTF/',
    'Raleway',
    [
        '-Regular',
        '-Regular-Italic',
        '-Bold',
        '-Bold-Italic'
    ]
)

download(
    'https://github.com/googlefonts/roboto/blob/main/src/hinted/',
    'Roboto',
    [
        '-Regular',
        '-Italic',
        '-Bold',
        '-BoldItalic'
    ]
)
