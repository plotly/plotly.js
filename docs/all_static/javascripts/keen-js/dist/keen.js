(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint evil: true, regexp: true */
/*members $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
    retrocycle, stringify, test, toString
*/
(function (exports) {
if (typeof exports.decycle !== 'function') {
    exports.decycle = function decycle(object) {
        'use strict';
        var objects = [],  
            paths = [];    
        return (function derez(value, path) {
            var i,         
                name,      
                nu;        
            switch (typeof value) {
            case 'object':
                if (!value) {
                    return null;
                }
                for (i = 0; i < objects.length; i += 1) {
                    if (objects[i] === value) {
                        return {$ref: paths[i]};
                    }
                }
                objects.push(value);
                paths.push(path);
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    nu = [];
                    for (i = 0; i < value.length; i += 1) {
                        nu[i] = derez(value[i], path + '[' + i + ']');
                    }
                } else {
                    nu = {};
                    for (name in value) {
                        if (Object.prototype.hasOwnProperty.call(value, name)) {
                            nu[name] = derez(value[name],
                                path + '[' + JSON.stringify(name) + ']');
                        }
                    }
                }
                return nu;
            case 'number':
            case 'string':
            case 'boolean':
                return value;
            }
        }(object, '$'));
    };
}
if (typeof exports.retrocycle !== 'function') {
    exports.retrocycle = function retrocycle($) {
        'use strict';
        var px =
            /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;
        (function rez(value) {
            var i, item, name, path;
            if (value && typeof value === 'object') {
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    for (i = 0; i < value.length; i += 1) {
                        item = value[i];
                        if (item && typeof item === 'object') {
                            path = item.$ref;
                            if (typeof path === 'string' && px.test(path)) {
                                value[i] = eval(path);
                            } else {
                                rez(item);
                            }
                        }
                    }
                } else {
                    for (name in value) {
                        if (typeof value[name] === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }($));
        return $;
    };
}
}) (
  (typeof exports !== 'undefined') ? 
    exports : 
    (window.JSON ? 
      (window.JSON) :
      (window.JSON = {})
    )
);
},{}],2:[function(require,module,exports){
var JSON2 = require('./json2');
var cycle = require('./cycle');
JSON2.decycle = cycle.decycle;
JSON2.retrocycle = cycle.retrocycle;
module.exports = JSON2;
},{"./cycle":1,"./json2":3}],3:[function(require,module,exports){
/*
    json2.js
    2011-10-19
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    See http://www.JSON.org/js.html
    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
    This file creates a global JSON object containing two methods: stringify
    and parse.
        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.
            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.
            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.
            This method produces a JSON text from a JavaScript value.
            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value
            For example, this would serialize Dates as ISO strings.
                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        return n < 10 ? '0' + n : n;
                    }
                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };
            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.
            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.
            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.
            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.
            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.
            Example:
            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.
            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.
            Example:
            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });
            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });
    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/
/*jslint evil: true, regexp: true */
/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/
(function (JSON) {
    'use strict';
    function f(n) {
        return n < 10 ? '0' + n : n;
    }
    /* DDOPSON-2012-04-16 - mutating global prototypes is NOT allowed for a well-behaved module.  
     * It's also unneeded, since Date already defines toJSON() to the same ISOwhatever format below
     * Thus, we skip this logic for the CommonJS case where 'exports' is defined
     */
    if (typeof exports === 'undefined') {
      if (typeof Date.prototype.toJSON !== 'function') {
          Date.prototype.toJSON = function (key) {
              return isFinite(this.valueOf())
                  ? this.getUTCFullYear()     + '-' +
                      f(this.getUTCMonth() + 1) + '-' +
                      f(this.getUTCDate())      + 'T' +
                      f(this.getUTCHours())     + ':' +
                      f(this.getUTCMinutes())   + ':' +
                      f(this.getUTCSeconds())   + 'Z'
                  : null;
          };
      }
      if (typeof String.prototype.toJSON !== 'function') {
        String.prototype.toJSON = function (key) { return this.valueOf(); };
      }
      if (typeof Number.prototype.toJSON !== 'function') {
        Number.prototype.toJSON = function (key) { return this.valueOf(); };
      }
      if (typeof Boolean.prototype.toJSON !== 'function') {
        Boolean.prototype.toJSON = function (key) { return this.valueOf(); };
      }
    }
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {   
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;
    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
        var i,         
            k,         
            v,         
            length,
            mind = gap,
            partial,
            value = holder[key];
        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }
        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }
        switch (typeof value) {
        case 'string':
            return quote(value);
        case 'number':
            return isFinite(value) ? String(value) : 'null';
        case 'boolean':
        case 'null':
            return String(value);
        case 'object':
            if (!value) {
                return 'null';
            }
            gap += indent;
            partial = [];
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }
    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {
            var i;
            gap = '';
            indent = '';
            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }
            } else if (typeof space === 'string') {
                indent = space;
            }
            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }
            return str('', {'': value});
        };
    }
    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {
            var j;
            function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }
            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                j = eval('(' + text + ')');
                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }
            throw new SyntaxError('JSON.parse');
        };
    }
})(
  (typeof exports !== 'undefined') ? 
    exports : 
    (window.JSON ? 
      (window.JSON) :
      (window.JSON = {})
    )
);
},{}],4:[function(require,module,exports){
/**
 * Expose `Emitter`.
 */
module.exports = Emitter;
/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */
function Emitter(obj) {
  if (obj) return mixin(obj);
};
/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */
function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}
/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */
Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};
/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */
Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};
  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }
  on.fn = fn;
  this.on(event, on);
  return this;
};
/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */
Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};
/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */
Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];
  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }
  return this;
};
/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */
Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};
/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */
Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};
},{}],5:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2012 - License MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('domready', function (ready) {
  var fns = [], fn, f = false
    , doc = document
    , testEl = doc.documentElement
    , hack = testEl.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , addEventListener = 'addEventListener'
    , onreadystatechange = 'onreadystatechange'
    , readyState = 'readyState'
    , loadedRgx = hack ? /^loaded|^c/ : /^loaded|c/
    , loaded = loadedRgx.test(doc[readyState])
  function flush(f) {
    loaded = 1
    while (f = fns.shift()) f()
  }
  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
    doc.removeEventListener(domContentLoaded, fn, f)
    flush()
  }, f)
  hack && doc.attachEvent(onreadystatechange, fn = function () {
    if (/^c/.test(doc[readyState])) {
      doc.detachEvent(onreadystatechange, fn)
      flush()
    }
  })
  return (ready = hack ?
    function (fn) {
      self != top ?
        loaded ? fn() : fns.push(fn) :
        function () {
          try {
            testEl.doScroll('left')
          } catch (e) {
            return setTimeout(function() { ready(fn) }, 50)
          }
          fn()
        }()
    } :
    function (fn) {
      loaded ? fn() : fns.push(fn)
    })
})
},{}],6:[function(require,module,exports){
/**
 * Copyright (c) 2011-2014 Felix Gnass
 * Licensed under the MIT license
 */
(function(root, factory) {
  /* CommonJS */
  if (typeof exports == 'object')  module.exports = factory()
  /* AMD module */
  else if (typeof define == 'function' && define.amd) define(factory)
  /* Browser global */
  else root.Spinner = factory()
}
(this, function() {
  "use strict";
  var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */
    , animations = {} /* Animation rules keyed by their name */
    , useCssAnimations /* Whether to use CSS animations or setTimeout */
  /**
   * Utility function to create elements. If no tag name is given,
   * a DIV is created. Optionally properties can be passed.
   */
  function createEl(tag, prop) {
    var el = document.createElement(tag || 'div')
      , n
    for(n in prop) el[n] = prop[n]
    return el
  }
  /**
   * Appends children and returns the parent.
   */
  function ins(parent /* child1, child2, ...*/) {
    for (var i=1, n=arguments.length; i<n; i++)
      parent.appendChild(arguments[i])
    return parent
  }
  /**
   * Insert a new stylesheet to hold the @keyframe or VML rules.
   */
  var sheet = (function() {
    var el = createEl('style', {type : 'text/css'})
    ins(document.getElementsByTagName('head')[0], el)
    return el.sheet || el.styleSheet
  }())
  /**
   * Creates an opacity keyframe animation rule and returns its name.
   * Since most mobile Webkits have timing issues with animation-delay,
   * we create separate rules for each line/segment.
   */
  function addAnimation(alpha, trail, i, lines) {
    var name = ['opacity', trail, ~~(alpha*100), i, lines].join('-')
      , start = 0.01 + i/lines * 100
      , z = Math.max(1 - (1-alpha) / trail * (100-start), alpha)
      , prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase()
      , pre = prefix && '-' + prefix + '-' || ''
    if (!animations[name]) {
      sheet.insertRule(
        '@' + pre + 'keyframes ' + name + '{' +
        '0%{opacity:' + z + '}' +
        start + '%{opacity:' + alpha + '}' +
        (start+0.01) + '%{opacity:1}' +
        (start+trail) % 100 + '%{opacity:' + alpha + '}' +
        '100%{opacity:' + z + '}' +
        '}', sheet.cssRules.length)
      animations[name] = 1
    }
    return name
  }
  /**
   * Tries various vendor prefixes and returns the first supported property.
   */
  function vendor(el, prop) {
    var s = el.style
      , pp
      , i
    prop = prop.charAt(0).toUpperCase() + prop.slice(1)
    for(i=0; i<prefixes.length; i++) {
      pp = prefixes[i]+prop
      if(s[pp] !== undefined) return pp
    }
    if(s[prop] !== undefined) return prop
  }
  /**
   * Sets multiple style properties at once.
   */
  function css(el, prop) {
    for (var n in prop)
      el.style[vendor(el, n)||n] = prop[n]
    return el
  }
  /**
   * Fills in default values.
   */
  function merge(obj) {
    for (var i=1; i < arguments.length; i++) {
      var def = arguments[i]
      for (var n in def)
        if (obj[n] === undefined) obj[n] = def[n]
    }
    return obj
  }
  /**
   * Returns the line color from the given string or array.
   */
  function getColor(color, idx) {
    return typeof color == 'string' ? color : color[idx % color.length]
  }
  var defaults = {
    lines: 12,           
    length: 7,           
    width: 5,            
    radius: 10,          
    rotate: 0,           
    corners: 1,          
    color: '#000',       
    direction: 1,        
    speed: 1,            
    trail: 100,          
    opacity: 1/4,        
    fps: 20,             
    zIndex: 2e9,         
    className: 'spinner',
    top: '50%',          
    left: '50%',         
    position: 'absolute' 
  }
  /** The constructor */
  function Spinner(o) {
    this.opts = merge(o || {}, Spinner.defaults, defaults)
  }
  Spinner.defaults = {}
  merge(Spinner.prototype, {
    /**
     * Adds the spinner to the given target element. If this instance is already
     * spinning, it is automatically removed from its previous target b calling
     * stop() internally.
     */
    spin: function(target) {
      this.stop()
      var self = this
        , o = self.opts
        , el = self.el = css(createEl(0, {className: o.className}), {position: o.position, width: 0, zIndex: o.zIndex})
      css(el, {
        left: o.left,
        top: o.top
      })
      if (target) {
        target.insertBefore(el, target.firstChild||null)
      }
      el.setAttribute('role', 'progressbar')
      self.lines(el, self.opts)
      if (!useCssAnimations) {
        var i = 0
          , start = (o.lines - 1) * (1 - o.direction) / 2
          , alpha
          , fps = o.fps
          , f = fps/o.speed
          , ostep = (1-o.opacity) / (f*o.trail / 100)
          , astep = f/o.lines
        ;(function anim() {
          i++;
          for (var j = 0; j < o.lines; j++) {
            alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)
            self.opacity(el, j * o.direction + start, alpha, o)
          }
          self.timeout = self.el && setTimeout(anim, ~~(1000/fps))
        })()
      }
      return self
    },
    /**
     * Stops and removes the Spinner.
     */
    stop: function() {
      var el = this.el
      if (el) {
        clearTimeout(this.timeout)
        if (el.parentNode) el.parentNode.removeChild(el)
        this.el = undefined
      }
      return this
    },
    /**
     * Internal method that draws the individual lines. Will be overwritten
     * in VML fallback mode below.
     */
    lines: function(el, o) {
      var i = 0
        , start = (o.lines - 1) * (1 - o.direction) / 2
        , seg
      function fill(color, shadow) {
        return css(createEl(), {
          position: 'absolute',
          width: (o.length+o.width) + 'px',
          height: o.width + 'px',
          background: color,
          boxShadow: shadow,
          transformOrigin: 'left',
          transform: 'rotate(' + ~~(360/o.lines*i+o.rotate) + 'deg) translate(' + o.radius+'px' +',0)',
          borderRadius: (o.corners * o.width>>1) + 'px'
        })
      }
      for (; i < o.lines; i++) {
        seg = css(createEl(), {
          position: 'absolute',
          top: 1+~(o.width/2) + 'px',
          transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
          opacity: o.opacity,
          animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1/o.speed + 's linear infinite'
        })
        if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {top: 2+'px'}))
        ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')))
      }
      return el
    },
    /**
     * Internal method that adjusts the opacity of a single line.
     * Will be overwritten in VML fallback mode below.
     */
    opacity: function(el, i, val) {
      if (i < el.childNodes.length) el.childNodes[i].style.opacity = val
    }
  })
  function initVML() {
    /* Utility function to create a VML tag */
    function vml(tag, attr) {
      return createEl('<' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr)
    }
    sheet.addRule('.spin-vml', 'behavior:url(#default#VML)')
    Spinner.prototype.lines = function(el, o) {
      var r = o.length+o.width
        , s = 2*r
      function grp() {
        return css(
          vml('group', {
            coordsize: s + ' ' + s,
            coordorigin: -r + ' ' + -r
          }),
          { width: s, height: s }
        )
      }
      var margin = -(o.width+o.length)*2 + 'px'
        , g = css(grp(), {position: 'absolute', top: margin, left: margin})
        , i
      function seg(i, dx, filter) {
        ins(g,
          ins(css(grp(), {rotation: 360 / o.lines * i + 'deg', left: ~~dx}),
            ins(css(vml('roundrect', {arcsize: o.corners}), {
                width: r,
                height: o.width,
                left: o.radius,
                top: -o.width>>1,
                filter: filter
              }),
              vml('fill', {color: getColor(o.color, i), opacity: o.opacity}),
              vml('stroke', {opacity: 0})
            )
          )
        )
      }
      if (o.shadow)
        for (i = 1; i <= o.lines; i++)
          seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)')
      for (i = 1; i <= o.lines; i++) seg(i)
      return ins(el, g)
    }
    Spinner.prototype.opacity = function(el, i, val, o) {
      var c = el.firstChild
      o = o.shadow && o.lines || 0
      if (c && i+o < c.childNodes.length) {
        c = c.childNodes[i+o]; c = c && c.firstChild; c = c && c.firstChild
        if (c) c.opacity = val
      }
    }
  }
  var probe = css(createEl('group'), {behavior: 'url(#default#VML)'})
  if (!vendor(probe, 'transform') && probe.adj) initVML()
  else useCssAnimations = vendor(probe, 'animation')
  return Spinner
}));
},{}],7:[function(require,module,exports){
/**
 * Module dependencies.
 */
var Emitter = require('emitter');
var reduce = require('reduce');
/**
 * Root reference for iframes.
 */
var root = 'undefined' == typeof window
  ? this
  : window;
/**
 * Noop.
 */
function noop(){};
/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
function isHost(obj) {
  var str = {}.toString.call(obj);
  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}
/**
 * Determine XHR.
 */
function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}
/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */
var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };
/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
function isObject(obj) {
  return obj === Object(obj);
}
/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */
function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}
/**
 * Expose serialization method.
 */
 request.serializeObject = serialize;
 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */
