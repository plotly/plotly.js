"""Assemble the standalone explorer: plotly bundle + embedded tiles + app, inline.

Writes <dir>/gulf-offshore-explorer.html (a full document, for a local file) and
<dir>/artifact.html (the same page without the document wrapper, for publishing).
"""
import sys

D = sys.argv[1]
app = open(f"{D}/app.html").read()
plotly = open(f"{D}/plotly-map.min.js").read().replace("</script", "<\\/script").replace("\ufffd", "\\uFFFD")
tiles = open(f"{D}/tiles.js").read()
# scripts must run before the app script: put them right after the style block
head, sep, rest = app.partition("</style>")
body = head + sep + "\n<script>" + plotly + "</script>\n<script>" + tiles + "</script>\n" + rest
open(f"{D}/artifact.html", "w").write(body)
title_end = body.index("</title>") + len("</title>")
doc = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
       + body[:title_end] + "\n</head>\n<body>\n" + body[title_end:] + "\n</body>\n</html>\n")
open(f"{D}/gulf-offshore-explorer.html", "w").write(doc)
print(len(body) / 1048576, "MB")
