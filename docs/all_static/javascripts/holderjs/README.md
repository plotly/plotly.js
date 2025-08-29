Holder
======

![](http://imsky.github.io/holder/images/header.png)

Holder uses SVG and `canvas` to render image placeholders on the client side.

[Bootstrap](http://getbootstrap.com) uses Holder in documentation.

You can install Holder using [Bower](http://bower.io/): `bower install holderjs`

How to use it
-------------

Include ``holder.js`` in your HTML:

```html
<script src="holder.js"></script>
```

Holder will then process all images with a specific ``src`` attribute, like this one:

```html
<img src="holder.js/200x300">
```

The above tag will render as a placeholder 200 pixels wide and 300 pixels tall.

To avoid console 404 errors, you can use ``data-src`` instead of ``src``.

Theming
-------

![](http://imsky.github.io/holder/images/holder_sky.png)![](http://imsky.github.io/holder/images/holder_vine.png)![](http://imsky.github.io/holder/images/holder_lava.png)

Holder includes support for themes, to help placeholders blend in with your layout. 

There are 6 default themes: ``sky``, ``vine``, ``lava``, ``gray``, ``industrial``, and ``social``. Use them like so:

```html
<img src="holder.js/200x300/sky">
```

Customizing themes
------------------

Themes have 4 properties: ``foreground``, ``background``, ``size``, and ``font``. The ``size`` property specifies the minimum font size for the theme. You can create a sample theme like this:

```js
Holder.add_theme("dark", {background:"#000", foreground:"#aaa", size:11, font: "Monaco"})
```

Using custom themes
-------------------

There are two ways to use custom themes with Holder:

* Include theme at runtime to render placeholders already using the theme name
* Include theme at any point and re-render placeholders that are using the theme name

The first approach is the easiest. After you include ``holder.js``, add a ``script`` tag that adds the theme you want:

```html
<script src="holder.js"></script>
<script> Holder.add_theme("bright", { background: "white", foreground: "gray", size: 12 })</script>
```

The second approach requires that you call ``run`` after you add the theme, like this:

```js
Holder.add_theme("bright", { background: "white", foreground: "gray", size: 12}).run()
```

Using custom themes and domain on specific images
-------------------------------------------------

You can use Holder in different areas on different images with custom themes:

```html
<img data-src="example.com/100x100/simple" id="new">
```

```js
Holder.run({
    domain: "example.com",
    themes: {
        "simple":{
            background:"#fff",
            foreground:"#000",
            size:12
            }
    },
    images: "#new"
    })
```

Using custom colors on specific images
--------------------------------------

Custom colors on a specific image can be specified in the ``background:foreground`` format using hex notation, like this:

```html
<img data-src="holder.js/100x200/#000:#fff">
```

The above will render a placeholder with a black background and white text.

Custom text
-----------

You can specify custom text using the ``text:`` operator:

```html
<img data-src="holder.js/200x200/text:hello world">
```

If you have a group of placeholders where you'd like to use particular text, you can do so by adding a ``text`` property to the theme:

```js
Holder.add_theme("thumbnail", { background: "#fff", text: "Thumbnail" })
```

Fluid placeholders
------------------

Specifying a dimension in percentages creates a fluid placeholder that responds to media queries.

```html
<img data-src="holder.js/100%x75/social">
```

By default, the fluid placeholder will show its current size in pixels. To display the original dimensions, i.e. 100%x75, set the ``textmode`` flag to ``literal`` like so: `holder.js/100%x75/textmode:literal`.

Automatically sized placeholders
--------------------------------

If you'd like to avoid Holder enforcing an image size, use the ``auto`` flag like so:

```html
<img data-src="holder.js/200x200/auto">
```

The above will render a placeholder without any embedded CSS for height or width.

To show the current size of an automatically sized placeholder, set the ``textmode`` flag to ``exact`` like so: `holder.js/200x200/auto/textmode:exact`.

Background placeholders
-----------------------

Holder can render placeholders as background images for elements with the `holderjs` class, like this:

```css
#sample {background:url(?holder.js/200x200/social) no-repeat}
```

```html
<div id="sample" class="holderjs"></div>
```

The Holder URL in CSS should have a `?` in front. You can change the default class by specifying a selector as the `bgnodes` property when calling `Holder.run`.

Customizing only the settings you need
--------------------------------------

Holder extends its default settings with the settings you provide, so you only have to include those settings you want changed. For example, you can run Holder on a specific domain like this:

```js
Holder.run({domain:"example.com"})
```

Using custom settings on load
-----------------------------

You can prevent Holder from running its default configuration by executing ``Holder.run`` with your custom settings right after including ``holder.js``. However, you'll have to execute ``Holder.run`` again to render any placeholders that use the default configuration.

Inserting an image with optional custom theme
---------------------------------------------

You can add a placeholder programmatically by chaining Holder calls:

```js
Holder.add_theme("new",{foreground:"#ccc", background:"#000", size:10}).add_image("holder.js/200x100/new", "body").run()
```

The first argument in ``add_image`` is the ``src`` attribute, and the second is a CSS selector of the parent element.

Changing rendering engine
-------------------------

By default, Holder renders placeholders using SVG, however it has a fallback `canvas` engine that it uses in case the browser lacks SVG support. If you'd like to force `canvas` rendering, you can do it like so:

```js
Holder.run({use_canvas:true})
```

Using with ``lazyload.js``
--------------------------

Holder is compatible with ``lazyload.js`` and works with both fluid and fixed-width images. For best results, run `.lazyload({skip_invisible:false})`.

Browser support
---------------

* Chrome
* Firefox 3+
* Safari 4+
* Internet Explorer 6+ (with fallback for older IE)
* Android (with fallback)

License
-------

Holder is provided under the [MIT License](http://opensource.org/licenses/MIT).

Credits
-------

Holder is a project by [Ivan Malopinsky](http://imsky.co).