function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;
  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }
  return obj;
}
/**
 * Expose parser.
 */
request.parseString = parseString;
/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */
request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};
/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */
 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };
 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */
request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};
/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */
function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;
  lines.pop();
  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }
  return fields;
}
/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
function type(str){
  return str.split(/ *; */).shift();
};
/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */
function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();
    if (key && val) obj[key] = val;
    return obj;
  }, {});
};
/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */
function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.req.method !='HEAD' 
     ? this.xhr.responseText 
     : null;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}
/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */
Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};
/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */
Response.prototype.setHeaderProperties = function(header){
  var ct = this.header['content-type'] || '';
  this.type = type(ct);
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};
/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */
Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && str.length
    ? parse(str)
    : null;
};
/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */
Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;
  this.status = status;
  this.statusType = type;
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};
/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */
Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;
  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;
  return err;
};
/**
 * Expose `Response`.
 */
request.Response = Response;
/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */
function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;
    try {
      res = new Response(self); 
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
    }
    self.callback(err, res);
  });
}
/**
 * Mixin `Emitter`.
 */
Emitter(Request.prototype);
/**
 * Allow for extension
 */
Request.prototype.use = function(fn) {
  fn(this);
  return this;
}
/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};
/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};
/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};
/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};
/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};
/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */
Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};
/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};
/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};
/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};
/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/
Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};
/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(name, val);
  return this;
};
/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(field, file, filename);
  return this;
};
/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *      
 *       request.get('/search')
 *         .end(callback)
 *
 *      
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *      
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *      
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *      
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *      
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *      
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }
  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};
/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */
Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};
/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */
Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};
/**
 * Invoke callback with timeout error.
 *
 * @api private
 */
Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};
/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */
Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};
/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */
Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;
  this._callback = fn || noop;
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }
  xhr.open(this.method, this.url, true);
  if (this._withCredentials) xhr.withCredentials = true;
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }
  this.emit('request', this);
  xhr.send(data);
  return this;
};
/**
 * Expose `Request`.
 */
request.Request = Request;
/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */
function request(method, url) {
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }
  if (1 == arguments.length) {
    return new Request('GET', method);
  }
  return new Request(method, url);
}
/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */
request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */
request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */
request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};
/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */
request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */
request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */
request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * Expose `request`.
 */
