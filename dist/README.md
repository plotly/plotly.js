# Using distributed files

Import plotly.js as:

```html
<script type="text/javascript" src="plotly.min.js"></script>

```

or the un-minified version as:

```html
<script type="text/javascript" src="plotly.js" charset="utf-8"></script>
```

To support IE9, put:

```html
<script>if(typeof window.Int16Array !== 'function')document.write("<scri"+"pt src='extras/typedarray.min.js'></scr"+"ipt>");</script>
```

before the plotly.js script tag.


To add MathJax, put

```html
<script type="text/javascript" src="mathjax/MathJax.js?config=TeX-AMS-MML_SVG"></script>
```

before the plotly.js script tag. You can grab the relevant MathJax files in `./dist/extras/mathjax/`. 
