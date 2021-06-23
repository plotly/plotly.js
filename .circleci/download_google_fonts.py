import requests

dirOut = '.circleci/fonts/truetype/googleFonts'

family = 'Raleway'
repo = 'https://github.com/impallari/' + family + '/blob/master/fonts/v3.000%20Fontlab/TTF/'

types = [
    '-Regular',
    '-Regular-Italic',
    '-Bold',
    '-Bold-Italic'
]

for t in types :
    name = family + t + '.ttf'
    url = repo + name + '?raw=true'
    print(url)
    req = requests.get(url, allow_redirects=True)
    open(dirOut + name, 'wb').write(req.content)