module.exports = request;
},{"emitter":8,"reduce":9}],8:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],9:[function(require,module,exports){
/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */
module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];
  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  return curr;
};
},{}],10:[function(require,module,exports){
var Keen = require("./index"),
    each = require("./utils/each");
module.exports = function(){
  var loaded = window['Keen'] || null,
      cached = window['_' + 'Keen'] || null,
      clients,
      ready;
  if (loaded && cached) {
    clients = cached['clients'] || {},
    ready = cached['ready'] || [];
    each(clients, function(client, id){
      each(Keen.prototype, function(method, key){
        loaded.prototype[key] = method;
      });
      each(["Query", "Request", "Dataset", "Dataviz"], function(name){
        loaded[name] = (Keen[name]) ? Keen[name] : function(){};
      });
      if (client._config) {
        client.configure.call(client, client._config);
      }
      if (client._setGlobalProperties) {
        each(client._setGlobalProperties, function(fn){
          client.setGlobalProperties.apply(client, fn);
        });
      }
      if (client._addEvent) {
        each(client._addEvent, function(obj){
          client.addEvent.apply(client, obj);
        });
      }
      var callback = client._on || [];
      if (client._on) {
        each(client._on, function(obj){
          client.on.apply(client, obj);
        });
        client.trigger('ready');
      }
      each(["_config", "_setGlobalProperties", "_addEvent", "_on"], function(name){
        if (client[name]) {
          client[name] = undefined;
          try{
            delete client[name];
          } catch(e){}
        }
      });
    });
    each(ready, function(cb, i){
      Keen.once("ready", cb);
    });
  }
  window['_' + 'Keen'] = undefined;
  try {
    delete window['_' + 'Keen']
  } catch(e) {}
};
},{"./index":19,"./utils/each":31}],11:[function(require,module,exports){
var Emitter = require('component-emitter');
Emitter.prototype.trigger = Emitter.prototype.emit;
module.exports = Emitter;
},{"component-emitter":4}],12:[function(require,module,exports){
module.exports = function(){
  return "undefined" == typeof window ? "server" : "browser";
};
},{}],13:[function(require,module,exports){
var each = require('../utils/each'),
    JSON2 = require('JSON2');
module.exports = function(params){
  var query = [];
  each(params, function(value, key){
    if ('string' !== typeof value) {
      value = JSON2.stringify(value);
    }
    query.push(key + '=' + encodeURIComponent(value));
  });
  return '?' + query.join('&');
};
},{"../utils/each":31,"JSON2":2}],14:[function(require,module,exports){
module.exports = function(){
  return new Date().getTimezoneOffset() * -60;
};
},{}],15:[function(require,module,exports){
module.exports = function(){
  if ("undefined" !== typeof window) {
    if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
      return 2000;
    }
  }
  return 16000;
};
},{}],16:[function(require,module,exports){
module.exports = function() {
  var root = "undefined" == typeof window ? this : window;
  if (root.XMLHttpRequest && ("file:" != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch(e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch(e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch(e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch(e) {}
  }
  return false;
};
},{}],17:[function(require,module,exports){
module.exports = function(err, res, callback) {
  var cb = callback || function() {};
  if (res && !res.ok) {
    var is_err = res.body && res.body.error_code;
    err = new Error(is_err ? res.body.message : 'Unknown error occurred');
    err.code = is_err ? res.body.error_code : 'UnknownError';
  }
  if (err) {
    cb(err, null);
  }
  else {
    cb(null, res.body);
  }
  return;
};
},{}],18:[function(require,module,exports){
var superagent = require('superagent');
var each = require('../utils/each'),
    getXHR = require('./get-xhr-object');
module.exports = function(type, opts){
  return function(request) {
    var __super__ = request.constructor.prototype.end;
    if ( 'undefined' === typeof window ) return;
    request.requestType = request.requestType || {};
    request.requestType['type'] = type;
    request.requestType['options'] = request.requestType['options'] || {
      async: true,
      success: {
        responseText: '{ "created": true }',
        status: 201
      },
      error: {
        responseText: '{ "error_code": "ERROR", "message": "Request failed" }',
        status: 404
      }
    };
    if (opts) {
      if ( 'boolean' === typeof opts.async ) {
        request.requestType['options'].async = opts.async;
      }
      if ( opts.success ) {
        extend(request.requestType['options'].success, opts.success);
      }
      if ( opts.error ) {
        extend(request.requestType['options'].error, opts.error);
      }
    }
    request.end = function(fn){
      var self = this,
          reqType = (this.requestType) ? this.requestType['type'] : 'xhr',
          query,
          timeout;
      if ( ('GET' !== self['method'] || 'xhr' === reqType) && self.requestType['options'].async ) {
        __super__.call(self, fn);
        return;
      }
      query = self._query.join('&');
      timeout = self._timeout;
      self._callback = fn || noop;
      if (timeout && !self._timer) {
        self._timer = setTimeout(function(){
          abortRequest.call(self);
        }, timeout);
      }
      if (query) {
        query = superagent.serializeObject(query);
        self.url += ~self.url.indexOf('?') ? '&' + query : '?' + query;
      }
      self.emit('request', self);
      if ( !self.requestType['options'].async ) {
        sendXhrSync.call(self);
      }
      else if ( 'jsonp' === reqType ) {
        sendJsonp.call(self);
      }
      else if ( 'beacon' === reqType ) {
        sendBeacon.call(self);
      }
      return self;
    };
    return request;
  };
};
function sendXhrSync(){
  var xhr = getXHR();
  if (xhr) {
    xhr.open('GET', this.url, false);
    xhr.send(null);
  }
  return this;
}
function sendJsonp(){
  var self = this,
      timestamp = new Date().getTime(),
      script = document.createElement('script'),
      parent = document.getElementsByTagName('head')[0],
      callbackName = 'keenJSONPCallback',
      loaded = false;
  callbackName += timestamp;
  while (callbackName in window) {
    callbackName += 'a';
  }
  window[callbackName] = function(response) {
    if (loaded === true) return;
    loaded = true;
    handleSuccess.call(self, response);
    cleanup();
  };
  script.src = self.url + '&jsonp=' + callbackName;
  parent.appendChild(script);
  script.onreadystatechange = function() {
    if (loaded === false && self.readyState === 'loaded') {
      loaded = true;
      handleError.call(self);
      cleanup();
    }
  };
  script.onerror = function() {
    if (loaded === false) {
      loaded = true;
      handleError.call(self);
      cleanup();
    }
  };
  function cleanup(){
    window[callbackName] = undefined;
    try {
      delete window[callbackName];
    } catch(e){}
    parent.removeChild(script);
  }
}
function sendBeacon(){
  var self = this,
      img = document.createElement('img'),
      loaded = false;
  img.onload = function() {
    loaded = true;
    if ('naturalHeight' in this) {
      if (this.naturalHeight + this.naturalWidth === 0) {
        this.onerror();
        return;
      }
    } else if (this.width + this.height === 0) {
      this.onerror();
      return;
    }
    handleSuccess.call(self);
  };
  img.onerror = function() {
    loaded = true;
    handleError.call(self);
  };
  img.src = self.url + '&c=clv1';
}
function handleSuccess(res){
  var opts = this.requestType['options']['success'],
      response = '';
  xhrShim.call(this, opts);
  if (res) {
    try {
      response = JSON.stringify(res);
    } catch(e) {}
  }
  else {
    response = opts['responseText'];
  }
  this.xhr.responseText = response;
  this.xhr.status = opts['status'];
  this.emit('end');
}
function handleError(){
  var opts = this.requestType['options']['error'];
  xhrShim.call(this, opts);
  this.xhr.responseText = opts['responseText'];
  this.xhr.status = opts['status'];
  this.emit('end');
}
function abortRequest(){
  this.aborted = true;
  this.clearTimeout();
  this.emit('abort');
}
function xhrShim(opts){
  this.xhr = {
    getAllResponseHeaders: function(){ return ''; },
    getResponseHeader: function(){ return 'application/json'; },
    responseText: opts['responseText'],
    status: opts['status']
  };
  return this;
}
},{"../utils/each":31,"./get-xhr-object":16,"superagent":7}],19:[function(require,module,exports){
var root = this;
var previous_Keen = root.Keen;
var extend = require('./utils/extend');
var Emitter = require('./helpers/emitter-shim');
function Keen(config) {
  this.configure(config || {});
  Keen.trigger('client', this);
}
Keen.debug = false;
Keen.enabled = true;
Keen.loaded = true;
Keen.version = '3.2.1';
Emitter(Keen);
Emitter(Keen.prototype);
Keen.prototype.configure = function(cfg){
  var config = cfg || {};
  if (config['host']) {
    config['host'].replace(/.*?:\/\//g, '');
  }
  if (config.protocol && config.protocol === 'auto') {
    config['protocol'] = location.protocol.replace(/:/g, '');
  }
  this.config = {
    projectId   : config.projectId,
    writeKey    : config.writeKey,
    readKey     : config.readKey,
    masterKey   : config.masterKey,
    requestType : config.requestType || 'jsonp',
    host        : config['host']     || 'api.keen.io/3.0',
    protocol    : config['protocol'] || 'https',
    globalProperties: null
  };
  if (Keen.debug) {
    this.on('error', Keen.log);
  }
  this.trigger('ready');
};
Keen.prototype.projectId = function(str){
  if (!arguments.length) return this.config.projectId;
  this.config.projectId = (str ? String(str) : null);
  return this;
};
Keen.prototype.masterKey = function(str){
  if (!arguments.length) return this.config.masterKey;
  this.config.masterKey = (str ? String(str) : null);
  return this;
};
Keen.prototype.readKey = function(str){
  if (!arguments.length) return this.config.readKey;
  this.config.readKey = (str ? String(str) : null);
  return this;
};
Keen.prototype.writeKey = function(str){
  if (!arguments.length) return this.config.writeKey;
  this.config.writeKey = (str ? String(str) : null);
  return this;
};
Keen.prototype.url = function(path){
  if (!this.projectId()) {
    this.trigger('error', 'Client is missing projectId property');
    return;
  }
  return this.config.protocol + '://' + this.config.host + '/projects/' + this.projectId() + path;
};
Keen.log = function(message) {
  if (Keen.debug && typeof console == 'object') {
    console.log('[Keen IO]', message);
  }
};
Keen.noConflict = function(){
  root.Keen = previous_Keen;
  return Keen;
};
Keen.ready = function(fn){
  if (Keen.loaded) {
    fn();
  } else {
    Keen.once('ready', fn);
  }
};
module.exports = Keen;
},{"./helpers/emitter-shim":11,"./utils/extend":32}],20:[function(require,module,exports){
var JSON2 = require('JSON2');
var request = require('superagent');
var Keen = require('../index');
var base64 = require('../utils/base64'),
    each = require('../utils/each'),
    getContext = require('../helpers/get-context'),
    getQueryString = require('../helpers/get-query-string'),
    getUrlMaxLength = require('../helpers/get-url-max-length'),
    getXHR = require('../helpers/get-xhr-object'),
    requestTypes = require('../helpers/superagent-request-types'),
    responseHandler = require('../helpers/superagent-handle-response');
module.exports = function(collection, payload, callback, async) {
  var self = this,
      urlBase = this.url('/events/' + collection),
      reqType = this.config.requestType,
      data = {},
      cb = callback,
      isAsync,
      getUrl;
  isAsync = ('boolean' === typeof async) ? async : true;
  if (!Keen.enabled) {
    handleValidationError.call(self, 'Keen.enabled = false');
    return;
  }
  if (!self.projectId()) {
    handleValidationError.call(self, 'Missing projectId property');
    return;
  }
  if (!self.writeKey()) {
    handleValidationError.call(self, 'Missing writeKey property');
    return;
  }
  if (!collection || typeof collection !== 'string') {
    handleValidationError.call(self, 'Collection name must be a string');
    return;
  }
  if (self.config.globalProperties) {
    data = self.config.globalProperties(collection);
  }
  each(payload, function(value, key){
    data[key] = value;
  });
  if ( !getXHR() && 'xhr' === reqType ) {
    reqType = 'jsonp';
  }
  if ( 'xhr' !== reqType || !isAsync ) {
    getUrl = prepareGetRequest.call(self, urlBase, data);
  }
  if ( getUrl && getContext() === 'browser' ) {
    request
      .get(getUrl)
      .use(function(req){
        req.async = isAsync;
        return req;
      })
      .use(requestTypes(reqType))
      .end(handleResponse);
  }
  else if ( getXHR() || getContext() === 'server' ) {
    request
      .post(urlBase)
      .set('Content-Type', 'application/json')
      .set('Authorization', self.writeKey())
      .send(data)
      .end(handleResponse);
  }
  else {
    self.trigger('error', 'Request not sent: URL length exceeds current browser limit, and XHR (POST) is not supported.');
  }
  function handleResponse(err, res){
    responseHandler(err, res, cb);
    cb = callback = null;
  }
  function handleValidationError(msg){
    var err = 'Event not recorded: ' + msg;
    self.trigger('error', err);
    if (cb) {
      cb.call(self, err, null);
      cb = callback = null;
    }
  }
  return;
};
function prepareGetRequest(url, data){
  url += getQueryString({
    api_key  : this.writeKey(),
    data     : base64.encode( JSON2.stringify(data) ),
    modified : new Date().getTime()
  });
  return ( url.length < getUrlMaxLength() ) ? url : false;
}
},{"../helpers/get-context":12,"../helpers/get-query-string":13,"../helpers/get-url-max-length":15,"../helpers/get-xhr-object":16,"../helpers/superagent-handle-response":17,"../helpers/superagent-request-types":18,"../index":19,"../utils/base64":29,"../utils/each":31,"JSON2":2,"superagent":7}],21:[function(require,module,exports){
var Keen = require('../index');
var request = require('superagent');
var each = require('../utils/each'),
    getContext = require('../helpers/get-context'),
    getXHR = require('../helpers/get-xhr-object'),
    requestTypes = require('../helpers/superagent-request-types'),
    responseHandler = require('../helpers/superagent-handle-response');
module.exports = function(payload, callback) {
  var self = this,
      urlBase = this.url('/events'),
      data = {},
      cb = callback;
  if (!Keen.enabled) {
    handleValidationError.call(self, 'Keen.enabled = false');
    return;
  }
  if (!self.projectId()) {
    handleValidationError.call(self, 'Missing projectId property');
    return;
  }
  if (!self.writeKey()) {
    handleValidationError.call(self, 'Missing writeKey property');
    return;
  }
  if (arguments.length > 2) {
    handleValidationError.call(self, 'Incorrect arguments provided to #addEvents method');
    return;
  }
  if (typeof payload !== 'object' || payload instanceof Array) {
    handleValidationError.call(self, 'Request payload must be an object');
    return;
  }
  if (self.config.globalProperties) {
    each(payload, function(events, collection){
      each(events, function(body, index){
        var base = self.config.globalProperties(collection);
        each(body, function(value, key){
          base[key] = value;
        });
        data[collection].push(base);
      });
    });
  }
  else {
    data = payload;
  }
  if ( getXHR() || getContext() === 'server' ) {
    request
      .post(urlBase)
      .set('Content-Type', 'application/json')
      .set('Authorization', self.writeKey())
      .send(data)
      .end(function(err, res){
        responseHandler(err, res, cb);
        cb = callback = null;
      });
  }
  else {
    self.trigger('error', 'Events not recorded: XHR support is required for batch upload');
  }
  function handleValidationError(msg){
    var err = 'Events not recorded: ' + msg;
    self.trigger('error', err);
    if (cb) {
      cb.call(self, err, null);
      cb = callback = null;
    }
  }
  return;
};
},{"../helpers/get-context":12,"../helpers/get-xhr-object":16,"../helpers/superagent-handle-response":17,"../helpers/superagent-request-types":18,"../index":19,"../utils/each":31,"superagent":7}],22:[function(require,module,exports){
var request = require('superagent');
var getQueryString = require('../helpers/get-query-string'),
    handleResponse = require('../helpers/superagent-handle-response'),
    requestTypes = require('../helpers/superagent-request-types');
module.exports = function(url, params, api_key, callback){
  var reqType = this.config.requestType,
      data = params || {};
  if (reqType === 'beacon') {
    reqType = 'jsonp';
  }
  data['api_key'] = data['api_key'] || api_key;
  request
    .get(url+getQueryString(data))
    .use(requestTypes(reqType))
    .end(function(err, res){
      handleResponse(err, res, callback);
      callback = null;
    });
};
},{"../helpers/get-query-string":13,"../helpers/superagent-handle-response":17,"../helpers/superagent-request-types":18,"superagent":7}],23:[function(require,module,exports){
var request = require('superagent');
var handleResponse = require('../helpers/superagent-handle-response');
module.exports = function(url, data, api_key, callback){
  request
    .post(url)
    .set('Content-Type', 'application/json')
    .set('Authorization', api_key)
    .send(data || {})
    .end(function(err, res) {
      handleResponse(err, res, callback);
      callback = null;
    });
};
},{"../helpers/superagent-handle-response":17,"superagent":7}],24:[function(require,module,exports){
var Request = require("../request");
module.exports = function(query, callback) {
  var queries = [],
      cb = callback,
      request;
  if (query instanceof Array) {
    queries = query;
  } else {
    queries.push(query);
  }
  request = new Request(this, queries, cb).refresh();
  cb = callback = null;
  return request;
};
},{"../request":28}],25:[function(require,module,exports){
module.exports = function(newGlobalProperties) {
  if (newGlobalProperties && typeof(newGlobalProperties) == "function") {
    this.config.globalProperties = newGlobalProperties;
  } else {
    this.trigger("error", "Invalid value for global properties: " + newGlobalProperties);
  }
};
},{}],26:[function(require,module,exports){
var addEvent = require("./addEvent");
module.exports = function(jsEvent, eventCollection, payload, timeout, timeoutCallback){
  var evt = jsEvent,
      target = (evt.currentTarget) ? evt.currentTarget : (evt.srcElement || evt.target),
      timer = timeout || 500,
      triggered = false,
      targetAttr = "",
      callback,
      win;
  if (target.getAttribute !== void 0) {
    targetAttr = target.getAttribute("target");
  } else if (target.target) {
    targetAttr = target.target;
  }
  if ((targetAttr == "_blank" || targetAttr == "blank") && !evt.metaKey) {
    win = window.open("about:blank");
    win.document.location = target.href;
  }
  if (target.nodeName === "A") {
    callback = function(){
      if(!triggered && !evt.metaKey && (targetAttr !== "_blank" && targetAttr !== "blank")){
        triggered = true;
        window.location = target.href;
      }
    };
  } else if (target.nodeName === "FORM") {
    callback = function(){
      if(!triggered){
        triggered = true;
        target.submit();
      }
    };
  } else {
    this.trigger("error", "#trackExternalLink method not attached to an <a> or <form> DOM element");
  }
  if (timeoutCallback) {
    callback = function(){
      if(!triggered){
        triggered = true;
        timeoutCallback();
      }
    };
  }
  addEvent.call(this, eventCollection, payload, callback);
  setTimeout(callback, timer);
  if (!evt.metaKey) {
    return false;
  }
};
},{"./addEvent":20}],27:[function(require,module,exports){
var each = require("./utils/each"),
    extend = require("./utils/extend"),
    getTimezoneOffset = require("./helpers/get-timezone-offset"),
    getQueryString = require("./helpers/get-query-string");
var Emitter = require('./helpers/emitter-shim');
function Query(){
  this.configure.apply(this, arguments);
};
Emitter(Query.prototype);
Query.prototype.configure = function(analysisType, params) {
  this.analysis = analysisType;
  this.params = this.params || {};
  this.set(params);
  if (this.params.timezone === void 0) {
    this.params.timezone = getTimezoneOffset();
  }
  return this;
};
Query.prototype.set = function(attributes) {
  var self = this;
  each(attributes, function(v, k){
    var key = k, value = v;
    if (k.match(new RegExp("[A-Z]"))) {
      key = k.replace(/([A-Z])/g, function($1) { return "_"+$1.toLowerCase(); });
    }
    self.params[key] = value;
    if (value instanceof Array) {
      each(value, function(dv, index){
        if (dv instanceof Array == false && typeof dv === "object") {
          each(dv, function(deepValue, deepKey){
            if (deepKey.match(new RegExp("[A-Z]"))) {
              var _deepKey = deepKey.replace(/([A-Z])/g, function($1) { return "_"+$1.toLowerCase(); });
              delete self.params[key][index][deepKey];
              self.params[key][index][_deepKey] = deepValue;
            }
          });
        }
      });
    }
  });
  return self;
};
Query.prototype.get = function(attribute) {
  var key = attribute;
  if (key.match(new RegExp("[A-Z]"))) {
    key = key.replace(/([A-Z])/g, function($1) { return "_"+$1.toLowerCase(); });
  }
  if (this.params) {
    return this.params[key] || null;
  }
};
Query.prototype.addFilter = function(property, operator, value) {
  this.params.filters = this.params.filters || [];
  this.params.filters.push({
    "property_name": property,
    "operator": operator,
    "property_value": value
  });
  return this;
};
module.exports = Query;
},{"./helpers/emitter-shim":11,"./helpers/get-query-string":13,"./helpers/get-timezone-offset":14,"./utils/each":31,"./utils/extend":32}],28:[function(require,module,exports){
var each = require("./utils/each"),
    extend = require("./utils/extend"),
    sendQuery = require("./utils/sendQuery");
var Keen = require("./");
var Emitter = require('./helpers/emitter-shim');
function Request(client, queries, callback){
  var cb = callback;
  this.config = {
    timeout: 300 * 1000
  };
  this.configure(client, queries, cb);
  cb = callback = null;
};
Emitter(Request.prototype);
Request.prototype.configure = function(client, queries, callback){
  var cb = callback;
  extend(this, {
    "client"   : client,
    "queries"  : queries,
    "data"     : {},
    "callback" : cb
  });
  cb = callback = null;
  return this;
};
Request.prototype.timeout = function(ms){
  if (!arguments.length) return this.config.timeout;
  this.config.timeout = (!isNaN(parseInt(ms)) ? parseInt(ms) : null);
  return this;
};
Request.prototype.refresh = function(){
  var self = this,
      completions = 0,
      response = [],
      errored = false;
  var handleResponse = function(err, res, index){
    if (err) {
      self.trigger("error", err);
      if (self.callback) {
        self.callback(err, null);
      }
      errored = true;
      return;
    }
    response[index] = res;
    completions++;
    if (completions == self.queries.length && !errored) {
      self.data = (self.queries.length == 1) ? response[0] : response;
      self.trigger("complete", null, self.data);
      if (self.callback) {
        self.callback(null, self.data);
      }
    }
  };
  each(self.queries, function(query, index){
    var path;
    var cbSequencer = function(err, res){
      handleResponse(err, res, index);
    };
    if (query instanceof Keen.Query) {
      path = "/queries/" + query.analysis;
      sendQuery.call(self, path, query.params, cbSequencer);
    }
    else if ( Object.prototype.toString.call(query) === "[object String]" ) {
      path = "/saved_queries/" + encodeURIComponent(query) + "/result";
      sendQuery.call(self, path, null, cbSequencer);
    }
    else {
      var res = {
        statusText: "Bad Request",
        responseText: { message: "Error: Query " + (+index+1) + " of " + self.queries.length + " for project " + self.client.projectId() + " is not a valid request" }
      };
      self.trigger("error", res.responseText.message);
      if (self.callback) {
        self.callback(res.responseText.message, null);
      }
    }
  });
  return this;
};
module.exports = Request;
},{"./":19,"./helpers/emitter-shim":11,"./utils/each":31,"./utils/extend":32,"./utils/sendQuery":34}],29:[function(require,module,exports){
module.exports = {
  map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  encode: function (n) {
    "use strict";
    var o = "", i = 0, m = this.map, i1, i2, i3, e1, e2, e3, e4;
    n = this.utf8.encode(n);
    while (i < n.length) {
      i1 = n.charCodeAt(i++); i2 = n.charCodeAt(i++); i3 = n.charCodeAt(i++);
      e1 = (i1 >> 2); e2 = (((i1 & 3) << 4) | (i2 >> 4)); e3 = (isNaN(i2) ? 64 : ((i2 & 15) << 2) | (i3 >> 6));
      e4 = (isNaN(i2) || isNaN(i3)) ? 64 : i3 & 63;
      o = o + m.charAt(e1) + m.charAt(e2) + m.charAt(e3) + m.charAt(e4);
    } return o;
  },
  decode: function (n) {
    "use strict";
    var o = "", i = 0, m = this.map, cc = String.fromCharCode, e1, e2, e3, e4, c1, c2, c3;
    n = n.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (i < n.length) {
      e1 = m.indexOf(n.charAt(i++)); e2 = m.indexOf(n.charAt(i++));
      e3 = m.indexOf(n.charAt(i++)); e4 = m.indexOf(n.charAt(i++));
      c1 = (e1 << 2) | (e2 >> 4); c2 = ((e2 & 15) << 4) | (e3 >> 2);
      c3 = ((e3 & 3) << 6) | e4;
      o = o + (cc(c1) + ((e3 != 64) ? cc(c2) : "")) + (((e4 != 64) ? cc(c3) : ""));
    } return this.utf8.decode(o);
  },
  utf8: {
    encode: function (n) {
      "use strict";
      var o = "", i = 0, cc = String.fromCharCode, c;
      while (i < n.length) {
        c = n.charCodeAt(i++); o = o + ((c < 128) ? cc(c) : ((c > 127) && (c < 2048)) ?
        (cc((c >> 6) | 192) + cc((c & 63) | 128)) : (cc((c >> 12) | 224) + cc(((c >> 6) & 63) | 128) + cc((c & 63) | 128)));
        } return o;
    },
    decode: function (n) {
      "use strict";
      var o = "", i = 0, cc = String.fromCharCode, c2, c;
      while (i < n.length) {
        c = n.charCodeAt(i);
        o = o + ((c < 128) ? [cc(c), i++][0] : ((c > 191) && (c < 224)) ?
        [cc(((c & 31) << 6) | ((c2 = n.charCodeAt(i + 1)) & 63)), (i += 2)][0] :
        [cc(((c & 15) << 12) | (((c2 = n.charCodeAt(i + 1)) & 63) << 6) | ((c3 = n.charCodeAt(i + 2)) & 63)), (i += 3)][0]);
      } return o;
    }
  }
};
},{}],30:[function(require,module,exports){
var JSON2 = require("JSON2");
module.exports = function(target) {
  return JSON2.parse( JSON2.stringify( target ) );
};
},{"JSON2":2}],31:[function(require,module,exports){
module.exports = function(o, cb, s){
  var n;
  if (!o){
    return 0;
  }
  s = !s ? o : s;
  if (o instanceof Array){
    for (n=0; n<o.length; n++) {
      if (cb.call(s, o[n], n, o) === false){
        return 0;
      }
    }
  } else {
    for (n in o){
      if (o.hasOwnProperty(n)) {
        if (cb.call(s, o[n], n, o) === false){
          return 0;
        }
      }
    }
  }
  return 1;
};
},{}],32:[function(require,module,exports){
module.exports = function(target){
  for (var i = 1; i < arguments.length; i++) {
    for (var prop in arguments[i]){
      target[prop] = arguments[i][prop];
    }
  }
  return target;
};
},{}],33:[function(require,module,exports){
function parseParams(str){
  var urlParams = {},
      match,
      pl     = /\+/g, 
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = str.split("?")[1];
  while (!!(match=search.exec(query))) {
    urlParams[decode(match[1])] = decode(match[2]);
  }
  return urlParams;
};
module.exports = parseParams;
},{}],34:[function(require,module,exports){
var request = require('superagent');
var getContext = require('../helpers/get-context'),
    getQueryString = require('../helpers/get-query-string'),
    getUrlMaxLength = require('../helpers/get-url-max-length'),
    getXHR = require('../helpers/get-xhr-object'),
    requestTypes = require('../helpers/superagent-request-types'),
    responseHandler = require('../helpers/superagent-handle-response');
module.exports = function(path, params, callback){
  var self = this,
      urlBase = this.client.url(path),
      reqType = this.client.config.requestType,
      cb = callback;
  callback = null;
  if (!self.client.projectId()) {
    self.client.trigger('error', 'Query not sent: Missing projectId property');
    return;
  }
  if (!self.client.readKey()) {
    self.client.trigger('error', 'Query not sent: Missing readKey property');
    return;
  }
  if (getXHR() || getContext() === 'server' ) {
    request
      .post(urlBase)
        .set('Content-Type', 'application/json')
        .set('Authorization', self.client.readKey())
        .timeout(self.timeout())
        .send(params || {})
        .end(handleResponse);
  }
  else {
    extend(params, { api_key: self.client.readKey() });
    urlBase += getQueryString(params);
    if (urlBase.length < getUrlMaxLength() ) {
      request
        .get(urlBase)
        .timeout(self.timeout())
        .use(requestTypes('jsonp'))
        .end(handleResponse);
    }
    else {
      self.client.trigger('error', 'Query not sent: URL length exceeds current browser limit, and XHR (POST) is not supported.');
    }
  }
  function handleResponse(err, res){
    responseHandler(err, res, cb);
    cb = callback = null;
  }
  return;
}
},{"../helpers/get-context":12,"../helpers/get-query-string":13,"../helpers/get-url-max-length":15,"../helpers/get-xhr-object":16,"../helpers/superagent-handle-response":17,"../helpers/superagent-request-types":18,"superagent":7}],35:[function(require,module,exports){
var clone = require("../core/utils/clone"),
    each = require("../core/utils/each"),
    flatten = require("./utils/flatten"),
    parse = require("./utils/parse");
var Emitter = require('../core/helpers/emitter-shim');
function Dataset(){
  this.data = {
    input: {},
    output: [[]]
  };
  this.meta = {
    schema: {},
    method: undefined
  };
  if (arguments.length > 0) {
    this.parse.apply(this, arguments);
  }
}
Dataset.defaults = {
  delimeter: " -> "
};
Emitter(Dataset);
Emitter(Dataset.prototype);
Dataset.prototype.input = function(obj){
  if (!arguments.length) return this["data"]["input"];
  this["data"]["input"] = (obj ? clone(obj) : null);
  return this;
};
Dataset.prototype.output = function(arr){
  if (!arguments.length) return this["data"].output;
  this["data"].output = (arr instanceof Array ? arr : null);
  return this;
}
Dataset.prototype.method = function(str){
  if (!arguments.length) return this.meta["method"];
  this.meta["method"] = (str ? String(str) : null);
  return this;
};
Dataset.prototype.schema = function(obj){
  if (!arguments.length) return this.meta.schema;
  this.meta.schema = (obj ? obj : null);
  return this;
};
Dataset.prototype.parse = function(raw, schema){
  var options;
  if (raw) this.input(raw);
  if (schema) this.schema(schema);
  this.output([[]]);
  if (this.meta.schema.select) {
    this.method("select");
    options = extend({
      records: "",
      select: true
    }, this.schema());
    _select.call(this, _optHash(options));
  }
  else if (this.meta.schema.unpack) {
    this.method("unpack");
    options = extend({
      records: "",
      unpack: {
        index: false,
        value: false,
        label: false
      }
    }, this.schema());
    _unpack.call(this, _optHash(options));
  }
  return this;
};
function _select(cfg){
  var self = this,
      options = cfg || {},
      target_set = [],
      unique_keys = [];
  var root, records_target;
  if (options.records === "" || !options.records) {
    root = [self.input()];
  } else {
    records_target = options.records.split(Dataset.defaults.delimeter);
    root = parse.apply(self, [self.input()].concat(records_target))[0];
  }
  each(options.select, function(prop){
    target_set.push(prop.path.split(Dataset.defaults.delimeter));
  });
  if (target_set.length == 0) {
    each(root, function(record, interval){
      var flat = flatten(record);
      for (var key in flat) {
        if (flat.hasOwnProperty(key) && unique_keys.indexOf(key) == -1) {
          unique_keys.push(key);
          target_set.push([key]);
        }
      }
    });
  }
  var test = [[]];
  each(target_set, function(props, i){
    if (target_set.length == 1) {
      test[0].push('label', 'value');
    } else {
      test[0].push(props.join("."));
    }
  });
  each(root, function(record, i){
    var flat = flatten(record);
    if (target_set.length == 1) {
      test.push([target_set.join("."), flat[target_set.join(".")]]);
    } else {
      test.push([]);
      each(target_set, function(t, j){
        var target = t.join(".");
        test[i+1].push(flat[target]);
      });
    }
  });
  self.output(test);
  self.format(options.select);
  return self;
}
function _unpack(options){
  var self = this, discovered_labels = [];
  var value_set = (options.unpack.value) ? options.unpack.value.path.split(Dataset.defaults.delimeter) : false,
      label_set = (options.unpack.label) ? options.unpack.label.path.split(Dataset.defaults.delimeter) : false,
      index_set = (options.unpack.index) ? options.unpack.index.path.split(Dataset.defaults.delimeter) : false;
  var value_desc = (value_set[value_set.length-1] !== "") ? value_set[value_set.length-1] : "Value",
      label_desc = (label_set[label_set.length-1] !== "") ? label_set[label_set.length-1] : "Label",
      index_desc = (index_set[index_set.length-1] !== "") ? index_set[index_set.length-1] : "Index";
  var root = (function(){
    var root;
    if (options.records == "") {
      root = [self.input()];
    } else {
      root = parse.apply(self, [self.input()].concat(options.records.split(Dataset.defaults.delimeter)));
    }
    return root[0];
  })();
  if (root instanceof Array == false) {
    root = [root];
  }
  each(root, function(record, interval){
    var labels = (label_set) ? parse.apply(self, [record].concat(label_set)) : [];
    if (labels) {
      discovered_labels = labels;
    }
  });
  each(root, function(record, interval){
    var plucked_value = (value_set) ? parse.apply(self, [record].concat(value_set)) : false,
        plucked_index = (index_set) ? parse.apply(self, [record].concat(index_set)) : false;
    if (plucked_index) {
      each(plucked_index, function(){
        self.data.output.push([]);
      });
    } else {
      self.data.output.push([]);
    }
    if (plucked_index) {
      if (interval == 0) {
        self.data.output[0].push(index_desc);
        if (discovered_labels.length > 0) {
          each(discovered_labels, function(value, i){
            self.data.output[0].push(value);
          });
        } else {
          self.data.output[0].push(value_desc);
        }
      }
      if (root.length < self.data.output.length-1) {
        if (interval == 0) {
          each(self.data.output, function(row, i){
            if (i > 0) {
              self.data.output[i].push(plucked_index[i-1]);
            }
          });
        }
      } else {
        self.data.output[interval+1].push(plucked_index[0]);
      }
    }
    if (!plucked_index && discovered_labels.length > 0) {
      if (interval == 0) {
        self.data.output[0].push(label_desc);
        self.data.output[0].push(value_desc);
      }
      self.data.output[interval+1].push(discovered_labels[0]);
    }
    if (!plucked_index && discovered_labels.length == 0) {
      self.data.output[0].push('');
    }
    if (plucked_value) {
      if (root.length < self.data.output.length-1) {
        if (interval == 0) {
          each(self.data.output, function(row, i){
            if (i > 0) {
              self.data.output[i].push(plucked_value[i-1]);
            }
          });
        }
      } else {
        each(plucked_value, function(value){
          self.data.output[interval+1].push(value);
        });
      }
    } else {
      each(self.data.output[0], function(cell, i){
        var offset = (plucked_index) ? 0 : -1;
        if (i > offset) {
          self.data.output[interval+1].push(null);
        }
      })
    }
  });
  self.format(options.unpack);
  return this;
}
function _optHash(options){
  each(options.unpack, function(value, key, object){
    if (value && is(value, 'string')) {
      options.unpack[key] = { path: options.unpack[key] };
    }
  });
  return options;
}
function is(o, t){
  o = typeof(o);
  if (!t){
    return o != 'undefined';
  }
  return o == t;
}
function extend(o, e){
  each(e, function(v, n){
    if (is(o[n], 'object') && is(v, 'object')){
      o[n] = extend(o[n], v);
    } else if (v !== null) {
      o[n] = v;
    }
  });
  return o;
}
module.exports = Dataset;
},{"../core/helpers/emitter-shim":11,"../core/utils/clone":30,"../core/utils/each":31,"./utils/flatten":46,"./utils/parse":47}],36:[function(require,module,exports){
var extend = require("../core/utils/extend"),
    Dataset = require("./dataset");
extend(Dataset.prototype, require("./lib/append"));
extend(Dataset.prototype, require("./lib/delete"));
extend(Dataset.prototype, require("./lib/filter"));
extend(Dataset.prototype, require("./lib/insert"));
extend(Dataset.prototype, require("./lib/select"));
extend(Dataset.prototype, require("./lib/sort"));
extend(Dataset.prototype, require("./lib/update"));
extend(Dataset.prototype, require("./lib/analyses"));
extend(Dataset.prototype, {
  "format": require("./lib/format"),
});
module.exports = Dataset;
},{"../core/utils/extend":32,"./dataset":35,"./lib/analyses":37,"./lib/append":38,"./lib/delete":39,"./lib/filter":40,"./lib/format":41,"./lib/insert":42,"./lib/select":43,"./lib/sort":44,"./lib/update":45}],37:[function(require,module,exports){
var each = require("../../core/utils/each"),
    arr = ["Average", "Maximum", "Minimum", "Sum"],
    output = {};
output["average"] = function(arr, start, end){
  var set = arr.slice(start||0, (end ? end+1 : arr.length)),
      sum = 0,
      avg = null;
  each(set, function(val, i){
    if (typeof val === "number" && !isNaN(parseFloat(val))) {
      sum += parseFloat(val);
    }
  });
  return sum / set.length;
};
output["maximum"] = function(arr, start, end){
  var set = arr.slice(start||0, (end ? end+1 : arr.length)),
      nums = [];
  each(set, function(val, i){
    if (typeof val === "number" && !isNaN(parseFloat(val))) {
      nums.push(parseFloat(val));
    }
  });
  return Math.max.apply(Math, nums);
};
output["minimum"] = function(arr, start, end){
  var set = arr.slice(start||0, (end ? end+1 : arr.length)),
      nums = [];
  each(set, function(val, i){
    if (typeof val === "number" && !isNaN(parseFloat(val))) {
      nums.push(parseFloat(val));
    }
  });
  return Math.min.apply(Math, nums);
};
output["sum"] = function(arr, start, end){
  var set = arr.slice(start||0, (end ? end+1 : arr.length)),
      sum = 0;
  each(set, function(val, i){
    if (typeof val === "number" && !isNaN(parseFloat(val))) {
      sum += parseFloat(val);
    }
  });
  return sum;
};
each(arr, function(v,i){
  output["getColumn"+v] = output["getRow"+v] = function(arr){
    return this[v.toLowerCase()](arr, 1);
  };
});
output["getColumnLabel"] = output["getRowIndex"] = function(arr){
  return arr[0];
};
module.exports = output;
},{"../../core/utils/each":31}],38:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = {
  "appendColumn": appendColumn,
  "appendRow": appendRow
};
function appendColumn(str, input){
  var self = this,
      args = Array.prototype.slice.call(arguments, 2),
      label = (str !== undefined) ? str : null;
  if (typeof input === "function") {
    self.data.output[0].push(label);
    each(self.output(), function(row, i){
      var cell;
      if (i > 0) {
        cell = input.call(self, row, i);
        if (typeof cell === "undefined") {
          cell = null;
        }
        self.data.output[i].push(cell);
      }
    });
  }
  else if (!input || input instanceof Array) {
    self.data.output[0].push(label);
    each(self.output(), function(row, i){
      var cell;
      if (i > 0) {
        cell = (input && input[i-1] !== undefined) ? input[i-1] : null;
        self.data.output[i].push(cell);
      }
    });
  }
  return self;
}
function appendRow(str, input){
  var self = this,
      args = Array.prototype.slice.call(arguments, 2),
      label = (str !== undefined) ? str : null,
      newRow = [];
  newRow.push(label);
  if (typeof input === "function") {
    each(self.output()[0], function(label, i){
      var col, cell;
      if (i > 0) {
        col = self.selectColumn(i);
        cell = input.call(self, col, i);
        if (typeof cell === "undefined") {
          cell = null;
        }
        newRow.push(cell);
      }
    });
    self.data.output.push(newRow);
  }
  else if (!input || input instanceof Array) {
    each(self.output()[0], function(label, i){
      var cell;
      if (i > 0) {
        cell = (input && input[i-1] !== undefined) ? input[i-1] : null;
        newRow.push(cell);
      }
    });
    this.data.output.push(newRow);
  }
  return this;
}
},{"../../core/utils/each":31}],39:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = {
  "deleteColumn": deleteColumn,
  "deleteRow": deleteRow
};
function deleteColumn(q){
  var self = this,
  index = (!isNaN(parseInt(q))) ? q : this.output()[0].indexOf(q);
  if (index > -1) {
    each(self.data.output, function(row, i){
      self.data.output[i].splice(index, 1);
    });
  }
  return self;
}
function deleteRow(q){
  var index = (!isNaN(parseInt(q))) ? q : this.selectColumn(0).indexOf(q);
  if (index > -1) {
    this.data.output.splice(index, 1);
  }
  return this;
}
},{"../../core/utils/each":31}],40:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = {
  "filterColumns": filterColumns,
  "filterRows": filterRows
};
function filterColumns(fn){
  var self = this,
      clone = new Array();
  each(self.data.output, function(row, i){
    clone.push([]);
  });
  each(self.data.output[0], function(col, i){
    var selectedColumn = self.selectColumn(i);
    if (i == 0 || fn.call(self, selectedColumn, i)) {
      each(selectedColumn, function(cell, ri){
        clone[ri].push(cell);
      });
    }
  });
  self.output(clone);
  return self;
}
function filterRows(fn){
  var self = this,
      clone = [];
  each(self.output(), function(row, i){
    if (i == 0 || fn.call(self, row, i)) {
      clone.push(row);
    }
  });
  self.output(clone);
  return self;
}
},{"../../core/utils/each":31}],41:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = function(options){
  var self = this;
    if (this.method() === 'select') {
      each(self.output(), function(row, i){
        if (i == 0) {
          each(row, function(cell, j){
            if (options[j] && options[j].label) {
              self.data.output[i][j] = options[j].label;
            }
          });
        } else {
          each(row, function(cell, j){
            self.data.output[i][j] = _applyFormat(self.data.output[i][j], options[j]);
          });
        }
      });
    }
  if (this.method() === 'unpack') {
    if (options.index) {
      each(self.output(), function(row, i){
        if (i == 0) {
          if (options.index.label) {
            self.data.output[i][0] = options.index.label;
          }
        } else {
          self.data.output[i][0] = _applyFormat(self.data.output[i][0], options.index);
        }
      });
    }
    if (options.label) {
      if (options.index) {
        each(self.output(), function(row, i){
          each(row, function(cell, j){
            if (i == 0 && j > 0) {
              self.data.output[i][j] = _applyFormat(self.data.output[i][j], options.label);
            }
          });
        });
      } else {
        each(self.output(), function(row, i){
          if (i > 0) {
            self.data.output[i][0] = _applyFormat(self.data.output[i][0], options.label);
          }
        });
      }
    }
    if (options.value) {
      if (options.index) {
        each(self.output(), function(row, i){
          each(row, function(cell, j){
            if (i > 0 && j > 0) {
              self.data.output[i][j] = _applyFormat(self.data.output[i][j], options.value);
            }
          });
        });
      } else {
        each(self.output(), function(row, i){
          each(row, function(cell, j){
            if (i > 0) {
              self.data.output[i][j] = _applyFormat(self.data.output[i][j], options.value);
            }
          });
        });
      }
    }
  }
  return self;
};
function _applyFormat(value, opts){
  var output = value,
      options = opts || {};
  if (options.replace) {
    each(options.replace, function(val, key){
      if (output == key || String(output) == String(key) || parseFloat(output) == parseFloat(key)) {
        output = val;
      }
    });
  }
  if (options.type && options.type == 'date') {
    if (options.format && moment && moment(value).isValid()) {
      output = moment(output).format(options.format);
    } else {
      output = new Date(output);
    }
  }
  if (options.type && options.type == 'string') {
    output = String(output);
  }
  if (options.type && options.type == 'number' && !isNaN(parseFloat(output))) {
    output = parseFloat(output);
  }
  return output;
}
},{"../../core/utils/each":31}],42:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = {
  "insertColumn": insertColumn,
  "insertRow": insertRow
};
function insertColumn(index, str, input){
  var self = this, label;
  label = (str !== undefined) ? str : null;
  if (typeof input === "function") {
    self.data.output[0].splice(index, 0, label);
    each(self.output(), function(row, i){
      var cell;
      if (i > 0) {
        cell = input.call(self, row, i);
        if (typeof cell === "undefined") {
          cell = null;
        }
        self.data.output[i].splice(index, 0, cell);
      }
    });
  }
  else if (!input || input instanceof Array) {
    self.data.output[0].splice(index, 0, label);
    each(self.output(), function(row, i){
      var cell;
      if (i > 0) {
        cell = (input && input[i-1] !== "undefined") ? input[i-1] : null;
        self.data.output[i].splice(index, 0, cell);
      }
    });
  }
  return self;
}
function insertRow(index, str, input){
  var self = this, label, newRow = [];
  label = (str !== undefined) ? str : null;
  newRow.push(label);
  if (typeof input === "function") {
    each(self.output()[0], function(label, i){
      var col, cell;
      if (i > 0) {
        col = self.selectColumn(i);
        cell = input.call(self, col, i);
        if (typeof cell === "undefined") {
          cell = null;
        }
        newRow.push(cell);
      }
    });
    self.data.output.splice(index, 0, newRow);
  }
  else if (!input || input instanceof Array) {
    each(self.output()[0], function(label, i){
      var cell;
      if (i > 0) {
        cell = (input && input[i-1] !== undefined) ? input[i-1] : null;
        newRow.push(cell);
      }
    });
    this.data.output.splice(index, 0, newRow);
  }
  return this;
}
},{"../../core/utils/each":31}],43:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = {
  "selectColumn": selectColumn,
  "selectRow": selectRow
};
function selectColumn(q){
  var result = new Array(),
      index = (!isNaN(parseInt(q))) ? q : this.output()[0].indexOf(q);
  if (index > -1) {
    each(this.data.output, function(row, i){
      result.push(row[index]);
    });
  }
  return result;
}
function selectRow(q){
  var index = (!isNaN(parseInt(q))) ? q : this.selectColumn(0).indexOf(q);
  if (index > -1) {
    return this.data.output[index];
  }
}
},{"../../core/utils/each":31}],44:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = {
  "sortColumns": sortColumns,
  "sortRows": sortRows
};
function sortColumns(str, comp){
  var self = this,
      head = this.output()[0].slice(1),
      cols = [],
      clone = [],
      fn = comp || this.getColumnLabel;
  each(head, function(cell, i){
    cols.push(self.selectColumn(i+1).slice(0));
  });
  cols.sort(function(a,b){
    var op = fn.call(self, a) > fn.call(self, b);
    if (op) {
      return (str === "asc" ? 1 : -1);
    } else if (!op) {
      return (str === "asc" ? -1 : 1);
    } else {
      return 0;
    }
  });
  each(cols, function(col, i){
    self
      .deleteColumn(i+1)
      .insertColumn(i+1, col[0], col.slice(1));
  });
  return self;
}
function sortRows(str, comp){
  var self = this,
      head = this.output().slice(0,1),
      body = this.output().slice(1),
      fn = comp || this.getRowIndex;
  body.sort(function(a, b){
    var op = fn.call(self, a) > fn.call(self, b);
    if (op) {
      return (str === "asc" ? 1 : -1);
    } else if (!op) {
      return (str === "asc" ? -1 : 1);
    } else {
      return 0;
    }
  });
  self.output(head.concat(body));
  return self;
}
},{"../../core/utils/each":31}],45:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = {
  "updateColumn": updateColumn,
  "updateRow": updateRow
};
function updateColumn(q, input){
  var self = this, index;
  index = (!isNaN(parseInt(q))) ? q : this.output()[0].indexOf(q);
  if (index > -1) {
    if (typeof input === "function") {
      each(self.output(), function(row, i){
        var cell;
        if (i > 0) {
          cell = input.call(self, row[index], i, row);
          if (typeof cell !== "undefined") {
            self.data.output[i][index] = cell;
          }
        }
      });
    } else if (!input || input instanceof Array) {
      each(self.output(), function(row, i){
        var cell;
        if (i > 0) {
          cell = (input && typeof input[i-1] !== "undefined" ? input[i-1] : null);
          self.data.output[i][index] = cell;
        }
      });
    }
  }
  return self;
}
function updateRow(q, input){
  var self = this, index;
  index = (!isNaN(parseInt(q))) ? q : this.selectColumn(0).indexOf(q);
  if (index > -1) {
    if (typeof input === "function") {
      each(self.output()[index], function(value, i){
        var col = self.selectColumn(i),
        cell = input.call(self, value, i, col);
        if (typeof cell !== "undefined") {
          self.data.output[index][i] = cell;
        }
      });
    } else if (!input || input instanceof Array) {
      each(self.output()[index], function(c, i){
        var cell;
        if (i > 0) {
          cell = (input && input[i-1] !== undefined) ? input[i-1] : null;
          self.data.output[index][i] = cell;
        }
      });
    }
  }
  return self;
}
},{"../../core/utils/each":31}],46:[function(require,module,exports){
module.exports = flatten;
function flatten(ob) {
  var toReturn = {};
  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    if ((typeof ob[i]) == 'object' && ob[i] !== null) {
      var flatObject = flatten(ob[i]);
      for (var x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}
},{}],47:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = function() {
  var result = [];
  var loop = function() {
    var root = arguments[0];
    var args = Array.prototype.slice.call(arguments, 1);
    var target = args.pop();
    if (args.length === 0) {
      if (root instanceof Array) {
        args = root;
      } else if (typeof root === 'object') {
        args.push(root);
      }
    }
    each(args, function(el){
      if (target == "") {
        if (typeof el == "number" || el == null) {
          return result.push(el);
        }
      }
      if (el[target] || el[target] === 0 || el[target] !== void 0) {
        if (el[target] === null) {
          return result.push(null);
        } else {
          return result.push(el[target]);
        }
      } else if (root[el]){
        if (root[el] instanceof Array) {
          each(root[el], function(n, i) {
            var splinter = [root[el]].concat(root[el][i]).concat(args.slice(1)).concat(target);
            return loop.apply(this, splinter);
          });
        } else {
          if (root[el][target]) {
            return result.push(root[el][target]);
          } else {
            return loop.apply(this, [root[el]].concat(args.splice(1)).concat(target));
          }
        }
      } else if (typeof root === 'object' && root instanceof Array === false && !root[target]) {
        throw new Error("Target property does not exist", target);
      } else {
        return loop.apply(this, [el].concat(args.splice(1)).concat(target));
      }
      return;
    });
    if (result.length > 0) {
      return result;
    }
  };
  return loop.apply(this, arguments);
}
},{"../../core/utils/each":31}],48:[function(require,module,exports){
/*!
 * ----------------------
 * C3.js Adapter
 * ----------------------
 */
var Dataviz = require("../dataviz"),
    each = require("../../core/utils/each"),
    extend = require("../../core/utils/extend");
module.exports = function(){
  var dataTypes = {
    "singular"             : ["gauge"],
    "categorical"          : ["donut", "pie"],
    "cat-interval"         : ["area-step", "step", "bar", "area", "area-spline", "spline", "line"],
    "cat-ordinal"          : ["bar", "area", "area-spline", "spline", "line", "step", "area-step"],
    "chronological"        : ["area", "area-spline", "spline", "line", "bar", "step", "area-step"],
    "cat-chronological"    : ["line", "spline", "area", "area-spline", "bar", "step", "area-step"]
  };
  var charts = {};
  each(["gauge", "donut", "pie", "bar", "area", "area-spline", "spline", "line", "step", "area-step"], function(type, index){
    charts[type] = {
      render: function(){
        var setup = getSetupTemplate.call(this, type);
        this.view._artifacts["c3"] = c3.generate(setup);
        this.update();
      },
      update: function(){
        var self = this, cols = [];
        if (type === "gauge") {
          self.view._artifacts["c3"].load({
            columns: [ [self.title(), self.data()[1][1]] ]
          })
        }
        else if (type === "pie" || type === "donut") {
          self.view._artifacts["c3"].load({
            columns: self.dataset.data.output.slice(1)
          });
        }
        else {
          if (this.dataType().indexOf("chron") > -1) {
            cols.push(self.dataset.selectColumn(0));
            cols[0][0] = 'x';
          }
          each(self.data()[0], function(c, i){
            if (i > 0) {
              cols.push(self.dataset.selectColumn(i));
            }
          });
          self.view._artifacts["c3"].groups([self.data()[0].slice(1)]);
          self.view._artifacts["c3"].load({
            columns: cols
          });
        }
      },
      destroy: function(){
        _selfDestruct.call(this);
      }
    };
  });
  function getSetupTemplate(type){
    var setup = {
      bindto: this.el(),
      data: {
        columns: []
      },
      color: {
        pattern: this.colors()
      },
      size: {
        height: this.height(),
        width: this.width()
      }
    };
    setup["data"]["type"] = type;
    if (type === "gauge") {}
    else if (type === "pie" || type === "donut") {
      setup[type] = { title: this.title() };
    }
    else {
      if (this.dataType().indexOf("chron") > -1) {
        setup["data"]["x"] = "x";
        setup["axis"] = {
          x: {
            type: 'timeseries',
            tick: {
              format: '%Y-%m-%d'
            }
          }
        };
      }
    }
    return extend(setup, this.chartOptions());
  }
  function _selfDestruct(){
    if (this.view._artifacts["c3"]) {
      this.view._artifacts["c3"].destroy();
      this.view._artifacts["c3"] = null;
    }
  }
  Dataviz.register('c3', charts, { capabilities: dataTypes });
};
},{"../../core/utils/each":31,"../../core/utils/extend":32,"../dataviz":52}],49:[function(require,module,exports){
/*!
 * ----------------------
 * Chart.js Adapter
 * ----------------------
 */
var Dataviz = require("../dataviz"),
    each = require("../../core/utils/each"),
    extend = require("../../core/utils/extend");
module.exports = function(){
  if (typeof Chart !== "undefined") {
    Chart.defaults.global.responsive = true;
  }
  var dataTypes = {
    "categorical"          : ["doughnut", "pie", "polar-area", "radar"],
    "cat-interval"         : ["bar", "line"],
    "cat-ordinal"          : ["bar", "line"],
    "chronological"        : ["line", "bar"],
    "cat-chronological"    : ["line", "bar"]
  };
  var ChartNameMap = {
    "radar": "Radar",
    "polar-area": "PolarArea",
    "pie": "Pie",
    "doughnut": "Doughnut",
    "line": "Line",
    "bar": "Bar"
  };
  var dataTransformers = {
    'doughnut': getCategoricalData,
    'pie': getCategoricalData,
    'polar-area': getCategoricalData,
    'radar': getSeriesData,
    'line': getSeriesData,
    'bar': getSeriesData
  };
  function getCategoricalData(){
    var self = this, result = [];
    each(self.dataset.selectColumn(0).slice(1), function(label, i){
      result.push({
        value: self.dataset.selectColumn(1).slice(1)[i],
        color: self.colors()[+i],
        hightlight: self.colors()[+i+9],
        label: label
      });
    });
    return result;
  }
  function getSeriesData(){
    var self = this,
        labels,
        result = {
          labels: [],
          datasets: []
        };
    labels = this.dataset.selectColumn(0).slice(1);
    each(labels, function(l,i){
      if (l instanceof Date) {
        result.labels.push((l.getMonth()+1) + "-" + l.getDate() + "-" + l.getFullYear());
      } else {
        result.labels.push(l);
      }
    })
    each(self.dataset.selectRow(0).slice(1), function(label, i){
      var hex = {
        r: hexToR(self.colors()[i]),
        g: hexToG(self.colors()[i]),
        b: hexToB(self.colors()[i])
      };
      result.datasets.push({
        label: label,
        fillColor    : "rgba(" + hex.r + "," + hex.g + "," + hex.b + ",0.2)",
        strokeColor  : "rgba(" + hex.r + "," + hex.g + "," + hex.b + ",1)",
        pointColor   : "rgba(" + hex.r + "," + hex.g + "," + hex.b + ",1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(" + hex.r + "," + hex.g + "," + hex.b + ",1)",
        data: self.dataset.selectColumn(+i+1).slice(1)
      });
    });
    return result;
  }
  var charts = {};
  each(["doughnut", "pie", "polar-area", "radar", "bar", "line"], function(type, index){
    charts[type] = {
      initialize: function(){
        if (this.el().nodeName.toLowerCase() !== "canvas") {
          var canvas = document.createElement('canvas');
          this.el().innerHTML = "";
          this.el().appendChild(canvas);
          this.view._artifacts["ctx"] = canvas.getContext("2d");
        } else {
          this.view._artifacts["ctx"] = this.el().getContext("2d");
        }
        return this;
      },
      render: function(){
        var method = ChartNameMap[type],
            opts = extend({}, this.chartOptions()),
            data = dataTransformers[type].call(this);
        if (this.view._artifacts["chartjs"]) {
          this.view._artifacts["chartjs"].destroy();
        }
        this.view._artifacts["chartjs"] = new Chart(this.view._artifacts["ctx"])[method](data, opts);
        return this;
      },
      destroy: function(){
        _selfDestruct.call(this);
      }
    };
  });
  function _selfDestruct(){
    if (this.view._artifacts["chartjs"]) {
      this.view._artifacts["chartjs"].destroy();
      this.view._artifacts["chartjs"] = null;
    }
  }
  function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
  function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
  function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
  function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
  Dataviz.register("chartjs", charts, { capabilities: dataTypes });
};
},{"../../core/utils/each":31,"../../core/utils/extend":32,"../dataviz":52}],50:[function(require,module,exports){
/*!
 * ----------------------
 * Google Charts Adapter
 * ----------------------
 */
/*
  TODO:
  [ ] Build a more robust DataTable transformer
  [ ] ^Expose date parser for google charts tooltips (#70)
  [ ] ^Allow custom tooltips (#147)
*/
var Dataviz = require("../dataviz"),
    each = require("../../core/utils/each"),
    extend = require("../../core/utils/extend"),
    Keen = require("../../core");
module.exports = function(){
  Keen.loaded = false;
  var errors = {
    "google-visualization-errors-0": "No results to visualize"
  };
  var chartTypes = ['AreaChart', 'BarChart', 'ColumnChart', 'LineChart', 'PieChart', 'Table'];
  var chartMap = {};
  var dataTypes = {
    'categorical':        ['piechart', 'barchart', 'columnchart', 'table'],
    'cat-interval':       ['columnchart', 'barchart', 'table'],
    'cat-ordinal':        ['barchart', 'columnchart', 'areachart', 'linechart', 'table'],
    'chronological':      ['areachart', 'linechart', 'table'],
    'cat-chronological':  ['linechart', 'columnchart', 'barchart', 'areachart'],
    'nominal':            ['table'],
    'extraction':         ['table']
  };
  each(chartTypes, function (type) {
    var name = type.toLowerCase();
    chartMap[name] = {
      initialize: function(){
      },
      render: function(){
        if(typeof google === "undefined") {
          this.error("The Google Charts library could not be loaded.");
          return;
        }
        var self = this;
        if (self.view._artifacts['googlechart']) {
          this.destroy();
        }
        self.view._artifacts['googlechart'] = self.view._artifacts['googlechart'] || new google.visualization[type](self.el());
        google.visualization.events.addListener(self.view._artifacts['googlechart'], 'error', function(stack){
          _handleErrors.call(self, stack);
        });
        this.update();
      },
      update: function(){
        var options = _getDefaultAttributes.call(this, type);
        extend(options, this.chartOptions(), this.attributes());
        this.view._artifacts['datatable'] = google.visualization.arrayToDataTable(this.data());
        if (this.view._artifacts['googlechart']) {
          this.view._artifacts['googlechart'].draw(this.view._artifacts['datatable'], options);
        }
      },
      destroy: function(){
        if (this.view._artifacts['googlechart']) {
          google.visualization.events.removeAllListeners(this.view._artifacts['googlechart']);
          this.view._artifacts['googlechart'].clearChart();
          this.view._artifacts['googlechart'] = null;
          this.view._artifacts['datatable'] = null;
        }
      }
    };
  });
  Dataviz.register('google', chartMap, {
    capabilities: dataTypes,
    dependencies: [{
      type: 'script',
      url: 'https://www.google.com/jsapi',
      cb: function(done) {
        if (typeof google === 'undefined'){
          this.trigger("error", "Problem loading Google Charts library. Please contact us!");
          done();
        }
        else {
          google.load('visualization', '1.1', {
              packages: ['corechart', 'table'],
              callback: function(){
                done();
              }
          });
        }
      }
    }]
  });
  function _handleErrors(stack){
    var message = errors[stack['id']] || stack['message'] || "An error occurred";
    this.error(message);
  }
  function _getDefaultAttributes(type){
    var output = {};
    switch (type.toLowerCase()) {
      case "areachart":
        output.lineWidth = 2;
        output.hAxis = {
          baselineColor: 'transparent',
          gridlines: { color: 'transparent' }
        };
        output.vAxis = {
          viewWindow: { min: 0 }
        };
        if (this.dataType() === "chronological") {
          output.legend = {
            position: "none"
          };
          output.chartArea = {
            width: "85%"
          };
        }
        break;
      case "barchart":
        output.hAxis = {
          viewWindow: { min: 0 }
        };
        output.vAxis = {
          baselineColor: 'transparent',
          gridlines: { color: 'transparent' }
        };
        if (this.dataType() === "chronological") {
          output.legend = {
            position: "none"
          };
        }
        break;
      case "columnchart":
        output.hAxis = {
          baselineColor: 'transparent',
          gridlines: { color: 'transparent' }
        };
        output.vAxis = {
          viewWindow: { min: 0 }
        };
        if (this.dataType() === "chronological") {
          output.legend = {
            position: "none"
          };
          output.chartArea = {
            width: "85%"
          };
        }
        break;
      case "linechart":
        output.lineWidth = 2;
        output.hAxis = {
          baselineColor: 'transparent',
          gridlines: { color: 'transparent' }
        };
        output.vAxis = {
          viewWindow: { min: 0 }
        };
        if (this.dataType() === "chronological") {
          output.legend = {
            position: "none"
          };
          output.chartArea = {
            width: "85%"
          };
        }
        break;
      case "piechart":
        output.sliceVisibilityThreshold = 0.01;
        break;
      case "table":
        break;
    }
    return output;
  }
};
},{"../../core":19,"../../core/utils/each":31,"../../core/utils/extend":32,"../dataviz":52}],51:[function(require,module,exports){
/*!
* ----------------------
* Keen IO Adapter
* ----------------------
*/
var Keen = require("../../core"),
    Dataviz = require("../dataviz");
var clone = require("../../core/utils/clone"),
    each = require("../../core/utils/each"),
    extend = require("../../core/utils/extend"),
    prettyNumber = require("../utils/prettyNumber");
module.exports = function(){
  var Metric, Error, Spinner;
  Keen.Error = {
    defaults: {
      backgroundColor : "",
      borderRadius    : "4px",
      color           : "#ccc",
      display         : "block",
      fontFamily      : "Helvetica Neue, Helvetica, Arial, sans-serif",
      fontSize        : "21px",
      fontWeight      : "light",
      textAlign       : "center"
    }
  };
  Keen.Spinner.defaults = {
    lines: 10,                   
    length: 8,                   
    width: 3,                    
    radius: 10,                  
    corners: 1,                  
    rotate: 0,                   
    direction: 1,                
    color: '#4d4d4d',            
    speed: 1.67,                 
    trail: 60,                   
    shadow: false,               
    hwaccel: false,              
    className: 'keen-spinner',   
    zIndex: 2e9,                 
    top: '50%',                  
    left: '50%'                  
  };
  var dataTypes = {
    'singular': ['metric']
  };
  Metric = {
    initialize: function(){
      var css = document.createElement("style"),
          bgDefault = "#49c5b1";
      css.id = "keen-widgets";
      css.type = "text/css";
      css.innerHTML = "\
  .keen-metric { \n  background: " + bgDefault + "; \n  border-radius: 4px; \n  color: #fff; \n  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; \n  padding: 10px 0; \n  text-align: center; \n} \
  .keen-metric-value { \n  display: block; \n  font-size: 84px; \n  font-weight: 700; \n  line-height: 84px; \n} \
  .keen-metric-title { \n  display: block; \n  font-size: 24px; \n  font-weight: 200; \n}";
      if (!document.getElementById(css.id)) {
        document.body.appendChild(css);
      }
    },
    render: function(){
      var bgColor = (this.colors().length == 1) ? this.colors()[0] : "#49c5b1",
          title = this.title() || "Result",
          value = this.data()[1][1] || 0,
          width = this.width(),
          opts = this.chartOptions() || {},
          prefix = "",
          suffix = "";
      var styles = {
        'width': (width) ? width + 'px' : 'auto'
      };
      var formattedNum = value;
      if ( typeof opts.prettyNumber === 'undefined' || opts.prettyNumber == true ) {
        if ( !isNaN(parseInt(value)) ) {
          formattedNum = prettyNumber(value);
        }
      }
      if (opts['prefix']) {
        prefix = '<span class="keen-metric-prefix">' + opts['prefix'] + '</span>';
      }
      if (opts['suffix']) {
        suffix = '<span class="keen-metric-suffix">' + opts['suffix'] + '</span>';
      }
      this.el().innerHTML = '' +
        '<div class="keen-widget keen-metric" style="background-color: ' + bgColor + '; width:' + styles.width + ';" title="' + value + '">' +
          '<span class="keen-metric-value">' + prefix + formattedNum + suffix + '</span>' +
          '<span class="keen-metric-title">' + title + '</span>' +
        '</div>';
    }
  };
  Error = {
    initialize: function(){},
    render: function(text, style){
      var err, msg;
      var defaultStyle = clone(Keen.Error.defaults);
      var currentStyle = extend(defaultStyle, style);
      err = document.createElement("div");
      err.className = "keen-error";
      each(currentStyle, function(value, key){
        err.style[key] = value;
      });
      err.style.height = String(this.height() + "px");
      err.style.paddingTop = (this.height() / 2 - 15) + "px";
      err.style.width = String(this.width() + "px");
      msg = document.createElement("span");
      msg.innerHTML = text || "Yikes! An error occurred!";
      err.appendChild(msg);
      this.el().innerHTML = "";
      this.el().appendChild(err);
    },
    destroy: function(){
      this.el().innerHTML = "";
    }
  };
  Spinner = {
    initialize: function(){},
    render: function(){
      var spinner = document.createElement("div");
      spinner.className = "keen-loading";
      spinner.style.height = String(this.height() + "px");
      spinner.style.position = "relative";
      spinner.style.width = String(this.width() + "px");
      this.el().innerHTML = "";
      this.el().appendChild(spinner);
      this.view._artifacts.spinner = new Keen.Spinner(Keen.Spinner.defaults).spin(spinner);
    },
    destroy: function(){
      this.view._artifacts.spinner.stop();
      this.view._artifacts.spinner = null;
    }
  };
  Keen.Dataviz.register('keen-io', {
    'metric': Metric,
    'error': Error,
    'spinner': Spinner
  }, {
    capabilities: dataTypes
  });
};
},{"../../core":19,"../../core/utils/clone":30,"../../core/utils/each":31,"../../core/utils/extend":32,"../dataviz":52,"../utils/prettyNumber":90}],52:[function(require,module,exports){
var clone = require("../core/utils/clone"),
    each = require("../core/utils/each"),
    extend = require("../core/utils/extend"),
    loadScript = require("./utils/loadScript"),
    loadStyle = require("./utils/loadStyle");
var Keen = require("../core");
var Emitter = require('../core/helpers/emitter-shim');
var Dataset = require("../dataset");
function Dataviz(){
  this.dataset = new Dataset();
  this.view = {
    _prepared: false,
    _initialized: false,
    _rendered: false,
    _artifacts: { /* state bin */ },
    adapter: {
      library: undefined,
      chartOptions: {},
      chartType: undefined,
      defaultChartType: undefined,
      dataType: undefined
    },
    attributes: clone(Dataviz.defaults),
    defaults: clone(Dataviz.defaults),
    el: undefined,
    loader: { library: "keen-io", chartType: "spinner" }
  };
  Dataviz.visuals.push(this);
};
extend(Dataviz, {
  dataTypeMap: {
    "singular":          { library: "keen-io", chartType: "metric"      },
    "categorical":       { library: "google",  chartType: "piechart"    },
    "cat-interval":      { library: "google",  chartType: "columnchart" },
    "cat-ordinal":       { library: "google",  chartType: "barchart"    },
    "chronological":     { library: "google",  chartType: "areachart"   },
    "cat-chronological": { library: "google",  chartType: "linechart"   },
    "extraction":        { library: "google",  chartType: "table"       }
  },
  defaults: {
    colors: [
    /* teal      red        yellow     purple     orange     mint       blue       green      lavender */
    "#00bbde", "#fe6672", "#eeb058", "#8a8ad6", "#ff855c", "#00cfbb", "#5a9eed", "#73d483", "#c879bb",
    "#0099b6", "#d74d58", "#cb9141", "#6b6bb6", "#d86945", "#00aa99", "#4281c9", "#57b566", "#ac5c9e",
    "#27cceb", "#ff818b", "#f6bf71", "#9b9be1", "#ff9b79", "#26dfcd", "#73aff4", "#87e096", "#d88bcb"
    ],
    indexBy: "timeframe.start"
  },
  dependencies: {
    loading: 0,
    loaded: 0,
    urls: {}
  },
  libraries: {},
  visuals: []
});
Emitter(Dataviz);
Emitter(Dataviz.prototype);
Dataviz.register = function(name, methods, config){
  var self = this;
  var loadHandler = function(st) {
    st.loaded++;
    if(st.loaded === st.loading) {
      Keen.loaded = true;
      Keen.trigger("ready");
    }
  };
  Dataviz.libraries[name] = Dataviz.libraries[name] || {};
  each(methods, function(method, key){
    Dataviz.libraries[name][key] = method;
  });
  if (config && config.capabilities) {
    Dataviz.libraries[name]._defaults = Dataviz.libraries[name]._defaults || {};
    each(config.capabilities, function(typeSet, key){
      Dataviz.libraries[name]._defaults[key] = typeSet;
    });
  }
  if (config && config.dependencies) {
    each(config.dependencies, function (dependency, index, collection) {
      var status = Dataviz.dependencies;
      if(!status.urls[dependency.url]) {
        status.urls[dependency.url] = true;
        status.loading++;
        var method = dependency.type === "script" ? loadScript : loadStyle;
        method(dependency.url, function() {
          if(dependency.cb) {
            dependency.cb.call(self, function() {
              loadHandler(status);
            });
          } else {
            loadHandler(status);
          }
        });
      }
    });
  }
};
Dataviz.find = function(target){
  if (!arguments.length) return Dataviz.visuals;
  var el = target.nodeName ? target : document.querySelector(target),
      match;
  each(Dataviz.visuals, function(visual){
    if (el == visual.el()){
      match = visual;
      return false;
    }
  });
  if (match) return match;
};
module.exports = Dataviz;
},{"../core":19,"../core/helpers/emitter-shim":11,"../core/utils/clone":30,"../core/utils/each":31,"../core/utils/extend":32,"../dataset":36,"./utils/loadScript":88,"./utils/loadStyle":89}],53:[function(require,module,exports){
var clone = require("../../core/utils/clone"),
    extend = require("../../core/utils/extend"),
    Dataviz = require("../dataviz"),
    Request = require("../../core/request");
module.exports = function(query, el, cfg) {
  var DEFAULTS = clone(Dataviz.defaults),
      visual = new Dataviz(),
      request = new Request(this, [query]),
      config = cfg ? clone(cfg) : {};
  if (config.chartType) {
    visual.chartType(config.chartType);
    delete config.chartType;
  }
  if (config.library) {
    visual.library(config.library);
    delete config.library;
  }
  if (config.chartOptions) {
    visual.chartOptions(config.chartOptions);
    delete config.chartOptions;
  }
  visual
    .attributes(extend(DEFAULTS, config))
    .el(el)
    .prepare();
  request.refresh();
  request.on("complete", function(){
    visual
      .parseRequest(this)
      .render();
  });
  request.on("error", function(res){
    visual.error(res.message);
  });
  return visual;
};
},{"../../core/request":28,"../../core/utils/clone":30,"../../core/utils/extend":32,"../dataviz":52}],54:[function(require,module,exports){
var Dataviz = require("../dataviz"),
    extend = require("../../core/utils/extend")
module.exports = function(){
  var map = extend({}, Dataviz.dataTypeMap),
      dataType = this.dataType(),
      library = this.library(),
      chartType = this.chartType() || this.defaultChartType();
  if (!library && map[dataType]) {
    library = map[dataType].library;
  }
  if (library && !chartType && dataType) {
    chartType = Dataviz.libraries[library]._defaults[dataType][0];
  }
  if (library && !chartType && map[dataType]) {
    chartType = map[dataType].chartType;
  }
  return (library && chartType) ? Dataviz.libraries[library][chartType] : {};
};
},{"../../core/utils/extend":32,"../dataviz":52}],55:[function(require,module,exports){
var each = require("../../core/utils/each"),
    Dataset = require("../../dataset");
module.exports = {
  "extraction": parseExtraction
};
function parseExtraction(req){
  var data = (req.data instanceof Array ? req.data[0] : req.data),
  names = req.queries[0].get("property_names") || [],
  schema = { records: "result", select: true };
  if (names) {
    schema.select = [];
    each(names, function(p){
      schema.select.push({ path: p });
    });
  }
  return new Dataset(data, schema);
}
},{"../../core/utils/each":31,"../../dataset":36}],56:[function(require,module,exports){
module.exports = function(req){
  var analysis = req.queries[0].analysis.replace("_", " "),
  collection = req.queries[0].get('event_collection'),
  output;
  output = analysis.replace( /\b./g, function(a){
    return a.toUpperCase();
  });
  if (collection) {
    output += ' - ' + collection;
  }
  return output;
};
},{}],57:[function(require,module,exports){
module.exports = function(query){
  var isInterval = typeof query.params.interval === "string",
  isGroupBy = typeof query.params.group_by === "string",
  is2xGroupBy = query.params.group_by instanceof Array,
  dataType;
  if (!isGroupBy && !isInterval) {
    dataType = 'singular';
  }
  if (isGroupBy && !isInterval) {
    dataType = 'categorical';
  }
  if (isInterval && !isGroupBy) {
    dataType = 'chronological';
  }
  if (isInterval && isGroupBy) {
    dataType = 'cat-chronological';
  }
  if (!isInterval && is2xGroupBy) {
    dataType = 'categorical';
  }
  if (isInterval && is2xGroupBy) {
    dataType = 'cat-chronological';
  }
  if (query.analysis === "funnel") {
    dataType = 'cat-ordinal';
  }
  if (query.analysis === "extraction") {
    dataType = 'extraction';
  }
  if (query.analysis === "select_unique") {
    dataType = 'nominal';
  }
  return dataType;
};
},{}],58:[function(require,module,exports){
var extend = require("../core/utils/extend"),
    Dataviz = require("./dataviz");
extend(Dataviz.prototype, {
  "adapter"          : require("./lib/adapter"),
  "attributes"       : require("./lib/attributes"),
  "call"             : require("./lib/call"),
  "chartOptions"     : require("./lib/chartOptions"),
  "chartType"        : require("./lib/chartType"),
  "colorMapping"     : require("./lib/colorMapping"),
  "colors"           : require("./lib/colors"),
  "data"             : require("./lib/data"),
  "dataType"         : require("./lib/dataType"),
  "defaultChartType" : require("./lib/defaultChartType"),
  "el"               : require("./lib/el"),
  "height"           : require("./lib/height"),
  "indexBy"          : require("./lib/indexBy"),
  "labelMapping"     : require("./lib/labelMapping"),
  "labels"           : require("./lib/labels"),
  "library"          : require("./lib/library"),
  "parseRawData"     : require("./lib/parseRawData"),
  "parseRequest"     : require("./lib/parseRequest"),
  "prepare"          : require("./lib/prepare"),
  "sortGroups"       : require("./lib/sortGroups"),
  "sortIntervals"    : require("./lib/sortIntervals"),
  "title"            : require("./lib/title"),
  "width"            : require("./lib/width")
});
extend(Dataviz.prototype, {
  "destroy"          : require("./lib/actions/destroy"),
  "error"            : require("./lib/actions/error"),
  "initialize"       : require("./lib/actions/initialize"),
  "render"           : require("./lib/actions/render"),
  "update"           : require("./lib/actions/update")
});
module.exports = Dataviz;
},{"../core/utils/extend":32,"./dataviz":52,"./lib/actions/destroy":59,"./lib/actions/error":60,"./lib/actions/initialize":61,"./lib/actions/render":62,"./lib/actions/update":63,"./lib/adapter":64,"./lib/attributes":65,"./lib/call":66,"./lib/chartOptions":67,"./lib/chartType":68,"./lib/colorMapping":69,"./lib/colors":70,"./lib/data":71,"./lib/dataType":72,"./lib/defaultChartType":73,"./lib/el":74,"./lib/height":75,"./lib/indexBy":76,"./lib/labelMapping":77,"./lib/labels":78,"./lib/library":79,"./lib/parseRawData":80,"./lib/parseRequest":81,"./lib/prepare":82,"./lib/sortGroups":83,"./lib/sortIntervals":84,"./lib/title":85,"./lib/width":86}],59:[function(require,module,exports){
var getAdapterActions = require("../../helpers/getAdapterActions");
module.exports = function(){
  var actions = getAdapterActions.call(this);
  if (actions.destroy) {
    actions.destroy.apply(this, arguments);
  }
  if (this.el()) {
    this.el().innerHTML = "";
  }
  this.view._prepared = false;
  this.view._initialized = false;
  this.view._rendered = false;
  this.view._artifacts = {};
  return this;
};
},{"../../helpers/getAdapterActions":54}],60:[function(require,module,exports){
var getAdapterActions = require("../../helpers/getAdapterActions"),
    Dataviz = require("../../dataviz");
module.exports = function(){
  var actions = getAdapterActions.call(this);
  if (actions['error']) {
    actions['error'].apply(this, arguments);
  } else {
    Dataviz.libraries['keen-io']['error'].render.apply(this, arguments);
  }
  return this;
};
},{"../../dataviz":52,"../../helpers/getAdapterActions":54}],61:[function(require,module,exports){
var getAdapterActions = require("../../helpers/getAdapterActions"),
    Dataviz = require("../../dataviz");
module.exports = function(){
  var actions = getAdapterActions.call(this);
  var loader = Dataviz.libraries[this.view.loader.library][this.view.loader.chartType];
  if (this.view._prepared) {
    if (loader.destroy) loader.destroy.apply(this, arguments);
  } else {
    if (this.el()) this.el().innerHTML = "";
  }
  if (actions.initialize) actions.initialize.apply(this, arguments);
  this.view._initialized = true;
  return this;
};
},{"../../dataviz":52,"../../helpers/getAdapterActions":54}],62:[function(require,module,exports){
var getAdapterActions = require("../../helpers/getAdapterActions"),
    applyTransforms = require("../../utils/applyTransforms");
module.exports = function(){
  var actions = getAdapterActions.call(this);
  applyTransforms.call(this);
  if (!this.view._initialized) {
    this.initialize();
  }
  if (this.el() && actions.render) {
    actions.render.apply(this, arguments);
    this.view._rendered = true;
  }
  return this;
};
},{"../../helpers/getAdapterActions":54,"../../utils/applyTransforms":87}],63:[function(require,module,exports){
var getAdapterActions = require("../../helpers/getAdapterActions"),
    applyTransforms = require("../../utils/applyTransforms");
module.exports = function(){
  var actions = getAdapterActions.call(this);
  applyTransforms.call(this);
  if (actions.update) {
    actions.update.apply(this, arguments);
  } else if (actions.render) {
    this.render();
  }
  return this;
};
},{"../../helpers/getAdapterActions":54,"../../utils/applyTransforms":87}],64:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = function(obj){
  if (!arguments.length) return this.view.adapter;
  var self = this;
  each(obj, function(prop, key){
    self.view.adapter[key] = (prop ? prop : null);
  });
  return this;
};
},{"../../core/utils/each":31}],65:[function(require,module,exports){
var each = require("../../core/utils/each");
var chartOptions = require("./chartOptions");
module.exports = function(obj){
  if (!arguments.length) return this.view["attributes"];
  var self = this;
  each(obj, function(prop, key){
    if (key === "chartOptions") {
      chartOptions.call(self, prop);
    } else {
      self.view["attributes"][key] = (prop ? prop : null);
    }
  });
  return this;
};
},{"../../core/utils/each":31,"./chartOptions":67}],66:[function(require,module,exports){
module.exports = function(fn){
  fn.call(this);
  return this;
};
},{}],67:[function(require,module,exports){
var extend = require('../../core/utils/extend');
module.exports = function(obj){
  if (!arguments.length) return this.view.adapter.chartOptions;
  extend(this.view.adapter.chartOptions, obj);
  return this;
};
},{"../../core/utils/extend":32}],68:[function(require,module,exports){
module.exports = function(str){
  if (!arguments.length) return this.view.adapter.chartType;
  this.view.adapter.chartType = (str ? String(str) : null);
  return this;
};
},{}],69:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = function(obj){
  if (!arguments.length) return this.view["attributes"].colorMapping;
  this.view["attributes"].colorMapping = (obj ? obj : null);
  colorMapping.call(this);
  return this;
};
function colorMapping(){
  var self = this,
  schema = this.dataset.schema,
  data = this.dataset.output(),
  colorSet = this.view.defaults.colors.slice(),
  colorMap = this.colorMapping(),
  dt = this.dataType() || "";
  if (colorMap) {
    if (dt.indexOf("chronological") > -1 || (schema.unpack && data[0].length > 2)) {
      each(data[0].slice(1), function(label, i){
        var color = colorMap[label];
        if (color && colorSet[i] !== color) {
          colorSet.splice(i, 0, color);
        }
      });
    }
    else {
      each(self.dataset.selectColumn(0).slice(1), function(label, i){
        var color = colorMap[label];
        if (color && colorSet[i] !== color) {
          colorSet.splice(i, 0, color);
        }
      });
    }
    self.view.attributes.colors = colorSet;
  }
}
},{"../../core/utils/each":31}],70:[function(require,module,exports){
module.exports = function(arr){
  if (!arguments.length) return this.view["attributes"].colors;
  this.view["attributes"].colors = (arr instanceof Array ? arr : null);
  this.view.defaults.colors = (arr instanceof Array ? arr : null);
  return this;
};
},{}],71:[function(require,module,exports){
var Dataset = require("../../dataset"),
    Request = require("../../core/request");
module.exports = function(data){
  if (!arguments.length) return this.dataset.output();
  if (data instanceof Dataset) {
    this.dataset = data;
  } else if (data instanceof Request) {
    this.parseRequest(data);
  } else {
    this.parseRawData(data);
  }
  return this;
};
},{"../../core/request":28,"../../dataset":36}],72:[function(require,module,exports){
module.exports = function(str){
  if (!arguments.length) return this.view.adapter.dataType;
  this.view.adapter.dataType = (str ? String(str) : null);
  return this;
};
},{}],73:[function(require,module,exports){
module.exports = function(str){
  if (!arguments.length) return this.view.adapter.defaultChartType;
  this.view.adapter.defaultChartType = (str ? String(str) : null);
  return this;
};
},{}],74:[function(require,module,exports){
module.exports = function(el){
  if (!arguments.length) return this.view.el;
  this.view.el = el;
  return this;
};
},{}],75:[function(require,module,exports){
module.exports = function(num){
  if (!arguments.length) return this.view["attributes"]["height"];
  this.view["attributes"]["height"] = (!isNaN(parseInt(num)) ? parseInt(num) : null);
  return this;
};
},{}],76:[function(require,module,exports){
var Dataset = require("../../dataset"),
    Dataviz = require("../dataviz"),
    each = require("../../core/utils/each");
module.exports = function(str){
  if (!arguments.length) return this.view["attributes"].indexBy;
  this.view["attributes"].indexBy = (str ? String(str) : Dataviz.defaults.indexBy);
  indexBy.call(this);
  return this;
};
function indexBy(){
  var self = this,
  root = this.dataset.meta.schema || this.dataset.meta.unpack,
  newOrder = this.indexBy().split(".").join(Dataset.defaults.delimeter);
  each(root, function(def, i){
    if (i === "select" && def instanceof Array) {
      each(def, function(c, j){
        if (c.path.indexOf("timeframe -> ") > -1) {
          self.dataset.meta.schema[i][j].path = newOrder;
        }
      });
    }
    else if (i === "unpack" && typeof def === "object") {
      self.dataset.meta.schema[i]['index'].path = newOrder;
    }
  });
  this.dataset.parse();
}
},{"../../core/utils/each":31,"../../dataset":36,"../dataviz":52}],77:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = function(obj){
  if (!arguments.length) return this.view["attributes"].labelMapping;
  this.view["attributes"].labelMapping = (obj ? obj : null);
  applyLabelMapping.call(this);
  return this;
};
function applyLabelMapping(){
  var self = this,
  labelMap = this.labelMapping(),
  schema = this.dataset.schema() || {},
  dt = this.dataType() || "";
  if (labelMap) {
    if (dt.indexOf("chronological") > -1 || (schema.unpack && self.dataset.output()[0].length > 2)) {
      each(self.dataset.output()[0], function(c, i){
        if (i > 0) {
          self.dataset.data.output[0][i] = labelMap[c] || c;
        }
      });
    }
    else if (schema.select && self.dataset.output()[0].length === 2) {
      self.dataset.updateColumn(0, function(c, i){
        return labelMap[c] || c;
      });
    }
  }
}
},{"../../core/utils/each":31}],78:[function(require,module,exports){
var each = require("../../core/utils/each");
module.exports = function(arr){
  if (!arguments.length) return this.view["attributes"].labels;
  this.view["attributes"].labels = (arr instanceof Array ? arr : null);
  labelReplacement.call(this);
  return this;
};
function labelReplacement(){
  var self = this,
  labelSet = this.labels() || null,
  schema = this.dataset.schema() || {},
  data = this.dataset.output(),
  dt = this.dataType() || "";
  if (labelSet) {
    if (dt.indexOf("chronological") > -1 || (schema.unpack && data[0].length > 2)) {
      each(data[0], function(cell,i){
        if (i > 0 && labelSet[i-1]) {
          self.dataset.data.output[0][i] = labelSet[i-1];
        }
      });
    } else {
      each(data, function(row,i){
        if (i > 0 && labelSet[i-1]) {
          self.dataset.data.output[i][0] = labelSet[i-1];
        }
      });
    }
  }
}
},{"../../core/utils/each":31}],79:[function(require,module,exports){
module.exports = function(str){
  if (!arguments.length) return this.view.adapter.library;
  this.view.adapter.library = (str ? String(str) : null);
  return this;
};
},{}],80:[function(require,module,exports){
var Dataviz = require("../dataviz"),
    Dataset = require("../../dataset");
module.exports = function(raw){
  this.dataset = parseRawData.call(this, raw);
  return this;
};
function parseRawData(response){
  var self = this,
      schema = {},
      indexBy,
      delimeter,
      indexTarget,
      labelSet,
      labelMap,
      dataType,
      dataset;
  indexBy = self.indexBy() ? self.indexBy() : Dataviz.defaults.indexBy;
  delimeter = Dataset.defaults.delimeter;
  indexTarget = indexBy.split(".").join(delimeter);
  labelSet = self.labels() || null;
  labelMap = self.labelMapping() || null;
  if (typeof response.result == "number"){
    dataType = "singular";
    schema = {
      records: "",
      select: [{
        path: "result",
        type: "string",
        label: "Metric"
      }]
    }
  }
  if (response.result instanceof Array && response.result.length > 0){
    if (response.result[0].timeframe && (typeof response.result[0].value == "number" || response.result[0].value == null)) {
      dataType = "chronological";
      schema = {
        records: "result",
        select: [
          {
            path: indexTarget,
            type: "date"
          },
          {
            path: "value",
            type: "number"
          }
        ]
      }
    }
    if (typeof response.result[0].result == "number"){
      dataType = "categorical";
      schema = {
        records: "result",
        select: []
      };
      for (var key in response.result[0]){
        if (response.result[0].hasOwnProperty(key) && key !== "result"){
          schema.select.push({
            path: key,
            type: "string"
          });
          break;
        }
      }
      schema.select.push({
        path: "result",
        type: "number"
      });
    }
    if (response.result[0].value instanceof Array){
      dataType = "cat-chronological";
      schema = {
        records: "result",
        unpack: {
          index: {
            path: indexTarget,
            type: "date"
          },
          value: {
            path: "value -> result",
            type: "number"
          }
        }
      }
      for (var key in response.result[0].value[0]){
        if (response.result[0].value[0].hasOwnProperty(key) && key !== "result"){
          schema.unpack.label = {
            path: "value -> " + key,
            type: "string"
          }
          break;
        }
      }
    }
    if (typeof response.result[0] == "number"){
      dataType = "cat-ordinal";
      schema = {
        records: "",
        unpack: {
          index: {
            path: "steps -> event_collection",
            type: "string"
          },
          value: {
            path: "result -> ",
            type: "number"
          }
        }
      }
    }
    if (dataType === void 0) {
      dataType = "extraction";
      schema = { records: "result", select: true };
    }
  }
  dataset = new Dataset(response, schema);
  self.labelMapping(self.labelMapping());
  self.labels(self.labels());
  self.dataType(dataType);
  return dataset;
}
},{"../../dataset":36,"../dataviz":52}],81:[function(require,module,exports){
var getDatasetSchemas = require("../helpers/getDatasetSchemas"),
    getDefaultTitle = require("../helpers/getDefaultTitle"),
    getQueryDataType = require("../helpers/getQueryDataType");
var Dataset = require("../../dataset"),
    parseRawData = require("./parseRawData");
module.exports = function(req){
  var dataType = getQueryDataType(req.queries[0]);
  if (dataType === "extraction") {
    this.dataset = getDatasetSchemas.extraction(req);
  }
  else {
    this.parseRawData(req.data instanceof Array ? req.data[0] : req.data);
  }
  this.dataType(dataType);
  this.view.defaults.title = getDefaultTitle.call(this, req);
  if (!this.title()) {
    this.title(this.view.defaults.title);
  }
  return this;
};
},{"../../dataset":36,"../helpers/getDatasetSchemas":55,"../helpers/getDefaultTitle":56,"../helpers/getQueryDataType":57,"./parseRawData":80}],82:[function(require,module,exports){
var Dataviz = require("../dataviz");
module.exports = function(){
  var loader;
  if (this.view._rendered) {
    this.destroy();
  }
  if (this.el()) {
    this.el().innerHTML = "";
    loader = Dataviz.libraries[this.view.loader.library][this.view.loader.chartType];
    if (loader.initialize) {
      loader.initialize.apply(this, arguments);
    }
    if (loader.render) {
      loader.render.apply(this, arguments);
    }
    this.view._prepared = true;
  }
  return this;
};
},{"../dataviz":52}],83:[function(require,module,exports){
module.exports = function(str){
  if (!arguments.length) return this.view["attributes"].sortGroups;
  this.view["attributes"].sortGroups = (str ? String(str) : null);
  runSortGroups.call(this);
  return this;
};
function runSortGroups(){
  var dt = this.dataType();
  if (!this.sortGroups()) return;
  if ((dt && dt.indexOf("chronological") > -1) || this.data()[0].length > 2) {
    this.dataset.sortColumns(this.sortGroups(), this.dataset.getColumnSum);
  }
  else if (dt && (dt.indexOf("cat-") > -1 || dt.indexOf("categorical") > -1)) {
    this.dataset.sortRows(this.sortGroups(), this.dataset.getRowSum);
  }
  return;
}
},{}],84:[function(require,module,exports){
module.exports = function(str){
  if (!arguments.length) return this.view["attributes"].sortIntervals;
  this.view["attributes"].sortIntervals = (str ? String(str) : null);
  runSortIntervals.call(this);
  return this;
};
function runSortIntervals(){
  if (!this.sortIntervals()) return;
  this.dataset.sortRows(this.sortIntervals());
  return;
}
},{}],85:[function(require,module,exports){
module.exports = function(str){
  if (!arguments.length) return this.view["attributes"]["title"];
  this.view["attributes"]["title"] = (str ? String(str) : null);
  return this;
};
},{}],86:[function(require,module,exports){
module.exports = function(num){
  if (!arguments.length) return this.view["attributes"]["width"];
  this.view["attributes"]["width"] = (!isNaN(parseInt(num)) ? parseInt(num) : null);
  return this;
};
},{}],87:[function(require,module,exports){
module.exports = function(){
  this
    .labelMapping(this.labelMapping())
    .labels(this.labels())
    .sortGroups(this.sortGroups())
    .sortIntervals(this.sortIntervals());
};
},{}],88:[function(require,module,exports){
module.exports = function(url, cb) {
  var doc = document;
  var handler;
  var head = doc.head || doc.getElementsByTagName("head");
  setTimeout(function () {
    if ('item' in head) {
      if (!head[0]) {
        setTimeout(arguments.callee, 25);
        return;
      }
      head = head[0];
    }
    var script = doc.createElement("script"),
    scriptdone = false;
    script.onload = script.onreadystatechange = function () {
      if ((script.readyState && script.readyState !== "complete" && script.readyState !== "loaded") || scriptdone) {
        return false;
      }
      script.onload = script.onreadystatechange = null;
      scriptdone = true;
      cb();
    };
    script.src = url;
    head.insertBefore(script, head.firstChild);
  }, 0);
  if (doc.readyState === null && doc.addEventListener) {
    doc.readyState = "loading";
    doc.addEventListener("DOMContentLoaded", handler = function () {
      doc.removeEventListener("DOMContentLoaded", handler, false);
      doc.readyState = "complete";
    }, false);
  }
};
},{}],89:[function(require,module,exports){
module.exports = function(url, cb) {
  var link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.type = 'text/css';
  link.href = url;
  cb();
  document.head.appendChild(link);
};
},{}],90:[function(require,module,exports){
module.exports = function(_input) {
  var input = Number(_input),
      sciNo = input.toPrecision(3),
      prefix = "",
      suffixes = ["", "k", "M", "B", "T"];
  if (Number(sciNo) == input && String(input).length <= 4) {
    return String(input);
  }
  if(input >= 1 || input <= -1) {
    if(input < 0){
      input = -input;
      prefix = "-";
    }
    return prefix + recurse(input, 0);
  } else {
    return input.toPrecision(3);
  }
  function recurse(input, iteration) {
    var input = String(input);
    var split = input.split(".");
    if(split.length > 1) {
      input = split[0];
      var rhs = split[1];
      if (input.length == 2 && rhs.length > 0) {
        if (rhs.length > 0) {
          input = input + "." + rhs.charAt(0);
        }
        else {
          input += "0";
        }
      }
      else if (input.length == 1 && rhs.length > 0) {
        input = input + "." + rhs.charAt(0);
        if(rhs.length > 1) {
          input += rhs.charAt(1);
        }
        else {
          input += "0";
        }
      }
    }
    var numNumerals = input.length;
    if (input.split(".").length > 1) {
      numNumerals--;
    }
    if(numNumerals <= 3) {
      return String(input) + suffixes[iteration];
    }
    else {
      return recurse(Number(input) / 1000, iteration + 1);
    }
  }
};
},{}],91:[function(require,module,exports){
(function (global){
;(function (f) {
  if (typeof define === "function" && define.amd) {
    define("keen", [], function(){ return f(); });
  }
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  }
  var g = null;
  if (typeof window !== "undefined") {
    g = window;
  } else if (typeof global !== "undefined") {
    g = global;
  } else if (typeof self !== "undefined") {
    g = self;
  }
  if (g) {
    g.Keen = f();
  }
})(function() {
  "use strict";
  var Keen = require("./core"),
      extend = require("./core/utils/extend");
  extend(Keen.prototype, {
    "addEvent"            : require("./core/lib/addEvent"),
    "addEvents"           : require("./core/lib/addEvents"),
    "setGlobalProperties" : require("./core/lib/setGlobalProperties"),
    "trackExternalLink"   : require("./core/lib/trackExternalLink"),
    "get"                 : require("./core/lib/get"),
    "post"                : require("./core/lib/post"),
    "put"                 : require("./core/lib/post"),
    "run"                 : require("./core/lib/run"),
    "draw"                : require("./dataviz/extensions/draw")
  });
  Keen.Query = require("./core/query");
  Keen.Request = require("./core/request");
  Keen.Dataset = require("./dataset");
  Keen.Dataviz = require("./dataviz");
  Keen.Base64 = require("./core/utils/base64");
  Keen.Spinner = require("spin.js");
  Keen.utils = {
    "domready"     : require("domready"),
    "each"         : require("./core/utils/each"),
    "extend"       : extend,
    "parseParams"  : require("./core/utils/parseParams"),
    "prettyNumber" : require("./dataviz/utils/prettyNumber")
  };
  require("./dataviz/adapters/keen-io")();
  require("./dataviz/adapters/google")();
  require("./dataviz/adapters/c3")();
  require("./dataviz/adapters/chartjs")();
  if (Keen.loaded) {
    setTimeout(function(){
      Keen.utils.domready(function(){
        Keen.emit("ready");
      });
    }, 0);
  }
  require("./core/async")();
  module.exports = Keen;
  return Keen;
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./core":19,"./core/async":10,"./core/lib/addEvent":20,"./core/lib/addEvents":21,"./core/lib/get":22,"./core/lib/post":23,"./core/lib/run":24,"./core/lib/setGlobalProperties":25,"./core/lib/trackExternalLink":26,"./core/query":27,"./core/request":28,"./core/utils/base64":29,"./core/utils/each":31,"./core/utils/extend":32,"./core/utils/parseParams":33,"./dataset":36,"./dataviz":58,"./dataviz/adapters/c3":48,"./dataviz/adapters/chartjs":49,"./dataviz/adapters/google":50,"./dataviz/adapters/keen-io":51,"./dataviz/extensions/draw":53,"./dataviz/utils/prettyNumber":90,"domready":5,"spin.js":6}]},{},[91]);
